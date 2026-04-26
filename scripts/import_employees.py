#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 Excel 文件批量导入员工到线上系统"""
import openpyxl
import json
import urllib.request
import uuid
import datetime
import sys

sys.stdout.reconfigure(encoding='utf-8')

# 读取 Excel
FILE = r'C:\Users\13975\Desktop\人员信息_20260425213047_c0da4d2191850f3e12e00ad8.xlsx'
API_URL = 'https://anquanpeixun.site/api/employees'
BATCH = 50

wb = openpyxl.load_workbook(FILE)
ws = wb.active
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

employees = []
for row in ws.iter_rows(min_row=2, values_only=True):
    name = str(row[0]).strip() if row[0] else ''
    dept = str(row[1]).strip() if row[1] else ''
    emp_id = str(row[2]).strip() if row[2] else ''
    if name and emp_id:
        employees.append({
            'id': str(uuid.uuid4()),
            'name': name,
            'department': dept,
            'employeeId': emp_id,
            'createdAt': now
        })

print(f'共读取 {len(employees)} 名员工，开始分批导入...')

imported = 0
errors = 0

for i in range(0, len(employees), BATCH):
    batch = employees[i:i+BATCH]
    data = json.dumps(batch, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(
        API_URL,
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        result = json.loads(resp.read())
        count = result.get('count', 0)
        imported += count
        print(f'  ✓ 批次 {i//BATCH + 1}: 导入 {count} 人 (累计 {imported})')
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', errors='replace')[:200]
        print(f'  ✗ 批次 {i//BATCH + 1}: HTTP {e.code} - {err_body}')
        errors += 1
        if errors >= 3:
            print('错误过多，停止导入')
            break
    except Exception as e:
        print(f'  ✗ 批次 {i//BATCH + 1}: {e}')
        errors += 1
        if errors >= 3:
            print('错误过多，停止导入')
            break

print(f'\n导入完成！成功 {imported}/{len(employees)} 人')
