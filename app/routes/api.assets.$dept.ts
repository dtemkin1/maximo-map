import { redirect } from "react-router";
import { DEPARTMENTS } from "~/lib/layers";
import { getSession } from "~/sessions.server";
import { MaximoAPIForAssetMXAPIASSETApiFactory } from "../lib/maximo";
import type { Route } from "./+types/api.assets.$dept";

export async function loader({ params, request }: Route.LoaderArgs) {
	const { dept } = params;
	const session = await getSession(request.headers.get("Cookie"));

	if (!session.has("api_key")) {
		// Redirect to the login page if they are not signed in.
		return redirect("/login");
	}

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
			session.get("api_key"),
		);
		return await assetData;
	} catch (error) {
		console.error("Error fetching asset data:", error);
		return { member: [], error: "Failed to fetch asset data" };
	}
}
