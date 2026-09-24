import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,

  updateProfile,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { getApps, initializeApp } from 'firebase/app'
import {
  collection,
  doc,
  getFirestore,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { getUserCollectionName } from '../types/user'
import type { InitialUserData, InitialUserProfile, UserDocument, UserRole } from '../types/user'

function requiredFirebaseEnv(name: string): string {
  const value = import.meta.env[name]

  if (!value) {
    throw new Error(`Missing Firebase environment variable: ${name}`)
  }

  return value
}

function getFirebaseServices() {
  const firebaseConfig = {
    apiKey: requiredFirebaseEnv('VITE_FIREBASE_API_KEY'),
    authDomain: requiredFirebaseEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: requiredFirebaseEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: requiredFirebaseEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: requiredFirebaseEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: requiredFirebaseEnv('VITE_FIREBASE_APP_ID'),
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  }
  const firebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)

  return {
    auth: getAuth(firebaseApp),
    db: getFirestore(firebaseApp),
  }
}

export async function createInitialUserDocument(
  user: User,
  data: Omit<InitialUserData, 'uid' | 'email'>,
): Promise<void> {
  const { db } = getFirebaseServices()
  const userReference = doc(collection(db, getUserCollectionName(data.role)), user.uid)
  const existingUser = await getDoc(userReference)

  if (existingUser.exists()) {
    return
  }

  const userData: Record<string, unknown> = {
    uid: user.uid,
    email: user.email ?? '',
    role: data.role,
    displayName: data.displayName ?? user.displayName,
    photoURL: data.photoURL ?? user.photoURL,
    onboardingCompleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...data.profile,
  }

  await setDoc(userReference, userData)
}

export async function registerWithEmail(
  email: string,
  password: string,
  role: UserRole,
  profile: InitialUserData['profile'] = {},
): Promise<UserCredential> {
  const { auth } = getFirebaseServices()
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const displayName = profile && 'firstName' in profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') || null
    : profile && 'businessName' in profile
      ? profile.businessName ?? null
      : null

  if (displayName) {
    await updateProfile(credential.user, { displayName })
  }

  await createInitialUserDocument(credential.user, {
    role,
    displayName,
    profile,
  })

  return credential
}

export async function signInWithGoogle(
  role: UserRole,
  profile: InitialUserData['profile'] = {},
): Promise<UserCredential> {
  const { auth } = getFirebaseServices()
  const googleProvider = new GoogleAuthProvider()
  const credential = await signInWithPopup(auth, googleProvider)

  await createInitialUserDocument(credential.user, {
    role,
    profile,
  })

  return credential
}

export async function updateUserProfile(
  uid: string,
  role: UserRole,
  profile: InitialUserProfile,
): Promise<void> {
  const { db } = getFirebaseServices()
  const userReference = doc(collection(db, getUserCollectionName(role)), uid)

  await updateDoc(userReference, {
    ...profile,
    onboardingCompleted: true,
    updatedAt: serverTimestamp(),
  })
}


export async function saveProfileChanges(
  uid: string,
  role: UserRole,
  profile: InitialUserProfile,
  displayName: string | null,
): Promise<void> {
  const { auth, db } = getFirebaseServices()
  const userReference = doc(collection(db, getUserCollectionName(role)), uid)

  await updateDoc(userReference, {
    ...profile,
    displayName,
    updatedAt: serverTimestamp(),
  })

  const currentUser = auth.currentUser
  if (currentUser && currentUser.uid === uid && displayName) {
    await updateProfile(currentUser, { displayName })
  }
}

export function getCurrentUser(): User | null {
  return getFirebaseServices().auth.currentUser
}


export function getFirebaseAuth() {
  return getFirebaseServices().auth
}

/** Inicio de sesión con correo/contraseña para usuarios ya registrados. */
export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  const { auth } = getFirebaseServices()
  return signInWithEmailAndPassword(auth, email, password)
}


export async function loginWithGoogle(): Promise<UserCredential> {
  const { auth } = getFirebaseServices()
  const googleProvider = new GoogleAuthProvider()
  const credential = await signInWithPopup(auth, googleProvider)
  await createInitialUserDocument(credential.user, { role: 'consumer' })
  return credential
}

/** Cierra la sesión activa. */
export async function signOutUser(): Promise<void> {
  const { auth } = getFirebaseServices()
  await signOut(auth)
}

/**
 * Trae el documento de perfil de Firestore para un usuario autenticado.
 * Como ahora hay 2 colecciones separadas (consumidores / comercios) y en este
 * punto todavía no sabemos el rol del usuario, se busca primero en
 * "consumidores" y, si no aparece, en "comercios".
 */
export async function getUserDocument(uid: string): Promise<UserDocument | null> {
  const { db } = getFirebaseServices()

  const consumerSnapshot = await getDoc(doc(collection(db, 'consumidores'), uid))
  if (consumerSnapshot.exists()) {
    return consumerSnapshot.data() as UserDocument
  }

  const storeSnapshot = await getDoc(doc(collection(db, 'comercios'), uid))
  if (storeSnapshot.exists()) {
    return storeSnapshot.data() as UserDocument
  }

  return null
}

export type { UserDocument }