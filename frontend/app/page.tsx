'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  FollowUpStatus,
  Lead,
  LeadCreateInput,
  LeadUpdateInput,
} from '../types/lead';
import { leadApi } from '../services/api';
import { DashboardHeader } from '../components/leads/DashboardHeader';
import { LeadFilters } from '../components/leads/LeadFilters';
import { LeadTable } from '../components/leads/LeadTable';
import { Pagination } from '../components/leads/Pagination';
import { LeadFormModal } from '../components/leads/LeadFormModal';
import { LeadDetailModal } from '../components/leads/LeadDetailModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ToastContainer, ToastMessage } from '../components/ui/Toast';

export default function DashboardPage() {
  // Query & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<FollowUpStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Data State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal & Selection State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const [selectedDetailLead, setSelectedDetailLead] = useState<Lead | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Debounce search query input (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset to page 1 whenever search query or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedStatus]);

  // Fetch leads from backend
  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await leadApi.getLeads({
        search: debouncedSearch,
        follow_up_status: selectedStatus || undefined,
        page: currentPage,
        page_size: pageSize,
      });
      setLeads(res.items);
      setTotalLeads(res.total);
      setTotalPages(res.total_pages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve event leads.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedStatus, currentPage, pageSize]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Handlers
  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedStatus('');
  };

  const handleOpenAddLead = () => {
    setLeadToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditLead = (lead: Lead) => {
    setLeadToEdit(lead);
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = (lead: Lead) => {
    setSelectedDetailLead(lead);
    setIsDetailModalOpen(true);
  };

  const handleOpenDelete = (lead: Lead) => {
    setLeadToDelete(lead);
  };

  const handleSubmitCreate = async (data: LeadCreateInput) => {
    setIsFormSubmitting(true);
    try {
      await leadApi.createLead(data);
      setIsFormModalOpen(false);
      addToast('success', `Lead "${data.name}" created successfully.`);
      fetchLeads();
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleSubmitUpdate = async (id: string, data: LeadUpdateInput) => {
    setIsFormSubmitting(true);
    try {
      const updated = await leadApi.updateLead(id, data);
      setIsFormModalOpen(false);
      addToast('success', `Lead "${updated.name}" updated successfully.`);
      // Update local selection if detail modal is open
      if (selectedDetailLead?.id === id) {
        setSelectedDetailLead(updated);
      }
      fetchLeads();
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    setIsDeleting(true);
    try {
      await leadApi.deleteLead(leadToDelete.id);
      addToast('success', `Lead "${leadToDelete.name}" was deleted.`);
      if (selectedDetailLead?.id === leadToDelete.id) {
        setIsDetailModalOpen(false);
        setSelectedDetailLead(null);
      }
      setLeadToDelete(null);
      fetchLeads();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete lead.';
      addToast('error', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const isFiltered = Boolean(debouncedSearch.trim() || selectedStatus);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Primary Header */}
      <DashboardHeader totalLeads={totalLeads} onAddLead={handleOpenAddLead} />

      {/* Search & Status Filters */}
      <LeadFilters
        searchQuery={searchQuery}
        selectedStatus={selectedStatus}
        onSearchChange={setSearchQuery}
        onStatusChange={setSelectedStatus}
        onClearFilters={handleClearFilters}
        totalResults={totalLeads}
        isLoading={isLoading}
        hasError={Boolean(errorMessage)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          {isLoading ? (
            <LoadingSkeleton />
          ) : errorMessage ? (
            <ErrorState message={errorMessage} onRetry={fetchLeads} />
          ) : leads.length === 0 ? (
            <EmptyState
              isFiltered={isFiltered}
              onAddLead={handleOpenAddLead}
              onClearFilters={handleClearFilters}
            />
          ) : (
            <>
              <LeadTable
                leads={leads}
                onView={handleOpenDetail}
                onEdit={handleOpenEditLead}
                onDelete={handleOpenDelete}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalLeads}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </main>

      {/* Add / Edit Lead Modal */}
      <LeadFormModal
        isOpen={isFormModalOpen}
        leadToEdit={leadToEdit}
        isLoading={isFormSubmitting}
        onClose={() => setIsFormModalOpen(false)}
        onSubmitCreate={handleSubmitCreate}
        onSubmitUpdate={handleSubmitUpdate}
      />

      {/* Lead Detail & AI Modal */}
      <LeadDetailModal
        lead={selectedDetailLead}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDetailLead(null);
        }}
        onEdit={(lead) => {
          setIsDetailModalOpen(false);
          handleOpenEditLead(lead);
        }}
        onDelete={(lead) => {
          setIsDetailModalOpen(false);
          handleOpenDelete(lead);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(leadToDelete)}
        title="Delete this lead?"
        description={`Are you sure you want to delete ${leadToDelete?.name || 'this lead'}? This action cannot be undone.`}
        confirmLabel="Delete Lead"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setLeadToDelete(null)}
      />
    </div>
  );
}
