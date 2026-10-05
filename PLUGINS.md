# 擴充功能開發

擴充功能（以前叫「插件」）讓你用 JavaScript 替 TREM-Lite 加上自己的功能 —— 自訂面板、額外的通知管道、把資料送到自己的伺服器，或改寫介面上既有的行為。

擴充功能**只在桌面版執行**。網頁版沒有檔案系統，設定裡的「擴充」頁只會說明這件事。

格式沿用 TREM-Lite 3（Electron 版）的擴充功能，欄位名稱、狀態文字與兩種進入點寫法都沒有改變，所以既有的擴充功能可以直接放進來。

## 快速開始

1. 在擴充功能資料夾底下建一個資料夾，名稱只能用小寫字母、數字與連字號（例如 `my-panel`）。
2. 在裡面放 `info.json` 與 `index.js`。
3. 打開 TREM-Lite 的 **設定 → 擴充**，啟用它。

擴充功能資料夾的位置（設定頁的「開啟資料夾」可以直接打開）：

| 系統 | 路徑 |
|---|---|
| Windows | `%APPDATA%\com.exptech.trem-lite\plugins` |
| macOS | `~/Library/Application Support/com.exptech.trem-lite/plugins` |
| Linux | `~/.config/com.exptech.trem-lite/plugins` |

最小的 `info.json`：

```json
{
  "name": "my-panel",
  "version": "1.0.0",
  "description": "在地圖旁邊加一個自己的面板",
  "author": "你的名字"
}
```

`index.js` 有兩種寫法，兩種都可以用。

**類別**：建構時拿到 `ctx`，載入完成後呼叫 `onLoad`。

```js
module.exports = class MyPanel {
  constructor(ctx) {
    this.ctx = ctx;
  }

  async onLoad() {
    this.ctx.logger.info("你好，TREM-Lite");
  }
};
```

**函式**：呼叫時拿到 `ctx`，函式回傳後才觸發 `load`。

```js
module.exports = (ctx) => {
  ctx.on("load", () => {
    ctx.logger.info("你好，TREM-Lite");
  });

  ctx.on("ReportRelease", (ans) => {
    ctx.logger.info(`地震報告 ${ans.data.id}`);
  });
};
```

`load` 是保留事件，代表「這個擴充功能已經準備好了」，不會被綁到應用程式的事件匯流排上。

## `info.json`

| 欄位 | 型別 | 說明 |
|---|---|---|
| `name` | string | **必填**，同時是資料夾名稱。只允許小寫字母、數字與連字號。 |
| `version` | string | 版本，供其他擴充功能的相依性比對。 |
| `description` | string | 一行說明，顯示在設定頁。 |
| `author` | string | 作者。含 `ExpTechTW` 且簽章有效時才會自動啟用。 |
| `loader` | string[] | 要載入到哪些視窗，預設 `["index"]`（主視窗）。 |
| `auto-enable` | boolean | 首次看到就啟用。只有**簽章有效**且 `author` 含 `ExpTechTW` 才生效。 |
| `dependencies` | object | 見下面的「相依性」。 |
| `sensitivity` | object | `{ "level": 0-4, "description": "..." }`，作者自行宣告，顯示在設定頁。 |

其他欄位會原樣保留，可以放自己的設定。

## `ctx`

擴充功能拿到的 `ctx` 物件：

| 成員 | 說明 |
|---|---|
| `ctx.logger` | 寫進應用程式日誌的 logger（`trace`/`debug`/`info`/`warn`/`error`）。 |
| `ctx.Logger` | `getLogger(scope)` 取得其他範圍的 logger，`getInstance()` 取得預設的那個。 |
| `ctx.events` | 應用程式的事件匯流排，等於 `ctx.TREM.variable.events`。 |
| `ctx.on(event, handler)` | 註冊事件。載入成功後才會真的接到匯流排上。 |
| `ctx.TREM` | 見下面的「`TREM`」。 |
| `ctx.MixinManager` | 注入既有方法，見下面的「`MixinManager`」。 |
| `ctx.utils.path` | Node 的 `path`（POSIX 語意，分隔字元是 `/`）。 |
| `ctx.utils.fs` | 記憶體中的 `fs`，見下面的「檔案系統」。 |
| `ctx.require(id)` | 載入自己資料夾裡的模組，見下面的「模組」。 |
| `ctx.maplibregl` | MapLibre GL 的模組，用來加圖層或事件。 |
| `ctx.info.name` | 這個擴充功能的名稱。 |
| `ctx.info.pluginDir` | 擴充功能資料夾的**根目錄**（`/plugins`），與舊版相同。 |
| `ctx.info.originalPath` | 同上。 |

### `TREM`

| 成員 | 說明 |
|---|---|
| `TREM.variable` | 即時資料：`data`（`rts`、`intensity`、`report`、`eew`、`lpgm`）、`map`、`station`、`time`、`play_mode`、`replay`、`tts`、`cache`，以及 `events`。 |
| `TREM.constant` | 共用常數：`COLOR`、`URL`（`API`、`LB`、`REPLAY`）、`HTTP_TIMEOUT`、`EEW_AUTHOR`、`REPORT_LIMIT`、`MAP`、`SHOW_REPORT`、`INTENSITY_LIST`。 |
| `TREM.class.AudioManager` | 播放音效。 |

讀 `TREM.variable.data.rts` 拿到的是當下的物件，會由應用程式持續更新；不要在載入時把它存起來。

### `MixinManager`

改寫既有方法的行為：

```js
const id = ctx.MixinManager.inject(SomeClass, "someMethod", function () {
  // 這段原始碼會被插進 someMethod 裡面，
  // 可以讀到它的參數、區域變數與 this
  ctx.logger.info(this.someProperty);
}, "start");
```

`inject(targetClass, methodName, handler, position)` 的 `position` 可以是 `"start"`、`"end"`（預設）或行號（方法主體的第幾行，從 1 開始）。`remove(methodName, id)` 還原，`clear(methodName)` 移除全部。回傳的 `id` 是 `Symbol`。

注入是**文字層級**的：handler 的**函式主體**會被拼進方法的原始碼，再用 `new Function` 重建整個方法，所以 handler 不是在一個獨立的閉包裡被呼叫，也沒有 `next` 可以呼叫原方法。目標方法必須是一般函式（`toString()` 讀得出參數與大括號），箭頭函式或類別簡寫會在注入時擲出錯誤。

### `TREM.variable.events` 與 `ctx.on`

兩者都是同一個 `mitt` 匯流排。`ctx.events.emit(name, payload)` 可以自己發事件給其他擴充功能。

## 事件

每個事件的 payload 多半是 `{ data, ... }`。`DataRts` 的 `data` 可能是 `null`（重置）。

| 事件 | `data` |
|---|---|
| `MapLoad` | 無 |
| `FocusLockChange` | `boolean` |
| `EewDisplayUpdate` | 無 |
| `InternetErrorChange` | `boolean` |
| `UpdateReady` | 版本字串 |
| `MainWindowHidden` | `boolean` |
| `DataRts` | `RtsData \| null` |
| `DataModeReset` | 無 |
| `EewRelease` / `EewUpdate` / `EewEnd` / `EewAlert` / `EewCancel` | `EewData` |
| `EewNewAreaAlert` | `{ city_alert_list: string[] }` |
| `IntensityRelease` / `IntensityUpdate` | `{ id, max, area }` |
| `IntensityEnd` | — |
| `LpgmRelease` | `{ id, time, list }` |
| `ReportRelease` | `ReportListItem`（修訂時多一個 `update: true`） |
| `ReportSpeechEnd` | `{ id }` |
| `ReportListUpdate` | 無 |
| `ReplayStateChange` | `{ active, reportId? }` |
| `RtsPga1` / `RtsPga2` / `RtsShindo0` / `RtsShindo1` / `RtsShindo2` | 無 |
| `TsunamiRelease` | — |

## 檔案系統

擴充功能看到的是**記憶體中的虛擬目錄**，根目錄是 `/plugins`，鏡射磁碟上的實際內容：

- 讀取是同步的（`fs.readFileSync`），內容在啟動時一次讀進來。
- 寫入會轉送到 Rust，一次一個檔案。`fs.writeFileSync`、`appendFileSync`、`unlinkSync`、`rmSync`、`mkdirSync`、`copyFileSync`、`renameSync` 都支援。
- 相對路徑以**自己的資料夾**為基準：`fs.readFileSync("config.yml")` 讀的是 `<自己的資料夾>/config.yml`。`ctx.info.pluginDir` 仍然是根目錄，所以舊版的 `path.join(ctx.info.pluginDir, ctx.info.name, ...)` 也照樣可用。
- 只能寫自己資料夾裡的檔案，寫到別的擴充功能會被拒絕。
- `fs-extra` 的 `readJsonSync` / `writeJsonSync` / `outputJsonSync`、`fs.promises` 與 `existsSync`、`statSync`、`readdirSync` 都在。
- `fs.watch` 是空殼（不會有事件）；`fs.createReadStream` / `createWriteStream` 會擲出錯誤，請改用同步版本。
- `path` 是 POSIX 語意：分隔字元固定是 `/`。

## 模組

用 `require` 或 `ctx.require` 載入自己資料夾裡的檔案，支援 `.js`、`.cjs`、`.json` 與 `index.js`：

```js
const { helper } = ctx.require("./lib/helper");
const other = ctx.require("../other-plugin/util"); // 另一個擴充功能
```

**可以**用：`path`、`fs`、`fs-extra`、`buffer`、`process`、`events`、`util`、`os`、`url`、`crypto`。

**不可以用**，會拿到明確的錯誤訊息：

| 模組 | 訊息 |
|---|---|
| `electron`、`@electron/remote` | 擴充功能不能使用 Electron API。 |
| `child_process` | 擴充功能不能啟動其他程式。 |
| `worker_threads` | 擴充功能不能建立 worker。 |
| `net` / `http` / `https` / `axios` | 擴充功能不能直接開 socket，請改用 `fetch`。 |
| 其他 npm 套件 | 擴充功能不能載入 npm 套件，請改用相對路徑或 `ctx.require`。 |

抓網路資料請用標準的 `fetch`，並以 `ctx.TREM.constant.URL` 取得官方端點。

## 相依性

```json
{
  "dependencies": {
    "trem": ">= 26.1.0",
    "other-plugin": ">= 1.2.0"
  }
}
```

`trem` 比對的是應用程式版本，其他鍵是**其他擴充功能的名稱**。支援 `>=`、`<=`、`>`、`<`、`==`，也可以用空白分隔多個條件。條件不成立時擴充功能不會載入，設定頁會顯示原因。

載入順序會依相依性排序，被依賴的會先載入。

## 敏感度

`info.json` 的 `sensitivity.level` 只是作者自行的宣告，用來讓使用者知道這個擴充功能會碰什麼：

| 等級 | 說明 |
|---|---|
| 4 | 極高敏感度 - 包含系統核心 API 存取權限 |
| 3 | 高敏感度 - 包含注入或檔案系統存取權限 |
| 2 | 中等敏感度 - 包含事件權限 |
| 1 | 低敏感度 - 包含日誌/元數據存取權限 |
| 0 | 無敏感操作 |

沒填 `description` 時，設定頁會用上表的文字。

## 簽章與發布

未簽章的擴充功能可以安裝，但設定頁會標示「未驗證」，啟用前要等 10 秒的確認倒數。

簽章沿用舊版的格式：對每個檔案的內容做 SHA-256，把「相對路徑 → 雜湊」的物件用 RSA-SHA256 簽起來。簽章工具在 `tool/plugin/sign.mjs`：

```bash
node tool/plugin/sign.mjs ./my-panel --key private.pem
node tool/plugin/sign.mjs ./my-panel --key private.pem --key-id my-key
```

幾個必須知道的細節：

- 雜湊前會先把換行統一成 `\n`（CRLF 與 CR 都會轉換），所以 Git 的換行設定不影響簽章。
- 簽的是 `JSON.stringify(fileHashes)` 這串文字，鍵的順序是簽章的一部分。
- 開頭是 `.` 的檔案／資料夾、`signature.json` 與 `trem.json` 不算在簽章裡。
- 產生出來的 `signature.json` 有 `fileHashes`、`signature` 與可選的 `keyId`。
- `keyId` 省略或填 `official` 時使用 ExpTech 的官方金鑰；其他值會對應到 `<設定資料夾>/plugin-keys/<keyId>.pem`，讓第三方用自己的金鑰簽章。使用者要自己放入對應的公開金鑰。

打包成 `.trem`（就是一個 zip，`info.json` 在壓縮檔根目錄或往下一層都可以；`__MACOSX/` 與 `.DS_Store` 會被忽略）後，可以拖進設定頁的「安裝」區塊。安裝會**整包取代**既有的同名擴充功能 —— 舊版殘留的檔案會讓下一次簽章檢查回報多餘的檔案。

簽章工具本身有自我測試：

```bash
bun tool/plugin/selftest.ts
```

它會產生一組免洗金鑰與範例擴充功能，驗證「簽完可以通過驗證」、「改一個字會被抓到」、「多一個檔案會被抓到」、「金鑰順序會被檢查」等情況。

## 與 TREM-Lite 3 的差異

- **沒有 Electron**：`electron` 與 `@electron/remote` 都不能用，視窗控制請改用 `ctx.TREM` 或設定頁。
- **沒有 Node 的網路模組**：`http`、`https`、`net` 都不可用，請用 `fetch`。
- **`TREM.class` 只剩 `AudioManager`**：舊版還有 `DataManager`、`ReportManager`、`FocusManager`、`EewAreaManager`、`BoxManager`、`ReplayControler`、`WindowControler`，這些工作在 v4 由 Rust 與 `packages/core/src/features/` 負責，資料請從 `TREM.variable` 與事件取得。
- **`ctx.info.name` 是新增的**：不用再從 `info.pluginDir` 推自己的名字。
- **`require` 只認相對路徑與內建模組**：不會再去 Node 的解析路徑裡找套件。
