#!/usr/bin/env python3
"""
سكريبت بسيط لإضافة المراجع مباشرة
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
print('سكريبت إضافة المراجع')
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

# إنشاء ملف SQL نظيف
sql_statements = []
now = int(time.time())

for ref in all_refs:
    category = category_map.get(ref.get('category', 'عام'), 'reference')
    title = ref['title'].replace("'", "''").replace('\\', '\\\\')
    content = ref['content'].replace("'", "''").replace('\\', '\\\\')
    source = ref.get('source', '').replace("'", "''").replace('\\', '\\\\')
    tags = ref.get('tags', '').replace("'", "''").replace('\\', '\\\\')
    
    sql = f"""INSERT INTO knowledge_documents (title, content, source, category, tags, isActive, createdAt, updatedAt) 
VALUES ('{title}', '{content}', '{source}', '{category}', '{tags}', 1, FROM_UNIXTIME({now}), FROM_UNIXTIME({now}));"""
    
    sql_statements.append(sql)

# حفظ في ملف واحد
with open('/home/ubuntu/waqf_ai_model/scripts/clean-import.sql', 'w', encoding='utf-8') as f:
    f.write('\n\n'.join(sql_statements))

print(f'✓ تم إنشاء ملف SQL نظيف: clean-import.sql')
print(f'  عدد الاستعلامات: {len(sql_statements)}')
print('\n' + '=' * 60)
print('يمكنك الآن استخدام webdev_execute_sql لتنفيذ الاستعلامات')
print('=' * 60)
