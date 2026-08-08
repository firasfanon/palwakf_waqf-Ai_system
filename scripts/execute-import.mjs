#!/usr/bin/env node
/**
 * سكريبت لتنفيذ استعلامات الإضافة واحداً تلو الآخر
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// قراءة ملف SQL
const sqlContent = readFileSync(join(__dirname, 'final-import.sql'), 'utf-8');

// تقسيم الاستعلامات (كل استعلام ينتهي بـ ;)
const statements = sqlContent
  .split(/;\s*\n\s*\n/)
  .filter(stmt => stmt.trim().length > 0)
  .map(stmt => stmt.trim() + ';');

console.log('='.repeat(60));
console.log('تنفيذ استعلامات الإضافة');
console.log('='.repeat(60));
console.log(`عدد الاستعلامات: ${statements.length}\n`);

// حفظ الاستعلامات في ملفات منفصلة للتنفيذ
for (let i = 0; i < Math.min(10, statements.length); i++) {
  const stmt = statements[i];
  console.log(`\n--- استعلام ${i + 1} ---`);
  console.log(stmt.substring(0, 200) + '...\n');
}

console.log('\n' + '='.repeat(60));
console.log('الاستعلامات جاهزة للتنفيذ');
console.log('='.repeat(60));
console.log(`إجمالي: ${statements.length} استعلام`);
