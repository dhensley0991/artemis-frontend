"use client";

import { useParams, useRouter } from "next/navigation";

export default function ManagerPage() {
  const params = useParams();
  const router = useRouter();

  const managerName = decodeURIComponent(String(params.name || ""));

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-4xl rounded-2xl border bg-white p-6 shadow-sm">
        <button
          onClick={() => router.back()}
          className="mb-6 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Back
        </button>

        <div
            className="h-24 w-24 overflow-hidden rounded-xl border bg-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-300 transition"
            title="Manager photo"
            >
            <span className="text-2xl font-bold text-slate-600">
                {managerName?.[0] || "?"}
            </span>
        </div>

          <div>
            <h1 className="text-3xl font-semibold text-slate-900">{managerName}</h1>
            <p className="mt-1 text-sm text-slate-500">Fund Manager Profile</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border p-4">
          <h2 className="mb-3 text-xl font-semibold">Manager Information</h2>
          <p className="text-slate-700">Bio and manager details coming next.</p>
        </div>

        <div className="mt-6 rounded-xl border p-4">
          <h2 className="mb-3 text-xl font-semibold">Funds Managed</h2>
          <p className="text-slate-700">Fund list coming next.</p>
        </div>
      </div>
    </main>
  );
}