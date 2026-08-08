# تشغيل PalWakf محلياً عبر Ollama

## الإعدادات
ضع القيم التالية في `.env`:

```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_API_KEY=ollama
OLLAMA_MODEL=llama3.2
```

## أوامر Ollama
```powershell
ollama pull llama3.2
ollama run llama3.2
```

## تشغيل المشروع
```powershell
pnpm check
pnpm exec tsx watch server/_core/index.ts
```

إذا أردت نموذجاً آخر لاحقاً، غيّر `OLLAMA_MODEL` فقط.
