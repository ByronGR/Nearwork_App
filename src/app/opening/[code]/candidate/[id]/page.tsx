"use client";

// Clean deep link for a candidate profile within an opening
// (/opening/NW-7823/candidate/<id>). The portal reads the path and restores the
// candidate view with the right board context.
import { PortalApp } from "@/portal/portal-app";

export default function Page() {
  return <PortalApp />;
}
