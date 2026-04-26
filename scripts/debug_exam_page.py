#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
使用 Playwright 打开考试页面，捕获控制台错误。
"""
import sys, json, asyncio
sys.stdout.reconfigure(encoding="utf-8")

async def main():
    from playwright.async_api import async_playwright
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        errors = []
        
        page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda err: errors.append(f"[PAGE] {err}"))
        
        try:
            await page.goto("https://anquanpeixun.site/study/exam/5fe5b716-703a-4184-8d1a-50ef6463d9b3", 
                          wait_until="networkidle", timeout=15000)
        except:
            pass
        
        await asyncio.sleep(3)
        
        print("=== 控制台错误 ===")
        for e in errors:
            print(e)
        
        # 检查页面标题与内容
        title = await page.title()
        content = await page.content()
        if "__next_error__" in content:
            print("\n=== 页面是错误页面 ===")
            # 提取错误文本
            text = await page.inner_text("body")
            print(text[:500])
        else:
            print(f"\n页面标题: {title}")
            body_text = await page.inner_text("body")
            print(body_text[:500])
        
        await browser.close()

asyncio.run(main())
