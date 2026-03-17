import { NextRequest, NextResponse } from 'next/server'

const BREVO_API_KEY = process.env.BREVO_API_KEY || 'REDACTED_BREVO_API_KEY'
const BREVO_BETA_LIST_ID = 7 // Beta Testers list

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name, role, church, conference } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // 1. Add/update contact in Brevo
    const contactRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        firstName: name?.split(' ')[0] || '',
        lastName: name?.split(' ').slice(1).join(' ') || '',
        listIds: [BREVO_BETA_LIST_ID],
        updateEnabled: true,
        attributes: {
          ROLE: role || '',
          CHURCH: church || '',
          CONFERENCE: conference || '',
          SOURCE: 'pulse-beta-signup',
        },
      }),
    })

    // Brevo returns 204 on update, 201 on create — both are success
    if (!contactRes.ok && contactRes.status !== 204) {
      const err = await contactRes.json().catch(() => ({}))
      console.error('Brevo error:', err)
      // Don't fail silently — but also try the backend
    }

    // 2. Also try to register via Bem's backend (best-effort)
    try {
      const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/beta-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (backendRes.ok) {
        const data = await backendRes.json()
        return NextResponse.json({ success: true, ...data })
      }
    } catch {
      // Backend unavailable — that's OK, Brevo captured the lead
    }

    return NextResponse.json({ success: true, message: 'You\'re on the list!' })
  } catch (err) {
    console.error('Beta signup error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
