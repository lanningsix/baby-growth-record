import React, { useState, useRef } from 'react';
import { RecordType } from '../types';
import { generateJournalEntry } from '../services/api';
import { X, Loader2, Sparkles, Image as ImageIcon, Calendar } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  authorName: string;
}

const AddRecordModal: React.FC<Props> = ({ isOpen, onClose, onSave, authorName }) => {
  const [activeTab, setActiveTab] = useState<RecordType>(RecordType.PHOTO);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
      reader.readAsDataURL(f);
    }
  };

  const handleMagicCompose = async () => {
    setIsGenerating(true);
    // Mock a context if empty
    const ctx = description || "A beautiful day with my baby";
    const text = await generateJournalEntry(previewUrl || undefined, ctx);
    setDescription(text);
    setIsGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload: any = {
      type: activeTab,
      date: new Date(date).toISOString(),
      title,
      description,
      file: file, // Pass the raw file to the service
      author: authorName || 'Family Member'
    };

    if (activeTab === RecordType.GROWTH) {
      payload.growthData = {
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
      };
      payload.title = "Growth Update";
    }

    try {
      await onSave(payload);
      // Reset form
      setTitle('');
      setDescription('');
      setFile(null);
      setPreviewUrl(null);
      setHeight('');
      setWeight('');
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save. Please ensure backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">New Memory</h2>
            <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
            {[RecordType.PHOTO, RecordType.GROWTH, RecordType.MILESTONE].map((type) => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition whitespace-nowrap ${
                  activeTab === type
                    ? 'bg-pink-500 text-white shadow-lg shadow-pink-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {type === RecordType.PHOTO ? 'Photo/Video' : type === RecordType.GROWTH ? 'Measurements' : 'Milestone'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
               <div className="relative">
                   <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-pink-200 outline-none text-gray-700 pl-10"
                   />
                   <Calendar className="absolute left-3 top-3.5 text-gray-400" size={18}/>
               </div>
            </div>

            {activeTab === RecordType.GROWTH && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-pink-200 outline-none"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-pink-200 outline-none"
                    placeholder="0.0"
                  />
                </div>
              </div>
            )}

            {(activeTab === RecordType.PHOTO || activeTab === RecordType.MILESTONE) && (
              <>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-pink-200 outline-none"
                        placeholder="e.g., First steps at the park"
                    />
                </div>

                {/* Media Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Photo / Video</label>
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        ref={fileInputRef}
                        className="hidden"
                    />
                    
                    {!previewUrl ? (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition text-gray-400 gap-2"
                        >
                            <ImageIcon size={24} />
                            <span className="text-sm">Tap to upload photo</span>
                        </div>
                    ) : (
                        <div className="relative w-full h-48 rounded-xl overflow-hidden group">
                            <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                            <button 
                                type="button"
                                onClick={() => { setFile(null); setPreviewUrl(null); }}
                                className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full shadow-sm hover:bg-white"
                            >
                                <X size={16} className="text-red-500"/>
                            </button>
                        </div>
                    )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Journal Entry</label>
                    <button 
                        type="button"
                        onClick={handleMagicCompose}
                        disabled={isGenerating}
                        className="text-xs flex items-center gap-1 text-purple-600 font-bold bg-purple-50 px-2 py-1 rounded-lg hover:bg-purple-100 transition"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" size={12}/> : <Sparkles size={12}/>}
                        AI Magic Write
                    </button>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-pink-200 outline-none min-h-[100px] text-sm"
                    placeholder="Describe this moment..."
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-2">
               <span>Posting as: </span>
               <span className="font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">{authorName}</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="animate-spin" />}
              Save Memory
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddRecordModal;