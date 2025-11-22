import React, { useEffect, useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { TimelineEvent } from '../types';
import { useTranslation } from '../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialEventId: string | null;
  events: TimelineEvent[];
}

const ImageViewer: React.FC<Props> = ({ isOpen, onClose, initialEventId, events }) => {
  const { t, locale } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Filter events that actually have images. 
  // Use useMemo to ensure stable reference for dependency arrays.
  const mediaEvents = useMemo(() => events.filter(e => !!e.mediaUrl), [events]);

  // Sync initial index when opening
  useEffect(() => {
    if (isOpen && initialEventId) {
      const index = mediaEvents.findIndex(e => e.id === initialEventId);
      if (index >= 0) {
        setCurrentIndex(index);
      }
    }
  }, [isOpen, initialEventId, mediaEvents]); 

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentIndex(prev => (prev < mediaEvents.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
        document.body.style.overflow = 'auto';
        window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, mediaEvents]);

  // Early return MUST happen after all hooks
  if (!isOpen || mediaEvents.length === 0) return null;

  const currentEvent = mediaEvents[currentIndex];
  
  // Safety check
  if (!currentEvent) return null;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < mediaEvents.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col animate-in fade-in duration-200">
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10 bg-gradient-to-b from-black/50 to-transparent">
         <div className="text-white">
             <p className="font-bold text-lg">{new Date(currentEvent.date).toLocaleDateString(locale, {dateStyle: 'long'})}</p>
             <p className="text-sm opacity-80">{currentEvent.title || t('timeline.photo_memory')}</p>
         </div>
         <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white backdrop-blur-sm">
            <X size={24} />
         </button>
      </div>

      {/* Main Image Area */}
      <div className="flex-1 flex items-center justify-center relative w-full h-full" onClick={onClose}>
         
         {/* Prev Button */}
         <button 
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`absolute left-4 p-3 rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition disabled:opacity-0 disabled:pointer-events-none z-20`}
         >
             <ChevronLeft size={32} />
         </button>

         {/* Image */}
         <div 
            className="relative max-w-full max-h-full p-2 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
         >
             <img 
                src={currentEvent.mediaUrl} 
                alt="Full View" 
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
             />
         </div>

         {/* Next Button */}
         <button 
            onClick={handleNext}
            disabled={currentIndex === mediaEvents.length - 1}
            className={`absolute right-4 p-3 rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition disabled:opacity-0 disabled:pointer-events-none z-20`}
         >
             <ChevronRight size={32} />
         </button>
      </div>

      {/* Caption/Description at bottom */}
      {currentEvent.description && (
          <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white text-center pb-10">
              <p className="max-w-2xl mx-auto text-sm md:text-base leading-relaxed opacity-90">
                  {currentEvent.description}
              </p>
          </div>
      )}
    </div>
  );
};

export default ImageViewer;
