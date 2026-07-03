"use client";

// Temporary preview of the new-portal native screens (placeholder data).
// Removed once the real screens are mounted at the root + wired to Firebase.
import { OverviewScreen } from "@/portal/screens/overview";
import { MOCK_CLIENT, MOCK_OVERVIEW } from "@/portal/mock-data";

export default function PortalPreviewPage() {
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <OverviewScreen client={MOCK_CLIENT} data={MOCK_OVERVIEW} onNav={() => {}} />
    </div>
  );
}
