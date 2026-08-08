import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const assert = (condition, message) => {
  if (!condition) {
    console.error(`FAIL :: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS :: ${message}`);
  }
};

const layout = read('client/src/components/admin/AdminLayoutV2.tsx');
const sidebar = read('client/src/components/admin/AdminSidebarV2.tsx');
const css = read('client/src/styles/admin.css');
const packageJson = JSON.parse(read('package.json'));

assert(layout.includes('useIsMobile') && layout.includes('mobileNavigationOpen'), 'admin layout tracks viewport and mobile navigation state');
assert(layout.includes('<Sheet open={mobileNavigationOpen}') && layout.includes('admin-mobile-navigation-sheet'), 'admin layout renders an accessible mobile navigation sheet');
assert(layout.includes('AdminSidebarV2 variant="mobile"') && layout.includes('AdminSidebarV2 variant="desktop"'), 'desktop and mobile sidebar variants are intentionally separated');
assert(layout.includes('aria-label="فتح قائمة الإدارة"') && layout.includes('aria-controls="admin-mobile-navigation"'), 'mobile menu trigger exposes an accessible control contract');
assert(sidebar.includes('variant?: "desktop" | "mobile"') && sidebar.includes('onNavigate?: () => void'), 'sidebar exposes controlled desktop/mobile and close-on-navigation contracts');
assert(sidebar.includes('admin-sidebar-mobile') && sidebar.includes('admin-sidebar-desktop'), 'sidebar emits explicit shell variant classes');
assert(sidebar.includes('onClick={() => onNavigate?.()}'), 'mobile navigation closes after a route selection');
assert(css.includes('.admin-sidebar-desktop') && css.includes('display: none !important'), 'desktop sidebar is removed from handset layout flow');
assert(css.includes('.admin-mobile-navigation-sheet') && css.includes('width: min(88vw, 22rem)'), 'mobile navigation sheet has a bounded handset width');
assert(css.includes('.admin-content') && css.includes('max-width: 100vw'), 'admin content cannot exceed handset viewport width');
assert(css.includes('[data-slot="dialog-content"]') && css.includes('max-width: calc(100vw - 1rem)'), 'dialogs and sheets are bounded on handset viewports');
assert(packageJson.scripts['verify:admin-shell-mobile'] === 'node scripts/verify-admin-shell-mobile-responsiveness.mjs', 'package script exposes the mobile shell verifier');

if (process.exitCode) process.exit(process.exitCode);
console.log('MEGA_BATCH_ADMIN_SHELL_MOBILE_RESPONSIVENESS_STATIC_VERIFICATION=PASS');
