import { NextResponse } from 'next/server'

const N8N_URL = 'https://samsnwn.app.n8n.cloud/webhook/applicant-csv-upload'

export async function POST(request: Request) {
  let text: string
  try {
    text = await request.text()
  } catch (err) {
    return NextResponse.json({ error: 'Could not read request body' }, { status: 400 })
  }

  const contentType = request.headers.get('content-type') ?? 'text/csv'

  try {
    const resp = await fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body: text,
    })

    const respText = await resp.text()
    try {
      const json = JSON.parse(respText)
      return NextResponse.json({ ok: resp.ok, status: resp.status, data: json }, { status: resp.ok ? 200 : 502 })
    } catch {
      // Non-JSON response from n8n — return as text
      return NextResponse.json({ ok: resp.ok, status: resp.status, data: respText }, { status: resp.ok ? 200 : 502 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 502 })
  }
}
