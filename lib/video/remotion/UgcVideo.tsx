import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  Img,
  AnimatedImage,
} from 'remotion';
import { Video, Audio } from '@remotion/media';
import type { VideoComposition } from '@/lib/types/video';

export interface UgcVideoProps {
  composition: VideoComposition;
}

export const UgcVideo: React.FC<UgcVideoProps> = ({ composition }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const hookOpacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const hookY = interpolate(frame, [0, fps * 0.5], [30, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const subOpacity = interpolate(frame, [fps * 0.8, fps * 1.3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const ctaOpacity = interpolate(frame, [fps * 1.5, fps * 2], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const ctaScale = interpolate(frame, [fps * 1.5, fps * 2], [0.8, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const gifUrl = composition.assets.gifUrl;
  const isGif = gifUrl.toLowerCase().includes('.gif');

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Background Video */}
      {composition.assets.backgroundVideoUrl && (
        <Video
          src={composition.assets.backgroundVideoUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          muted
          loop
        />
      )}

      {/* Dark overlay for text readability */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* Hook Text - Top */}
      <div
        style={{
          position: 'absolute',
          top: 180,
          left: 40,
          right: 40,
          opacity: hookOpacity,
          transform: `translateY(${hookY}px)`,
        }}
      >
        <h1
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: '#fff',
            textAlign: 'center',
            textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
            lineHeight: 1.2,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {composition.hookText}
        </h1>
      </div>

      {/* Sub Text - Middle */}
      {composition.subText && (
        <div
          style={{
            position: 'absolute',
            top: '45%',
            left: 40,
            right: 40,
            opacity: subOpacity,
          }}
        >
          <p
            style={{
              fontSize: 44,
              fontWeight: 600,
              color: '#fff',
              textAlign: 'center',
              textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
              lineHeight: 1.3,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {composition.subText}
          </p>
        </div>
      )}

      {/* CTA Text - Bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 200,
          left: 40,
          right: 40,
          opacity: ctaOpacity,
          transform: `scale(${ctaScale})`,
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: 16,
            padding: '16px 32px',
            display: 'inline-block',
            marginLeft: 'auto',
            marginRight: 'auto',
            width: 'fit-content',
            position: 'relative',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <p
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: '#fff',
              textAlign: 'center',
              margin: 0,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {composition.ctaText}
          </p>
        </div>
      </div>

      {/* GIF/Meme Overlay - Bottom Right */}
      {gifUrl && (
        <Sequence from={Math.floor(fps * 0.3)}>
          <div
            style={{
              position: 'absolute',
              bottom: 320,
              right: 40,
              width: 280,
              height: 280,
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {isGif ? (
              <AnimatedImage
                src={gifUrl}
                width={280}
                height={280}
                fit="cover"
                loopBehavior="loop"
              />
            ) : (
              <Img
                src={gifUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            )}
          </div>
        </Sequence>
      )}

      {/* Audio */}
      {composition.assets.musicUrl && (
        <Audio
          src={composition.assets.musicUrl}
          volume={0.7}
          loop
        />
      )}
    </AbsoluteFill>
  );
};
