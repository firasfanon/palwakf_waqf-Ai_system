import { describe, expect, it } from "vitest";
import {
  redirectTargetFromHybridAddress,
  routePathFromHybridTarget,
} from "../client/src/lib/hybridLocationPath";

describe("hybrid location redirect preservation", () => {
  it("preserves history-routing deep links during auth bootstrap", () => {
    expect(
      redirectTargetFromHybridAddress("", "/chat", "", false),
    ).toBe("/chat");
    expect(
      redirectTargetFromHybridAddress("", "/knowledge-base/42", "?tab=evidence", false),
    ).toBe("/knowledge-base/42?tab=evidence");
  });

  it("preserves hash-routing deep links when hash mode is active", () => {
    expect(
      redirectTargetFromHybridAddress("#/chat?mode=deep", "/knowledge", "", true),
    ).toBe("/chat?mode=deep");
  });

  it("keeps route matching path-only after a preserved redirect target", () => {
    expect(routePathFromHybridTarget("/chat?mode=deep")).toBe("/chat");
  });
});