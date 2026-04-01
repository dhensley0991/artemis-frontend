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
    <div className="p-6">
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
        <div>
            Admin:{" "}
            <span
                onClick={() => router.push(`/managers/${encodeURIComponent(fund.admin_name || "")}`)}
                className="cursor-pointer text-blue-600 underline"
            >
                {fund.admin_name}
            </span>
        </div>
        <div>Country: {fund.domicile_country}</div>
        <div>Firm ID: {fund.firm_id}</div>
        <div>Account #: {fund.account_number}</div>
      </div>
    </div>
  );
}