#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""读取 Excel 并补导剩余题目到线上题库（跳过已存在的题）"""
import sys, json, urllib.request, openpyxl
sys.stdout.reconfigure(encoding="utf-8")

EXCEL = r"C:\Users\13975\Desktop\保密试题库.xlsx"
API = "https://anquanpeixun.site/api/questions"
BATCH = 30

# 先获取已有的题目ID
try:
    req = urllib.request.Request(API)
    resp = urllib.request.urlopen(req, timeout=15)
    existing = json.loads(resp.read())
    existing_ids = set(q["id"] for q in existing.get("questions", []))
    print(f"线上已有 {len(existing_ids)} 题")
except Exception as e:
    print(f"查询已有题目失败: {e}")
    existing_ids = set()

wb = openpyxl.load_workbook(EXCEL)
ws = wb.active

questions = []
for row in ws.iter_rows(min_row=2, values_only=True):
    qtype, text, optA, optB, optC, optD, answer = row
    if not text:
        continue
    options = []
    for o in [optA, optB, optC, optD]:
        if o:
            options.append(str(o).strip())
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

print(f"Excel 共 {len(questions)} 题")

# Filter out likely duplicates by text
to_import = []
dups = 0
for q in questions:
    # 用纯文本比较去重
    if not any(existing.get("text") == q["text"] for existing_question_text in existing_ids):
        to_import.append(q)
    else:
        dups += 1

print(f"去重后还需导入 {len(to_import)} 题（{dups} 题已存在）")

# 按ID去重（从线上拿回来的实际 ID）
# 重新查一次，这次用 text 匹配
try:
    req = urllib.request.Request(API)
    resp = urllib.request.urlopen(req, timeout=15)
    existing_data = json.loads(resp.read())
    existing_texts = set(q["text"] for q in existing_data.get("questions", []))
except:
    existing_texts = set()

to_import = [q for q in questions if q["text"] not in existing_texts]
print(f"精确去重后还需导入 {len(to_import)} 题")

imported = 0
errors = 0
for i in range(0, len(to_import), BATCH):
    batch = to_import[i:i+BATCH]
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
        body = e.read().decode("utf-8", errors="replace")[:200]
        print(f"  ✗ 批次 {i//BATCH+1}: HTTP {e.code}")
        errors += 1
    except Exception as e:
        # Connection reset - retry once
        print(f"  ! 批次 {i//BATCH+1}: {e}, 重试中...")
        import time
        time.sleep(2)
        try:
            resp = urllib.request.urlopen(req, timeout=30)
            result = json.loads(resp.read())
            count = result.get("count", 0)
            imported += count
            print(f"    ✓ 重试成功: 导入 {count} 题")
        except:
            print(f"    ✗ 重试失败")

print(f"\n导入完成！本次成功 {imported} 题，共 {existing_texts.__len__() + imported if existing_texts else 0} 题")
