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

async function inspectTables() {
  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  const spec = await res.json();
  console.log("contacts columns:", Object.keys(spec.definitions?.contacts?.properties || {}));
  console.log("conversations columns:", Object.keys(spec.definitions?.conversations?.properties || {}));
  console.log("messages columns:", Object.keys(spec.definitions?.messages?.properties || {}));
}

inspectTables();
