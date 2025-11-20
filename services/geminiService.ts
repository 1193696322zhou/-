
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PaperAnalysis } from "../types";

// Initialize the client with the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title_en: { type: Type.STRING, description: "The original English title of the paper." },
    title_cn: { type: Type.STRING, description: "The Chinese translation of the title." },
    authors: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of authors." 
    },
    keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 5-7 academic keywords found in the paper."
    },
    summary_cn: { type: Type.STRING, description: "A concise abstract summary in Chinese." },
    conclusions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Key conclusions of the paper in Chinese, presented as bullet points."
    },
    methodology: {
      type: Type.OBJECT,
      properties: {
        level_1_concept: { type: Type.STRING, description: "A simple, conceptual explanation of the method for a layperson (Chinese)." },
        level_2_process: { type: Type.STRING, description: "A standard technical summary of the steps taken (Chinese)." },
        level_3_technical: { type: Type.STRING, description: "A deep dive into the mathematical models, specific algorithms, or nuanced experimental controls (Chinese)." },
        key_methods: {
          type: Type.ARRAY,
          description: "A list of specific technical methods, algorithms, or acronyms mentioned in the text (e.g., PLSR, MCMC, ANOVA).",
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "The acronym or short name used in text (e.g., 'PLSR')." },
              full_name: { type: Type.STRING, description: "The full English name (e.g., 'Partial Least Squares Regression')." },
              description: { type: Type.STRING, description: "A detailed technical explanation of this specific method in Chinese." }
            },
            required: ["name", "full_name", "description"]
          }
        }
      },
      required: ["level_1_concept", "level_2_process", "level_3_technical", "key_methods"]
    },
    figures: {
      type: Type.ARRAY,
      description: "A list of all Figures and Tables mentioned in the text.",
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: "e.g., 'Figure 1', 'Table 2'." },
          caption: { type: Type.STRING, description: "The full caption text of the figure/table." },
          description: { type: Type.STRING, description: "A detailed Chinese explanation of what data this figure shows and what trend it demonstrates." },
          page_number: { type: Type.NUMBER, description: "The page number (integer, 1-based) in the PDF where this figure is visually located." }
        },
        required: ["label", "caption", "description", "page_number"]
      }
    }
  },
  required: ["title_en", "title_cn", "conclusions", "methodology", "summary_cn", "authors", "keywords", "figures"]
};

export const analyzePaper = async (fileBase64: string, mimeType: string): Promise<PaperAnalysis> => {
  try {
    const modelId = "gemini-2.5-flash"; 
    
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: fileBase64
            }
          },
          {
            text: `You are an expert academic researcher assistant. Your goal is to help a researcher understand this English paper by providing a comprehensive analysis in Chinese.
            
            Tasks:
            1. Extract the basic metadata (Title, Authors).
            2. Extract 5-7 key Academic Keywords.
            3. Summarize the abstract and list key conclusions.
            4. Analyze the methodology with a "Shallow to Deep" breakdown.
            5. Identify all specific technical methods (e.g. PLSR, MCMC) and explain them.
            6. **Visual Analysis**: Locate every Figure and Table. For each:
               - Identify the Label (Figure 1, etc.)
               - Extract the Caption.
               - **Identify the Page Number** it appears on.
               - Write a detailed description in Chinese of the visual data, trends, or relationships shown.
            
            Output strictly in JSON format matching the schema provided.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema
      }
    });

    if (!response.text) {
      throw new Error("No response from Gemini.");
    }

    const data = JSON.parse(response.text) as PaperAnalysis;
    return data;

  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const generateChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  contextData: string | null 
): Promise<string> => {
    const modelId = "gemini-2.5-flash";
    
    const chat = ai.chats.create({
      model: modelId,
      messages: history.map(h => ({
        role: h.role,
        content: h.parts[0].text
      }))
    });

    const result = await chat.sendMessage({
      message: newMessage
    });

    return result.text || "I'm sorry, I couldn't generate a response.";
};