import { TimelineEvent, BabyProfile } from '../types';

const API_BASE_URL = "https://littlesteps-backend.dundun.uno";

// Helper to get headers with Family ID
const getHeaders = (multipart = false) => {
  const headers: HeadersInit = {
    'X-Family-ID': localStorage.getItem('familyId') || ''
  };
  if (!multipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

export const createFamily = async (name: string): Promise<{ familyId: string; name: string }> => {
  const res = await fetch(`${API_BASE_URL}/api/family`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error('Failed to create family');
  return await res.json();
};

export const getTimeline = async (): Promise<TimelineEvent[]> => {
  const res = await fetch(`${API_BASE_URL}/api/timeline`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch timeline');
  const data = await res.json();
  
  // Ensure media URLs are absolute
  return data.map((event: any) => ({
      ...event,
      mediaUrl: event.mediaUrl ? (event.mediaUrl.startsWith('http') ? event.mediaUrl : `${API_BASE_URL}${event.mediaUrl}`) : undefined
  }));
};

export const getProfile = async (): Promise<BabyProfile | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/profile`, {
      headers: getHeaders()
    });
    if (!res.ok) return null;
    const data = await res.json();
    
    return {
        name: data.name,
        birthDate: data.birth_date,
        photoUrl: data.photo_url,
        currentHeight: data.current_height,
        currentWeight: data.current_weight
    };
  } catch (error) {
    console.error("Failed to fetch profile", error);
    return null;
  }
};

export const addRecord = async (record: any): Promise<TimelineEvent> => {
  const formData = new FormData();
  
  formData.append('type', record.type);
  formData.append('date', record.date);
  if (record.title) formData.append('title', record.title);
  if (record.description) formData.append('description', record.description);
  formData.append('author', record.author || 'Mom');
  
  if (record.growthData) {
      if (record.growthData.height) formData.append('height', record.growthData.height.toString());
      if (record.growthData.weight) formData.append('weight', record.growthData.weight.toString());
  }

  if (record.file) {
      formData.append('file', record.file);
  }

  const res = await fetch(`${API_BASE_URL}/api/timeline`, {
      method: 'POST',
      headers: getHeaders(true), // multipart/form-data needs no Content-Type header (browser sets it)
      body: formData
  });

  if (!res.ok) throw new Error('Failed to save record');
  const result = await res.json();

  return {
      id: result.id,
      ...record,
      mediaUrl: result.mediaUrl ? (result.mediaUrl.startsWith('http') ? result.mediaUrl : `${API_BASE_URL}${result.mediaUrl}`) : undefined
  } as TimelineEvent;
};

export const generateJournalEntry = async (
  imageBase64: string | undefined,
  context: string
): Promise<string> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/ai/journal`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ imageBase64, context })
    });
    
    if (!res.ok) return "Could not generate entry.";
    const data = await res.json();
    return data.text || "Could not generate entry.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Start writing your memory here...";
  }
};

export const getMilestoneAdvice = async (ageInMonths: number): Promise<string> => {
  try {
      const res = await fetch(`${API_BASE_URL}/api/ai/milestones`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ageInMonths })
      });
      if (!res.ok) return "";
      const data = await res.json();
      return data.text || "";
  } catch (error) {
      return "";
  }
}