/// <reference types="vite/client" />

// ============================================================================
// SECCIÓN 1: IMPORTACIONES Y DEPENDENCIAS
// ============================================================================

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
  type Unsubscribe
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// ============================================================================
// SECCIÓN 2: CONFIGURACIÓN E INICIALIZACIÓN DEL SDK DE FIREBASE
// ============================================================================

/**
 * ADARA PARFUM — Configuración e inicialización del SDK de Firebase
 *
 * Los valores se obtienen exclusivamente desde variables de entorno Vite (import.meta.env).
 * Si no están definidas en .env.local, no se inicializan los servicios y se emite
 * una advertencia explícita en consola sin inventar credenciales ni aplicar fallbacks ficticios.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Comprobación de presencia de las variables críticas necesarias para Firebase Web SDK
const requiredKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId',
];

const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key]);

/**
 * Indicador de si las variables de entorno mínimas para Firebase se encuentran presentes.
 */
export const isFirebaseConfigured: boolean = missingKeys.length === 0;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  // Manejo claro y seguro ante ausencia de variables de entorno
  console.warn(
    `[ADARA PARFUM — Firebase] Variables de entorno faltantes (${missingKeys.join(', ')}). ` +
    'Copia .env.example a .env.local y asigna las credenciales públicas de Firebase Console.'
  );
}

// ============================================================================
// SECCIÓN 3: AUTENTICACIÓN Y CONTROL DE ACCESO
// ============================================================================

/**
 * Traduce códigos de error técnicos de Firebase Authentication a mensajes comprensibles en español.
 *
 * @param errorCode - Código de error devuelto por Firebase (ej. `'auth/invalid-credential'`).
 * @returns Mensaje redactado para presentación visual al usuario en interfaz.
 */
export function formatAuthError(errorCode?: string): string {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Credenciales incorrectas. Verifica tu correo y contraseña.';
    case 'auth/invalid-email':
      return 'El formato del correo electrónico no es válido.';
    case 'auth/user-disabled':
      return 'Esta cuenta administrativa ha sido inhabilitada. Contacta al soporte.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Por seguridad, el acceso se ha bloqueado temporalmente. Intenta más tarde.';
    case 'auth/network-request-failed':
      return 'Error de conexión. Comprueba tu red o la disponibilidad del servicio.';
    case 'auth/internal-error':
      return 'Ocurrió un error interno en el servicio de autenticación.';
    default:
      return 'No fue posible iniciar sesión. Verifica los datos e intenta nuevamente.';
  }
}

/**
 * Inicia sesión administrativa con correo y contraseña en Firebase Authentication.
 *
 * @param email - Correo electrónico de la cuenta de administración.
 * @param pass - Contraseña del administrador.
 * @returns Promesa que resuelve la instancia del usuario autenticado {@link User}.
 * @throws {Error} Si el servicio de autenticación no fue inicializado por credenciales ausentes.
 */
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Authentication no está inicializado.');
  }
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  return credential.user;
}

/**
 * Cierra la sesión activa de forma segura.
 *
 * @returns Promesa que se resuelve al desvincular el token de sesión.
 */
export async function logoutUser(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

/**
 * Suscribe un observador a los cambios de estado de autenticación (login, logout, refresco de token).
 *
 * @param callback - Función receptora del usuario autenticado o `null` si no hay sesión activa.
 * @returns Función canceladora de la suscripción (Unsubscribe).
 */
export function subscribeToAuth(callback: (user: User | null) => void): Unsubscribe {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// ============================================================================
// SECCIÓN 4: AUTORIZACIÓN BASADA EN ROLES Y UIDS AUTORIZADOS
// ============================================================================

/**
 * Lista inmutable de UIDs con privilegios administrativos autorizados,
 * cargada exclusivamente desde la variable de entorno de Vite VITE_ADMIN_UIDS.
 * No es modificable en tiempo de ejecución desde el cliente.
 */
const rawAdminUIDs = (import.meta.env.VITE_ADMIN_UIDS as string | undefined) || '';
export const AUTHORIZED_ADMIN_UIDS: readonly string[] = Object.freeze(
  rawAdminUIDs
    .split(',')
    .map((uid: string) => uid.trim().replace(/^["']|["']$/g, ''))
    .filter((uid: string) => uid.length > 0)
);

/**
 * Función centralizada de comprobación de autorización administrativa en cliente.
 *
 * @remarks
 * Principios de seguridad aplicados:
 * 1. Falla de forma segura (fail-closed): si la lista de UIDs está vacía o mal configurada, deniega todo acceso.
 * 2. Comprueba que existe una instancia de usuario válida con un UID de tipo string no vacío.
 * 3. Compara user.uid contra la lista inmutable de UIDs autorizados.
 * 4. Devuelve true ÚNICAMENTE si coincide exactamente con uno de los UID permitidos.
 * 5. Cualquier otra cuenta (incluso si está registrada y autenticada en Firebase) es rechazada.
 *
 * ADVERTENCIA: Esta validación es solo para control de UI en el navegador. La seguridad real
 * del acceso a datos la garantizan las reglas de Firestore (`firestore.rules`).
 *
 * @param user - Instancia de usuario de Firebase a verificar.
 * @returns `true` si el usuario es un administrador acreditado; `false` en caso contrario.
 */
export function isUserAdmin(user: User | null | undefined): boolean {
  if (!user || typeof user.uid !== 'string' || user.uid.trim().length === 0) {
    return false;
  }
  if (!AUTHORIZED_ADMIN_UIDS || AUTHORIZED_ADMIN_UIDS.length === 0) {
    console.warn('[ADARA Auth] VITE_ADMIN_UIDS no está configurada o está vacía. Acceso denegado por defecto.');
    return false;
  }
  return AUTHORIZED_ADMIN_UIDS.includes(user.uid.trim());
}

export { app, auth, db };
export type { User };

