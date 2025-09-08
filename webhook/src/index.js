
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

// CORS
const allowed = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
app.use(cors({
  origin: function(origin, cb){
    if (!origin) return cb(null, true)
    if (allowed.length === 0 || allowed.includes(origin)) return cb(null, true)
    return cb(new Error('Not allowed by CORS: ' + origin))
  }
}))

// Capture raw body for signature verification
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}))

// Init SQLite
const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir)
const db = new Database(path.join(dataDir, 'admin.db'))
db.pragma('journal_mode = WAL')

db.exec(`
  create table if not exists requests (
    id text primary key,
    user_id text,
    user_email text,
    title text,
    details text,
    status text,
    created_at text,
    updated_at text
  );
  create table if not exists request_events (
    id text primary key,
    request_id text,
    type text,
    message text,
    by_admin integer,
    created_at text
  );
  create table if not exists tickets (
    id text primary key,
    user_id text,
    user_email text,
    subject text,
    status text,
    created_at text,
    updated_at text
  );
  create table if not exists ticket_messages (
    id text primary key,
    ticket_id text,
    sender text,
    body text,
    created_at text
  );
`)

// Helpers
function verifySignature(req){
  const sig = req.get('X-Giannicorp-Signature') // sha256=base64
  const secret = process.env.GIANNICORP_WEBHOOK_SECRET
  if (!secret) return true // no secret → no verification
  if (!sig || !sig.startsWith('sha256=')) return false
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(req.rawBody).digest('base64')
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
}

function upsertRequest(r, user){
  db.prepare(`insert into requests (id,user_id,user_email,title,details,status,created_at,updated_at)
    values (@id,@user_id,@user_email,@title,@details,@status,@created_at,@updated_at)
    on conflict(id) do update set
      title=excluded.title,
      details=excluded.details,
      status=excluded.status,
      updated_at=excluded.updated_at,
      user_id=excluded.user_id,
      user_email=excluded.user_email
  `).run({
    id: r.id,
    user_id: r.user_id || user?.id || null,
    user_email: user?.email || null,
    title: r.title || '',
    details: r.details || null,
    status: r.status || 'Submitted',
    created_at: r.created_at || new Date().toISOString(),
    updated_at: r.updated_at || new Date().toISOString()
  })
}

// Inbox endpoint
app.post('/api/giannicorp/inbox', (req, res) => {
  try {
    if (!verifySignature(req)) return res.status(401).json({ ok: false, error: 'Bad signature' })

    const event = req.get('X-Giannicorp-Event')
    const { data } = req.body || {}

    switch (event) {
      case 'request.created': {
        upsertRequest(data.request, data.user)
        db.prepare('insert into request_events (id, request_id, type, message, by_admin, created_at) values (?,?,?,?,?,?)')
          .run(`ev_${Date.now()}a`, data.request.id, 'Submitted', 'Anfrage eingegangen', 0, new Date().toISOString())
        break
      }
      case 'request.event': {
        upsertRequest({ id: data.request_id, status: data.event?.type === 'InfoProvided' ? 'UnderReview' : undefined }, data.user)
        db.prepare('insert into request_events (id, request_id, type, message, by_admin, created_at) values (?,?,?,?,?,?)')
          .run(data.event.id || `ev_${Date.now()}b`, data.request_id, data.event.type, data.event.message || null, data.event.by_admin ? 1 : 0, data.event.created_at || new Date().toISOString())
        break
      }
      case 'ticket.created': {
        const t = data.ticket
        db.prepare(`insert into tickets (id,user_id,user_email,subject,status,created_at,updated_at)
          values (?,?,?,?,?,?,?)
          on conflict(id) do update set subject=excluded.subject, status=excluded.status, updated_at=excluded.updated_at, user_email=excluded.user_email, user_id=excluded.user_id`)
          .run(t.id, data.user?.id || null, data.user?.email || null, t.subject, t.status || 'Open', t.created_at || new Date().toISOString(), t.updated_at || new Date().toISOString())
        break
      }
      case 'ticket.message': {
        const m = data.message
        db.prepare('insert into ticket_messages (id, ticket_id, sender, body, created_at) values (?,?,?,?,?)')
          .run(m.id, data.ticket_id, m.sender, m.body, m.created_at || new Date().toISOString())
        // touch ticket updated_at
        db.prepare('update tickets set updated_at = ? where id = ?').run(new Date().toISOString(), data.ticket_id)
        break
      }
      default:
        return res.status(400).json({ ok: false, error: 'Unknown event: ' + event })
    }

    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ ok: false, error: 'server_error' })
  }
})

app.get('/health', (_req, res) => res.json({ ok: true }))

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`Giannicorp Admin Webhook listening on :${port}`))
