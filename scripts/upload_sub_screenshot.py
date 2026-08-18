"""Attach an App Review screenshot to a subscription (clears MISSING_METADATA)."""
import sys, os, json, hashlib, urllib.request
sys.path.insert(0,'scripts')
from asc import call, _token

def upload(sub_id, path):
    data=open(path,'rb').read()
    name=os.path.basename(path)
    # 1) reserve
    body={"data":{"type":"subscriptionAppStoreReviewScreenshots",
      "attributes":{"fileSize":len(data),"fileName":name},
      "relationships":{"subscription":{"data":{"type":"subscriptions","id":sub_id}}}}}
    r=call("/v1/subscriptionAppStoreReviewScreenshots", method="POST", body=body)
    if r.get("__error"): return ("reserve failed", r)
    sid=r["data"]["id"]; ops=r["data"]["attributes"]["uploadOperations"]
    # 2) upload bytes
    for op in ops:
        chunk=data[op["offset"]:op["offset"]+op["length"]]
        req=urllib.request.Request(op["url"], data=chunk, method=op["method"])
        for h in op.get("requestHeaders",[]): req.add_header(h["name"], h["value"])
        urllib.request.urlopen(req, timeout=180)
    # 3) commit
    md5=hashlib.md5(data).hexdigest()
    p=call(f"/v1/subscriptionAppStoreReviewScreenshots/{sid}", method="PATCH",
           body={"data":{"type":"subscriptionAppStoreReviewScreenshots","id":sid,
                 "attributes":{"uploaded":True,"sourceFileChecksum":md5}}})
    if p.get("__error"): return ("commit failed", p)
    return ("ok", p["data"]["attributes"].get("assetDeliveryState",{}).get("state"))

if __name__=="__main__":
    for sub in ["6802500345","6802500509"]:
        print(sub, upload(sub, "build/store/paywall.png"))
