import fs from "node:fs";
import path from "node:path";

const evidenceDir = "D:\\PALWAKF_DEV_WORKSPACE\\07_EVIDENCE_STAGING\\WAQF_AI_DESIGN_ARCH_001_20261019";
fs.mkdirSync(evidenceDir, { recursive: true });

async function openPage() {
  const res = await fetch("http://127.0.0.1:9223/json/new?http://localhost:3101/%23/", { method: "PUT" });
  if (!res.ok) throw new Error("Failed to create CDP page: " + res.status);
  return await res.json();
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.events = [];
  }
  async ready() {
    if (this.ws.readyState !== WebSocket.OPEN) {
      await new Promise((resolve, reject) => {
        this.ws.addEventListener("open", resolve, { once: true });
        this.ws.addEventListener("error", reject, { once: true });
      });
    }
    this.ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const item = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? item.reject(new Error(JSON.stringify(msg.error))) : item.resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  take(method) {
    const found = this.events.filter((e) => e.method === method);
    this.events = this.events.filter((e) => e.method !== method);
    return found;
  }
  close() { this.ws.close(); }
}

const routes = [
  { path: "/", marker: "PalWaqf" },
  { path: "/chat", marker: null },
  { path: "/knowledge-base", marker: null },
  { path: "/admin/design-system", marker: "نظام التصميم" },
  { path: "/admin/mustakshif-ai", marker: "مؤجل بقرار منتج" },
];
const viewports = [
  { label: "390", width: 390, height: 844, mobile: true },
  { label: "tablet", width: 768, height: 1024, mobile: true },
  { label: "desktop", width: 1440, height: 1000, mobile: false },
];

const page = await openPage();
const cdp = new CDP(page.webSocketDebuggerUrl);
await cdp.ready();
for (const domain of ["Page", "Runtime", "Log", "Accessibility"]) await cdp.send(domain + ".enable");

const results = [];
for (const vp of viewports) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: 1,
    mobile: vp.mobile,
  });

  for (const route of routes) {
    cdp.events = [];
    const target = "http://localhost:3101/#" + route.path;
    await cdp.send("Page.navigate", { url: target });

    let metrics = null;
    for (let attempt = 0; attempt < 12; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const evaluation = await cdp.send("Runtime.evaluate", {
        expression: `(() => {
          const de = document.documentElement;
          const body = document.body;
          const width = window.innerWidth;
          const scrollWidth = Math.max(de?.scrollWidth || 0, body?.scrollWidth || 0);
          const focusable = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')]
            .filter((el) => !el.disabled && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none');
          return {
            readyState: document.readyState,
            pathname: location.pathname,
            hash: location.hash,
            title: document.title,
            h1: document.querySelector('h1')?.textContent?.trim() || null,
            bodyText: body?.innerText?.trim()?.slice(0, 1200) || '',
            bodyTextLength: body?.innerText?.trim()?.length || 0,
            innerWidth: width,
            documentClientWidth: de?.clientWidth || 0,
            scrollWidth,
            horizontalOverflow: scrollWidth > width + 1,
            htmlDir: de?.dir || null,
            bodyDir: body?.dir || null,
            rtlRegions: document.querySelectorAll('[dir="rtl"]').length,
            ltrRegions: document.querySelectorAll('[dir="ltr"]').length,
            focusableCount: focusable.length,
            statusCount: document.querySelectorAll('[role="status"]').length,
            designSystemText: body?.innerText?.includes('نظام التصميم') || false,
            deferredText: body?.innerText?.includes('مؤجل بقرار منتج') || false
          };
        })()`,
        returnByValue: true,
      });
      metrics = evaluation.result.value;
      const markerOk = !route.marker || metrics.bodyText.includes(route.marker);
      if (metrics.readyState === "complete" && metrics.bodyTextLength > 20 && markerOk) break;
    }

    const ax = await cdp.send("Accessibility.getFullAXTree");
    const unnamedActionables = (ax.nodes || []).filter((node) => {
      const role = node.role?.value;
      const actionable = role === "button" || role === "link" || role === "textbox" || role === "combobox";
      return actionable && node.ignored !== true && !String(node.name?.value || "").trim();
    }).map((node) => ({ role: node.role?.value, backendDOMNodeId: node.backendDOMNodeId })).slice(0, 20);

    await cdp.send("Runtime.evaluate", { expression: "document.activeElement?.blur?.()" });
    const focusTrail = [];
    for (let i = 0; i < Math.min(5, metrics.focusableCount); i++) {
      await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
      await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
      const focus = await cdp.send("Runtime.evaluate", {
        expression: `(() => {
          const el = document.activeElement;
          if (!el) return null;
          return {
            tag: el.tagName,
            text: (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || '').trim().slice(0,80),
            id: el.id || null
          };
        })()`,
        returnByValue: true,
      });
      focusTrail.push(focus.result.value);
    }

    const shot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    const safe = route.path.replace(/^\//, "").replace(/[^a-zA-Z0-9_-]+/g, "-") || "home";
    const screenshot = path.join(evidenceDir, `uat_${vp.label}_${safe}.png`);
    fs.writeFileSync(screenshot, Buffer.from(shot.data, "base64"));

    const runtimeExceptions = cdp.take("Runtime.exceptionThrown").length;
    const errorLogs = cdp.take("Log.entryAdded")
      .filter((e) => e.params?.entry?.level === "error")
      .map((e) => String(e.params?.entry?.text || "")).slice(0, 10);
    const markerOk = !route.marker || metrics.bodyText.includes(route.marker);
    const routeOk = metrics.hash === "#" + route.path || (route.path === "/" && metrics.hash === "#/");

    const pass = metrics.readyState === "complete"
      && metrics.bodyTextLength > 20
      && routeOk
      && markerOk
      && !metrics.horizontalOverflow
      && unnamedActionables.length === 0
      && runtimeExceptions === 0
      && focusTrail.length > 0
      && focusTrail.some((item) => item?.tag && item.tag !== "BODY");

    results.push({
      viewport: vp,
      route: route.path,
      metrics: { ...metrics, bodyText: undefined },
      markerOk,
      routeOk,
      unnamedActionables,
      focusTrail,
      runtimeExceptions,
      errorLogs,
      screenshot,
      pass,
    });
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  routes: results.length,
  passed: results.filter((r) => r.pass).length,
  failed: results.filter((r) => !r.pass).length,
  mobile390: {
    total: results.filter((r) => r.viewport.label === "390").length,
    passed: results.filter((r) => r.viewport.label === "390" && r.pass).length,
  },
  tablet: {
    total: results.filter((r) => r.viewport.label === "tablet").length,
    passed: results.filter((r) => r.viewport.label === "tablet" && r.pass).length,
  },
  desktop: {
    total: results.filter((r) => r.viewport.label === "desktop").length,
    passed: results.filter((r) => r.viewport.label === "desktop" && r.pass).length,
  },
  results,
};
fs.writeFileSync(path.join(evidenceDir, "browser_uat.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
cdp.close();

if (summary.failed > 0) {
  console.error(`Browser UAT failed: ${summary.failed}/${summary.routes} route-viewport checks failed.`);
  process.exitCode = 1;
}
