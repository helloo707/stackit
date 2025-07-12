import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function generateELI5(content: string): Promise<string> {
  try {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set');
      return 'ELI5 generation is not configured. Please set up the Gemini API key.';
    }

    const model = 'gemini-2.0-flash';
    const prompt = `
      Please explain the following technical content in simple terms that a 5-year-old could understand (ELI5 - Explain Like I'm 5).
      
      Technical content:
      ${content}
      
      Please provide a clear, simple explanation using:
      - Simple language
      - Analogies and examples
      - Short sentences
      - No technical jargon
      
      Format the response in HTML with proper paragraphs and formatting.
    `;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ];

    // The Gemini API returns a response object with a 'candidates' array.
    // Each candidate has a 'content' property, which has a 'parts' array.
    // Each part has a 'text' property.
    // See: https://ai.google.dev/api/rest/v1beta/models/generateContent
    const response = await ai.models.generateContent({
      model,
      contents,
    });

    // Try to extract the text from the response
    let text: string | undefined = undefined;
    if (response && Array.isArray(response.candidates) && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (
        candidate &&
        candidate.content &&
        Array.isArray(candidate.content.parts) &&
        candidate.content.parts.length > 0 &&
        typeof candidate.content.parts[0].text === 'string'
      ) {
        text = candidate.content.parts[0].text;
      }
    } else if (typeof response.text === 'string') {
      // fallback for older SDKs
      text = response.text;
    }

    if (!text || !text.trim()) {
      console.error('No text in Gemini response', response);
      return 'Unable to generate ELI5 explanation.';
    }

    return text;
  } catch (error) {
    console.error('Error generating ELI5:', error);

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return 'Invalid Gemini API key. Please check your configuration.';
      } else if (error.message.includes('quota')) {
        return 'Gemini API quota exceeded. Please try again later.';
      } else if (error.message.includes('network')) {
        return 'Network error. Please check your internet connection.';
      }
    }

    return 'Unable to generate ELI5 explanation.';
  }
}

interface QuestionSummary {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  answers: string[];
  votes: {
    upvotes: string[];
    downvotes: string[];
  };
  views: number;
  createdAt: string;
  __v?: number;
  [key: string]: unknown; // Allow additional properties
}

export async function prioritizeQuestions(questions: QuestionSummary[]): Promise<QuestionSummary[]> {
  try {
    const model = 'gemini-2.0-flash';

    const questionsSummary = questions.map(q => ({
      id: q._id,
      title: q.title,
      content: q.content.substring(0, 200) + '...',
      tags: q.tags,
      answerCount: q.answers.length,
      voteCount: q.votes.upvotes.length - q.votes.downvotes.length,
      views: q.views,
      createdAt: q.createdAt,
    }));

    const prompt = `
      Analyze these questions and rank them by priority for answering. Consider:
      1. Unanswered questions should be prioritized
      2. Questions with more views need attention
      3. Questions with technical complexity
      4. Questions that could benefit many people
      
      Questions to analyze:
      ${JSON.stringify(questionsSummary, null, 2)}
      
      Return only a JSON array of question IDs in priority order (highest priority first).
      Example: ["id1", "id2", "id3"]
    `;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model,
      contents,
    });

    let prioritizedIds: string[] = [];
    if (response && Array.isArray(response.candidates) && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (
        candidate &&
        candidate.content &&
        Array.isArray(candidate.content.parts) &&
        candidate.content.parts.length > 0 &&
        typeof candidate.content.parts[0].text === 'string'
      ) {
        try {
          prioritizedIds = JSON.parse(candidate.content.parts[0].text);
        } catch (e) {
          prioritizedIds = [];
        }
      }
    } else if (typeof response.text === 'string') {
      try {
        prioritizedIds = JSON.parse(response.text);
      } catch (e) {
        prioritizedIds = [];
      }
    }

    const questionMap = new Map(questions.map(q => [q._id, q]));
    const prioritizedQuestions = prioritizedIds
      .map((id: string) => questionMap.get(id))
      .filter((q): q is QuestionSummary => q !== undefined);

    const remainingQuestions = questions.filter(q => !prioritizedIds.includes(q._id));

    return [...prioritizedQuestions, ...remainingQuestions];
  } catch (error) {
    console.error('Error prioritizing questions:', error);
    return questions.sort((a, b) => {
      if (a.answers.length === 0 && b.answers.length > 0) return -1;
      if (a.answers.length > 0 && b.answers.length === 0) return 1;
      return b.views - a.views;
    });
  }
}

export async function generateQuestionSummary(question: QuestionSummary): Promise<string> {
  try {
    const model = 'gemini-2.0-flash';
    const prompt = `
      Generate a brief, helpful summary of this question that could help others understand what's being asked:
      
      Title: ${question.title}
      Content: ${question.content}
      Tags: ${question.tags.join(', ')}
      
      Provide a 1-2 sentence summary that captures the essence of the question.
    `;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model,
      contents,
    });

    let text: string | undefined = undefined;
    if (response && Array.isArray(response.candidates) && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (
        candidate &&
        candidate.content &&
        Array.isArray(candidate.content.parts) &&
        candidate.content.parts.length > 0 &&
        typeof candidate.content.parts[0].text === 'string'
      ) {
        text = candidate.content.parts[0].text;
      }
    } else if (typeof response.text === 'string') {
      text = response.text;
    }

    return text || '';
  } catch (error) {
    console.error('Error generating question summary:', error);
    return '';
  }
} 