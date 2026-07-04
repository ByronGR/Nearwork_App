"use client";

// New client portal (Sprint 2). Real login → the new design shell with real
// Firebase data. Built screens render live; not-yet-built screens show a polished
// "Coming soon" in the same shell. Replaces the Sprint-1 static iframe preview.
// The previous portal still lives at @/components/client-portal for reference.
import { PortalApp } from "@/portal/portal-app";

export default function Home() {
  return <PortalApp />;
}
