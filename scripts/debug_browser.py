#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
使用 Edge/Chrome webdriver 来抓取真实控制台错误。
使用 system browser via CDP (Chrome DevTools Protocol) approach.
"""
import sys, subprocess, json, tempfile, os
sys.stdout.reconfigure(encoding="utf-8")

# Try to find Chrome in common locations
chrome_paths = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
    os.path.expandvars(r"%PROGRAMFILES%\Google\Chrome\Application\chrome.exe"),
]

chrome = None
for p in chrome_paths:
    if os.path.exists(p):
        chrome = p
        break

if not chrome:
    print("Chrome not found, trying edge...")
    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"),
    ]
    for p in edge_paths:
        if os.path.exists(p):
            chrome = p
            break

if not chrome:
    print("No browser found, skipping.")
    sys.exit(1)

# Create a simple JS collector HTML
html_content = """
<!DOCTYPE html>
<html>
<head><title>Debug</title></head>
<body>
<iframe id="f" src="https://anquanpeixun.site/study/exam/5fe5b716-703a-4184-8d1a-50ef6463d9b3" 
  style="width:100%;height:90vh"></iframe>
<script>
var errors = [];
window.addEventListener("error", function(e) {
    errors.push(e.message + " | " + e.filename + ":" + e.lineno);
});
window.addEventListener("unhandledrejection", function(e) {
    errors.push("PROMISE: " + e.reason);
});
setTimeout(function() {
    document.getElementById("log").textContent = errors.join("\\n") || "No errors captured";
    document.title = "DONE:" + errors.length;
    // Also try reading from iframe
    try {
        var iframeDoc = document.getElementById("f").contentDocument || document.getElementById("f").contentWindow.document;
        document.getElementById("iframe-log").textContent = iframeDoc.body ? iframeDoc.body.innerText.substring(0, 1000) : "no body";
    } catch(e) {
        document.getElementById("iframe-log").textContent = "Cannot access iframe: " + e.message;
    }
}, 5000);
</script>
<pre id="log">Loading...</pre>
<hr>
<pre id="iframe-log">Loading...</pre>
</body>
</html>
"""

tmp = tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w", encoding="utf-8")
tmp.write(html_content)
tmp_path = tmp.name
tmp.close()

print(f"Saved debug HTML to {tmp_path}")
print(f"Opening with {chrome}...")

# Launch with headless/new-window
proc = subprocess.Popen([chrome, "--new-window", f"file://{tmp_path}"],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print(f"Browser PID: {proc.pid}")
print("\nWaiting 8 seconds before checking title...")
import time
time.sleep(8)

# Check page response from server directly
import urllib.request
req = urllib.request.Request("https://anquanpeixun.site/study/exam/5fe5b716-703a-4184-8d1a-50ef6463d9b3",
    headers={"User-Agent": "Mozilla/5.0"})
try:
    resp = urllib.request.urlopen(req, timeout=10)
    html_content = resp.read().decode("utf-8", errors="replace")
    # Check for error div
    if "__next_error__" in html_content:
        print("\n>>> HTML still contains __next_error__!")
    else:
        print("\n>>> HTML does NOT contain __next_error__ - good!")

    # Check for the loading spinner
    if "加载中" in html_content:
        print(">>> Shows loading spinner (SSR OK)")
    else:
        print(">>> NO loading spinner - something else is rendered")
        # Print first 200 chars
        print("First 200 chars:", html_content[:200])
except Exception as ex:
    print(f"Fetch error: {ex}")

os.unlink(tmp_path)
print("\nCheck the browser window for errors!")
