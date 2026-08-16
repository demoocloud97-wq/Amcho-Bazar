import { createFileRoute } from "@tanstack/react-router";
import { ReviewLanding } from "@/components/site/review-form";
import { AMCHO_BAZAR_EVENT_ID } from "@/lib/events-db";

// The bazaar-wide QR code lands here. Per-stall codes use /review/$businessId.
export const Route = createFileRoute("/review/")({
  head: () => ({
    meta: [
      { title: "Leave a Review · Amcho Bazar" },
      { name: "description", content: "Tell us about your Amcho Bazar experience — it only takes a minute." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <ReviewLanding businessId={AMCHO_BAZAR_EVENT_ID} />,
});
