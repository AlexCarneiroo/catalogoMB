import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { collections } from '@/firebase/collections'
import { getDb, getFirebaseAuth } from '@/firebase/client'

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password)
}

export async function registerAdmin(email: string, password: string): Promise<void> {
  const trimmed = email.trim()
  if (password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.')
  const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), trimmed, password)
  const database = getDb()
  const batch = writeBatch(database)
  batch.set(doc(database, collections.users, credential.user.uid), {
    email: trimmed,
    role: 'admin',
    createdAt: serverTimestamp(),
  })
  batch.set(doc(database, 'meta', 'bootstrap'), {
    uid: credential.user.uid,
    createdAt: serverTimestamp(),
  })
  await batch.commit()
}

export async function signOutAdmin(): Promise<void> {
  await signOut(getFirebaseAuth())
}

export function watchAuth(listener: (user: User | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), listener)
}

async function hasAdminRole(uid: string): Promise<boolean> {
  const snapshot = await getDoc(doc(getDb(), collections.users, uid))
  return snapshot.exists() && snapshot.data().role === 'admin'
}

export async function isAdminUser(uid: string): Promise<boolean> {
  if (await hasAdminRole(uid)) return true
  await new Promise((resolve) => window.setTimeout(resolve, 700))
  return hasAdminRole(uid)
}
