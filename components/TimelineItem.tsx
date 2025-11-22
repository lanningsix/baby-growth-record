import React from 'react';
import { TimelineEvent, RecordType } from '../types';
import { Ruler, Scale, Trophy, Camera, StickyNote, User } from 'lucide-react';

interface Props {
  event: TimelineEvent;
}

const TimelineItem: React.FC<Props> = ({ event }) => {
  const date = new Date(event.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

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
      <div className="absolute -left-[9px] top-0 bg-white p-1 rounded-full border border-pink-200 shadow-sm">
        {getIcon()}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 transition-transform active:scale-[0.99]">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-xs font-semibold text-pink-400 uppercase tracking-wider">{date}</span>
            <h3 className="text-lg font-bold text-gray-800">{event.title || event.type}</h3>
          </div>
          {event.growthData && (
             <div className="flex gap-2 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
                {event.growthData.height && <span className="flex items-center gap-1"><Ruler size={12}/> {event.growthData.height}cm</span>}
                {event.growthData.weight && <span className="flex items-center gap-1"><Scale size={12}/> {event.growthData.weight}kg</span>}
             </div>
          )}
        </div>

        {event.mediaUrl && (
          <div className="mb-3 rounded-xl overflow-hidden shadow-inner">
            <img src={event.mediaUrl} alt="Memory" className="w-full h-auto object-cover max-h-64" loading="lazy" />
          </div>
        )}

        {event.description && (
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            {event.description}
          </p>
        )}

        <div className="flex items-center justify-between border-t pt-2 border-gray-100">
           <div className="flex items-center gap-1 text-xs text-gray-400">
             <User size={12} />
             <span>Added by {event.author}</span>
           </div>
           {event.tags && (
             <div className="flex gap-1">
               {event.tags.map(tag => (
                 <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">#{tag}</span>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default TimelineItem;
