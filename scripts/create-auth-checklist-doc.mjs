// Creates a Google Doc: Adventist Pulse — Authentication Feature Checklist
// Uses Google Docs batchUpdate API to build heading + checkbox list

async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id:     'REDACTED_GOOGLE_CLIENT_ID',
      client_secret: 'REDACTED_GOOGLE_CLIENT_SECRET',
      refresh_token: 'REDACTED_GOOGLE_REFRESH_TOKEN',
      grant_type:    'refresh_token',
    }),
  })
  const d = await res.json()
  if (!d.access_token) throw new Error('Token error: ' + JSON.stringify(d))
  return d.access_token
}

async function gDocs(token, docId, requests) {
  const res = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests }),
  })
  const d = await res.json()
  if (d.error) throw new Error(JSON.stringify(d.error))
  return d
}

async function createDoc(token, title) {
  const res = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  return res.json()
}

// ─── Content definition ────────────────────────────────────────────────────
// Each section has a title (HEADING_2) and items (checkboxes)
// Sub-items start with "  →" and are rendered slightly indented

const sections = [
  {
    heading: '🔐 Authentication',
    intro: 'Everything related to how people sign up, sign in, stay signed in, and manage their account security.',
    features: [

      {
        title: 'Create an Account (Sign Up)',
        items: [
          'Anyone can create an account using their full name, email address, and a password (minimum 8 characters).',
          'As soon as you sign up, a verification email is sent to the address you provided.',
          'Your account is created immediately — you can browse read-only content while waiting to verify.',
          'You cannot create, edit, or delete any data until your email is verified.',
          'Two people cannot use the same email address — it must be unique.',
        ],
      },

      {
        title: 'Verify Your Email Address',
        items: [
          'After signing up, check your inbox for a verification email from Adventist Pulse.',
          'Click the link in the email to confirm your address. The link expires after 24 hours.',
          'Until verified, you have read-only access — all changes are blocked.',
          'If the link is invalid or expired, you will see a clear error message.',
        ],
      },

      {
        title: 'Resend the Verification Email',
        items: [
          'If the verification email went to spam or expired, you can request a new one from within your account.',
          'Each new link replaces the previous one — old links stop working immediately.',
          'You must wait 2 minutes between resend requests to prevent inbox flooding.',
        ],
      },

      {
        title: 'Sign In (Log In)',
        items: [
          'Sign in with your email address and password.',
          'After 5 incorrect password attempts in a row, your account is locked for 15 minutes as a security measure.',
          'If your account is locked, the message tells you exactly how many minutes are left.',
          'After successfully signing in, the lock counter resets.',
          'Deactivated accounts cannot sign in.',
        ],
      },

      {
        title: 'Stay Signed In (Session Management)',
        items: [
          'Your session lasts up to 7 days — you won\'t be asked to sign in again unless you log out or your password changes.',
          'Every 15 minutes in the background, your session is silently renewed so you never get interrupted while working.',
          'If your session is about to expire, the app quietly gets you a fresh one without you noticing.',
        ],
      },

      {
        title: 'Sign Out (Log Out)',
        items: [
          'Signing out immediately cancels your session — your account cannot be accessed from that browser/device again until you sign back in.',
          'Any sessions on other devices are not affected — only the current one is ended.',
        ],
      },

      {
        title: 'View Your Profile',
        items: [
          'At any time, you can see your own account details: name, email, role, and which churches or conferences you have access to.',
          'This always reflects the latest version of your account — role changes by an admin take effect immediately.',
        ],
      },

      {
        title: 'Forgot Your Password',
        items: [
          'Enter your email address and, if an account exists, a password reset link is sent to your inbox.',
          'For privacy, the response is always the same whether the email exists or not — so no one can use this page to find out who has an account.',
          'The system always takes the same amount of time to respond, so timing cannot be used to guess if an email is registered.',
          'You can only request one reset link per hour per email address — this prevents your inbox from being flooded.',
        ],
      },

      {
        title: 'Reset Your Password',
        items: [
          'Click the link in the reset email and enter your new password (minimum 8 characters).',
          'The reset link expires after 1 hour.',
          'Once your password is reset, all existing sessions on all devices are immediately signed out — you must sign in again with the new password.',
          'This protects you if someone else had access to your account.',
          'The lock from too many failed attempts is also cleared when you reset your password.',
        ],
      },

      {
        title: 'Change Your Email Address',
        items: [
          'To change your email, enter the new address and confirm your current password.',
          'A confirmation link is sent to the new email address. The link expires in 1 hour.',
          'Your email address is not changed until you click the confirmation link — so a typo won\'t lock you out.',
          'If the new email is already used by another account, the change is rejected.',
          'Once confirmed, all existing sessions are signed out everywhere as a security measure — you must sign in again.',
        ],
      },

      {
        title: 'Confirm Email Address Change',
        items: [
          'Click the link sent to your new email address to complete the change.',
          'The link expires after 1 hour.',
          'Invalid or expired links are rejected with a clear error message.',
          'After confirming, your new email is immediately verified — no separate verification step needed.',
        ],
      },

    ],
  },

  {
    heading: '🛡️ Security & Access Rules',
    intro: 'Automatic protections that run behind the scenes to keep accounts safe.',
    features: [

      {
        title: 'Role-Based Access',
        items: [
          'Every user has one of three roles: Admin, Editor, or Viewer.',
          'Admins can do everything — create, edit, and delete any data.',
          'Editors can update existing data but cannot delete things or manage users.',
          'Viewers can only see data — they cannot change anything.',
          'Roles are set by an admin. You cannot change your own role.',
        ],
      },

      {
        title: 'Entity-Level Access',
        items: [
          'Each user can be limited to specific churches or conferences.',
          'For example, a South NSW Conference editor can only update South NSW data — not other conferences.',
          'Admins can access all entities regardless of this setting.',
        ],
      },

      {
        title: 'Automatic Session Expiry After Password Change',
        items: [
          'If your password is reset or changed, all existing login sessions stop working immediately.',
          'This includes sessions on phones, other computers, or any other browser.',
          'This is automatic — no action needed.',
        ],
      },

      {
        title: 'Tokens Stored as Secure Hashes',
        items: [
          'The links in verification, reset, and email-change emails contain a unique code.',
          'That code is never stored on the server — only a scrambled version (a hash) is stored.',
          'This means that even if someone accessed the database, they couldn\'t use it to verify emails or reset passwords.',
        ],
      },

      {
        title: 'Rate Limiting',
        items: [
          'Sign-in attempts: max 10 per 15 minutes per device/location.',
          'Account creation: max 10 per 15 minutes per device/location.',
          'Password reset requests: max 5 per 15 minutes per device/location, AND max 1 per hour per email address.',
          'Verification and email-related actions: max 5 per 15 minutes.',
          'These limits prevent bots from attacking accounts.',
        ],
      },

      {
        title: 'Account Lockout',
        items: [
          'After 5 wrong password attempts, the account is locked for 15 minutes.',
          'The lockout is tied to the account, not the device — it doesn\'t matter which device the attempts came from.',
          'The counter resets after a successful login or a password reset.',
        ],
      },

    ],
  },
]

// ─── Build Docs API requests ────────────────────────────────────────────────

function buildRequests(sections) {
  const requests = []
  let index = 1 // cursor starts at 1 (after the doc title, which is auto-inserted)

  // Helper: insert text + return the range it occupies
  function insertText(text) {
    const start = index
    requests.push({ insertText: { location: { index }, text } })
    index += text.length
    return { startIndex: start, endIndex: index }
  }

  function applyStyle(range, namedStyleType) {
    requests.push({
      updateParagraphStyle: {
        range,
        paragraphStyle: { namedStyleType },
        fields: 'namedStyleType',
      },
    })
  }

  function applyBold(start, end) {
    requests.push({
      updateTextStyle: {
        range: { startIndex: start, endIndex: end },
        textStyle: { bold: true },
        fields: 'bold',
      },
    })
  }

  function makeChecklist(range) {
    requests.push({
      createParagraphBullets: {
        range,
        bulletPreset: 'BULLET_CHECKBOX',
      },
    })
  }

  // ── Document title line (HEADING_1)
  const titleRange = insertText('Adventist Pulse — Authentication Checklist\n')
  applyStyle(titleRange, 'HEADING_1')

  // ── Subtitle description
  const descRange = insertText('This document lists every feature of the authentication and security system, written in plain language for non-technical team members. Use the checkboxes to track review or sign-off progress.\n\n')
  applyStyle(descRange, 'NORMAL_TEXT')

  for (const section of sections) {
    // Section heading (HEADING_2)
    const h2Range = insertText(section.heading + '\n')
    applyStyle(h2Range, 'HEADING_2')

    // Section intro paragraph
    const introRange = insertText(section.intro + '\n\n')
    applyStyle(introRange, 'NORMAL_TEXT')

    for (const feature of section.features) {
      // Feature title (HEADING_3)
      const h3Range = insertText(feature.title + '\n')
      applyStyle(h3Range, 'HEADING_3')

      // Checkbox items
      const checklistStart = index
      for (const item of feature.items) {
        insertText(item + '\n')
      }
      const checklistEnd = index

      makeChecklist({ startIndex: checklistStart, endIndex: checklistEnd })

      // Space after feature block
      insertText('\n')
    }
  }

  return requests
}

// ─── Main ───────────────────────────────────────────────────────────────────

const token = await getAccessToken()
console.log('✅ Access token obtained')

const doc = await createDoc(token, 'Adventist Pulse — Authentication Checklist')
if (doc.error) throw new Error(JSON.stringify(doc.error))
const docId = doc.documentId
console.log('✅ Document created:', docId)
console.log('   URL: https://docs.google.com/document/d/' + docId + '/edit')

const requests = buildRequests(sections)
console.log(`   Sending ${requests.length} batchUpdate requests...`)

await gDocs(token, docId, requests)
console.log('✅ Content written')

console.log('\n📄 Document ready:')
console.log('   https://docs.google.com/document/d/' + docId + '/edit')
