"use client";

// Clean deep link for a candidate profile by id (/candidate/<id>), used when
// there's no board context. The portal reads the path and restores the view.
import { PortalApp } from "@/portal/portal-app";

export default function Page() {
  return <PortalApp />;
}
