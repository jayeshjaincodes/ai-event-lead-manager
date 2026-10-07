'use client';

import React from 'react';
import { Calendar, Eye, Mail, MoreHorizontal, Pencil, Sparkles, Trash2 } from 'lucide-react';
import { Lead } from '../../types/lead';
import { StatusBadge } from '../ui/StatusBadge';

interface LeadCardProps {
  lead: Lead;
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}

export function LeadCard({ lead, onView, onEdit, onDelete }: LeadCardProps) {
  const formattedDate = new Date(lead.updated_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3
            onClick={() => onView(lead)}
            className="text-base font-semibold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors"
          >
            {lead.name}
          </h3>
          <p className="text-sm font-medium text-slate-600 mt-0.5">{lead.company}</p>
        </div>
        <StatusBadge status={lead.follow_up_status} />
      </div>

      <div className="mt-3.5 space-y-1.5 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{lead.event}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <a
            href={`mailto:${lead.email}`}
            className="truncate hover:text-indigo-600 transition-colors"
          >
            {lead.email}
          </a>
        </div>
      </div>

      {lead.notes && (
        <div className="mt-3 p-2.5 rounded-lg bg-slate-50 text-xs text-slate-600 line-clamp-2 italic border border-slate-100">
          &ldquo;{lead.notes}&rdquo;
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>Updated {formattedDate}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onView(lead)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-md transition-colors"
            title="View lead details & AI actions"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(lead)}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
            title="Edit lead"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(lead)}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            title="Delete lead"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
