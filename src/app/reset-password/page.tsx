"use client";

import { useEffect, useMemo, useState } from "react";
import {
  confirmClientPasswordReset,
  loginWithEmail,
  sendClientPasswordReset,
  setClientRememberMe,
  verifyClientPasswordResetCode,
} from "@/lib/firebase-client";

export default function ResetPasswordPage() {
  const params = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);
  const oobCode = params.get("oobCode") || "";
  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const isRequestMode = !oobCode;

  useEffect(() => {
    let active = true;
    async function verify() {
      if (!oobCode) {
        setReady(false);
        return;
      }
      try {
        const resetEmail = await verifyClientPasswordResetCode(oobCode);
        if (!active) return;
        setEmail(resetEmail);
        setReady(true);
      } catch {
        if (!active) return;
        setError("This password setup link is invalid or expired. Ask Nearwork to resend your invitation.");
      }
    }
    verify();
    return () => {
      active = false;
    };
  }, [oobCode]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (isRequestMode) {
      if (!email.trim()) {
        setError("Enter your email so we can send your client portal password setup link.");
        return;
      }
      setBusy(true);
      try {
        await sendClientPasswordReset(email);
        setMessage("Password setup email sent. Check your inbox for a link to app.nearwork.co.");
      } catch (err) {
        const detail = err instanceof Error ? err.message : "Could not send the password setup email.";
        setError(detail);
      } finally {
        setBusy(false);
      }
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await confirmClientPasswordReset(oobCode, password);
      await setClientRememberMe(true);
      await loginWithEmail(email, password);
      setMessage("Password saved. Taking you to your company portal...");
      window.setTimeout(() => {
        window.location.href = "/";
      }, 700);
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Could not save the password.";
      setError(detail.includes("auth/expired-action-code") ? "This link expired. Ask Nearwork to resend the invitation." : detail);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8fa] px-5 py-10 text-[#24292f]">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-[#d8dee4] bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#12866E]">app.nearwork.co</p>
        <h1 className="mt-2 text-3xl font-black">{isRequestMode ? "Reset your password" : "Create your password"}</h1>
        <p className="mt-2 text-sm leading-6 text-[#57606a]">
          {isRequestMode
            ? "Enter your invited client email and we will send a password setup link for app.nearwork.co."
            : "This page is only for Nearwork client portal access. Set your password and you will be taken to your company workspace."}
        </p>
        <label className="mt-5 block text-sm font-bold">
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} readOnly={!isRequestMode} type="email" className="mt-2 h-11 w-full rounded-md border border-[#d8dee4] bg-[#f6f8fa] px-3 text-[#57606a] outline-none" />
        </label>
        {!isRequestMode ? (
          <>
            <label className="mt-4 block text-sm font-bold">
              New password
              <input value={password} onChange={(event) => setPassword(event.target.value)} disabled={!ready || busy} type="password" className="mt-2 h-11 w-full rounded-md border border-[#d8dee4] px-3 outline-none focus:border-[#12866E] disabled:bg-[#f6f8fa]" required />
            </label>
            <label className="mt-4 block text-sm font-bold">
              Confirm password
              <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={!ready || busy} type="password" className="mt-2 h-11 w-full rounded-md border border-[#d8dee4] px-3 outline-none focus:border-[#12866E] disabled:bg-[#f6f8fa]" required />
            </label>
          </>
        ) : null}
        {message ? <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div> : null}
        {error ? <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
        <button disabled={(!isRequestMode && !ready) || busy} className="mt-5 h-11 w-full rounded-md bg-[#12866E] text-sm font-black text-white disabled:opacity-60">
          {busy ? "Working..." : isRequestMode ? "Send setup link" : ready ? "Save password" : "Checking link..."}
        </button>
      </form>
    </main>
  );
}
