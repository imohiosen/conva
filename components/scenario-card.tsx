import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AudioPlayer } from '@/components/ui/audio';
import { Conversation, Scenario } from '@/lib/types';
import { PlayCircle, User, Headphones, Play } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ScenarioCardProps {
  id: string;
  scenario: Scenario;
  onSelect: () => void;
}

export function ScenarioCard({ id, scenario, onSelect }: ScenarioCardProps) {
  return (
    <Card className="w-full hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardHeader>
        <CardTitle className="text-lg">{id}</CardTitle>
        <CardDescription>{scenario.summary}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button variant="ghost" size="sm" className="ml-auto">
          <PlayCircle className="h-4 w-4 mr-2" />
          Listen
        </Button>
      </CardFooter>
    </Card>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  index: number;
  scenarioId: string;
  isPlaying: boolean;
  onPlay: () => void;
  isPlayingAll: boolean;
  onAudioEnded?: () => void;
  isCurrentInQueue: boolean;
}

export function ConversationItem({ 
  conversation, 
  index, 
  scenarioId, 
  isPlaying, 
  onPlay, 
  isPlayingAll,
  onAudioEnded,
  isCurrentInQueue 
}: ConversationItemProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
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

  return (
    <div className={`flex flex-col p-3 rounded-md mb-2 ${conversation.speaker_id === 0 ? 'bg-blue-50 ml-auto' : 'bg-gray-50 mr-auto'}`} style={{ maxWidth: '80%' }}>
      <div className="flex items-center mb-2">
        <User className="h-4 w-4 mr-2" />
        <span className="text-sm font-medium">Speaker {conversation.speaker_id === 0 ? 'Liam' : 'Aria'}</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchAudio} 
          disabled={loading || isPlayingAll}
          className="ml-2"
        >
          <Headphones className="h-4 w-4" />
        </Button>
      </div>
      <p>{conversation.text}</p>
      
      {loading && (
        <div className="mt-2 w-full">
          <Progress value={loadingProgress} className="h-1 w-full" />
        </div>
      )}
      
      {audioUrl && (isPlaying || isPlayingAll) && (
        <audio 
          ref={audioRef}
          src={audioUrl || ''} 
          className="mt-2 w-full" 
          controls
          autoPlay
        />
      )}
    </div>
  );
}

interface ScenarioDetailProps {
  id: string;
  scenario: Scenario;
}

export function ScenarioDetail({ id, scenario }: ScenarioDetailProps) {
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(null);
  const [summaryUrl, setSummaryUrl] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingSummaryProgress, setLoadingSummaryProgress] = useState(0);
  const [isPlayingAll, setIsPlayingAll] = useState(false);

  const playConversation = (index: number) => {
    if (isPlayingAll) return;
    setCurrentPlayingIndex(index === currentPlayingIndex ? null : index);
  };

  const fetchSummaryAudio = async () => {
    if (summaryUrl) return;

    setLoadingSummary(true);
    setLoadingSummaryProgress(10);

    try {
      // Simulate progress during API call
      const progressInterval = setInterval(() => {
        setLoadingSummaryProgress(prev => {
          const increment = Math.random() * 10;
          return Math.min(prev + increment, 90);
        });
      }, 300);

      const response = await fetch(`/api/audio?scenarioId=${id}&index=summary`);
      const data = await response.json();
      
      clearInterval(progressInterval);
      setLoadingSummaryProgress(100);
      
      setSummaryUrl(data.url);
    } catch (error) {
      console.error('Error fetching summary audio:', error);
    } finally {
      setTimeout(() => {
        setLoadingSummary(false);
        setLoadingSummaryProgress(0);
      }, 500);
    }
  };

  const playAllConversation = async () => {
    setIsPlayingAll(true);
    // Start with the first conversation
    setCurrentPlayingIndex(0);
  };

  const handleAudioEnded = () => {
    if (isPlayingAll && currentPlayingIndex !== null) {
      // Move to the next conversation
      if (currentPlayingIndex < scenario.conversation.length - 1) {
        setCurrentPlayingIndex(currentPlayingIndex + 1);
      } else {
        // End of conversation
        setIsPlayingAll(false);
        setCurrentPlayingIndex(null);
      }
    }
  };

  const stopPlayingAll = () => {
    setIsPlayingAll(false);
    setCurrentPlayingIndex(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{id}</CardTitle>
        <CardDescription className="flex items-center">
          {scenario.summary}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchSummaryAudio} 
            disabled={loadingSummary}
            className="ml-2"
          >
            <Headphones className="h-4 w-4" />
          </Button>
        </CardDescription>
        
        {loadingSummary && (
          <div className="w-full mt-2">
            <Progress value={loadingSummaryProgress} className="h-1 w-full" />
          </div>
        )}
        
        {summaryUrl && (
          <AudioPlayer src={summaryUrl} className="mt-2" />
        )}
        
        <div className="flex mt-4 gap-2">
          <Button 
            onClick={playAllConversation} 
            disabled={isPlayingAll}
          >
            <Play className="h-4 w-4 mr-2" />
            Play Full Conversation
          </Button>
          
          {isPlayingAll && (
            <Button 
              variant="outline"
              onClick={stopPlayingAll}
            >
              Stop Playback
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {scenario.conversation.map((item, index) => (
            <ConversationItem 
              key={index}
              conversation={item}
              index={index}
              scenarioId={id}
              isPlaying={currentPlayingIndex === index && !isPlayingAll}
              isPlayingAll={isPlayingAll && currentPlayingIndex === index}
              onPlay={() => playConversation(index)}
              onAudioEnded={handleAudioEnded}
              isCurrentInQueue={isPlayingAll && currentPlayingIndex === index}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
