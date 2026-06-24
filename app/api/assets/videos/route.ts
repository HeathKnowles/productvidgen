import { searchVideos } from '@/lib/assets/pexels';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const orientation = (searchParams.get('orientation') || 'portrait') as 'landscape' | 'portrait';

  if (!query) {
    return Response.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    const videos = await searchVideos(query, { limit, orientation });
    return Response.json({ videos });
  } catch (error) {
    console.error('Video search error:', error);
    return Response.json(
      { error: 'Failed to search videos' },
      { status: 500 }
    );
  }
}
