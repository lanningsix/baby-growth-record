import React from 'react';
import { TimelineEvent, RecordType } from '../types';
import { Ruler, Scale, Trophy, Camera, StickyNote, User } from 'lucide-react';
import { useTranslation } from '../i18n';
import { ImageViewer, Image } from 'antd-mobile';

interface Props {
  event: TimelineEvent;
  onImageClick?: (eventId: string) => void;
}

const TimelineItem: React.FC<Props> = ({ event }) => {
  const { t, locale } = useTranslation();
  
  const dateObj = new Date(event.date);
  
  const getDateLabel = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const eventDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

      if (eventDate.getTime() === today.getTime()) return t('timeline.today');
      if (eventDate.getTime() === yesterday.getTime()) return t('timeline.yesterday');

      return dateObj.toLocaleDateString(locale, {
          month: 'short',
          day: 'numeric'
      });
  };

  const getIcon = () => {
    switch (event.type) {
      case RecordType.GROWTH: return <Scale className="w-5 h-5 text-blue-500" />;
      case RecordType.MILESTONE: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case RecordType.PHOTO: return <Camera className="w-5 h-5 text-pink-500" />;
      default: return <StickyNote className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="relative pl-8 border-l-2 border-pink-200 last:border-0">
      {/* Dot on timeline */}
      <div className="absolute -left-[9px] top-0 bg-white p-1 rounded-full border border-pink-200 shadow-sm z-10">
        {getIcon()}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-pink-500 bg-pink-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {getDateLabel()}
                </span>
                <span className="text-[10px] text-gray-400">
                    {dateObj.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
            <h3 className="text-lg font-bold text-gray-800">{event.title || (event.type === 'PHOTO' ? t('timeline.photo_memory') : event.type)}</h3>
          </div>
          {event.growthData && (
             <div className="flex gap-2 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg shrink-0">
                {event.growthData.height && <span className="flex items-center gap-1"><Ruler size={12}/> {event.growthData.height}cm</span>}
                {event.growthData.weight && <span className="flex items-center gap-1"><Scale size={12}/> {event.growthData.weight}kg</span>}
             </div>
          )}
        </div>

        {event.mediaUrl && (
          <div className="mb-3 rounded-xl overflow-hidden shadow-inner bg-gray-50">
             <Image 
                src={event.mediaUrl} 
                height={200} 
                fit='cover'
                onClick={() => {
                    ImageViewer.Multi.show({ images: [event.mediaUrl || ''] });
                }}
             />
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
             <span>{t('timeline.added_by')} {event.author}</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineItem;