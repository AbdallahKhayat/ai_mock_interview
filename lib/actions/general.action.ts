import { db } from '@/firebase/admin';

// function to fetch all the interviews from firebase
export async function getInterviewsByUserId(userId: string): Promise<Interview[] | null> {
  const interviews = await db.collection('interviews').where('userId', '==', userId).orderBy('createdAt', 'desc').get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

// function to fetch all interviews created by other users
export async function getLatestInterviews(params: GetLatestInterviewsParams): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  const interviews = await db.collection('interviews').where('finalized', '==', true).where('userId', '!=', userId).limit(limit).get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}


// function to fetch interview details from firebase
export async function getInterviewById(id: string): Promise<Interview | null> {
  const interview = await db.collection('interviews').doc(id).get();

  return interview.data() as Interview | null;
}
