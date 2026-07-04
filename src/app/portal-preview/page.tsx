"use client";

// Preview of the new-portal native Overview screen wired to REAL Firebase data
// (Sprint 2). Log into the portal first (e.g. via the old portal routes), then
// visit this page — it picks up your session and shows your company's real data.
// Removed once the real screens are mounted at the root.

import { OverviewScreen } from "@/portal/screens/overview";
import { usePortalData } from "@/portal/use-portal-data";
import { toPortalClient, toOverviewData } from "@/portal/map-overview";
import { NW } from "@/portal/primitives";

function StatusScreen({ title, desc }: { title: string; desc: string }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: NW.offWhite,
        fontFamily: "Poppins, sans-serif",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: NW.black, letterSpacing: "-0.02em", marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 14, lineHeight: 1.5, color: NW.gray500 }}>{desc}</div>
      </div>
    </div>
  );
}

export default function PortalPreviewPage() {
  const { status, profile, org, pipelines, openings } = usePortalData();

  if (status === "loading") {
    return <StatusScreen title="Loading your portal…" desc="Fetching your company's live data from Firebase." />;
  }
  if (status === "signed-out") {
    return (
      <StatusScreen
        title="Please sign in first"
        desc="Log into the client portal in this browser, then reload this page to preview it with your real data."
      />
    );
  }
  if (status === "no-org") {
    return (
      <StatusScreen
        title="No company workspace yet"
        desc="Your account isn't connected to a company workspace. Ask Nearwork to add you to an organization."
      />
    );
  }

  const client = toPortalClient(profile, org);
  const data = toOverviewData(pipelines, openings, profile);

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <OverviewScreen client={client} data={data} onNav={() => {}} />
    </div>
  );
}
