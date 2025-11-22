import { TimelineEvent, BabyProfile } from '../types';

// TODO: Replace this with your actual deployed Worker URL after running 'npx wrangler deploy'
// e.g., "https://littlesteps-backend.yourname.workers.dev"
const API_BASE_URL = "http://localhost:8787"; 

export const getTimeline = async (): Promise<TimelineEvent[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/timeline`);
    if (!res.ok) throw new Error('Failed to fetch timeline');
    const data = await res.json();
    
    // Ensure media URLs are absolute if served via proxy
    return data.map((event: any) => ({
        ...event,
        mediaUrl: event.mediaUrl ? (event.mediaUrl.startsWith('http') ? event.mediaUrl : `${API_BASE_URL}${event.mediaUrl}`) : undefined
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getProfile = async (): Promise<BabyProfile | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/profile`);
    if (!res.ok) throw new Error('Failed to fetch profile');
    const data = await res.json();
    
    return {
        name: data.name,
        birthDate: data.birth_date,
        photoUrl: data.photo_url,
        currentHeight: data.current_height,
        currentWeight: data.current_weight
    };
  } catch (error) {
    console.error(error);
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

  // The file object is passed differently from the UI now, we need to handle the file object
  if (record.file) {
      formData.append('file', record.file);
  }

  const res = await fetch(`${API_BASE_URL}/api/timeline`, {
      method: 'POST',
      body: formData
  });

  if (!res.ok) throw new Error('Failed to save record');
  const result = await res.json();

  // Return a constructed event object to update UI immediately without refetching
  return {
      id: result.id,
      ...record,
      mediaUrl: result.mediaUrl ? `${API_BASE_URL}${result.mediaUrl}` : undefined
  } as TimelineEvent;
};

// This function is now deprecated as the upload happens inside addRecord via FormData
// Keeping it for interface compatibility but it won't be used directly by the modal in the same way
export const uploadMediaToR2 = async (file: File): Promise<string> => {
  // In the new flow, we pass the File object to addRecord
  // This return value is just a placeholder for the UI state
  return "PENDING_UPLOAD"; 
};