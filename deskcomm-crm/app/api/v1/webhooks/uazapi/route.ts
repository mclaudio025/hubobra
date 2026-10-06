import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";
import { fail, ok } from "@/lib/api/wrappers";
import { logger } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("+") ? digits : `+${digits}`;
}

export async function POST(req: NextRequest): Promise<Response> {
  const requestId = randomUUID();
  let rawBody = "";
  try {
    rawBody = await req.text();
  } catch (e) {
    return fail("invalid_request", "Failed to read request body", 400, { requestId });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return fail("invalid_request", "Invalid JSON payload", 400, { requestId });
  }

  logger.info("[webhooks.uazapi] payload received", {
    event: body.event || body.type,
    instance: body.instance || body.name,
  });

  const admin = createAdminClient();

  // 1. Resolve channel session
  const { data: session } = await admin
    .from("channel_sessions")
    .select("id, organization_id, phone_number, display_name")
    .eq("waha_session_name", "hubobra")
    .is("archived_at", null)
    .maybeSingle();

  if (!session) {
    logger.warn("[webhooks.uazapi] session not found for incoming webhook", { body });
    return ok({ status: "ignored", reason: "session_not_found" }, { requestId });
  }

  const organizationId = session.organization_id;
  const channelSessionId = session.id;

  // 2. Extract message data from various Uazapi payload formats
  const data = body.data || body;
  const key = data.key || {};
  const fromMe = Boolean(data.fromMe ?? key.fromMe ?? body.fromMe);
  const messageId = data.messageId || data.id || key.id || `uazapi_${Date.now()}`;

  let remoteJid = data.from || data.phone || data.remoteJid || key.remoteJid || data.sender || "";
  if (typeof remoteJid === "string") {
    const atSplit = remoteJid.split("@")[0] ?? "";
    remoteJid = atSplit.split(":")[0] ?? "";
  }

  // If fromMe and remoteJid is store number, try to extract recipient
  if (fromMe && (remoteJid.includes("558587129529") || !remoteJid)) {
    const fallback = data.to || data.recipient || key.remoteJid || "";
    if (typeof fallback === "string") {
      const atSplit = fallback.split("@")[0] ?? "";
      remoteJid = atSplit.split(":")[0] ?? "";
    }
  }

  const phone = normalizePhone(String(remoteJid));
  if (!phone || phone.length < 8) {
    return ok({ status: "ignored", reason: "no_valid_phone" }, { requestId });
  }

  // Extract text
  const text =
    data.text ||
    data.body ||
    data.message?.conversation ||
    data.message?.extendedTextMessage?.text ||
    data.message?.imageMessage?.caption ||
    body.text ||
    body.message ||
    "";

  if (!text && !data.media && !data.url) {
    return ok({ status: "ignored", reason: "no_content" }, { requestId });
  }

  const senderName = data.senderName || data.pushName || data.name || phone;

  // 3. Find or Upsert Contact
  let contactId: string;
  const { data: existingContact } = await admin
    .from("contacts")
    .select("id, name, display_name")
    .eq("organization_id", organizationId)
    .eq("phone_number", phone)
    .maybeSingle();

  if (existingContact) {
    contactId = existingContact.id;
    if (!existingContact.name || existingContact.name === phone) {
      if (senderName && senderName !== phone) {
        await admin
          .from("contacts")
          .update({ name: senderName, display_name: senderName })
          .eq("id", contactId);
      }
    }
  } else {
    const { data: newContact, error: contactErr } = await admin
      .from("contacts")
      .insert({
        organization_id: organizationId,
        phone_number: phone,
        name: senderName,
        display_name: senderName,
        source: "whatsapp",
      })
      .select("id")
      .single();

    if (contactErr || !newContact) {
      logger.error("[webhooks.uazapi] failed to create contact", { error: contactErr });
      return fail("internal_error", "Failed to create contact", 500, { requestId });
    }
    contactId = newContact.id;
  }

  // 4. Find or Create Conversation
  let conversationId: string;
  const { data: existingConv } = await admin
    .from("conversations")
    .select("id, unread_count_for_assignee, status")
    .eq("organization_id", organizationId)
    .eq("contact_id", contactId)
    .eq("channel_session_id", channelSessionId)
    .maybeSingle();

  const now = new Date().toISOString();
  const isCarlos =
    text.toLowerCase().includes("carlos") ||
    senderName.toLowerCase().includes("carlos") ||
    text.includes("TRANSFER_TO") ||
    text.includes("Vendedor Carlos Eduardo") ||
    text.includes("transferindo o seu atendimento");
  const carlosUserId = "aaceb251-fd64-40cf-8867-e95abd7f1988";

  if (existingConv) {
    conversationId = existingConv.id;
    await admin
      .from("conversations")
      .update({
        last_message_at: now,
        last_message_preview: (text || "Mídia recebida").slice(0, 100),
        unread_count_for_assignee: fromMe ? 0 : (existingConv.unread_count_for_assignee || 0) + 1,
        ...(fromMe ? { last_outbound_at: now } : { last_inbound_at: now }),
        ...(isCarlos ? { assigned_to_user_id: carlosUserId } : {}),
      })
      .eq("id", conversationId);
  } else {
    const { data: newConv, error: convErr } = await admin
      .from("conversations")
      .insert({
        organization_id: organizationId,
        contact_id: contactId,
        channel_session_id: channelSessionId,
        channel: "whatsapp",
        status: "open",
        last_message_at: now,
        last_message_preview: (text || "Mídia recebida").slice(0, 100),
        unread_count_for_assignee: fromMe ? 0 : 1,
        ...(fromMe ? { last_outbound_at: now } : { last_inbound_at: now }),
        ...(isCarlos ? { assigned_to_user_id: carlosUserId } : {}),
      })
      .select("id")
      .single();

    if (convErr || !newConv) {
      logger.error("[webhooks.uazapi] failed to create conversation", { error: convErr });
      return fail("internal_error", "Failed to create conversation", 500, { requestId });
    }
    conversationId = newConv.id;
  }

  // 5. Insert Message
  const { error: msgErr } = await admin.from("messages").insert({
    organization_id: organizationId,
    conversation_id: conversationId,
    channel_session_id: channelSessionId,
    contact_id: contactId,
    direction: fromMe ? "outbound" : "inbound",
    type: "text",
    body: text,
    status: "delivered",
    external_id: messageId,
    sent_at: now,
    metadata: {
      uazapi: true,
      sender_name: senderName,
    },
  });

  if (msgErr) {
    // Check if duplicate external_id
    if (msgErr.code !== "23505") {
      logger.error("[webhooks.uazapi] failed to insert message", { error: msgErr });
      return fail("internal_error", "Failed to insert message", 500, { requestId });
    }
  }

  return ok({ status: "success", conversation_id: conversationId, contact_id: contactId }, { requestId });
}
