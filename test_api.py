import urllib.request
import json

def test():
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/bills/post",
        data=json.dumps({"p_bill_id": "temp-919df034-d577-44ca-9b6e-a7e0f67d9139"}).encode("utf-8"),
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
