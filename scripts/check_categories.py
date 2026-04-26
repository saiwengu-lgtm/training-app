#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import urllib.request, json, sys
sys.stdout.reconfigure(encoding="utf-8")
d = json.loads(urllib.request.urlopen("https://anquanpeixun.site/api/questions").read())
cats = d.get("categories", [])
print("分类列表:", cats)
qs = d.get("questions", [])
print(f"题目总数: {len(qs)}")
# 查看每个分类的题目数量
from collections import Counter
cat_count = Counter(q.get("category") for q in qs)
print("各分类题目数:", dict(cat_count))
# 前3个
for q in qs[:3]:
    t = q["text"]
    print(f'  category={repr(q.get("category"))} text={t[:30]}')
