import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { RequireAdmin } from "@/components/site/require-admin";
import { ComingSoon } from "@/components/site/coming-soon";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports & Analytics · Amcho Bazar" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { t } = useI18n();
  return (
    <RequireAdmin>
      <div>
        <PageHeader eyebrow={t("reports.eyebrow")} title={t("reports.title")} subtitle={t("reports.subtitle")} />
        <ComingSoon icon={<BarChart3 className="h-8 w-8" />} title={t("reports.csTitle")} body={t("reports.csBody")} />
      </div>
    </RequireAdmin>
  );
}
