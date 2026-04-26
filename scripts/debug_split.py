#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Debug: test split_options on the actual data"""
import sys, json, urllib.request, openpyxl, re
sys.stdout.reconfigure(encoding="utf-8")

EXCEL = r"C:\Users\13975\Desktop\保密试题库.xlsx"
wb = openpyxl.load_workbook(EXCEL)
ws = wb.active

def split_options(text):
    parts = re.split(r'(?=[A-D]\.\s)', str(text).strip())
    result = []
    for p in parts:
        p = p.strip()
        if p:
            cleaned = re.sub(r'^[A-D]\.\s*', '', p)
            result.append(cleaned.strip())
    return result

# Test first few rows
for r, row in enumerate(ws.iter_rows(min_row=2, max_row=5, values_only=True), 2):
    raw = str(row[2] or '').strip()
    splitted = split_options(raw)
    print(f'Row {r}: raw={raw[:60]}')
    print(f'  splitted={splitted}')
