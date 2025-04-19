'use server'; //to turn it into server render file

import { db, auth } from '@/firebase/admin';
import { cookies } from 'next/headers';

const ONE_WEEK = 60 * 60 * 24 * 7; // 1 week: 60 seconds 60 minutes 24 hours 7 days

export async function signUp(params: SignUpParams) {

  const { uid, name, email } = params;

  try {

    const userRecord = await db.collection('users').doc(uid).get(); //check if user already exist

    if (userRecord.exists) {
      return {
        status: 'success',
        message: 'User already exists. Please sign in instead.',
      };
    }

    await db.collection('users').doc(uid).set({
      name, email,
    });

    return {
      success: true,
      message: 'Account created successfully. Please sign in.',
    };
  } catch (err: any) {
    console.log('Error Creating a user', err);

    if (err.code === 'auth/email-already-exists') {
      return {
        success: false,
        message: 'This email is already in use',
      };
    }

    return {
      success: false,
      message: 'Failed to create an account',
    };

  }

}

export async function signIn(params: SignInParams) {
  const { email, idToken } = params;


  try {

    const userRecord = await auth.getUserByEmail(email);

    if (!userRecord) {
      return {

        success: false,
        message: 'User does not exist. Create an account instead.',
      };
    }

    await setSessionCookie(idToken);

  } catch (err) {
    console.log(err);

    return {
      success: false,
      message: 'Failed to log into an account',
    };

  }

}

export async function setSessionCookie(idToken: string) {

  const cookieStore = await cookies();

  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: ONE_WEEK * 1000, // * 1000 ms

  });
  cookieStore.set('session', sessionCookie, {
    maxAge: ONE_WEEK,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  });
}

// Now to make only authenticated user access the homepage
export async function getCurrentUser(): Promise<User | null> {

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
// decode the session to see if we have a valid user
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    const userRecord = await db.collection('users').doc(decodedClaims.uid).get();
// if no session cookie exists which means no authenticated user exists
    if (!userRecord.exists) return null;

    //if exists
    return {
      ...userRecord.data,
      id: userRecord.id,
    } as User;

  } catch (err) {
    console.log(err);
    return null;

  }

}

export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user; // {name:"Abdallah} -> !{}=>false=>!false=>true (boolean)
  //or if null
  // " " -> !" " -> true -> !true -> false
}

