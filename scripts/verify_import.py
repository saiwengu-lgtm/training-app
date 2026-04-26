#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json, urllib.request, sys

sys.stdout.reconfigure(encoding="utf-8")

resp = urllib.request.urlopen("https://anquanpeixun.site/api/employees", timeout=15)
data = json.loads(resp.read())
print(f"数据库共 {len(data)} 名员工")
print()
# 统计各部门人数
depts = {}
for e in data:
    d = e["department"]
    depts[d] = depts.get(d, 0) + 1

print("部门分布：")
for d, c in sorted(depts.items(), key=lambda x: -x[1]):
    print(f"  {d}: {c}人")

print(f"\n前5人：")
for e in data[:5]:
    print(f"  {e['name']} ({e['department']}) - {e['employeeId']}")

print(f"\n最后3人：")
for e in data[-3:]:
    print(f"  {e['name']} ({e['department']}) - {e['employeeId']}")
