import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { VideoAsset, GifAsset, AudioAsset, VideoScript } from '@/lib/types';

let ffmpeg: FFmpeg | null = null;

export async function loadFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
  if (ffmpeg && ffmpeg.loaded) {
    return ffmpeg;
  }

  ffmpeg = new FFmpeg();

  ffmpeg.on('progress', ({ progress }) => {
    onProgress?.(Math.round(progress * 100));
  });

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpeg;
}

export interface GenerateVideoOptions {
  backgroundVideo: VideoAsset;
  gif?: GifAsset;
  audio?: AudioAsset;
  script: VideoScript;
  onProgress?: (stage: string, progress: number) => void;
}

export async function generateVideo(options: GenerateVideoOptions): Promise<Blob> {
  const { backgroundVideo, gif, audio, script, onProgress } = options;

  onProgress?.('Loading FFmpeg', 0);
  const ff = await loadFFmpeg((p) => onProgress?.('Loading FFmpeg', p));

  onProgress?.('Downloading assets', 0);

  const videoData = await fetchFile(backgroundVideo.url);
  await ff.writeFile('input.mp4', videoData);
  onProgress?.('Downloading assets', 33);

  if (gif) {
    const gifData = await fetchFile(gif.url);
    await ff.writeFile('overlay.gif', gifData);
    onProgress?.('Downloading assets', 66);
  }

  if (audio) {
    const audioData = await fetchFile(audio.url);
    await ff.writeFile('audio.mp3', audioData);
  }
  onProgress?.('Downloading assets', 100);

  onProgress?.('Processing video', 0);

  const textOverlay = script.textOverlay.replace(/'/g, "\\'").replace(/:/g, "\\:");

  let filterComplex = '';
  let outputArgs: string[] = [];

  if (gif && audio) {
    filterComplex = [
      '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[bg]',
      '[1:v]scale=300:-1[gif]',
      `[bg][gif]overlay=W-w-50:H-h-200[vid]`,
      `[vid]drawtext=text='${textOverlay}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=100:shadowcolor=black:shadowx=2:shadowy=2[out]`,
    ].join(';');
    outputArgs = ['-map', '[out]', '-map', '2:a', '-shortest'];
  } else if (gif) {
    filterComplex = [
      '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[bg]',
      '[1:v]scale=300:-1[gif]',
      `[bg][gif]overlay=W-w-50:H-h-200[vid]`,
      `[vid]drawtext=text='${textOverlay}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=100:shadowcolor=black:shadowx=2:shadowy=2[out]`,
    ].join(';');
    outputArgs = ['-map', '[out]', '-an'];
  } else if (audio) {
    filterComplex = [
      '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[vid]',
      `[vid]drawtext=text='${textOverlay}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=100:shadowcolor=black:shadowx=2:shadowy=2[out]`,
    ].join(';');
    outputArgs = ['-map', '[out]', '-map', '1:a', '-shortest'];
  } else {
    filterComplex = [
      '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[vid]',
      `[vid]drawtext=text='${textOverlay}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=100:shadowcolor=black:shadowx=2:shadowy=2[out]`,
    ].join(';');
    outputArgs = ['-map', '[out]', '-an'];
  }

  const inputArgs = ['-i', 'input.mp4'];
  if (gif) inputArgs.push('-i', 'overlay.gif');
  if (audio) inputArgs.push('-i', 'audio.mp3');

  await ff.exec([
    ...inputArgs,
    '-filter_complex', filterComplex,
    ...outputArgs,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-t', '15',
    '-y',
    'output.mp4',
  ]);

  onProgress?.('Processing video', 100);

  const data = await ff.readFile('output.mp4');
  const blob = new Blob([data as BlobPart], { type: 'video/mp4' });

  await ff.deleteFile('input.mp4');
  if (gif) await ff.deleteFile('overlay.gif');
  if (audio) await ff.deleteFile('audio.mp3');
  await ff.deleteFile('output.mp4');

  return blob;
}
