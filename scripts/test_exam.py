#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys, subprocess
sys.stdout.reconfigure(encoding="utf-8")

# Use curl to download and read the file
r = subprocess.run(
    ["curl.exe", "-s", "-o", "C:/Users/13975/AppData/Local/Temp/exam_page.html",
     "-w", "%{http_code}", "https://anquanpeixun.site/study/exam/5fe5b716-703a-4184-8d1a-50ef6463d9b3"],
    capture_output=True, timeout=20
)
http_code = r.stdout.decode().strip()
print(f"HTTP: {http_code}")

if http_code == "200":
    with open("C:/Users/13975/AppData/Local/Temp/exam_page.html", "r", encoding="utf-8", errors="replace") as f:
        html = f.read()

    if "__next_error__" in html:
        print("RESULT: FAIL - error page (__next_error__)")
    elif "正在生成试卷" in html or "加载中" in html:
        print("RESULT: OK - loading spinner (SSR OK, client will hydrate)")
    elif "单选题" in html or "题目" in html or "下一题" in html or "提交答卷" in html:
        print("RESULT: OK - exam content rendered successfully!")
    elif "没有可供考试" in html or "页面加载错误" in html:
        print("RESULT: FAIL - no questions/error state")
    else:
        # Extract body text
        import re
        text = re.sub(r'<[^>]+>', '', html).strip()
        print(f"RESULT: UNKNOWN - body text: {text[:200]}")
else:
    print("RESULT: HTTP error")
