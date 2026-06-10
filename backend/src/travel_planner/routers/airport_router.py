# backend/src/travel_planner/routers/airport_router.py
import unicodedata
from functools import lru_cache
from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter(prefix="/airports", tags=["airports"])

# Top ~200 global hub airports — get priority boost in search results
_MAJOR_HUBS: frozenset[str] = frozenset({
    "ATL","LAX","ORD","DFW","DEN","JFK","SFO","SEA","LAS","CLT","PHX","MIA","IAH","EWR","MSP",
    "BOS","DTW","LGA","FLL","BWI","SLC","SAN","TPA","AUS","MDW","IAD","HNL","DAL","PDX","STL",
    "LHR","LGW","STN","LTN","LCY","MAN","BHX","EDI","GLA","BRS","NCL",
    "CDG","ORY","NCE","LYS","MRS","TLS","BOD","NTE","MPL",
    "FRA","MUC","BER","DUS","HAM","CGN","STR","HAJ","NUE",
    "AMS","BRU","ZRH","GVA","VIE","FCO","MXP","LIN","NAP","VCE","FCO","CIA","BGY",
    "MAD","BCN","AGP","PMI","LPA","TFN","VLC","SVQ","BIO","SCQ",
    "LIS","OPO","FAO",
    "ARN","GOT","BMA","OSL","TRD","CPH","HEL","RIX","TLL","VNO",
    "WAW","KRK","GDN","WRO","PRG","BUD","BUH","OTP","SOF","SKG","ATH","IST","SAW","ADB","ESB","BJV","AYT",
    "DXB","AUH","DOH","KWI","BAH","MCT","AMM","BEY","TLV","CAI","ADD","NBO","JRO","CPT","JNB","LOS","ACC",
    "SVO","DME","VKO","LED","SIP","KBP",
    "DEL","BOM","MAA","BLR","HYD","CCU","AMD","COK","PNQ","GOI",
    "PEK","PVG","CAN","CTU","SZX","HGH","XIY","CKG","WUH","CSX",
    "HKG","MFM","TPE","KHH",
    "NRT","HND","KIX","CTS","FUK","NGO","OKA",
    "ICN","GMP","PUS","CJU",
    "SIN","KUL","BKK","DMK","CGK","SUB","DPS","HAN","SGN","MNL","RGN","CMB",
    "SYD","MEL","BNE","PER","ADL","AKL","CHC","WLG",
    "GRU","CGH","GIG","SDU","BSB","SSA","POA","FOR","REC","CWB","CNF",
    "BOG","MDE","CLO","GYE","LIM","SCL","EZE","AEP","MVD","ASU","LPB","UIO","CCS",
    "MEX","CUN","GDL","MTY","PTY","SJO","HAV","SDQ","MBJ","SJU","NAS","BGI",
    "YYZ","YVR","YYC","YOW","YUL","YEG","YWG","YHZ",
    "JED","RUH","DMM","MED","AHB",
    "CMN","TUN","ALG","CAI","KRT","DAR","MPM","LFW","ABV","LOS","ACC",
})


class AirportResult(BaseModel):
    code: str
    name: str
    city: str
    country: str


@lru_cache(maxsize=1)
def _load() -> list[dict]:
    import airportsdata
    raw = airportsdata.load("IATA")
    return [
        {
            "code": iata,
            "name": data["name"],
            "city": data["city"],
            "country": data["country"],
        }
        for iata, data in raw.items()
        if data.get("city")
    ]


def _normalize(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", s.lower())
        if unicodedata.category(c) != "Mn"
    )


@router.get("/search", response_model=list[AirportResult])
def search_airports(q: str = Query(..., min_length=2)) -> list[AirportResult]:
    nq = _normalize(q.strip())

    scored: list[tuple[int, int, str, AirportResult]] = []

    for a in _load():
        code = a["code"]
        nc = _normalize(a["city"])
        nn = _normalize(a["name"])

        if code.lower() == nq:
            priority = 0
        elif nc == nq:
            priority = 1
        elif nc.startswith(nq) or code.lower().startswith(nq):
            priority = 2
        elif nq in nc or nq in nn:
            priority = 3
        else:
            continue

        hub = 0 if code in _MAJOR_HUBS else 1
        result = AirportResult(code=code, name=a["name"], city=a["city"], country=a["country"])
        # sort key: priority → major-hub status → code alpha (stable within bucket)
        scored.append((priority, hub, code, result))

    scored.sort(key=lambda x: (x[0], x[1], x[2]))
    return [r for _, _, _, r in scored[:10]]


@router.get("/{code}", response_model=AirportResult | None)
def get_airport(code: str) -> AirportResult | None:
    code = code.upper()
    for a in _load():
        if a["code"] == code:
            return AirportResult(**a)
    return None
