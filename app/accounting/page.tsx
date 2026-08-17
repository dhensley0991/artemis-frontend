"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type EntryType = "income" | "expense" | "invoice" | "bill" | "contractor" | "shareholder";
type Entry = { id:string | number; type:EntryType; date:string; name:string; category:string; amount:number; status:string; memo:string };
type Firm = { id:number; name:string };

const tabs = ["Overview", "Transactions", "Receivables", "Payables", "Contractors", "Shareholder", "Tax Center", "Reports"];
const currency = (value:number) => new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", maximumFractionDigits:0 }).format(value);

export default function AccountingPage() {
  const router = useRouter();
  const [entries,setEntries] = useState<Entry[]>([]);
  const [active,setActive] = useState("Overview");
  const [open,setOpen] = useState(false);
  const [ready,setReady] = useState(false);
  const [firms,setFirms] = useState<Firm[]>([]);
  const [firmId,setFirmId] = useState<number | null>(null);
  const [error,setError] = useState("");

  useEffect(() => {
    const token=localStorage.getItem("artemis_token");
    if (!token) { router.push("/login"); return; }
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/firms`,{headers:{Authorization:`Bearer ${token}`}})
      .then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.detail||"Unable to load firms");return data as Firm[];})
      .then(data=>{setFirms(data);const ridgeFour=data.find(f=>f.name.toLowerCase().includes("ridge four"));setFirmId((ridgeFour||data[0])?.id||null);setReady(true);})
      .catch(err=>{setError(err instanceof Error?err.message:"Unable to load firms");setReady(true);});
  }, [router]);

  useEffect(()=>{
    if(!firmId)return;
    const token=localStorage.getItem("artemis_token");
    setError("");
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/accounting/entries?firm_id=${firmId}`,{headers:{Authorization:`Bearer ${token}`}})
      .then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.detail||"Unable to load accounting records");return data as Entry[];})
      .then(setEntries)
      .catch(err=>setError(err instanceof Error?err.message:"Unable to load accounting records"));
  },[firmId]);

  const totals = useMemo(() => {
    const income=entries.filter(e=>e.type==="income").reduce((s,e)=>s+e.amount,0);
    const expenses=entries.filter(e=>e.type==="expense"||e.type==="bill").reduce((s,e)=>s+e.amount,0);
    const ar=entries.filter(e=>(e.type==="invoice"||(e.type==="income"&&e.status==="open"))&&e.status!=="paid").reduce((s,e)=>s+e.amount,0);
    const ap=entries.filter(e=>(e.type==="bill"||(e.type==="expense"&&e.status==="open"))&&e.status!=="paid").reduce((s,e)=>s+e.amount,0);
    return {income,expenses,profit:income-expenses,ar,ap};
  },[entries]);

  const filtered = entries.filter(e => active==="Transactions" ? true : active==="Receivables" ? e.type==="invoice"||(e.type==="income"&&e.status==="open") : active==="Payables" ? e.type==="bill"||(e.type==="expense"&&e.status==="open") : active==="Contractors" ? e.type==="contractor" : active==="Shareholder" ? e.type==="shareholder" : true);

  async function saveEntry(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form=new FormData(event.currentTarget);
    if(!firmId)return;
    const token=localStorage.getItem("artemis_token");
    const payload={firm_id:firmId,entry_type:String(form.get("type")),entry_date:String(form.get("date")),name:String(form.get("name")),category:String(form.get("category")),amount:Number(form.get("amount")),status:String(form.get("status")),memo:String(form.get("memo")||"")};
    try{const response=await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/accounting/entries`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await response.json();if(!response.ok)throw new Error(data.detail||"Unable to save record");setEntries(current=>[data as Entry,...current]);setOpen(false);setError("");}catch(err){setError(err instanceof Error?err.message:"Unable to save record");}
  }

  function exportCsv() {
    const rows=["Date,Type,Name,Category,Status,Amount,Memo",...entries.map(e=>[e.date,e.type,`"${e.name}"`,`"${e.category}"`,e.status,e.amount.toFixed(2),`"${e.memo}"`].join(","))];
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([rows.join("\n")],{type:"text/csv"})); a.download="ridge-four-ledger.csv"; a.click(); URL.revokeObjectURL(a.href);
  }

  if (!ready) return <main className="min-h-screen bg-black text-white grid place-items-center">Loading Ridge Four Ledger…</main>;

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.08),_transparent_30%),linear-gradient(to_bottom,_#000,_#0b0b0b,_#171717)] text-white">
    <div className="mx-auto max-w-[1500px] px-5 py-6 lg:px-8">
      <header className="flex flex-col gap-5 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4"><img src="/artemis-transparent-logo.png" alt="Artemis" className="h-14 w-14 object-contain"/><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Artemis · Business Operations</p><h1 className="bg-gradient-to-r from-[#F1D36B] to-[#D4AF37] bg-clip-text text-3xl font-semibold text-transparent">Ridge Four Ledger</h1><p className="mt-1 text-sm text-slate-400">Single-member LLC · S corporation · Cash basis</p></div></div>
        <div className="flex gap-2"><Link href="/" className="rounded-xl border border-white/15 px-4 py-2 text-sm">← Admin Center</Link><button onClick={exportCsv} className="rounded-xl border border-white/15 px-4 py-2 text-sm">Export</button><button onClick={()=>setOpen(true)} className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F1D36B] px-4 py-2 text-sm font-semibold text-black">＋ Add record</button></div>
      </header>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-slate-500">Accounting entity</p><p className="mt-1 text-sm text-slate-300">Records are stored securely in Artemis PostgreSQL.</p></div><select value={firmId||""} onChange={e=>setFirmId(Number(e.target.value))} className="field max-w-sm"><option value="" disabled>Select a firm</option>{firms.map(firm=><option key={firm.id} value={firm.id}>{firm.name}</option>)}</select></div>
      {error&&<div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      <nav className="mt-5 flex gap-2 overflow-x-auto pb-2">{tabs.map(tab=><button key={tab} onClick={()=>setActive(tab)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm ${active===tab?"bg-[#D4AF37] font-semibold text-black":"border border-white/10 bg-white/[0.04] text-slate-300"}`}>{tab}</button>)}</nav>

      {active==="Overview" && <><section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Revenue" value={currency(totals.income)}/><Metric label="Expenses" value={currency(totals.expenses)}/><Metric label="Net profit" value={currency(totals.profit)} gold/><Metric label="Open invoices" value={currency(totals.ar)}/><Metric label="Bills due" value={currency(totals.ap)}/></section><section className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_0.8fr]"><LedgerTable title="Recent activity" entries={entries.slice(0,8)}/><aside className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Next deadline</p><p className="mt-3 text-3xl font-semibold text-[#F1D36B]">September 15</p><p className="mt-2 text-sm text-slate-300">Q3 federal and Connecticut personal estimates</p><div className="mt-5 space-y-3 text-sm"><Check text="Bank accounts reconciled"/><Check text="Contractor W-9s collected" warning/><Check text="Shareholder salary reviewed" warning/><Check text="Distributions separated"/></div></aside></section></>}
      {["Transactions","Receivables","Payables","Contractors","Shareholder"].includes(active)&&<div className="mt-5"><LedgerTable title={active} entries={filtered}/></div>}
      {active==="Tax Center"&&<TaxCenter profit={totals.profit}/>} {active==="Reports"&&<Reports totals={totals} onExport={exportCsv}/>} 
    </div>
    {open&&<EntryModal onClose={()=>setOpen(false)} onSubmit={saveEntry}/>} 
  </main>;
}

function Metric({label,value,gold=false}:{label:string;value:string;gold?:boolean}){return <article className={`rounded-[22px] border p-5 ${gold?"border-[#D4AF37]/40 bg-[#D4AF37]/10":"border-white/10 bg-white/[0.04]"}`}><p className="text-xs uppercase tracking-[0.14em] text-slate-400">{label}</p><p className={`mt-3 text-2xl font-semibold ${gold?"text-[#F1D36B]":"text-white"}`}>{value}</p></article>}
function LedgerTable({title,entries}:{title:string;entries:Entry[]}){return <section className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04]"><div className="flex items-center justify-between border-b border-white/10 p-5"><h2 className="text-xl font-semibold text-[#F1D36B]">{title}</h2><span className="text-xs text-slate-400">{entries.length} records</span></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-black/30 text-xs uppercase text-slate-500"><tr><th className="p-4">Date</th><th className="p-4">Type</th><th className="p-4">Name</th><th className="p-4">Category</th><th className="p-4">Status</th><th className="p-4 text-right">Amount</th></tr></thead><tbody>{entries.length===0?<tr><td colSpan={6} className="p-10 text-center text-slate-500">No records match this section.</td></tr>:entries.map(e=><tr key={e.id} className="border-t border-white/10"><td className="p-4 text-slate-400">{e.date}</td><td className="p-4"><span className="rounded-full border border-white/10 px-2 py-1 text-xs uppercase text-slate-400">{e.type}</span></td><td className="p-4"><p className="font-medium">{e.name}</p><p className="text-xs text-slate-500">{e.memo}</p></td><td className="p-4 text-slate-300">{e.category}</td><td className="p-4"><span className="rounded-full bg-white/10 px-2 py-1 text-xs uppercase text-slate-300">{e.status}</span></td><td className="p-4 text-right font-medium">{currency(e.amount)}</td></tr>)}</tbody></table></div></section>}
function Check({text,warning=false}:{text:string;warning?:boolean}){return <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3"><span className={`grid h-6 w-6 place-items-center rounded-full ${warning?"bg-amber-400/20 text-amber-300":"bg-emerald-400/20 text-emerald-300"}`}>{warning?"!":"✓"}</span><span className="text-slate-300">{text}</span></div>}
function TaxCenter({profit}:{profit:number}){return <section className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.4fr]"><article className="rounded-[24px] border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-6"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Planning reserve</p><p className="mt-3 text-4xl font-semibold text-[#F1D36B]">{currency(Math.max(0,profit*.32))}</p><p className="mt-2 text-xs text-slate-400">Illustrative 32% reserve. Confirm with TraderTax CPA.</p></article><article className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6"><h2 className="text-xl font-semibold text-[#F1D36B]">Federal + Connecticut calendar</h2>{[["Sep 15","1040-ES · CT-1040ES"],["Oct 31","Form 941 · CT-941"],["Jan 31","1099-NEC · W-2 · W-3"],["Mar 15","1120-S · Schedule K-1"],["Apr 15","CT-1065/CT-1120SI"]].map(([d,f])=><div key={d} className="mt-4 flex justify-between border-b border-white/10 pb-4"><strong>{d}</strong><span className="text-slate-400">{f}</span></div>)}</article></section>}
function Reports({totals,onExport}:{totals:{income:number;expenses:number;profit:number;ar:number;ap:number};onExport:()=>void}){return <section className="mt-5 grid gap-5 lg:grid-cols-3"><article className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6"><p className="text-xs uppercase text-slate-400">Profit &amp; Loss</p><ReportLine label="Revenue" value={totals.income}/><ReportLine label="Expenses" value={-totals.expenses}/><ReportLine label="Net profit" value={totals.profit}/><button onClick={onExport} className="mt-5 rounded-xl bg-[#D4AF37] px-4 py-2 font-semibold text-black">Download CSV</button></article><article className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6"><p className="text-xs uppercase text-slate-400">Open balances</p><ReportLine label="Accounts receivable" value={totals.ar}/><ReportLine label="Accounts payable" value={totals.ap}/></article><article className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6"><p className="text-xs uppercase text-slate-400">CPA package</p><p className="mt-4 text-sm leading-7 text-slate-300">Ledger export, AP/AR, contractor totals, shareholder activity, distributions, and quarterly tax history.</p></article></section>}
function ReportLine({label,value}:{label:string;value:number}){return <div className="mt-4 flex justify-between border-b border-white/10 pb-3"><span className="text-slate-400">{label}</span><strong>{currency(value)}</strong></div>}
function EntryModal({onClose,onSubmit}:{onClose:()=>void;onSubmit:(e:FormEvent<HTMLFormElement>)=>void}){return <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><form onSubmit={onSubmit} className="w-full max-w-2xl rounded-[26px] border border-white/15 bg-[#151515] p-6 shadow-2xl"><div className="flex justify-between"><div><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Ridge Four Ledger</p><h2 className="mt-1 text-2xl font-semibold text-[#F1D36B]">Add record</h2></div><button type="button" onClick={onClose} className="text-2xl text-slate-400">×</button></div><div className="mt-6 grid gap-4 md:grid-cols-2"><Field label="Type"><select name="type" className="field"><option value="income">Income received</option><option value="expense">Expense</option><option value="invoice">Customer invoice</option><option value="bill">Vendor bill</option><option value="contractor">1099 contractor payment</option><option value="shareholder">Shareholder activity</option></select></Field><Field label="Status"><select name="status" className="field"><option value="paid">Paid</option><option value="open">Open</option><option value="received">Received</option><option value="w9-needed">W-9 needed</option><option value="posted">Posted</option></select></Field><Field label="Name"><input name="name" required className="field" placeholder="Customer, vendor, or description"/></Field><Field label="Amount"><input name="amount" required min="0" step="0.01" type="number" className="field" placeholder="0.00"/></Field><Field label="Category"><input name="category" required className="field" placeholder="Professional services"/></Field><Field label="Date"><input name="date" required type="date" className="field" defaultValue={new Date().toISOString().slice(0,10)}/></Field><div className="md:col-span-2"><Field label="Memo"><textarea name="memo" className="field min-h-20" placeholder="Business purpose or supporting note"/></Field></div></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-white/15 px-4 py-2">Cancel</button><button className="rounded-xl bg-[#D4AF37] px-5 py-2 font-semibold text-black">Save record</button></div></form></div>}
function Field({label,children}:{label:string;children:ReactNode}){return <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}{children}</label>}
