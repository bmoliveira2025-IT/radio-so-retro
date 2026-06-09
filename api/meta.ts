import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';
import http from 'http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');

  try {
    const client = url.startsWith('https') ? https : http;

    const request = client.get(url, {
      headers: {
        'Icy-MetaData': '1',
        'User-Agent': 'Vercel-Meta-Proxy/1.0'
      }
    }, (response) => {
      const metaint = response.headers['icy-metaint'];

      if (!metaint) {
        request.destroy();
        return res.status(200).json({ title: null });
      }

      const metaintInt = parseInt(metaint as string, 10);
      let dataCount = 0;
      let metaLength = 0;
      let metaBuffer = Buffer.alloc(0);

      // Timeout for stream parsing (max 6 seconds)
      const timeout = setTimeout(() => {
        request.destroy();
        if (!res.headersSent) {
          res.status(200).json({ title: null });
        }
      }, 6000);

      response.on('data', (chunk) => {
        for (let i = 0; i < chunk.length; i++) {
          if (metaLength > 0) {
            metaBuffer = Buffer.concat([metaBuffer, chunk.slice(i, i + 1)]);
            metaLength--;
            if (metaLength === 0) {
              // Parse metadata string
              const metaString = metaBuffer.toString('utf-8').replace(/\0/g, '');
              const match = metaString.match(/StreamTitle='(.*?)';/);
              const title = match ? match[1] : null;

              clearTimeout(timeout);
              request.destroy();
              
              if (!res.headersSent) {
                return res.status(200).json({ title });
              }
            }
          } else if (dataCount === metaintInt) {
            metaLength = chunk[i] * 16;
            dataCount = 0;
            if (metaLength === 0) {
              // No metadata in this block
            }
          } else {
            dataCount++;
          }
        }
      });
    });

    request.on('error', () => {
      if (!res.headersSent) res.status(200).json({ title: null });
    });

  } catch (error) {
    if (!res.headersSent) res.status(200).json({ title: null });
  }
}
