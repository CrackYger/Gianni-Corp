import { supabase } from '../lib/supabase'
import type { Request, RequestEvent, RequestFile, Ticket, TicketMessage } from '../types/bridge'

const BUCKET = 'gc_uploads'

export const adminApi = {
  // Requests
  async listRequests(status: 'all'|'open'|'closed' = 'open'): Promise<Request[]> {
    let q = supabase.from('requests').select('*').order('updated_at', { ascending: false })
    if (status === 'open') q = q.in('status', ['New','UnderReview'])
    if (status === 'closed') q = q.in('status', ['Approved','Rejected','Closed'])
    const { data, error } = await q
    if (error) throw error
    return (data ?? []) as Request[]
  },
  async getRequestEvents(requestId: string): Promise<RequestEvent[]> {
    const { data, error } = await supabase.from('request_events')
      .select('*').eq('request_id', requestId).order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as RequestEvent[]
  },
  async getRequestFiles(requestId: string): Promise<RequestFile[]> {
    const { data, error } = await supabase.from('request_files')
      .select('*').eq('request_id', requestId).order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as RequestFile[]
  },
  async sendAdminEvent(requestId: string, type: string, message?: string): Promise<RequestEvent> {
    const { data, error } = await supabase.from('request_events')
      .insert({ request_id: requestId, type, message: message ?? null, by_admin: true })
      .select().single()
    if (error) throw error
    return data as RequestEvent
  },
  async setRequestStatus(requestId: string, status: string){
    const { error } = await supabase.from('requests').update({ status }).eq('id', requestId)
    if (error) throw error
  },
  async signedUrl(path: string): Promise<string | null> {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600)
    if (error) return null
    return data?.signedUrl ?? null
  },

  // Tickets
  async listTickets(): Promise<Ticket[]> {
    const { data, error } = await supabase.from('tickets').select('*').order('updated_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as Ticket[]
  },
  async getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    const { data, error } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as TicketMessage[]
  },
  async sendAdminMessage(ticketId: string, body: string): Promise<TicketMessage> {
    const { data, error } = await supabase.from('ticket_messages')
      .insert({ ticket_id: ticketId, sender: 'admin', body })
      .select().single()
    if (error) throw error
    return data as TicketMessage
  },
  async createTicketFromRequest(requestId: string, subject: string): Promise<Ticket> {
    // We assume an RPC or DB trigger sets updated_at; otherwise we set it manually after insert
    const { data, error } = await supabase.from('tickets').insert({ request_id: requestId, subject, status: 'open' }).select().single()
    if (error) throw error
    return data as Ticket
  },
}
