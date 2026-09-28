const https = require('https');

const KIE_API_KEY = 'b30b1489000ba908bd72cc04e0d6cc16';

function fetchModels() {
  const options = {
    host: 'api.kie.ai',
    path: '/v1/models',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${KIE_API_KEY}`,
      'Accept': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      try {
        const json = JSON.parse(data);
        console.log('Modelos disponíveis na Kie:', JSON.stringify(json, null, 2));
      } catch(e) {
        console.log('Resposta bruta:', data);
      }
    });
  });

  req.on('error', console.error);
  req.end();
}

fetchModels();
