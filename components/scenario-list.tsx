"use client";

import { useState } from "react";
import { ScenarioCard, ScenarioDetail } from "@/components/scenario-card";
import { ScenariosData } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

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
          {selectedScenario && (
            <Button variant="outline" onClick={clearSelection}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          )}
        </div>
      </div>

      {selectedScenario ? (
        <ScenarioDetail
          id={selectedScenario}
          scenario={scenarios[selectedScenario]}
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
