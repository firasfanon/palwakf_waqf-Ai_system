#!/usr/bin/env python3
"""
سكريبت توحيد الهوية البصرية
================================
يقوم هذا السكريبت بتطبيق الهوية البصرية من الصفحة الرئيسية على جميع صفحات الموقع
بما في ذلك:
- الألوان والتدرجات
- الأزرار والبطاقات
- التباعد والحواف
- Breadcrumbs في الصفحات الإدارية
"""

import os
import re
from pathlib import Path

# الألوان والتدرجات من الصفحة الرئيسية
BRAND_COLORS = {
    # الخلفيات
    "bg_gradient": "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900",
    "header_gradient": "bg-gradient-to-r from-emerald-600 to-teal-600",
    "card_gradient": "bg-gradient-to-br from-white/80 to-emerald-50/50",
    
    # الألوان الأساسية
    "primary_color": "emerald-600",
    "secondary_color": "teal-600",
    "accent_color": "cyan-500",
    
    # ألوان النصوص
    "text_gradient": "bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent",
    "text_primary": "text-emerald-700 dark:text-emerald-400",
    "text_secondary": "text-teal-700 dark:text-teal-400",
}

# أنماط الأزرار
BUTTON_STYLES = {
    "primary": "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300",
    "secondary": "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white",
    "outline": "border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-400",
}

# أنماط البطاقات
CARD_STYLES = {
    "default": "rounded-xl border border-emerald-100 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300",
    "elevated": "rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30 shadow-2xl",
}

def find_all_tsx_files(base_path: str) -> list[Path]:
    """البحث عن جميع ملفات TSX في المشروع"""
    pages_dir = Path(base_path) / "client" / "src" / "pages"
    components_dir = Path(base_path) / "client" / "src" / "components"
    
    tsx_files = []
    for directory in [pages_dir, components_dir]:
        if directory.exists():
            tsx_files.extend(directory.rglob("*.tsx"))
    
    return tsx_files

def apply_background_gradient(content: str) -> str:
    """تطبيق تدرج الخلفية على الصفحات"""
    # البحث عن div رئيسي بـ min-h-screen
    pattern = r'<div className="min-h-screen([^"]*)"'
    replacement = f'<div className="min-h-screen {BRAND_COLORS["bg_gradient"]}"'
    
    # إذا كان يحتوي على bg- أخرى، نستبدلها
    if re.search(r'min-h-screen.*bg-', content):
        content = re.sub(
            r'<div className="min-h-screen\s+bg-[^"]*"',
            replacement,
            content
        )
    else:
        content = re.sub(pattern, replacement, content)
    
    return content

def apply_header_gradient(content: str) -> str:
    """تطبيق تدرج العناوين"""
    # البحث عن h1 وتطبيق التدرج
    pattern = r'<h1 className="([^"]*)"'
    
    def replace_h1(match):
        classes = match.group(1)
        # إزالة أي text-* موجود
        classes = re.sub(r'text-\S+', '', classes)
        # إضافة التدرج
        if "bg-gradient" not in classes:
            classes += f" {BRAND_COLORS['text_gradient']}"
        return f'<h1 className="{classes.strip()}"'
    
    content = re.sub(pattern, replace_h1, content)
    return content

def apply_card_styles(content: str) -> str:
    """تطبيق أنماط البطاقات"""
    # تحديث Card components
    pattern = r'<Card([^>]*)>'
    
    def replace_card(match):
        attrs = match.group(1)
        # إذا لم يكن يحتوي على className، نضيفه
        if 'className=' not in attrs:
            return f'<Card className="{CARD_STYLES["default"]}">'
        return match.group(0)
    
    content = re.sub(pattern, replace_card, content)
    return content

def add_breadcrumbs_to_admin_pages(content: str, file_path: Path) -> str:
    """إضافة Breadcrumbs للصفحات الإدارية"""
    # التحقق من أن الملف في مجلد admin أو يبدأ بـ Admin
    if "admin" not in str(file_path).lower() and not file_path.stem.startswith("Admin"):
        return content
    
    # التحقق من وجود Breadcrumbs
    if "Breadcrumbs" in content:
        return content
    
    # إضافة import
    if "import Breadcrumbs" not in content:
        # البحث عن آخر import
        imports = re.findall(r'^import .+;$', content, re.MULTILINE)
        if imports:
            last_import = imports[-1]
            new_import = 'import Breadcrumbs from "@/components/Breadcrumbs";'
            content = content.replace(last_import, f"{last_import}\n{new_import}")
    
    # إضافة Breadcrumbs component في بداية المحتوى
    # البحث عن أول div رئيسي
    pattern = r'return \(\s*<div([^>]*)>'
    
    def add_breadcrumbs(match):
        div_attrs = match.group(1)
        page_name = file_path.stem.replace("Admin", "").replace("Manage", "")
        breadcrumbs = f'''return (
    <div{div_attrs}>
      <Breadcrumbs items={{[
        {{ label: 'لوحة التحكم', href: '/admin/dashboard' }},
        {{ label: '{page_name}' }},
      ]}} />
      '''
        return breadcrumbs
    
    if re.search(pattern, content) and "<Breadcrumbs" not in content:
        content = re.sub(pattern, add_breadcrumbs, content, count=1)
    
    return content

def apply_branding_to_file(file_path: Path) -> bool:
    """تطبيق الهوية البصرية على ملف واحد"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # تطبيق التحسينات
        content = apply_background_gradient(content)
        content = apply_header_gradient(content)
        content = apply_card_styles(content)
        content = add_breadcrumbs_to_admin_pages(content, file_path)
        
        # حفظ الملف إذا تم التعديل
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
    
    except Exception as e:
        print(f"❌ خطأ في معالجة {file_path}: {e}")
        return False

def main():
    """الدالة الرئيسية"""
    print("🎨 بدء توحيد الهوية البصرية...")
    print("=" * 60)
    
    base_path = "/home/ubuntu/waqf_ai_model"
    
    # البحث عن جميع ملفات TSX
    tsx_files = find_all_tsx_files(base_path)
    print(f"📁 تم العثور على {len(tsx_files)} ملف TSX")
    
    # تطبيق الهوية البصرية
    modified_count = 0
    for file_path in tsx_files:
        if apply_branding_to_file(file_path):
            print(f"✅ تم تحديث: {file_path.relative_to(base_path)}")
            modified_count += 1
    
    print("=" * 60)
    print(f"✨ تم تحديث {modified_count} ملف من أصل {len(tsx_files)}")
    print("🎉 اكتمل توحيد الهوية البصرية!")
    
    # ملخص التغييرات
    print("\n📋 ملخص التغييرات:")
    print("  • تطبيق تدرجات الخلفية (emerald-teal)")
    print("  • تطبيق تدرجات العناوين")
    print("  • توحيد أنماط البطاقات")
    print("  • إضافة Breadcrumbs للصفحات الإدارية")

if __name__ == "__main__":
    main()
