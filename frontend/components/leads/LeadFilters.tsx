'use client';

import React from 'react';
import { Filter, RotateCcw, Search, X } from 'lucide-react';
import { FOLLOW_UP_STATUSES, FollowUpStatus } from '../../types/lead';

interface LeadFiltersProps {
  searchQuery: string;
  selectedStatus: FollowUpStatus | '';
  onSearchChange: (query: string) => void;
  onStatusChange: (status: FollowUpStatus | '') => void;
  onClearFilters: () => void;
  totalResults: number;
  isLoading?: boolean;
  hasError?: boolean;
}

export function LeadFilters({
  searchQuery,
  selectedStatus,
  onSearchChange,
  onStatusChange,
  onClearFilters,
  totalResults,
  isLoading = false,
  hasError = false,
}: LeadFiltersProps) {
  const hasActiveFilters = Boolean(searchQuery.trim() || selectedStatus);

  return (
    <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search leads by name, company, email, or event..."
              className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search text"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Select Filter */}
          <div className="relative sm:w-52">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Filter className="w-4 h-4" />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value as FollowUpStatus | '')}
              aria-label="Filter by pipeline status"
              className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
            >
              <option value="">All statuses</option>
              {FOLLOW_UP_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Clear Filters & Counter */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 md:pt-0">
          {!isLoading && !hasError && (
            <span className="text-xs text-slate-500 font-medium">
              {totalResults} {totalResults === 1 ? 'lead' : 'leads'} found
            </span>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear filters</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
