import { EncryptJWT, jwtDecrypt, base64url, calculateJwkThumbprint } from 'jose'
import { hkdf } from '@panva/hkdf'
import { env } from '../config/env.js'
import { TokenExpiredError, TokenInvalidError } from '../core/errors/index.js'

const ALG = 'dir'
const ENC = 'A256CBC-HS512'
const HKDF_HASH = 'sha256'

// Derive a unique encryption key from a secret + salt via HKDF
async function deriveKey(secret, salt) {
  return hkdf(HKDF_HASH, secret, salt, `Adventist Pulse Encryption Key (${salt})`, 64)
}

// Support secret rotation — secrets is a comma-separated string e.g. "new,old"
function getSecrets() {
  return env.JWT_SECRET.split(',').map(s => s.trim()).filter(Boolean)
}

async function encodeToken(payload, salt, maxAge) {
  const secrets = getSecrets()
  const key = await deriveKey(secrets[0], salt)
  const thumbprint = await calculateJwkThumbprint(
    { kty: 'oct', k: base64url.encode(key) },
    'sha512'
  )
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: ALG, enc: ENC, kid: thumbprint })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAge)
    .setJti(crypto.randomUUID())
    .encrypt(key)
}

async function decodeToken(token, salt) {
  if (!token) throw new TokenInvalidError()
  const secrets = getSecrets()

  for (const secret of secrets) {
    try {
      const key = await deriveKey(secret, salt)
      const { payload } = await jwtDecrypt(token, key, {
        clockTolerance: 15,
        keyManagementAlgorithms: [ALG],
        contentEncryptionAlgorithms: [ENC],
      })
      return payload
    } catch (err) {
      if (err.code === 'ERR_JWT_EXPIRED') throw new TokenExpiredError()
      // Try next secret (rotation)
    }
  }

  throw new TokenInvalidError()
}

export const jwt = {
  // Salts keep access and refresh keys separate
  SALTS: {
    access: 'pulse.access_token',
    refresh: 'pulse.refresh_token',
  },

  async issueAccessToken(payload) {
    return encodeToken(payload, this.SALTS.access, env.JWT_ACCESS_EXPIRY_SECONDS)
  },

  async issueRefreshToken(payload) {
    return encodeToken(payload, this.SALTS.refresh, env.JWT_REFRESH_EXPIRY_SECONDS)
  },

  async verifyAccessToken(token) {
    return decodeToken(token, this.SALTS.access)
  },

  async verifyRefreshToken(token) {
    return decodeToken(token, this.SALTS.refresh)
  },

  // Returns seconds remaining until expiry
  timeUntilExpiry(payload) {
    return payload.exp - Math.floor(Date.now() / 1000)
  },

  isExpiringSoon(payload, thresholdSeconds = 300) {
    return this.timeUntilExpiry(payload) < thresholdSeconds
  },
}
