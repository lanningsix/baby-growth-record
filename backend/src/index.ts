import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { GoogleGenAI } from '@google/genai';

// Define fallback types for Cloudflare Bindings if global types are missing
type D1Database = any;
type R2Bucket = any;

type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for frontend access
app.use('/*', cors());

// --- Profile Routes ---

app.get('/api/profile', async (c) => {
  // For this MVP, we assume a single profile with ID 'default'
  const profile = await c.env.DB.prepare('SELECT * FROM profiles WHERE id = ?').bind('default').first();
  
  if (!profile) {
    return c.json({ error: 'Profile not found' }, 404);
  }
  
  return c.json(profile);
});

// --- Timeline Routes ---

app.get('/api/timeline', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM events ORDER BY date DESC'
  ).all();
  
  // Transform snake_case DB columns to camelCase for frontend
  const events = results.map((r: any) => ({
    id: r.id,
    type: r.type,
    date: r.date,
    title: r.title,
    description: r.description,
    mediaUrl: r.media_url,
    growthData: (r.height || r.weight) ? { height: r.height, weight: r.weight } : undefined,
    tags: r.tags ? JSON.parse(r.tags) : [],
    author: r.author
  }));

  return c.json(events);
});

app.post('/api/timeline', async (c) => {
  try {
    const body = await c.req.parseBody();
    
    const id = crypto.randomUUID();
    const type = body['type'] as string;
    const date = body['date'] as string;
    const title = body['title'] as string || '';
    const description = body['description'] as string || '';
    const author = body['author'] as string || 'Mom';
    
    let mediaUrl = null;
    let height = null;
    let weight = null;

    // Handle File Upload (R2)
    const file = body['file'];
    if (file && file instanceof File) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      
      // Put object into R2
      await c.env.BUCKET.put(fileName, file);
      
      // Construct relative URL to be served via proxy
      mediaUrl = `/api/media/${fileName}`; 
    }

    // Handle Growth Data
    if (type === 'GROWTH') {
      height = body['height'] ? parseFloat(body['height'] as string) : null;
      weight = body['weight'] ? parseFloat(body['weight'] as string) : null;

      // Update Profile stats
      if (height || weight) {
         await c.env.DB.prepare(`
            UPDATE profiles 
            SET current_height = COALESCE(?, current_height), 
                current_weight = COALESCE(?, current_weight) 
            WHERE id = 'default'
         `).bind(height, weight).run();
      }
    }

    // Insert Event
    await c.env.DB.prepare(`
      INSERT INTO events (id, type, date, title, description, media_url, height, weight, author, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, type, date, title, description, mediaUrl, height, weight, author, '[]'
    ).run();

    return c.json({ success: true, id, mediaUrl });

  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// --- AI Routes ---

app.post('/api/ai/journal', async (c) => {
  try {
    const { imageBase64, context } = await c.req.json();
    const apiKey = c.env.GEMINI_API_KEY;
    
    if (!apiKey) return c.json({ text: "AI service currently unavailable." });

    const ai = new GoogleGenAI({ apiKey });
    const parts: any[] = [];

    if (imageBase64) {
      // Remove data:image/jpeg;base64, prefix if present
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      });
    }

    const promptText = `
      You are a warm, loving assistant helping a parent write a baby journal.
      Context provided by parent: "${context || ''}".
      ${imageBase64 ? "Please describe the photo and the moment cheerfully." : ""}
      Write a short, sentimental, and cute journal entry (max 3 sentences).
      Tone: Emotional, Happy, Cherishing.
    `;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
    });

    return c.json({ text: response.text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return c.json({ text: "Could not generate entry." });
  }
});

app.post('/api/ai/milestones', async (c) => {
  try {
    const { ageInMonths } = await c.req.json();
    const apiKey = c.env.GEMINI_API_KEY;
    
    if (!apiKey) return c.json({ text: "" });

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `My baby is ${ageInMonths} months old. What are 3 key developmental milestones I should look out for right now? Keep it brief and bulleted. Return as Markdown.`,
    });

    return c.json({ text: response.text });
  } catch (error) {
    return c.json({ text: "" });
  }
});

// --- Media Proxy Route (If R2 is not public) ---
app.get('/api/media/:key', async (c) => {
    const key = c.req.param('key');
    const object = await c.env.BUCKET.get(key);

    if (!object) {
        return c.text('Object Not Found', 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);

    return new Response(object.body, {
        headers,
    });
});

export default app;