import { createFileRoute } from "@tanstack/react-router";
import { ReviewLanding } from "@/components/site/review-form";

// A per-stall QR code: /review/<registrationId>. The stall name is resolved on the
// page itself from the public stalls list.
export const Route = createFileRoute("/review/$businessId")({
  head: () => ({
    meta: [
      { title: "Leave a Review · Amcho Bazar" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReviewBusinessPage,
});

function ReviewBusinessPage() {
  const { businessId } = Route.useParams();
  return <ReviewLanding businessId={businessId} />;
}
