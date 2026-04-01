"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Firm = {
  id: number;
  name: string;
  primary_admin_name?: string | null;
  email?: string | null;
  phone?: string | null;
  phone_alt?: string | null;
  website?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  address_line_3?: string | null;
  city?: string | null;
  state_province?: string | null;
  country?: string | null;
  county?: string | null;
  formation_date?: string | null;
  ein?: string | null;
  account_number?: string | null;
};

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

export default function FirmsPage() {
  const router = useRouter();

  const [firms, setFirms] = useState<Firm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [primaryAdminName, setPrimaryAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneAlt, setPhoneAlt] = useState("");
  const [website, setWebsite] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [addressLine3, setAddressLine3] = useState("");
  const [city, setCity] = useState("");
  const [stateProvince, setStateProvince] = useState("");
  const [country, setCountry] = useState("US");
  const [county, setCounty] = useState("");
  const [formationDate, setFormationDate] = useState("");
  const [ein, setEin] = useState("");

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
        await loadFirms();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load firms page");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [router]);

  const handleCreateFirm = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("artemis_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/firms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          primary_admin_name: primaryAdminName,
          email,
          phone,
          phone_alt: phoneAlt || null,
          website: website || null,
          address_line_1: addressLine1,
          address_line_2: addressLine2 || null,
          address_line_3: addressLine3 || null,
          city,
          state_province: stateProvince,
          country,
          county: county || null,
          formation_date: formationDate,
          ein,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || `Create firm failed: ${res.status}`);
      }

      setName("");
      setPrimaryAdminName("");
      setEmail("");
      setPhone("");
      setPhoneAlt("");
      setWebsite("");
      setAddressLine1("");
      setAddressLine2("");
      setAddressLine3("");
      setCity("");
      setStateProvince("");
      setCountry("US");
      setCounty("");
      setFormationDate("");
      setEin("");

      setSuccess("Firm created successfully.");
      await loadFirms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create firm");
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
              <h1 className="text-3xl font-semibold tracking-tight">Firms</h1>
              <p className="mt-2 text-sm text-slate-500">
                View Pertinent Information about the Management Company or Create a New Entity.
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

        {success && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="mb-6 rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Create New Firm</h2>

          <form
            onSubmit={handleCreateFirm}
            className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            <div>
              <label className="mb-2 block text-sm text-slate-600">Firm Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                placeholder="Artemis NAV Technologies"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">Primary Admin Name</label>
              <input
                value={primaryAdminName}
                onChange={(e) => setPrimaryAdminName(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                placeholder="First and Last Admin Name"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                placeholder="your-email@email.com"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                placeholder="555-555-5555"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">Alt Phone</label>
              <input
                value={phoneAlt}
                onChange={(e) => setPhoneAlt(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">Website</label>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                placeholder="https://artemisnav.tech"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">Address Line 1</label>
              <input
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                placeholder="123 Main Street"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">Address Line 2</label>
              <input
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">Address Line 3</label>
              <input
                value={addressLine3}
                onChange={(e) => setAddressLine3(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">City</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                placeholder="City Name"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">State / Province</label>
              <input
                value={stateProvince}
                onChange={(e) => setStateProvince(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                placeholder="State/ Province 2 letter Abbv."
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                required
              >
                {countryOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">County</label>
              <input
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">Formation Date</label>
              <input
                type="date"
                value={formationDate}
                onChange={(e) => setFormationDate(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">EIN</label>
              <input
                value={ein}
                onChange={(e) => setEin(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                placeholder="12-3456789"
                required
              />
            </div>

            <div className="md:col-span-2 xl:col-span-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Firm"}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">All Firms</h2>
            <div className="text-sm text-slate-500">Count: {firms.length}</div>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading firms...</p>
          ) : firms.length === 0 ? (
            <p className="text-sm text-slate-500">No firms found yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Primary Admin</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">State</th>
                    <th className="px-4 py-3">Country</th>
                    <th className="px-4 py-3">EIN</th>
                    <th className="px-4 py-3">Account Number</th>
                  </tr>
                </thead>
                <tbody>
                  {firms.map((firm) => (
                    <tr key={firm.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3">{firm.id}</td>
                      <td className="px-4 py-3 font-medium">{firm.name}</td>
                      <td className="px-4 py-3">{firm.primary_admin_name || "-"}</td>
                      <td className="px-4 py-3">{firm.email || "-"}</td>
                      <td className="px-4 py-3">{firm.phone || "-"}</td>
                      <td className="px-4 py-3">{firm.city || "-"}</td>
                      <td className="px-4 py-3">{firm.state_province || "-"}</td>
                      <td className="px-4 py-3">{firm.country || "-"}</td>
                      <td className="px-4 py-3">{firm.ein || "-"}</td>
                      <td className="px-4 py-3">{firm.account_number || "-"}</td>
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