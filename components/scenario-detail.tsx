import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AudioPlayer } from '@/components/ui/audio';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Scenario } from '@/lib/types';
import { 
  Headphones, 
  Play, 
  ArrowLeft, 
  ArrowRight, 
  ListRestart,
  StopCircle,
  Shuffle,
  Repeat
} from 'lucide-react';
import { DownloadQueue } from '@/components/audio';
import { ConversationItem } from './conversation-item';

interface ScenarioDetailProps {
  id: string;
  scenario: Scenario;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onRandom?: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

export function ScenarioDetail({ 
  id, 
  scenario, 
  onClose, 
  onNext, 
  onPrevious,
  onRandom,
  hasNext,
  hasPrevious
}: ScenarioDetailProps) {
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(null);
  const [summaryUrl, setSummaryUrl] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingSummaryProgress, setLoadingSummaryProgress] = useState(0);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  
  // Auto-repeat feature
  const [autoRepeat, setAutoRepeat] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const repeatDelayRef = useRef<NodeJS.Timeout | null>(null);
  const REPEAT_DELAY_MS = 3000; // 3 seconds delay between repeats
  
  // Download queue system
  const [downloadQueue, setDownloadQueue] = useState<number[]>([]);
  const [preloadedAudio, setPreloadedAudio] = useState<Record<number, string>>({});

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
        if (autoRepeat) {
          // If auto-repeat is enabled, schedule restart after delay
          setIsRepeating(true);
          repeatDelayRef.current = setTimeout(() => {
            setCurrentPlayingIndex(0); // Start from the beginning
            setIsRepeating(false);
          }, REPEAT_DELAY_MS);
        } else {
          // Normal end behavior
          setIsPlayingAll(false);
          setCurrentPlayingIndex(null);
        }
      }
    }
  };

  // Clean up any timeout when component unmounts or scenario changes
  useEffect(() => {
    return () => {
      if (repeatDelayRef.current) {
        clearTimeout(repeatDelayRef.current);
      }
    };
  }, [id]);

  // Also clean up when auto-repeat is disabled
  useEffect(() => {
    if (!autoRepeat && repeatDelayRef.current) {
      clearTimeout(repeatDelayRef.current);
      repeatDelayRef.current = null;
      setIsRepeating(false);
    }
  }, [autoRepeat]);

  const stopPlayingAll = () => {
    setIsPlayingAll(false);
    setCurrentPlayingIndex(null);
    
    // Clear any scheduled repeat
    if (repeatDelayRef.current) {
      clearTimeout(repeatDelayRef.current);
      repeatDelayRef.current = null;
      setIsRepeating(false);
    }
    
    // Clear download queue when stopping
    setDownloadQueue([]);
  };

  // Handle audio loaded from a conversation item
  const handleAudioLoaded = (index: number, url: string) => {
    setPreloadedAudio(prev => ({
      ...prev,
      [index]: url
    }));
  };

  // Handle navigation - stop any playback
  const handleNavigate = (navigateFunction?: () => void) => {
    stopPlayingAll();
    if (navigateFunction) {
      navigateFunction();
    }
  };

  // Function to handle dialog card click (jumps to that point in the conversation)
  const handleDialogClick = (index: number) => {
    if (!isPlayingAll) {
      // If not in full playback mode, toggle individual audio
      playConversation(index);
    } else {
      // In full playback mode, jump to this index
      setCurrentPlayingIndex(index);
    }
  };

  // Create a shortened title from the summary (first 50 characters + ellipsis if needed)
  const shortTitle = scenario.summary.length > 50 
    ? `${scenario.summary.substring(0, 50)}...` 
    : scenario.summary;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center mb-4">
          <CardTitle>{shortTitle}</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClose} 
              title="Return to scenario list"
            >
              <ListRestart className="h-4 w-4 mr-2" />
              Back to List
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleNavigate(onPrevious)} 
              disabled={!hasPrevious}
              title="Previous scenario"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleNavigate(onNext)} 
              disabled={!hasNext}
              title="Next scenario"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleNavigate(onRandom)} 
              title="Random scenario"
            >
              <Shuffle className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <CardDescription className="flex items-center">
          <span className="text-xs mr-2">{id}</span>
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
        
        <div className="flex flex-wrap mt-4 gap-2 items-center">
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
              <StopCircle className="h-4 w-4 mr-2" />
              Stop Playback
            </Button>
          )}
          
          <div className="flex items-center ml-auto gap-2">
            <Switch
              id="auto-repeat"
              checked={autoRepeat}
              onCheckedChange={setAutoRepeat}
            />
            <Label htmlFor="auto-repeat" className="flex items-center gap-1 cursor-pointer">
              <Repeat className="h-4 w-4" />
              Auto-repeat
            </Label>
          </div>
        </div>
        
        {isRepeating && (
          <div className="mt-2 text-xs text-gray-500">
            Repeating in {REPEAT_DELAY_MS/1000} seconds...
          </div>
        )}
        
        <DownloadQueue 
          scenarioId={id}
          downloadQueue={downloadQueue}
          setDownloadQueue={setDownloadQueue}
          onAudioLoaded={handleAudioLoaded}
        />
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
              onClick={() => handleDialogClick(index)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
