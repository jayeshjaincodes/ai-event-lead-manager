'use client';

import React from 'react';
import { Eye, Pencil, Sparkles, Trash2 } from 'lucide-react';
import { Lead } from '../../types/lead';
import { StatusBadge } from '../ui/StatusBadge';
import { LeadCard } from './LeadCard';

interface LeadTableProps {
  leads: Lead[];
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}

export function LeadTable({ leads, onView, onEdit, onDelete }: LeadTableProps) {
  return (
    <div>
      {/* Mobile / Tablet Cards View (below md breakpoint) */}
      <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Desktop Responsive Table (md and above) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200/90 bg-slate-50/70 text-slate-500 font-medium text-xs uppercase tracking-wider">
              <th scope="col" className="py-3 px-6">Lead</th>
              <th scope="col" className="py-3 px-6">Company</th>
              <th scope="col" className="py-3 px-6">Event</th>
              <th scope="col" className="py-3 px-6">Email</th>
              <th scope="col" className="py-3 px-6">Status</th>
              <th scope="col" className="py-3 px-6">Updated</th>
              <th scope="col" className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {leads.map((lead) => {
              const formattedDate = new Date(lead.updated_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <tr
                  key={lead.id}
                  className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                  onClick={() => onView(lead)}
                >
                  {/* Lead Name */}
                  <td className="py-3.5 px-6">
                    <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {lead.name}
                    </div>
                  </td>

                  {/* Company */}
                  <td className="py-3.5 px-6 font-medium text-slate-700">
                    {lead.company}
                  </td>

                  {/* Event */}
                  <td className="py-3.5 px-6 text-slate-600">
                    <span className="inline-block max-w-[180px] truncate" title={lead.event}>
                      {lead.event}
                    </span>
                  </td>

                  {/* Email */}
                  <td className="py-3.5 px-6 text-slate-600 font-mono text-xs">
                    <span className="inline-block max-w-[200px] truncate" title={lead.email}>
                      {lead.email}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-6">
                    <StatusBadge status={lead.follow_up_status} />
                  </td>

                  {/* Updated */}
                  <td className="py-3.5 px-6 text-xs text-slate-500 whitespace-nowrap">
                    {formattedDate}
                  </td>

                  {/* Actions */}
                  <td
                    className="py-3.5 px-6 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onView(lead)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                        title="View details & AI actions"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(lead)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
