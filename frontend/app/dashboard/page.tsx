"use client";

import { useState } from "react";
import Sidebar from "./components/Sidebar";
import DashboardHeader from "./components/DashboardHeader";
import WorldMap from "./components/WorldMap";

const ENTITY_DATA: Record<string, { breadcrumb: string[] }> = {
  default:            { breadcrumb: ["GC", "SPD", "AUC", "SNSW"] },
  "South Pacific Div.": { breadcrumb: ["GC", "SPD"] },
  "SNSW Conference":  { breadcrumb: ["GC", "SPD", "AUC", "SNSW"] },
};

export default function DashboardPage() {
  const [selectedEntity, setSelectedEntity] = useState("SNSW Conference");
  const data = ENTITY_DATA[selectedEntity] ?? ENTITY_DATA["default"];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F4F5F7]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="shrink-0">
          <DashboardHeader entity={selectedEntity} breadcrumb={data.breadcrumb} />
        </div>

        {/* Map fills the entire remaining viewport height */}
        <div className="flex-1 min-h-0 px-5 py-3">
          <WorldMap
            onSelectEntity={setSelectedEntity}
            selected={selectedEntity}
          />
        </div>
      </div>
    </div>
  );
}
