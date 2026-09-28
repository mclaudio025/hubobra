const https = require('https');

const KIE_API_KEY = 'b30b1489000ba908bd72cc04e0d6cc16';
const TASK_ID = '821f20475ef328d79c05de9848c336d4';

function checkRecord(taskId) {
  const options = {
    host: 'api.kie.ai',
    path: `/api/v1/jobs/recordInfo?taskId=${taskId}`,
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
        const parsed = JSON.parse(data);
        console.log('Dados do áudio gerado:', JSON.stringify(parsed, null, 2));
      } catch(e) {
        console.log('Resposta:', data);
      }
    });
  });

  req.on('error', console.error);
  req.end();
}

checkRecord(TASK_ID);
