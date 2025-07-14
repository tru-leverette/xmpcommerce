// User validation schemas
export const registerSchema = {
  email: '',
  username: '',
  password: ''
}

export const loginSchema = {
  email: '',
  password: ''
}

// Game validation schemas
export const createGameSchema = {
  title: '',
  description: '',
  theme: ''
}

// Clue submission schemas
export const textSubmissionSchema = {
  clueId: '',
  answer: ''
}

export const photoSubmissionSchema = {
  clueId: '',
  photoUrl: ''
}

export const locationSchema = {
  latitude: 0,
  longitude: 0
}
