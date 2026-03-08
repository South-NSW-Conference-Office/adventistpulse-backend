"use client";

import { useState } from "react";
import Sidebar from "./components/Sidebar";
import DashboardHeader from "./components/DashboardHeader";
import WorldMap from "./components/WorldMap";
import StatCard from "./components/StatCard";
import MembershipChart from "./components/MembershipChart";
import BaptismChart from "./components/BaptismChart";
import AlertsStrip from "./components/AlertsStrip";

// Mock entity data — will be replaced by API calls
const ENTITY_DATA: Record<string, {
  breadcrumb: string[];
  membership: string;
  membershipTrend: number;
  baptisms: string;
  baptismsTrend: number;
  netGrowth: string;
  netGrowthTrend: number;
  tithe: string;
  titheTrend: number;
}> = {
  default: {
    breadcrumb:      ["GC", "SPD", "AUC", "SNSW"],
    membership:      "4,620",
    membershipTrend: 2.4,
    baptisms:        "141",
    baptismsTrend:   5.2,
    netGrowth:       "+87",
    netGrowthTrend:  1.8,
    tithe:           "$1,240",
    titheTrend:      -0.8,
  },
  "South Pacific Div.": {
    breadcrumb:      ["GC", "SPD"],
    membership:      "67,381",
    membershipTrend: 1.2,
    baptisms:        "1,326",
    baptismsTrend:   3.1,
    netGrowth:       "+412",
    netGrowthTrend:  0.9,
    tithe:           "$1,180",
    titheTrend:      1.4,
  },
  "SNSW Conference": {
    breadcrumb:      ["GC", "SPD", "AUC", "SNSW"],
    membership:      "4,620",
    membershipTrend: 2.4,
    baptisms:        "141",
    baptismsTrend:   5.2,
    netGrowth:       "+87",
    netGrowthTrend:  1.8,
    tithe:           "$1,240",
    titheTrend:      -0.8,
  },
};

export default function DashboardPage() {
  const [selectedEntity, setSelectedEntity] = useState("SNSW Conference");

  const data =
    ENTITY_DATA[selectedEntity] ?? ENTITY_DATA["SNSW Conference"];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F4F5F7]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Page header */}
        <DashboardHeader
          entity={selectedEntity}
          breadcrumb={data.breadcrumb}
        />

        {/* Dashboard grid */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Row 1: Map (left-big) + Stat cards (right-column) */}
          <div className="grid grid-cols-[1fr_260px] gap-4" style={{ minHeight: 360 }}>

            {/* World Map — hero card */}
            <WorldMap
              onSelectEntity={setSelectedEntity}
              selected={selectedEntity}
            />

            {/* Stat cards column */}
            <div className="flex flex-col gap-3">
              <StatCard
                label="Membership"
                value={data.membership}
                sub="Total active members"
                trend={data.membershipTrend}
                color="#2563EB"
              />
              <StatCard
                label="Baptisms"
                value={data.baptisms}
                sub="This year"
                trend={data.baptismsTrend}
                color="#16A34A"
              />
              <StatCard
                label="Net Growth"
                value={data.netGrowth}
                sub="Members gained this year"
                trend={data.netGrowthTrend}
                color="#7C3AED"
              />
              <StatCard
                label="Tithe / Member"
                value={data.tithe}
                sub="CPI-adjusted avg"
                trend={data.titheTrend}
                color="#F59E0B"
              />
            </div>
          </div>

          {/* Row 2: Charts side by side */}
          <div className="grid grid-cols-2 gap-4" style={{ height: 260 }}>
            <MembershipChart />
            <BaptismChart />
          </div>

          {/* Row 3: Alerts strip */}
          <AlertsStrip />
        </div>
      </div>
    </div>
  );
}
