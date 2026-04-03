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
  const [fundsCount, setFundsCount] = useState<number | null>(null);
  const [firmsCount, setFirmsCount] = useState<number | null>(null);

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
    <main className="min-h-screen bg-black text-white">
      <div className="bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.05),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.03),_transparent_22%),linear-gradient(to_bottom,_#000000,_#090909,_#141414,_#1d1d1d)]">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* =========================
              HEADER
          ========================= */}
          <div className="mb-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex items-center gap-4">
                <img
                  src="/artemis-transparent-logo.png"
                  alt="Artemis Logo"
                  className="h-14 w-14 object-contain opacity-95 drop-shadow-[0_0_18px_rgba(212,175,55,0.22)]"
                />

                <div className="max-w-2xl">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                    Artemis NAV Technologies
                  </p>
                  <h1 className="bg-gradient-to-r from-[#F1D36B] via-[#D4AF37] to-[#B8962E] bg-clip-text text-4xl font-semibold tracking-tight text-transparent">
                    Admin Control Center
                  </h1>
                  <p className="mt-2 text-sm text-slate-300">
                    Point-and-click visibility into firms, funds, investors,
                    subscriptions, redemptions, and notifications.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                <button
                  onClick={handleLogout}
                  className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
                >
                  Log Out
                </button>

                <input
                  type="text"
                  placeholder="Search Artemis data"
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-[#D4AF37]"
                />

                <button className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white transition hover:bg-white/[0.08]">
                  Alerts
                  <span className="rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F1D36B] px-2 py-0.5 text-xs font-semibold text-black">
                    2
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* =========================
              TOP METRIC CARDS
          ========================= */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Link href="/firms" className="block">
              <div className="cursor-pointer rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-2xl transition hover:border-[#D4AF37]/40 hover:bg-white/[0.06]">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                  Firms
                </p>
                <p className="mt-3 text-3xl font-semibold text-[#F1D36B]">
                  {firmsCount === null ? "..." : firmsCount}
                </p>
              </div>
            </Link>

            <Link href="/funds" className="block">
              <div className="cursor-pointer rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-2xl transition hover:border-[#D4AF37]/40 hover:bg-white/[0.06]">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                  Funds
                </p>
                <p className="mt-3 text-3xl font-semibold text-[#F1D36B]">
                  {fundsCount === null ? "..." : fundsCount}
                </p>
              </div>
            </Link>

            <Link href="/investors" className="block">
              <div className="cursor-pointer rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-2xl transition hover:border-[#D4AF37]/40 hover:bg-white/[0.06]">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                  Investors
                </p>
                <p className="mt-3 text-3xl font-semibold text-[#F1D36B]">1</p>
              </div>
            </Link>

            <Link href="/accounts" className="block">
              <div className="cursor-pointer rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-2xl transition hover:border-[#D4AF37]/40 hover:bg-white/[0.06]">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                  Investor Accounts
                </p>
                <p className="mt-3 text-3xl font-semibold text-[#F1D36B]">1</p>
              </div>
            </Link>

            <Link href="/subscriptions" className="block">
              <div className="cursor-pointer rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-2xl transition hover:border-[#D4AF37]/40 hover:bg-white/[0.06]">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                  Pending Subscriptions
                </p>
                <p className="mt-3 text-3xl font-semibold text-[#F1D36B]">1</p>
              </div>
            </Link>

            <Link href="/redemptions" className="block">
              <div className="cursor-pointer rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-2xl transition hover:border-[#D4AF37]/40 hover:bg-white/[0.06]">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                  Pending Redemptions
                </p>
                <p className="mt-3 text-3xl font-semibold text-[#F1D36B]">1</p>
              </div>
            </Link>
          </div>

          {/* =========================
              MAIN PANELS
          ========================= */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.7fr_0.9fr]">
            {/* ACTION QUEUE */}
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
              <h2 className="text-3xl font-semibold tracking-tight text-[#F1D36B]">
                Action Queue
              </h2>

              <div className="mt-6 space-y-4">
                {actionQueue.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div>
                      <p className="text-2xl font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-base text-slate-400">{item.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F1D36B] px-4 py-2 text-sm font-semibold text-black shadow-[0_0_18px_rgba(212,175,55,0.30)] transition hover:brightness-110">
                        Approve
                      </button>
                      <button className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BELL PREVIEW */}
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
              <h2 className="text-3xl font-semibold tracking-tight text-[#F1D36B]">
                Bell Preview
              </h2>

              <div className="mt-6 space-y-4">
                {bellPreview.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
                  >
                    <p className="text-2xl font-semibold text-white">{item.title}</p>
                    <p className="mt-2 text-base text-slate-400">{item.message}</p>
                    <p className="mt-4 text-sm text-slate-500">{item.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}