/**
 * Version requirements, ported from `legacy/src/js/core/plugin.js` line for
 * line. `compareVersions` returns "v1 >= v2" rather than a three-way compare,
 * and a snapshot sorts below the release it precedes (`26.1.0-26w40a` is a
 * pre-release of `26.1.0`) — both quirks are part of the format plugins were
 * written against, so they are reproduced rather than corrected.
 */

export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
  build: string[];
  version: string;
}

const VERSION_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([\w.-]+))?(?:\+([\w.-]+))?$/;

export function parseVersion(version: string): ParsedVersion | null {
  const match = VERSION_RE.exec(version ?? "");
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] ? match[4].split(".") : [],
    build: match[5] ? match[5].split(".") : [],
    version,
  };
}

/** release = 3, `-rc` = 2, `-pre` = 1, anything else pre-release = 0. */
export function getVersionPriority(version: string): number {
  if (!version) return 0;
  const parsed = parseVersion(version);
  if (!parsed) return 0;
  const prerelease = parsed.prerelease[0];
  if (!prerelease) return 3;
  if (prerelease === "rc") return 2;
  if (prerelease === "pre") return 1;
  return 0;
}

export function isExactVersionMatch(v1: string, v2: string): boolean {
  const parsed1 = parseVersion(v1);
  const parsed2 = parseVersion(v2);
  if (!parsed1 || !parsed2) return false;
  if (parsed1.major !== parsed2.major || parsed1.minor !== parsed2.minor || parsed1.patch !== parsed2.patch) {
    return false;
  }
  const pre1 = parsed1.prerelease;
  const pre2 = parsed2.prerelease;
  if (pre1.length !== pre2.length) return false;
  if (pre1.length === 0) return true;
  return pre1[0] === pre2[0] && pre1[1] === pre2[1];
}

/** True when `v1` is the same version as `v2` or newer. */
export function compareVersions(v1: string, v2: string): boolean {
  const parsed1 = parseVersion(v1);
  const parsed2 = parseVersion(v2);
  if (!parsed1 || !parsed2) return false;
  if (parsed1.major !== parsed2.major) return parsed1.major >= parsed2.major;
  if (parsed1.minor !== parsed2.minor) return parsed1.minor >= parsed2.minor;
  if (parsed1.patch !== parsed2.patch) return parsed1.patch >= parsed2.patch;

  const priority1 = getVersionPriority(v1);
  const priority2 = getVersionPriority(v2);
  if (priority1 !== priority2) return priority1 >= priority2;
  if (parsed1.prerelease.length > 1 && parsed2.prerelease.length > 1) {
    return parsed1.prerelease[1] >= parsed2.prerelease[1];
  }
  return true;
}

/** `">=1.0.0"`, `"<2.0.0"`, `"=1.2.3"`, or several ranges separated by spaces. */
export function validateVersionRequirement(current: string, required: string): boolean {
  if (required.includes(" ")) {
    return required.split(" ").every((range) => validateVersionRequirement(current, range));
  }
  const operator = /^[>=<]+/.exec(required)?.[0] || ">=";
  const reqVersion = required.replace(/^[>=<]+/, "");
  switch (operator) {
    case "=":
      return isExactVersionMatch(current, reqVersion);
    case ">=":
      return compareVersions(current, reqVersion);
    case ">":
      return compareVersions(current, reqVersion) && !isExactVersionMatch(current, reqVersion);
    case "<":
      return !compareVersions(current, reqVersion);
    case "<=":
      return !compareVersions(current, reqVersion) || isExactVersionMatch(current, reqVersion);
    default:
      return compareVersions(current, reqVersion);
  }
}

/** `">=1.0.0 <2.0.0"` → `"大於等於 1.0.0 且 小於 2.0.0"`, for the error message. */
export function getVersionPrefixString(required: string): string {
  if (required.includes(" ")) {
    return required
      .split(" ")
      .map((range) => getVersionPrefixString(range))
      .join(" 且 ");
  }
  const operator = /^[>=<]+/.exec(required)?.[0] ?? ">=";
  const version = required.replace(/^[>=<]+/, "");
  const prefixMap: Record<string, string> = {
    "=": "等於",
    ">": "大於",
    ">=": "大於等於",
    "<": "小於",
    "<=": "小於等於",
  };
  return `${prefixMap[operator] || "大於等於"} ${version}`;
}
