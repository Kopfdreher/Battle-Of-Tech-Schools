"use server"

import { Resend } from "resend"

export type SendInvitationParams = {
  landlordName: string
  flatAddress: string
  date: string
  time: string
  count: number
  applicantNames: string[]
  recipientEmail?: string
}

export type SendInvitationResult = {
  success: boolean
  simulated?: boolean
  error?: string
  recipient: string
  messageId?: string
}

const DEFAULT_SAMPLE_EMAIL = "besichtigo@gmail.com"

export async function sendInvitationEmail(
  params: SendInvitationParams
): Promise<SendInvitationResult> {
  const apiKey = process.env.RESEND_API_KEY
  const recipient =
    params.recipientEmail ||
    process.env.INVITE_SAMPLE_EMAIL ||
    DEFAULT_SAMPLE_EMAIL

  const formattedDate = (() => {
    try {
      const when = new Date(`${params.date}T${params.time}:00`)
      return new Intl.DateTimeFormat("de-DE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Berlin",
      }).format(when)
    } catch {
      return `${params.date} um ${params.time} Uhr`
    }
  })()

  // 如果没有配置 RESEND_API_KEY，返回模拟成功，方便无 key 环境下演示与开发
  if (!apiKey || apiKey.trim() === "" || apiKey === "re_your_api_key_here") {
    console.warn(
      `[BesichtiGo] RESEND_API_KEY is not configured. Simulated email invitation to ${recipient}.`
    )
    return {
      success: true,
      simulated: true,
      recipient,
      messageId: `simulated-${Date.now()}`,
    }
  }

  try {
    const resend = new Resend(apiKey)
    const fromAddress =
      process.env.RESEND_FROM_EMAIL || "BesichtiGo <onboarding@resend.dev>"

    const namesListHtml =
      params.applicantNames.length > 0
        ? `<div style="margin: 16px 0; padding: 12px 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Eingeladene Bewerber (${params.applicantNames.length})</p>
            <p style="margin: 0; font-size: 14px; color: #1e293b; line-height: 1.5;">${params.applicantNames.join(", ")}</p>
          </div>`
        : ""

    const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Einladung zur Wohnungsbesichtigung</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 32px 28px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display: inline-block; padding: 4px 10px; background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                      BesichtiGo Match
                    </span>
                    <h1 style="margin: 12px 0 4px; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
                      Einladung zur Wohnungsbesichtigung
                    </h1>
                    <p style="margin: 0; font-size: 14px; color: #94a3b8;">
                      Offizielle Terminbestätigung für Mietinteressenten
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #334155;">
                Guten Tag,
              </p>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #334155;">
                herzlichen Glückwunsch! Ihr Profil wurde von <strong>${params.landlordName}</strong> geprüft und vorausgewählt. Wir freuen uns, Sie zu einer persönlichen Wohnungsbesichtigung einzuladen.
              </p>

              <!-- Details Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom: 14px;">
                          <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Besichtigungstermin</div>
                          <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 2px;">${formattedDate}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 14px;">
                          <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Adresse der Wohnung</div>
                          <div style="font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 2px;">${params.flatAddress}</div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Vermieter / Ansprechpartner</div>
                          <div style="font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 2px;">${params.landlordName}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${namesListHtml}

              <!-- Important Notes -->
              <div style="margin: 24px 0 28px; padding: 16px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #22c55e;">
                <h3 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #166534;">Wichtige Hinweise zur Besichtigung:</h3>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #15803d; line-height: 1.6;">
                  <li>Bitte seien Sie pünktlich am Haupteingang der Liegenschaft.</li>
                  <li>Bringen Sie bitte einen gültigen Lichtbildausweis mit.</li>
                  <li>Ihre Gehaltsnachweise & Bonitätsdaten wurden bereits digital über BesichtiGo verifiziert.</li>
                </ul>
              </div>

              <!-- Button CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0 10px;">
                <tr>
                  <td align="center">
                    <a href="https://besichtigo.de" target="_blank" style="display: inline-block; padding: 14px 32px; background: #0f172a; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.2);">
                      Termin im Kalender vermerken
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #64748b;">
                Dies ist eine automatisierte Test- & Demoeinladung der <strong>BesichtiGo</strong> Plattform.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Empfänger: <span style="font-family: monospace; color: #475569;">${recipient}</span> · Versendet über Resend API
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

    const text = `Einladung zur Wohnungsbesichtigung

Guten Tag,

herzlichen Glueckwunsch! Ihr Profil wurde von ${params.landlordName} geprueft und vorausgewaehlt. Wir freuen uns, Sie zu einer persoenlichen Wohnungsbesichtigung einzuladen.

Besichtigungstermin: ${formattedDate}
Adresse der Wohnung: ${params.flatAddress}
Vermieter / Ansprechpartner: ${params.landlordName}
${params.applicantNames.length > 0 ? `Eingeladene Bewerber: ${params.applicantNames.join(', ')}\n` : ''}
Wichtige Hinweise zur Besichtigung:
- Bitte seien Sie puenktlich am Haupteingang der Liegenschaft.
- Bringen Sie bitte einen gueltigen Lichtbildausweis mit.
- Ihre Gehaltsnachweise & Bonitaetsdaten wurden bereits digital ueber BesichtiGo verifiziert.

Mit freundlichen Gruessen,
${params.landlordName} via BesichtiGo Plattform
`

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: recipient,
      subject: `[BesichtiGo] Einladung zur Wohnungsbesichtigung: ${params.flatAddress}`,
      html,
      text,
    })

    if (error) {
      console.error("[BesichtiGo] Resend API error:", error)
      return {
        success: false,
        error: error.message || "Failed to send email via Resend",
        recipient,
      }
    }

    return {
      success: true,
      recipient,
      messageId: data?.id,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error("[BesichtiGo] Error sending invitation:", errorMsg)
    return {
      success: false,
      error: errorMsg,
      recipient,
    }
  }
}
