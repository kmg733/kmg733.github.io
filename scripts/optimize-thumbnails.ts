/**
 * 썸네일 이미지 최적화 스크립트
 *
 * 실행 시:
 * 1. public/images/thumbnails/ 의 모든 *-light.png, *-dark.png 를 WebP 640px 로 변환
 * 2. 각 이미지의 blur placeholder (20px base64) 를 생성하여 JSON 파일에 저장
 *
 * 출력:
 * - public/images/thumbnails/{name}-light.webp
 * - public/images/thumbnails/{name}-dark.webp
 * - src/lib/thumbnail-blur-data.json
 */

import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";

const THUMBNAILS_DIR = path.resolve(
  process.cwd(),
  "public/images/thumbnails"
);
const OUTPUT_JSON = path.resolve(
  process.cwd(),
  "src/lib/thumbnail-blur-data.json"
);

const WEBP_WIDTH = 640;
const WEBP_QUALITY = 80;
const BLUR_WIDTH = 20;

interface BlurDataMap {
  [key: string]: string; // "/images/thumbnails/foo-light.png" → "data:image/webp;base64,..."
}

async function generateBlurDataUrl(inputPath: string): Promise<string> {
  const buffer = await sharp(inputPath)
    .resize(BLUR_WIDTH)
    .blur(4)
    .webp({ quality: 20 })
    .toBuffer();
  return `data:image/webp;base64,${buffer.toString("base64")}`;
}

async function optimizeThumbnail(inputPath: string): Promise<void> {
  const outputPath = inputPath.replace(/\.png$/i, ".webp");

  await sharp(inputPath)
    .resize({ width: WEBP_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toFile(outputPath);
}

async function main() {
  if (process.env.SKIP_OPTIMIZE === "1") {
    console.log("SKIP_OPTIMIZE=1 감지, 썸네일 최적화를 건너뜁니다.");
    return;
  }

  if (!fs.existsSync(THUMBNAILS_DIR)) {
    console.error(`썸네일 디렉토리가 없습니다: ${THUMBNAILS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(THUMBNAILS_DIR);
  const pngFiles = files.filter(
    (f) =>
      (f.endsWith("-light.png") || f.endsWith("-dark.png")) &&
      !f.startsWith(".")
  );

  if (pngFiles.length === 0) {
    console.log("최적화할 PNG 썸네일 파일이 없습니다.");
    return;
  }

  console.log(`썸네일 최적화 시작: ${pngFiles.length}개 파일`);

  const blurDataMap: BlurDataMap = {};

  // 기존 JSON 로드 (증분 업데이트를 위해)
  if (fs.existsSync(OUTPUT_JSON)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUTPUT_JSON, "utf-8"));
      Object.assign(blurDataMap, existing);
    } catch (err) {
      console.warn("기존 blur JSON 파싱 실패, 새로 생성합니다:", err);
    }
  }

  for (const file of pngFiles) {
    const inputPath = path.join(THUMBNAILS_DIR, file);
    if (!inputPath.startsWith(THUMBNAILS_DIR + path.sep)) {
      console.warn(`  경로 범위 초과, 건너뜀: ${file}`);
      continue;
    }
    const webpPath = inputPath.replace(/\.png$/i, ".webp");

    // WebP가 이미 최신 상태인지 확인 (PNG 수정 시각 비교)
    const pngMtime = fs.statSync(inputPath).mtimeMs;
    const webpExists = fs.existsSync(webpPath);
    const webpMtime = webpExists ? fs.statSync(webpPath).mtimeMs : 0;

    const publicKey = `/images/thumbnails/${file}`;
    const needsUpdate = !webpExists || pngMtime > webpMtime;

    if (needsUpdate) {
      try {
        await optimizeThumbnail(inputPath);
        const webpSize = fs.statSync(webpPath).size;
        const pngSize = fs.statSync(inputPath).size;
        const reduction = (((pngSize - webpSize) / pngSize) * 100).toFixed(1);
        console.log(
          `  ✓ ${file} → WebP (${(pngSize / 1024).toFixed(0)}KB → ${(webpSize / 1024).toFixed(0)}KB, ${reduction}% 감소)`
        );
      } catch (err) {
        console.error(`  ✗ ${file} WebP 변환 실패:`, err);
        continue;
      }
    } else {
      console.log(`  - ${file} WebP 이미 최신 상태, 건너뜀`);
    }

    // blur placeholder는 항상 재생성하지 않고 캐시 활용
    if (!blurDataMap[publicKey] || needsUpdate) {
      try {
        blurDataMap[publicKey] = await generateBlurDataUrl(inputPath);
      } catch (err) {
        console.error(`  ✗ ${file} blur placeholder 생성 실패:`, err);
      }
    }
  }

  // JSON 저장
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(blurDataMap, null, 2), "utf-8");
  console.log(`blur placeholder 저장 완료: ${OUTPUT_JSON}`);
  console.log("썸네일 최적화 완료.");
}

main().catch((err) => {
  console.error("스크립트 실행 오류:", err);
  process.exit(1);
});
