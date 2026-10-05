/**
 * 擴充功能 — the extension host, started from `features/index.ts`.
 *
 * V3 created its plugin loader before any feature module (`index/require.js`
 * ran `createPluginLoader('index')` first); the same order is kept here so a
 * plugin subscribed to `DataRts` hears the session's first frame.
 *
 * Loading is asynchronous because the plugin tree is a Rust call. Nothing here
 * blocks the app: a plugin that fails to load is a row in 設定 → 擴充 that says
 * so, never a boot that stops.
 */
import { createLogger } from "@/lib/logger";

import { createPluginLoader } from "./host";

const log = createLogger("plugin");

export function initPlugins(): void {
  const loader = createPluginLoader("index");
  loader.load().catch((e: unknown) => {
    log.error(`擴充功能載入失敗：${String(e)}`);
  });
}

export { createPluginLoader, pluginLoader, PluginLoader, getSensitivityDescription } from "./host";
export type { PluginContext } from "./host";
export { MixinManager } from "./mixin";
export type { LoadedPlugin, PluginEntry, PluginInfo } from "./types";
