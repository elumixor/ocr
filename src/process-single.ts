import { processImage } from "./process-image";
import { mkdir, copyFile, writeFile } from "fs/promises";
import path from "path";

async function main() {
  const imagePath = process.argv[2];

  if (!imagePath) {
    console.error("Usage: bun run process-single <image-path>");
    console.error("Example: bun run process-single ./images/song.jpeg");
    process.exit(1);
  }

  console.log(`Processing: ${imagePath}`);

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

    console.log(`Done! Output saved to: ${outDir}`);
    console.log(`  - Title: ${result.title}`);
    console.log(`  - Source: ${sourceDest}`);
    console.log(`  - Ukrainian: ${ukrainianPath}`);
    console.log(`  - Romanian: ${romanianPath}`);
    console.log(`  - Sources: ${sourcesPath}`);
  } catch (error) {
    console.error("Error processing image:", error);
    process.exit(1);
  }
}

main();
