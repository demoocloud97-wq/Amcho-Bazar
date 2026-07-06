import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  ListTree,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/site/page-header";
import { ConfirmDialog } from "@/components/site/confirm-dialog";
import { getFillSubcatsEnabled, normalizeImageUrl } from "@/lib/settings-db";
import { friendlyAuthError } from "@/lib/firebase-errors";
import { useI18n } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createCategory,
  getCategories,
  getSubCategories,
  fillDefaultSubcategories,
  updateCategory,
  deleteCategory,
  formatTimestamp,
  type Category,
  type CategoryStatus,
  type SubCategory,
} from "@/lib/categories-db";

export const Route = createFileRoute("/categories/")({
  head: () => ({
    meta: [{ title: "Manage Categories · Amcho Bazar" }],
  }),
  component: CategoriesListPage,
});

type SortKey = "name" | "created" | "status";
const PAGE_SIZE = 8;

function CategoriesListPage() {
  const { t } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subs, setSubs] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const [confirmTarget, setConfirmTarget] = useState<Category | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [fillEnabled, setFillEnabled] = useState(false);
  useEffect(() => { getFillSubcatsEnabled().then(setFillEnabled).catch(() => {}); }, []);

  // Fill every category with its default sub-categories (skips ones already there).
  async function fillSubcategories() {
    setSeeding(true);
    try {
      const created = await fillDefaultSubcategories();
      toast.success(created ? `${created} ${t("cat.subsAdded")}` : t("cat.subsAllHave"));
      await load();
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setSeeding(false);
    }
  }

  async function load() {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([getCategories(), getSubCategories()]);
      setCategories(c);
      setSubs(s);
    } catch (e) {
      console.error(e);
      toast.error(friendlyAuthError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subCount = useMemo(() => {
    const m: Record<string, number> = {};
    subs.forEach((s) => { m[s.categoryId] = (m[s.categoryId] ?? 0) + 1; });
    return m;
  }, [subs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = categories.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      else cmp = ((a.createdAt as { seconds?: number })?.seconds ?? 0) - ((b.createdAt as { seconds?: number })?.seconds ?? 0);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [categories, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  }

  async function handleDelete() {
    if (!confirmTarget) return;
    try {
      await deleteCategory(confirmTarget.id!);
      toast.success(t("cat.deleted"));
      setConfirmTarget(null);
      await load();
    } catch (e) {
      toast.error(friendlyAuthError(e));
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={t("cat.eyebrow")}
        title={t("cat.title")}
        subtitle={t("cat.subtitle")}
      />

      <section className="mx-auto max-w-6xl px-4 pb-24 pt-10 md:px-8">
        <Breadcrumbs items={[{ label: t("cat.breadcrumb") }]} />

        {/* Toolbar */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:max-w-xs sm:flex-1">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t("cat.search")}
              aria-label="Search categories"
              className="w-full rounded-full border border-border bg-card py-2.5 ps-10 pe-4 text-sm outline-none ring-primary/20 focus:ring-4"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={`${sortKey}:${sortDir}`}
              onChange={(e) => {
                const [k, d] = e.target.value.split(":") as [SortKey, "asc" | "desc"];
                setSortKey(k); setSortDir(d); setPage(1);
              }}
              aria-label="Sort categories"
              className="rounded-full border border-border bg-card px-4 py-2.5 text-sm outline-none ring-primary/20 focus:ring-4"
            >
              <option value="created:desc">{t("cat.sortNewest")}</option>
              <option value="created:asc">{t("cat.sortOldest")}</option>
              <option value="name:asc">{t("cat.sortNameAsc")}</option>
              <option value="name:desc">{t("cat.sortNameDesc")}</option>
              <option value="status:asc">{t("cat.sortStatus")}</option>
            </select>
            {fillEnabled && (
              <button
                onClick={fillSubcategories}
                disabled={seeding || categories.length === 0}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-muted disabled:opacity-50"
              >
                {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListTree className="h-4 w-4" />} {t("cat.fill")}
              </button>
            )}
            <button
              onClick={() => { setEditing(null); setFormOpen(true); }}
              className="inline-flex items-center gap-2 rounded-full bg-festive px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-105"
            >
              <Plus className="h-4 w-4" /> {t("cat.add")}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6 rounded-3xl border border-border bg-card shadow-card">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center text-muted-foreground">
              {search ? `${t("cat.noneSearch")} "${search}".` : t("cat.none")}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-4">
                        <button onClick={() => toggleSort("name")} className="inline-flex items-center gap-1 hover:text-primary">
                          {t("cat.thCategory")} <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-4 py-4">{t("cat.thSubcats")}</th>
                      <th className="px-4 py-4">
                        <button onClick={() => toggleSort("status")} className="inline-flex items-center gap-1 hover:text-primary">
                          {t("cat.thStatus")} <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-4 py-4">
                        <button onClick={() => toggleSort("created")} className="inline-flex items-center gap-1 hover:text-primary">
                          {t("cat.thCreated")} <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-right">{t("cat.thActions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paged.map((c) => (
                      <tr key={c.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-6 py-4">
                          <Link to="/categories/$categoryId" params={{ categoryId: c.id! }} className="flex items-center gap-3 group">
                            <span className="text-2xl">{c.emoji}</span>
                            <span>
                              <span className="block font-semibold text-foreground group-hover:text-primary">{c.name}</span>
                              {c.description && <span className="line-clamp-1 block max-w-xs text-xs text-muted-foreground">{c.description}</span>}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">{subCount[c.id!] ?? 0}</td>
                        <td className="px-4 py-4"><StatusBadge status={c.status} /></td>
                        <td className="px-4 py-4 text-muted-foreground">{formatTimestamp(c.createdAt)}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-1">
                            <Link to="/categories/$categoryId" params={{ categoryId: c.id! }} className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-primary" aria-label="View">
                              <Eye className="h-4 w-4" />
                            </Link>
                            <button onClick={() => { setEditing(c); setFormOpen(true); }} className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-primary" aria-label="Edit">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => setConfirmTarget(c)} className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-border px-6 py-4 text-sm">
                <span className="text-muted-foreground">
                  {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} {t("cat.of")} {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 font-medium disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" /> {t("cat.prev")}
                  </button>
                  <span className="px-2 text-muted-foreground">{t("cat.page")} {currentPage} / {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 font-medium disabled:opacity-40"
                  >
                    {t("cat.next")} <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        existingNames={categories.map((c) => ({ id: c.id!, name: c.name }))}
        onSaved={load}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        onOpenChange={(o) => !o && setConfirmTarget(null)}
        title={t("cat.deleteTitle")}
        description={confirmTarget ? t("cat.deleteDesc") : ""}
        confirmLabel={t("cat.deleteBtn")}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  editing,
  existingNames,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Category | null;
  existingNames: { id: string; name: string }[];
  onSaved: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [emoji, setEmoji] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<CategoryStatus>("active");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setEmoji(editing?.emoji ?? "");
      setName(editing?.name ?? "");
      setDescription(editing?.description ?? "");
      setImageUrl(editing?.imageUrl ?? "");
      setStatus(editing?.status ?? "active");
      setError("");
    }
  }, [open, editing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError(t("cat.errRequired")); return; }
    if (trimmed.length < 2) { setError(t("cat.errMin")); return; }
    const dup = existingNames.some((c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.id !== editing?.id);
    if (dup) { setError(t("cat.errDup")); return; }

    setBusy(true);
    try {
      const payload = { emoji: emoji.trim() || "🏷️", name: trimmed, description: description.trim(), imageUrl: imageUrl.trim(), status };
      if (editing) await updateCategory(editing.id!, payload);
      else await createCategory(payload);
      toast.success(editing ? t("cat.updated") : t("cat.created"));
      onOpenChange(false);
      await onSaved();
    } catch (err) {
      toast.error(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? t("cat.editTitle") : t("cat.addTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-[80px_1fr] gap-3">
            <div>
              <label htmlFor="cat-emoji" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("cat.emoji")}</label>
              <input id="cat-emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} placeholder="🍲" className="w-full rounded-xl border border-border bg-white/70 px-3 py-2.5 text-center text-2xl outline-none ring-primary/20 focus:ring-4" />
            </div>
            <div>
              <label htmlFor="cat-name" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("cat.name")}</label>
              <input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Food" className="w-full rounded-xl border border-border bg-white/70 px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-4" />
            </div>
          </div>
          <div>
            <label htmlFor="cat-desc" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("cat.desc")}</label>
            <textarea id="cat-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("cat.descPlaceholder")} className="min-h-[70px] w-full rounded-xl border border-border bg-white/70 px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-4" />
          </div>
          <div>
            <label htmlFor="cat-image" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("cat.imageUrl")}</label>
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-warm text-2xl">
                {imageUrl.trim() ? <img src={normalizeImageUrl(imageUrl)} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : (emoji || "🏷️")}
              </div>
              <input id="cat-image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" className="flex-1 rounded-xl border border-border bg-white/70 px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-4" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("cat.statusLabel")}</label>
            <div className="flex gap-2">
              {(["active", "inactive"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setStatus(s)} className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium capitalize transition-colors ${status === s ? "border-transparent bg-festive text-white" : "border-border bg-white/70 text-foreground/70"}`}>
                  {t(`status.${s}`)}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <button type="button" onClick={() => onOpenChange(false)} className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground">{t("cat.cancel")}</button>
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-festive px-5 py-2.5 text-sm font-semibold text-white shadow-soft disabled:opacity-50">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} {editing ? t("cat.save") : t("cat.createBtn")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const active = status === "active" || status === "assigned";
  const pending = status === "pending";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
      active ? "bg-teal/15 text-teal" : pending ? "bg-accent/25 text-primary" : status === "available" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-teal" : pending ? "bg-primary" : "bg-muted-foreground"}`} />
      {t(`status.${status}`)}
    </span>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; to?: string; params?: Record<string, string> }[] }) {
  const { t } = useI18n();
  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link to="/admin" className="hover:text-primary">{t("nav.admin")}</Link>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5" />
          {it.to ? (
            <Link {...({ to: it.to, params: it.params } as any)} className="hover:text-primary">{it.label}</Link>
          ) : (
            <span className="font-medium text-foreground">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
