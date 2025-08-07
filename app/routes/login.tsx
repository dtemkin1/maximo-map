import {
	Button,
	Card,
	Field,
	Input,
	Stack,
	Text,
	VStack,
} from "@chakra-ui/react";
import makeFetchCookie from "fetch-cookie";
import { data, Form, redirect } from "react-router";
import { commitSession, getSession } from "../sessions.server";
import type { Route } from "./+types/login";

export async function loader({ request }: Route.LoaderArgs) {
	const session = await getSession(request.headers.get("Cookie"));

	if (session.has("api_key")) {
		// Redirect to the home page if they are already signed in.
		return redirect("/");
	}

	return data(
		{ error: session.get("error") },
		{
			headers: {
				"Set-Cookie": await commitSession(session),
			},
		},
	);
}

async function validateCredentials(
	username: string | null,
	password: string | null,
): Promise<string | null> {
	if (!username || !password) {
		return null;
	}
	try {
		const fetchCookie = makeFetchCookie(fetch);

		const log_in_headers = {
			"Content-type": "application/x-www-form-urlencoded",
			Accept: "text/html,application/xhtml+xml,application/xml",
			Connection: "keep-alive",
		};

		const body_login = new URLSearchParams();
		body_login.set("j_username", username);
		body_login.set("j_password", password);

		const response = await fetchCookie(
			"https://maximo.wmata.com/maximo/j_security_check",
			{
				method: "POST",
				headers: log_in_headers,
				body: body_login.toString(),
			},
		);

		if (!response.ok) {
			return null;
		}

		const body_api_key = { expiration: -1 }; // -1 means no expiration
		const api_key_response = await fetchCookie(
			"https://maximo.wmata.com/maximo/oslc/apitoken/create",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify(body_api_key),
			},
		);

		if (!api_key_response.ok) {
			return null;
		}

		const data = await api_key_response.json();
		return data.apikey || null;
	} catch (error) {
		console.error("Error validating credentials:", error);
		return null;
	}
}

export async function action({ request }: Route.ActionArgs) {
	const session = await getSession(request.headers.get("Cookie"));
	const form = await request.formData();
	const username = form.get("username") as string | null;
	const password = form.get("password") as string | null;

	const api_key = await validateCredentials(username, password);

	if (api_key == null) {
		session.flash("error", "Invalid username/password");

		// Redirect back to the login page with errors.
		return redirect("/login", {
			headers: {
				"Set-Cookie": await commitSession(session),
			},
		});
	}

	session.set("api_key", api_key);

	// Login succeeded, send them to the home page.
	return redirect("/", {
		headers: {
			"Set-Cookie": await commitSession(session),
		},
	});
}

export default function Login({ loaderData }: Route.ComponentProps) {
	const { error } = loaderData;

	return (
		<VStack height="100%" justifyContent="center" alignItems="center">
			<Form method="post">
				<Card.Root>
					<Card.Header>
						<Card.Title>Log In</Card.Title>
						<Card.Description>
							Fill in the form below to log in to your MAXIMO account.
							{error ? <Text color="fg.error">{error}</Text> : null}
						</Card.Description>
					</Card.Header>

					<Card.Body>
						<Stack gap="4" w="full">
							<Field.Root>
								<Field.Label>Username</Field.Label>
								<Input type="text" name="username" />
							</Field.Root>
							<Field.Root>
								<Field.Label>Password</Field.Label>
								<Input type="password" name="password" />
							</Field.Root>
						</Stack>
					</Card.Body>
					<Card.Footer justifyContent="flex-end">
						<Button variant="outline" type="reset">
							Cancel
						</Button>
						<Button variant="solid" type="submit">
							Sign in
						</Button>
					</Card.Footer>
				</Card.Root>
			</Form>
		</VStack>
	);
}
