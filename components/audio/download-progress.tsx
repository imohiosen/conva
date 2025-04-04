import React from 'react';
import { Progress } from '@/components/ui/progress';

interface DownloadProgressProps {
  dialogIndex: number;
  progress: number;
}

export function DownloadProgress({ dialogIndex, progress }: DownloadProgressProps) {
  return (
    <div className="mt-2 w-full">
      <div className="text-xs text-gray-500 mb-1">
        Pre-downloading dialog {dialogIndex + 1}
      </div>
      <Progress value={progress} className="h-1 w-full" />
    </div>
  );
}
