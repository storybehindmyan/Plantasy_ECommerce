import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

const QUICK_PINS = [
  { pin: "533001", label: "Rajahmundry" },
  { pin: "500001", label: "Hyderabad" },
  { pin: "110001", label: "Delhi" },
  { pin: "400001", label: "Mumbai" },
  { pin: "560001", label: "Bengaluru" },
];

type TestStatus = "idle" | "loading" | "ok" | "error";
type Result = { status: TestStatus; data?: any; ms?: number };

const StatusBadge = ({ status }: { status: TestStatus }) => {
  const styles: Record<TestStatus, string> = {
    idle: "bg-gray-100 text-gray-500",
    loading: "bg-yellow-100 text-yellow-700 animate-pulse",
    ok: "bg-green-100 text-green-700",
    error: "bg-red-100 text-red-700",
  };
  const labels: Record<TestStatus, string> = { idle: "—", loading: "Checking…", ok: "✓ Pass", error: "✗ Fail" };
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

const ServiceBadge = ({ type }: { type: string }) =>
  type === "Express" ? (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
      ⚡ Express <span className="font-normal text-orange-500">(2–5 days)</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
      📦 Standard <span className="font-normal text-blue-500">(3–7 days)</span>
    </span>
  );

export default function DeliveryTest() {
  const [pincode, setPincode] = useState("533001");
  const [verifyResult, setVerifyResult] = useState<Result>({ status: "idle" });
  const [quoteResult, setQuoteResult] = useState<Result>({ status: "idle" });
  const [shipmentResult, setShipmentResult] = useState<Result>({ status: "idle" });
  const [running, setRunning] = useState(false);

  const [warehouse, setWarehouse] = useState({
    name: "", phone: "", address: "", city: "", state: "", pincode: "",
  });
  const [customer, setCustomer] = useState({
    name: "Test Customer", phone: "9000000000", address: "123 Test Street",
    city: "Hyderabad", state: "Telangana", pincode: "500001",
  });

  async function runShipment() {
    setShipmentResult({ status: "loading" });
    const t0 = Date.now();
    try {
      const res = await fetch(`${API_URL}/api/delhivery/test-shipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseName: warehouse.name,
          warehousePhone: warehouse.phone,
          warehouseAddress: warehouse.address,
          warehouseCity: warehouse.city,
          warehouseState: warehouse.state,
          warehousePincode: warehouse.pincode,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerAddress: customer.address,
          customerCity: customer.city,
          customerState: customer.state,
          customerPincode: customer.pincode,
        }),
      });
      const data = await res.json();
      setShipmentResult({ status: data.success || data.waybill ? "ok" : "error", data, ms: Date.now() - t0 });
    } catch (e: any) {
      setShipmentResult({ status: "error", data: { error: e.message }, ms: Date.now() - t0 });
    }
  }

  async function runVerify(pin = pincode) {
    setVerifyResult({ status: "loading" });
    const t0 = Date.now();
    try {
      const res = await fetch(`${API_URL}/api/shipping/verify/${pin}`);
      const data = await res.json();
      setVerifyResult({ status: data.available ? "ok" : "error", data, ms: Date.now() - t0 });
      return data.available as boolean;
    } catch (e: any) {
      setVerifyResult({ status: "error", data: { error: e.message }, ms: Date.now() - t0 });
      return false;
    }
  }

  async function runQuote(pin = pincode) {
    setQuoteResult({ status: "loading" });
    const t0 = Date.now();
    try {
      const res = await fetch(`${API_URL}/api/shipping/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode: pin, items: [{ productId: "test-product", quantity: 1 }] }),
      });
      const data = await res.json();
      setQuoteResult({ status: res.ok && data.serviceable !== false ? "ok" : "error", data, ms: Date.now() - t0 });
    } catch (e: any) {
      setQuoteResult({ status: "error", data: { error: e.message }, ms: Date.now() - t0 });
    }
  }

  async function runAll(pin = pincode) {
    setRunning(true);
    await runVerify(pin);
    await runQuote(pin);
    setRunning(false);
  }

  function selectPin(pin: string) {
    setPincode(pin);
    runAll(pin);
  }

  const q = quoteResult.data;
  const modeLabel = q?.devMode
    ? { text: "⚠ Dev Mode — no DELHIVERY_API_KEY on backend", cls: "bg-yellow-50 border-yellow-300 text-yellow-700" }
    : q?.serviceable
    ? { text: "✅ Live Mode — real Delhivery API", cls: "bg-green-50 border-green-300 text-green-700" }
    : null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🚚 Delhivery Test</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              API: <code className="bg-gray-100 px-1 rounded">{API_URL || "(same origin)"}</code>
            </p>
          </div>
          {modeLabel && (
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${modeLabel.cls}`}>
              {modeLabel.text}
            </span>
          )}
        </div>

        {/* PIN Input */}
        <div className="bg-white rounded-2xl border p-5 space-y-3">
          <label className="block text-sm font-semibold text-gray-700">PIN Code</label>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              className="border rounded-lg px-3 py-2 text-sm w-32 font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="533001"
            />
            <button
              onClick={() => runAll()}
              disabled={running || pincode.length !== 6}
              className="bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-800 transition disabled:opacity-50"
            >
              {running ? "Testing…" : "Run All Tests"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {QUICK_PINS.map(({ pin, label }) => (
              <button
                key={pin}
                onClick={() => selectPin(pin)}
                className={`text-xs px-3 py-1 rounded-full border transition font-mono ${
                  pincode === pin
                    ? "bg-green-700 text-white border-green-700"
                    : "bg-white text-gray-600 border-gray-300 hover:border-green-500"
                }`}
              >
                {pin} <span className="text-gray-400 font-sans">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Test 1 — Verify */}
        <div className="bg-white rounded-2xl border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">1. PIN Serviceability</h2>
              <code className="text-xs text-gray-400">GET /api/shipping/verify/{pincode}</code>
            </div>
            <div className="flex items-center gap-3">
              {verifyResult.ms != null && <span className="text-xs text-gray-400">{verifyResult.ms}ms</span>}
              <StatusBadge status={verifyResult.status} />
              <button onClick={() => runVerify()} disabled={verifyResult.status === "loading"}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50">
                Run
              </button>
            </div>
          </div>
          {verifyResult.data && (
            <div className="border-t pt-3 flex gap-6 text-sm">
              <div><span className="text-gray-500">Available: </span><b className={verifyResult.data.available ? "text-green-600" : "text-red-600"}>{String(verifyResult.data.available)}</b></div>
              <div><span className="text-gray-500">Serviceable: </span><b>{String(verifyResult.data.serviceable)}</b></div>
              <div><span className="text-gray-500">PIN: </span><b>{verifyResult.data.pincode}</b></div>
            </div>
          )}
          {verifyResult.status === "error" && verifyResult.data?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3">{verifyResult.data.error}</div>
          )}
        </div>

        {/* Test 2 — Quote */}
        <div className="bg-white rounded-2xl border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">2. Shipping Quote</h2>
              <code className="text-xs text-gray-400">POST /api/shipping/quote</code>
            </div>
            <div className="flex items-center gap-3">
              {quoteResult.ms != null && <span className="text-xs text-gray-400">{quoteResult.ms}ms</span>}
              <StatusBadge status={quoteResult.status} />
              <button onClick={() => runQuote()} disabled={quoteResult.status === "loading"}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50">
                Run
              </button>
            </div>
          </div>

          {q && quoteResult.status !== "idle" && (
            <>
              {/* Delivery Preview Card — matches CartDrawer UI */}
              {q.serviceable && (
                <div className="bg-gray-900 rounded-xl px-4 py-4 space-y-2">
                  <p className="text-xs text-green-400 uppercase tracking-wide font-semibold">Estimated Delivery</p>
                  <div className="flex items-center gap-2">
                    {q.serviceType && <ServiceBadge type={q.serviceType} />}
                    {q.devMode && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-300">⚠ Dev Mode</span>
                    )}
                  </div>
                  <p className="text-white font-bold text-lg">{q.estimatedDelivery}</p>
                  <p className="text-xs text-gray-400">via {q.courier} · ₹{q.shippingCost} shipping</p>
                </div>
              )}

              {/* Data grid */}
              <div className="border-t pt-3 grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                {[
                  { label: "Serviceable", value: String(q.serviceable) },
                  { label: "Courier", value: q.courier },
                  { label: "Shipping Cost", value: q.shippingCost != null ? `₹${q.shippingCost}` : undefined },
                  { label: "Service Type", value: q.serviceType },
                  { label: "Estimated Delivery", value: q.estimatedDelivery },
                  { label: "Billable Weight", value: q.billableWeightGrams ? `${q.billableWeightGrams}g` : undefined },
                ].filter(f => f.value).map(f => (
                  <div key={f.label} className="flex gap-2">
                    <span className="text-gray-500 shrink-0">{f.label}:</span>
                    <span className="font-semibold text-gray-800">{f.value}</span>
                  </div>
                ))}
              </div>

              {q.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3">{q.error}</div>
              )}
            </>
          )}

          <details className="text-xs">
            <summary className="text-gray-400 cursor-pointer hover:text-gray-600">Raw JSON response</summary>
            <pre className="mt-2 bg-gray-50 rounded-lg p-3 overflow-auto text-gray-600 max-h-52">
              {JSON.stringify(quoteResult.data, null, 2)}
            </pre>
          </details>
        </div>

        {/* Test 3 — Create Shipment (Waybill) */}
        <div className="bg-white rounded-2xl border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">3. Create Shipment (Waybill)</h2>
              <code className="text-xs text-gray-400">POST /api/delhivery/test-shipment</code>
            </div>
            <div className="flex items-center gap-3">
              {shipmentResult.ms != null && <span className="text-xs text-gray-400">{shipmentResult.ms}ms</span>}
              <StatusBadge status={shipmentResult.status} />
            </div>
          </div>

          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ⚠ The <b>Warehouse Name</b> must exactly match the pickup location registered in your Delhivery account. This is the most common reason for "No waybill in response".
          </p>

          {/* Warehouse fields */}
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">📦 Warehouse (Pickup Location)</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "name", label: "Location Name *", placeholder: "Exact name from Delhivery account" },
                { key: "phone", label: "Phone", placeholder: "9000000000" },
                { key: "address", label: "Address", placeholder: "Street address" },
                { key: "city", label: "City", placeholder: "Hyderabad" },
                { key: "state", label: "State", placeholder: "Telangana" },
                { key: "pincode", label: "Pincode", placeholder: "500001" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 block mb-0.5">{label}</label>
                  <input
                    type="text"
                    value={(warehouse as any)[key]}
                    onChange={(e) => setWarehouse((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Customer fields */}
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">👤 Test Customer (Delivery Address)</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "name", label: "Name", placeholder: "Test Customer" },
                { key: "phone", label: "Phone", placeholder: "9000000000" },
                { key: "address", label: "Address", placeholder: "123 Test Street" },
                { key: "city", label: "City", placeholder: "Hyderabad" },
                { key: "state", label: "State", placeholder: "Telangana" },
                { key: "pincode", label: "Pincode", placeholder: "500001" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 block mb-0.5">{label}</label>
                  <input
                    type="text"
                    value={(customer as any)[key]}
                    onChange={(e) => setCustomer((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={runShipment}
            disabled={shipmentResult.status === "loading" || !warehouse.name}
            className="w-full bg-green-700 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-800 transition disabled:opacity-50"
          >
            {shipmentResult.status === "loading" ? "Creating…" : "🚀 Test Create Shipment"}
          </button>
          {!warehouse.name && <p className="text-xs text-red-500 text-center">Enter Warehouse Location Name to enable</p>}

          {/* Result */}
          {shipmentResult.data && shipmentResult.status !== "idle" && (
            <div className={`rounded-xl p-4 space-y-2 border ${shipmentResult.status === "ok" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              {shipmentResult.data.waybill ? (
                <div>
                  <p className="text-xs text-gray-500">Waybill Generated ✅</p>
                  <p className="font-mono font-bold text-green-700 text-lg">{shipmentResult.data.waybill}</p>
                </div>
              ) : (
                <p className="text-red-700 font-semibold text-sm">❌ No waybill returned — see raw response below</p>
              )}
              {shipmentResult.data.mode === "mock" && (
                <p className="text-yellow-700 text-xs">⚠ DELHIVERY_API_KEY not set on backend — mock mode</p>
              )}
              <div className="text-xs space-y-1 pt-1 border-t border-gray-200">
                <p><span className="text-gray-500">Env WAREHOUSE_NAME:</span> <b>{shipmentResult.data.envWarehouseName}</b></p>
                <p><span className="text-gray-500">Env WAREHOUSE_CITY:</span> <b>{shipmentResult.data.envWarehouseCity}</b></p>
                <p><span className="text-gray-500">Env WAREHOUSE_PINCODE:</span> <b>{shipmentResult.data.envWarehousePincode}</b></p>
                <p><span className="text-gray-500">HTTP Status:</span> <b>{shipmentResult.data.httpStatus}</b></p>
              </div>
            </div>
          )}

          {shipmentResult.data && (
            <details className="text-xs">
              <summary className="text-gray-400 cursor-pointer hover:text-gray-600">Raw Delhivery Response</summary>
              <pre className="mt-2 bg-gray-50 rounded-lg p-3 overflow-auto text-gray-600 max-h-64">
                {JSON.stringify(shipmentResult.data?.rawResponse ?? shipmentResult.data, null, 2)}
              </pre>
            </details>
          )}
        </div>

        {/* Legend */}
        <div className="bg-white rounded-2xl border p-4 space-y-3 text-xs text-gray-500">
          <p className="font-semibold text-gray-700 text-sm">Service Type Legend</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <ServiceBadge type="Express" />
              <span>PIN has Delhivery Express coverage (2–5 days). Depends on your Delhivery account/contract.</span>
            </div>
            <div className="flex items-center gap-3">
              <ServiceBadge type="Standard" />
              <span>PIN has standard coverage (3–7 days). Even major cities show Standard if Express isn't enabled.</span>
            </div>
          </div>
          <p className="text-gray-400 pt-1 border-t">
            Express vs Standard is set by Delhivery per PIN based on your account — not by city size.
          </p>
        </div>

      </div>
    </div>
  );
}
