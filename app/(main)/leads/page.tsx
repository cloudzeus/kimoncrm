"use client";

import { LeadsManager } from "@/components/leads/leads-manager";

export default function LeadsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold uppercase tracking-tight">LEADS</h1>
        <p className="text-muted-foreground mt-2">
          Manage leads, opportunities, RFPs, and convert to projects
        </p>
      </div>

      <LeadsManager />
    </div>
  );
}


