import urllib.request
import json

def test():
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/payments/batch",
        data=json.dumps({"payload": {"amount": 500, "companyId": "c1", "memo": "test"}}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as response:
            print("Status:", response.status)
            print("Body:", response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print("Error HTTP:", e.code)
        print("Body:", e.read().decode("utf-8"))
    except Exception as e:
        print("Exception:", e)

if __name__ == "__main__":
    test()
