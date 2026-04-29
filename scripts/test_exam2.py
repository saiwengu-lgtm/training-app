#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys, subprocess, re
sys.stdout.reconfigure(encoding="utf-8")

r = subprocess.run(
    ["curl.exe", "-s", "-o", "C:/Users/13975/AppData/Local/Temp/exam2.html",
     "-w", "%{http_code}", "https://anquanpeixun.site/study/exam/5fe5b716-703a-4184-8d1a-50ef6463d9b3"],
    capture_output=True, timeout=20
)
code = r.stdout.decode().strip()
print(f"HTTP: {code}")

if code == "200":
    with open("C:/Users/13975/AppData/Local/Temp/exam2.html", "r", encoding="utf-8", errors="replace") as f:
        html = f.read()
    text = re.sub(r'<[^>]+>', ' ', html).strip()
    # Show meaningful content
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for l in lines[:30]:
        print(l[:120])
