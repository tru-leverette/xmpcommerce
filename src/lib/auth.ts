import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

// Lazy load prisma to avoid build-time database connections
const getPrisma = async () => {
  const { prisma } = await import('./prisma')
  return prisma
}

export interface JWTPayload {
  userId: string
  email: string
  role: 'USER' | 'ADMIN' | 'SUPERADMIN'
  type?: 'access' | 'refresh' // Token type
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
  return jwt.sign({ ...payload, type: 'access' }, JWT_SECRET, { expiresIn: '1h' }) // Shorter access token
}

export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign({ ...payload, type: 'refresh' }, JWT_SECRET, { expiresIn: '30d' }) // Longer refresh token
}

export const createRefreshTokenRecord = async (userId: string, token: string): Promise<void> => {
  const prisma = await getPrisma()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30) // 30 days from now

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt
    }
  })
}

export const validateRefreshToken = async (token: string): Promise<{ userId: string; email: string; role: string } | null> => {
  try {
    // Verify JWT signature first
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type')
    }

    const prisma = await getPrisma()
    
    // Check if refresh token exists in database and is not revoked
    const refreshTokenRecord = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!refreshTokenRecord || refreshTokenRecord.isRevoked || refreshTokenRecord.expiresAt < new Date()) {
      return null
    }

    return {
      userId: refreshTokenRecord.user.id,
      email: refreshTokenRecord.user.email,
      role: refreshTokenRecord.user.role
    }
  } catch {
    return null
  }
}

export const revokeRefreshToken = async (token: string): Promise<void> => {
  const prisma = await getPrisma()
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { isRevoked: true }
  })
}

export const revokeAllUserRefreshTokens = async (userId: string): Promise<void> => {
  const prisma = await getPrisma()
  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { isRevoked: true }
  })
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
  
  // Lazy load prisma and verify user still exists in the database
  const prisma = await getPrisma()
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
