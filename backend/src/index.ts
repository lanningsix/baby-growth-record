import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Define fallback types for Cloudflare Bindings if global types are missing
type D1Database = any;
type R2Bucket = any;

type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
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
      
      // Construct public URL (Assuming Worker is also serving or R2 is public)
      // For this setup, we will return a worker proxy URL or public R2 dev URL
      // Here we assume the Worker handles retrieving it or a custom domain is set up
      // To keep it simple, we'll store the filename and let the frontend request it via a proxy endpoint or assume a public bucket domain.
      // NOTE: You need to connect a custom domain to your R2 bucket or make it public for direct access.
      // For this demo, we assume public access is enabled on the bucket at a specific domain, OR we serve it via this worker.
      // Let's use a placeholder logic that appends the worker url if needed, but here we store relative path.
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