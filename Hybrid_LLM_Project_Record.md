# Hybrid LLM Provider Settings — Project Record

## Status
Adopted and approved as the current direction for the local AI assistant stack.

## Core Decision
The assistant will use a **hybrid LLM provider approach** instead of hardwiring a single provider.

### Provider priority
1. Admin/System Settings
2. `.env` fallback
3. Safe fallback with clear error message if the provider is not configured

## Supported provider modes
- `ollama`
- `openai_compatible`
- `disabled`

## Required settings
- `llm_provider`
- `llm_base_url`
- `llm_api_key`
- `llm_model`
- `llm_timeout_seconds`
- `llm_enabled`

## Current architectural rule
Chat and Knowledge must not be tied to Manus or any Manus product.

## Local sovereign storage rule
Temporary sovereign local settings storage path:
- `.palwakf/runtime/local_runtime_store.json`

This path replaces any older runtime path linked to `.manus/...`.

## Administrative UI direction
Hybrid LLM settings are managed from the Admin/System Settings page and should support:
- Provider selection
- Base URL
- API key
- Model name
- Timeout
- Connection test button
- Clear status feedback

## Runtime behavior
`invokeLLM()` should resolve configuration in this order:
1. Admin settings
2. Environment variables
3. Clear failure message if configuration is missing or invalid

## Current intended default for local development
### Ollama
- Base URL: `http://127.0.0.1:11434`
- Suggested model for Arabic-first practical testing: `qwen2.5:3b`
- Heavier alternative: `qwen2.5:7b`

## Practical operating notes
- `ollama pull ...` can be run from any terminal location and does not need to be run from the website folder.
- If `.env` is changed, the server should be fully restarted.
- The chat system should expose provider/config errors clearly instead of failing silently.

## Current next-step workflow
1. Open `/admin/system-settings`
2. Configure the LLM provider
3. Run provider connection test
4. Save settings
5. Test Chat
6. Verify Knowledge + Chat integration

## Governance note
This is a project-level operational decision and should be treated as the active baseline until replaced by a newer approved record.
