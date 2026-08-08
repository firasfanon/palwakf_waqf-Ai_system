#!/usr/bin/env python3
"""
سكريبت لتقسيم المراجع إلى دفعات صغيرة (10 مراجع لكل دفعة)
"""

import json
import time
import os

# قراءة ملفات المراجع
with open('/home/ubuntu/waqf_ai_model/scripts/basic_references.json', 'r', encoding='utf-8') as f:
    basic_refs = json.load(f)

with open('/home/ubuntu/waqf_ai_model/scripts/additional_references.json', 'r', encoding='utf-8') as f:
    additional_refs = json.load(f)

with open('/home/ubuntu/waqf_ai_model/research_data/knowledge_base.json', 'r', encoding='utf-8') as f:
    kb = json.load(f)

all_refs = basic_refs + additional_refs + kb['knowledge_documents']

print('=' * 60)
print('سكريبت تقسيم المراجع إلى دفعات')
print('=' * 60)
print(f'\nإجمالي المراجع: {len(all_refs)}')

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

# تقسيم إلى دفعات
batch_size = 10
batches = [all_refs[i:i + batch_size] for i in range(0, len(all_refs), batch_size)]

print(f'عدد الدفعات: {len(batches)}')
print(f'حجم كل دفعة: {batch_size} مراجع\n')

# إنشاء مجلد للدفعات
batch_dir = '/home/ubuntu/waqf_ai_model/scripts/batches'
os.makedirs(batch_dir, exist_ok=True)

# إنشاء ملف SQL لكل دفعة
now = int(time.time())

for batch_num, batch in enumerate(batches, 1):
    values_list = []
    
    for ref in batch:
        category = category_map.get(ref.get('category', 'عام'), 'reference')
        title = ref['title'].replace("'", "''").replace('\\', '\\\\').replace('\n', ' ')
        content = ref['content'].replace("'", "''").replace('\\', '\\\\')
        source = ref.get('source', '').replace("'", "''").replace('\\', '\\\\')
        tags = ref.get('tags', '').replace("'", "''").replace('\\', '\\\\')
        
        value = f"('{title}', '{content}', '{source}', '{category}', '{tags}', 1, FROM_UNIXTIME({now}), FROM_UNIXTIME({now}))"
        values_list.append(value)
    
    values_str = ',\n'.join(values_list)
    sql = f"""INSERT INTO knowledge_documents (title, content, source, category, tags, isActive, createdAt, updatedAt) 
VALUES 
{values_str};"""
    
    # حفظ في ملف
    batch_file = f'{batch_dir}/batch_{batch_num:02d}.sql'
    with open(batch_file, 'w', encoding='utf-8') as f:
        f.write(sql)
    
    print(f'✓ دفعة {batch_num:02d}: {len(batch)} مراجع -> {batch_file}')

print('\n' + '=' * 60)
print('اكتمل التقسيم!')
print('=' * 60)
print(f'المجلد: {batch_dir}')
print(f'عدد الملفات: {len(batches)}')
print('\nاستخدم webdev_execute_sql لتنفيذ كل ملف على حدة')
print('=' * 60)
