import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function adminApp() {
  if (getApps().length) return getApps()[0];

  const serviceAccountJson =
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (serviceAccountJson) {
    const parsed = JSON.parse(serviceAccountJson);
    if (parsed.private_key) parsed.private_key = String(parsed.private_key).replace(/\\n/g, "\n");
    return initializeApp({ credential: cert(parsed) });
  }

  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (serviceAccountBase64) {
    const parsed = JSON.parse(Buffer.from(serviceAccountBase64, "base64").toString("utf8"));
    if (parsed.private_key) parsed.private_key = String(parsed.private_key).replace(/\\n/g, "\n");
    return initializeApp({ credential: cert(parsed) });
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "nearwork-97e3c";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY)?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin credentials in the App Vercel project. Add FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.");
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

function appResetUrl(firebaseResetLink: string) {
  const url = new URL(firebaseResetLink);
  const mode = url.searchParams.get("mode") || "resetPassword";
  const oobCode = url.searchParams.get("oobCode") || "";
  const apiKey = url.searchParams.get("apiKey") || "";
  const lang = url.searchParams.get("lang") || "en";
  const resetUrl = new URL("https://app.nearwork.co/reset-password");
  resetUrl.searchParams.set("mode", mode);
  resetUrl.searchParams.set("oobCode", oobCode);
  resetUrl.searchParams.set("apiKey", apiKey);
  resetUrl.searchParams.set("lang", lang);
  return resetUrl.toString();
}

function resetEmailHtml(resetUrl: string) {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#F5F4F0;font-family:Poppins,Arial,sans-serif;color:#111111;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F4F0;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06);">
            <tr>
              <td style="padding:32px 40px 0;">
                <div style="font-size:22px;font-weight:700;letter-spacing:-.03em;">Nearwork</div>
                <div style="width:68px;height:3px;background:#16A085;border-radius:2px;margin-top:4px;"></div>
              </td>
            </tr>
            <tr><td style="padding:20px 40px 0;"><div style="height:4px;border-radius:2px;background:linear-gradient(90deg,#16A085 0%,#AF7AC5 60%,#E74C7C 100%);"></div></td></tr>
            <tr>
              <td style="padding:36px 40px 40px;">
                <p style="font-size:40px;margin:0 0 16px;">🔐</p>
                <h1 style="font-size:26px;line-height:1.25;margin:0 0 14px;">Create or reset your client portal password</h1>
                <p style="font-size:15px;color:#555555;line-height:1.7;margin:0 0 28px;">Use the button below to set the password for your Nearwork client workspace. This link opens app.nearwork.co and is only for the client portal.</p>
                <a href="${resetUrl}" style="display:inline-block;background:#16A085;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 30px;border-radius:6px;">Create my password →</a>
                <p style="font-size:12px;color:#9E9E9E;line-height:1.6;margin:28px 0 0;">If you did not expect this email, you can ignore it. Questions? Contact <a href="mailto:support@nearwork.co" style="color:#16A085;text-decoration:none;">support@nearwork.co</a>.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "A valid email is required." }, { status: 400 });
    }

    const firebaseLink = await getAuth(adminApp()).generatePasswordResetLink(email, {
      url: "https://app.nearwork.co",
      handleCodeInApp: false,
    });
    const resetUrl = appResetUrl(firebaseLink);

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) throw new Error("Missing RESEND_API_KEY.");

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.NEARWORK_EMAIL_FROM || "Nearwork <support@nearwork.co>",
        to: email,
        subject: "Create your Nearwork client portal password",
        html: resetEmailHtml(resetUrl),
      }),
    });

    const emailResult = await emailResponse.json().catch(() => ({}));
    if (!emailResponse.ok) {
      throw new Error(emailResult.message || emailResult.error || "Resend could not send the email.");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send password reset.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
