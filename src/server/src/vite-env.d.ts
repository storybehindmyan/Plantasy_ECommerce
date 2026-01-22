/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DELHIVERY_API_KEY: string
  readonly VITE_USE_MOCK_DELIVERY?: string
  readonly VITE_DELHIVERY_CLIENT_WAREHOUSE?: string
  // add other VITE_* vars here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
