import { Box, Center, Flex, IconButton, Text } from "@chakra-ui/react";
import { LuChevronRight as ChevronRightIcon } from "react-icons/lu";

interface Props {
	onShowSidebar: () => void;
	showSidebarButton?: boolean;
}

const Header = ({ showSidebarButton = true, onShowSidebar }: Props) => {
	return (
		<Flex
			bg="bg.emphasized"
			p={4}
			color="fg"
			justifyContent="center"
			w={"100%"}
		>
			<Box flex="0">
				{showSidebarButton && (
					<IconButton
						colorScheme="blackAlpha"
						variant="outline"
						onClick={onShowSidebar}
					>
						<ChevronRightIcon />
					</IconButton>
				)}
			</Box>
			<Center flex="1" h="40px">
				<Text fontSize="xl">WMATA MAXIMO Asset Health Map</Text>
			</Center>
			<Box flex="0" />
		</Flex>
	);
};

export default Header;
