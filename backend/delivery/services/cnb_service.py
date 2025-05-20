import requests

CNB_TXT_URL = "https://www.cnb.cz/en/financial-markets/foreign-exchange-market/central-bank-exchange-rate-fixing/central-bank-exchange-rate-fixing/daily.txt"


def get_czk_to_eur_rate():
    response = requests.get(CNB_TXT_URL)
    if response.status_code != 200:
        raise Exception("Failed to fetch exchange rates from CNB")

    lines = response.text.strip().splitlines()
    for line in lines:
        parts = line.split('|')
        if len(parts) >= 5 and parts[3] == "EUR":
            amount = int(parts[2])
            rate = float(parts[4].replace(",", "."))
            return rate / amount

    raise Exception("EUR to CZK rate not found in CNB data")
