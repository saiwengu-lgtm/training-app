#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json, urllib.request, sys, uuid, datetime
sys.stdout.reconfigure(encoding="utf-8")

now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

# 创建随机考试
exam = {
    "id": str(uuid.uuid4()),
    "title": "二级保密资格模拟考试",
    "description": "系统随机抽题，每人题目不同",
    "passingScore": 60,
    "mode": "random",
    "questionSelection": {
        "categories": ["保密资格"],
        "rules": [
            {"type": "single", "count": 10, "score": 5},
            {"type": "multiple", "count": 5, "score": 10},
            {"type": "judge", "count": 5, "score": 4}
        ]
    },
    "questions": [],
    "createdAt": now
}

data = json.dumps(exam, ensure_ascii=False).encode("utf-8")
req = urllib.request.Request(
    "https://anquanpeixun.site/api/exams",
    data=data,
    headers={"Content-Type": "application/json"}
)
resp = urllib.request.urlopen(req)
result = json.loads(resp.read())
print("考试创建成功！")
print(f"考试ID: {result['exam']['id']}")
print(f"标题: {result['exam']['title']}")
print(f"模式: 随机（10单选x5分 + 5多选x10分 + 5判断x4分 = 120分）")
print(f"及格线: 60分")
