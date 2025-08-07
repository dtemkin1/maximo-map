"use client";

import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode";

const system = createSystem(defaultConfig, {
	theme: {
		tokens: {
			fonts: {
				heading: { value: `Helvetica Neue, Arial, Helvetica, sans-serif` },
				body: { value: `Helvetica Neue, Arial, Helvetica, sans-serif` },
			},
		},
	},
});

export function Provider(props: ColorModeProviderProps) {
	return (
		<ChakraProvider value={system}>
			<ColorModeProvider {...props} />
		</ChakraProvider>
	);
}
