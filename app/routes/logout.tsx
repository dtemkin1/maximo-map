import { Button, Card, VStack } from "@chakra-ui/react";
import { Form, Link, redirect } from "react-router";
import { destroySession, getSession } from "../sessions.server";
import type { Route } from "./+types/logout";

export async function action({ request }: Route.ActionArgs) {
	const session = await getSession(request.headers.get("Cookie"));
	return redirect("/login", {
		headers: {
			"Set-Cookie": await destroySession(session),
		},
	});
}

export default function LogoutRoute() {
	return (
		<>
			<VStack height="100%" justifyContent="center" alignItems="center">
				<Form method="post">
					<Card.Root>
						<Card.Header>
							<Card.Title>Log Out</Card.Title>
							<Card.Description>
								Are you sure you want to log out?
							</Card.Description>
						</Card.Header>
						<Card.Body justifyContent="flex-end">
							<VStack gap="4" w="full">
								<Button variant="solid" type="submit" width="full">
									Logout
								</Button>
								<Button variant="outline" asChild width="full">
									<Link to="/">Never mind</Link>
								</Button>
							</VStack>
						</Card.Body>
					</Card.Root>
				</Form>
			</VStack>
		</>
	);
}
