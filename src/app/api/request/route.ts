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

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "Other";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (name.length > 100) {
    return NextResponse.json({ error: "Name too long" }, { status: 400 });
  }

  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "Aura Farmer <noreply@aurafarmer.live>";

  if (!key) {
    // No email configured — still return success so form works after setup
    console.warn("[request] RESEND_API_KEY not set — skipping email");
    return NextResponse.json({ ok: true });
  }

  const resend = new Resend(key);

  const html = `
    <h2 style="margin:0 0 12px">New figure request on Aura Farmer</h2>
    <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      <tr>
        <td style="padding:6px 16px 6px 0;color:#888;white-space:nowrap">Name</td>
        <td style="padding:6px 0;font-weight:600">${escHtml(name)}</td>
      </tr>
      <tr>
        <td style="padding:6px 16px 6px 0;color:#888">Category</td>
        <td style="padding:6px 0">${escHtml(category)}</td>
      </tr>
      ${
        notes
          ? `<tr>
        <td style="padding:6px 16px 6px 0;color:#888;vertical-align:top">Notes</td>
        <td style="padding:6px 0">${escHtml(notes)}</td>
      </tr>`
          : ""
      }
    </table>
    <p style="margin-top:20px;font-size:12px;color:#aaa">
      Submitted via aurafarmer.live
    </p>
  `;

  try {
    const { error } = await resend.emails.send({
      from,
      to: NOTIFY_EMAIL,
      subject: `[Aura Farmer] New request: ${name}`,
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
