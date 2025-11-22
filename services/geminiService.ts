import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = "gemini-2.5-flash";

export const generateJournalEntry = async (
  imageBase64: string | undefined,
  context: string
): Promise<string> => {
  try {
    const parts: any[] = [];

    if (imageBase64) {
        // Strip prefix if present
        const base64Data = imageBase64.split(',')[1];
        parts.push({
            inlineData: {
                data: base64Data,
                mimeType: "image/jpeg"
            }
        });
    }

    const promptText = `
      You are a warm, loving assistant helping a parent write a baby journal.
      Context provided by parent: "${context}".
      ${imageBase64 ? "Please describe the photo and the moment cheerfully." : ""}
      Write a short, sentimental, and cute journal entry (max 3 sentences).
      Tone: Emotional, Happy, Cherishing.
    `;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
    });

    return response.text || "Could not generate entry.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Start writing your memory here...";
  }
};

export const getMilestoneAdvice = async (ageInMonths: number): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: `My baby is ${ageInMonths} months old. What are 3 key developmental milestones I should look out for right now? Keep it brief and bulleted. Return as Markdown.`,
        });
        return response.text || "";
    } catch (error) {
        return "Unable to fetch milestones at this time.";
    }
}
