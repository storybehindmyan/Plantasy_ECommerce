/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DELHIVERY_API_KEY: string
  readonly VITE_RAZORPAY_KEY_ID: string
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "virtual:admin-root" {
  import type { FC } from "react";
  const AdminRoot: FC;
  export default AdminRoot;
}
