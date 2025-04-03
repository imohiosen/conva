import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AudioPlayer } from '@/components/ui/audio';
import { Conversation, Scenario } from '@/lib/types';
import { PlayCircle, User, Headphones } from 'lucide-react';

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
}

export function ConversationItem({ conversation, index, scenarioId, isPlaying, onPlay }: ConversationItemProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAudio = async () => {
    if (audioUrl) {
      onPlay();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/audio?scenarioId=${scenarioId}&index=${index}`);
      const data = await response.json();
      setAudioUrl(data.url);
      onPlay();
    } catch (error) {
      console.error('Error fetching audio:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col p-3 rounded-md mb-2 ${conversation.speaker_id === 0 ? 'bg-blue-50 ml-auto' : 'bg-gray-50 mr-auto'}`} style={{ maxWidth: '80%' }}>
      <div className="flex items-center mb-2">
        <User className="h-4 w-4 mr-2" />
        <span className="text-sm font-medium">Speaker {conversation.speaker_id === 0 ? 'Liam' : 'Aria'}</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchAudio} 
          disabled={loading}
          className="ml-2"
        >
          <Headphones className="h-4 w-4" />
        </Button>
      </div>
      <p>{conversation.text}</p>
      {audioUrl && isPlaying && (
        <AudioPlayer src={audioUrl} className="mt-2" />
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

  const playConversation = (index: number) => {
    setCurrentPlayingIndex(index === currentPlayingIndex ? null : index);
  };

  const fetchSummaryAudio = async () => {
    if (summaryUrl) return;

    setLoadingSummary(true);
    try {
      const response = await fetch(`/api/audio?scenarioId=${id}&index=summary`);
      const data = await response.json();
      setSummaryUrl(data.url);
    } catch (error) {
      console.error('Error fetching summary audio:', error);
    } finally {
      setLoadingSummary(false);
    }
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
        {summaryUrl && (
          <AudioPlayer src={summaryUrl} className="mt-2" />
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
              isPlaying={currentPlayingIndex === index}
              onPlay={() => playConversation(index)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
