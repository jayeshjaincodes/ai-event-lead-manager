'use client';

import React from 'react';
import { Plus, Sparkles } from 'lucide-react';

interface DashboardHeaderProps {
  totalLeads: number;
  onAddLead: () => void;
}

export function DashboardHeader({ totalLeads, onAddLead }: DashboardHeaderProps) {
  return (
    <header className="border-b border-slate-200/80 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-xs">
              EL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">EventLead</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  AI Native
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                AI-powered event lead management & follow-up acceleration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onAddLead}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-lg shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-900/30"
            >
              <Plus className="w-4 h-4" />
              <span>Add Lead</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
