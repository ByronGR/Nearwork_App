"use client";

// Shows a "new version available" bar when we deploy an update while a client has
// the app open. Web apps don't push new code to an already-open tab — this nudges
// the user to reload so they're never stranded on stale code.
import { useEffect, useState } from "react";

export function VersionBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let baseline: string | null = null;
    let stopped = false;

    const check = async () => {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const { v } = (await res.json()) as { v?: string };
        if (!v) return;
        if (baseline === null) {
          baseline = v; // record the version this tab loaded with
          return;
        }
        if (v !== baseline) setShow(true);
      } catch {
        /* offline / transient — try again next tick */
      }
    };

    check();
    const id = setInterval(() => { if (!stopped) check(); }, 60_000);
    // Re-check the moment they come back to the tab, so it catches quickly.
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        left: "50%",
        bottom: 20,
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 14,
        maxWidth: "calc(100vw - 32px)",
        padding: "10px 12px 10px 18px",
        background: "#0F172A",
        color: "#fff",
        borderRadius: 999,
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        fontSize: 13.5,
        fontWeight: 500,
      }}
    >
      <span>A new version of Nearwork is available.</span>
      <button
        onClick={() => window.location.reload()}
        style={{
          flexShrink: 0,
          height: 32,
          padding: "0 16px",
          background: "#16A34A",
          color: "#fff",
          border: "none",
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Refresh
      </button>
    </div>
  );
}
