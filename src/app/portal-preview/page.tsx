"use client";

// Temporary preview of the new-portal shell rendering as real native components.
// Removed once the real screens are mounted at the root.
import { PortalComingSoon } from "@/portal/shell";

const CLIENT = {
  company: "Lumen Health",
  user: { name: "Sarah Mitchell", initials: "SM", role: "Head of Engineering" },
};

export default function PortalPreviewPage() {
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <PortalComingSoon
        active="overview"
        title="The frame is up"
        desc="Sidebar + top bar are now real native components — screens plug in next."
        icon="layout-dashboard"
        client={CLIENT}
      />
    </div>
  );
}
