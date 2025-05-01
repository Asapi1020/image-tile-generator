import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const inputImage = process.argv[2];
const outputDir = process.argv[3] ?? "tiles";
const tileSize = 256; // Leafletの標準サイズ

// 画像を読み込み
sharp(inputImage)
	.metadata()
	.then(async ({ width, height }) => {
		if (!width || !height) {
			throw new Error("Failed to get image dimensions.");
		}

		const maxZoom = Math.ceil(Math.log2(Math.max(width, height) / tileSize));

		for (let z = 0; z <= maxZoom; z++) {
			const scaledWidth = tileSize * 2 ** z;
			const scaledHeight = tileSize * 2 ** z;
			const cols = Math.ceil(scaledWidth / tileSize);
			const rows = Math.ceil(scaledHeight / tileSize);

			console.log(`Generating tiles for zoom level ${z}: ${cols}x${rows}`);

			const resizedImage = await sharp(inputImage)
				.resize(scaledWidth, scaledHeight)
				.toBuffer();

			for (let x = 0; x < cols; x++) {
				for (let y = 0; y < rows; y++) {
					const tilePath = path.join(outputDir, `${z}/${x}`);
					if (!fs.existsSync(tilePath)) {
						fs.mkdirSync(tilePath, { recursive: true });
					}

					const tileFile = path.join(tilePath, `${y}.png`);
					await sharp(resizedImage)
						.extract({
							left: x * tileSize,
							top: y * tileSize,
							width: Math.min(tileSize, scaledWidth - x * tileSize),
							height: Math.min(tileSize, scaledHeight - y * tileSize),
						})
						.toFile(tileFile);
				}
			}
		}

		console.log("Tile generation complete!");
	})
	.catch((err) => console.error("Error processing image:", err));
