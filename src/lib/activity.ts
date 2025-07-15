import { prisma } from './prisma'

export type ActivityType = 
  | 'GAME_CREATED'
  | 'GAME_UPDATED' 
  | 'GAME_DELETED'
  | 'GAME_REGISTERED'
  | 'USER_REGISTERED'
  | 'USER_UPDATED'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_BANNED'
  | 'USER_UNBANNED'

export interface ActivityDetails {
  [key: string]: string | number | boolean | null | Date | ActivityDetails | ActivityDetails[]
}

export async function logActivity(
  type: ActivityType,
  description: string,
  userId: string,
  details?: ActivityDetails
) {
  try {
    const activity = await prisma.activity.create({
      data: {
        type,
        description,
        userId,
        details: details || {}
      }
    })
    return activity
  } catch (error) {
    console.error('Failed to log activity:', error)
    // Don't throw error to avoid breaking main operations
    return null
  }
}
