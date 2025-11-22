import React from 'react';
import { TimelineEvent, RecordType } from '../types';
import { Ruler, Scale, Trophy, Camera, StickyNote, User, Calendar as CalendarIcon } from 'lucide-react';

interface Props {
  event: TimelineEvent;
  onImageClick?: (eventId: string) => void;
}

const TimelineItem: React.FC<Props> = ({ event, onImageClick }) => {
  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const getIcon = () => {
    switch (event.type) {
      case RecordType.GROWTH: return <Scale className="w-5 h-5 text-blue-500" />;
      case RecordType.MILESTONE: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case RecordType.PHOTO: return <Camera className="w-5 h-5 text-pink-500" />;
      default: return <StickyNote className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="relative pl-8 pb-8 border-l-2 border-pink-200 last:border-0 last:pb-0">
      {/* Dot on timeline */}
      <div className="absolute -left-[9px] top-0 bg-white p-1 rounded-full border border-pink-200 shadow-sm z-10">
        {getIcon()}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 transition-transform active:scale-[0.99]">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-pink-500 bg-pink-50 px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                    <CalendarIcon size={10} /> {dateStr}
                </span>
                <span className="text-[10px] text-gray-400">{timeStr}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800">{event.title || (event.type === 'PHOTO' ? 'Photo Memory' : event.type)}</h3>
          </div>
          {event.growthData && (
             <div className="flex gap-2 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg shrink-0">
                {event.growthData.height && <span className="flex items-center gap-1"><Ruler size={12}/> {event.growthData.height}cm</span>}
                {event.growthData.weight && <span className="flex items-center gap-1"><Scale size={12}/> {event.growthData.weight}kg</span>}
             </div>
          )}
        </div>

        {event.mediaUrl && (
          <div 
            className="mb-3 rounded-xl overflow-hidden shadow-inner cursor-pointer group relative"
            onClick={() => onImageClick && onImageClick(event.id)}
          >
            <img 
                src={event.mediaUrl} 
                alt="Memory" 
                className="w-full h-auto object-cover max-h-80 group-hover:scale-105 transition-transform duration-500" 
                loading="lazy" 
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                 <div className="opacity-0 group-hover:opacity-100 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm transition-opacity">
                     Tap to view
                 </div>
            </div>
          </div>
        )}

        {event.description && (
          <p className="text-gray-600 text-sm leading-relaxed mb-3 whitespace-pre-wrap">
            {event.description}
          </p>
        )}

        <div className="flex items-center justify-between border-t pt-2 border-gray-100">
           <div className="flex items-center gap-1 text-xs text-gray-400">
             <User size={12} />
             <span>Added by {event.author}</span>
           </div>
           {event.tags && event.tags.length > 0 && (
             <div className="flex gap-1">
               {event.tags.map((tag, i) => (
                 <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">#{tag}</span>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default TimelineItem;