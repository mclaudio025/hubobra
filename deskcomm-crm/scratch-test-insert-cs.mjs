import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
envContent.split("\n").forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1].trim()] = val;
  }
});

async function testInsert() {
  const payload = {
    organization_id: "2e60a3c9-c92f-45df-82f2-19aa9f4abbd9",
    provider: "waha",
    display_name: "WhatsApp HubObra",
    phone_number: "+558587129529",
    status: "WORKING",
    engine: "NOWEB",
    waha_session_name: "hubobra",
    webhook_path_token: "hubobra-uazapi-token",
    webhook_secret_encrypted: "\\x75617a6170695f7365637265745f706c616365686f6c6465725f3132333435",
    daily_message_limit: 5000,
    consecutive_health_fails: 0,
    last_status_change_at: new Date().toISOString(),
    metadata: {
      uazapi: true,
      instance_id: "r7cc5aebf284d68",
      instance_token: "2b8e068e-e174-4419-a64c-9b97f4760527"
    }
  };

  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/channel_sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: "return=representation"
    },
    body: JSON.stringify(payload)
  });

  console.log("Insert status:", res.status);
  const data = await res.json();
  console.log("Insert result:", JSON.stringify(data, null, 2));
}

testInsert();
