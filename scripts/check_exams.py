#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json, urllib.request, sys
sys.stdout.reconfigure(encoding="utf-8")

d = json.loads(urllib.request.urlopen("https://anquanpeixun.site/api/exams").read())
exams = d["exams"]
print(f"共有 {len(exams)} 个考试")
for e in exams:
    mode = e.get("mode", "fixed")
    qcount = "随机" if mode == "random" else f'{len(e.get("questions",[]))}题'
    print(f'  {e["title"]} [mode={mode}] {qcount} 及格{e.get("passingScore")}分')

# 查第一个考试的详细信息
if exams:
    eid = exams[0]["id"]
    d2 = json.loads(urllib.request.urlopen(f"https://anquanpeixun.site/api/exams/{eid}").read())
    print(f'\n第一个考试详细信息：')
    print(json.dumps(d2["exam"], indent=2, ensure_ascii=False)[:500])
