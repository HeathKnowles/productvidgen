import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.R2_BUCKET || 'ugc-videos';

export async function uploadVideo(
  buffer: ArrayBuffer,
  filename: string
): Promise<string> {
  const key = `videos/${filename}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: new Uint8Array(buffer),
      ContentType: 'video/mp4',
    })
  );

  const signedUrl = await getSignedUrl(
    r2Client,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
    { expiresIn: 60 * 60 * 24 * 7 }
  );

  return signedUrl;
}

export async function getVideoUrl(filename: string): Promise<string> {
  const key = `videos/${filename}`;

  const signedUrl = await getSignedUrl(
    r2Client,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
    { expiresIn: 60 * 60 * 24 }
  );

  return signedUrl;
}
