
import { GoogleGenAI, Type } from "@google/genai";
import { ResumeAnalysisResult, ContentIdea, DevOutput } from "../types";

// Always use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeResume = async (resumeText: string): Promise<ResumeAnalysisResult> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this resume text and provide feedback in JSON format.
    Resume Text: ${resumeText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          atsCompatibility: { type: Type.STRING },
          feedback: { type: Type.ARRAY, items: { type: Type.STRING } },
          grammarClarity: { type: Type.ARRAY, items: { type: Type.STRING } },
          missingSections: { type: Type.ARRAY, items: { type: Type.STRING } },
          checklist: { type: Type.ARRAY, items: { type: Type.STRING } },
          skillGaps: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["score", "atsCompatibility", "feedback", "checklist"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateVideoIdeas = async (topic: string, platform: string): Promise<ContentIdea[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate 10 high-engagement video ideas for ${platform} about ${topic}. Provide output in JSON format including title, hook, duration, and angle.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            hook: { type: Type.STRING },
            duration: { type: Type.STRING },
            angle: { type: Type.STRING }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};

export interface HashtagGroup {
  category: string;
  tags: string[];
}

export const generateHashtags = async (description: string): Promise<HashtagGroup[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a set of optimized hashtags for a social media post about: "${description}". Group them into categories like 'Highly Targeted (Niche)', 'Broad (High Volume)', and 'Strategic (Low Competition)'. Provide output in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["category", "tags"]
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};

export const devTask = async (language: string, task: string, context?: string): Promise<DevOutput> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Task: ${task}\nLanguage: ${language}\nContext: ${context || 'None'}\nProvide professional code, explanation, best practices, and edge cases in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          code: { type: Type.STRING },
          explanation: { type: Type.STRING },
          bestPractices: { type: Type.ARRAY, items: { type: Type.STRING } },
          edgeCases: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export interface StructuredDoc {
  elements: Array<{
    type: 'heading1' | 'heading2' | 'paragraph' | 'list_item';
    text: string;
  }>;
}

export const convertPdfToStructuredDoc = async (base64Pdf: string): Promise<StructuredDoc> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Pdf,
            mimeType: "application/pdf"
          }
        },
        {
          text: "Extract the content of this PDF and structure it into a JSON document. Identify headings and paragraphs. Do not lose any information. Provide the output as an array of elements with 'type' and 'text'."
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          elements: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { 
                  type: Type.STRING, 
                  description: "One of: heading1, heading2, paragraph, list_item" 
                },
                text: { type: Type.STRING }
              },
              required: ["type", "text"]
            }
          }
        },
        required: ["elements"]
      }
    }
  });

  return JSON.parse(response.text || '{"elements": []}');
};
