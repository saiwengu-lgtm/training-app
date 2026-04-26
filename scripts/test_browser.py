#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Use Edge CDP to check the exam page content after JS executes.
"""
import sys, os, json, subprocess, time, tempfile, threading, http.server
sys.stdout.reconfigure(encoding="utf-8")

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# Use Edge with a CDP debug port to capture page content after JS runs
import socket

def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

port = find_free_port()
print(f"Using CDP port: {port}")

# Create a simple proxy page that embeds the target
html = f"""<!DOCTYPE html>
<html><head><title>Exam Checker</title></head><body>
<iframe id="f" src="https://anquanpeixun.site/study/exam/5fe5b716-703a-4184-8d1a-50ef6463d9b3" 
  style="width:100%;height:95vh;border:none"></iframe>
<script>
// Wait for iframe to load, then capture content
setTimeout(() => {{
  try {{
    var iframe = document.getElementById('f');
    var doc = iframe.contentDocument || iframe.contentWindow.document;
    var text = doc.body ? doc.body.innerText : 'no body';
    document.title = 'DONE';
    // Write result to body
    var pre = document.createElement('pre');
    pre.textContent = '=== PAGE CONTENT ===\\n' + text.substring(0, 2000);
    document.body.appendChild(pre);
  }} catch(e) {{
    document.title = 'ERROR';
    var pre = document.createElement('pre');
    pre.textContent = 'Error: ' + e.message;
    document.body.appendChild(pre);
  }}
}}, 8000);
</script>
</body></html>
"""

html_path = os.path.join(tempfile.gettempdir(), "exam_checker.html")
with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)
print(f"HTML at: {html_path}")

# Launch Edge with file URL
proc = subprocess.Popen(
    [EDGE, f"file://{html_path}"],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
)
print(f"Edge PID: {proc.pid}")

# Wait for JS to run
time.sleep(10)
proc.kill()
print("Done - check the browser window that opened")
