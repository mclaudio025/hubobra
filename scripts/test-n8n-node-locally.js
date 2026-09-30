const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, 'n8n-nodes/format-whatsapp-response.js'), 'utf-8');

const $ = (nodeName) => ({
  first: () => ({ json: { name: 'Claudio', phone: '5585989219126', messageText: 'Voce e uma pessoa?' } }),
  all: () => []
});
const $input = {
  first: () => ({ json: { output: '[FALA: Coelhinha não, Claudio! Sou a Lia, sua inteligência artificial e consultora virtual aqui na HubObra. Concluo todo o seu atendimento por aqui, mas se você fizer questão de falar com alguém da nossa equipe física, é só me avisar que eu transfiro na hora pra você!]' } })
};

const context = {
  $,
  $input,
  Buffer,
  helpers: {
    httpRequest: async () => []
  }
};

const runner = new Function('$', '$input', 'Buffer', 'helpers', `
  return (async function() {
    ${code}
  })();
`);

runner($, $input, Buffer, context.helpers)
  .then(res => {
    console.log('✅ TEST PASSED SUCCESSFULLY:');
    console.log('Returned items:', res.length);
    console.log('Resposta formatada:', res[0].json.respostaFormatada);
    console.log('Speech text:', res[0].json.speechText);
    console.log('Voice ID:', res[0].json.voiceId);
    console.log('Has media:', res[0].json.hasMedia);
  })
  .catch(err => {
    console.error('❌ TEST FAILED:', err);
  });
