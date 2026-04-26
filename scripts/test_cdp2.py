#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Use Edge's CDP to connect to already-running browser"""
import sys, os, json, urllib.request, time
sys.stdout.reconfigure(encoding="utf-8")

# First launch Edge normally with debug port
edge = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
port = "9223"
user_dir = r"C:\Users\13975\AppData\Local\Temp\edge-test2"

subprocess.Popen(
    [edge, f"--remote-debugging-port={port}", f"--user-data-dir={user_dir}",
     "https://anquanpeixun.site/study/exam/5fe5b716-703a-4184-8d1a-50ef6463d9b3",
     "--no-first-run", "--disable-sync"],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
)

time.sleep(5)

# List targets
resp = urllib.request.urlopen(f"http://localhost:{port}/json", timeout=5)
targets = json.loads(resp.read())
print(f"Targets: {len(targets)}")
for t in targets:
    title = t.get("title", "")
    url = t.get("url", "")
    print(f"  Title: {title[:60]}")
    print(f"  URL: {url[:80]}")
    print()

import subprocess as sp
# Kill edge
sp.check_output(["taskkill", "/F", "/IM", "msedge.exe"], stderr=sp.DEVNULL)
