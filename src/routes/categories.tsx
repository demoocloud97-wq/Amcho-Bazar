import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RequireAdmin } from "@/components/site/require-admin";

// Layout for /categories and /categories/$categoryId — both admin-only.
export const Route = createFileRoute("/categories")({
  component: () => (
    <RequireAdmin>
      <Outlet />
    </RequireAdmin>
  ),
});
