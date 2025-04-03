import { Suspense } from "react";
import ScenarioList from "@/components/scenario-list";
import { loadScenarios } from "@/lib/api";

export default async function Home() {
  const scenarios = await loadScenarios();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">German Conversation Scenarios</h1>
      <Suspense fallback={<div>Loading scenarios...</div>}>
        <ScenarioList scenarios={scenarios} />
      </Suspense>
    </div>
  );
}
