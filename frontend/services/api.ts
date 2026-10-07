import {
  AIFollowUpResponse,
  AISummaryResponse,
  FollowUpStatus,
  Lead,
  LeadCreateInput,
  LeadPaginationResponse,
  LeadUpdateInput,
} from '../types/lead';

/**
 * Normalized API Base URL from NEXT_PUBLIC_API_BASE_URL.
 * Supports both domain format (e.g. https://my-backend.onrender.com)
 * and prefixed format (e.g. https://my-backend.onrender.com/api/v1).
 * Defaults to http://localhost:8001 in local development.
 */
const rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const cleanBaseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
const API_BASE_URL = cleanBaseUrl
  ? (cleanBaseUrl.endsWith('/api/v1') ? cleanBaseUrl : `${cleanBaseUrl}/api/v1`)
  : '/api/v1';

export class ApiClientError extends Error {
  status: number;
  detail?: string;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Normalizes FastAPI/Pydantic error responses into a human-readable string.
 */
function parseErrorMessage(data: unknown, status: number): string {
  if (typeof data === 'object' && data !== null && 'detail' in data) {
    const detail = (data as { detail: unknown }).detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail)) {
      // Pydantic validation errors array
      return detail
        .map((err) => {
          if (typeof err === 'object' && err !== null && 'msg' in err) {
            const loc = Array.isArray((err as { loc?: unknown[] }).loc)
              ? (err as { loc: unknown[] }).loc.slice(1).join('.')
              : '';
            return loc ? `${loc}: ${(err as { msg: string }).msg}` : (err as { msg: string }).msg;
          }
          return JSON.stringify(err);
        })
        .join('; ');
    }
  }

  switch (status) {
    case 400:
      return 'Invalid request data provided.';
    case 404:
      return 'The requested lead could not be found.';
    case 422:
      return 'Validation failed. Please verify the submitted information.';
    case 429:
      return 'Rate limit reached. Please wait a moment before trying again.';
    case 502:
    case 503:
      return 'The service is temporarily unavailable. Please retry shortly.';
    case 504:
      return 'The request timed out. Please try again.';
    default:
      return status >= 500
        ? 'A server error occurred. Please try again later.'
        : `Request failed with status ${status}.`;
  }
}

/**
 * Centralized fetch wrapper with timeout, JSON parsing, and unified error handling.
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    let responseData: unknown = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      const message = parseErrorMessage(responseData, response.status);
      throw new ApiClientError(message, response.status, typeof responseData === 'string' ? responseData : undefined);
    }

    return responseData as T;
  } catch (error: unknown) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiClientError('Request timed out. Please try again.', 504);
    }
    throw new ApiClientError(
      'Unable to connect to the backend server. Please check your network.',
      0
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export const leadApi = {
  /**
   * Retrieves paginated leads with database-side search and status filtering.
   */
  async getLeads(params: {
    search?: string;
    follow_up_status?: FollowUpStatus;
    page?: number;
    page_size?: number;
  } = {}): Promise<LeadPaginationResponse> {
    const query = new URLSearchParams();
    if (params.search?.trim()) {
      query.set('search', params.search.trim());
    }
    if (params.follow_up_status) {
      query.set('follow_up_status', params.follow_up_status);
    }
    if (params.page && params.page > 0) {
      query.set('page', params.page.toString());
    }
    if (params.page_size && params.page_size > 0) {
      query.set('page_size', params.page_size.toString());
    }

    const queryString = query.toString();
    const endpoint = `/leads${queryString ? `?${queryString}` : ''}`;
    return request<LeadPaginationResponse>(endpoint, { method: 'GET' });
  },

  /**
   * Retrieves a single lead by UUID.
   */
  async getLead(id: string): Promise<Lead> {
    return request<Lead>(`/leads/${encodeURIComponent(id)}`, { method: 'GET' });
  },

  /**
   * Creates a new lead.
   */
  async createLead(data: LeadCreateInput): Promise<Lead> {
    return request<Lead>('/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Partially updates a lead via PATCH. Only sends modified fields.
   */
  async updateLead(id: string, data: LeadUpdateInput): Promise<Lead> {
    return request<Lead>(`/leads/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Deletes a lead by UUID.
   */
  async deleteLead(id: string): Promise<void> {
    return request<void>(`/leads/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  /**
   * Generates a concise AI summary of lead interaction notes.
   */
  async summarizeNotes(id: string): Promise<AISummaryResponse> {
    return request<AISummaryResponse>(`/leads/${encodeURIComponent(id)}/summarize`, {
      method: 'POST',
    });
  },

  /**
   * Generates a personalized AI follow-up message draft.
   */
  async draftFollowUp(id: string): Promise<AIFollowUpResponse> {
    return request<AIFollowUpResponse>(`/leads/${encodeURIComponent(id)}/follow-up`, {
      method: 'POST',
    });
  },
};
