import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "fs/promises";
import path from "path";

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
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
	const mediaType = ext === ".png" ? "image/png" : "image/jpeg";

	const response = await anthropic.messages.create({
		model: "claude-opus-4-20250514",
		max_tokens: 4096,
		messages: [
			{
				role: "user",
				content: [
					{
						type: "image",
						source: {
							type: "base64",
							media_type: mediaType,
							data: base64Image,
						},
					},
					{
						type: "text",
						text: `You are processing an image of Ukrainian song lyrics (Christmas carol / колядка).

Your task:
1. Extract the song text in Ukrainian from the image. As some images are from the sheet music, don't include any musical notation—only the lyrics. Don't include, for example, dashes used to indicate melismas. For example, "спи-ї-сусе" should be "спи, Iсусе".
2. Generate a short English title for this song (2-4 words, lowercase, use hyphens for spaces, e.g., "bethlehem-stable" or "christmas-star"). Base it on the song's content/theme.
3. Translate the Ukrainian text to Romanian. Preserve the poetic structure and line breaks. Do not translate repeating lines. This is just to understand the meaning.

THE OUTPUT TEXT MUST BE VALID UKRAINIAN WORDS.

Understand the context of the song, and make sure it makes sense. Don't output non-existent words. Guess from the context.
Make sure that the output follows the song structure and has text split on multiple lines. Follow original if possible, but for the sheet music, infer the correct line breaks.

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
	});

	const content = response.content[0];
	if (content.type !== "text") {
		throw new Error("Unexpected response type from Claude");
	}

	// Parse JSON from response (handle potential markdown code blocks)
	let jsonStr = content.text.trim();
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
