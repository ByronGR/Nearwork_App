"use client";

// Kept as an alias so existing preview links still work — the new portal now
// lives at the root ("/"). Both render the same PortalApp.
import { PortalApp } from "@/portal/portal-app";

export default function PortalPreviewPage() {
  return <PortalApp />;
}
