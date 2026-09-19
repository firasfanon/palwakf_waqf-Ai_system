# WAQF AI Haseki Sultan Benchmark — PASS Evidence

Date: 2026-09-19
Branch: `task/WAQF-AI-REAL-INTELLIGENCE-PRODUCT-ACTIVATION-V1`

## Benchmark question

هل تنطبق المادة الثانية من قانون الأراضي العثماني على وقف خاصكي سلطان إذا اعتُبر وقف تخصيصات؟ وما الدليل على طبيعة إنشائه؟

## Hardware reconciliation

New hardware detected:
- NVIDIA GeForce GTX 1050
- VRAM: 2048 MiB
- NVIDIA driver/CUDA available on host
- Hardware fingerprint now includes GPU identity and VRAM
- Previous capability cache invalidated through cache version/fingerprint change

Observed local model capability after reconciliation:
- `qwen2.5:3b`: usable, mixed CPU/GPU, workload bucket 1024, ~17.27 eval tok/s, ~327 prompt tok/s
- `llama3.2:3b`: usable, mixed CPU/GPU, workload bucket 1024, ~16.91 eval tok/s, ~332 prompt tok/s

Runtime tier remains `constrained`, with partial-GPU-aware timeout budget of 45s.

## Evidence path

PASS chain:

`4 authoritative/scholarly sources -> Structural Extraction -> Verbatim Verification -> Legal-role Classification -> Semantic Retention -> 1089-char Evidence Pack -> Structured Legal Synthesis -> Citation Audit -> Semantic Answer Audit`

Content-bearing sources:
1. Maqam — Ottoman Land Code 1858
2. Maqam — Jerusalem Appeal 96/2017
3. Maqam — Cassation 1543/2016
4. University of California eScholarship — Haseki Sultan endowment deed / waqfiyya, 958 AH / 1552 CE

Evidence pack:
- 4 sources
- required legal/historical distinctions retained
- party-argument leak: false
- source coverage: 1,2,3,4
- compact pack size: 1089 characters

## Final synthesis strategy

Mode: `structured_legal_sections`

Deterministic evidence rendering is used for propositions that can be safely rendered directly from verified claims:
- Article 2 scope
- Article 4 / takhsisat controlling rule
- historical date statement

LLM synthesis is reserved for the entity-application statement where controlled inference/qualification is required.

Models used by the successful run:
- deterministic_evidence
- deterministic_evidence
- deterministic_evidence
- qwen2.5:3b

This is intentional: deterministic-first synthesis minimizes legal hallucination while preserving LLM use for the part that actually requires linguistic/legal qualification.

## Successful answer

المادة (2): الأراضي المملوكة أربعة أنواع: الأول: العرصات الواقعة داخل القرى والقصبات وما في دائرها من الأراضي لغاية نصف دونم مما يعتبر تتمة للسكن. [مصدر خارجي 1]

المادة (4): وقف التخصيصات(الوقف غير الصحيح)، فهو عبارة عن تخصيص منافع لقطعة مفرزة من الاراضي الاميرية مثل اعشارها ورسومها الاميرية لجهة ما من طرف السلاطين أو بإذنهم لجهة خيرية مع بقاء رقبتها لبيت المال. [مصدر خارجي 1] [مصدر خارجي 3]

التطبيق على الوقف محل السؤال: أ) السند يثبت أن اسم الأرض أو الوقف هو وقف خاسكي سلطان. ب) لا يمكن إثبات كونها وقف تخصيصات من هذا المقتطف وحده. [مصدر خارجي 2]

الدليل التاريخي: الوقفية (waqfiyya) المذكورة في المصدر مؤرخة 958هـ/1552م. [مصدر خارجي 4]

## Acceptance audits

Citation Audit:
- valid: true
- cited external sources: 1,3,2,4
- invalid tokens: none
- missing required external: none
- uncited source count: 0

Semantic Answer Audit:
- valid: true
- missing: none
- conflations: none

End-to-end elapsed time on the successful run:
- ~14.72 seconds
- external evidence ready: ~8.12 seconds
- evidence pack ready: ~8.52 seconds
- controlled Qwen synthesis: ~5.99 seconds

## Regression gates

Targeted test suite:
- `server/evidenceDistillation.test.ts`
- `server/legalEvidenceSynthesis.test.ts`
- `server/researchOrchestrator.test.ts`

Result:
- 3 test files PASS
- 11 tests PASS
- TypeScript `tsc --noEmit` PASS
- `git diff --check` PASS

## Decision

`HASEKI_BENCHMARK = PASS`

`CURRENT_LAST_BLOCKER = CLOSED`

The system now demonstrates the required legal-research path for this benchmark without:
- inventing Article 2 content,
- transferring Article 4 rules into Article 2,
- treating party grounds as court reasoning,
- asserting that the Haseki registry label alone proves takhsisat classification,
- conflating the 2014 settlement record with the 1552 historical waqfiyya.

This PASS does not mean all Waqf AI legal workloads are certified. It certifies this benchmark pattern and the associated structural/evidence/synthesis gates.
