import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/lib/i18n";

// Controlled confirmation dialog for destructive actions.
export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description,
  confirmLabel = "Delete",
  destructive = true,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  const { t } = useI18n();
  const accent = destructive ? "text-destructive" : "text-primary";
  const chip = destructive ? "bg-destructive/10" : "bg-primary/10";
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md gap-0 rounded-3xl p-0 shadow-glow">
        <AlertDialogHeader className="items-center space-y-3 px-6 pt-7 text-center sm:text-center">
          <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ring-inset ring-black/5 ${chip} ${accent}`}>
            <AlertTriangle className="h-7 w-7" />
          </span>
          <AlertDialogTitle className="font-display text-xl font-bold">{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 px-6 pb-6 pt-6 sm:justify-center">
          <AlertDialogCancel className="min-h-11 flex-1 rounded-full sm:flex-none sm:min-w-28">
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={`min-h-11 flex-1 rounded-full font-semibold shadow-soft transition-transform hover:scale-[1.02] sm:flex-none sm:min-w-28 ${
              destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-festive text-white"
            }`}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
