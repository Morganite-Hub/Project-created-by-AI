import { GoogleGenAI, Type } from "@google/genai";
import { AIPlanResponse } from "../types";

// Initialize Gemini Client
// Note: API Key must be provided via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBatchPlan = async (
  fileNames: string[],
  userInstruction: string
): Promise<AIPlanResponse> => {
  
  const model = "gemini-2.5-flash";

  const prompt = `
    I have a list of PDF files: ${JSON.stringify(fileNames)}.
    
    User Instruction: "${userInstruction}"
    
    Based on the file names and the user's instruction, create a list of merge tasks.
    Each task should specify one target file and one or more source files to be inserted into it.
    If the user implies "all files", exclude the source file itself from being a target if applicable.
    
    Return the response in strict JSON format matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  targetFileName: { type: Type.STRING, description: "Exact name of the target file" },
                  sourceFileNames: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "List of exact names of source files to insert" 
                  },
                  position: { 
                    type: Type.STRING, 
                    enum: ["BEGINNING", "END", "AFTER_PAGE"],
                    description: "Where to insert the source files"
                  },
                  pageNumber: { type: Type.INTEGER, description: "Page number if position is AFTER_PAGE (1-based)" }
                },
                required: ["targetFileName", "sourceFileNames", "position"]
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIPlanResponse;

  } catch (error) {
    console.error("Error generating batch plan:", error);
    throw error;
  }
};
