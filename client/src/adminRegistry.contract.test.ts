import { describe, expect, it } from "vitest";
import { adminRegistrySections } from "@/config/adminRegistryV2";

describe("WAQF_AI admin registry productization contract", () => {
  it("requires every leaf route to bind an explicit component and lifecycle", () => {
    const violations: Array<{ title: string; href: string; reason: string }> = [];

    const visit = (item: any) => {
      if (item.children?.length) {
        item.children.forEach(visit);
        return;
      }
      if (!item.component) violations.push({ title: item.title, href: item.href, reason: "missing_component" });
      if (!item.lifecycle) violations.push({ title: item.title, href: item.href, reason: "missing_lifecycle" });
      if (!item.dataState) violations.push({ title: item.title, href: item.href, reason: "missing_data_state" });
      if (item.lifecycle === "stub_page") violations.push({ title: item.title, href: item.href, reason: "unclassified_stub" });
      if (item.lifecycle === "deferred" && !String(item.note || "").includes("مؤجل")) {
        violations.push({ title: item.title, href: item.href, reason: "deferred_without_explicit_note" });
      }
    };

    for (const section of adminRegistrySections) section.items.forEach(visit);
    expect(violations).toEqual([]);
  });

  it("keeps known deferred compatibility routes explicit", () => {
    const all = adminRegistrySections.flatMap((section) => section.items);
    const mustakshif = all.find((item: any) => item.href === "/admin/mustakshif-ai") as any;
    const billing = all.find((item: any) => item.href === "/admin/billing") as any;

    expect(mustakshif?.lifecycle).toBe("deferred");
    expect(billing?.lifecycle).toBe("deferred");
    expect(billing?.hidden).toBe(true);
  });
});
