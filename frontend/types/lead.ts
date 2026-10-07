/**
 * Lead types and status definitions matching the backend PostgreSQL and Pydantic schemas.
 */

export const FOLLOW_UP_STATUSES = [
  'Not Contacted',
  'Follow Up',
  'Contacted',
  'Qualified',
  'Converted',
  'Not Interested',
] as const;

export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  event: string;
  notes: string;
  follow_up_status: FollowUpStatus;
  created_at: string;
  updated_at: string;
}

export interface LeadCreateInput {
  name: string;
  company: string;
  email: string;
  event: string;
  notes?: string;
  follow_up_status?: FollowUpStatus;
}

export interface LeadUpdateInput {
  name?: string;
  company?: string;
  email?: string;
  event?: string;
  notes?: string;
  follow_up_status?: FollowUpStatus;
}

export interface LeadPaginationResponse {
  items: Lead[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AISummaryResponse {
  lead_id: string;
  summary: string;
}

export interface AIFollowUpResponse {
  lead_id: string;
  message: string;
}

export interface ApiError {
  message: string;
  status?: number;
  detail?: string;
}
