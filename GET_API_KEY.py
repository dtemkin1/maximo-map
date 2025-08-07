import requests
import urllib3


BASE_URL = "https://maximo.wmata.com"
OSLC_URL = f"{BASE_URL}/maximo/oslc"
API_URL = f"{BASE_URL}/maximo/api"

USER = "E076524"
PASSWORD = "PUT PASSWORD HERE"

# config = Configuration()
# config.api_key = {"apikey": APIKEY}


urllib3.disable_warnings()


def login(s: requests.Session) -> bool:
    log_in_headers = {
        "Content-type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
    }

    r = s.post(
        BASE_URL + "/maximo/j_security_check",
        data={"j_username": USER, "j_password": PASSWORD},
        headers=log_in_headers,
        verify=False,
    )

    return r.ok


def whoami(s: requests.Session):
    r = s.get(
        OSLC_URL + "/whoami",
        verify=False,
        headers={
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
        },
    )

    return r.json()


def get_api_key(s: requests.Session):
    r = s.post(
        OSLC_URL + "/apitoken/create",
        data='{"expiration": -1}',
        verify=False,
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
    )

    return r.json()

def main() -> None:

    s = requests.Session()

    login(s)

    whoiam = whoami(s)
    print("Logged in as:", whoiam["displayname"])

    apikey = get_api_key(s)
    print("API Key:", apikey['apikey'])

    return


if __name__ == "__main__":
    main()
