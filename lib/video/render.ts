import type { VideoComposition } from '@/lib/types/video';

export interface RenderData {
  composition: VideoComposition;
  jobId: string;
}

export function prepareRenderData(
  composition: VideoComposition,
  jobId: string
): RenderData {
  return { composition, jobId };
}
