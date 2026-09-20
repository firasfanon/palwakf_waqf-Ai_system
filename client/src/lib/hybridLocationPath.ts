export function normalizeHybridTarget(rawTarget: string): string {
  const raw = String(rawTarget || "");
  const hashIndex = raw.indexOf("#");
  const afterHash = hashIndex >= 0 ? raw.slice(hashIndex + 1) : raw;
  const cleanTarget = (afterHash.split("#")[0] || "/").trim();
  return cleanTarget.startsWith("/") ? cleanTarget : `/${cleanTarget}`;
}

export function routePathFromHybridTarget(rawTarget: string): string {
  const normalized = normalizeHybridTarget(rawTarget);
  const queryIndex = normalized.indexOf("?");
  const pathOnly = queryIndex >= 0
    ? normalized.slice(0, queryIndex)
    : normalized;

  return pathOnly.trim() || "/";
}

export function redirectTargetFromHybridAddress(
  hashValue: string,
  pathnameValue: string,
  searchValue: string,
  hashRoutingEnabled: boolean,
): string {
  if (hashRoutingEnabled) {
    const hash = String(hashValue || "");
    const hashWithoutPrefix = hash.startsWith("#") ? hash.slice(1) : hash;
    return normalizeHybridTarget(hashWithoutPrefix || "/");
  }

  const pathname = String(pathnameValue || "/").trim() || "/";
  const search = String(searchValue || "");
  const target = `${pathname.startsWith("/") ? pathname : `/${pathname}`}${search.startsWith("?") ? search : ""}`;
  return normalizeHybridTarget(target);
}

export function queryStringFromHybridAddress(
  hashValue: string,
  searchValue: string,
): string {
  const hash = String(hashValue || "");
  const hashWithoutPrefix = hash.startsWith("#") ? hash.slice(1) : hash;
  const queryIndex = hashWithoutPrefix.indexOf("?");

  if (queryIndex >= 0) {
    return hashWithoutPrefix.slice(queryIndex + 1).split("#")[0] || "";
  }

  const search = String(searchValue || "");
  return search.startsWith("?") ? search.slice(1) : search;
}

export function queryParamFromHybridAddress(
  hashValue: string,
  searchValue: string,
  key: string,
): string | null {
  const query = queryStringFromHybridAddress(hashValue, searchValue);
  return new URLSearchParams(query).get(key);
}
