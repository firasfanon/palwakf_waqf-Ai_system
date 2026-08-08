#!/usr/bin/env python3
"""
سكريبت لإصلاح اتجاه الكتابة RTL وتوسيط رؤوس الأعمدة في جميع صفحات المشروع
"""

import os
import re
from pathlib import Path

# المسار الأساسي للمشروع
PROJECT_ROOT = Path("/home/ubuntu/waqf_ai_model/client/src")

# قائمة الصفحات المستهدفة (جميع الصفحات الإدارية والعامة)
TARGET_FILES = [
    "pages/FAQs.tsx",
    "pages/Knowledge.tsx",
    "pages/KnowledgeManagement.tsx",
    "pages/AdminContent.tsx",
    "pages/AdminDashboard.tsx",
    "pages/AdminUsers.tsx",
    "pages/AdminSystemSettings.tsx",
    "pages/CacheAnalytics.tsx",
    "pages/AnalyticsDashboard.tsx",
    "pages/SiteSettings.tsx",
    "pages/ManageKnowledge.tsx",
    "pages/ManageUsers.tsx",
    "pages/CasesManagement.tsx",
    "pages/PropertiesManagement.tsx",
    "pages/RulingsManagement.tsx",
    "pages/DeedsManagement.tsx",
    "pages/FilesManagement.tsx",
    "pages/InstructionsManagement.tsx",
    "pages/FetchedContentReview.tsx",
    "pages/InteractionAnalytics.tsx",
    "pages/admin/DataFetching.tsx",
]

def fix_rtl_direction(content: str) -> str:
    """إصلاح اتجاه الكتابة RTL في الصفحة"""
    
    # البحث عن div الرئيسي وإضافة dir="rtl"
    # Pattern 1: <div className="container...">
    pattern1 = r'(<div\s+className="(?:container|min-h-screen|p-\d+|py-\d+|space-y-\d+)[^"]*")'
    
    def add_rtl_to_main_div(match):
        div_tag = match.group(1)
        # التحقق من عدم وجود dir مسبقاً
        if 'dir=' not in div_tag:
            return div_tag + ' dir="rtl"'
        return div_tag
    
    content = re.sub(pattern1, add_rtl_to_main_div, content, count=1)
    
    return content

def center_table_headers(content: str) -> str:
    """توسيط رؤوس الأعمدة في الجداول"""
    
    # Pattern 1: <TableHead>...</TableHead>
    # نبحث عن TableHead ونضيف className="text-center" إذا لم تكن موجودة
    def add_center_to_tablehead(match):
        full_tag = match.group(0)
        # إذا كان يحتوي على text-center مسبقاً، لا نفعل شيء
        if 'text-center' in full_tag:
            return full_tag
        # إذا كان يحتوي على className، نضيف text-center
        if 'className="' in full_tag:
            return full_tag.replace('className="', 'className="text-center ')
        # إذا لم يكن يحتوي على className، نضيفها
        else:
            return full_tag.replace('<TableHead', '<TableHead className="text-center"')
    
    content = re.sub(
        r'<TableHead[^>]*>',
        add_center_to_tablehead,
        content
    )
    
    # Pattern 2: <th>...</th>
    def add_center_to_th(match):
        full_tag = match.group(0)
        if 'text-center' in full_tag:
            return full_tag
        if 'className="' in full_tag:
            return full_tag.replace('className="', 'className="text-center ')
        else:
            return full_tag.replace('<th', '<th className="text-center"')
    
    content = re.sub(
        r'<th[^>]*>',
        add_center_to_th,
        content
    )
    
    return content

def process_file(file_path: Path) -> bool:
    """معالجة ملف واحد"""
    try:
        # قراءة المحتوى
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        # تطبيق الإصلاحات
        modified_content = original_content
        modified_content = fix_rtl_direction(modified_content)
        modified_content = center_table_headers(modified_content)
        
        # التحقق من وجود تغييرات
        if modified_content != original_content:
            # حفظ المحتوى المعدل
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(modified_content)
            print(f"✅ تم تعديل: {file_path.relative_to(PROJECT_ROOT)}")
            return True
        else:
            print(f"⏭️  لا يحتاج تعديل: {file_path.relative_to(PROJECT_ROOT)}")
            return False
    
    except Exception as e:
        print(f"❌ خطأ في معالجة {file_path.relative_to(PROJECT_ROOT)}: {e}")
        return False

def main():
    """الدالة الرئيسية"""
    print("=" * 60)
    print("🔧 سكريبت إصلاح RTL وتوسيط رؤوس الأعمدة")
    print("=" * 60)
    print()
    
    modified_count = 0
    total_count = 0
    not_found_count = 0
    
    for file_rel_path in TARGET_FILES:
        file_path = PROJECT_ROOT / file_rel_path
        
        if not file_path.exists():
            print(f"⚠️  الملف غير موجود: {file_rel_path}")
            not_found_count += 1
            continue
        
        total_count += 1
        if process_file(file_path):
            modified_count += 1
    
    print()
    print("=" * 60)
    print(f"📊 النتائج:")
    print(f"   - الملفات الموجودة: {total_count}")
    print(f"   - الملفات المعدلة: {modified_count}")
    print(f"   - الملفات بدون تعديل: {total_count - modified_count}")
    print(f"   - الملفات غير الموجودة: {not_found_count}")
    print("=" * 60)

if __name__ == "__main__":
    main()
