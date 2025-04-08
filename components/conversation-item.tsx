import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Conversation } from '@/lib/types';
import { User, Headphones, Languages } from 'lucide-react';

interface ConversationItemProps {
  conversation: Conversation;
  index: number;
  scenarioId: string;
  isPlaying: boolean;
  onPlay: () => void;
  isPlayingAll: boolean;
  onAudioEnded?: () => void;
  isCurrentInQueue: boolean;
  onAudioLoaded?: (index: number, url: string) => void;
  preloadedAudio?: string | null;
  onClick?: () => void;
  translateAll?: boolean;
  isTranslatingAll?: boolean;
}

export const ConversationItem = forwardRef<HTMLDivElement, ConversationItemProps>(({
  conversation, 
  index, 
  scenarioId, 
  isPlaying, 
  onPlay, 
  isPlayingAll,
  onAudioEnded,
  isCurrentInQueue,
  onAudioLoaded,
  preloadedAudio,
  onClick,
  translateAll = false,
  isTranslatingAll = false
}, ref) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(preloadedAudio || null);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [translating, setTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslated, setIsTranslated] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchAudio = async () => {
    if (audioUrl) {
      onPlay();
      return;
    }

    setLoading(true);
    setLoadingProgress(10); // Start progress

    try {
      // Simulate progress during API call
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          const increment = Math.random() * 10;
          return Math.min(prev + increment, 90); // Max 90 before complete
        });
      }, 300);

      const response = await fetch(`/api/audio?scenarioId=${scenarioId}&index=${index}`);
      const data = await response.json();
      
      clearInterval(progressInterval);
      setLoadingProgress(100); // Complete
      
      setAudioUrl(data.url);
      
      // Notify parent that audio is loaded
      if (onAudioLoaded) {
        onAudioLoaded(index, data.url);
      }
      
      onPlay();
    } catch (error) {
      console.error('Error fetching audio:', error);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setLoadingProgress(0);
      }, 500);
    }
  };

  const handleTranslate = async () => {
    // If already translated, toggle back to original
    if (isTranslated) {
      setIsTranslated(false);
      return;
    }

    // If we already have a translation, just show it
    if (translatedText) {
      setIsTranslated(true);
      return;
    }

    setTranslating(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: conversation.text,
          targetLanguage: 'en', // Default to English, could be made configurable
        }),
      });
      
      if (!response.ok) {
        throw new Error('Translation failed');
      }
      
      const data = await response.json();
      setTranslatedText(data.translatedText);
      setIsTranslated(true);
    } catch (error) {
      console.error('Error translating text:', error);
    } finally {
      setTranslating(false);
    }
  };

  // Update audioUrl if preloadedAudio changes
  useEffect(() => {
    if (preloadedAudio && !audioUrl) {
      setAudioUrl(preloadedAudio);
    }
  }, [preloadedAudio]);

  // Auto-fetch audio if it's the current item in queue for playAll
  useEffect(() => {
    if (isCurrentInQueue && !audioUrl && !loading) {
      fetchAudio();
    }
  }, [isCurrentInQueue]);

  // Handle audio ended event
  useEffect(() => {
    const audio = audioRef.current;
    
    if (audio) {
      const handleEnded = () => {
        if (onAudioEnded) {
          onAudioEnded();
        }
      };
      
      audio.addEventListener('ended', handleEnded);
      
      return () => {
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [audioRef.current, onAudioEnded]);

  // Auto-play when it becomes the current playing item
  useEffect(() => {
    if ((isPlaying || isPlayingAll) && audioUrl && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Could not autoplay audio:", e));
    }
  }, [isPlaying, isPlayingAll, audioUrl]);

  // Handle translateAll prop changes
  useEffect(() => {
    if (translateAll) {
      if (!isTranslated && !translatedText) {
        handleTranslate();
      } else if (!isTranslated) {
        setIsTranslated(true);
      }
    } else if (isTranslated) {
      setIsTranslated(false);
    }
  }, [translateAll]);

  // Display the translated text if available and translation is active
  const displayText = isTranslated && translatedText ? translatedText : conversation.text;

  return (
    <div 
      className={`flex flex-col p-3 rounded-md mb-2 ${
        conversation.speaker_id === 0 
          ? 'bg-blue-50 dark:bg-blue-900/30 ml-auto' 
          : 'bg-gray-50 dark:bg-gray-800/50 mr-auto'
      } ${isPlayingAll || onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`} 
      style={{ maxWidth: '80%' }}
      onClick={() => onClick && onClick()}
      ref={ref}
    >
      <div className="flex items-center mb-2">
        <User className="h-4 w-4 mr-2" />
        <span className="text-sm font-medium">Speaker {conversation.speaker_id === 0 ? 'Liam' : 'Aria'}</span>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click handler from firing
            fetchAudio();
          }} 
          disabled={loading || isPlayingAll}
          className="ml-2 h-8 w-8"
          title="Play audio"
        >
          <Headphones className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            handleTranslate();
          }}
          disabled={translating || isTranslatingAll}
          className="ml-1 h-8 w-8"
          title={isTranslated ? "Show original" : "Translate"}
        >
          <Languages className="h-4 w-4" />
          {isTranslated && <span className="sr-only">Show original</span>}
          {!isTranslated && <span className="sr-only">Translate</span>}
        </Button>
        {audioUrl && (
          <span className="ml-2 text-xs text-green-600 dark:text-green-400">
            ✓
          </span>
        )}
      </div>
      <p>
        {displayText}
        {isTranslated && (
          <span className="text-xs ml-2 text-blue-500">
            (Translated)
          </span>
        )}
      </p>
      
      {(loading || translating) && (
        <div className="mt-2 w-full">
          <Progress value={loadingProgress || (translating ? 50 : 0)} className="h-1 w-full" />
          {translating && <span className="text-xs text-gray-500">Translating...</span>}
        </div>
      )}
      
      {audioUrl && (isPlaying || isPlayingAll) && (
        <audio 
          ref={audioRef}
          src={audioUrl} 
          className="mt-2 w-full" 
          controls
          autoPlay
          onClick={(e) => e.stopPropagation()} // Prevent card click handler from firing when clicking player controls
        />
      )}
    </div>
  );
});

ConversationItem.displayName = 'ConversationItem';
