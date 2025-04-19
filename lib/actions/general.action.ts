'use server';

import { db } from '@/firebase/admin';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { feedbackSchema } from '@/constants';

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


// Create a server action that will create feedback in firestore database using Gemini AI
export async function createFeedback(params: CreateFeedbackParams) {

  const { interviewId, userId, transcript } = params;

  try {
// content is what the person has answered
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`,
      )
      .join('');
    const {
      object: {
        totalScore,
        categoryScores,
        strengths,
        areasForImprovement,
        finalAssessment,
      },
    } = await generateObject({
      model: google('gemini-2.0-flash-001', {
        structuredOutputs: false,
      }),
      // schema to specify how the text will look like
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
      // system to describe what is this AI
      system:
        'You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories',
    });

    const feedback = await db.collection('feedback').add({
      interviewId,
      userId,
      totalScore,
      categoryScores,
      strengths,
      areasForImprovement,
      finalAssessment,
      createdAt: new Date().toISOString(),

    });

    return {
      success: true,
      feedbackId: feedback.id,
    };
  } catch (err) {
    console.error('Error saving feedback', err);
    return { success: false };
  }

}

// function to fetch Feedback based on interview ID
export async function getFeedbackByInterviewId(params: GetFeedbackByInterviewIdParams): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const feedback = await db.collection('feedback').where('interviewId', '==', interviewId).where('userId', '==', userId).limit(1).get();

  if (feedback.empty) {
    return null;
  }

  const feedbackDoc = feedback.docs[0];
  return {
    id: feedbackDoc.id, ...feedbackDoc.data(),
  } as Feedback;
}