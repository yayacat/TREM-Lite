/**
 * The extension contract, carried over from the Electron build
 * (`legacy/src/js/core/plugin.js`) so extensions written for TREM-Lite 3 keep
 * working. Field names, status strings and both loader styles are the published
 * V3 format: changing any of them would break every plugin already in the wild,
 * so this file describes what exists rather than what would be tidier.
 */

/** `info.json` — the manifest every plugin ships. */
export interface PluginInfo {
  name: string;
  version: string;
  description?: string;
  author?: string;
  /** Which host this plugin runs in; `index` is the main window. */
  loader?: string[];
  /** Enable on first sight. Honoured only for a verified ExpTechTW plugin. */
  "auto-enable"?: boolean;
  /** `trem` is the host's version; every other key is another plugin's name. */
  dependencies?: Record<string, string>;
  /** What the plugin touches, as declared by its author. */
  sensitivity?: { level?: number; description?: string };
  [key: string]: unknown;
}

/** `signature.json` — written by `tool/plugin/sign.mjs`. */
export interface PluginSignature {
  /** Relative POSIX path → SHA-256 hex of the LF-normalised text. */
  fileHashes: Record<string, string>;
  /** RSA-SHA256 over `JSON.stringify(fileHashes)`, base64. */
  signature: string;
  /** A key in `<app_config_dir>/plugin-keys`; `official` or absent = ExpTech. */
  keyId?: string;
}

/** One file as Rust hands it over: base64, because assets are not text. */
export interface PluginFile {
  path: string;
  data: string;
}

/** One installed plugin directory, as returned by `plugin_list`. */
export interface PluginDir {
  name: string;
  files: PluginFile[];
}

/** A trusted signing key, from `plugin_keys`. */
export interface PluginKey {
  id: string;
  pem: string;
}

export interface VerifyResult {
  valid: boolean;
  error?: string;
  keyId?: string;
}

/** What went wrong with one plugin, shown in the 擴充 page. */
export interface PluginStatus {
  type: "ok" | "warn" | "error";
  msg: string;
}

/** One row of the 擴充 page. */
export interface PluginEntry {
  name: string;
  info: PluginInfo;
  /** The directory still exists on disk (false = installed but deleted). */
  present: boolean;
  /** `signature.json` is absent, or does not match the files. */
  verified: boolean;
  /** Why verification failed, verbatim as V3 reported it. */
  verifyError?: string;
  keyId?: string;
  enabled: boolean;
  /** The plugin's code ran without throwing. */
  loaded: boolean;
  status: PluginStatus | null;
  sensitivity: { level: number; description: string };
  /** The plugin ships a `config.yml` (V3 offered a YAML editor for it). */
  hasConfig: boolean;
}

/** The shape persisted under `loaded-plugins`, read by tooling and V3 alike. */
export interface LoadedPlugin {
  name: string;
  version: string;
  description?: string;
  author?: string;
  ctxDependencies: string[];
  sensitivity: { level: number; description: string };
}
