'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { FOLLOW_UP_STATUSES, FollowUpStatus, Lead, LeadCreateInput, LeadUpdateInput } from '../../types/lead';

interface LeadFormModalProps {
  isOpen: boolean;
  leadToEdit?: Lead | null;
  isLoading: boolean;
  onClose: () => void;
  onSubmitCreate: (data: LeadCreateInput) => Promise<void>;
  onSubmitUpdate: (id: string, data: LeadUpdateInput) => Promise<void>;
}

export function LeadFormModal({
  isOpen,
  leadToEdit,
  isLoading,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: LeadFormModalProps) {
  const isEditing = Boolean(leadToEdit);

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [event, setEvent] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState<FollowUpStatus>('Not Contacted');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Synchronize form values when modal opens or editing lead changes
  useEffect(() => {
    if (leadToEdit) {
      setName(leadToEdit.name);
      setCompany(leadToEdit.company);
      setEmail(leadToEdit.email);
      setEvent(leadToEdit.event);
      setNotes(leadToEdit.notes || '');
      setFollowUpStatus(leadToEdit.follow_up_status);
    } else {
      setName('');
      setCompany('');
      setEmail('');
      setEvent('');
      setNotes('');
      setFollowUpStatus('Not Contacted');
    }
    setErrors({});
    setServerError(null);
  }, [leadToEdit, isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim()) errs.name = 'Full name is required.';
    if (!company.trim()) errs.company = 'Company is required.';
    if (!event.trim()) errs.event = 'Event name is required.';

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      errs.email = 'Please enter a valid email address.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    try {
      if (isEditing && leadToEdit) {
        // Collect only changed fields for partial PATCH
        const updatePayload: LeadUpdateInput = {};
        if (name.trim() !== leadToEdit.name) updatePayload.name = name.trim();
        if (company.trim() !== leadToEdit.company) updatePayload.company = company.trim();
        if (email.trim() !== leadToEdit.email) updatePayload.email = email.trim();
        if (event.trim() !== leadToEdit.event) updatePayload.event = event.trim();
        if (notes.trim() !== (leadToEdit.notes || '')) updatePayload.notes = notes.trim();
        if (followUpStatus !== leadToEdit.follow_up_status) updatePayload.follow_up_status = followUpStatus;

        await onSubmitUpdate(leadToEdit.id, updatePayload);
      } else {
        const createPayload: LeadCreateInput = {
          name: name.trim(),
          company: company.trim(),
          email: email.trim(),
          event: event.trim(),
          notes: notes.trim(),
          follow_up_status: followUpStatus,
        };
        await onSubmitCreate(createPayload);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred while saving the lead.';
      setServerError(message);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-form-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 id="lead-form-modal-title" className="text-base font-semibold text-slate-900">
            {isEditing ? 'Edit Event Lead' : 'Add New Event Lead'}
          </h2>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {serverError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {serverError}
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="lead-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="lead-name"
                type="text"
                disabled={isLoading}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="e.g. Alex Johnson"
                className={`w-full px-3 py-2 text-sm bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                  errors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200'
                }`}
              />
              {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
            </div>

            {/* Company & Email 2-column on sm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="lead-company" className="block text-xs font-semibold text-slate-700 mb-1">
                  Company <span className="text-rose-500">*</span>
                </label>
                <input
                  id="lead-company"
                  type="text"
                  disabled={isLoading}
                  value={company}
                  onChange={(e) => {
                    setCompany(e.target.value);
                    if (errors.company) setErrors((prev) => ({ ...prev, company: '' }));
                  }}
                  placeholder="e.g. Vanguard Tech"
                  className={`w-full px-3 py-2 text-sm bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                    errors.company ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200'
                  }`}
                />
                {errors.company && <p className="text-xs text-rose-600 mt-1">{errors.company}</p>}
              </div>

              <div>
                <label htmlFor="lead-email" className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  id="lead-email"
                  type="email"
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder="alex@vanguard.io"
                  className={`w-full px-3 py-2 text-sm bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                    errors.email ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200'
                  }`}
                />
                {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Event & Status 2-column */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="lead-event" className="block text-xs font-semibold text-slate-700 mb-1">
                  Event / Conference <span className="text-rose-500">*</span>
                </label>
                <input
                  id="lead-event"
                  type="text"
                  disabled={isLoading}
                  value={event}
                  onChange={(e) => {
                    setEvent(e.target.value);
                    if (errors.event) setErrors((prev) => ({ ...prev, event: '' }));
                  }}
                  placeholder="e.g. AI Summit 2026"
                  className={`w-full px-3 py-2 text-sm bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                    errors.event ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200'
                  }`}
                />
                {errors.event && <p className="text-xs text-rose-600 mt-1">{errors.event}</p>}
              </div>

              <div>
                <label htmlFor="lead-status" className="block text-xs font-semibold text-slate-700 mb-1">
                  Follow-Up Status
                </label>
                <select
                  id="lead-status"
                  disabled={isLoading}
                  value={followUpStatus}
                  onChange={(e) => setFollowUpStatus(e.target.value as FollowUpStatus)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  {FOLLOW_UP_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="lead-notes" className="block text-xs font-semibold text-slate-700 mb-1">
                Interaction Notes
              </label>
              <textarea
                id="lead-notes"
                rows={4}
                disabled={isLoading}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Conversation details, client requirements, budget timeline, next steps..."
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-y"
              />
              <p className="text-xs text-slate-400 mt-1">
                Detailed notes enable AI to produce higher fidelity summaries and follow-ups.
              </p>
            </div>
          </div>

          {/* Form Footer */}
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-lg shadow-xs focus:outline-hidden focus:ring-2 focus:ring-slate-900/30 disabled:opacity-50 transition-colors"
            >
              {isLoading && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>{isEditing ? 'Save Changes' : 'Create Lead'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
