#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从Excel读取保密试题库，通过API导入线上题库"""
import sys, json, urllib.request, openpyxl, uuid, re
sys.stdout.reconfigure(encoding="utf-8")

EXCEL = r"C:\Users\13975\Desktop\保密试题库.xlsx"
API = "https://anquanpeixun.site/api/questions"
BATCH = 50

def split_options(text):
    """把 'A. xxx B. xxx C. xxx D. xxx' 拆成 ['xxx','xxx','xxx','xxx']"""
    if not text:
        return []
    # 匹配 A. （空格可选）开头
    parts = re.split(r'(?=[A-D]\.\s*)', str(text).strip())
    result = []
    for p in parts:
        p = p.strip()
        if p:
            cleaned = re.sub(r'^[A-D]\.\s*', '', p)
            result.append(cleaned.strip())
    return result

wb = openpyxl.load_workbook(EXCEL)
ws = wb.active

questions = []
for row in ws.iter_rows(min_row=2, values_only=True):
    qtype, text, optA, optB, optC, optD, answer = row
    if not text:
        continue

    # 选项A列可能包含了所有选项（A. xxx B. xxx C. xxx D. xxx）
    raw_opts = str(optA or '').strip()
    options = split_options(raw_opts)
    # 如果没有成功拆分（比如已经分开了），再检查各列
    if len(options) < 2:
        options = []
        for o in [optA, optB, optC, optD]:
            if o:
                options.append(str(o).strip())

    # 答案转为数组
    correct = list(str(answer).strip().upper()) if answer else []

    questions.append({
        "category": "保密资格",
        "type": "multiple" if qtype == "多选" else "single",
        "text": str(text).strip(),
        "options": options,
        "correctAnswer": correct,
        "score": 2 if qtype == "多选" else 1,
        "tags": ["保密资格"]
    })

print(f"准备导入 {len(questions)} 题（{sum(1 for q in questions if q['type']=='single')} 单选 + {sum(1 for q in questions if q['type']=='multiple')} 多选）")

imported = 0
errors = 0
for i in range(0, len(questions), BATCH):
    batch = questions[i:i+BATCH]
    data = json.dumps(batch, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        API, data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        result = json.loads(resp.read())
        count = result.get("count", 0)
        imported += count
        print(f"  ✓ 批次 {i//BATCH+1}: 导入 {count} 题 (累计 {imported})")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")[:300]
        print(f"  ✗ 批次 {i//BATCH+1}: HTTP {e.code} - {body}")
        errors += 1
        if errors >= 3:
            break
    except Exception as e:
        print(f"  ✗ 批次 {i//BATCH+1}: {e}")
        errors += 1
        if errors >= 3:
            break

print(f"\n导入完成！成功 {imported}/{len(questions)} 题")
