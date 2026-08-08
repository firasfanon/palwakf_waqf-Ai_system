PATCH v15 — Fix remaining white background in Admin (STRICT)

Problem:
- index.css forces background on html/body/#root using !important.
- This overrides admin gradient background and leaves admin looking white.

Fix (SAFE):
- Update ONLY: client/src/styles/admin.css
- Adds:
  1) body.admin-scope background with !important
  2) body.admin-scope #root background: transparent !important
  3) Ensures light/dark admin backgrounds also use !important

MANUS INSTRUCTIONS (DO EXACTLY):
1) Copy/overwrite: client/src/styles/admin.css
2) Restart dev server.
3) Verify:
   - /#/admin/dashboard background shows admin identity (NOT pure white)
   - Toggle dark/light: backgrounds change accordingly.
