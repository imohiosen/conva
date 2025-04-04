import { Suspense } from "react";
import ScenarioList from "@/components/scenario-list";
import { loadScenarios } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function Home() {
  const scenarios = await loadScenarios();

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-center flex-1">German Conversation Scenarios</h1>
        <ThemeToggle />
      </div>
      <Suspense fallback={<div>Loading scenarios...</div>}>
        <ScenarioList scenarios={scenarios} />
      </Suspense>
    </div>
  );
}
