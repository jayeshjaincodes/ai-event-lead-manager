import React from 'react';
import { FollowUpStatus } from '../../types/lead';

interface StatusBadgeProps {
  status: FollowUpStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  // Domain-curated color mapping with subtle indicator dot
  const config: Record<
    FollowUpStatus,
    { dot: string; bg: string; text: string; border: string }
  > = {
    'Not Contacted': {
      dot: 'bg-slate-400',
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      border: 'border-slate-200',
    },
    'Follow Up': {
      dot: 'bg-amber-500',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
    },
    Contacted: {
      dot: 'bg-sky-500',
      bg: 'bg-sky-50',
      text: 'text-sky-800',
      border: 'border-sky-200',
    },
    Qualified: {
      dot: 'bg-indigo-500',
      bg: 'bg-indigo-50',
      text: 'text-indigo-800',
      border: 'border-indigo-200',
    },
    Converted: {
      dot: 'bg-emerald-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
    },
    'Not Interested': {
      dot: 'bg-zinc-400',
      bg: 'bg-zinc-100',
      text: 'text-zinc-600',
      border: 'border-zinc-200',
    },
  };

  const style = config[status] || config['Not Contacted'];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
}
