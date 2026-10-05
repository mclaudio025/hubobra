async function testWebhookDirect() {
  const payload = {
    event: "messages",
    instance: "hubobra",
    data: {
      key: {
        remoteJid: "5585991234567@s.whatsapp.net",
        fromMe: false,
        id: "UAZAPI_MSG_TEST_" + Date.now()
      },
      pushName: "Francisco Ferreira Cliente",
      message: {
        conversation: "Olá! Gostaria de falar com um vendedor sobre cimento e pisos."
      }
    }
  };

  console.log("Sending POST to http://127.0.0.1:3010/api/v1/webhooks/uazapi...");
  const res = await fetch("http://127.0.0.1:3010/api/v1/webhooks/uazapi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  console.log("Response Status:", res.status);
  const text = await res.text();
  console.log("Response Body:", text);
}

testWebhookDirect();
