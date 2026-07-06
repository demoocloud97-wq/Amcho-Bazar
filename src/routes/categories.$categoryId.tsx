import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown, Calendar, ChevronLeft, ChevronRight, Check, Loader2,
  Pencil, Plus, Search, Store, Tag, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/site/page-header";
import { ConfirmDialog } from "@/components/site/confirm-dialog";
import { Breadcrumbs, StatusBadge, CategoryFormDialog } from "./categories.index";
import { friendlyAuthError } from "@/lib/firebase-errors";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  getCategory, deleteCategory, updateCategory,
  getSubCategoriesByCategory, createSubCategory, updateSubCategory, deleteSubCategory,
  formatTimestamp, type Category, type SubCategory,
} from "@/lib/categories-db";
import {
  getStallsByCategory, createStall, deleteStall,
  type Stall, type StallStatus,
} from "@/lib/stalls-db";
import { useSeason } from "@/lib/season-context";
import { useI18n } from "@/lib/i18n";
import { getRegistrationsBySeasonId, type Registration } from "@/lib/db";

export const Route = createFileRoute("/categories/$categoryId")({
  head: () => ({ meta: [{ title: "Category Details · Amcho Bazar" }] }),
  component: CategoryDetailPage,
});

function CategoryDetailPage() {
  const { categoryId } = Route.useParams();
  const { seasonId } = useSeason();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [category, setCategory] = useState<Category | null>(null);
  const [subs, setSubs] = useState<SubCategory[]>([]);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelCat, setConfirmDelCat] = useState(false);

  async function loadAll() {
    try {
      const [c, s, st] = await Promise.all([
        getCategory(categoryId),
        getSubCategoriesByCategory(categoryId),
        getStallsByCategory(categoryId),
      ]);
      setCategory(c);
      setSubs(s);
      // Categories are shared across seasons, but their stalls are season-scoped —
      // only show stalls belonging to the currently selected season.
      setStalls(seasonId ? st.filter((x) => x.seasonId === seasonId) : st);
      // Sellers who registered under this category in the selected season.
      if (c && seasonId) {
        const allRegs = await getRegistrationsBySeasonId(seasonId);
        const name = (c.name || "").toLowerCase();
        setRegs(allRegs.filter((r) => {
          const cats = r.categories?.length ? r.categories : [r.category];
          return cats.some((x) => (x || "").toLowerCase() === name);
        }));
      } else {
        setRegs([]);
      }
    } catch (e) {
      console.error(e);
      toast.error(friendlyAuthError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, seasonId]);

  async function toggleStatus() {
    if (!category) return;
    const next = category.status === "active" ? "inactive" : "active";
    try {
      await updateCategory(category.id!, { status: next });
      toast.success(next === "active" ? t("catd.actToast") : t("catd.deactToast"));
      await loadAll();
    } catch (e) {
      toast.error(friendlyAuthError(e));
    }
  }

  async function handleDeleteCategory() {
    if (!category) return;
    try {
      await deleteCategory(category.id!);
      toast.success(t("cat.deleted"));
      navigate({ to: "/categories" });
    } catch (e) {
      toast.error(friendlyAuthError(e));
    }
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!category) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="rounded-3xl border border-border bg-card p-12 shadow-card">
          <h1 className="font-display text-2xl font-bold">{t("catd.notFound")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("catd.notFoundBody")}</p>
          <Link to="/categories" className="mt-6 inline-flex rounded-full bg-festive px-6 py-2.5 text-sm font-semibold text-white shadow-soft">{t("catd.back")}</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow={t("catd.eyebrow")} title={<><span className="mr-2">{category.emoji}</span>{category.name}</>} />

      <section className="mx-auto max-w-6xl px-4 pb-24 pt-10 md:px-8">
        <Breadcrumbs items={[{ label: t("cat.breadcrumb"), to: "/categories" }, { label: category.name }]} />

        {/* 1. Category information */}
        <div className="mt-4 rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="text-5xl">{category.emoji}</div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-2xl font-bold">{category.name}</h2>
                  <StatusBadge status={category.status} />
                </div>
                {category.description && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{category.description}</p>}
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {t("catd.created")} {formatTimestamp(category.createdAt)}</span>
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {t("catd.updated")} {formatTimestamp(category.updatedAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={toggleStatus} className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
                {category.status === "active" ? t("catd.deactivate") : t("catd.activate")}
              </button>
              <button onClick={() => setEditOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
                <Pencil className="h-4 w-4" /> {t("sea.edit")}
              </button>
              <button onClick={() => setConfirmDelCat(true)} className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        </div>

        {/* 2. Registered sellers in this category (this season) */}
        <RegisteredSellers regs={regs} />

        {/* 3. Subcategory management */}
        <SubcategorySection categoryId={category.id!} subs={subs} onChanged={loadAll} />

        {/* 3. Stall management */}
        <StallSection categoryId={category.id!} subs={subs} stalls={stalls} onChanged={loadAll} />
      </section>

      <CategoryFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editing={category}
        existingNames={[]}
        onSaved={loadAll}
      />

      <ConfirmDialog
        open={confirmDelCat}
        onOpenChange={setConfirmDelCat}
        title={t("catd.delTitle")}
        description={t("catd.delDesc")}
        confirmLabel={t("cat.deleteBtn")}
        onConfirm={handleDeleteCategory}
      />
    </div>
  );
}

/* ======================= Registered sellers section ========================= */

function RegisteredSellers({ regs }: { regs: Registration[] }) {
  const { t } = useI18n();
  const badge = (s: Registration["status"]) =>
    s === "approved" || s === "paid" ? "bg-teal/15 text-teal" : s === "pending" ? "bg-accent/25 text-primary" : "bg-secondary/15 text-secondary";
  return (
    <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold">{t("catd.regSellers")}</h3>
          <p className="text-sm text-muted-foreground">{t("catd.regSellersSub")}</p>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{regs.length}</span>
      </div>
      {regs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          {t("catd.noRegs")}
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {regs.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-border bg-background/50 p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-festive text-xs font-bold text-white">
                {(r.seller || "?").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{r.business || r.seller}</div>
                <div className="truncate text-xs text-muted-foreground">{r.seller}</div>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${badge(r.status)}`}>{t(`myreg.status.${r.status}`)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================ Subcategory section ============================ */

const SUB_PAGE = 6;

function SubcategorySection({ categoryId, subs, onChanged }: { categoryId: string; subs: SubCategory[]; onChanged: () => Promise<void> }) {
  const { seasonId } = useSeason();
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<SubCategory | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subs.filter((s) => !q || s.name.toLowerCase().includes(q));
  }, [subs, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / SUB_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * SUB_PAGE, currentPage * SUB_PAGE);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (subs.some((s) => s.name.toLowerCase() === name.toLowerCase())) { toast.error(t("catd.subExists")); return; }
    setBusy(true);
    try {
      await createSubCategory({ categoryId, name, seasonId: seasonId ?? undefined });
      setNewName("");
      toast.success(t("catd.subAdded"));
      await onChanged();
    } catch (err) { toast.error(friendlyAuthError(err)); } finally { setBusy(false); }
  }

  async function saveEdit(id: string) {
    const name = editName.trim();
    if (!name) return;
    setBusy(true);
    try {
      await updateSubCategory(id, { name });
      setEditId(null);
      toast.success(t("catd.subUpdated"));
      await onChanged();
    } catch (err) { toast.error(friendlyAuthError(err)); } finally { setBusy(false); }
  }

  async function remove() {
    if (!confirmTarget) return;
    setBusy(true);
    try {
      await deleteSubCategory(confirmTarget.id!);
      setConfirmTarget(null);
      toast.success(t("catd.subDeleted"));
      await onChanged();
    } catch (err) { toast.error(friendlyAuthError(err)); } finally { setBusy(false); }
  }

  return (
    <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 font-display text-xl font-semibold"><Tag className="h-5 w-5 text-primary" /> {t("catd.subcats")} <span className="text-sm font-normal text-muted-foreground">({subs.length})</span></h3>
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t("catd.searchShort")} aria-label="Search sub-categories" className="rounded-full border border-border bg-white/70 py-2 ps-9 pe-4 text-sm outline-none ring-primary/20 focus:ring-4" />
        </div>
      </div>

      <form onSubmit={add} className="mt-4 flex gap-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t("catd.newSub")} aria-label="New sub-category name" className="flex-1 rounded-full border border-border bg-white/70 px-4 py-2.5 text-sm outline-none ring-primary/20 focus:ring-4" />
        <button type="submit" disabled={busy || !newName.trim()} className="inline-flex items-center gap-1 rounded-full bg-festive px-5 py-2.5 text-sm font-semibold text-white shadow-soft disabled:opacity-40">
          <Plus className="h-4 w-4" /> {t("catd.add")}
        </button>
      </form>

      <div className="mt-4 divide-y divide-border">
        {paged.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">{search ? t("catd.noSubsMatch") : t("catd.noSubs")}</div>
        ) : (
          paged.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 py-3">
              {editId === s.id ? (
                <>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus className="flex-1 rounded-lg border border-border bg-white/70 px-3 py-1.5 text-sm outline-none ring-primary/20 focus:ring-4" />
                  <div className="flex gap-1">
                    <button onClick={() => saveEdit(s.id!)} disabled={busy} className="rounded-full p-2 text-teal hover:bg-teal/10" aria-label="Save"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setEditId(null)} className="rounded-full p-2 text-muted-foreground hover:bg-muted" aria-label="Cancel"><X className="h-4 w-4" /></button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium">{s.name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditId(s.id!); setEditName(s.name); }} className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-primary" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setConfirmTarget(s)} className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {filtered.length > SUB_PAGE && <Pager page={currentPage} totalPages={totalPages} onPrev={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => Math.min(totalPages, p + 1))} />}

      <ConfirmDialog
        open={!!confirmTarget}
        onOpenChange={(o) => !o && setConfirmTarget(null)}
        title={t("catd.subDelTitle")}
        description={confirmTarget ? t("catd.willBeRemoved") : ""}
        confirmLabel={t("cat.deleteBtn").split(" ")[0]}
        onConfirm={remove}
      />
    </div>
  );
}

/* ============================ Stall section ============================ */

const STALL_PAGE = 6;
type StallSort = "name" | "status" | "owner";

function StallSection({ categoryId, subs, stalls, onChanged }: { categoryId: string; subs: SubCategory[]; stalls: Stall[]; onChanged: () => Promise<void> }) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [subFilter, setSubFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<StallSort>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Stall | null>(null);

  const subName = useMemo(() => {
    const m: Record<string, string> = {};
    subs.forEach((s) => { if (s.id) m[s.id] = s.name; });
    return m;
  }, [subs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = stalls.filter((s) => {
      const matchesQ = !q || s.name.toLowerCase().includes(q) || s.owner.toLowerCase().includes(q);
      const matchesSub = subFilter === "all" || (subFilter === "none" ? !s.subcategoryId : s.subcategoryId === subFilter);
      return matchesQ && matchesSub;
    });
    list = [...list].sort((a, b) => {
      const cmp = (a[sortKey] ?? "").toString().localeCompare((b[sortKey] ?? "").toString());
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [stalls, search, subFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / STALL_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * STALL_PAGE, currentPage * STALL_PAGE);

  function toggleSort(key: StallSort) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  }

  async function remove() {
    if (!confirmTarget) return;
    try {
      await deleteStall(confirmTarget.id!);
      setConfirmTarget(null);
      toast.success(t("catd.stallDeleted"));
      await onChanged();
    } catch (err) { toast.error(friendlyAuthError(err)); }
  }

  return (
    <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 font-display text-xl font-semibold"><Store className="h-5 w-5 text-primary" /> {t("catd.stalls")} <span className="text-sm font-normal text-muted-foreground">({stalls.length})</span></h3>
        <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-festive px-5 py-2.5 text-sm font-semibold text-white shadow-soft"><Plus className="h-4 w-4" /> {t("catd.addStall")}</button>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t("catd.searchNameOwner")} aria-label="Search stalls" className="w-full rounded-full border border-border bg-white/70 py-2.5 ps-9 pe-4 text-sm outline-none ring-primary/20 focus:ring-4" />
        </div>
        <select value={subFilter} onChange={(e) => { setSubFilter(e.target.value); setPage(1); }} aria-label="Filter by sub-category" className="rounded-full border border-border bg-white/70 px-4 py-2.5 text-sm outline-none ring-primary/20 focus:ring-4">
          <option value="all">{t("catd.allSubs")}</option>
          <option value="none">{t("catd.unassignedDash")}</option>
          {subs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        {paged.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            {stalls.length === 0 ? t("catd.noStalls") : t("catd.noStallsMatch")}
          </div>
        ) : (
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="py-3 pr-4"><button onClick={() => toggleSort("name")} className="inline-flex items-center gap-1 hover:text-primary">{t("catd.thStall")} <ArrowUpDown className="h-3 w-3" /></button></th>
                <th className="py-3 pr-4"><button onClick={() => toggleSort("owner")} className="inline-flex items-center gap-1 hover:text-primary">{t("catd.thOwner")} <ArrowUpDown className="h-3 w-3" /></button></th>
                <th className="py-3 pr-4">{t("catd.thSubcat")}</th>
                <th className="py-3 pr-4"><button onClick={() => toggleSort("status")} className="inline-flex items-center gap-1 hover:text-primary">{t("cat.thStatus")} <ArrowUpDown className="h-3 w-3" /></button></th>
                <th className="py-3 text-right">{t("catd.thAction")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map((s) => (
                <tr key={s.id} className="hover:bg-muted/40">
                  <td className="py-3 pr-4 font-medium">{s.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{s.owner || "—"}</td>
                  <td className="py-3 pr-4">{s.subcategoryId ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{subName[s.subcategoryId] ?? "—"}</span> : <span className="text-xs text-muted-foreground">{t("catd.unassigned")}</span>}</td>
                  <td className="py-3 pr-4"><StatusBadge status={s.status} /></td>
                  <td className="py-3 text-right">
                    <button onClick={() => setConfirmTarget(s)} className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > STALL_PAGE && <Pager page={currentPage} totalPages={totalPages} onPrev={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => Math.min(totalPages, p + 1))} />}

      <StallFormDialog open={addOpen} onOpenChange={setAddOpen} categoryId={categoryId} subs={subs} onSaved={onChanged} />

      <ConfirmDialog
        open={!!confirmTarget}
        onOpenChange={(o) => !o && setConfirmTarget(null)}
        title={t("catd.stallDelTitle")}
        description={confirmTarget ? t("catd.willBeRemoved") : ""}
        confirmLabel={t("cat.deleteBtn").split(" ")[0]}
        onConfirm={remove}
      />
    </div>
  );
}

function StallFormDialog({ open, onOpenChange, categoryId, subs, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; categoryId: string; subs: SubCategory[]; onSaved: () => Promise<void> }) {
  const { seasonId } = useSeason();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState<StallStatus>("available");
  const [subcategoryId, setSubcategoryId] = useState<string>("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) { setName(""); setOwner(""); setStatus("available"); setSubcategoryId(""); setError(""); }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError(t("catd.stallNameReq")); return; }
    setBusy(true);
    try {
      await createStall({ name: name.trim(), owner: owner.trim(), status, categoryId, subcategoryId: subcategoryId || null, seasonId: seasonId ?? undefined });
      toast.success(t("catd.stallAdded"));
      onOpenChange(false);
      await onSaved();
    } catch (err) { toast.error(friendlyAuthError(err)); } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{t("catd.addStallTitle")}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="stall-name" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("catd.stallName")}</label>
            <input id="stall-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Stall #12 / Ayesha's Kitchen" className="w-full rounded-xl border border-border bg-white/70 px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-4" />
          </div>
          <div>
            <label htmlFor="stall-owner" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("catd.owner")}</label>
            <input id="stall-owner" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder={t("catd.ownerPlaceholder")} className="w-full rounded-xl border border-border bg-white/70 px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-4" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="stall-sub" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("catd.thSubcat")}</label>
              <select id="stall-sub" value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)} className="w-full rounded-xl border border-border bg-white/70 px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-4">
                <option value="">{t("catd.unassigned")}</option>
                {subs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="stall-status" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("catd.statusLabel")}</label>
              <select id="stall-status" value={status} onChange={(e) => setStatus(e.target.value as StallStatus)} className="w-full rounded-xl border border-border bg-white/70 px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-4">
                <option value="available">{t("catd.stAvailable")}</option>
                <option value="pending">{t("catd.stPending")}</option>
                <option value="assigned">{t("catd.stAssigned")}</option>
              </select>
            </div>
          </div>
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <button type="button" onClick={() => onOpenChange(false)} className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground">{t("cat.cancel")}</button>
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-festive px-5 py-2.5 text-sm font-semibold text-white shadow-soft disabled:opacity-50">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t("catd.addStallTitle")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Pager({ page, totalPages, onPrev, onNext }: { page: number; totalPages: number; onPrev: () => void; onNext: () => void }) {
  const { t } = useI18n();
  return (
    <div className="mt-4 flex items-center justify-end gap-1 text-sm">
      <button onClick={onPrev} disabled={page === 1} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 font-medium disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> {t("cat.prev")}</button>
      <span className="px-2 text-muted-foreground">{t("cat.page")} {page} / {totalPages}</span>
      <button onClick={onNext} disabled={page === totalPages} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 font-medium disabled:opacity-40">{t("cat.next")} <ChevronRight className="h-4 w-4" /></button>
    </div>
  );
}
