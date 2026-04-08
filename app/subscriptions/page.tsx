"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type InvestorAccount = {
  id: number;
  investor_id: number;
  fund_id: number;
  account_number: string;
  account_name: string;
  status: string;
};

type ShareClass = {
  id: number;
  fund_id: number;
  class_name: string;
  management_fee: number;
  incentive_fee: number;
  hurdle_rate: number;
  high_water_mark: number;
};

type SubscriptionRequest = {
  id: number;
  fund_id: number;
  investor_account_id: number;
  amount: number;
  wire_sent: boolean;
  request_date: string;
  status: string;
  notes?: string | null;
  created_at?: string | null;
};

export default function SubscriptionsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [workingRequestId, setWorkingRequestId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [accounts, setAccounts] = useState<InvestorAccount[]>([]);
  const [shareClasses, setShareClasses] = useState<ShareClass[]>([]);
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);

  const [form, setForm] = useState({
    investor_account_id: "",
    amount: "",
    request_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const [confirmState, setConfirmState] = useState<
    Record<number, { share_class_id: string; received_date: string }>
  >({});

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

      const [accountsRes, shareClassesRes, requestsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/investor-accounts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/share-classes`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/subscription-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!accountsRes.ok) {
        throw new Error(`Investor accounts request failed: ${accountsRes.status}`);
      }
      if (!shareClassesRes.ok) {
        throw new Error(`Share classes request failed: ${shareClassesRes.status}`);
      }
      if (!requestsRes.ok) {
        throw new Error(`Subscription requests request failed: ${requestsRes.status}`);
      }

      const accountsData = await accountsRes.json();
      const shareClassesData = await shareClassesRes.json();
      const requestsData = await requestsRes.json();

      setAccounts(Array.isArray(accountsData) ? accountsData : []);
      setShareClasses(Array.isArray(shareClassesData) ? shareClassesData : []);
      setRequests(Array.isArray(requestsData) ? requestsData : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load subscriptions page"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const accountOptions = useMemo(() => {
    return accounts
      .filter((a) => a.status === "active")
      .sort((a, b) => a.account_name.localeCompare(b.account_name));
  }, [accounts]);

  const selectedAccount = useMemo(() => {
    return accounts.find((a) => String(a.id) === form.investor_account_id) || null;
  }, [accounts, form.investor_account_id]);

  const selectedAccountShareClasses = useMemo(() => {
    if (!selectedAccount) return [];
    return shareClasses.filter((sc) => sc.fund_id === selectedAccount.fund_id);
  }, [shareClasses, selectedAccount]);

  const requestsSorted = useMemo(() => {
    return [...requests].sort((a, b) => b.id - a.id);
  }, [requests]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("artemis_token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!selectedAccount) {
      setError("Please select an investor account.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Please enter a valid subscription amount.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/portal/investor/${selectedAccount.id}/subscription-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            investor_account_id: selectedAccount.id,
            fund_id: selectedAccount.fund_id,
            amount: Number(form.amount),
            request_date: form.request_date,
            notes: form.notes.trim() || null,
          }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.detail || `Create subscription request failed: ${res.status}`
        );
      }

      setSuccess("Subscription request created successfully.");

      setForm({
        investor_account_id: "",
        amount: "",
        request_date: new Date().toISOString().slice(0, 10),
        notes: "",
      });

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create subscription request"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkWireSent = async (requestId: number) => {
    const token = localStorage.getItem("artemis_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setWorkingRequestId(requestId);
      setError("");
      setSuccess("");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/subscription-requests/${requestId}/mark-wire-sent`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.detail || `Mark wire sent failed: ${res.status}`);
      }

      setSuccess("Wire marked as sent.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark wire sent");
    } finally {
      setWorkingRequestId(null);
    }
  };

  const handleConfirmFunds = async (request: SubscriptionRequest) => {
    const token = localStorage.getItem("artemis_token");

    if (!token) {
      router.push("/login");
      return;
    }

    const confirmRow = confirmState[request.id];
    const shareClassId = confirmRow?.share_class_id || "";
    const receivedDate =
      confirmRow?.received_date || new Date().toISOString().slice(0, 10);

    if (!shareClassId) {
      setError("Please select a share class before confirming funds.");
      return;
    }

    try {
      setWorkingRequestId(request.id);
      setError("");
      setSuccess("");

      const url =
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/subscription-requests/${request.id}/confirm-funds` +
        `?share_class_id=${encodeURIComponent(shareClassId)}` +
        `&received_date=${encodeURIComponent(receivedDate)}`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.detail || `Confirm funds failed: ${res.status}`);
      }

      setSuccess("Funds confirmed and subscription executed.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm funds");
    } finally {
      setWorkingRequestId(null);
    }
  };

  const getAccountById = (id: number) => {
    return accounts.find((a) => a.id === id) || null;
  };

  const getShareClassesForRequest = (request: SubscriptionRequest) => {
    return shareClasses.filter((sc) => sc.fund_id === request.fund_id);
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
                  Artemis Subscription Workflow
                </div>
                <h1 className="bg-gradient-to-r from-[#F1D36B] via-[#D4AF37] to-[#B8962E] bg-clip-text text-4xl font-semibold tracking-tight text-transparent">
                  Subscriptions
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-400">
                  Create subscription requests, track wire status, and confirm funds into units.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
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

        {success && (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </div>
        )}

        <div className="mb-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-[#D4AF37]">
              New Subscription Request
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Select an approved investor account, enter the amount, and open the subscription workflow.
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-slate-400">Loading subscriptions console...</p>
          ) : (
            <form onSubmit={handleCreateRequest} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                  Investor Account
                </label>
                <select
                  value={form.investor_account_id}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      investor_account_id: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                >
                  <option value="">Select account</option>
                  {accountOptions.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_name} ({account.account_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                  Fund
                </label>
                <input
                  value={selectedAccount ? `Fund ID ${selectedAccount.fund_id}` : ""}
                  readOnly
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-slate-300 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                  placeholder="250000"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                  Request Date
                </label>
                <input
                  type="date"
                  value={form.request_date}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      request_date: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl bg-gradient-to-r from-[#F1D36B] via-[#D4AF37] to-[#B8962E] px-5 py-3 text-sm font-semibold text-black shadow-[0_0_30px_rgba(212,175,55,0.22)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Creating..." : "Create Subscription Request"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-[#D4AF37]">
                Subscription Requests
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Manage funding workflow and execute subscriptions into share classes.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
              Rows: <span className="text-[#F1D36B]">{requestsSorted.length}</span>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-slate-400">Loading request table...</p>
          ) : requestsSorted.length === 0 ? (
            <p className="text-sm text-slate-400">No subscription requests found yet.</p>
          ) : (
            <div className="space-y-4">
              {requestsSorted.map((request) => {
                const account = getAccountById(request.investor_account_id);
                const requestShareClasses = getShareClassesForRequest(request);
                const confirmRow = confirmState[request.id] || {
                  share_class_id: "",
                  received_date: new Date().toISOString().slice(0, 10),
                };

                return (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-5"
                  >
                    <div className="grid gap-4 xl:grid-cols-12">
                      <div className="xl:col-span-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          Investor Account
                        </p>
                        <p className="mt-1 text-lg font-semibold text-white">
                          {account?.account_name || "-"}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {account?.account_number || "-"}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          Fund ID: {request.fund_id}
                        </p>
                      </div>

                      <div className="xl:col-span-2">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          Amount
                        </p>
                        <p className="mt-1 text-lg font-semibold text-[#F1D36B]">
                          ${Number(request.amount || 0).toLocaleString()}
                        </p>
                      </div>

                      <div className="xl:col-span-2">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          Status
                        </p>
                        <p className="mt-1 text-sm font-medium text-white">
                          {request.status}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          Wire Sent: {request.wire_sent ? "Yes" : "No"}
                        </p>
                      </div>

                      <div className="xl:col-span-2">
                        <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                          Share Class
                        </label>
                        <select
                          value={confirmRow.share_class_id}
                          onChange={(e) =>
                            setConfirmState((prev) => ({
                              ...prev,
                              [request.id]: {
                                ...confirmRow,
                                share_class_id: e.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                        >
                          <option value="">Select share class</option>
                          {requestShareClasses.map((sc) => (
                            <option key={sc.id} value={sc.id}>
                              {sc.class_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="xl:col-span-2">
                        <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                          Received Date
                        </label>
                        <input
                          type="date"
                          value={confirmRow.received_date}
                          onChange={(e) =>
                            setConfirmState((prev) => ({
                              ...prev,
                              [request.id]: {
                                ...confirmRow,
                                received_date: e.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                        />
                      </div>
                    </div>

                    {request.notes && (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                        {request.notes}
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-3">
                      {!request.wire_sent && request.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => handleMarkWireSent(request.id)}
                          disabled={workingRequestId === request.id}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {workingRequestId === request.id
                            ? "Working..."
                            : "Mark Wire Sent"}
                        </button>
                      )}

                      {request.status !== "executed" && (
                        <button
                          type="button"
                          onClick={() => handleConfirmFunds(request)}
                          disabled={workingRequestId === request.id}
                          className="rounded-2xl bg-gradient-to-r from-[#F1D36B] via-[#D4AF37] to-[#B8962E] px-4 py-2 text-sm font-semibold text-black shadow-[0_0_24px_rgba(212,175,55,0.20)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {workingRequestId === request.id
                            ? "Executing..."
                            : "Confirm Funds & Execute"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}