/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DELHIVERY_API_KEY: string
  // add other VITE_* vars if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
