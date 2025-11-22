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

export const createFamily = async (data: { babyName: string; birthDate: string; gender: string }): Promise<{ familyId: string; name: string }> => {
  const res = await fetch(`${API_BASE_URL}/api/family`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create family');
  return await res.json();
};

export const updateProfile = async (data: Partial<BabyProfile>): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/api/profile`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update profile');
};

export const uploadAvatar = async (file: File): Promise<{ photoUrl: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/api/profile/avatar`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
  });

  if (!res.ok) throw new Error('Failed to upload avatar');
  return await res.json();
};

export const getTimeline = async (
  page = 1, 
  limit = 10, 
  filters?: { year?: string; month?: string; day?: string }
): Promise<TimelineEvent[]> => {
  
  const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
  });

  if (filters) {
      if (filters.year) params.append('year', filters.year);
      if (filters.month) params.append('month', filters.month);
      if (filters.day) params.append('day', filters.day);
  }

  const res = await fetch(`${API_BASE_URL}/api/timeline?${params.toString()}`, {
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
        gender: data.gender,
        photo_url: data.photo_url,
        photoUrl: data.photo_url ? (data.photo_url.startsWith('http') ? data.photo_url : `${API_BASE_URL}${data.photo_url}`) : undefined, 
        currentHeight: data.current_height,
        currentWeight: data.current_weight
    } as BabyProfile;
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
  context: string,
  lang: string = 'en'
): Promise<string> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/ai/journal`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ imageBase64, context, lang })
    });
    
    if (!res.ok) return "Could not generate entry.";
    const data = await res.json();
    return data.text || "Could not generate entry.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Start writing your memory here...";
  }
};

export const getMilestoneAdvice = async (ageInMonths: number, lang: string = 'en'): Promise<string> => {
  try {
      const res = await fetch(`${API_BASE_URL}/api/ai/milestones`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ageInMonths, lang })
      });
      if (!res.ok) return "";
      const data = await res.json();
      return data.text || "";
  } catch (error) {
      return "";
  }
}