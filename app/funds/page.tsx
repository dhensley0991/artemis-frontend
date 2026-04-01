"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Fund = {
  id: number;
  fund_id?: string;
  name: string;
  strategy?: string | null;
  base_currency?: string | null;
  admin_name?: string | null;
  domicile_country?: string | null;
  firm_id?: number;
  account_number?: string | null;
};

type Firm = {
  id: number;
  name: string;
};

const strategyOptions = [
  "Long / Short Equity",
  "Global Macro",
  "Managed Futures",
  "Multi-Strategy",
  "Event Driven",
  "Credit",
  "Private Equity",
  "Venture Capital",
  "Digital Assets",
  "Quantitative",
];

const currencyOptions = [
  "USD",
  "EUR",
  "GBP",
  "CHF",
  "CAD",
  "AUD",
  "JPY",
  "SGD",
  "HKD",
];

const countryOptions = [
  { code: "US", label: "United States" },
  { code: "KY", label: "Cayman Islands" },
  { code: "GB", label: "United Kingdom" },
  { code: "IE", label: "Ireland" },
  { code: "LU", label: "Luxembourg" },
  { code: "CH", label: "Switzerland" },
  { code: "SG", label: "Singapore" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
];

export default function FundsPage() {
  const router = useRouter();

  const [funds, setFunds] = useState<Fund[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [strategy, setStrategy] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [adminName, setAdminName] = useState("");
  const [domicileCountry, setDomicileCountry] = useState("US");
  const [firmId, setFirmId] = useState("");

  const loadFunds = async () => {
    const token = localStorage.getItem("artemis_token");

    if (!token) {
      router.push("/login");
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/funds`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Funds request failed: ${res.status}`);
    }

    const data = await res.json();
    setFunds(Array.isArray(data) ? data : []);
  };

  const loadFirms = async () => {
  const token = localStorage.getItem("artemis_token");

  if (!token) {
    router.push("/login");
    return;
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/firms`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Firms request failed: ${res.status}`);
  }

  const data = await res.json();

  setFirms(Array.isArray(data) ? data : []);

  if (Array.isArray(data) && data.length === 1) {
    setFirmId(String(data[0].id));
  }
};

  useEffect(() => {
    const token = localStorage.getItem("artemis_token");

    if (!token) {
      router.push("/login");
      return;
    }

    const run = async () => {
      try {
        setLoading(true);
        setError("");
        await Promise.all([loadFunds(), loadFirms()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load funds page");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [router]);

  const handleCreateFund = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("artemis_token");

    if (!token) {
      router.push("/login");
      return;
    }

    const resolvedFirmId = firmId || (firms.length === 1 ? String(firms[0].id) : "");

    if (!resolvedFirmId) {
      setError("Please select a firm.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/funds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          strategy,
          base_currency: baseCurrency,
          admin_name: adminName,
          domicile_country: domicileCountry,
          firm_id: Number(resolvedFirmId),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || `Create fund failed: ${res.status}`);
      }

      setName("");
      setStrategy("");
      setBaseCurrency("USD");
      setAdminName("");
      setDomicileCountry("US");
      setFirmId("");

      await loadFunds();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create fund");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Funds</h1>
              <p className="mt-2 text-sm text-slate-500">
                View pertinent data on each fund or Create a new one.
              </p>
            </div>

            <button
              onClick={() => router.push("/")}
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Create New Fund</h2>

          <form
            onSubmit={handleCreateFund}
            className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            <div>
              <label className="mb-2 block text-sm text-slate-600">Fund Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                placeholder="Atlas Capital Fund LP"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">Strategy</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                required
              >
                <option value="">Select strategy</option>
                {strategyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">Base Currency</label>
              <select
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                required
              >
                {currencyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">Admin Name</label>
              <input
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                placeholder="Artemis NAV Technologies"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">Domicile Country</label>
              <select
                value={domicileCountry}
                onChange={(e) => setDomicileCountry(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                required
              >
                {countryOptions.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.label}
                  </option>
                ))}
              </select>
            </div>

            {firms.length > 1 ? (
            <div>
              <label className="mb-2 block text-sm text-slate-600">Firm</label>
              <select
                value={firmId}
                onChange={(e) => setFirmId(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                required
              >
                <option value="">Select a firm</option>
                {firms.map((firm) => (
                  <option key={firm.id} value={firm.id}>
                    {firm.name}
                  </option>
                ))}
              </select>
            </div>
            ) : firms.length === 1 ? (
            <div>
              <label className="mb-2 block text-sm text-slate-600">Firm</label>
              <div className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {firms[0].name}
              </div>
            </div>
          ) : null}

            <div className="md:col-span-2 xl:col-span-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Fund"}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">All Funds</h2>
            <div className="text-sm text-slate-500">Count: {funds.length}</div>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading funds...</p>
          ) : funds.length === 0 ? (
            <p className="text-sm text-slate-500">No funds found yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Fund ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Strategy</th>
                    <th className="px-4 py-3">Currency</th>
                    <th className="px-4 py-3">Admin</th>
                    <th className="px-4 py-3">Country</th>
                    <th className="px-4 py-3">Firm ID</th>
                    <th className="px-4 py-3">Account Number</th>
                  </tr>
                </thead>
                <tbody>
                  {funds.map((fund) => (
                    <tr key={fund.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3">{fund.id}</td>
                      <td className="px-4 py-3">{fund.fund_id || "-"}</td>
                      <td className="px-4 py-3 font-medium">{fund.name}</td>
                      <td className="px-4 py-3">{fund.strategy || "-"}</td>
                      <td className="px-4 py-3">{fund.base_currency || "-"}</td>
                      <td className="px-4 py-3">{fund.admin_name || "-"}</td>
                      <td className="px-4 py-3">{fund.domicile_country || "-"}</td>
                      <td className="px-4 py-3">{fund.firm_id ?? "-"}</td>
                      <td className="px-4 py-3">{fund.account_number || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}