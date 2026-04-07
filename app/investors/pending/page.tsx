"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PendingInvestor = {
  id: number;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  ssn?: string | null;
  investor_type?: string | null;
  approval_status?: string | null;
};

type Fund = {
  id: number;
  name: string;
  fund_id?: string | null;
};

export default function PendingInvestorsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [pendingInvestors, setPendingInvestors] = useState<PendingInvestor[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);

  const [selectedFundByInvestor, setSelectedFundByInvestor] = useState<Record<number, string>>({});
  const [notesByInvestor, setNotesByInvestor] = useState<Record<number, string>>({});

  const loadData = async () => {
    const token = localStorage.getItem("artemis_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const [pendingRes, fundsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/investors/pending`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/funds`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (!pendingRes.ok) {
        throw new Error(`Pending investors request failed: ${pendingRes.status}`);
      }

      if (!fundsRes.ok) {
        throw new Error(`Funds request failed: ${fundsRes.status}`);
      }

      const pendingData = await pendingRes.json();
      const fundsData = await fundsRes.json();

      setPendingInvestors(Array.isArray(pendingData) ? pendingData : []);
      setFunds(Array.isArray(fundsData) ? fundsData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pending investors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const approveInvestor = async (investorId: number) => {
    const token = localStorage.getItem("artemis_token");
    const fundId = selectedFundByInvestor[investorId];
    const notes = notesByInvestor[investorId] || "";

    if (!token) {
      router.push("/login");
      return;
    }

    if (!fundId) {
      setError("Please select a fund before approving.");
      return;
    }

    try {
      setWorkingId(investorId);
      setError("");
      setSuccess("");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/investors/${investorId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fund_id: Number(fundId),
            notes: notes || null,
          }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.detail || `Approve investor failed: ${res.status}`);
      }

      setSuccess(
        `Investor approved successfully. Account number issued: ${data?.account_number || "-"}`
      );

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve investor");
    } finally {
      setWorkingId(null);
    }
  };

  const rejectInvestor = async (investorId: number) => {
    const token = localStorage.getItem("artemis_token");
    const notes = notesByInvestor[investorId] || "";

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setWorkingId(investorId);
      setError("");
      setSuccess("");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/investors/${investorId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            notes: notes || null,
          }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.detail || `Reject investor failed: ${res.status}`);
      }

      setSuccess("Investor rejected successfully.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject investor");
    } finally {
      setWorkingId(null);
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
                  Artemis Approval Queue
                </div>
                <h1 className="bg-gradient-to-r from-[#F1D36B] via-[#D4AF37] to-[#B8962E] bg-clip-text text-4xl font-semibold tracking-tight text-transparent">
                  Pending Investors
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-400">
                  Review pending investor records and approve them into an account workflow.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/investors")}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.06]"
              >
                Back to Investors
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </div>
        )}

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          {loading ? (
            <p className="text-sm text-slate-400">Loading pending investors...</p>
          ) : pendingInvestors.length === 0 ? (
            <p className="text-sm text-slate-400">No pending investors found.</p>
          ) : (
            <div className="space-y-4">
              {pendingInvestors.map((investor) => (
                <div
                  key={investor.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5"
                >
                  <div className="grid gap-4 lg:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Investor
                      </p>
                      <p className="mt-1 text-lg font-semibold text-white">
                        {investor.first_name} {investor.last_name}
                      </p>
                      <p className="mt-2 text-sm text-slate-400">
                        Type: {investor.investor_type || "-"}
                      </p>
                      <p className="text-sm text-slate-400">
                        Email: {investor.email || "-"}
                      </p>
                      <p className="text-sm text-slate-400">
                        Phone: {investor.phone || "-"}
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                        Assign Fund
                      </label>
                      <select
                        value={selectedFundByInvestor[investor.id] || ""}
                        onChange={(e) =>
                          setSelectedFundByInvestor((prev) => ({
                            ...prev,
                            [investor.id]: e.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                      >
                        <option value="">Select fund</option>
                        {funds.map((fund) => (
                          <option key={fund.id} value={fund.id}>
                            {fund.name} {fund.fund_id ? `(${fund.fund_id})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                        Approval Notes
                      </label>
                      <textarea
                        value={notesByInvestor[investor.id] || ""}
                        onChange={(e) =>
                          setNotesByInvestor((prev) => ({
                            ...prev,
                            [investor.id]: e.target.value,
                          }))
                        }
                        rows={3}
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => approveInvestor(investor.id)}
                      disabled={workingId === investor.id}
                      className="rounded-2xl bg-gradient-to-r from-[#F1D36B] via-[#D4AF37] to-[#B8962E] px-5 py-3 text-sm font-semibold text-black shadow-[0_0_30px_rgba(212,175,55,0.22)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {workingId === investor.id ? "Working..." : "Approve & Open Account"}
                    </button>

                    <button
                      type="button"
                      onClick={() => rejectInvestor(investor.id)}
                      disabled={workingId === investor.id}
                      className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {workingId === investor.id ? "Working..." : "Reject"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}