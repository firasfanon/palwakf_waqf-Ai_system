import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("WAQF_AI accessibility and responsive contracts", () => {
  it("provides live loading feedback for lazy route boundaries", () => {
    const app = read("client/src/App.tsx");
    const registry = read("client/src/config/adminRegistryV2.ts");
    expect(app).toContain('role="status"');
    expect(app).toContain('aria-live="polite"');
    expect(registry).toContain('"aria-live": "polite"');
  });

  it("governed catalog has an explicit accessible name", () => {
    const source = read("client/src/pages/admin/DesignSystemCatalog.tsx");
    expect(source).toContain('aria-labelledby="design-system-title"');
    expect(source).toContain('aria-label="أقسام نظام التصميم"');
  });

  it("responsive table overflow is bounded within its own shell", () => {
    const css = read("client/src/styles/design-system.css");
    expect(css).toContain(".ds-responsive-table-shell");
    expect(css).toContain("overflow-x: auto");
    expect(css).toContain("max-width: 100%");
  });

  it("deferred product surface is explicit and not presented as complete", () => {
    const source = read("client/src/pages/admin/MustakshifAiPage.tsx");
    expect(source).toContain("مؤجل بقرار منتج");
    expect(source).toContain("لا ينفذ");
  });
});
