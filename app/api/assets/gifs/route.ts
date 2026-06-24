import { searchGifs } from '@/lib/assets/giphy';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  if (!query) {
    return Response.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    const gifs = await searchGifs(query, { limit });
    return Response.json({ gifs });
  } catch (error) {
    console.error('GIF search error:', error);
    return Response.json(
      { error: 'Failed to search GIFs' },
      { status: 500 }
    );
  }
}
