import { type FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app'
import { type Auth, getAuth } from 'firebase/auth'
import { type Firestore, getFirestore } from 'firebase/firestore'
import { type FirebaseStorage, getStorage } from 'firebase/storage'

const envKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const

type EnvKey = (typeof envKeys)[number]

function readEnv(key: EnvKey): string {
  const value = import.meta.env[key]
  return typeof value === 'string' ? value.trim() : ''
}

export function isFirebaseConfigured(): boolean {
  return envKeys.every((key) => readEnv(key).length > 0)
}

function createApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase não configurado. Copie .env.example para .env e preencha as credenciais.')
  }
  if (getApps().length > 0) return getApp()
  return initializeApp({
    apiKey: readEnv('VITE_FIREBASE_API_KEY'),
    authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: readEnv('VITE_FIREBASE_APP_ID'),
  })
}

let auth: Auth | null = null
let database: Firestore | null = null
let bucket: FirebaseStorage | null = null

export function getFirebaseAuth(): Auth {
  auth ??= getAuth(createApp())
  return auth
}

export function getDb(): Firestore {
  database ??= getFirestore(createApp())
  return database
}

export function getBucket(): FirebaseStorage {
  bucket ??= getStorage(createApp())
  return bucket
}
