import OpenAI from "openai";
import { readFile } from "fs/promises";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ProcessResult {
  title: string;
  ukrainian: string;
  romanian: string;
}

export async function processImage(imagePath: string): Promise<ProcessResult> {
  const absolutePath = path.resolve(imagePath);
  const imageBuffer = await readFile(absolutePath);
  const base64Image = imageBuffer.toString("base64");

  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === ".png" ? "image/png" : "image/jpeg";

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
          {
            type: "text",
            text: `You are processing an image of Ukrainian song lyrics (likely a Christmas carol / колядка).

Your task:
1. Extract ALL Ukrainian text visible in the image exactly as written. Include verse numbers if present. Preserve line breaks and formatting.
2. Generate a short English title for this song (2-4 words, lowercase, use hyphens for spaces, e.g., "bethlehem-stable" or "christmas-star"). Base it on the song's content/theme.
3. Translate the Ukrainian text to Romanian. Preserve the poetic structure and line breaks.

Return your response as JSON with this exact structure:
{
  "title": "short-english-title",
  "ukrainian": "full ukrainian text here",
  "romanian": "full romanian translation here"
}

Return ONLY the JSON, no additional text or markdown.`,
          },
        ],
      },
    ],
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  // Parse JSON from response (handle potential markdown code blocks)
  let jsonStr = content.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const result = JSON.parse(jsonStr) as ProcessResult;

  // Sanitize title for filesystem
  result.title = result.title
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return result;
}
