"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function syncApplicationsAction(listingId: string, userEmail: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  
  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn("N8N_WEBHOOK_URL is not configured")
    return
  }

  // Fire webhook to n8n
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.user.id,
        listingId,
        email: userEmail,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!res.ok) {
      console.error("N8n webhook failed:", await res.text());
    }
  } catch(e) {
    console.error("Failed to call N8n webhook", e);
  }
}
