"use client";

/*
  ============================================================================
  FIRMS PAGE
  ----------------------------------------------------------------------------
  Purpose:
  - Display all firms in the Artemis system
  - Allow super admin users to create a new firm
  - Match the same institutional black / gold design language as /funds

  Notes:
  - Uses Artemis JWT token from localStorage
  - Loads firms from the backend /firms endpoint
  - Create Firm panel is expandable / collapsible
  - Styled to visually align with the current Artemis fund pages
  ============================================================================
*/

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";



/*
  ============================================================================
  TYPES
  ============================================================================
*/

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
  portal_logo_url?: string | null;
  document_logo_url?: string | null;
};

/*
  ============================================================================
  COUNTRY OPTIONS
  ============================================================================
*/

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

/*
  ============================================================================
  PAGE COMPONENT
  ============================================================================
*/

export default function FirmsPage() {
  const router = useRouter();
  const [showWhiteLabelModal, setShowWhiteLabelModal] = useState(false);
  const [portalLogoFile, setPortalLogoFile] = useState<File | null>(null);
  const [documentLogoFile, setDocumentLogoFile] = useState<File | null>(null);
  
  const handleWhiteLabelUpload = async () => {
    const token = localStorage.getItem("artemis_token");
    if (!token) {
      alert("Not authenticated");
      return;
    }

    if (!portalLogoFile && !documentLogoFile) {
      alert("Please select at least one file");
      return;
    }

    const formData = new FormData();

    if (portalLogoFile) {
      formData.append("portal_logo", portalLogoFile);
    }

    if (documentLogoFile) {
      formData.append("document_logo", documentLogoFile);
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/firms/20/upload-white-label`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Upload failed");

      alert("White label uploaded successfully");
      setShowWhiteLabelModal(false);

    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  




/*
  --------------------------------------------------------------------------
  UI STATE
  --------------------------------------------------------------------------
*/
const [showCreateFirm, setShowCreateFirm] = useState(false);
const [firms, setFirms] = useState<Firm[]>([]);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");

/*
  --------------------------------------------------------------------------
  FORM STATE
  --------------------------------------------------------------------------
*/
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

/*
  ==========================================================================
  LOAD FIRMS
  --------------------------------------------------------------------------
  Pulls firms from backend using saved Artemis token
  ==========================================================================
*/
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

/*
  ==========================================================================
  INITIAL LOAD
  ==========================================================================
*/
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

/*
  ==========================================================================
  CREATE FIRM
  ==========================================================================
*/
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

    /*
      ----------------------------------------------------------------------
      RESET FORM AFTER SUCCESS
      ----------------------------------------------------------------------
    */
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
    setShowCreateFirm(false);
    await loadFirms();
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to create firm");
  } finally {
    setSaving(false);
  }
};

return (
  <main className="min-h-screen bg-black text-white">
    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.05),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.03),_transparent_22%),linear-gradient(to_bottom,_#000000,_#090909,_#141414,_#1d1d1d)]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* 
            ==================================================================
            PAGE HEADER
            ==================================================================
          */}
        <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-300">
                Artemis Firms Dashboard
              </div>

              <div>
                <h1 className="bg-gradient-to-r from-[#F1D36B] via-[#D4AF37] to-[#B8962E] bg-clip-text text-4xl font-semibold tracking-tight text-transparent">
                  Firms
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-300">
                  View pertinent information about the management company, review
                  existing entities, and create a new firm within the Artemis control framework.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Total Firms
                  </p>
                  <p className="mt-1 font-medium text-[#F1D36B]">{firms.length}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Create Panel
                  </p>
                  <p className="mt-1 font-medium text-[#F1D36B]">
                    {showCreateFirm ? "Open" : "Closed"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Load Status
                  </p>
                  <p className="mt-1 font-medium text-[#F1D36B]">
                    {loading ? "Loading" : "Ready"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Save Status
                  </p>
                  <p className="mt-1 font-medium text-[#F1D36B]">
                    {saving ? "Saving" : "Idle"}
                  </p>
                </div>
              </div>
            </div>

            {/* 
                --------------------------------------------------------------
                ACTION BUTTONS
                --------------------------------------------------------------
              */}
            <div className="flex flex-col gap-3 xl:items-end">
              <button
                type="button"
                onClick={() => setShowCreateFirm((prev) => !prev)}
                className="rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F1D36B] px-5 py-3 text-sm font-semibold text-black shadow-[0_0_25px_rgba(212,175,55,0.35)] transition hover:brightness-110"
              >
                {showCreateFirm ? "Close Create Firm" : "Create Firm"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/managers/create")}
                className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
              >
                Add Fund Admin
              </button>

              <button
                type="button"
                onClick={() => setShowWhiteLabelModal(true)}
                className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
              >
                Upload White Label Media
              </button>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </section>

        {/* 
            ==================================================================
            FEEDBACK MESSAGES
            ==================================================================
          */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {success}
          </div>
        )}

        {/* 
            ==================================================================
            CREATE FIRM PANEL
            ==================================================================
          */}
        {showCreateFirm && (
          <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-[#D4AF37]">
                  Create New Firm
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Enter the management company details below to create a new Artemis firm record.
                </p>
              </div>

              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                New Entity
              </div>
            </div>

            <form
              onSubmit={handleCreateFirm}
              className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              <div>
                <label className="mb-2 block text-sm text-slate-300">Firm Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]"
                  placeholder="Artemis NAV Technologies"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Primary Admin Name
                </label>
                <input
                  value={primaryAdminName}
                  onChange={(e) => setPrimaryAdminName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]"
                  placeholder="First and Last Admin Name"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]"
                  placeholder="your-email@email.com"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]"
                  placeholder="555-555-5555"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Alt Phone</label>
                <input
                  value={phoneAlt}
                  onChange={(e) => setPhoneAlt(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Website</label>
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]"
                  placeholder="https://artemisnav.tech"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Address Line 1</label>
                <input
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]"
                  placeholder="123 Main Street"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Address Line 2</label>
                <input
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Address Line 3</label>
                <input
                  value={addressLine3}
                  onChange={(e) => setAddressLine3(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">City</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]"
                  placeholder="City Name"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">State / Province</label>
                <input
                  value={stateProvince}
                  onChange={(e) => setStateProvince(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]"
                  placeholder="State / Province"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
                  required
                >
                  {countryOptions.map((option) => (
                    <option key={option.code} value={option.code} className="bg-black text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">County</label>
                <input
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Formation Date</label>
                <input
                  type="date"
                  value={formationDate}
                  onChange={(e) => setFormationDate(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">EIN</label>
                <input
                  value={ein}
                  onChange={(e) => setEin(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]"
                  placeholder="12-3456789"
                  required
                />
              </div>

              <div className="md:col-span-2 xl:col-span-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F1D36B] px-6 py-3 text-sm font-semibold text-black shadow-[0_0_25px_rgba(212,175,55,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Creating..." : "Create Firm"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* 
            ==================================================================
            ALL FIRMS TABLE
            ==================================================================
          */}
        <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[#D4AF37]">All Firms</h2>
              <p className="mt-1 text-sm text-slate-300">
                View all management companies currently loaded into Artemis.
              </p>
            </div>

            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
              Count: {firms.length}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-slate-400">Loading firms...</p>
          ) : firms.length === 0 ? (
            <p className="text-sm text-slate-400">No firms found yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.04] text-left text-slate-300">
                    <th className="px-4 py-3 font-medium">ID</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Primary Admin</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">City</th>
                    <th className="px-4 py-3 font-medium">State</th>
                    <th className="px-4 py-3 font-medium">Country</th>
                    <th className="px-4 py-3 font-medium">EIN</th>
                    <th className="px-4 py-3 font-medium">Account Number</th>
                  </tr>
                </thead>

                <tbody>
                  {firms.map((firm) => (
                    <tr
                      key={firm.id}
                      className="border-b border-white/10 last:border-b-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-3 text-slate-300">{firm.id}</td>
                      <td className="px-4 py-3 font-medium text-[#F1D36B]">{firm.name}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {firm.primary_admin_name || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{firm.email || "-"}</td>
                      <td className="px-4 py-3 text-slate-300">{firm.phone || "-"}</td>
                      <td className="px-4 py-3 text-slate-300">{firm.city || "-"}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {firm.state_province || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{firm.country || "-"}</td>
                      <td className="px-4 py-3 text-slate-300">{firm.ein || "-"}</td>
                      <td className="px-4 py-3 text-[#F1D36B]">
                        {firm.account_number || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>

    {showWhiteLabelModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-black p-6 shadow-2xl">

          <h2 className="text-xl font-semibold text-[#D4AF37]">
            Upload White Label Media
          </h2>

          <p className="mt-2 text-sm text-slate-300">
            Upload logos for client-facing portal and documents.
          </p>

          <div className="mt-6 space-y-4">

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Portal Logo (Transparent PNG)
              </label>
              <input type="file" className="w-full text-sm text-white" />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Document Logo (Statements / Letters)
              </label>
              <input type="file" className="w-full text-sm text-white" />
            </div>

          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setShowWhiteLabelModal(false)}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
            >
              Cancel
            </button>

            <button
              onClick={handleWhiteLabelUpload}
              className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F1D36B] px-4 py-2 text-sm font-semibold text-black"
            >
              Save
            </button>
          </div>

        </div>
      </div>
    )}
  </main>
);
}
