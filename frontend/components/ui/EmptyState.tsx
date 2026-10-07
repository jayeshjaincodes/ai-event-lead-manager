'use client';

import React from 'react';
import { Plus, RotateCcw, Users } from 'lucide-react';

interface EmptyStateProps {
  isFiltered: boolean;
  onAddLead: () => void;
  onClearFilters: () => void;
}

export function EmptyState({ isFiltered, onAddLead, onClearFilters }: EmptyStateProps) {
  if (isFiltered) {
    return (
      <div className="py-16 px-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center mb-3">
          <RotateCcw className="w-5 h-5" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">No leads match your filters</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
          Try adjusting your search keywords or clearing status filters to find leads.
        </p>
        <div className="mt-5">
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear filters</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center mb-3">
        <Users className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">No leads yet</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
        Add your first event lead to get started with pipeline tracking and AI-powered follow-ups.
      </p>
      <div className="mt-5">
        <button
          type="button"
          onClick={onAddLead}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Lead</span>
        </button>
      </div>
    </div>
  );
}
