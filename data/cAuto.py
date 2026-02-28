import json, pathlib

SRC   = pathlib.Path("compost.json")          # original file
DEST  = pathlib.Path("compost_filled.json")   # new file with extra keys

# 💡 keys you want in *every* record
TEMPLATE = {
    "N%": "",
    "moistureContent%": "",
    "bulkDensity": "",
    "lignin%": "",
    "cellulose%": "",
    "hemicellulose%": "",
    "ash%": "",
    "particleSize": "",
    "waterHoldingCapacity": "",
    "airFlowRating": "",
    "pH": "",
    "compostClass": "",
    "pathogenRisk": ""
}

data = json.loads(SRC.read_text())

for entry in data:
    for k, default in TEMPLATE.items():
        entry.setdefault(k, default)   # only add if key is missing

DEST.write_text(json.dumps(data, indent=2))
print(f"✅  Added template keys to {len(data)} records → {DEST}")