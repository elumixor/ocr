import { copyFile, mkdir, readdir, writeFile } from "fs/promises";
import path from "path";
import { processImage } from "./process-image";

const IMAGE_EXTENSIONS = [".jpeg", ".jpg", ".png"];

async function main() {
	const inputDir = process.argv[2] || "./images";

	console.log(`Processing all images in: ${inputDir}`);

	// Get all image files
	const files = await readdir(inputDir);
	const imageFiles = files.filter((f) =>
		IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()),
	);

	if (imageFiles.length === 0) {
		console.log("No image files found.");
		return;
	}

	console.log(`Found ${imageFiles.length} images to process.\n`);

	let processed = 0;
	let failed = 0;

	await Promise.all(
		imageFiles.map(async (file) => {
			const imagePath = path.join(inputDir, file);
			console.log(
				`[${processed + failed + 1}/${imageFiles.length}] Processing: ${file}`,
			);

			try {
				const result = await processImage(imagePath);

				// Create output directory
				const outDir = path.join("out", result.title);
				await mkdir(outDir, { recursive: true });

				// Copy source image
				const sourceExt = path.extname(imagePath);
				const sourceDest = path.join(outDir, `source${sourceExt}`);
				await copyFile(imagePath, sourceDest);

				// Write Ukrainian text
				const ukrainianPath = path.join(outDir, "ukrainian.txt");
				await writeFile(ukrainianPath, result.ukrainian, "utf-8");

				// Write Romanian translation
				const romanianPath = path.join(outDir, "romanian.txt");
				await writeFile(romanianPath, result.romanian, "utf-8");

				// Write sources/references
				const sourcesPath = path.join(outDir, "sources.md");
				await writeFile(sourcesPath, result.sources, "utf-8");

				console.log(`  -> Saved to: ${outDir}`);
				processed++;
			} catch (error) {
				console.error(
					`  -> Error: ${error instanceof Error ? error.message : error}`,
				);
				failed++;
			}
		}),
	);

	console.log(`\nDone! Processed: ${processed}, Failed: ${failed}`);
}

main();
