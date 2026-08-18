"""Minimal App Store Connect API client (ES256 JWT, no deps beyond cryptography)."""
import json,time,base64,urllib.request,urllib.error
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import ec, utils as asy

KEY_ID="424J7NT92Y"; ISSUER="dff48c7f-f787-4bec-9f7c-def2559b6c58"
KEY_PATH=f"/Users/scottshurtliff/.appstoreconnect/private_keys/AuthKey_{KEY_ID}.p8"
BASE="https://api.appstoreconnect.apple.com"

def _token():
    key=serialization.load_pem_private_key(open(KEY_PATH,"rb").read(),password=None)
    b64=lambda b: base64.urlsafe_b64encode(b).rstrip(b"=")
    now=int(time.time())
    h=b64(json.dumps({"alg":"ES256","kid":KEY_ID,"typ":"JWT"},separators=(',',':')).encode())
    p=b64(json.dumps({"iss":ISSUER,"iat":now,"exp":now+900,"aud":"appstoreconnect-v1"},separators=(',',':')).encode())
    der=key.sign(h+b"."+p,ec.ECDSA(hashes.SHA256())); r,s=asy.decode_dss_signature(der)
    return (h+b"."+p+b"."+b64(r.to_bytes(32,'big')+s.to_bytes(32,'big'))).decode()

def call(path, method="GET", body=None):
    req=urllib.request.Request(BASE+path, method=method,
        data=json.dumps(body).encode() if body else None,
        headers={"Authorization":"Bearer "+_token(),"Content-Type":"application/json"})
    try:
        raw=urllib.request.urlopen(req,timeout=60).read()
        return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        return {"__error":e.code,"body":e.read().decode()[:800]}
