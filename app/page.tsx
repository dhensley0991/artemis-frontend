"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* =========================
   ACTION QUEUE DATA
========================= */
const actionQueue = [
  {
    id: 1,
    title: "Subscription Request #1",
    subtitle: "John Smith Main Account • $10,000 • Pending approval",
  },
  {
    id: 2,
    title: "Redemption Request RR-000001",
    subtitle: "John Smith Main Account • Full redemption • Pending review",
  },
];

/* =========================
   BELL PREVIEW DATA
========================= */
const bellPreview = [
  {
    id: 1,
    title: "New subscription request",
    message: "John Smith Main Account submitted a $10,000 subscription.",
    time: "2 min ago",
  },
  {
    id: 2,
    title: "New redemption request",
    message: "Redemption request RR-000001 is awaiting review.",
    time: "9 min ago",
  },
];

export default function Page() {
  const router = useRouter();
  const [fundsCount, setFundsCount] = useState(0);
  const [firmsCount, setFirmsCount] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem("artemis_token");
    router.push("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("artemis_token");

    if (!token) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("artemis_token");

    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/funds`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Funds request failed: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("FUNDS:", data);
        setFundsCount(Array.isArray(data) ? data.length : 0);
      })
      .catch((err) => console.error("FUNDS ERROR:", err));
  }, [router]);

  useEffect(() => {
  const token = localStorage.getItem("artemis_token");

  if (!token) return;

  fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/firms`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Firms request failed: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      console.log("FIRMS:", data);
      setFirmsCount(Array.isArray(data) ? data.length : 0);
    })
    .catch((err) => console.error("FIRMS ERROR:", err));
}, [router]);

  return (
    <div className="min-h-screen bg-slate-800 text-slate-950">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between gap-6 rounded-3xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="Artemis Logo"
              className="h-10 w-10 rounded-full border object-contain"
            />

            <div className="max-w-xl">
              <p className="text-sm text-slate-500">Artemis NAV Technologies</p>
              <h1 className="text-2xl font-semibold">Admin Control Center</h1>
              <p className="text-sm text-slate-400">
                Point-and-click visibility into firms, funds, investors, subscriptions,
                redemptions, and notifications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-100"
            >
              Log Out
            </button>

            <input
              type="text"
              placeholder="Search Artemis data"
              className="rounded-xl border px-3 py-2 text-sm"
            />

            <button className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
              Alerts
              <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white">
                2
              </span>
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Link href="/firms" className="block">
            <div className="cursor-pointer rounded-3xl border bg-white p-5 shadow-sm transition hover:border-slate-400 hover:shadow-md">
              <p className="text-sm text-slate-500">Firms</p>
              <p className="mt-3 text-2xl font-semibold">{firmsCount}</p>
            </div>
          </Link>

          <Link href="/funds" className="block">
            <div className="cursor-pointer rounded-3xl border bg-white p-5 shadow-sm transition hover:border-slate-400 hover:shadow-md">
              <p className="text-sm text-slate-500">Funds</p>
              <p className="mt-3 text-2xl font-semibold">{fundsCount}</p>
            </div>
          </Link>

          <Link href="/investors" className="block">
            <div className="cursor-pointer rounded-3xl border bg-white p-5 shadow-sm transition hover:border-slate-400 hover:shadow-md">
              <p className="text-sm text-slate-500">Investors</p>
              <p className="mt-3 text-2xl font-semibold">1</p>
            </div>
          </Link>

          <Link href="/accounts" className="block">
            <div className="cursor-pointer rounded-3xl border bg-white p-5 shadow-sm transition hover:border-slate-400 hover:shadow-md">
              <p className="text-sm text-slate-500">Investor Accounts</p>
              <p className="mt-3 text-2xl font-semibold">1</p>
            </div>
          </Link>

          <Link href="/subscriptions" className="block">
            <div className="cursor-pointer rounded-3xl border bg-white p-5 shadow-sm transition hover:border-slate-400 hover:shadow-md">
              <p className="text-sm text-slate-500">Pending Subscriptions</p>
              <p className="mt-3 text-2xl font-semibold">1</p>
            </div>
          </Link>

          <Link href="/redemptions" className="block">
            <div className="cursor-pointer rounded-3xl border bg-white p-5 shadow-sm transition hover:border-slate-400 hover:shadow-md">
              <p className="text-sm text-slate-500">Pending Redemptions</p>
              <p className="mt-3 text-2xl font-semibold">1</p>
            </div>
          </Link>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.7fr_0.9fr]">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight">Action Queue</h2>

            <div className="mt-6 space-y-4">
              {actionQueue.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-3xl border p-4"
                >
                  <div>
                    <p className="text-xl font-semibold">{item.title}</p>
                    <p className="mt-1 text-base text-slate-500">{item.subtitle}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                      Approve
                    </button>
                    <button className="rounded-2xl border px-4 py-2 text-sm font-medium text-slate-700">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight">Bell Preview</h2>

            <div className="mt-6 space-y-4">
              {bellPreview.map((item) => (
                <div key={item.id} className="rounded-3xl border p-4">
                  <p className="text-xl font-semibold">{item.title}</p>
                  <p className="mt-2 text-base text-slate-500">{item.message}</p>
                  <p className="mt-4 text-sm text-slate-400">{item.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}