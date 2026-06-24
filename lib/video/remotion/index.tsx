import { Composition } from 'remotion';
import { UgcVideo } from './UgcVideo';
import type { VideoComposition } from '@/lib/types/video';

const defaultComposition: VideoComposition = {
  durationSec: 7,
  hookText: 'POV: Your app finally works',
  subText: 'No more frustration',
  ctaText: 'Try it now',
  assets: {
    backgroundVideoUrl: '',
    gifUrl: '',
    musicUrl: '',
    musicName: '',
  },
  visualStyle: 'meme',
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="UgcVideo"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component={UgcVideo as any}
      durationInFrames={210}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        composition: defaultComposition,
      }}
    />
  );
};
