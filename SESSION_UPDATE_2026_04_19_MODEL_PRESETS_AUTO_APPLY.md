# Session Update — Model Presets Auto Apply

## What changed
- Selecting an LLM model from the list now auto-applies its dependent values inside Admin System Settings.
- Auto-applied values include:
  - provider
  - base URL
  - API key
  - timeout
- Known presets:
  - qwen2.5:3b
  - qwen2.5:7b
  - llama3.2:3b
- Heuristic presets also apply for other Ollama models by size suffix like :3b / :7b / :14b / :32b.

## Files changed
- client/src/pages/AdminSystemSettings.tsx

## Scope
This batch only closes automatic value binding for the selected model. Multi-assistant profiles remain a later phase.
