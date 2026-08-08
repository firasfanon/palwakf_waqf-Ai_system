#!/usr/bin/env python3
import re
from pathlib import Path

PROJECT_ROOT = Path("/home/ubuntu/waqf_ai_model/client/src")

# الملفات التي بها أخطاء
ERROR_FILES = [
    "pages/FetchedContentReview.tsx",
    "pages/KnowledgeManagement.tsx",
    "pages/ManageUsers.tsx",
    "pages/PropertiesManagement.tsx",
    "pages/RulingsManagement.tsx",
]

def fix_table_headers(content: str) -> str:
    """إصلاح أخطاء TableHeader و TableHead"""
    
    # إصلاح TableHead المكسورة (مثل: <TableHead className="text-center"er>)
    content = re.sub(
        r'<TableHead className="text-center"er>',
        '<TableHeader>',
        content
    )
    
    # إصلاح TableHead المكررة (مثل: <TableHead className="text-center w-12 text-center">)
    content = re.sub(
        r'<TableHead className="([^"]*)\s+text-center\s+([^"]*)\s+text-center([^"]*)"',
        r'<TableHead className="\1 \2 text-center\3"',
        content
    )
    
    return content

def process_file(file_path: Path) -> bool:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            original = f.read()
        
        modified = fix_table_headers(original)
        
        if modified != original:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(modified)
            print(f"✅ {file_path.relative_to(PROJECT_ROOT)}")
            return True
        else:
            print(f"⏭️  {file_path.relative_to(PROJECT_ROOT)}")
            return False
    except Exception as e:
        print(f"❌ {file_path.relative_to(PROJECT_ROOT)}: {e}")
        return False

for file_rel in ERROR_FILES:
    file_path = PROJECT_ROOT / file_rel
    if file_path.exists():
        process_file(file_path)
