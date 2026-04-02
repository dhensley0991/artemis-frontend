"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function FundDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [fund, setFund] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("artemis_token");

    if (!token) {
      router.push("/login");
      return;
    }

    const loadFund = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/funds/${params.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Fund request failed: ${res.status}`);
        }

        const data = await res.json();
        setFund(data);
      } catch (err) {
        setError("Failed to load fund");
      } finally {
        setLoading(false);
      }
    };

    loadFund();
  }, [params.id, router]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!fund) return <div className="p-6">No fund found</div>;

  return (

  <main className="min-h-screen bg-slate-100 p-6">
    <div className="mx-auto max-w-7xl space-y-6">
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">
        {fund.name}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
        Fund detail dashboard
        </p>
    </div>

    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-3 rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Fund Overview</h2>

    <div className="mt-4 space-y-3 text-sm">
    <div>
        <span className="text-slate-500">Fund ID: </span>
        <span className="font-medium">{fund.fund_id || "-"}</span>
    </div>

    <div>
        <span className="text-slate-500">Strategy: </span>
        <span className="font-medium">{fund.strategy}</span>
    </div>

    <div>
        <span className="text-slate-500">Currency: </span>
        <span className="font-medium">{fund.base_currency}</span>
    </div>

    <div>
        <span className="text-slate-500">Domicile: </span>
        <span className="font-medium">{fund.domicile_country}</span>
    </div>

    <div>
        <span className="text-slate-500">Account: </span>
        <span className="font-medium">{fund.account_number || "-"}</span>
    </div>
    </div>

    <div className="xl:col-span-5 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">NAV Preview</h2>
    </div>

    <div className="xl:col-span-4 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Operations / Accounts</h2>
    </div>

    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8 rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Documents Vault</h2>
        </div>

    <div className="xl:col-span-4 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Recent Activity</h2>
    </div>
</div>

    </div>    

    </div>

      <button
        onClick={() => router.push("/funds")}
        className="mb-4 px-4 py-2 border rounded"
      >
        Back
      </button>

      <h1 className="text-2xl font-bold mb-4">{fund.name}</h1>

      <div className="space-y-2">
        <div>Strategy: {fund.strategy}</div>
        <div>Currency: {fund.base_currency}</div>
        <div className="flex items-center gap-3">
            {/* Profile box (placeholder) */}
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-sm font-bold">
                {fund.admin_name?.[0] || "?"}
            </div>

            {/* Clickable admin name */}
            <div>
                <span
                onClick={() => router.push(`/managers/${encodeURIComponent(fund.admin_name || "")}`)}
                className="cursor-pointer text-blue-600 underline"
                >
                {fund.admin_name}
                </span>
            </div>
         </div>
        <div>Country: {fund.domicile_country}</div>
        <div>Firm ID: {fund.firm_id}</div>
        <div>Account #: {fund.account_number}</div>
      </div>
    
    </main>
  );
}