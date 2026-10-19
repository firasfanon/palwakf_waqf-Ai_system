import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(process.cwd());

function read(relative: string) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function walk(dir: string): string[] {
  const absolute = path.join(root, dir);
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(rel) : [rel];
  });
}

describe("DESIGN-ARCH-001 architecture fitness", () => {
  it("keeps direct database mutations and infrastructure imports out of the router layer", () => {
    const source = read("server/routers.ts");
    expect(source).not.toMatch(/\bdb\.(?:insert|update|delete|select)\s*\(/);
    expect(source).not.toMatch(/from\s+["']\.\/infrastructure\//);
  });

  it("keeps the primary router below the DESIGN-ARCH-001 decomposition budget", () => {
    const source = read("server/routers.ts");
    const lines = source.split(/\r?\n/).length;
    expect(lines).toBeLessThan(4000);
    expect(source).toContain("./application/adminOperationsService");
  });

  it("keeps application orchestration free of presentation/provider SDK dependencies", () => {
    const source = read("server/application/adminOperationsService.ts");
    expect(source).not.toContain("@trpc/server");
    expect(source).not.toContain("@supabase/supabase-js");
    expect(source).not.toMatch(/\bcreateClient\s*\(/);
  });

  it("keeps Supabase SDK and query syntax in infrastructure adapters", () => {
    const runtimeRepository = read("server/runtimeRepository.ts");
    const clientAdapter = read("server/infrastructure/supabase/assistantRuntimeClient.ts");
    const dataAdapter = read("server/infrastructure/supabase/assistantDataAdapter.ts");
    const port = read("server/ports/assistantDataPort.ts");

    expect(runtimeRepository).not.toContain("@supabase/supabase-js");
    expect(runtimeRepository).not.toMatch(/\bcreateClient\s*\(/);
    expect(runtimeRepository).not.toMatch(/\.from\s*\(\s*["']/);
    expect(runtimeRepository).not.toMatch(/\.rpc\s*\(\s*["']/);

    expect(clientAdapter).toContain("@supabase/supabase-js");
    expect(clientAdapter).toMatch(/\bcreateClient\s*\(/);
    expect(dataAdapter).toContain("implements AssistantDataPort");
    expect(dataAdapter).toMatch(/\.from\s*\(/);
    expect(port).toContain("export interface AssistantDataPort");
  });

  it("prevents direct client business access through the Supabase adapter", () => {
    const clientFiles = walk("client/src").filter((file) => /\.(?:ts|tsx)$/.test(file));
    const importers = clientFiles.filter((file) => {
      if (file.replace(/\\/g, "/").endsWith("integrations/supabase/client.ts")) return false;
      const source = read(file);
      return /integrations\/supabase\/client|from\s+["'][^"']*supabase\/client["']/.test(source);
    });
    expect(importers).toEqual([]);
  });

  it("binds the governed Design System catalog and rejects generic admin placeholders", () => {
    const registry = read("client/src/config/adminRegistryV2.ts");
    expect(registry).toContain("/admin/design-system");
    expect(registry).toContain("DesignSystemCatalog");
    expect(registry).not.toContain('lifecycle: "stub_page"');
    expect(registry).not.toContain("React.createElement(ComingSoon");
    expect(registry).toContain("Routes are admitted only when an explicit component is bound");
  });

  it("keeps platform-neutral token source, DTCG metadata, and generated artifacts present", () => {
    const tokenSources = [
      "design-system/tokens/core/color.json",
      "design-system/tokens/core/dimension.json",
      "design-system/tokens/semantic/light.json",
      "design-system/tokens/components/status.json",
    ];
    const generated = [
      "client/src/styles/generated-design-tokens.css",
      "client/src/lib/designTokens.generated.ts",
    ];
    for (const file of [...tokenSources, ...generated]) {
      expect(fs.existsSync(path.join(root, file))).toBe(true);
    }

    const schemaKey = String.fromCharCode(36) + "schema";
    for (const file of tokenSources) {
      const tokenDoc = JSON.parse(read(file));
      expect(Object.prototype.hasOwnProperty.call(tokenDoc, "")).toBe(false);
      expect(tokenDoc[schemaKey]).toBe(
        "https://www.designtokens.org/schemas/2025.10/format.json",
      );
    }
  });
});
