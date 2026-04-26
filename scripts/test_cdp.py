#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Edge CDP approach to get actual page content after JS execution"""
import sys, os, json, subprocess, time
sys.stdout.reconfigure(encoding="utf-8")

# Launch Edge with remote debugging port
port = "9222"
edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
user_dir = r"C:\Users\13975\AppData\Local\Temp\edge-test-profile"

# Kill any existing edge instances on that port
proc = subprocess.Popen(
    [edge_path, f"--remote-debugging-port={port}", f"--user-data-dir={user_dir}",
     "--headless", "--disable-gpu", "--no-sandbox",
     "https://anquanpeixun.site/study/exam/5fe5b716-703a-4184-8d1a-50ef6463d9b3"],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
)
print(f"Edge headless started, PID: {proc.pid}")

# Wait for page to load
time.sleep(5)

# Use CDP to evaluate JS
import urllib.request, json as j

# List targets
try:
    resp = urllib.request.urlopen(f"http://localhost:{port}/json", timeout=5)
    targets = j.loads(resp.read())
    print(f"Targets: {len(targets)}")
    if targets:
        t = targets[0]
        ws_url = t["webSocketDebuggerUrl"]
        print(f"Title: {t.get('title')}")
        print(f"URL: {t.get('url')}")
        
        # Check if the page shows error or content via the title
        if "页面加载错误" in t.get("title", "") or "加载错误" in t.get("title", ""):
            print("\n*** FAIL: Page shows error ***")
        elif "正在生成试卷" in t.get("title", ""):
            print("\n*** OK: Generating exam questions... ***")
        elif "保密资格" in t.get("title", ""):
            print("\n*** OK: Exam loaded! ***")
        else:
            print(f"\nTitle: {t.get('title')}")
except Exception as e:
    print(f"CDP error: {e}")

# Cleanup
proc.kill()
proc.wait()
print("Done")
