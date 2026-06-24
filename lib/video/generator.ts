import type { VideoComposition } from '@/lib/types/video';

export async function generateVideo(
  composition: VideoComposition,
  onProgress?: (stage: string, progress: number) => void
): Promise<Blob> {
  onProgress?.('Preparing video...', 0);

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d')!;

  const durationSec = composition.durationSec;

  onProgress?.('Loading assets...', 10);

  // Load background video
  const bgVideo = document.createElement('video');
  bgVideo.crossOrigin = 'anonymous';
  bgVideo.src = composition.assets.backgroundVideoUrl;
  bgVideo.muted = true;
  bgVideo.loop = true;

  await new Promise<void>((resolve, reject) => {
    bgVideo.onloadeddata = () => resolve();
    bgVideo.onerror = () => reject(new Error('Failed to load background video'));
    bgVideo.load();
  });

  // Load meme/GIF image
  let memeImg: HTMLImageElement | null = null;
  if (composition.assets.gifUrl) {
    memeImg = new Image();
    memeImg.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      memeImg!.onload = () => resolve();
      memeImg!.onerror = () => reject(new Error('Failed to load meme'));
      memeImg!.src = composition.assets.gifUrl;
    });
  }

  onProgress?.('Rendering...', 20);

  // Set up recording
  const stream = canvas.captureStream(30);

  // Add audio if available
  let audioEl: HTMLAudioElement | null = null;
  if (composition.assets.musicUrl) {
    try {
      audioEl = document.createElement('audio');
      audioEl.crossOrigin = 'anonymous';
      audioEl.src = composition.assets.musicUrl;
      audioEl.volume = 0.8;

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaElementSource(audioEl);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      source.connect(audioCtx.destination);

      dest.stream.getAudioTracks().forEach(track => stream.addTrack(track));
    } catch (e) {
      console.warn('Audio setup failed:', e);
    }
  }

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 8000000,
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordingDone = new Promise<Blob>((resolve) => {
    mediaRecorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'video/webm' }));
    };
  });

  mediaRecorder.start();
  bgVideo.currentTime = 0;
  await bgVideo.play();
  if (audioEl) audioEl.play();

  const startTime = Date.now();

  const renderFrame = () => {
    const elapsed = (Date.now() - startTime) / 1000;
    const progress = Math.min(elapsed / durationSec, 1);
    onProgress?.('Rendering...', 20 + Math.round(progress * 70));

    // 1. BACKGROUND VIDEO
    ctx.drawImage(bgVideo, 0, 0, canvas.width, canvas.height);

    // Subtle dark overlay for text readability
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. MEME TEXT ON TOP
    const textOpacity = Math.min(elapsed / 0.4, 1);
    ctx.save();
    ctx.globalAlpha = textOpacity;
    ctx.font = 'bold 56px "Impact", "Arial Black", sans-serif';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';

    // Word wrap the meme text
    const words = composition.hookText.split(' ');
    const maxWidth = canvas.width - 100;
    let lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    // Draw text at top with meme-style stroke
    const lineHeight = 70;
    const startY = 200;
    lines.forEach((line, i) => {
      const y = startY + i * lineHeight;
      ctx.strokeText(line, canvas.width / 2, y);
      ctx.fillText(line, canvas.width / 2, y);
    });
    ctx.restore();

    // 3. MEME/GIF IN CENTER (THE MAIN ATTRACTION)
    if (memeImg && elapsed > 0.2) {
      const memeOpacity = Math.min((elapsed - 0.2) / 0.3, 1);
      const pulse = 1 + Math.sin(elapsed * 3) * 0.015;

      ctx.save();
      ctx.globalAlpha = memeOpacity;

      // Large centered meme
      const memeSize = 500;
      const memeX = (canvas.width - memeSize) / 2;
      const memeY = (canvas.height - memeSize) / 2;

      // Apply pulse scale
      ctx.translate(memeX + memeSize / 2, memeY + memeSize / 2);
      ctx.scale(pulse, pulse);
      ctx.translate(-(memeX + memeSize / 2), -(memeY + memeSize / 2));

      // Drop shadow
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;

      // White border frame
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.roundRect(memeX - 8, memeY - 8, memeSize + 16, memeSize + 16, 20);
      ctx.fill();

      // Draw meme image
      ctx.beginPath();
      ctx.roundRect(memeX, memeY, memeSize, memeSize, 16);
      ctx.clip();
      ctx.drawImage(memeImg, memeX, memeY, memeSize, memeSize);

      ctx.restore();
    }

    // 4. SMALL CTA/BRAND AT BOTTOM
    if (elapsed > 1) {
      const ctaOpacity = Math.min((elapsed - 1) / 0.3, 1);
      ctx.save();
      ctx.globalAlpha = ctaOpacity;
      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 8;
      ctx.fillText(composition.ctaText, canvas.width / 2, canvas.height - 120);
      ctx.restore();
    }

    if (elapsed < durationSec) {
      requestAnimationFrame(renderFrame);
    } else {
      bgVideo.pause();
      if (audioEl) audioEl.pause();
      mediaRecorder.stop();
    }
  };

  renderFrame();

  onProgress?.('Finalizing...', 95);
  const blob = await recordingDone;
  onProgress?.('Done!', 100);

  return blob;
}
