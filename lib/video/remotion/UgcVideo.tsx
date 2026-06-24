import { AbsoluteFill, Video, Audio, Img, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import type { VideoComposition } from '@/lib/types/video';

export interface UgcVideoProps {
  composition: VideoComposition;
}

export const UgcVideo: React.FC<UgcVideoProps> = ({ composition }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const hookStart = 0;
  const hookEnd = Math.floor(fps * 1.5);
  const subStart = hookEnd;
  const subEnd = Math.floor(fps * 5);
  const ctaStart = subEnd;
  const gifStart = Math.floor(fps * 2);

  const hookOpacity = interpolate(
    frame,
    [hookStart, hookStart + 10, hookEnd - 10, hookEnd],
    [0, 1, 1, 0],
    { extrapolateRight: 'clamp' }
  );

  const hookScale = spring({
    frame: frame - hookStart,
    fps,
    config: { damping: 12, stiffness: 200 },
  });

  const subOpacity = interpolate(
    frame,
    [subStart, subStart + 10, subEnd - 10, subEnd],
    [0, 1, 1, 0],
    { extrapolateRight: 'clamp' }
  );

  const ctaOpacity = interpolate(
    frame,
    [ctaStart, ctaStart + 15, durationInFrames],
    [0, 1, 1],
    { extrapolateRight: 'clamp' }
  );

  const gifScale = spring({
    frame: frame - gifStart,
    fps,
    config: { damping: 10, stiffness: 150 },
  });

  const gifOpacity = frame >= gifStart ? 1 : 0;

  const isMemeStyle = composition.visualStyle === 'meme';
  const isChaoticStyle = composition.visualStyle === 'chaotic-zoom';

  const bgScale = isChaoticStyle
    ? interpolate(frame, [0, durationInFrames], [1, 1.1], { extrapolateRight: 'clamp' })
    : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Background Video */}
      <AbsoluteFill style={{ transform: `scale(${bgScale})` }}>
        <Video
          src={composition.assets.backgroundVideoUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </AbsoluteFill>

      {/* Gradient Overlay for text readability */}
      <AbsoluteFill
        style={{
          background: isMemeStyle
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.6) 100%)'
            : 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* Hook Text */}
      <AbsoluteFill
        style={{
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingTop: 120,
          opacity: hookOpacity,
          transform: `scale(${hookScale})`,
        }}
      >
        <div
          style={{
            color: '#fff',
            fontSize: isMemeStyle ? 42 : 36,
            fontWeight: 800,
            textAlign: 'center',
            textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
            padding: '0 24px',
            maxWidth: '90%',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: 1.2,
          }}
        >
          {composition.hookText}
        </div>
      </AbsoluteFill>

      {/* Sub Text */}
      {composition.subText && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            opacity: subOpacity,
          }}
        >
          <div
            style={{
              color: '#fff',
              fontSize: 28,
              fontWeight: 600,
              textAlign: 'center',
              textShadow: '2px 2px 6px rgba(0,0,0,0.8)',
              padding: '0 32px',
              maxWidth: '85%',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {composition.subText}
          </div>
        </AbsoluteFill>
      )}

      {/* GIF Overlay */}
      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          alignItems: 'flex-end',
          padding: 40,
          paddingBottom: 200,
          opacity: gifOpacity,
          transform: `scale(${Math.min(gifScale, 1)})`,
        }}
      >
        <Img
          src={composition.assets.gifUrl}
          style={{
            width: 180,
            height: 'auto',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        />
      </AbsoluteFill>

      {/* CTA / Brand */}
      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingBottom: 80,
          opacity: ctaOpacity,
        }}
      >
        <div
          style={{
            color: '#fff',
            fontSize: 32,
            fontWeight: 700,
            textAlign: 'center',
            textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
            padding: '12px 32px',
            backgroundColor: 'rgba(0,0,0,0.4)',
            borderRadius: 12,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {composition.ctaText}
        </div>
      </AbsoluteFill>

      {/* Main Audio Track */}
      <Audio src={composition.assets.musicUrl} volume={0.7} />

      {/* SFX at GIF entrance */}
      {composition.assets.sfxUrl && (
        <Audio
          src={composition.assets.sfxUrl}
          volume={0.9}
        />
      )}
    </AbsoluteFill>
  );
};
