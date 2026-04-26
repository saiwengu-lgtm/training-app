#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
重新导入题库，把选项正确地拆分为4个独立项
"""
import sys, json, re, time, urllib.request
sys.stdout.reconfigure(encoding="utf-8")

BASE = "https://anquanpeixun.site"

# 1. 获取所有题目
print("获取题库...")
r = urllib.request.urlopen(f"{BASE}/api/questions", timeout=15)
d = json.loads(r.read().decode('utf-8', errors='replace'))
qs = d.get('questions', [])
print(f"题库共 {len(qs)} 题")

# 2. 按文本去重
seen = set()
unique = []
for q in qs:
    text = q.get('text', '').strip()
    if not text or text in seen:
        continue
    seen.add(text)
    unique.append(q)
print(f"去重后 {len(unique)} 题（去掉了 {len(qs) - len(unique)} 条重复）")

# 3. 拆分选项
def split_options(text):
    """把 'A. xxx B. xxx C. xxx D. xxx' 拆成 ['xxx','xxx','xxx','xxx']"""
    parts = re.split(r'(?=[A-D]\.\s)', text.strip())
    result = []
    for p in parts:
        p = p.strip()
        if p:
            cleaned = re.sub(r'^[A-D]\.\s*', '', p)
            result.append(cleaned)
    return result

fixed = 0
for q in unique:
    opts = q.get('options', [])
    if len(opts) == 1 and isinstance(opts[0], str):
        splitted = split_options(opts[0])
        q['options'] = splitted
        fixed += 1
        
print(f"拆分了 {fixed} 道题的选项")

# 4. 逐题上传更新
import http.client, ssl
ctx = ssl.create_default_context()

count = 0
for q in unique:
    qid = q.get('id')
    if not qid:
        continue
    
    data = json.dumps({
        "category": q.get('category', ''),
        "type": q.get('type', 'single'),
        "text": q.get('text', ''),
        "options": q.get('options', []),
        "correctAnswer": q.get('correctAnswer', []),
        "score": q.get('score', 1),
        "tags": q.get('tags', []),
    }).encode('utf-8')
    
    req = urllib.request.Request(
        f"{BASE}/api/questions/{qid}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="PUT",
    )
    try:
        resp = urllib.request.urlopen(req, timeout=10, context=ctx)
        count += 1
    except Exception as e:
        print(f"  ✗ 更新失败 {qid}: {e}")
        continue
    
    if count % 50 == 0:
        print(f"  已更新 {count}/{len(unique)} 题")
    time.sleep(0.05)  # 限速

print(f"\n✅ 完成！共更新 {count} 题")
