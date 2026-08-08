# قواعد تفسير أدلة الاكتشاف

## لا يثبت أي عنصر بمفرده مسار النشر

- وجود `vercel.json` يثبت مرشح Vercel فقط، لا أنه النشر الحالي.
- وجود `Dockerfile` يثبت قابلية حاوية فقط، لا اسم البيئة المنشورة.
- وجود Git remote لا يثبت أن CI/CD ينشر تلقائيًا.
- وجود مفاتيح `.env` لا يثبت أن قيمها محملة في Staging.
- وجود كلمة `staging` في ملف لا يثبت عنوان Staging أو صلاحية النشر.

## شهادة النشر لا تصدر إلا عند وجود خمس فئات من الأدلة

```text
1. provider / hosting identity
2. remote staging URL
3. actual deployment path or workflow
4. environment key mapping without secret values
5. rollback target and operator procedure
```

قبل ذلك تكون النتيجة:

```text
DISCOVERY_EVIDENCE_COLLECTED_NOT_DEPLOYMENT_CERTIFIED
```
