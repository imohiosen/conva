import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AudioPlayer } from '@/components/ui/audio';
import { Conversation, Scenario } from '@/lib/types';
import { PlayCircle, User, Headphones, Play, Download } from 'lucide-react';
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
  onAudioLoaded?: (index: number, url: string) => void;
  preloadedAudio?: string | null;
}

export function ConversationItem({ 
  conversation, 
  index, 
  scenarioId, 
  isPlaying, 
  onPlay, 
  isPlayingAll,
  onAudioEnded,
  isCurrentInQueue,
  onAudioLoaded,
  preloadedAudio
}: ConversationItemProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(preloadedAudio || null);
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
        {audioUrl && (
          <span className="ml-2 text-xs text-green-600">
            ✓
          </span>
        )}
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
          src={audioUrl} 
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
  
  // Download queue system
  const [downloadQueue, setDownloadQueue] = useState<number[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [preloadedAudio, setPreloadedAudio] = useState<Record<number, string>>({});
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});

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

  // Process the download queue
  const processDownloadQueue = useCallback(async () => {
    if (downloadQueue.length === 0 || isDownloading) return;
    
    setIsDownloading(true);
    const indexToDownload = downloadQueue[0];
    
    // Set initial progress for this download
    setDownloadProgress(prev => ({
      ...prev,
      [indexToDownload]: 10
    }));
    
    try {
      // Simulate progress during API call
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => ({
          ...prev,
          [indexToDownload]: Math.min((prev[indexToDownload] || 0) + (Math.random() * 10), 90)
        }));
      }, 300);
      
      const response = await fetch(`/api/audio?scenarioId=${id}&index=${indexToDownload}`);
      const data = await response.json();
      
      clearInterval(progressInterval);
      
      // Set complete progress
      setDownloadProgress(prev => ({
        ...prev,
        [indexToDownload]: 100
      }));
      
      // Add to preloaded audio
      setPreloadedAudio(prev => ({
        ...prev,
        [indexToDownload]: data.url
      }));
      
      // Remove from queue
      setDownloadQueue(prev => prev.filter(idx => idx !== indexToDownload));
      
      // Clear progress after a delay
      setTimeout(() => {
        setDownloadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[indexToDownload];
          return newProgress;
        });
      }, 500);
      
    } catch (error) {
      console.error(`Error pre-downloading audio for index ${indexToDownload}:`, error);
      // Remove failed download from queue
      setDownloadQueue(prev => prev.filter(idx => idx !== indexToDownload));
    } finally {
      setIsDownloading(false);
    }
  }, [downloadQueue, isDownloading, id]);

  // Keep processing the queue
  useEffect(() => {
    processDownloadQueue();
  }, [downloadQueue, isDownloading, processDownloadQueue]);

  const playAllConversation = async () => {
    // Start playback immediately
    setIsPlayingAll(true);
    setCurrentPlayingIndex(0);
    
    // Queue up all conversations for download (except the first one which will download on play)
    const indicesToDownload = Array.from({ length: scenario.conversation.length }, (_, i) => i + 1)
      .filter(i => i < scenario.conversation.length && !preloadedAudio[i]);
    
    setDownloadQueue(prev => [...prev, ...indicesToDownload]);
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

  const handleAudioLoaded = (index: number, url: string) => {
    setPreloadedAudio(prev => ({
      ...prev,
      [index]: url
    }));
  };

  const stopPlayingAll = () => {
    setIsPlayingAll(false);
    setCurrentPlayingIndex(null);
    // Clear download queue when stopping
    setDownloadQueue([]);
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
        
        {/* Download queue status */}
        {downloadQueue.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            Pre-downloading {downloadQueue.length} audio file(s)...
          </div>
        )}
        
        {/* Show progress for current download */}
        {isDownloading && downloadQueue.length > 0 && (
          <div className="mt-2 w-full">
            <div className="text-xs text-gray-500 mb-1">Pre-downloading dialog {downloadQueue[0] + 1}</div>
            <Progress value={downloadProgress[downloadQueue[0]] || 0} className="h-1 w-full" />
          </div>
        )}
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
              onAudioLoaded={handleAudioLoaded}
              preloadedAudio={preloadedAudio[index] || null}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
