#!/usr/bin/env python3
"""Build Nerve & Needle into public/ (the folder you deploy).

Content lives in content/ and is the single source of truth:
  content/muscles_upper.csv, content/muscles_lower.csv  -> muscles, nerves, roots, needle sites
  content/cases.json                                    -> localize-the-lesion cases
Edit those, run `python3 tools/build.py`, then redeploy public/.
Each build gets a new version, so installed copies show "A new version ... is ready".
"""
import csv, json, hashlib, shutil, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, OUT, CONTENT = ROOT / "src", ROOT / "public", ROOT / "content"
STATUS = {"Sources agree": "A", "Roots vary by source": "V",
          "Nerve verified; roots by anatomic convention": "N"}

def load_muscles():
    rows = []
    for name in ("muscles_upper.csv", "muscles_lower.csv"):
        with open(CONTENT / name, newline="", encoding="utf-8") as f:
            for r in csv.DictReader(f):
                needle = None
                if r.get("needle_site"):
                    needle = {"site": r["needle_site"], "position": r["needle_position"],
                              "activate": r["needle_activation"], "offtarget": r["needle_off_target"],
                              "note": r["needle_note"], "page": r["perotto_pages"]}
                rows.append({
                    "id": int(r["id"]), "region": r["region"], "group": r["group"], "muscle": r["muscle"],
                    "nerve": r["peripheral_nerve"], "path": r["plexus_path"], "roots": r["roots"],
                    "key": r["edx_key_root"], "mrc": r["mrc_1976_roots"], "recap": r.get("pmr_recap_roots", ""),
                    "edx": r["surgical_emg_evidence"], "pearl": r["clinical_emg_pearl"],
                    "status": STATUS.get(r["verification"], "N"), "vnote": r["verification_note"],
                    "needle": needle})
    rows.sort(key=lambda d: d["id"])
    return rows

def validate(muscles, cases):
    names = {m["muscle"] for m in muscles}
    problems = []
    for c in cases:
        for n in c["ab"] + c["nl"]:
            if n not in names:
                problems.append(f'case "{c["id"]}": muscle "{n}" is not in the CSVs')
        if c["answer"] not in c["options"]:
            problems.append(f'case "{c["id"]}": answer is not one of the options')
        if len(set(c["options"])) != 4:
            problems.append(f'case "{c["id"]}": needs exactly 4 different options')
    if problems:
        raise SystemExit("Content errors:\n  " + "\n  ".join(problems))

def main():
    muscles = load_muscles()
    cases = json.loads((CONTENT / "cases.json").read_text(encoding="utf-8"))
    validate(muscles, cases)

    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(SRC, OUT)
    data = "window.NN_DATA=" + json.dumps({"muscles": muscles, "cases": cases}, ensure_ascii=False) + ";\n"
    (OUT / "data.js").write_text(data, encoding="utf-8")

    files = sorted(p for p in OUT.rglob("*") if p.is_file() and p.name != "sw.js" and p.suffix != ".txt" and not p.name.startswith("_"))
    digest = hashlib.sha256()
    for p in files:
        digest.update(p.read_bytes())
    version = datetime.date.today().strftime("%Y.%m.%d") + "-" + digest.hexdigest()[:7]

    for name in ("index.html",):
        p = OUT / name
        p.write_text(p.read_text(encoding="utf-8").replace("__VERSION__", version), encoding="utf-8")
    precache = ["./"] + ["./" + p.relative_to(OUT).as_posix() for p in files]
    sw = (OUT / "sw.js").read_text(encoding="utf-8")
    (OUT / "sw.js").write_text(sw.replace("__VERSION__", version).replace("__FILES__", json.dumps(precache, indent=1)), encoding="utf-8")

    size = sum(p.stat().st_size for p in OUT.rglob("*") if p.is_file())
    print(f"Built public/  version {version}  ·  {len(muscles)} muscles, {len(cases)} cases  ·  {size/1024:.0f} KB")

if __name__ == "__main__":
    main()
