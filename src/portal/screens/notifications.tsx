"use client";

// ── Notifications page — the full list behind the top-bar bell ────────────────
// Self-subscribes (via usePortalNotifications) so it needs no data props. Each
// row can be opened (marks read + navigates), and toggled read/unread.

import React from "react";
import { NW, Icon } from "../primitives";
import {
  PortalSidebar,
  PortalTopBar,
  usePortalNotifications,
  notifRelTime,
  notifTarget,
  type PortalClient,
  type NavHandler,
} from "../shell";
import { markNotificationRead, markNotificationUnread, type PortalNotification } from "@/lib/firebase-client";

const CAT_ICON: Record<string, { icon: string; color: string; bg: string }> = {
  Pipeline: { icon: "git-branch", color: NW.teal600, bg: NW.teal50 },
  Kickoff: { icon: "clipboard-check", color: NW.violet500, bg: NW.violet50 },
  Note: { icon: "message-square-text", color: NW.violet500, bg: NW.violet50 },
  Team: { icon: "users", color: NW.teal600, bg: NW.teal50 },
  Access: { icon: "user-plus", color: NW.teal600, bg: NW.teal50 },
  Billing: { icon: "wallet", color: "#A16207", bg: NW.yellow50 },
};
const catIcon = (n: PortalNotification) => CAT_ICON[n.category || ""] || { icon: "bell", color: NW.gray600, bg: NW.gray50 };

export function NotificationsScreen({ client, density = "regular", onNav }: {
  client: PortalClient;
  density?: "regular" | "compact";
  onNav?: NavHandler;
}) {
  const dense = density === "compact";
  const pad = dense ? 32 : 44;
  const items = usePortalNotifications();
  const unread = items.filter((n) => !n.read).length;
  const open = (n: PortalNotification) => { if (!n.read) markNotificationRead(n.id).catch(() => {}); notifTarget(n, onNav); };
  const markAll = () => items.filter((n) => !n.read).forEach((n) => markNotificationRead(n.id).catch(() => {}));

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: NW.offWhite, color: NW.black, fontFamily: "Poppins, sans-serif" }}>
      <PortalSidebar active="" density={density} onNav={onNav} client={client} />
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <PortalTopBar dense={dense} onNav={onNav} />
        <div style={{ flex: 1, overflow: "auto", padding: `${dense ? 28 : 40}px ${pad}px ${pad}px` }}>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>Inbox</div>
                <h1 style={{ fontSize: dense ? 34 : 44, fontWeight: 700, color: NW.black, letterSpacing: "-0.04em", lineHeight: 1.02, margin: 0 }}>Notifications</h1>
                <p style={{ fontSize: 14, color: NW.gray500, marginTop: 10 }}>{unread > 0 ? `${unread} unread` : "You're all caught up."}</p>
              </div>
              {unread > 0 && (
                <button onClick={markAll} style={{ display: "inline-flex", alignItems: "center", gap: 7, border: `1px solid ${NW.gray200}`, background: NW.white, borderRadius: 10, padding: "9px 14px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: NW.gray700, cursor: "pointer" }}>
                  <Icon name="check-check" size={15} color={NW.teal600} /> Mark all read
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "72px 20px", background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 20 }}>
                <div style={{ width: 54, height: 54, borderRadius: 16, background: NW.gray50, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Icon name="bell" size={22} color={NW.gray400} /></div>
                <div style={{ fontSize: 15, fontWeight: 600, color: NW.gray700 }}>Nothing here yet</div>
                <p style={{ fontSize: 13, color: NW.gray500, marginTop: 6 }}>Updates on your candidates, briefs, and team will show up here.</p>
              </div>
            ) : (
              <div style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 20, overflow: "hidden" }}>
                {items.map((n, i) => {
                  const ic = catIcon(n);
                  return (
                    <div key={n.id} style={{ display: "flex", gap: 14, padding: dense ? "14px 18px" : "16px 22px", borderTop: i === 0 ? "none" : `1px solid ${NW.gray100}`, background: n.read ? NW.white : NW.teal50 }}>
                      <span style={{ width: 36, height: 36, borderRadius: 11, background: ic.bg, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={ic.icon} size={17} color={ic.color} /></span>
                      <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => open(n)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          {n.category && <span style={{ fontSize: 9.5, fontWeight: 700, color: ic.color, background: ic.bg, padding: "2px 7px", borderRadius: 999, letterSpacing: "0.04em", textTransform: "uppercase" }}>{n.category}</span>}
                          <span style={{ fontSize: 10.5, color: NW.gray400 }}>{notifRelTime(n.createdAt)}</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: NW.black, marginTop: 4, lineHeight: 1.35 }}>{n.title || "Update"}</div>
                        {(n.message || n.body) && <div style={{ fontSize: 13, color: NW.gray600, marginTop: 2, lineHeight: 1.45 }}>{n.message || n.body}</div>}
                      </div>
                      <button
                        title={n.read ? "Mark as unread" : "Mark as read"}
                        onClick={() => (n.read ? markNotificationUnread(n.id) : markNotificationRead(n.id)).catch(() => {})}
                        style={{ flexShrink: 0, alignSelf: "flex-start", border: `1px solid ${NW.gray200}`, background: NW.white, borderRadius: 8, padding: "6px 10px", fontFamily: "inherit", fontSize: 11.5, fontWeight: 600, color: NW.gray600, cursor: "pointer", whiteSpace: "nowrap" }}
                      >
                        {n.read ? "Unread" : "Read"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
