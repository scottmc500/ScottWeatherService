// Calendar-specific types and interfaces

export interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string | null;
    date?: string | null;
  };
  end: {
    dateTime?: string | null;
    date?: string | null;
  };
  location?: string | null;
  description?: string | null;
}

export interface CalendarRequest {
  accessToken: string;
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}

export interface CalendarEventsRequest {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  calendarId?: string;
}

export interface CalendarAuthRequest {
  googleToken: {
    access_token: string;
    refresh_token?: string;
    scope: string;
    token_type?: string;
    expiry_date?: number;
  };
}

export interface CalendarStatusResponse {
  hasAccess: boolean;
  error?: string;
}

export interface CalendarEventsResponse {
  success: boolean;
  events: CalendarEvent[];
  count: number;
  error?: string;
}
