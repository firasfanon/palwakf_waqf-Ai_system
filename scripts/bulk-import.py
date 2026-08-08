#!/usr/bin/env python3
"""
سكريبت لإضافة جميع المراجع دفعة واحدة باستخدام INSERT متعدد
"""

import json
import time

# قراءة ملفات المراجع
with open('/home/ubuntu/waqf_ai_model/scripts/basic_references.json', 'r', encoding='utf-8') as f:
    basic_refs = json.load(f)

with open('/home/ubuntu/waqf_ai_model/scripts/additional_references.json', 'r', encoding='utf-8') as f:
    additional_refs = json.load(f)

with open('/home/ubuntu/waqf_ai_model/research_data/knowledge_base.json', 'r', encoding='utf-8') as f:
    kb = json.load(f)

all_refs = basic_refs + additional_refs + kb['knowledge_documents']

print('=' * 60)
print('سكريبت إضافة المراجع دفعة واحدة')
print('=' * 60)
print(f'\nإجمالي المراجع: {len(all_refs)}\n')

# تحويل الفئات
category_map = {
    'قانوني': 'law',
    'فقهي': 'jurisprudence',
    'مجلة الأحكام العدلية': 'majalla',
    'تاريخي': 'historical',
    'إداري': 'administrative',
    'مرجع': 'reference',
    'عام': 'reference'
}

# إنشاء استعلام INSERT متعدد
now = int(time.time())
values_list = []

for ref in all_refs:
    category = category_map.get(ref.get('category', 'عام'), 'reference')
    title = ref['title'].replace("'", "''").replace('\\', '\\\\').replace('\n', ' ')
    content = ref['content'].replace("'", "''").replace('\\', '\\\\')
    source = ref.get('source', '').replace("'", "''").replace('\\', '\\\\')
    tags = ref.get('tags', '').replace("'", "''").replace('\\', '\\\\')
    
    value = f"('{title}', '{content}', '{source}', '{category}', '{tags}', 1, FROM_UNIXTIME({now}), FROM_UNIXTIME({now}))"
    values_list.append(value)

# إنشاء استعلام واحد كبير
values_str = ',\n'.join(values_list)
sql = f"""INSERT INTO knowledge_documents (title, content, source, category, tags, isActive, createdAt, updatedAt) 
VALUES 
{values_str};"""

# حفظ في ملف
with open('/home/ubuntu/waqf_ai_model/scripts/bulk-import.sql', 'w', encoding='utf-8') as f:
    f.write(sql)

print(f'✓ تم إنشاء ملف SQL للإضافة الجماعية: bulk-import.sql')
print(f'  عدد المراجع: {len(values_list)}')
print(f'  حجم الملف: {len(sql) / 1024:.2f} KB')
print('\n' + '=' * 60)
print('استخدم هذا الاستعلام مع webdev_execute_sql')
print('=' * 60)
