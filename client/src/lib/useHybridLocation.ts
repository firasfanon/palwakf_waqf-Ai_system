import { getAppHref } from "@/const";
import { useEffect, useState } from "react";
import type { Path } from "wouter";
import {
  normalizeHybridTarget,
  routePathFromHybridTarget,
} from "./hybridLocationPath";

function getHashPath(): string {
  const hash = window.location.hash || "";
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  return routePathFromHybridTarget(raw || "/");
}

export function useHybridLocation(): [Path, (to: Path, opts?: { replace?: boolean }) => void] {
  const envFlag = String(import.meta.env.VITE_FORCE_HASH_ROUTING || "").trim();
  const hasHashPath =
    (window.location.hash || "").startsWith("#/") ||
    (window.location.hash || "").startsWith("#/admin");
  const useHash =
    envFlag === "1" ||
    envFlag.toLowerCase() === "true" ||
    hasHashPath;

  const [path, setPath] = useState<Path>(() => {
    return useHash
      ? getHashPath()
      : routePathFromHybridTarget(window.location.pathname || "/");
  });

  useEffect(() => {
    if (!useHash) {
      const onPop = () => {
        setPath(routePathFromHybridTarget(window.location.pathname || "/"));
      };

      window.addEventListener("popstate", onPop);
      return () => window.removeEventListener("popstate", onPop);
    }

    const onHash = () => setPath(getHashPath());

    window.addEventListener("hashchange", onHash);
    setPath(getHashPath());

    return () => window.removeEventListener("hashchange", onHash);
  }, [useHash]);

  const navigate = (to: Path, opts?: { replace?: boolean }) => {
    const urlTarget = normalizeHybridTarget(String(to));
    const routePath = routePathFromHybridTarget(urlTarget);

    if (!useHash) {
      if (opts?.replace) {
        window.history.replaceState(null, "", urlTarget);
      } else {
        window.history.pushState(null, "", urlTarget);
      }

      setPath(routePath);
      window.dispatchEvent(new PopStateEvent("popstate"));
      return;
    }

    const targetUrl = getAppHref(urlTarget);

    if (opts?.replace) {
      window.history.replaceState(null, "", targetUrl);
    } else {
      window.history.pushState(null, "", targetUrl);
    }

    setPath(routePath);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };

  return [path, navigate];
}
