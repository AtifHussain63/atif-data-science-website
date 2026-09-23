import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// Port Configuration:
// In the AI Studio sandbox development container, DEFAULT_APP_PORT is 3000 (proxied by nginx).
// In Google Cloud Run production deployment, Cloud Run injects PORT (default 8080).
const PORT = process.env.DEFAULT_APP_PORT
  ? 3000
  : (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);

const app = express();

app.use(express.json());

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key.trim().length > 5 && key !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({ apiKey: key.trim() });
    }
  }
  return aiClient;
}

// -------------------------------------------------------------
// API Routes (Mounted FIRST before Vite middleware)
// -------------------------------------------------------------

// 1. Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Atif Skills Hub',
    service: 'Online Learning & Certification Platform',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    hasYouTubeKey: Boolean(process.env.YOUTUBE_API_KEY),
  });
});

// Helper: resolve YouTube API Key (server env or custom header)
function getYouTubeKey(req: express.Request): string {
  const custom = (req.headers['x-youtube-key'] as string) || '';
  if (custom && custom.trim().length > 10) return custom.trim();
  const env = process.env.YOUTUBE_API_KEY || '';
  if (env && env.trim().length > 10) return env.trim();
  return '';
}

// Helper: parse ISO 8601 duration
function parseISODuration(iso?: string): { formatted: string; minutes: number } {
  if (!iso) return { formatted: '25 mins', minutes: 25 };
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const match = iso.match(regex);
  if (!match) return { formatted: '25 mins', minutes: 25 };
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  const totalMinutes = Math.max(1, hours * 60 + minutes + (seconds > 30 ? 1 : 0));
  if (hours > 0) {
    return {
      formatted: `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim(),
      minutes: totalMinutes,
    };
  }
  return {
    formatted: `${minutes || 1} min${minutes === 1 ? '' : 's'}`,
    minutes: totalMinutes,
  };
}

// 2. YouTube Video Search Proxy
app.get('/api/youtube/search', async (req, res) => {
  const apiKey = getYouTubeKey(req);
  if (!apiKey) {
    return res.status(200).json({
      items: [],
      error: 'YouTube Data API key is not configured on the server. Please add YOUTUBE_API_KEY to environment secrets.',
    });
  }

  const queryStr = String(req.query.q || '').trim();
  if (!queryStr) {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }

  const maxResults = Math.min(25, parseInt(String(req.query.maxResults || '12'), 10) || 12);
  const region = String(req.query.regionCode || 'US');
  const lang = String(req.query.relevanceLanguage || 'en');

  try {
    const q = encodeURIComponent(queryStr);
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&q=${q}&maxResults=${maxResults}&relevanceLanguage=${lang}&regionCode=${region}&key=${apiKey}`;

    const fetchRes = await fetch(searchUrl);
    if (!fetchRes.ok) {
      const errData = await fetchRes.json().catch(() => ({}));
      return res.status(fetchRes.status).json({
        items: [],
        error: (errData as any)?.error?.message || `YouTube API error: ${fetchRes.statusText}`,
      });
    }

    const data: any = await fetchRes.json();
    const searchItems = data.items || [];
    if (searchItems.length === 0) {
      return res.json({ items: [] });
    }

    const videoIds = searchItems
      .map((item: any) => item.id?.videoId)
      .filter((id: any): id is string => Boolean(id));

    let detailsMap: Record<string, { duration: string; durationMinutes: number; embeddable: boolean }> = {};
    if (videoIds.length > 0) {
      try {
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,status&id=${videoIds.join(',')}&key=${apiKey}`;
        const detRes = await fetch(detailsUrl);
        if (detRes.ok) {
          const detData: any = await detRes.json();
          (detData.items || []).forEach((item: any) => {
            const parsed = parseISODuration(item.contentDetails?.duration);
            detailsMap[item.id] = {
              duration: parsed.formatted,
              durationMinutes: parsed.minutes,
              embeddable: item.status?.embeddable !== false,
            };
          });
        }
      } catch (e) {
        console.warn('Notice fetching video details:', e);
      }
    }

    const items = searchItems.map((item: any) => {
      const videoId = item.id?.videoId;
      const details = detailsMap[videoId] || { duration: '25 mins', durationMinutes: 25, embeddable: true };
      return {
        id: videoId,
        type: 'video',
        title: item.snippet?.title || 'Lecture Video',
        description: item.snippet?.description || '',
        thumbnailUrl:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          '',
        channelTitle: item.snippet?.channelTitle || 'Educational Channel',
        channelId: item.snippet?.channelId,
        publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
        url: `https://www.youtube.com/watch?v=${videoId}`,
        duration: details.duration,
        durationMinutes: details.durationMinutes,
        embeddable: details.embeddable,
      };
    });

    return res.json({ items });
  } catch (err: any) {
    console.error('Server YouTube search error:', err);
    return res.status(500).json({ items: [], error: err?.message || 'Server error searching YouTube.' });
  }
});

// 3. YouTube Playlist Search Proxy
app.get('/api/youtube/playlists', async (req, res) => {
  const apiKey = getYouTubeKey(req);
  if (!apiKey) {
    return res.status(200).json({
      items: [],
      error: 'YouTube Data API key is not configured on the server.',
    });
  }

  const queryStr = String(req.query.q || '').trim();
  const maxResults = Math.min(20, parseInt(String(req.query.maxResults || '10'), 10) || 10);

  try {
    const q = encodeURIComponent(queryStr);
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=playlist&q=${q}&maxResults=${maxResults}&relevanceLanguage=en&key=${apiKey}`;

    const fetchRes = await fetch(searchUrl);
    if (!fetchRes.ok) {
      const errData: any = await fetchRes.json().catch(() => ({}));
      return res.status(fetchRes.status).json({
        items: [],
        error: errData?.error?.message || `YouTube API error: ${fetchRes.statusText}`,
      });
    }

    const data: any = await fetchRes.json();
    const searchItems = data.items || [];
    if (searchItems.length === 0) {
      return res.json({ items: [] });
    }

    const playlistIds = searchItems
      .map((item: any) => item.id?.playlistId)
      .filter((id: any): id is string => Boolean(id));

    let countMap: Record<string, number> = {};
    if (playlistIds.length > 0) {
      try {
        const detailsUrl = `https://www.googleapis.com/youtube/v3/playlists?part=contentDetails&id=${playlistIds.join(',')}&key=${apiKey}`;
        const detRes = await fetch(detailsUrl);
        if (detRes.ok) {
          const detData: any = await detRes.json();
          (detData.items || []).forEach((p: any) => {
            countMap[p.id] = p.contentDetails?.itemCount || 0;
          });
        }
      } catch (e) {
        console.warn('Notice fetching playlist details:', e);
      }
    }

    const items = searchItems.map((item: any) => {
      const playlistId = item.id?.playlistId;
      return {
        id: playlistId,
        type: 'playlist',
        title: item.snippet?.title || 'Course Playlist',
        description: item.snippet?.description || '',
        thumbnailUrl:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          '',
        channelTitle: item.snippet?.channelTitle || 'Educational Channel',
        channelId: item.snippet?.channelId,
        publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
        url: `https://www.youtube.com/playlist?list=${playlistId}`,
        itemCount: countMap[playlistId] || 10,
        embeddable: true,
      };
    });

    return res.json({ items });
  } catch (err: any) {
    console.error('Server YouTube playlists error:', err);
    return res.status(500).json({ items: [], error: err?.message || 'Server error searching playlists.' });
  }
});

// 4. YouTube Playlist Items Proxy
app.get('/api/youtube/playlist-items', async (req, res) => {
  const apiKey = getYouTubeKey(req);
  if (!apiKey) {
    return res.status(200).json({ items: [], error: 'YouTube API key not configured.' });
  }

  const playlistId = String(req.query.playlistId || '').trim();
  if (!playlistId) {
    return res.status(400).json({ error: 'Parameter "playlistId" is required.' });
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails,status&playlistId=${encodeURIComponent(
      playlistId
    )}&maxResults=50&key=${apiKey}`;

    const fetchRes = await fetch(url);
    if (!fetchRes.ok) {
      const errData: any = await fetchRes.json().catch(() => ({}));
      return res.status(fetchRes.status).json({
        items: [],
        error: errData?.error?.message || `YouTube API error: ${fetchRes.statusText}`,
      });
    }

    const data: any = await fetchRes.json();
    const rawItems = data.items || [];
    const validItems = rawItems.filter(
      (item: any) =>
        item.status?.privacyStatus !== 'private' &&
        item.snippet?.title !== 'Deleted video' &&
        item.snippet?.title !== 'Private video' &&
        item.contentDetails?.videoId
    );

    const items = validItems.map((item: any, idx: number) => ({
      videoId: item.contentDetails?.videoId,
      title: item.snippet?.title || `Lesson ${idx + 1}`,
      description: item.snippet?.description || '',
      position: item.snippet?.position || idx,
      thumbnailUrl:
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url ||
        '',
      videoUrl: `https://www.youtube.com/watch?v=${item.contentDetails?.videoId}`,
    }));

    return res.json({ items });
  } catch (err: any) {
    console.error('Server playlist items error:', err);
    return res.status(500).json({ items: [], error: err?.message || 'Server error loading playlist items.' });
  }
});

// 5. Server-Side AI Tutor / Doubt Solver (Gemini API)
app.post('/api/ai/ask', async (req, res) => {
  const { question, courseTitle, lessonTitle, studentName } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question is required.' });
  }

  const ai = getGenAI();
  if (!ai) {
    return res.json({
      answer: `Hello ${studentName || 'Student'}! The AI Tutor is ready. To enable live answers from Gemini, please ensure your GEMINI_API_KEY is configured in the AI Studio Settings / Secrets panel. Meanwhile, feel free to review the lesson notes, practice code snippets, and attempt the 50-MCQ assessment.`,
      isFallback: true,
    });
  }

  try {
    const prompt = `You are the Expert AI Academic Tutor for "Atif Skills Hub", an elite online academy founded by Atif Hussain.
A student is currently studying:
- Course: ${courseTitle || 'Data Science & Artificial Intelligence'}
- Current Topic / Lesson: ${lessonTitle || 'Core Concepts'}
- Student Name: ${studentName || 'Student'}

Student's Question:
"${question.trim()}"

Provide a clear, pedagogically sound, encouraging, and structured explanation:
1. Direct, conceptual answer.
2. If applicable, provide clean, commented Python / SQL / code snippet or practical example.
3. Key takeaway or best practice to remember for the 50-MCQ certification assessment.
Keep the explanation focused, professional, and accessible.`;

    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      responseText = response.text || '';
    } catch (primaryErr: any) {
      console.warn('Notice from primary model gemini-3.8-flash, trying fallback gemini-3.1-flash-lite:', primaryErr?.message);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
      });
      responseText = fallbackResponse.text || '';
    }

    const answer = responseText || 'I have analyzed your question. Please refer to the lesson code and notes.';
    return res.json({ answer, isFallback: false });
  } catch (err: any) {
    console.error('Gemini AI Tutor error:', err);
    return res.json({
      answer: `We encountered a temporary issue contacting the AI reasoning engine: ${err?.message || 'Unknown error'}. Please review your lesson notes or try again shortly.`,
      isFallback: true,
    });
  }
});

// -------------------------------------------------------------
// Dev vs Production Server Setup
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Determine path to dist directory across container environments
    const distPath = fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'))
      ? path.join(process.cwd(), 'dist')
      : fs.existsSync(path.join(__dirname, 'index.html'))
      ? __dirname
      : path.resolve(__dirname, '..', 'dist');

    console.log(`[Production] Serving static files from: ${distPath}`);
    app.use(express.static(distPath));

    app.get('*', (_req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(500).send('Application build artifact not found. Please verify build completed.');
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT} (ENV: ${process.env.NODE_ENV || 'development'})`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server gracefully');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server gracefully');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting application server:', err);
  process.exit(1);
});
