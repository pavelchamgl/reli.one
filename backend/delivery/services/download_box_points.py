import json
import requests


def download_pickup_points(url, output_file):
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, list):
            print(f"✅ Saved {len(data)} pickup points to {output_file}")
        else:
            print("✅ Saved response to file (not a list)")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
    else:
        print(f"❌ Failed to fetch data. Status code: {response.status_code}")


if __name__ == "__main__":
    url = "https://pickup-point.api.packeta.com/v5/fb2fbc354bafb66a/box/json?lang=en"
    output_file = "packeta_box_points.json"
    download_pickup_points(url, output_file)
