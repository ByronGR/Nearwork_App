// New client-portal design (Sprint 1 — visual only, placeholder data).
// The approved design prototype is served statically from /public/portal and
// embedded full-screen here, so the root URL stays clean (no /v3). Sprint 2
// replaces this with the real, Firebase-wired components.
// The previous portal still lives in @/components/client-portal for reference.
export default function Home() {
  return (
    <iframe
      src="/portal/index.html"
      title="Nearwork — Client Portal"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none" }}
    />
  );
}
