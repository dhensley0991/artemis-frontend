"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type MeResponse = {
  id: number;
  subscription_id: string;
  email: string;
  portal_type: string;
  is_active: boolean;
  roles?: string[];
};

type ClientFundBranding = {
  fund_id: number | null;
  fund_name: string;
  fund_reference?: string | null;
  strategy?: string | null;
  admin_name?: string | null;
  portal_logo_url?: string | null;
};

const DEFAULT_BRANDING: ClientFundBranding = {
  fund_id: null,
  fund_name: "Investor Portal",
  fund_reference: null,
  strategy: null,
  admin_name: null,
  portal_logo_url: null,
};

export default function ClientPortalShell() {
  const router = useRouter();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [branding, setBranding] = useState<ClientFundBranding>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "performance" | "documents" | "alerts" | "profile"
  >("overview");

  const apiBaseUrl = useMemo(() => {
    return process.env.NEXT_PUBLIC_API_BASE_URL || "";
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("artemis_token");

    if (!token) {
      router.push("/login");
      return;
    }

    const loadClientPortal = async () => {
      try {
        const meRes = await fetch(`${apiBaseUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!meRes.ok) {
          throw new Error("Unable to load your session.");
        }

        const meData: MeResponse = await meRes.json();

        if (meData.portal_type !== "client") {
          throw new Error("This page is for client users only.");
        }

        setMe(meData);

        // Placeholder white-label loading
        // Replace this endpoint later with your real client branding endpoint.
        try {
          const brandingRes = await fetch(`${apiBaseUrl}/client/portal-branding`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (brandingRes.ok) {
            const brandingData = await brandingRes.json();
            setBranding({
              fund_id: brandingData.fund_id ?? null,
              fund_name: brandingData.fund_name || "Investor Portal",
              fund_reference: brandingData.fund_reference ?? null,
              strategy: brandingData.strategy ?? null,
              admin_name: brandingData.admin_name ?? null,
              portal_logo_url: brandingData.portal_logo_url ?? null,
            });
          }
        } catch {
          // Silent fallback to default branding shell
        }
      } catch (error: any) {
        console.error(error);
        localStorage.removeItem("artemis_token");
        setPageError(error?.message || "Unable to load client portal.");
      } finally {
        setLoading(false);
      }
    };

    loadClientPortal();
  }, [apiBaseUrl, router]);

  const handleLogout = () => {
    localStorage.removeItem("artemis_token");
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-4 shadow-sm">
          <p className="text-sm font-medium text-[#475467]">Loading investor portal...</p>
        </div>
      </main>
    );
  }

  if (pageError) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-3xl border border-[#E5E7EB] bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-[#111827]">Portal Error</h1>
          <p className="mt-3 text-sm text-[#667085]">{pageError}</p>

          <button
            onClick={() => router.push("/login")}
            className="mt-6 rounded-xl bg-[#111827] px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] text-[#101828]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-[280px] border-r border-[#EAECF0] bg-white xl:flex xl:flex-col">
          <div className="border-b border-[#EAECF0] px-6 py-6">
            <div className="flex items-center gap-3">
              {branding.portal_logo_url ? (
                <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-[#EAECF0] bg-white">
                  <Image
                    src={branding.portal_logo_url}
                    alt={branding.fund_name}
                    fill
                    className="object-contain p-1"
                  />
                </div>
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#111827] text-sm font-semibold text-white">
                  {branding.fund_name.charAt(0)}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#111827]">
                  {branding.fund_name}
                </p>
                <p className="truncate text-xs text-[#667085]">Investor Portal</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-5">
            <SidebarButton
              label="Overview"
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            />
            <SidebarButton
              label="Performance"
              active={activeTab === "performance"}
              onClick={() => setActiveTab("performance")}
            />
            <SidebarButton
              label="Documents"
              active={activeTab === "documents"}
              onClick={() => setActiveTab("documents")}
            />
            <SidebarButton
              label="Alerts"
              active={activeTab === "alerts"}
              onClick={() => setActiveTab("alerts")}
            />
            <SidebarButton
              label="Profile"
              active={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
            />
          </nav>

          <div className="border-t border-[#EAECF0] px-4 py-4">
            <button
              onClick={handleLogout}
              className="w-full rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-medium text-[#344054] hover:bg-[#F9FAFB]"
            >
              Log Out
            </button>
          </div>
        </aside>

        {/* Main */}
        <section className="flex-1">
          {/* Top Header */}
          <header className="border-b border-[#EAECF0] bg-white">
            <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5 lg:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">
                  Client View
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-[#111827]">
                  {branding.fund_name}
                </h1>
                <p className="mt-1 text-sm text-[#667085]">
                  Sleek, white-labeled investor access for documents, performance, and alerts.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button className="rounded-xl border border-[#D0D5DD] bg-white px-4 py-2.5 text-sm font-medium text-[#344054] hover:bg-[#F9FAFB]">
                  Alerts
                </button>
                <div className="rounded-xl border border-[#EAECF0] bg-[#F9FAFB] px-4 py-2.5 text-sm text-[#475467]">
                  {me?.email}
                </div>
              </div>
            </div>
          </header>

          {/* Body */}
          <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-8">
            {/* Branding / Fund strip */}
            <div className="mb-8 grid gap-4 lg:grid-cols-3">
              <InfoCard
                title="Fund"
                value={branding.fund_name || "Not loaded"}
                subtext={branding.fund_reference || "Fund reference will appear here"}
              />
              <InfoCard
                title="Strategy"
                value={branding.strategy || "Multi-Strategy / Placeholder"}
                subtext="White-label strategy text can live here"
              />
              <InfoCard
                title="Administrator"
                value={branding.admin_name || "Administrator Placeholder"}
                subtext="Fund contact details can surface here later"
              />
            </div>

            {/* Main content shell */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Current Value"
                    value="$0.00"
                    note="Live valuation endpoint later"
                  />
                  <MetricCard
                    label="Subscribed Capital"
                    value="$0.00"
                    note="Subscription total later"
                  />
                  <MetricCard
                    label="Units Owned"
                    value="0.0000"
                    note="Investor units endpoint later"
                  />
                  <MetricCard
                    label="Latest NAV Date"
                    value="—"
                    note="Latest NAV will appear here"
                  />
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                  <PanelCard
                    title="Performance Snapshot"
                    subtitle="This will become the investor chart and recent account trend area."
                  >
                    <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-[#D0D5DD] bg-[#FCFCFD] text-sm text-[#667085]">
                      Performance chart placeholder
                    </div>
                  </PanelCard>

                  <PanelCard
                    title="Recent Alerts"
                    subtitle="Latest statements, notices, approvals, and fund updates."
                  >
                    <div className="space-y-3">
                      <AlertRow
                        title="No alerts yet"
                        text="Fund notices and account updates will appear here."
                      />
                      <AlertRow
                        title="Documents placeholder"
                        text="New statements and tax documents can trigger alerts."
                      />
                      <AlertRow
                        title="NAV updates placeholder"
                        text="Latest NAV strike notifications can show here."
                      />
                    </div>
                  </PanelCard>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <PanelCard
                    title="Documents Vault"
                    subtitle="Statements, subscription documents, tax forms, and notices."
                  >
                    <div className="space-y-3">
                      <DocumentRow
                        title="Capital Statement"
                        meta="Placeholder · PDF"
                      />
                      <DocumentRow
                        title="Subscription Documents"
                        meta="Placeholder · PDF"
                      />
                      <DocumentRow
                        title="Tax Documents"
                        meta="Placeholder · PDF"
                      />
                    </div>
                  </PanelCard>

                  <PanelCard
                    title="Account Details"
                    subtitle="Client identity and profile actions."
                  >
                    <div className="space-y-4 text-sm text-[#475467]">
                      <DetailRow label="Subscription ID" value={me?.subscription_id || "—"} />
                      <DetailRow label="Email" value={me?.email || "—"} />
                      <DetailRow label="Portal Type" value={me?.portal_type || "—"} />
                      <DetailRow label="Status" value={me?.is_active ? "Active" : "Inactive"} />
                    </div>
                  </PanelCard>
                </div>
              </div>
            )}

            {activeTab === "performance" && (
              <PanelCard
                title="Performance"
                subtitle="We will plug account performance, NAV history, subscriptions, and redemptions here."
              >
                <div className="flex h-[420px] items-center justify-center rounded-2xl border border-dashed border-[#D0D5DD] bg-[#FCFCFD] text-sm text-[#667085]">
                  Performance page placeholder
                </div>
              </PanelCard>
            )}

            {activeTab === "documents" && (
              <PanelCard
                title="Documents"
                subtitle="This will become the investor document vault."
              >
                <div className="flex h-[420px] items-center justify-center rounded-2xl border border-dashed border-[#D0D5DD] bg-[#FCFCFD] text-sm text-[#667085]">
                  Documents page placeholder
                </div>
              </PanelCard>
            )}

            {activeTab === "alerts" && (
              <PanelCard
                title="Alerts"
                subtitle="This will become the investor notifications center."
              >
                <div className="flex h-[420px] items-center justify-center rounded-2xl border border-dashed border-[#D0D5DD] bg-[#FCFCFD] text-sm text-[#667085]">
                  Alerts page placeholder
                </div>
              </PanelCard>
            )}

            {activeTab === "profile" && (
              <PanelCard
                title="Profile"
                subtitle="This will hold password reset, contact updates, and future self-service settings."
              >
                <div className="flex h-[420px] items-center justify-center rounded-2xl border border-dashed border-[#D0D5DD] bg-[#FCFCFD] text-sm text-[#667085]">
                  Profile page placeholder
                </div>
              </PanelCard>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function SidebarButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`mb-2 flex w-full items-center rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
        active
          ? "bg-[#111827] text-white shadow-sm"
          : "text-[#344054] hover:bg-[#F9FAFB]"
      }`}
    >
      {label}
    </button>
  );
}

function InfoCard({
  title,
  value,
  subtext,
}: {
  title: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="rounded-3xl border border-[#EAECF0] bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">{title}</p>
      <p className="mt-3 text-lg font-semibold text-[#111827]">{value}</p>
      <p className="mt-1 text-sm text-[#667085]">{subtext}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-[#EAECF0] bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-[#667085]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[#111827]">{value}</p>
      <p className="mt-2 text-xs text-[#98A2B3]">{note}</p>
    </div>
  );
}

function PanelCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-[#EAECF0] bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[#111827]">{title}</h2>
        <p className="mt-1 text-sm text-[#667085]">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function AlertRow({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[#EAECF0] bg-[#FCFCFD] p-4">
      <p className="text-sm font-semibold text-[#111827]">{title}</p>
      <p className="mt-1 text-sm text-[#667085]">{text}</p>
    </div>
  );
}

function DocumentRow({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#EAECF0] bg-[#FCFCFD] px-4 py-4">
      <div>
        <p className="text-sm font-semibold text-[#111827]">{title}</p>
        <p className="mt-1 text-xs text-[#98A2B3]">{meta}</p>
      </div>
      <button className="rounded-xl border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-medium text-[#344054]">
        View
      </button>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3 last:border-b-0 last:pb-0">
      <span className="text-[#667085]">{label}</span>
      <span className="font-medium text-[#111827]">{value}</span>
    </div>
  );
}