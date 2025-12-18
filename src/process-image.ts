import { readFile } from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ProcessResult {
	title: string;
	ukrainian: string;
	romanian: string;
	sources: string;
}

// Step 1: OCR - Extract Ukrainian text from image
async function extractUkrainianText(imagePath: string): Promise<string> {
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
						text: `Extract the Ukrainian song lyrics from this image.

Rules:
- Only extract the lyrics, no musical notation
- Remove syllable-splitting hyphens (e.g., "спи-ї-су-се" → "спи, Ісусе")
- Keep verse numbers if present
- Preserve line breaks and stanza structure
- Output ONLY the Ukrainian text, nothing else`,
					},
				],
			},
		],
	});

	const content = response.content[0];
	if (!content || content.type !== "text") {
		throw new Error("No text response from OCR");
	}

	return content.text.trim();
}

// Step 2: Search and improve lyrics using Perplexity
async function improveWithSearch(
	rawText: string,
): Promise<{ title: string; improved: string; sources: string }> {
	const response = await fetch("https://api.perplexity.ai/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
		},
		body: JSON.stringify({
			model: "sonar-pro",
			messages: [
				{
					role: "user",
					content: `I have OCR-extracted Ukrainian Christmas carol (колядка) lyrics that may contain errors. Please search for this song online and provide the corrected lyrics.

Here's the OCR text:
${rawText}

Your task:
1. Search for this Ukrainian Christmas carol online
2. Find the correct, complete lyrics
3. Fix any OCR errors, typos, or incorrectly split words
4. Ensure all words are valid Ukrainian
5. Generate a short English title (2-4 words, lowercase with hyphens)

First, provide your analysis and the sources you found.
Then, at the end, return a JSON object on its own line starting with {"title":

Format:
[Your analysis and explanation of corrections made]

{"title": "english-title-here", "ukrainian": "corrected lyrics here"}`,
				},
			],
		}),
	});

	if (!response.ok) {
		throw new Error(`Perplexity API error: ${response.status}`);
	}

	interface PerplexityResponse {
		choices?: { message?: { content?: string } }[];
		citations?: string[];
	}

	const data = (await response.json()) as PerplexityResponse;
	const text = data.choices?.[0]?.message?.content;
	const citations = data.citations || [];

	if (!text) {
		throw new Error("No response from Perplexity");
	}

	// Extract JSON from the end of the response
	const jsonMatch = text.match(/\{[\s\S]*"title"[\s\S]*"ukrainian"[\s\S]*\}$/);
	if (!jsonMatch) {
		throw new Error("Could not find JSON in Perplexity response");
	}

	const result = JSON.parse(jsonMatch[0]);

	// Extract the analysis part (everything before the JSON)
	const analysisEnd = text.lastIndexOf("{");
	const analysis = text.substring(0, analysisEnd).trim();

	// Format sources with citations
	let sources = analysis;
	if (citations.length > 0) {
		sources += "\n\n## Sources\n";
		citations.forEach((url, i) => {
			sources += `${i + 1}. ${url}\n`;
		});
	}

	return {
		title: result.title,
		improved: result.ukrainian,
		sources,
	};
}

// Step 3: Translate to Romanian
async function translateToRomanian(ukrainianText: string): Promise<string> {
	const response = await anthropic.messages.create({
		model: "claude-sonnet-4-20250514",
		max_tokens: 4096,
		messages: [
			{
				role: "user",
				content: `Translate this Ukrainian Christmas carol to Romanian. Preserve the poetic structure and line breaks.

${ukrainianText}

Return ONLY the Romanian translation, nothing else.`,
			},
		],
	});

	const content = response.content[0];
	if (!content || content.type !== "text") {
		throw new Error("No translation response");
	}

	return content.text.trim();
}

// Main processing function
export async function processImage(imagePath: string): Promise<ProcessResult> {
	console.log("  Step 1: Extracting Ukrainian text...");
	const rawText = await extractUkrainianText(imagePath);

	console.log("  Step 2: Searching and improving lyrics...");
	const { title, improved, sources } = await improveWithSearch(rawText);

	console.log("  Step 3: Translating to Romanian...");
	const romanian = await translateToRomanian(improved);

	// Sanitize title for filesystem
	const sanitizedTitle = title
		.toLowerCase()
		.replace(/[^a-z0-9-]/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");

	return {
		title: sanitizedTitle,
		ukrainian: improved,
		romanian,
		sources,
	};
}
