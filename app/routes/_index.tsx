import {
	Avatar,
	Box,
	createListCollection,
	Flex,
	FormatNumber,
	HStack,
	List,
	Portal,
	Select,
	Spacer,
	Spinner,
	Stack,
	Text,
	useBreakpointValue,
	VStack,
} from "@chakra-ui/react";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import type { DeckProps } from "@deck.gl/core";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
	Layer,
	Map as MapComponent,
	NavigationControl,
	Source,
	useControl,
} from "react-map-gl/maplibre";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

import {
	type COLLECTIONMXAPIASSET,
	SystemWhoamiApiFactory,
} from "../lib/maximo";

import type { Route } from "./+types/_index";

import "maplibre-gl/dist/maplibre-gl.css"; // See notes below

import {
	DEPARTMENTS,
	metroEocAssetLayer,
	metroEocBoundaryLayer,
	metroLiveBaseMap,
} from "~/lib/layers";
import { useColorMode } from "../components/ui/color-mode";

const smVariant = { navigation: "drawer", navigationButton: true } as const;
const mdVariant = { navigation: "sidebar", navigationButton: false } as const;

export async function loader() {
	const whoAmI = SystemWhoamiApiFactory(
		undefined,
		undefined,
		"https://maximo.wmata.com/maximo/api",
	).whoamiGet(
		1,
		undefined,
		undefined,
		"application/json",
		import.meta.env.VITE_MAXIMO_API_KEY,
	);

	return Promise.all([whoAmI.then((response) => response.json())]);
}

try {
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
} catch {}

function DeckGLOverlay(props: DeckProps) {
	const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
	overlay.setProps(props);
	return null;
}

export default function App({ loaderData }: Route.ComponentProps) {
	const [isSidebarOpen, setSidebarOpen] = useState(false);
	const variants = useBreakpointValue({ base: smVariant, md: mdVariant });
	const { colorMode } = useColorMode();
	const [department, setDepartment] = useState<(keyof typeof DEPARTMENTS)[]>(
		[],
	);
	const [assets, setAssets] = useState<
		(COLLECTIONMXAPIASSET & { location: string })[]
	>([]);
	const [assetLocations, setAssetLocations] = useState<
		Map<string, [string, [number, number]] | null>
	>(new Map());

	const [loading, setLoading] = useState(false);
	const [loadingLocations, setLoadingLocations] = useState(false);

	const [user] = loaderData;

	const departmentCollection = createListCollection({
		items: Object.keys(DEPARTMENTS).map((department) => ({
			value: department,
			label: department,
		})),
	});
	const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

	useEffect(() => {
		setLoading(true);
		setAssets([]);

		Promise.all(department.map((dep) => fetch(`/api/assets/${dep}`)))
			.then((response) => Promise.all(response.map((res) => res.json())))
			.then((data) => {
				setAssets(data.flatMap((item) => item.member));
				setLoading(false);
			});
	}, [department]);

	useEffect(() => {
		if (assets.length > 0) {
			setLoadingLocations(true);
			const uniqueLocations = new Set<string>(
				assets
					.map((asset) => asset.location)
					.filter(
						(loc) =>
							loc !== null &&
							loc !== undefined &&
							assetLocations.get(loc) === undefined,
					),
			);
			const promises = Array.from(uniqueLocations).map((location) =>
				fetch(`/api/locations/${location}`)
					.then((response) => response.json())
					.then((data) => {
						if (data && data.length > 0) {
							return [location, data] as [string, [string, [number, number]]];
						} else {
							return [location, null] as [string, null];
						}
					}),
			);

			if (promises.length === 0) {
				setLoadingLocations(false);
			}

			const chunkSize = 25;
			for (let i = 0; i < promises.length; i += chunkSize) {
				const chunk = promises.slice(i, i + chunkSize);
				Promise.all(chunk)
					.then((results) => {
						results.forEach(([location, coords]) => {
							setAssetLocations(
								(prevMap) => new Map(prevMap.set(location, coords)),
							);
						});
					})
					.then(() => {
						setLoadingLocations(false);
					});
			}
		} else {
			setLoadingLocations(false);
		}
	}, [assets, assetLocations.get]);

	const heatmapData = useMemo(
		() =>
			new HeatmapLayer({
				id: "heatmap",
				aggregation: "SUM",
				data: assets.filter((asset) => assetLocations.get(asset.location)),
				getPosition: (d) => assetLocations.get(d.location)?.[1] || [0.0, 0.0],
				getWeight: () => 1, //(assetLocations.get(d.location) ? 1 : 0),
				radiusPixels: 50,
				srs: "EPSG:3857",
			}),
		[assets, assetLocations],
	);

	return (
		<>
			<title>WMATA MAXIMO Asset Health Map</title>
			<meta name="description" content="tbd! :3"></meta>
			<Sidebar
				variant={variants?.navigation}
				isOpen={isSidebarOpen}
				onClose={toggleSidebar}
			>
				<Flex
					h="100%"
					w="100%"
					flexDirection="column"
					gap="4"
					justifyContent={"flex-end"}
				>
					{loadingLocations ? <Spinner size="sm" /> : null}
					{!loading &&
						assets.length > 0 &&
						assetLocations &&
						assetLocations.size > 0 && (
							<Box textStyle="sm" alignSelf={"flex-start"} overflowY={"auto"}>
								<Text>Assets found at: </Text>
								<List.Root as="ul" listStylePosition="inside">
									{Array.from(assetLocations.entries())
										.filter(
											([key, val]) =>
												val !== null &&
												assets.filter((asset) => asset.location === key)
													.length > 0,
										)
										.map(
											([key, val]: [
												string,
												[string, [number, number]] | null,
											]) => (
												<List.Item
													key={key}
												>{`${val ? val[0] : key} (${assets.filter((asset) => asset.location === key).length})`}</List.Item>
											),
										)}
								</List.Root>
							</Box>
						)}
					<Spacer />
					{loading && (
						<Text color="fg.muted" textStyle="sm">
							Loading assets...
						</Text>
					)}
					{!loading && (
						<Text color="fg.muted" textStyle="sm">
							<FormatNumber value={assets.length} /> assets found
						</Text>
					)}
					<Select.Root
						multiple
						collection={departmentCollection}
						width="100%"
						value={department}
						onValueChange={(e) =>
							setDepartment(e.value as (keyof typeof DEPARTMENTS)[])
						}
					>
						<Select.HiddenSelect />
						<Select.Label>Department Assets</Select.Label>
						<Select.Control>
							<Select.Trigger>
								<Select.ValueText placeholder="Select department" />
							</Select.Trigger>
							<Select.IndicatorGroup>
								<Select.ClearTrigger />
								<Select.Indicator />
							</Select.IndicatorGroup>
						</Select.Control>
						<Portal>
							<Select.Positioner>
								<Select.Content>
									{departmentCollection.items.map((dep) => (
										<Select.Item item={dep} key={dep.value}>
											{dep.label}
											<Select.ItemIndicator />
										</Select.Item>
									))}
								</Select.Content>
							</Select.Positioner>
						</Portal>
					</Select.Root>
					<Suspense>
						{" "}
						<HStack key={user.primaryemail} gap="4" alignSelf={"flex-end"}>
							<Avatar.Root>
								<Avatar.Fallback name={user.displayName} />
								{/* <Avatar.Image src={""} /> */}
							</Avatar.Root>
							<Stack gap="0">
								<Text fontWeight="medium">{user.displayName}</Text>
								<Text color="fg.muted" textStyle="sm">
									{user.primaryemail}
								</Text>
							</Stack>
						</HStack>
					</Suspense>
				</Flex>
			</Sidebar>
			<VStack ml={!variants?.navigationButton ? 60 : 0} h="100%" gap={0}>
				<Header
					showSidebarButton={variants?.navigationButton}
					onShowSidebar={toggleSidebar}
				/>
				<MapComponent
					initialViewState={{
						longitude: -77.03637,
						latitude: 38.89511,
						zoom: 9,
					}}
					style={{ width: "100%", height: "100%" }}
					mapStyle={
						colorMode === "light"
							? "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
							: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
					}
					projection={"mercator"}
				>
					<NavigationControl />
					<Suspense>
						<Source {...metroLiveBaseMap}>
							<Layer type="raster"></Layer>
						</Source>
						<Source {...metroEocBoundaryLayer}>
							<Layer type="raster"></Layer>
						</Source>
						<Source {...metroEocAssetLayer}>
							<Layer type="raster"></Layer>
						</Source>
					</Suspense>
					<DeckGLOverlay layers={[heatmapData]} />
				</MapComponent>
			</VStack>
		</>
	);
}
