import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("WAQF_AI Design System client contracts", () => {
  it("exposes semantic status tokens and utilities", () => {
    const css = read("client/src/styles/design-system.css");
    for (const token of ["status-success", "status-warning", "status-danger", "status-info"]) {
      expect(css).toContain(`--color-${token}`);
    }
  });

  it("status badge never relies on color alone", () => {
    const source = read("client/src/components/ui/status-badge.tsx");
    expect(source).toContain('role="status"');
    expect(source).toContain('aria-hidden="true"');
    expect(source).toContain("<span>{children}</span>");
  });

  it("catalog exercises RTL and isolated LTR evidence identifiers", () => {
    const source = read("client/src/pages/admin/DesignSystemCatalog.tsx");
    expect(source).toContain('dir="rtl"');
    expect(source).toContain('dir="ltr"');
    expect(source).toContain("designTokens");
    expect(source).toContain("ds-responsive-table-shell");
  });

  it("public and admin routes use lazy boundaries", () => {
    expect(read("client/src/App.tsx")).toContain("React.lazy");
    expect(read("client/src/config/adminRegistryV2.ts")).toContain("function lazyPage");
  });
});
