import React from 'react';
import { TimelineEvent, RecordType } from '../types';
import { Ruler, Scale, Trophy, Camera, StickyNote, User, Clock } from 'lucide-react';
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

  const getThemeColor = () => {
    switch (event.type) {
      case RecordType.GROWTH: return 'bg-blue-50 text-blue-500 border-blue-100';
      case RecordType.MILESTONE: return 'bg-amber-50 text-amber-500 border-amber-100';
      case RecordType.PHOTO: return 'bg-rose-50 text-rose-500 border-rose-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const getIcon = () => {
    switch (event.type) {
      case RecordType.GROWTH: return <Scale size={14} strokeWidth={2.5} />;
      case RecordType.MILESTONE: return <Trophy size={14} strokeWidth={2.5} />;
      case RecordType.PHOTO: return <Camera size={14} strokeWidth={2.5} />;
      default: return <StickyNote size={14} strokeWidth={2.5} />;
    }
  };

  return (
    <div className="flex gap-5 animate-fade-in relative">
      {/* Vertical Connector Line */}
      <div className="absolute left-[27px] top-10 bottom-0 w-[2px] bg-slate-100 -z-10 rounded-full"></div>

      {/* Timeline Left Side */}
      <div className="flex flex-col items-center shrink-0 w-14 pt-1">
         <div className="text-[10px] font-extrabold text-slate-400 mb-2 uppercase tracking-wider text-center w-full leading-none">
             {getDateLabel()}
         </div>
         <div className={`w-9 h-9 rounded-full flex items-center justify-center border-[3px] shadow-sm z-10 bg-white ${event.type === RecordType.PHOTO ? 'border-rose-100 text-rose-500' : event.type === RecordType.GROWTH ? 'border-blue-100 text-blue-500' : event.type === RecordType.MILESTONE ? 'border-amber-100 text-amber-500' : 'border-slate-100 text-slate-400'}`}>
            {getIcon()}
         </div>
      </div>

      {/* Card Content */}
      <div className="flex-1 min-w-0 pb-8">
        <div className="bg-white rounded-[24px] shadow-[0_8px_20px_-6px_rgba(0,0,0,0.03)] border border-slate-50 overflow-hidden hover:shadow-md transition-shadow duration-300 group">
            
            {/* Media Header */}
            {event.mediaUrl && (
                <div className="relative bg-slate-50 cursor-pointer overflow-hidden" onClick={() => ImageViewer.Multi.show({ images: [event.mediaUrl || ''] })}>
                    <Image 
                        src={event.mediaUrl} 
                        height={240} 
                        fit='cover'
                        className="w-full transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
            )}

            <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                    <div className="w-full">
                        <div className="flex items-center gap-2 mb-1.5">
                             <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <Clock size={10} />
                                {dateObj.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                             </div>
                        </div>
                        
                        {(event.title || event.type !== 'PHOTO') && (
                            <h3 className="text-lg font-extrabold text-slate-800 leading-tight mb-1">
                                {event.title || t('timeline.photo_memory')}
                            </h3>
                        )}
                    </div>
                </div>

                {event.description && (
                    <p className="text-slate-600 text-[15px] leading-relaxed mb-4 whitespace-pre-wrap font-medium">
                        {event.description}
                    </p>
                )}

                {/* Growth Tags */}
                {event.growthData && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {event.growthData.height && (
                            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-100">
                                <Ruler size={12} /> {event.growthData.height} cm
                            </span>
                        )}
                        {event.growthData.weight && (
                            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-xs font-bold border border-indigo-100">
                                <Scale size={12} /> {event.growthData.weight} kg
                            </span>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-inner">
                            <User size={12} className="text-slate-500"/>
                        </div>
                        <span className="text-xs font-bold text-slate-400">{event.author}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineItem;