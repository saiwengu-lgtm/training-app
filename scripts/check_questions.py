#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json, urllib.request, sys
sys.stdout.reconfigure(encoding="utf-8")

d = json.loads(urllib.request.urlopen("https://anquanpeixun.site/api/questions").read())
qs = d["questions"]
single = sum(1 for q in qs if q["type"]=="single")
multi = sum(1 for q in qs if q["type"]=="multiple")
print(f"题库：{len(qs)} 题（单选 {single} + 多选 {multi}）")
print(f"分类：{d['categories']}")
print(f"示例第一题：{qs[0]['text'][:40]}... 答案={qs[0]['correctAnswer']}")
