"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [name, setName] = useState("");
  const [strategy, setStrategy] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [adminName, setAdminName] = useState("");
  const [domicileCountry, setDomicileCountry] = useState("US");
  const [firmId, setFirmId] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fundToDelete, setFundToDelete] = useState<Fund | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const deletePhrase = useMemo(() => {
    if (!fundToDelete) return "";
    return fundToDelete.fund_id || String(fundToDelete.id);
  }, [fundToDelete]);

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
      setFirmId(firms.length === 1 ? String(firms[0].id) : "");
      setShowCreateForm(false);

      await loadFunds();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create fund");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (fund: Fund, e: React.MouseEvent) => {
    e.stopPropagation();
    setFundToDelete(fund);
    setDeleteConfirmText("");
    setDeleteModalOpen(true);
    setError("");
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setFundToDelete(null);
    setDeleteConfirmText("");
  };

  const handleDeleteFund = async () => {
    if (!fundToDelete) return;

    const token = localStorage.getItem("artemis_token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (deleteConfirmText !== deletePhrase) {
      setError(`Type ${deletePhrase} exactly to confirm deletion.`);
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/funds/${fundToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let responseData: any = null;
      try {
        responseData = await res.json();
      } catch {
        responseData = null;
      }

      if (!res.ok) {
        throw new Error(responseData?.detail || `Delete fund failed: ${res.status}`);
      }

      closeDeleteModal();
      await loadFunds();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete fund");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(255,255,255,0.05), transparent 28%), radial-gradient(circle at top right, rgba(255,255,255,0.03), transparent 22%), linear-gradient(to bottom, #000000, #090909, #141414, #1d1d1d)",
      }}
    >
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0">
                <Image
                  src="/artemis-transparent-logo.png"
                  alt="Artemis NAV Technologies"
                  fill
                  className="object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.35)]"
                  priority
                />
              </div>

              <div>
                <div className="mb-2 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-300">
                  Artemis Funds Console
                </div>
                <h1 className="bg-gradient-to-r from-[#F1D36B] via-[#D4AF37] to-[#B8962E] bg-clip-text text-4xl font-semibold tracking-tight text-transparent">
                  Funds
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-400">
                  View pertinent data on each fund and manage new fund creation in one institutional view.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowCreateForm((prev) => !prev)}
                className="rounded-2xl border border-[#B8962E]/40 bg-gradient-to-r from-[#B8962E] via-[#D4AF37] to-[#F1D36B] px-5 py-3 text-sm font-semibold text-black shadow-[0_8px_30px_rgba(212,175,55,0.18)] transition hover:scale-[1.01]"
              >
                {showCreateForm ? "Close Create Fund" : "Create New Fund"}
              </button>

              <button
                onClick={() => router.push("/")}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.06]"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {showCreateForm && (
          <div className="mb-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-[#D4AF37]">Create New Fund</h2>
              <p className="mt-2 text-sm text-slate-400">
                Enter the required fund details below.
              </p>
            </div>

            <form
              onSubmit={handleCreateFund}
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                  Fund Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]/50"
                  placeholder="Atlas Capital Fund LP"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                  Strategy
                </label>
                <select
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
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
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                  Base Currency
                </label>
                <select
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
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
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                  Admin Name
                </label>
                <input
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]/50"
                  placeholder="Artemis NAV Technologies"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                  Domicile Country
                </label>
                <select
                  value={domicileCountry}
                  onChange={(e) => setDomicileCountry(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
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
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                    Firm
                  </label>
                  <select
                    value={firmId}
                    onChange={(e) => setFirmId(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
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
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                    Firm
                  </label>
                  <div className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-slate-200">
                    {firms[0].name}
                  </div>
                </div>
              ) : null}

              <div className="md:col-span-2 xl:col-span-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl border border-[#B8962E]/40 bg-gradient-to-r from-[#B8962E] via-[#D4AF37] to-[#F1D36B] px-5 py-3 text-sm font-semibold text-black shadow-[0_8px_30px_rgba(212,175,55,0.18)] transition hover:scale-[1.01] disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Fund"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[#D4AF37]">All Funds</h2>
              <p className="mt-2 text-sm text-slate-400">
                Select a fund to view full details.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
              Count: <span className="text-[#F1D36B]">{funds.length}</span>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-slate-400">Loading funds...</p>
          ) : funds.length === 0 ? (
            <p className="text-sm text-slate-400">No funds found yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03] text-left">
                    <th className="px-4 py-3 font-medium text-slate-300">ID</th>
                    <th className="px-4 py-3 font-medium text-slate-300">Fund ID</th>
                    <th className="px-4 py-3 font-medium text-slate-300">Name</th>
                    <th className="px-4 py-3 font-medium text-slate-300">Strategy</th>
                    <th className="px-4 py-3 font-medium text-slate-300">Currency</th>
                    <th className="px-4 py-3 font-medium text-slate-300">Admin</th>
                    <th className="px-4 py-3 font-medium text-slate-300">Country</th>
                    <th className="px-4 py-3 font-medium text-slate-300">Firm ID</th>
                    <th className="px-4 py-3 font-medium text-slate-300">Account Number</th>
                    <th className="px-4 py-3 font-medium text-slate-300 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {funds.map((fund) => (
                    <tr
                      key={fund.id}
                      onClick={() => router.push(`/funds/${fund.id}`)}
                      className="cursor-pointer border-b border-white/5 transition hover:bg-white/[0.04]"
                    >
                      <td className="px-4 py-3 text-slate-300">{fund.id}</td>
                      <td className="px-4 py-3 text-[#F1D36B]">{fund.fund_id || "-"}</td>
                      <td className="px-4 py-3 text-white">{fund.name}</td>
                      <td className="px-4 py-3 text-slate-300">{fund.strategy || "-"}</td>
                      <td className="px-4 py-3 text-slate-300">{fund.base_currency || "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/managers/${encodeURIComponent(fund.admin_name || "")}`);
                          }}
                          className="cursor-pointer text-[#F1D36B] underline"
                        >
                          {fund.admin_name || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{fund.domicile_country || "-"}</td>
                      <td className="px-4 py-3 text-slate-300">{fund.firm_id ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-300">{fund.account_number || "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => openDeleteModal(fund, e)}
                          className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-500/20"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {deleteModalOpen && fundToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#0B0B0B] p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-[#D4AF37]">Delete Fund</h3>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-white">{fundToDelete.name}</span>?
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              To confirm, type this exactly:
            </p>

            <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-[#F1D36B]">
              {deletePhrase}
            </div>

            <input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="mt-4 w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-red-400/50"
              placeholder={`Type ${deletePhrase}`}
            />

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.06]"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteFund}
                disabled={deleting || deleteConfirmText !== deletePhrase}
                className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, Delete Fund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}