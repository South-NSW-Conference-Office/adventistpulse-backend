import { NextRequest, NextResponse } from 'next/server'

const BREVO_KEY = process.env.BREVO_API_KEY || ''
const LIST_IDS = { brief: 4 } // Added to Pulse Brief list on signup; beta list (7) added on approval

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, church, conference, role, pastorEmail } = await req.json()

    if (!email || !firstName || !church || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create/update contact in Brevo
    const contactRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        attributes: {
          FIRSTNAME: firstName,
          LASTNAME: lastName,
          CHURCH: church,
          CONFERENCE: conference,
          ROLE: role,
          PASTOR_EMAIL: pastorEmail || '',
          APPROVAL_STATUS: 'pending',
        },
        listIds: [LIST_IDS.brief],
        updateEnabled: true,
      }),
    })

    if (!contactRes.ok && contactRes.status !== 204) {
      const err = await contactRes.text()
      console.error('Brevo contact error:', err)
    }

    // Notify Kyle via transactional email
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: [{ email: 'pulse@adventist.org.au', name: 'Kyle Morrison' }],
        sender: { name: 'Adventist Pulse Signups', email: 'pulse@adventist.org.au' },
        subject: `New beta request — ${firstName} ${lastName} (${church})`,
        htmlContent: `
          <div style="font-family:sans-serif;max-width:600px;padding:24px">
            <h3 style="color:#6366f1">New Pulse Beta Request</h3>
            <table style="width:100%;border-collapse:collapse;margin-top:16px">
              <tr><td style="padding:8px;color:#888;width:140px">Name</td><td style="padding:8px;font-weight:600">${firstName} ${lastName}</td></tr>
              <tr style="background:#f8f9fa"><td style="padding:8px;color:#888">Email</td><td style="padding:8px">${email}</td></tr>
              <tr><td style="padding:8px;color:#888">Church</td><td style="padding:8px">${church}</td></tr>
              <tr style="background:#f8f9fa"><td style="padding:8px;color:#888">Conference</td><td style="padding:8px">${conference}</td></tr>
              <tr><td style="padding:8px;color:#888">Role</td><td style="padding:8px">${role}</td></tr>
              ${pastorEmail ? `<tr style="background:#f8f9fa"><td style="padding:8px;color:#888">Pastor email</td><td style="padding:8px">${pastorEmail}</td></tr>` : ''}
            </table>
            <p style="margin-top:24px">
              <a href="http://192.168.233.211:3099" style="background:#6366f1;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">
                Open Approval Dashboard →
              </a>
            </p>
          </div>
        `,
      }),
    })

    // If pastor email provided, send them the membership standing request
    if (pastorEmail) {
      const token = Buffer.from(`${email}:${Date.now()}`).toString('base64url')
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: [{ email: pastorEmail }],
          sender: { name: 'Adventist Pulse', email: 'pulse@adventist.org.au' },
          subject: `Quick question about ${firstName} ${lastName} — Adventist Pulse`,
          htmlContent: `
            <div style="font-family:sans-serif;max-width:600px;padding:32px">
              <p>Hello,</p>
              <p><strong>${firstName} ${lastName}</strong> has requested beta access to Adventist Pulse, listing their church as <strong>${church}</strong>.</p>
              <p style="margin-top:16px">As their pastor, please confirm:</p>
              <p style="font-size:18px;font-weight:600;color:#1a1a1a;margin:16px 0">Is ${firstName} a member in good and regular standing at ${church}?</p>
              <div style="margin:24px 0;display:flex;gap:12px">
                <a href="https://adventistpulse.org/api/pastor-confirm?token=${token}&decision=yes" 
                   style="background:#10b981;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
                  ✓ Yes, confirm membership
                </a>
                <a href="https://adventistpulse.org/api/pastor-confirm?token=${token}&decision=no"
                   style="background:#ef4444;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
                  ✗ Not at this time
                </a>
              </div>
              <p style="color:#888;font-size:12px">This single click is all that's needed. You will not be asked again for this person.<br>Adventist Pulse · pulse@adventist.org.au</p>
            </div>
          `,
        }),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Beta signup error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
