"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ProspectFundConfig = {
  id: number;
  name: string;
  fund_id?: string | null;
  strategy?: string | null;
  domicile_country?: string | null;
  firm_id?: number | null;
  firm_name?: string | null;
  portal_logo_url?: string | null;
  document_logo_url?: string | null;
  fund_portal_logo_url?: string | null;
  fund_document_logo_url?: string | null;
  contact_email?: string | null;
};

type DuplicateCheckResponse = {
  exists: boolean;
  investor_id?: number;
  investor_name?: string;
};

function ProspectSignupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const fundId = searchParams.get("fund_id") || "";
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState("");

  const [fundConfig, setFundConfig] = useState<ProspectFundConfig | null>(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    ssn: "",
    date_of_birth: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state_province: "",
    postal_code: "",
    country: "United States",
    investor_type: "",
    accreditation_status: "",
    notes: "",

    joint_first_name: "",
    joint_last_name: "",
    joint_email: "",
    joint_phone: "",
    joint_ssn: "",
    joint_date_of_birth: "",
    joint_address_line_1: "",
    joint_address_line_2: "",
    joint_city: "",
    joint_state_province: "",
    joint_postal_code: "",
    joint_country: "United States",
    joint_accreditation_status: "",
    joint_notes: "",

    entity_name: "",
    entity_ein: "",
    entity_address_line_1: "",
    entity_address_line_2: "",
    entity_city: "",
    entity_state_province: "",
    entity_postal_code: "",
    entity_country: "United States",
    entity_contact_first_name: "",
    entity_contact_last_name: "",
    entity_contact_email: "",
    entity_contact_phone: "",
    entity_notes: "",
  });

  const normalizeSSN = (value: string) => value.replace(/\D/g, "");

  const portalLogoSrc = useMemo(() => {
    if (!fundConfig) return null;

    if (fundConfig.fund_portal_logo_url) {
      return `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${encodeURIComponent(
        fundConfig.fund_portal_logo_url
      )}`;
    }

    if (fundConfig.portal_logo_url) {
      return `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${encodeURIComponent(
        fundConfig.portal_logo_url
      )}`;
    }

    return null;
  }, [fundConfig]);

  const secondaryLogoSrc = useMemo(() => {
    if (!fundConfig) return null;

    if (fundConfig.fund_document_logo_url) {
      return `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${encodeURIComponent(
        fundConfig.fund_document_logo_url
      )}`;
    }

    if (fundConfig.document_logo_url) {
      return `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${encodeURIComponent(
        fundConfig.document_logo_url
      )}`;
    }

    return null;
  }, [fundConfig]);

  useEffect(() => {
    const loadProspectConfig = async () => {
      if (!fundId) {
        setError("Missing fund link. Please request a valid prospect signup link.");
        setPageLoading(false);
        return;
      }

      try {
        setPageLoading(true);
        setError("");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/public/funds/${fundId}/prospect-config`
        );

        if (!res.ok) {
          throw new Error(`Failed to load prospect fund config: ${res.status}`);
        }

        const data = await res.json();
        setFundConfig(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load fund signup configuration."
        );
      } finally {
        setPageLoading(false);
      }
    };

    loadProspectConfig();
  }, [fundId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "ssn") {
      setDuplicateWarning("");
      setError("");
    }
  };

  const handleSSNBlur = async () => {
    const cleanSSN = normalizeSSN(form.ssn);

    if (!fundConfig?.firm_id || cleanSSN.length !== 9) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/public/investors/check-duplicate?firm_id=${fundConfig.firm_id}&ssn=${cleanSSN}`
      );

      if (!res.ok) return;

      const data: DuplicateCheckResponse = await res.json();

      if (data.exists) {
        setDuplicateWarning(
          `An investor record already exists for this firm${
            data.investor_name ? `: ${data.investor_name}` : ""
          }. Please contact the fund representative for next steps.`
        );
      } else {
        setDuplicateWarning("");
      }
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fundConfig?.firm_id || !fundConfig?.id) {
      setError("Invalid fund link. Missing fund configuration.");
      return;
    }

    const cleanSSN = normalizeSSN(form.ssn);

    if (!form.first_name.trim()) {
      setError("First name is required.");
      return;
    }

    if (!form.last_name.trim()) {
      setError("Last name is required.");
      return;
    }

    if (cleanSSN.length !== 9) {
      setError("SSN is required and must contain 9 digits.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (form.investor_type === "joint") {
      if (!form.joint_first_name.trim()) {
        setError("Joint first name is required.");
        return;
      }

      if (!form.joint_last_name.trim()) {
        setError("Joint last name is required.");
        return;
      }
    }

    if (
      form.investor_type === "entity" ||
      form.investor_type === "family_office" ||
      form.investor_type === "trust"
    ) {
      if (!form.entity_name.trim()) {
        setError("Entity name is required.");
        return;
      }
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const payload = {
        fund_id: fundConfig.id,
        firm_id: fundConfig.firm_id,

        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        ssn: cleanSSN,
        date_of_birth: form.date_of_birth || null,

        address_line_1: form.address_line_1.trim() || null,
        address_line_2: form.address_line_2.trim() || null,
        city: form.city.trim() || null,
        state_province: form.state_province.trim() || null,
        postal_code: form.postal_code.trim() || null,
        country: form.country.trim() || null,

        investor_type: form.investor_type || null,
        account_registration_type: form.investor_type || null,
        accreditation_status: form.accreditation_status || null,
        notes: form.notes.trim() || null,

        joint_first_name: form.joint_first_name.trim() || null,
        joint_last_name: form.joint_last_name.trim() || null,
        joint_email: form.joint_email.trim() || null,
        joint_phone: form.joint_phone.trim() || null,
        joint_ssn: form.joint_ssn.trim() || null,
        joint_date_of_birth: form.joint_date_of_birth || null,
        joint_address_line_1: form.joint_address_line_1.trim() || null,
        joint_address_line_2: form.joint_address_line_2.trim() || null,
        joint_city: form.joint_city.trim() || null,
        joint_state_province: form.joint_state_province.trim() || null,
        joint_postal_code: form.joint_postal_code.trim() || null,
        joint_country: form.joint_country.trim() || null,
        joint_accreditation_status: form.joint_accreditation_status || null,
        joint_notes: form.joint_notes.trim() || null,

        entity_name: form.entity_name.trim() || null,
        entity_type:
          form.investor_type === "entity"
            ? "entity"
            : form.investor_type === "family_office"
            ? "family_office"
            : form.investor_type === "trust"
            ? "trust"
            : null,
        entity_ein: form.entity_ein.trim() || null,
        entity_address_line_1: form.entity_address_line_1.trim() || null,
        entity_address_line_2: form.entity_address_line_2.trim() || null,
        entity_city: form.entity_city.trim() || null,
        entity_state_province: form.entity_state_province.trim() || null,
        entity_postal_code: form.entity_postal_code.trim() || null,
        entity_country: form.entity_country.trim() || null,
        entity_contact_first_name: form.entity_contact_first_name.trim() || null,
        entity_contact_last_name: form.entity_contact_last_name.trim() || null,
        entity_contact_email: form.entity_contact_email.trim() || null,
        entity_contact_phone: form.entity_contact_phone.trim() || null,
        entity_notes: form.entity_notes.trim() || null,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/prospect-signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.detail || `Prospect signup failed: ${res.status}`);
      }

      setSuccess(
        "Your investor onboarding request has been submitted successfully. The fund administrator will review your information and contact you regarding next steps."
      );

      setTimeout(() => {
        router.push("/");
      }, 3500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit prospect signup."
      );
    } finally {
      setSubmitting(false);
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
      <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0">
                {portalLogoSrc ? (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white p-2">
                    <img
                      src={portalLogoSrc}
                      alt="Fund branding"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <Image
                    src="/artemis-transparent-logo.png"
                    alt="Artemis NAV Technologies"
                    fill
                    className="object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.35)]"
                    priority
                  />
                )}
              </div>

              <div>
                <div className="mb-2 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-300">
                  Investor Onboarding
                </div>

                <h1 className="bg-gradient-to-r from-[#F1D36B] via-[#D4AF37] to-[#B8962E] bg-clip-text text-4xl font-semibold tracking-tight text-transparent">
                  {fundConfig?.name || "Prospect Signup"}
                </h1>

                <p className="mt-2 max-w-3xl text-sm text-slate-400">
                  Submit your information to begin the investor onboarding process.
                  Your request will be reviewed by the fund administrator before any
                  account is opened.
                </p>

                {(fundConfig?.firm_name || fundConfig?.fund_id) && (
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                    {fundConfig?.firm_name && (
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                        Firm: {fundConfig.firm_name}
                      </span>
                    )}
                    {fundConfig?.fund_id && (
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                        Fund ID: {fundConfig.fund_id}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {secondaryLogoSrc && (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white p-2">
                <img
                  src={secondaryLogoSrc}
                  alt="Secondary branding"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}
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

        {duplicateWarning && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {duplicateWarning}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-[#D4AF37]">
              Investor Information
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Please complete the information below. Your submission will be routed
              to the administrator for approval.
            </p>
          </div>

          {pageLoading ? (
            <p className="text-sm text-slate-400">Loading signup form...</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                    SSN <span className="text-red-300">*</span>
                  </label>
                  <input
                    name="ssn"
                    value={form.ssn}
                    onChange={handleChange}
                    onBlur={handleSSNBlur}
                    placeholder="123-45-6789"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]/50"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                    Email <span className="text-red-300">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                    First Name <span className="text-red-300">*</span>
                  </label>
                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                    Last Name <span className="text-red-300">*</span>
                  </label>
                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                    Phone
                  </label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                    Date of Birth
                  </label>
                  <input
                    name="date_of_birth"
                    type="date"
                    value={form.date_of_birth}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                    Investor Type
                  </label>
                  <select
                    name="investor_type"
                    value={form.investor_type}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                  >
                    <option value="">Select type</option>
                    <option value="individual">Individual</option>
                    <option value="joint">Joint</option>
                    <option value="trust">Trust</option>
                    <option value="entity">Entity</option>
                    <option value="family_office">Family Office</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                    Accreditation Status
                  </label>
                  <select
                    name="accreditation_status"
                    value={form.accreditation_status}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                  >
                    <option value="">Select status</option>
                    <option value="accredited">Accredited</option>
                    <option value="non-accredited">Non-Accredited</option>
                    <option value="qualified-purchaser">Qualified Purchaser</option>
                    <option value="pending-review">Pending Review</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                    Country
                  </label>
                  <input
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                    Address Line 1
                  </label>
                  <input
                    name="address_line_1"
                    value={form.address_line_1}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                    Address Line 2
                  </label>
                  <input
                    name="address_line_2"
                    value={form.address_line_2}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                    City
                  </label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                    State / Province
                  </label>
                  <input
                    name="state_province"
                    value={form.state_province}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                    Postal Code
                  </label>
                  <input
                    name="postal_code"
                    value={form.postal_code}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                  />
                </div>
              </div>

              {form.investor_type === "joint" && (
                <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-5">
                  <h3 className="text-lg font-semibold text-[#D4AF37]">Joint Owner Details</h3>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                        Joint First Name <span className="text-red-300">*</span>
                      </label>
                      <input
                        name="joint_first_name"
                        value={form.joint_first_name}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                        Joint Last Name <span className="text-red-300">*</span>
                      </label>
                      <input
                        name="joint_last_name"
                        value={form.joint_last_name}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                        Joint Email
                      </label>
                      <input
                        name="joint_email"
                        type="email"
                        value={form.joint_email}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                        Joint Phone
                      </label>
                      <input
                        name="joint_phone"
                        value={form.joint_phone}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                        Joint SSN
                      </label>
                      <input
                        name="joint_ssn"
                        value={form.joint_ssn}
                        onChange={handleChange}
                        placeholder="123-45-6789"
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]/50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                        Joint Date of Birth
                      </label>
                      <input
                        name="joint_date_of_birth"
                        type="date"
                        value={form.joint_date_of_birth}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(form.investor_type === "entity" ||
                form.investor_type === "family_office" ||
                form.investor_type === "trust") && (
                <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-5">
                  <h3 className="text-lg font-semibold text-[#D4AF37]">
                    {form.investor_type === "family_office"
                      ? "Family Office Details"
                      : form.investor_type === "trust"
                      ? "Trust Details"
                      : "Entity Details"}
                  </h3>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                        Entity Name <span className="text-red-300">*</span>
                      </label>
                      <input
                        name="entity_name"
                        value={form.entity_name}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                        EIN
                      </label>
                      <input
                        name="entity_ein"
                        value={form.entity_ein}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                        Contact First Name
                      </label>
                      <input
                        name="entity_contact_first_name"
                        value={form.entity_contact_first_name}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                        Contact Last Name
                      </label>
                      <input
                        name="entity_contact_last_name"
                        value={form.entity_contact_last_name}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                        Contact Email
                      </label>
                      <input
                        name="entity_contact_email"
                        type="email"
                        value={form.entity_contact_email}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                        Contact Phone
                      </label>
                      <input
                        name="entity_contact_phone"
                        value={form.entity_contact_phone}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                />
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl bg-gradient-to-r from-[#F1D36B] via-[#D4AF37] to-[#B8962E] px-5 py-3 text-sm font-semibold text-black shadow-[0_0_30px_rgba(212,175,55,0.22)] transition hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(212,175,55,0.32)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Investor Request"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.06]"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default function ProspectSignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          Loading prospect signup...
        </div>
      }
    >
      <ProspectSignupInner />
    </Suspense>
  );
}