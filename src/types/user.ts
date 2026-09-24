import type { Timestamp } from 'firebase/firestore'

export type UserRole = 'consumer' | 'store'

export interface PickupSchedule {
  day: string
  startTime: string
  endTime: string
}

export interface ConsumerProfile {
  firstName?: string
  lastName?: string
  phone?: string
  district?: string
  habitualLocation?: string
  dietaryPreferences?: string[]
}

export interface StoreProfile {
  businessName?: string
  ruc?: string
  phone?: string
  address?: string
  district?: string
  reference?: string
  pickupSchedule?: PickupSchedule[]
  businessCategory?: string
  verificationStatus?: 'pending' | 'verified' | 'rejected'
}

interface BaseUser {
  uid: string
  email: string
  displayName: string | null
  photoURL: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
  onboardingCompleted: boolean
}

export type ConsumerUser = BaseUser & ConsumerProfile & {
  role: 'consumer'
}

export type StoreUser = BaseUser & StoreProfile & {
  role: 'store'
}

export type UserDocument = ConsumerUser | StoreUser

export type InitialUserProfile = Partial<ConsumerProfile> | Partial<StoreProfile>

export interface InitialUserData {
  uid: string
  email: string
  role: UserRole
  displayName?: string | null
  photoURL?: string | null
  profile?: InitialUserProfile
}