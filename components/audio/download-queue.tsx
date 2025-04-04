import React, { useCallback, useEffect, useState } from 'react';
import { DownloadProgress } from './download-progress';

interface DownloadQueueProps {
  scenarioId: string;
  downloadQueue: number[];
  setDownloadQueue: React.Dispatch<React.SetStateAction<number[]>>;
  onAudioLoaded: (index: number, url: string) => void;
}

export function DownloadQueue({ 
  scenarioId,
  downloadQueue, 
  setDownloadQueue,
  onAudioLoaded
}: DownloadQueueProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});

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
      
      const response = await fetch(`/api/audio?scenarioId=${scenarioId}&index=${indexToDownload}`);
      const data = await response.json();
      
      clearInterval(progressInterval);
      
      // Set complete progress
      setDownloadProgress(prev => ({
        ...prev,
        [indexToDownload]: 100
      }));
      
      // Notify parent that audio is loaded
      onAudioLoaded(indexToDownload, data.url);
      
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
  }, [downloadQueue, isDownloading, scenarioId, onAudioLoaded, setDownloadQueue]);

  // Keep processing the queue
  useEffect(() => {
    processDownloadQueue();
  }, [downloadQueue, isDownloading, processDownloadQueue]);

  if (downloadQueue.length === 0) {
    return null;
  }

  return (
    <>
      {/* Download queue status */}
      <div className="mt-2 text-xs text-gray-500">
        Pre-downloading {downloadQueue.length} audio file(s)...
      </div>
      
      {/* Show progress for current download */}
      {isDownloading && downloadQueue.length > 0 && (
        <DownloadProgress 
          dialogIndex={downloadQueue[0]} 
          progress={downloadProgress[downloadQueue[0]] || 0} 
        />
      )}
    </>
  );
}
