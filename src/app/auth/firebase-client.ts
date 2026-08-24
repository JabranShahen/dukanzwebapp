import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';

import { environment } from '../../environments/environment';

function getFirebaseConfig(): FirebaseOptions {
  return environment.auth.firebase;
}

export function getDukanzFirebaseApp(): FirebaseApp {
  return getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig());
}

export function getDukanzFirebaseAuth(): Auth {
  return getAuth(getDukanzFirebaseApp());
}
