import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { TimelineEvent } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialEventId: string | null;
  events: TimelineEvent[];
}

const ImageViewer: React.FC<Props> = ({ isOpen, onClose, initialEventId, events }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Filter events that actually have images
  const mediaEvents = events.filter(e => !!e.mediaUrl);

  useEffect(() => {
    if (isOpen && initialEventId) {
      const index = mediaEvents.findIndex(e => e.id === initialEventId);
      if (index >= 0) {
        setCurrentIndex(index);
      }
    }
  }, [isOpen, initialEventId]); // Removed events dependency to prevent reset on infinite scroll append

  if (!isOpen || mediaEvents.length === 0) return null;

  const currentEvent = mediaEvents[currentIndex];

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

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      if (currentIndex < mediaEvents.length - 1) setCurrentIndex(prev => prev + 1);
    } else if (e.key === 'ArrowLeft') {
      if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if(isOpen) {
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);
    } else {
        document.body.style.overflow = 'auto';
    }
    return () => {
        document.body.style.overflow = 'auto';
        window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, currentIndex]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col animate-in fade-in duration-200">
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10 bg-gradient-to-b from-black/50 to-transparent">
         <div className="text-white">
             <p className="font-bold text-lg">{new Date(currentEvent.date).toLocaleDateString(undefined, {dateStyle: 'long'})}</p>
             <p className="text-sm opacity-80">{currentEvent.title || "Memory"}</p>
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