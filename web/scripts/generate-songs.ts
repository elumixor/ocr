import { cp, mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";

const OUT_DIR = path.join(import.meta.dir, "../../out");
const PUBLIC_SONGS_DIR = path.join(import.meta.dir, "../public/songs");
const SONGS_JSON_PATH = path.join(import.meta.dir, "../public/songs.json");

interface Song {
	id: string;
	title: string;
	ukrainian: string;
	romanian: string;
	sources: string;
}

function slugToTitle(slug: string): string {
	return slug
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

async function main() {
	const folders = await readdir(OUT_DIR);
	const songs: Song[] = [];

	// Create public/songs directory
	await mkdir(PUBLIC_SONGS_DIR, { recursive: true });

	for (const folder of folders) {
		const folderPath = path.join(OUT_DIR, folder);
		const ukrainianPath = path.join(folderPath, "ukrainian.txt");
		const romanianPath = path.join(folderPath, "romanian.txt");
		const sourcesPath = path.join(folderPath, "sources.md");

		try {
			const ukrainian = await readFile(ukrainianPath, "utf-8");
			const romanian = await readFile(romanianPath, "utf-8");
			let sources = "";
			try {
				sources = await readFile(sourcesPath, "utf-8");
			} catch {
				// sources.md may not exist for older entries
			}

			songs.push({
				id: folder,
				title: slugToTitle(folder),
				ukrainian: ukrainian.trim(),
				romanian: romanian.trim(),
				sources: sources.trim(),
			});

			// Copy source image to public folder
			const sourceFiles = (await readdir(folderPath)).filter((f) =>
				f.startsWith("source"),
			);
			if (sourceFiles.length > 0) {
				const songDir = path.join(PUBLIC_SONGS_DIR, folder);
				await mkdir(songDir, { recursive: true });
				await cp(
					path.join(folderPath, sourceFiles[0] as string),
					path.join(songDir, sourceFiles[0] as string),
				);
			}
		} catch {
			console.warn(`Skipping ${folder}: missing files`);
		}
	}

	// Sort songs alphabetically
	songs.sort((a, b) => a.title.localeCompare(b.title));

	await writeFile(SONGS_JSON_PATH, JSON.stringify(songs, null, 2));
	console.log(`Generated songs.json with ${songs.length} songs`);
}

main();
