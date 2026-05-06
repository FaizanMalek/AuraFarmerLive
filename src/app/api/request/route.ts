import { NextResponse } from "next/server";
import { Resend } from "resend";

const NOTIFY_EMAIL = "osrunes001@gmail.com";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const type = typeof body.type === "string" ? body.type.trim() : "Feedback";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const figureName = typeof body.figureName === "string" ? body.figureName.trim() : "";

  if (!message || message.length < 3) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "Aura Farmer <noreply@aurafarmer.live>";

  if (!key) {
    console.warn("[request] RESEND_API_KEY not set — skipping email");
    return NextResponse.json({ ok: true });
  }

  const resend = new Resend(key);

  const subjectMap: Record<string, string> = {
    "Suggest a figure": "New figure suggestion",
    "General feedback": "New feedback",
    "Bug report": "Bug report",
    "Other": "New message",
  };
  const subjectLabel = subjectMap[type] ?? "New message";

  const html = `
    <h2 style="margin:0 0 16px;font-family:sans-serif">${escHtml(subjectLabel)} — Aura Farmer</h2>
    <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;width:100%">
      <tr>
        <td style="padding:6px 20px 6px 0;color:#888;white-space:nowrap;vertical-align:top">Type</td>
        <td style="padding:6px 0;font-weight:600">${escHtml(type)}</td>
      </tr>
      ${
        figureName
          ? `<tr>
        <td style="padding:6px 20px 6px 0;color:#888;white-space:nowrap">Figure</td>
        <td style="padding:6px 0;font-weight:600">${escHtml(figureName)}</td>
      </tr>`
          : ""
      }
      <tr>
        <td style="padding:6px 20px 6px 0;color:#888;vertical-align:top">Message</td>
        <td style="padding:6px 0;white-space:pre-wrap">${escHtml(message)}</td>
      </tr>
    </table>
    <p style="margin-top:24px;font-size:12px;color:#aaa;font-family:sans-serif">
      Submitted anonymously via aurafarmer.live
    </p>
  `;

  try {
    const { error } = await resend.emails.send({
      from,
      to: NOTIFY_EMAIL,
      subject: `[Aura Farmer] ${subjectLabel}${figureName ? `: ${figureName}` : ""}`,
      html,
    });
    if (error) {
      console.error("[request] resend error", error);
      return NextResponse.json({ error: "Email failed" }, { status: 500 });
    }
  } catch (err) {
    console.error("[request] unexpected error", err);
    return NextResponse.json({ error: "Email failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
