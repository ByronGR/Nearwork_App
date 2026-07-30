"use client";

// Clean deep link for an opening board (/opening/NW-7823 — mirrors the Admin
// code). The portal reads the path itself and restores the pipeline view.
import { PortalApp } from "@/portal/portal-app";

export default function Page() {
  return <PortalApp />;
}
