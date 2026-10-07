'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Check,
  Clock,
  Copy,
  FileText,
  Mail,
  Pencil,
  Send,
  Sparkles,
  Trash2,
  X,
  AlertCircle,
} from 'lucide-react';
import { Lead } from '../../types/lead';
import { StatusBadge } from '../ui/StatusBadge';
import { leadApi } from '../../services/api';

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}

export function LeadDetailModal({
  lead,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: LeadDetailModalProps) {
  // AI States
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [isDrafting, setIsDrafting] = useState(false);
  const [followUpMessage, setFollowUpMessage] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset AI states when opening another lead
  useEffect(() => {
    setSummary(null);
    setSummaryError(null);
    setFollowUpMessage(null);
    setDraftError(null);
    setCopied(false);
  }, [lead?.id]);

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !lead) return null;

  const hasNotes = Boolean(lead.notes && lead.notes.trim().length > 0);

  const handleSummarize = async () => {
    if (!hasNotes) return;
    setIsSummarizing(true);
    setSummaryError(null);
    try {
      const res = await leadApi.summarizeNotes(lead.id);
      setSummary(res.summary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate summary.';
      setSummaryError(msg);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDraftFollowUp = async () => {
    setIsDrafting(true);
    setDraftError(null);
    try {
      const res = await leadApi.draftFollowUp(lead.id);
      setFollowUpMessage(res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to draft follow-up.';
      setDraftError(msg);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCopy = async () => {
    if (!followUpMessage) return;
    try {
      await navigator.clipboard.writeText(followUpMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const formattedCreated = new Date(lead.created_at).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const formattedUpdated = new Date(lead.updated_at).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-detail-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 id="lead-detail-modal-title" className="text-xl font-bold text-slate-900">
                {lead.name}
              </h2>
              <StatusBadge status={lead.follow_up_status} />
            </div>
            <p className="text-sm font-medium text-slate-600 mt-1">{lead.company}</p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(lead)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(lead)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close detail modal"
              className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 ml-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Email Address</span>
              <div className="flex items-center gap-2 text-sm text-slate-900 font-medium">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <a href={`mailto:${lead.email}`} className="hover:text-indigo-600 transition-colors truncate">
                  {lead.email}
                </a>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Event Met At</span>
              <div className="flex items-center gap-2 text-sm text-slate-900 font-medium">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{lead.event}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Created</span>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{formattedCreated}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Last Updated</span>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{formattedUpdated}</span>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">Interaction Notes</h3>
            </div>
            {hasNotes ? (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {lead.notes}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-50/60 border border-dashed border-slate-200 text-xs text-slate-400 italic">
                No interaction notes recorded for this lead yet. Click &ldquo;Edit&rdquo; above to record notes.
              </div>
            )}
          </div>

          {/* AI Features Section */}
          <div className="pt-2 border-t border-slate-100 space-y-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">AI Intelligence Suite</h3>
              <span className="text-xs text-slate-400">(Google Gemini)</span>
            </div>

            {/* AI Action 1: Summarize Notes */}
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Executive Summary
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Synthesizes meeting notes into a concise factual briefing.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!hasNotes || isSummarizing}
                  onClick={handleSummarize}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors shrink-0"
                >
                  {isSummarizing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Summarizing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Summarize Notes</span>
                    </>
                  )}
                </button>
              </div>

              {!hasNotes && (
                <p className="text-xs text-slate-500 italic">
                  Note: Summarization requires interaction notes.
                </p>
              )}

              {summaryError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{summaryError}</span>
                </div>
              )}

              {summary && (
                <div className="p-3.5 rounded-lg bg-white border border-indigo-200/80 shadow-xs space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700">
                    <Sparkles className="w-3 h-3" />
                    <span>AI Generated Summary</span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed">{summary}</p>
                </div>
              )}
            </div>

            {/* AI Action 2: Draft Follow-up */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Personalized Follow-up
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Drafts a tailored business message incorporating event & pipeline context.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isDrafting}
                  onClick={handleDraftFollowUp}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 rounded-lg shadow-xs transition-colors shrink-0"
                >
                  {isDrafting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Drafting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Draft Follow-up</span>
                    </>
                  )}
                </button>
              </div>

              {draftError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{draftError}</span>
                </div>
              )}

              {followUpMessage && (
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                      <Send className="w-3 h-3 text-indigo-600" />
                      <span>AI Follow-Up Draft</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Draft</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 rounded-md bg-slate-50 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans border border-slate-100">
                    {followUpMessage}
                  </div>
                  <p className="text-[11px] text-slate-400 italic">
                    Review and customize this draft before sending through your email or CRM.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
