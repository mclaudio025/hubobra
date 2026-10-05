async function testUazapiWebhook() {
  const payload = {
    event: "messages",
    instance: "hubobra",
    data: {
      key: {
        remoteJid: "5585991234567@s.whatsapp.net",
        fromMe: false,
        id: "TEST_UAZAPI_MSG_" + Date.now()
      },
      pushName: "Francisco Ferreira (Cliente)",
      message: {
        conversation: "Olá! Gostaria de falar com um vendedor sobre cimento e pisos."
      }
    }
  };

  console.log("Sending test payload to http://localhost:3010/api/v1/webhooks/uazapi...");
  const res = await fetch("http://localhost:3010/api/v1/webhooks/uazapi", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  console.log("Webhook response status:", res.status);
  const data = await res.json();
  console.log("Webhook response data:", JSON.stringify(data, null, 2));
}

testUazapiWebhook();
