#!/usr/bin/env python3
import re
from pathlib import Path

PROJECT_ROOT = Path("/home/ubuntu/waqf_ai_model/client/src")

def fix_file(file_path: Path) -> bool:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # إصلاح TableHeader المكسورة
        content = re.sub(r'<TableHead className="text-center"er>', '<TableHeader>', content)
        
        # إصلاح thead المكسورة
        content = re.sub(r'<thead className="text-center">', '<thead>', content)
        
        # إصلاح th المكسورة
        content = re.sub(r'<th className="text-center text-center"', r'<th className="text-center"', content)
        
        # إزالة dir المكرر
        content = re.sub(r'dir="rtl"\s+dir="rtl"', 'dir="rtl"', content)
        
        # إزالة className المكررة في نفس السطر
        content = re.sub(r'className="([^"]*)\s+text-center\s+([^"]*)\s+text-center([^"]*)"', r'className="\1 \2 text-center\3"', content)
        
        if content != original:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ {file_path.relative_to(PROJECT_ROOT)}")
            return True
        return False
    except Exception as e:
        print(f"❌ {file_path}: {e}")
        return False

# معالجة جميع ملفات TSX
for file_path in PROJECT_ROOT.rglob("*.tsx"):
    fix_file(file_path)
