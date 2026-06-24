import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import type { VideoComposition } from '@/lib/types/video';
import { uploadFinalVideo } from '@/lib/audio/ingest';

const COMPOSITION_ID = 'UgcVideo';

export async function renderVideo(
  composition: VideoComposition,
  jobId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const entryPoint = path.join(process.cwd(), 'lib/video/remotion/index.tsx');

  onProgress?.(5);

  const bundleLocation = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });

  onProgress?.(20);

  const inputProps = { composition };
  const fps = 30;
  const durationInFrames = composition.durationSec * fps;

  const comp = await selectComposition({
    serveUrl: bundleLocation,
    id: COMPOSITION_ID,
    inputProps,
  });

  onProgress?.(30);

  const outputPath = path.join('/tmp', `${jobId}.mp4`);

  await renderMedia({
    composition: {
      ...comp,
      durationInFrames,
      fps,
      width: 1080,
      height: 1920,
    },
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps,
    onProgress: ({ progress }) => {
      onProgress?.(30 + Math.round(progress * 60));
    },
  });

  onProgress?.(90);

  const videoBuffer = fs.readFileSync(outputPath);
  const outputUrl = await uploadFinalVideo(new Uint8Array(videoBuffer), jobId);

  fs.unlinkSync(outputPath);

  onProgress?.(100);

  return outputUrl;
}
