import datetime
import random
import requests
import urllib3

import pandas as pd


BASE_URL = "https://maximoqa.wmata.com"
OSLC_URL = f"{BASE_URL}/maximo/oslc"

USER = "TREAD"
PASSWORD = "WmataTest"

QUESTIONS = [
    "(1.1) Doors and Locks in good conditions",
    "(1.1a) Telephone(s) Operational",
    "(1.2) HVAC working",
    "(1.3) Lights and room power",
    "(1.4) Smoke and fire check",
    "(1.5) Water leaking",
    "(1.6) No chemicals or hazardous materials",
    "(2.1) Indication lamps",
    "(2.2) Power supplies",
    "(2.3) Transfer panel check",
    "(2.4) Track circuit modules checked",
    "(2.5) Alarms and indications checked",
    "(2.6) IDW checked",
    "(2.7) Housekeepings of TCR Wirings",
    "(2.8) Equipment secure",
    "(2.9) Check ground faults",
    "(3.1) Remove waste and trash",
    "(3.2) Clean racks and equipment",
    "(3.3) Floor cleaned",
    "(3.5) Are there items for temporary storage?",
    "(3.5a) Equipment or tool",
    "(3.5b) Setup date",
    "(3.5c) Expected removal date",
    "(3.5.1) Temporary storage area clearly marked with hazard signage",
    "(4.1) BOP checked",
    "(4.2) Local Control Panel Diagram securely hung and legible",
    "(4.2) Office equipment and desk cleaned and organized",
    "(4.3) Reference material",
    "(4.4) Inventory of test equipment, Safety, and Special tools",
    "(4.5) Extra or Failed components and equipment stored or removed",
    "(4.6) Non-rotating items checked",
    "(4.7) Extension cords stored",
    "(5.1) Fire extinguisher checked",
    "(5.2) Computer checked",
    "(5.3) Furniture checked",
    "Remarks",
    "Supervisor",
]

RESULTS = ["Good", "Issues Found"]

COLUMNS = [
    "Asset#",
    "EnterDate",
    "Result#",
    "Description",
    "Form#",
    "Results",
    "IssueCorrected",
    "Observation",
    "Follow-up",
    "WorkOrder",
    "ExistingWO",
    "ATCWO",
    "Message",
]

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


def getATCSAssetNums(s: requests.Session):
    r = s.get(
        OSLC_URL
        + '/os/mxapiasset?oslc.where=assetnum="ATCS%"&lean=1&oslc.select=assetnum',
        verify=False,
    )

    # i would just filer using oslc.where above, but its being weird about underscores...

    if r.ok:
        response = r.json()
        members: list[dict[str, str]] = response["member"]

        assetNums: list[str] = []
        for member in members:
            assetNum = member.get("assetnum", "")
            if len(assetNum) == 7:
                assetNums.append(assetNum)

        return assetNums

    return []


def makeFormDf(assets: list[str]):
    formData = [
        [
            asset,
            datetime.date.today().strftime("%m/%d/%Y"),
            assetIndex,
            description,
            1084,
            random.choices(RESULTS, weights=[0.9, 0.1])[0],
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ]
        for assetIndex, asset in enumerate(assets, 1)
        for description in QUESTIONS
    ]

    return pd.DataFrame(formData, columns=COLUMNS)


def main() -> None:

    s = requests.Session()

    login(s)
    assets = getATCSAssetNums(s)

    df = makeFormDf(assets)

    df.to_excel("output.xlsx", index=False)

    return


if __name__ == "__main__":
    main()
