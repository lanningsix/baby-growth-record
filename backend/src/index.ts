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
app.use('/*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'X-Family-ID'],
  allowMethods: ['POST', 'GET', 'OPTIONS']
}));

// Middleware to extract familyId
const getFamilyId = (c: any) => {
  const familyId = c.req.header('X-Family-ID');
  return familyId;
};

// --- Family / Profile Routes ---

// Create a new family (generates ID)
app.post('/api/family', async (c) => {
  const { name } = await c.req.json();
  const familyId = crypto.randomUUID();
  
  // Create initial profile entry
  await c.env.DB.prepare(`
    INSERT INTO profiles (id, name, birth_date, current_height, current_weight)
    VALUES (?, ?, ?, ?, ?)
  `).bind(familyId, name, new Date().toISOString(), 50, 3.5).run();

  return c.json({ familyId, name });
});

app.get('/api/profile', async (c) => {
  const familyId = getFamilyId(c);
  if (!familyId) return c.json({ error: 'Family ID required' }, 400);

  const profile = await c.env.DB.prepare('SELECT * FROM profiles WHERE id = ?').bind(familyId).first();
  
  if (!profile) {
    return c.json({ error: 'Profile not found' }, 404);
  }
  
  return c.json(profile);
});

// --- Timeline Routes ---

app.get('/api/timeline', async (c) => {
  const familyId = getFamilyId(c);
  if (!familyId) return c.json({ error: 'Family ID required' }, 400);

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM events WHERE family_id = ? ORDER BY date DESC'
  ).bind(familyId).all();
  
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
    const familyId = getFamilyId(c);
    if (!familyId) return c.json({ error: 'Family ID required' }, 400);

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
            WHERE id = ?
         `).bind(height, weight, familyId).run();
      }
    }

    // Insert Event with family_id
    await c.env.DB.prepare(`
      INSERT INTO events (id, family_id, type, date, title, description, media_url, height, weight, author, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, familyId, type, date, title, description, mediaUrl, height, weight, author, '[]'
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