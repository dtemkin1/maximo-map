import { DEPARTMENTS } from "~/lib/layers";
import { MaximoAPIForAssetMXAPIASSETApiFactory } from "../lib/maximo";
import type { Route } from "./+types/api.assets.$dept";

export async function loader({ params }: Route.LoaderArgs) {
	const { dept } = params;

	if (!(dept in DEPARTMENTS)) {
		throw new Response("Department not found", { status: 404 });
	}

	const whereClause = `STATUS!="DECOMMISSIONED" AND ${DEPARTMENTS[dept as keyof typeof DEPARTMENTS]} AND SITEID="MMMS" AND PARENT!="*"`; // WHERE

	try {
		const assetData = MaximoAPIForAssetMXAPIASSETApiFactory(
			undefined,
			undefined,
			"https://maximo.wmata.com/maximo/api",
		).osMxapiassetGet(
			1,
			undefined,
			undefined,
			whereClause, // WHERE
			"ASSETNUM,LOCATION", // SELECT
			undefined,
			undefined, // PAGE SIZE
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			"application/json",
			undefined,
			undefined,
			undefined,
			import.meta.env.VITE_MAXIMO_API_KEY,
		);
		return await assetData;
	} catch (error) {
		console.error("Error fetching asset data:", error);
		return { member: [], error: "Failed to fetch asset data" };
	}
}
