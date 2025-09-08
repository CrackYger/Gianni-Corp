export type UUID = string
export type ISO = string

export interface User { id: UUID; email?: string | null; name?: string | null }

export interface Request {
  id: UUID; user_id: UUID; user_email?: string | null;
  title: string; details?: string | null;
  offer_id?: UUID | null; status: 'New' | 'UnderReview' | 'Approved' | 'Rejected' | 'Closed';
  created_at: ISO; updated_at: ISO;
}
export interface RequestEvent {
  id: UUID; request_id: UUID; type: string; message?: string | null; by_admin: boolean; created_at: ISO;
}
export interface RequestFile { id: UUID; request_id: UUID; user_id: UUID; path: string; mime?: string | null; size?: number | null; created_at: ISO; }

export interface Ticket { id: UUID; request_id?: UUID | null; user_id: UUID; subject: string; status: 'open'|'closed'; created_at: ISO; updated_at: ISO; }
export interface TicketMessage { id: UUID; ticket_id: UUID; sender: 'user'|'admin'; body: string; created_at: ISO; }
