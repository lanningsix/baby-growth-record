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
  allowMethods: ['POST', 'GET', 'PUT', 'OPTIONS']
}));

// Middleware to extract familyId
const getFamilyId = (c: any) => {
  const familyId = c.req.header('X-Family-ID');
  return familyId;
};

// --- Family / Profile Routes ---

// Create a new family (generates ID)
app.post('/api/family', async (c) => {
  const { babyName, birthDate, gender } = await c.req.json();
  const familyId = crypto.randomUUID();
  
  // Create initial profile entry
  await c.env.DB.prepare(`
    INSERT INTO profiles (id, name, birth_date, gender, current_height, current_weight)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    familyId, 
    babyName || "Baby", 
    birthDate || new Date().toISOString(), 
    gender || 'other',
    50, 
    3.5
  ).run();

  return c.json({ familyId, name: babyName });
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

app.put('/api/profile', async (c) => {
  const familyId = getFamilyId(c);
  if (!familyId) return c.json({ error: 'Family ID required' }, 400);

  const { name, birthDate, gender, currentHeight, currentWeight } = await c.req.json();

  // Build dynamic update query
  const updates: string[] = [];
  const values: any[] = [];

  if (name) { updates.push("name = ?"); values.push(name); }
  if (birthDate) { updates.push("birth_date = ?"); values.push(birthDate); }
  if (gender) { updates.push("gender = ?"); values.push(gender); }
  if (currentHeight) { updates.push("current_height = ?"); values.push(currentHeight); }
  if (currentWeight) { updates.push("current_weight = ?"); values.push(currentWeight); }

  if (updates.length === 0) return c.json({ message: "No changes" });

  values.push(familyId); // For WHERE clause

  const query = `UPDATE profiles SET ${updates.join(', ')} WHERE id = ?`;
  
  await c.env.DB.prepare(query).bind(...values).run();

  return c.json({ success: true });
});

// --- Timeline Routes ---

app.get('/api/timeline', async (c) => {
  const familyId = getFamilyId(c);
  if (!familyId) return c.json({ error: 'Family ID required' }, 400);

  // Pagination and Filtering
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  const year = c.req.query('year');
  const month = c.req.query('month');
  const day = c.req.query('day');

  const offset = (page - 1) * limit;

  // Build Query
  const conditions = ['family_id = ?'];
  const params: any[] = [familyId];

  if (year && year !== 'all') {
    conditions.push("strftime('%Y', date) = ?");
    params.push(year);
  }
  if (month && month !== 'all') {
    conditions.push("strftime('%m', date) = ?");
    params.push(month.padStart(2, '0'));
  }
  if (day && day !== 'all') {
    conditions.push("strftime('%d', date) = ?");
    params.push(day.padStart(2, '0'));
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  
  const query = `SELECT * FROM events ${whereClause} ORDER BY date DESC LIMIT ? OFFSET ?`;
  
  // Bind params + limit/offset
  const finalParams = [...params, limit, offset];

  const { results } = await c.env.DB.prepare(query).bind(...finalParams).all();
  
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
      const uuid = crypto.randomUUID();

      // Organize by date folder (YYYY-MM-DD)
      // Expecting ISO string for date
      let dateFolder = 'misc';
      if (date && typeof date === 'string') {
        try {
            dateFolder = date.split('T')[0];
        } catch(e) {
            // fallback to misc if parse fails
        }
      }
      
      // Construct structured Key: familyId/date/uuid.ext
      const objectKey = `${familyId}/${dateFolder}/${uuid}.${fileExt}`;
      
      // Put object into R2
      await c.env.BUCKET.put(objectKey, file);
      
      // Construct relative URL to be served via proxy
      mediaUrl = `/api/media/${objectKey}`; 
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
    const { imageBase64, context, lang } = await c.req.json();
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

    // Determine language name for prompt
    let languageName = "English";
    if (lang === 'zh') languageName = "Chinese (Simplified)";
    if (lang === 'ja') languageName = "Japanese";
    if (lang === 'ko') languageName = "Korean";

    const promptText = `
      You are a warm, loving assistant helping a parent write a baby journal.
      Context provided by parent: "${context || ''}".
      ${imageBase64 ? "Please describe the photo and the moment cheerfully." : ""}
      Write a short, sentimental, and cute journal entry (max 3 sentences).
      Tone: Emotional, Happy, Cherishing.
      Language: Write strictly in ${languageName}.
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
    const { ageInMonths, lang } = await c.req.json();
    const apiKey = c.env.GEMINI_API_KEY;
    
    if (!apiKey) return c.json({ text: "" });

    // Determine language name for prompt
    let languageName = "English";
    if (lang === 'zh') languageName = "Chinese (Simplified)";
    if (lang === 'ja') languageName = "Japanese";
    if (lang === 'ko') languageName = "Korean";

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `My baby is ${ageInMonths} months old. What are 3 key developmental milestones I should look out for right now? Keep it brief and bulleted. Return as Markdown. Write in ${languageName} language.`,
    });

    return c.json({ text: response.text });
  } catch (error) {
    return c.json({ text: "" });
  }
});

// --- Media Proxy Route (If R2 is not public) ---
// Use wildcard to support nested paths (familyId/date/filename)
app.get('/api/media/*', async (c) => {
    // Extract the full path from the URL and remove the prefix
    const path = c.req.path; 
    const key = path.replace(/^\/api\/media\//, '');

    if (!key) {
        return c.text('Object Not Found', 404);
    }

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
