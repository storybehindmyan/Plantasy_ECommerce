import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

type Result = { status: "idle" | "loading" | "ok" | "error"; data?: any; ms?: number };

const Badge = ({ status }: { status: Result["status"] }) => {
  const map = {
    idle: "bg-gray-100 text-gray-500",
    loading: "bg-yellow-100 text-yellow-700 animate-pulse",
    ok: "bg-green-100 text-green-700",
    error: "bg-red-100 text-red-700",
  };
  const label = { idle: "—", loading: "Checking…", ok: "✓ Pass", error: "✗ Fail" };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status]}`}>
      {label[status]}
    </span>
  );
};

export default function DeliveryTest() {
  const [pincode, setPincode] = useState("533001");
  const [verifyResult, setVerifyResult] = useState<Result>({ status: "idle" });
  const [quoteResult, setQuoteResult] = useState<Result>({ status: "idle" });

  async function runVerify() {
    setVerifyResult({ status: "loading" });
    const t0 = Date.now();
    try {
      const res = await fetch(`${API_URL}/api/shipping/verify/${pincode}`);
      const data = await res.json();
      setVerifyResult({ status: data.available ? "ok" : "error", data, ms: Date.now() - t0 });
    } catch (e: any) {
      setVerifyResult({ status: "error", data: { error: e.message }, ms: Date.now() - t0 });
    }
  }

  async function runQuote() {
    setQuoteResult({ status: "loading" });
    const t0 = Date.now();
    try {
      const res = await fetch(`${API_URL}/api/shipping/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pincode,
          items: [{ productId: "test-product", quantity: 1 }],
        }),
      });
      const data = await res.json();
      const ok = res.ok && data.serviceable !== false;
      setQuoteResult({ status: ok ? "ok" : "error", data, ms: Date.now() - t0 });
    } catch (e: any) {
      setQuoteResult({ status: "error", data: { error: e.message }, ms: Date.now() - t0 });
    }
  }

  async function runAll() {
    await runVerify();
    await runQuote();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Delhivery Integration Test</h1>
          <p className="text-sm text-gray-500 mt-1">
            API target: <code className="bg-gray-100 px-1 rounded">{API_URL || "(same origin)"}</code>
          </p>
        </div>

        {/* PIN input */}
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <label className="block text-sm font-semibold text-gray-700">Test PIN Code</label>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              className="border rounded-lg px-3 py-2 text-sm w-36 font-mono focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="533001"
            />
            <button
              onClick={runAll}
              className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-800 transition"
            >
              Run All Tests
            </button>
          </div>
        </div>

        {/* Test 1 — PIN Verify */}
        <TestCard
          title="1. PIN Serviceability"
          endpoint={`GET /api/shipping/verify/${pincode}`}
          result={verifyResult}
          onRun={runVerify}
          fields={
            verifyResult.data && [
              { label: "Available", value: String(verifyResult.data.available) },
              { label: "Serviceable", value: String(verifyResult.data.serviceable) },
              { label: "PIN", value: verifyResult.data.pincode },
            ]
          }
        />

        {/* Test 2 — Shipping Quote */}
        <TestCard
          title="2. Shipping Quote"
          endpoint="POST /api/shipping/quote"
          result={quoteResult}
          onRun={runQuote}
          fields={
            quoteResult.data && [
              { label: "Serviceable", value: String(quoteResult.data.serviceable) },
              { label: "Courier", value: quoteResult.data.courier },
              { label: "Shipping Cost", value: quoteResult.data.shippingCost != null ? `₹${quoteResult.data.shippingCost}` : undefined },
              { label: "Estimated Delivery", value: quoteResult.data.estimatedDelivery },
              { label: "Service Type", value: quoteResult.data.serviceType },
              { label: "Dev Mode", value: quoteResult.data.devMode ? "⚠ Yes (no API key)" : undefined },
              { label: "Error", value: quoteResult.data.error },
            ]
          }
        />

        <p className="text-xs text-gray-400 text-center">
          Dev mode = no <code>DELHIVERY_API_KEY</code> set on backend. Real mode = live Delhivery API called.
        </p>
      </div>
    </div>
  );
}

function TestCard({
  title,
  endpoint,
  result,
  onRun,
  fields,
}: {
  title: string;
  endpoint: string;
  result: Result;
  onRun: () => void;
  fields?: { label: string; value?: string }[] | null | false;
}) {
  return (
    <div className="bg-white rounded-xl border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-800">{title}</h2>
          <code className="text-xs text-gray-400">{endpoint}</code>
        </div>
        <div className="flex items-center gap-3">
          {result.ms != null && (
            <span className="text-xs text-gray-400">{result.ms}ms</span>
          )}
          <Badge status={result.status} />
          <button
            onClick={onRun}
            disabled={result.status === "loading"}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50"
          >
            Run
          </button>
        </div>
      </div>

      {fields && (
        <div className="border-t pt-3 grid grid-cols-2 gap-y-1.5 gap-x-4 text-sm">
          {fields
            .filter((f) => f.value != null && f.value !== "undefined")
            .map((f) => (
              <div key={f.label} className="flex gap-2">
                <span className="text-gray-500 shrink-0">{f.label}:</span>
                <span className="font-medium text-gray-800 break-all">{f.value}</span>
              </div>
            ))}
        </div>
      )}

      {result.status === "error" && result.data?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 font-mono break-all">
          {result.data.error}
        </div>
      )}

      {result.data && (
        <details className="text-xs">
          <summary className="text-gray-400 cursor-pointer hover:text-gray-600">Raw response</summary>
          <pre className="mt-2 bg-gray-50 rounded-lg p-3 overflow-auto text-gray-600 max-h-48">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
