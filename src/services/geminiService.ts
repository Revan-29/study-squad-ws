import { GoogleGenAI } from '@google/genai';

/**
 * Gemini AI Study Assistant for solving homework doubts and analyzing study photos/notes.
 * NOTE: Strictly DOES NOT generate or suggest daily study topics.
 * Conforms to gemini-3.1-pro-preview with ThinkingLevel.HIGH and image analysis.
 */
class GeminiStudyAssistant {
  private ai: GoogleGenAI | null = null;

  constructor() {
    // Check runtime env var
    const apiKey = typeof process !== 'undefined' && process.env?.GEMINI_API_KEY
      ? process.env.GEMINI_API_KEY
      : (import.meta.env?.VITE_GEMINI_API_KEY || '');

    if (apiKey) {
      try {
        this.ai = new GoogleGenAI({ apiKey });
      } catch (e) {
        console.warn('Gemini client initialization warning:', e);
      }
    }
  }

  public isAvailable(): boolean {
    return !!this.ai;
  }

  /**
   * Analyze student homework, textbook photo, or doubt with ThinkingLevel.HIGH
   */
  public async analyzeStudyDoubt(params: {
    questionText: string;
    imageBase64?: string;
    imageMimeType?: string;
    subjectContext?: string;
  }): Promise<{ answer: string; thinkingSummary?: string }> {
    if (!this.ai) {
      // Try to re-initialize with window/runtime key if available
      const runtimeKey = (window as any)?.__GEMINI_API_KEY__ || import.meta.env?.VITE_GEMINI_API_KEY;
      if (runtimeKey) {
        this.ai = new GoogleGenAI({ apiKey: runtimeKey });
      } else {
        throw new Error('Gemini API key is not configured. Please add GEMINI_API_KEY in your environment or secrets.');
      }
    }

    const contents: any[] = [];

    // System instruction prompt reinforcing doubt solving only
    const systemPrompt = `You are a patient, brilliant academic study tutor for a 4-person study squad. 
Your goal is to explain concepts clearly, step-by-step, resolve homework doubts, and break down complex problems from uploaded photos or questions.
Never generate or suggest daily study topic plans or task lists. Focus solely on explaining the specific concept or problem asked.`;

    let userPrompt = '';
    if (params.subjectContext) {
      userPrompt += `[Subject Context: ${params.subjectContext}]\n`;
    }
    userPrompt += `Student Question/Doubt:\n${params.questionText || 'Please analyze this study material/question and provide a thorough, step-by-step explanation.'}`;

    if (params.imageBase64 && params.imageMimeType) {
      // Clean base64 header if present
      const base64Data = params.imageBase64.includes(',')
        ? params.imageBase64.split(',')[1]
        : params.imageBase64;

      contents.push({
        inlineData: {
          mimeType: params.imageMimeType,
          data: base64Data,
        },
      });
    }

    contents.push({ text: userPrompt });

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents,
        config: {
          systemInstruction: systemPrompt,
          thinkingConfig: {
            thinkingLevel: 'HIGH' as any,
          },
        },
      });

      return {
        answer: response.text || 'No response generated. Please try again.',
      };
    } catch (err: any) {
      console.error('Gemini call failed:', err);
      throw new Error(err.message || 'Failed to analyze doubt with Gemini.');
    }
  }
}

export const geminiService = new GeminiStudyAssistant();
