import { Suspense, lazy } from "react";
import "../../Admin-plantasy/src/index.css";

const AdminRoot = lazy(() => import("virtual:admin-root"));

export default function AdminShell() {
  return (
    <div className="min-h-screen font-['DM_Sans',system-ui,sans-serif] antialiased">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-neutral-100 text-neutral-600">
            Loading admin…
          </div>
        }
      >
        <AdminRoot />
      </Suspense>
    </div>
  );
}
