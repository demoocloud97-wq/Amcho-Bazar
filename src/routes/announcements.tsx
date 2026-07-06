import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { RequireAuth } from "@/components/site/require-auth";
import { ComingSoon } from "@/components/site/coming-soon";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/announcements")({
  head: () => ({ meta: [{ title: "Announcements · Amcho Bazar" }] }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const { t } = useI18n();
  return (
    <RequireAuth>
      <div>
        <PageHeader eyebrow={t("ann.eyebrow")} title={t("ann.title")} subtitle={t("ann.subtitle")} />
        <ComingSoon icon={<Megaphone className="h-8 w-8" />} title={t("ann.csTitle")} body={t("ann.csBody")} />
      </div>
    </RequireAuth>
  );
}
