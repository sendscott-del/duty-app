"""Price a subscription in every available territory using Apple's equalizations.

The subscriptions were available in 175 territories but priced only in USA, which
is what App Store Connect reports as IAP_SUBMISSION_NOT_ALLOWED_MISSING_PRICING_DATA.
Equalization is the same conversion the ASC UI applies when you pick a base price.
"""
import sys; sys.path.insert(0,'scripts')
from asc import call

BASE={"6802500345":"eyJzIjoiNjgwMjUwMDM0NSIsInQiOiJVU0EiLCJwIjoiMTAxNzcifQ",
      "6802500509":"eyJzIjoiNjgwMjUwMDUwOSIsInQiOiJVU0EiLCJwIjoiMTAwMzYifQ"}

for sid, pp in BASE.items():
    eq=call(f"/v1/subscriptionPricePoints/{pp}/equalizations?include=territory&limit=200")
    pts=eq.get("data",[])
    # map price point id -> territory id via relationships
    ok=err=0; errors={}
    for p in pts:
        terr=p.get("relationships",{}).get("territory",{}).get("data",{})
        tid=terr.get("id")
        if not tid: continue
        r=call("/v1/subscriptionPrices", method="POST", body={"data":{
            "type":"subscriptionPrices",
            "attributes":{"startDate":None,"preserveCurrentPrice":False},
            "relationships":{
                "subscription":{"data":{"type":"subscriptions","id":sid}},
                "subscriptionPricePoint":{"data":{"type":"subscriptionPricePoints","id":p["id"]}},
                "territory":{"data":{"type":"territories","id":tid}}}}})
        if r.get("__error"):
            err+=1
            import re
            m=re.search(r'"code" : "([^"]+)"', r["body"] or "")
            errors[m.group(1) if m else "?"]=errors.get(m.group(1) if m else "?",0)+1
        else: ok+=1
    print(f"{sid}: priced {ok}, failed {err} {errors if errors else ''}")
