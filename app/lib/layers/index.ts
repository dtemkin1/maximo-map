import type { RasterSourceSpecification } from "react-map-gl/maplibre";

export const metroEocBoundaryLayer: RasterSourceSpecification = {
	type: "raster",
	tiles: [
		"https://wmatagis.wmata.com/wmatagis/rest/services/MTPD/EOC_BOUNDARIES_WMS/MapServer/export?transparent=true&format=png32&layers=show%3A8%2C9&bbox={bbox-epsg-3857}&bboxSR=102100&imageSR=102100&f=image",
	],
	tileSize: 400,
};

export const metroEocAssetLayer: RasterSourceSpecification = {
	type: "raster",
	tiles: [
		"https://wmatagis.wmata.com/wmatagis/rest/services/MTPD/EOC_ASSETS_WMS/MapServer/export?transparent=true&format=png32&layers=show&bbox={bbox-epsg-3857}&bboxSR=102100&imageSR=102100&f=image",
	],
	tileSize: 400,
};

export const metroLiveBaseMap: RasterSourceSpecification = {
	type: "raster",
	tiles: [
		"https://wmatagis.wmata.com/wmatagis/rest/services/Public/MetroLive_BaseMap/MapServer/export?transparent=true&format=png32&layers=show%3A1&bbox={bbox-epsg-3857}&bboxSR=102100&imageSR=102100&f=image",
	],
	tileSize: 400,
};

// export const DEPARTMENTS = {
// 	AFCS: `"AFCS"`,
// 	ATCS: `"ATCS"`,
// 	BMNT: `"BMNT"`,
// 	BPLN: `"BPLN"`,
// 	CMNT: `"CMNT"`,
// 	COMM: `"COMM"`,
// 	CTEM: `"CTEM"`,
// 	ELES: `"ELES"`,
// 	ITNC: `"ITNC"`,
// 	MTPD: `"MTPD"`,
// 	PLNT: `"PLNT"`,
// 	POWR: `"POWR"`,
// 	SAFE: `"SAFE"`,
// 	SAMS: `"SAMS"`,
// 	SVMT: `"SVMT"`,
// 	TRST: `"TRST"`,
// };

export const DEPARTMENTS = {
	POWR: `ASSETNUM="POWR%"`,
	MACS: `ASSETNUM="MA%"`,
	SVMT: `ASSETNUM="SV%"`,
	BMNT: `ASSETNUM="B____%"`,
	CMNT: `ASSETNUM="R____%"`,
	CTEM: `WT_MAINT_OFFICE="%CTEM%"`,
};
