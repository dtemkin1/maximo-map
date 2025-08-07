import proj4 from "proj4";
import { redirect } from "react-router";
import { LocationHierarchyMxLoaderMXLLOCATIONApiFactory } from "~/lib/maximo";
import { getSession } from "~/sessions.server";
import type { Route } from "./+types/api.locations.$maximoCode";

const BASE_URL = [
	"https://wmatagis.wmata.com/wmatagis/rest/services/MTPD/EOC_ASSETS_WMS/MapServer",
	"https://wmatagis.wmata.com/wmatagis/rest/services/MTPD/EOC_BOUNDARIES_WMS/MapServer",
];

const WEB_MERCATOR =
	"+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs";
const WGS84 =
	"+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees";

// https://gist.github.com/seyuf/ab9c980776e4c2cb350a2d1e70976517
function area(ring: [number, number][]) {
	var s = 0.0;
	for (let i = 0; i < ring.length - 1; i++) {
		s += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
	}
	return 0.5 * s;
}

function centroid(ring: [number, number][]) {
	var c = [0, 0];
	for (let i = 0; i < ring.length - 1; i++) {
		c[0] +=
			(ring[i][0] + ring[i + 1][0]) *
			(ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]);
		c[1] +=
			(ring[i][1] + ring[i + 1][1]) *
			(ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]);
	}
	var a = area(ring);
	c[0] /= a * 6;
	c[1] /= a * 6;
	return c;
}

async function lookForLayer(
	maximoCode: string,
): Promise<[string, [number, number]] | null> {
	for (const url of BASE_URL) {
		const layers = await fetch(`${url}/layers?f=json`).then((res) =>
			res.json(),
		);

		// check what layers have either a MAXIMO_LOCATION or MAXIMO_CODE field
		const matchingLayers = layers.layers.filter((layer: unknown) => {
			if (
				!(
					typeof layer === "object" &&
					layer &&
					"fields" in layer &&
					layer.fields &&
					Array.isArray(layer.fields)
				)
			)
				return false;
			return layer.fields.some(
				(field: unknown) =>
					typeof field === "object" &&
					field &&
					"name" in field &&
					field.name === "MAXIMO_CODE",
			);
		});

		// go through each layer and get the features that match the maximoCode, web mercator
		for (const layer of matchingLayers) {
			const features = await fetch(
				`${url}/${layer.id}/query?where=MAXIMO_CODE='${maximoCode}'&f=json&outSR=102113`,
			).then((res) => res.json());

			if (features.features.length > 0) {
				const name =
					features.features[0].attributes.FACILITY_NAME ||
					`Unknown Location ${maximoCode}`;
				if (features.features[0].geometry.coordinates) {
					const [long, lat] = features.features[0].geometry.coordinates;
					const newCoord = proj4(WEB_MERCATOR, WGS84, [long, lat]) as [
						number,
						number,
					];

					return [name, newCoord];
				}

				if (features.features[0].geometry.rings) {
					// If the geometry is a polygon, we can return the centroid
					const coordinates = features.features[0].geometry.rings[0];
					const [long, lat] = centroid(coordinates);
					const newCoord = proj4(WEB_MERCATOR, WGS84, [long, lat]) as [
						number,
						number,
					];
					return [name, newCoord];
				}
			}
		}
	}

	return null; // No matching layer found
}

async function lookForParentLayer(maximoCode: string) {
	try {
		const locationHierarchy = LocationHierarchyMxLoaderMXLLOCATIONApiFactory(
			undefined,
			undefined,
			"https://maximo.wmata.com/maximo/api",
		).osMxlLocationIdGet(
			maximoCode,
			1,
			undefined,
			undefined,
			undefined,
			"application/json",
			import.meta.env.VITE_MAXIMO_API_KEY,
		);
		const locationData = await locationHierarchy;

		if (locationData.lochierarchy?.[0].parent) {
			return locationData.lochierarchy[0].parent;
		}

		return null; // No parent found
	} catch (error) {
		console.error("Error fetching location data:", error);
		return null;
	}
}

export async function loader({ params, request }: Route.LoaderArgs) {
	const { maximoCode } = params;

	const session = await getSession(request.headers.get("Cookie"));

	if (!session.has("api_key")) {
		// Redirect to the login page if they are not signed in.
		return redirect("/login");
	}

	const result = await lookForLayer(maximoCode);
	if (result !== null) {
		return result;
	}

	// if no features were found, check if location has a parent
	const locationsChecked = new Set<string>();
	locationsChecked.add(maximoCode);
	let parentMaximoCode = await lookForParentLayer(maximoCode);

	while (parentMaximoCode && locationsChecked.has(parentMaximoCode) === false) {
		const parentResult = await lookForLayer(parentMaximoCode);
		if (parentResult) {
			return parentResult;
		}

		// if no features were found, check the parent of the parent
		locationsChecked.add(parentMaximoCode);
		parentMaximoCode = await lookForParentLayer(parentMaximoCode);
	}

	return null;
}
