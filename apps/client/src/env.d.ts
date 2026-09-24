declare const __VERSION__: string
declare const __BUILD__: string
declare const __PROTOCOL__: string // hash luật + gói tin (vite.config.ts): lệch với server thì tải bản mới

interface ImportMetaEnv {
  readonly VITE_SERVER_URL?: string // server khác origin (bản itch.io); rỗng: cùng origin
}
