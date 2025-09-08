
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'

const app = express()

const allowed = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
app.use(cors({ origin(origin, cb){ if(!origin) return cb(null,true); if(!allowed.length || allowed.includes(origin)) return cb(null,true); return cb(new Error('CORS: ' + origin)) } }))
app.use(express.json({ limit: '5mb' }))

const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const BUCKET = 'gc_uploads'

app.get('/health', (_req, res) => res.json({ ok: true }))

// Requests
app.get('/api/admin/requests', async (_req, res) => {
  const { data, error } = await supa.from('requests').select('*').order('updated_at', { ascending: false })
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true, data })
})

app.get('/api/admin/requests/:id/files', async (req, res) => {
  const { id } = req.params
  const { data, error } = await supa.from('request_files').select('*').eq('request_id', id).order('created_at', { ascending: true })
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true, data })
})

app.post('/api/admin/requests/:id/status', async (req, res) => {
  const { id } = req.params
  const { status } = req.body || {}
  const { error } = await supa.from('requests').update({ status }).eq('id', id)
  if (error) return res.status(500).json({ ok: false, error: error.message })
  await supa.from('request_events').insert({ request_id: id, type: 'StatusChanged', message: status, by_admin: true })
  res.json({ ok: true })
})

app.post('/api/admin/requests/:id/info-request', async (req, res) => {
  const { id } = req.params
  const { message } = req.body || {}
  const { error } = await supa.from('request_events').insert({ request_id: id, type: 'InfoRequested', message: message ?? null, by_admin: true })
  if (error) return res.status(500).json({ ok: false, error: error.message })
  await supa.from('requests').update({ status: 'InfoRequested' }).eq('id', id)
  res.json({ ok: true })
})

// Tickets
app.get('/api/admin/tickets', async (_req, res) => {
  const { data, error } = await supa.from('tickets').select('*').order('updated_at', { ascending: false })
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true, data })
})

app.get('/api/admin/tickets/:id', async (req, res) => {
  const { id } = req.params
  const { data: ticket } = await supa.from('tickets').select('*').eq('id', id).single()
  const { data: messages } = await supa.from('ticket_messages').select('*').eq('ticket_id', id).order('created_at', { ascending: true })
  const { data: files } = await supa.from('ticket_files').select('*').eq('ticket_id', id).order('created_at', { ascending: true })
  res.json({ ok: true, data: { ticket, messages, files } })
})

app.post('/api/admin/tickets/:id/reply', async (req, res) => {
  const { id } = req.params
  const { body } = req.body || {}
  const { error } = await supa.from('ticket_messages').insert({ ticket_id: id, sender: 'admin', body })
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true })
})

// Signed URL for any storage path (admin only; backend is trusted)
app.get('/api/admin/files/signed-url', async (req, res) => {
  const path = req.query.path
  if (typeof path !== 'string' || !path) return res.status(400).json({ ok: false, error: 'path required' })
  const { data, error } = await supa.storage.from(BUCKET).createSignedUrl(path, 3600)
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true, url: data?.signedUrl })
})

const port = process.env.PORT || 3100
app.listen(port, () => console.log(`Giannicorp Admin API (uploads) on :${port}`))
