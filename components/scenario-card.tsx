import React from 'react';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle } from 'lucide-react';
import { Scenario } from '@/lib/types';

// Component exports are handled in separate files

interface ScenarioCardProps {
  id: string;
  scenario: Scenario;
  onSelect: () => void;
}

export function ScenarioCard({ id, scenario, onSelect }: ScenarioCardProps) {
  // Create a shortened title from the summary (first 30 characters + ellipsis if needed)
  const shortTitle = scenario.summary.length > 30 
    ? `${scenario.summary.substring(0, 30)}...` 
    : scenario.summary;

  return (
    <Card className="w-full hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardHeader>
        <CardTitle className="text-lg">{shortTitle}</CardTitle>
        <CardDescription>{id}</CardDescription>
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
