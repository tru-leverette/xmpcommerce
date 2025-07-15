import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export interface JWTPayload {
  userId: string
  email: string
  role: 'USER' | 'ADMIN' | 'SUPERADMIN'
  iat?: number // Issued at timestamp
  exp?: number // Expiration timestamp
}

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12)
}

export const comparePasswords = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}

export const verifyTokenAndUser = async (token: string): Promise<JWTPayload> => {
  // First verify the JWT signature and expiration
  const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
  
  // Security: Check for token reuse/replay attacks
  const tokenAge = Date.now() / 1000 - (decoded.iat || 0)
  if (tokenAge > 7 * 24 * 60 * 60) { // 7 days max
    throw new Error('Token too old, please re-authenticate')
  }
  
  // Then verify the user still exists in the database
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, role: true, status: true }
  })
  
  if (!user) {
    throw new Error('User no longer exists')
  }
  
  if (user.status === 'BANNED') {
    throw new Error('User account is banned')
  }
  
  // Security: Always return database values, never trust token claims
  return {
    userId: user.id,
    email: user.email,
    role: user.role
  }
}

export const getTokenFromHeader = (authHeader: string | null): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}
