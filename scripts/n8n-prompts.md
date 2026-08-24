# Prompts para el AI Workflow Builder de n8n Cloud

Ver contexto completo en `CLAUDE.md`, sección "Session 24". Estos dos prompts se pegan tal cual en el "AI Workflow Builder" de n8n Cloud (uno por workflow) para que la IA de n8n arme los nodos sola. Usan las 3 RPCs de `supabase/migrations/017_followup_replies.sql` — llamadas con la anon key (pública, no es secreta) en vez de la service_role key, a propósito, porque n8n Cloud es una plataforma de terceros.

## Prompt 1 — Workflow "SiteSafe Follow-up Sender"

```
Create a workflow named "SiteSafe Follow-up Sender" with this logic:

1. Schedule Trigger: runs daily at 9:30am America/New_York.

2. HTTP Request node "Get Stage 1 Candidates": POST to
   https://mvzolbabbkedmlhqhiwi.supabase.co/rest/v1/rpc/get_followup_candidates
   Headers: apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12em9sYmFiYmtlZG1saHFoaXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MDgzOTAsImV4cCI6MjA4Nzk4NDM5MH0.F-Ywz77JpmL-UqYIMR4p2oTcqrsFNvh8c5v-MNOXtzU
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12em9sYmFiYmtlZG1saHFoaXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MDgzOTAsImV4cCI6MjA4Nzk4NDM5MH0.F-Ywz77JpmL-UqYIMR4p2oTcqrsFNvh8c5v-MNOXtzU
            Content-Type: application/json
   Body (JSON): {"stage": 1}
   Response is an array of objects: id, email, name, website, contacted_at.

3. Split the array into individual items and loop over each one.

4. For each item, HTTP Request node "Send Follow-up 1" — POST to https://api.resend.com/emails
   Headers: Authorization: Bearer {{RESEND_API_KEY}} (create an n8n credential named "Resend API" for this, I'll paste my key into it), Content-Type: application/json
   Body (JSON):
   {
     "from": "Lily from SiteSafe <outreach@adalawsuitcheck.com>",
     "to": "={{ $json.email }}",
     "subject": "=Following up — {{ $json.website }}",
     "text": "=Hi {{ $json.name }},\n\nJust following up on my note about {{ $json.website }} — did you get a chance to look?\n\nHere's the link again: https://adalawsuitcheck.com/scan?url={{ $json.website }}\n\nLily\nSiteSafe · adalawsuitcheck.com"
   }

5. After each send, HTTP Request node "Mark Stage 1 Sent" — POST to
   https://mvzolbabbkedmlhqhiwi.supabase.co/rest/v1/rpc/mark_followup_sent
   Same apikey/Authorization headers as step 2.
   Body (JSON): {"contact_id": "={{ $json.id }}", "stage": 1}

6. Repeat steps 2-5 as a second branch for stage 2: call get_followup_candidates with {"stage": 2}, send a different email (subject "One last thing about {{ $json.website }}", a shorter final nudge), and call mark_followup_sent with stage 2.
```

## Prompt 2 — Workflow "SiteSafe Reply Detector"

```
Create a workflow named "SiteSafe Reply Detector" with this logic:

1. Email Trigger (IMAP) node — checks my inbox for new unread emails every 15 minutes. I will connect my own email credential to this node.

2. From the trigger output, get the sender's email address and the email body text.

3. AI node (Chat model, I'll connect my own OpenAI or Gemini credential): classify the email body into exactly one of these 4 words: interested, not_interested, unsubscribe, other.
   Prompt: "Classify this email reply into exactly one word: interested, not_interested, unsubscribe, or other. Reply with ONLY that one word.\n\nEmail: {{ $json.body }}"

4. HTTP Request node "Mark Reply" — POST to
   https://mvzolbabbkedmlhqhiwi.supabase.co/rest/v1/rpc/mark_reply_received
   Headers: apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12em9sYmFiYmtlZG1saHFoaXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MDgzOTAsImV4cCI6MjA4Nzk4NDM5MH0.F-Ywz77JpmL-UqYIMR4p2oTcqrsFNvh8c5v-MNOXtzU
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12em9sYmFiYmtlZG1saHFoaXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MDgzOTAsImV4cCI6MjA4Nzk4NDM5MH0.F-Ywz77JpmL-UqYIMR4p2oTcqrsFNvh8c5v-MNOXtzU
            Content-Type: application/json
   Body (JSON): {"contact_email": "={{ $json.from }}", "classification": "={{ $json.classification }}"}

5. Switch node on the classification value, 4 branches:
   - "interested": send a reply email (via Resend API, https://api.resend.com/emails, same auth pattern as before) with subject "Re: your SiteSafe report" and a body pointing them to adalawsuitcheck.com pricing.
   - "unsubscribe": send a reply confirming: "You've been removed from our list and won't hear from us again. Sorry for the bother."
   - "not_interested": do nothing further.
   - "other": do nothing further (leave for manual review).
```

## Estado (actualizar a medida que avance)

- [ ] Prompt 1 pegado en n8n
- [ ] Workflow 1 armado y revisado
- [ ] Credencial de Resend conectada
- [ ] Workflow 1 probado a mano ("Execute Workflow") antes de activar
- [ ] Workflow 1 activado en automático
- [ ] Prompt 2 pegado en n8n
- [ ] Workflow 2 armado y revisado
- [ ] Credenciales de email + IA (OpenAI/Gemini) conectadas
- [ ] Workflow 2 probado a mano antes de activar
- [ ] Workflow 2 activado en automático
