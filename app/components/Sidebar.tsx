import { Box, Drawer } from "@chakra-ui/react";
import type { ReactElement } from "react";

interface Props {
	onClose: () => void;
	isOpen: boolean;
	variant?: "drawer" | "sidebar";
	sidebarTitle?: string;
	children?: ReactElement;
}

const Sidebar = ({
	isOpen,
	variant,
	onClose,
	sidebarTitle,
	children,
}: Props) => {
	return variant === "sidebar" ? (
		<Box position="fixed" left={0} p={5} w={60} top={0} h="100%">
			{children}
		</Box>
	) : (
		<Drawer.Root open={isOpen} placement="start" onOpenChange={onClose}>
			<Drawer.Positioner>
				<Drawer.Content>
					<Drawer.CloseTrigger />
					{sidebarTitle && (
						<Drawer.Header>
							<Drawer.Title>{sidebarTitle}</Drawer.Title>
						</Drawer.Header>
					)}
					<Drawer.Body>{children}</Drawer.Body>
				</Drawer.Content>
			</Drawer.Positioner>
		</Drawer.Root>
	);
};

export default Sidebar;
