import { getFrameHtmlResponse } from '@farcaster/frame-sdk';

const APP_NAME = 'Journey Through Time';
const DEFAULT_DESCRIPTION = 'Write encrypted letters to your future self.';
const PRIMARY_BUTTON = 'Open App';

function getBaseUrl(req) {
  const origin = req.headers.origin;
  if (origin) {
    return origin;
  }
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  return `${protocol}://${host}`;
}

function buildFrameMetadata(baseUrl) {
  const frameUrl = `${baseUrl}/frame`;
  const imageUrl = `${baseUrl}/frame-image`;
  const appUrl = process.env.APP_URL || 'https://example.com';

  return getFrameHtmlResponse({
    buttons: [
      {
        label: PRIMARY_BUTTON,
        action: 'link',
        target: appUrl,
      },
    ],
    image: {
      src: imageUrl,
      aspectRatio: '1.91:1',
    },
    input: {
      text: 'Optional note to your future self',
    },
    postUrl: frameUrl,
    title: APP_NAME,
    description: DEFAULT_DESCRIPTION,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).setHeader('Allow', 'GET, POST').send('Method not allowed');
    return;
  }

  const baseUrl = getBaseUrl(req);
  const html = buildFrameMetadata(baseUrl);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
