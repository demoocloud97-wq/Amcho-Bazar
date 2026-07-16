import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, User, Store, Tags, Save, ImagePlus, X, Plus, Check, Pencil, FileText } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { RequireAuth } from "@/components/site/require-auth";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { getMyRegistrations, updateRegistration, type Registration } from "@/lib/db";
import { getCustomRegFields, getRegFieldLabels, type CustomRegField } from "@/lib/settings-db";
import { getCategories, type Category } from "@/lib/categories-db";
import { uploadToCloudinary, cloudinaryReady } from "@/lib/cloudinary";
import { friendlyAuthError } from "@/lib/firebase-errors";
import { CustomRegFieldsEditor, BuiltinRegFieldsEditor, TermsEditor } from "@/components/site/admin-settings";
import { SidebarSections, type NavGroup } from "@/components/site/sidebar-sections";

export const Route = createFileRoute("/registration-info")({
  head: () => ({ meta: [{ title: "Registration Info · Amcho Bazar" }] }),
  component: () => (
    <RequireAuth>
      <RegistrationInfo />
    </RequireAuth>
  ),
});

const inputCls = "w-full rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm outline-none ring-primary/20 transition-all focus:ring-4";
const seconds = (r: Registration) => (r.createdAt as { seconds?: number })?.seconds ?? 0;

type Tab = "personal" | "business" | "categories";
type Form = {
  seller: string; surname: string; phone: string; email: string; city: string;
  business: string; tagline: string; yearsRunning: string; instagram: string; logoUrl: string; products: string;
  custom: Record<string, string>; categoryIds: string[];
};

function RegistrationInfo() {
  const { user, isAdmin } = useAuth();
  const { t } = useI18n();
  const [reg, setReg] = useState<Registration | null>(null);
  const [fields, setFields] = useState<CustomRegField[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [regLabels, setRegLabels] = useState<Record<string, string>>({});
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<Tab>("personal");

  useEffect(() => {
    if (!user?.uid || isAdmin) { setLoading(false); return; } // admin manages fields, doesn't register
    Promise.all([getMyRegistrations(user.uid), getCustomRegFields(), getCategories(), getRegFieldLabels()])
      .then(([regs, f, c, lbl]) => {
        const r = [...regs].sort((a, b) => seconds(b) - seconds(a))[0] ?? null;
        setReg(r);
        setFields(f);
        setCats(c.filter((x) => x.status === "active"));
        setRegLabels(lbl);
        if (r) setForm({
          seller: r.seller ?? "", surname: r.surname ?? "", phone: r.phone ?? "", email: r.email ?? "", city: r.city ?? "",
          business: r.business ?? "", tagline: r.tagline ?? "", yearsRunning: r.yearsRunning ?? "", instagram: r.instagram ?? "", logoUrl: r.logoUrl ?? "",
          products: (r.products ?? []).join(", "),
          custom: { ...(r.customFields ?? {}) },
          categoryIds: [...(r.categoryIds ?? [])],
        });
      })
      .catch((e) => toast.error(friendlyAuthError(e)))
      .finally(() => setLoading(false));
  }, [user?.uid]);

  const upd = (k: keyof Form, v: Form[keyof Form]) => setForm((d) => (d ? { ...d, [k]: v } : d));
  const setCustom = (id: string, v: string) => setForm((d) => (d ? { ...d, custom: { ...d.custom, [id]: v } } : d));
  const toggleCat = (id: string) => setForm((d) => {
    if (!d) return d;
    const has = d.categoryIds.includes(id);
    return { ...d, categoryIds: has ? d.categoryIds.filter((x) => x !== id) : [...d.categoryIds, id] };
  });
  const catName = useMemo(() => new Map(cats.map((c) => [c.id!, c.name])), [cats]);
  const L = (k: string, fk: string) => regLabels[k] || t(fk);

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try { upd("logoUrl", await uploadToCloudinary(file)); }
    catch (err) { toast.error(friendlyAuthError(err)); }
    finally { setUploading(false); }
  }

  async function save() {
    if (!reg?.id || !form) return;
    const missing = fields.filter((f) => f.required).find((f) => !(form.custom[f.id] ?? "").trim());
    if (missing) { toast.error(`${missing.label} ${t("reginfo.isRequired")}`); return; }
    setSaving(true);
    try {
      const names = form.categoryIds.map((id) => catName.get(id)).filter(Boolean) as string[];
      const custom = Object.fromEntries(fields.map((f) => [f.id, (form.custom[f.id] ?? "").trim()]).filter(([, v]) => v));
      const patch: Partial<Registration> = {
        seller: form.seller.trim(), surname: form.surname.trim(), phone: form.phone.trim(), email: form.email.trim(), city: form.city.trim(),
        business: form.business.trim(), tagline: form.tagline.trim(), yearsRunning: form.yearsRunning.trim(), instagram: form.instagram.trim(),
        logoUrl: form.logoUrl, products: form.products.split(",").map((p) => p.trim()).filter(Boolean),
        customFields: custom, categoryIds: form.categoryIds, categories: names,
      };
      if (form.categoryIds[0]) { patch.categoryId = form.categoryIds[0]; patch.category = names[0] as Registration["category"]; }
      await updateRegistration(reg.id, patch);
      toast.success(t("reginfo.saved"));
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setSaving(false);
    }
  }

  // Admin never fills a registration — for them this screen manages the form fields
  // (add a new field, rename or delete existing ones).
  if (isAdmin) {
    const groups: NavGroup[] = [
      { label: t("reginfo.manageGroup"), items: [
        { id: "existing", icon: <Pencil className="h-4 w-4" />, title: t("reginfo.existingFields"), desc: t("reginfo.existingSub"), node: <BuiltinRegFieldsEditor /> },
        { id: "custom", icon: <Plus className="h-4 w-4" />, title: t("adm.rfTitle"), desc: t("adm.rfDesc"), node: <CustomRegFieldsEditor /> },
        { id: "terms", icon: <FileText className="h-4 w-4" />, title: t("adm.termsTitle"), desc: t("adm.termsDesc"), node: <TermsEditor /> },
      ] },
    ];
    return (
      <div>
        <PageHeader eyebrow={t("reginfo.eyebrow")} title={t("reginfo.title")} subtitle={t("reginfo.adminSub")} />
        <section className="mx-auto max-w-5xl px-4 pb-24 pt-8 md:px-8 md:pt-12">
          <SidebarSections groups={groups} />
        </section>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "personal", label: t("reginfo.personal"), icon: <User className="h-4 w-4" /> },
    { id: "business", label: t("reginfo.business"), icon: <Store className="h-4 w-4" /> },
    { id: "categories", label: t("reginfo.categories"), icon: <Tags className="h-4 w-4" /> },
  ];

  return (
    <div>
      <PageHeader eyebrow={t("reginfo.eyebrow")} title={t("reginfo.title")} subtitle={t("reginfo.subtitle")} />
      <section className="mx-auto max-w-2xl px-4 pb-24 pt-8 md:px-8 md:pt-12">
        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !reg || !form ? (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground">{t("reginfo.none")}</p>
            <Link to="/register" className="mt-4 inline-flex items-center gap-2 rounded-full bg-festive px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.03]">{t("reginfo.registerNow")}</Link>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="mb-6 flex gap-1.5 overflow-x-auto rounded-full border border-border bg-card p-1.5 shadow-soft">
              {TABS.map((tb) => (
                <button
                  key={tb.id}
                  onClick={() => setTab(tb.id)}
                  className={`inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${tab === tb.id ? "bg-festive text-white shadow-soft" : "text-foreground/70 hover:bg-muted"}`}
                >
                  {tb.icon} {tb.label}
                </button>
              ))}
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-card md:p-6">
              {tab === "personal" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoField label={L("fullName", "reg.f.fullName")}><input value={form.seller} onChange={(e) => upd("seller", e.target.value)} className={inputCls} /></InfoField>
                  <InfoField label={L("surname", "reg.f.surname")}><input value={form.surname} onChange={(e) => upd("surname", e.target.value)} className={inputCls} /></InfoField>
                  <InfoField label={L("phone", "reg.f.phone")}><input value={form.phone} onChange={(e) => upd("phone", e.target.value)} type="tel" inputMode="tel" className={inputCls} /></InfoField>
                  <InfoField label={L("email", "reg.f.email")}><input value={form.email} onChange={(e) => upd("email", e.target.value)} type="email" inputMode="email" className={inputCls} /></InfoField>
                  <InfoField label={L("city", "reg.f.city")}><input value={form.city} onChange={(e) => upd("city", e.target.value)} className={inputCls} placeholder="Karachi" /></InfoField>
                </div>
              )}

              {tab === "business" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoField label={L("business", "reg.f.business")}><input value={form.business} onChange={(e) => upd("business", e.target.value)} className={inputCls} /></InfoField>
                  <InfoField label={L("tagline", "reg.f.tagline")}><input value={form.tagline} onChange={(e) => upd("tagline", e.target.value)} className={inputCls} /></InfoField>
                  <InfoField label={L("years", "reg.f.years")}><input value={form.yearsRunning} onChange={(e) => upd("yearsRunning", e.target.value)} className={inputCls} /></InfoField>
                  <InfoField label={L("instagram", "reg.f.instagram")}><input value={form.instagram} onChange={(e) => upd("instagram", e.target.value)} className={inputCls} /></InfoField>
                  {cloudinaryReady && (
                    <div className="md:col-span-2">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{L("logo", "reg.f.logo")}</span>
                      <div className="flex items-center gap-4">
                        {form.logoUrl ? (
                          <div className="relative">
                            <img src={form.logoUrl} alt="" className="h-16 w-16 rounded-2xl border border-border object-cover" />
                            <button type="button" onClick={() => upd("logoUrl", "")} aria-label={t("reginfo.removeLogo")} className="absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow-soft"><X className="h-3.5 w-3.5" /></button>
                          </div>
                        ) : (
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-border bg-white/70 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                            {uploading ? t("reg.f.logoUploading") : t("reg.f.logo")}
                            <input type="file" accept="image/*" onChange={onLogo} disabled={uploading} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <InfoField label={L("products", "reg.f.sell")}><textarea value={form.products} onChange={(e) => upd("products", e.target.value)} className={`${inputCls} min-h-[90px]`} placeholder={t("reg.f.sellHint")} /></InfoField>
                  </div>
                  {/* Dynamic admin-defined fields (added via Settings → Registration fields) */}
                  {fields.length > 0 && <div className="md:col-span-2 mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("reginfo.more")}</div>}
                  {fields.map((f) => (
                    <div key={f.id} className={f.type === "textarea" ? "md:col-span-2" : ""}>
                      <InfoField label={f.label} required={f.required}>
                        {f.type === "textarea" ? (
                          <textarea value={form.custom[f.id] ?? ""} onChange={(e) => setCustom(f.id, e.target.value)} className={`${inputCls} min-h-[90px]`} />
                        ) : f.type === "select" ? (
                          <select value={form.custom[f.id] ?? ""} onChange={(e) => setCustom(f.id, e.target.value)} className={inputCls}>
                            <option value="">—</option>
                            {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input value={form.custom[f.id] ?? ""} onChange={(e) => setCustom(f.id, e.target.value)} type={f.type === "number" ? "number" : "text"} inputMode={f.type === "number" ? "numeric" : "text"} className={inputCls} />
                        )}
                      </InfoField>
                    </div>
                  ))}
                </div>
              )}

              {tab === "categories" && (
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">{form.categoryIds.length} {t("reginfo.assigned")}</span>
                    <Link to="/categories" className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-muted"><Plus className="h-3.5 w-3.5" /> {t("reginfo.addCategory")}</Link>
                  </div>
                  {cats.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{t("reginfo.noCats")}</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {cats.map((c) => {
                        const on = form.categoryIds.includes(c.id!);
                        return (
                          <button
                            key={c.id}
                            onClick={() => toggleCat(c.id!)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${on ? "border-transparent bg-festive text-white shadow-soft" : "border-border bg-card text-foreground/70 hover:border-primary/30 hover:text-primary"}`}
                          >
                            {on && <Check className="h-3.5 w-3.5" />} {c.emoji} {c.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">{t("reginfo.catNote")}</p>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-festive px-6 py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.03] disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t("reginfo.save")}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function InfoField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}{required && <span className="text-destructive"> *</span>}</span>
      {children}
    </label>
  );
}
