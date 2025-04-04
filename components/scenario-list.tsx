"use client";

import { useState, useEffect, useRef } from "react";
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
  const [userInteracted, setUserInteracted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const AUTO_SELECT_DELAY = 5000; // 5 seconds

  const filteredScenarios = Object.entries(scenarios).filter(([id, scenario]) => {
    const lowerQuery = searchQuery.toLowerCase();
    return (
      id.toLowerCase().includes(lowerQuery) ||
      scenario.summary.toLowerCase().includes(lowerQuery) ||
      scenario.conversation.some(conv => conv.text.toLowerCase().includes(lowerQuery))
    );
  });

  // Function to handle any user interaction
  const handleUserInteraction = () => {
    setUserInteracted(true);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Set up auto-selection timer when component mounts
  useEffect(() => {
    if (!selectedScenario && !userInteracted && filteredScenarios.length > 0) {
      timeoutRef.current = setTimeout(() => {
        navigateToRandom();
      }, AUTO_SELECT_DELAY);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [selectedScenario, userInteracted, filteredScenarios.length]);

  // Add event listeners for user interaction
  useEffect(() => {
    const interactionEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    
    const interactionHandler = () => {
      handleUserInteraction();
    };
    
    interactionEvents.forEach(event => {
      window.addEventListener(event, interactionHandler);
    });
    
    return () => {
      interactionEvents.forEach(event => {
        window.removeEventListener(event, interactionHandler);
      });
    };
  }, []);

  const handleScenarioSelect = (id: string) => {
    handleUserInteraction(); // Mark that user has interacted
    setSelectedScenario(id);
  };

  const clearSelection = () => {
    setUserInteracted(false); // Reset interaction flag to re-enable auto-selection
    setSelectedScenario(null);
    
    // Start a new auto-selection timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (!selectedScenario && !userInteracted && filteredScenarios.length > 0) {
        navigateToRandom();
      }
    }, AUTO_SELECT_DELAY);
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
    <div onMouseMove={handleUserInteraction}>
      <div className="mb-4 relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search scenarios..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => {
                handleUserInteraction();
                setSearchQuery(e.target.value);
              }}
            />
          </div>
          {!selectedScenario && filteredScenarios.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                handleUserInteraction();
                navigateToRandom();
              }}
              title="Go to a random scenario"
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Random
            </Button>
          )}
        </div>
        
        {!selectedScenario && !userInteracted && (
          <div className="text-xs text-gray-500 mt-2">
            Auto-selecting a random scenario in {AUTO_SELECT_DELAY/1000} seconds...
          </div>
        )}
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
        <>
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
          
          {/* Floating Random Button */}
          {filteredScenarios.length > 0 && (
            <Button
              onClick={() => {
                handleUserInteraction();
                navigateToRandom();
              }}
              className="fixed bottom-6 right-6 shadow-lg rounded-full w-14 h-14 p-0 z-10"
              title="Go to a random scenario"
            >
              <Shuffle className="h-6 w-6" />
            </Button>
          )}
        </>
      )}
    </div>
  );
}
