"use client";

import { useState } from "react";
import { ScenarioCard } from "@/components/scenario-card";
import { ScenarioDetail } from "@/components/scenario-detail";
import { ScenariosData } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Shuffle } from "lucide-react";

interface ScenarioListProps {
  scenarios: ScenariosData;
}

export default function ScenarioList({ scenarios }: ScenarioListProps) {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredScenarios = Object.entries(scenarios).filter(([id, scenario]) => {
    const lowerQuery = searchQuery.toLowerCase();
    return (
      id.toLowerCase().includes(lowerQuery) ||
      scenario.summary.toLowerCase().includes(lowerQuery) ||
      scenario.conversation.some(conv => conv.text.toLowerCase().includes(lowerQuery))
    );
  });

  const handleScenarioSelect = (id: string) => {
    setSelectedScenario(id);
  };

  const clearSelection = () => {
    setSelectedScenario(null);
  };

  const navigateToNext = () => {
    if (!selectedScenario) return;
    
    // Find current index in filtered scenarios
    const currentIndex = filteredScenarios.findIndex(([id]) => id === selectedScenario);
    if (currentIndex < filteredScenarios.length - 1) {
      const nextScenarioId = filteredScenarios[currentIndex + 1][0];
      setSelectedScenario(nextScenarioId);
    }
  };

  const navigateToPrevious = () => {
    if (!selectedScenario) return;
    
    // Find current index in filtered scenarios
    const currentIndex = filteredScenarios.findIndex(([id]) => id === selectedScenario);
    if (currentIndex > 0) {
      const previousScenarioId = filteredScenarios[currentIndex - 1][0];
      setSelectedScenario(previousScenarioId);
    }
  };

  const navigateToRandom = () => {
    if (filteredScenarios.length === 0) return;
    
    // Pick a random scenario that is different from the current one
    if (filteredScenarios.length === 1) {
      setSelectedScenario(filteredScenarios[0][0]);
      return;
    }
    
    let randomIndex;
    let currentIndex = -1;
    
    if (selectedScenario) {
      currentIndex = filteredScenarios.findIndex(([id]) => id === selectedScenario);
    }
    
    // Ensure we pick a different scenario if possible
    do {
      randomIndex = Math.floor(Math.random() * filteredScenarios.length);
    } while (filteredScenarios.length > 1 && randomIndex === currentIndex);
    
    const randomScenarioId = filteredScenarios[randomIndex][0];
    setSelectedScenario(randomScenarioId);
  };

  // Determine if there are next/previous scenarios available
  const getCurrentScenarioIndex = () => {
    if (!selectedScenario) return -1;
    return filteredScenarios.findIndex(([id]) => id === selectedScenario);
  };

  const currentIndex = getCurrentScenarioIndex();
  const hasNext = currentIndex < filteredScenarios.length - 1 && currentIndex !== -1;
  const hasPrevious = currentIndex > 0;

  return (
    <div>
      <div className="mb-4 relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search scenarios..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {!selectedScenario && filteredScenarios.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={navigateToRandom}
              title="Go to a random scenario"
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Random
            </Button>
          )}
        </div>
      </div>

      {selectedScenario ? (
        <ScenarioDetail
          id={selectedScenario}
          scenario={scenarios[selectedScenario]}
          onClose={clearSelection}
          onNext={hasNext ? navigateToNext : undefined}
          onPrevious={hasPrevious ? navigateToPrevious : undefined}
          onRandom={navigateToRandom}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScenarios.map(([id, scenario]) => (
            <ScenarioCard
              key={id}
              id={id}
              scenario={scenario}
              onSelect={() => handleScenarioSelect(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
