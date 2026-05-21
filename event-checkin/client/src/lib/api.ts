function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

const configuredApiOrigin = trimTrailingSlash(
  (import.meta.env.VITE_API_ORIGIN || "").trim()
);
const baseUrl = import.meta.env.BASE_URL || "/";
const basePrefix = baseUrl === "/" ? "" : trimTrailingSlash(baseUrl);
const relativeApiBase = `${basePrefix}/api`;

export const apiBase = configuredApiOrigin
  ? `${configuredApiOrigin}/api`
  : relativeApiBase;

export function apiPath(path: string): string {
  return `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;
}
