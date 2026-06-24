import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.R2_BUCKET || 'ugc-videos';

export interface IngestedAsset {
  storageKey: string;
  storageUrl: string;
  source: string;
  sourceId: string;
  duration?: number;
}

async function assetExists(key: string): Promise<boolean> {
  try {
    await r2Client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function getSignedUrlForKey(key: string): Promise<string> {
  return getSignedUrl(
    r2Client,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 3600 * 24 }
  );
}

export async function ingestAudio(
  sourceUrl: string,
  source: string,
  sourceId: string,
  duration?: number
): Promise<IngestedAsset> {
  const key = `audio/${source}/${sourceId}.mp3`;

  if (await assetExists(key)) {
    console.log('Audio already ingested:', key);
    return {
      storageKey: key,
      storageUrl: await getSignedUrlForKey(key),
      source,
      sourceId,
      duration,
    };
  }

  console.log('Ingesting audio from:', sourceUrl);

  const response = await fetch(sourceUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'audio/mpeg',
    })
  );

  console.log('Audio ingested to:', key);

  return {
    storageKey: key,
    storageUrl: await getSignedUrlForKey(key),
    source,
    sourceId,
    duration,
  };
}

export async function ingestVideo(
  sourceUrl: string,
  source: string,
  sourceId: string
): Promise<IngestedAsset> {
  const key = `video/${source}/${sourceId}.mp4`;

  if (await assetExists(key)) {
    console.log('Video already ingested:', key);
    return {
      storageKey: key,
      storageUrl: await getSignedUrlForKey(key),
      source,
      sourceId,
    };
  }

  console.log('Ingesting video from:', sourceUrl);

  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch video: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'video/mp4',
    })
  );

  return {
    storageKey: key,
    storageUrl: await getSignedUrlForKey(key),
    source,
    sourceId,
  };
}

export async function ingestGif(
  sourceUrl: string,
  source: string,
  sourceId: string
): Promise<IngestedAsset> {
  const key = `gif/${source}/${sourceId}.gif`;

  if (await assetExists(key)) {
    console.log('GIF already ingested:', key);
    return {
      storageKey: key,
      storageUrl: await getSignedUrlForKey(key),
      source,
      sourceId,
    };
  }

  console.log('Ingesting GIF from:', sourceUrl);

  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch GIF: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'image/gif',
    })
  );

  return {
    storageKey: key,
    storageUrl: await getSignedUrlForKey(key),
    source,
    sourceId,
  };
}

export async function uploadFinalVideo(
  videoBuffer: Uint8Array,
  jobId: string
): Promise<string> {
  const key = `output/${jobId}.mp4`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: videoBuffer,
      ContentType: 'video/mp4',
    })
  );

  return getSignedUrlForKey(key);
}
