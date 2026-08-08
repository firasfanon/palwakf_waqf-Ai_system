#!/usr/bin/env python3
"""
سكريبت لجمع المراجع من المصادر المجانية وإضافتها إلى قاعدة المعرفة
"""

import json
import requests
from bs4 import BeautifulSoup
import time
from typing import List, Dict
import re

# قائمة المصادر من المكتبة الشاملة
SHAMELA_BOOKS = [
    {"id": 308, "title": "مدونة أحكام الوقف الفقهية"},
    {"id": 384, "title": "الفقه الإسلامي وأدلته"},
    {"id": 433, "title": "موسوعة المفاهيم الإسلامية العامة"},
    {"id": 11811, "title": "الملخص الفقهي"},
    {"id": 17094, "title": "مقاصد الشريعة الإسلامية"},
    {"id": 7377, "title": "فقه المعاملات"},
    {"id": 6369, "title": "الفقه المنهجي على مذهب الإمام الشافعي"},
    {"id": 5913, "title": "الفقه الميسر"},
    {"id": 8502, "title": "مجلة الأحكام العدلية"},
    {"id": 5423, "title": "المبسوط للسرخسي"},
    {"id": 21744, "title": "فتح القدير لابن الهمام"},
]

def fetch_shamela_book(book_id: int) -> str:
    """جلب محتوى كتاب من المكتبة الشاملة"""
    url = f"https://shamela.ws/book/{book_id}"
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"خطأ في جلب الكتاب {book_id}: {e}")
        return ""

def extract_waqf_sections(html_content: str, book_title: str) -> List[Dict]:
    """استخراج الأقسام المتعلقة بالوقف من محتوى الكتاب"""
    soup = BeautifulSoup(html_content, 'html.parser')
    references = []
    
    # البحث عن الأقسام التي تحتوي على كلمات مفتاحية متعلقة بالوقف
    keywords = ['الوقف', 'الأوقاف', 'الموقوف', 'الواقف', 'التحبيس', 'التسبيل']
    
    # استخراج النصوص
    paragraphs = soup.find_all(['p', 'div', 'section'])
    
    current_section = ""
    current_content = []
    
    for para in paragraphs:
        text = para.get_text(strip=True)
        if not text:
            continue
            
        # التحقق من وجود كلمات مفتاحية
        if any(keyword in text for keyword in keywords):
            if len(text) > 50:  # تجاهل النصوص القصيرة جداً
                current_content.append(text)
                
                # إذا وصل المحتوى إلى حجم معقول، احفظه كمرجع
                if len(current_content) >= 3:
                    content = "\n\n".join(current_content)
                    if len(content) > 200:  # على الأقل 200 حرف
                        references.append({
                            "title": f"{book_title} - {extract_section_title(current_content[0])}",
                            "content": content,
                            "source": f"https://shamela.ws/book/{book_id}",
                            "category": "فقهي",
                            "tags": "الوقف، الفقه الإسلامي، " + book_title
                        })
                        current_content = []
    
    return references

def extract_section_title(text: str) -> str:
    """استخراج عنوان القسم من النص"""
    # محاولة استخراج أول جملة أو عنوان
    lines = text.split('\n')
    for line in lines:
        line = line.strip()
        if line and len(line) < 100:
            return line
    
    # إذا لم نجد عنوان مناسب، استخدم أول 50 حرف
    return text[:50] + "..."

def collect_all_references() -> List[Dict]:
    """جمع جميع المراجع من المصادر"""
    all_references = []
    
    print("بدء جمع المراجع من المكتبة الشاملة...")
    
    for book in SHAMELA_BOOKS:
        print(f"\nجلب الكتاب: {book['title']} (ID: {book['id']})")
        
        html_content = fetch_shamela_book(book['id'])
        if html_content:
            references = extract_waqf_sections(html_content, book['title'])
            all_references.extend(references)
            print(f"  ✓ تم استخراج {len(references)} مرجع")
        
        # انتظار قصير لتجنب الحظر
        time.sleep(2)
    
    return all_references

def save_references(references: List[Dict], filename: str):
    """حفظ المراجع في ملف JSON"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(references, f, ensure_ascii=False, indent=2)
    print(f"\n✓ تم حفظ {len(references)} مرجع في {filename}")

def main():
    """الدالة الرئيسية"""
    print("=" * 60)
    print("سكريبت جمع المراجع من المصادر المجانية")
    print("=" * 60)
    
    # جمع المراجع
    references = collect_all_references()
    
    # حفظ النتائج
    output_file = "/home/ubuntu/waqf_ai_model/scripts/collected_references.json"
    save_references(references, output_file)
    
    print("\n" + "=" * 60)
    print(f"اكتمل الجمع! المجموع: {len(references)} مرجع")
    print("=" * 60)

if __name__ == "__main__":
    main()
