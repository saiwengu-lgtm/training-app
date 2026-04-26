#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json, urllib.request, sys
sys.stdout.reconfigure(encoding="utf-8")

url = "https://anquanpeixun.site/api/exams"
req = urllib.request.Request(url)
try:
    resp = urllib.request.urlopen(req, timeout=15)
    raw = resp.read().decode("utf-8")
    with open("C:/Users/13975/.openclaw/workspace/training-app/scripts/debug_exams.json", "w", encoding="utf-8") as f:
        f.write(raw)
    d = json.loads(raw)
    for e in d["exams"]:
        t = e["title"]
        mode = e.get("mode", "???")
        qc = len(e.get("questions", []))
        qs = e.get("questionSelection")
        print(f"mode={mode} title={t[:20]} qs={'YES' if qs else 'NO'} qcount={qc}")
except Exception as ex:
    print(f"Error: {ex}")
