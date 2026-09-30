const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, 'n8n-nodes/format-whatsapp-response.js'), 'utf-8');

const $ = (nodeName) => ({
  first: () => ({ json: { name: 'Claudio', phone: '5585989219126', messageText: 'Lia, me manda o PDF desse orçamento' } }),
  all: () => []
});

const mockQuoteOutput = `Tá na mão, Claudio! Acabei de gerar o seu orçamento oficial em PDF com validade de 7 dias:
<<<ORCAMENTO: {"customerName":"Claudio","items":[{"name":"Cimento Poty 50kg","quantity":10,"unitPrice":32.90,"total":329.00},{"name":"Caixa d'Água Fortlev 500L","quantity":2,"unitPrice":379.00,"total":758.00}],"discount":0,"shipping":0,"notes":"Orçamento de obra"} >>>
[FALA: Oi Claudio! Já emiti o seu orçamento completo em PDF e deixei aqui no WhatsApp pra você baixar!]`;

const $input = {
  first: () => ({ json: { output: mockQuoteOutput } })
};

const context = {
  $,
  $input,
  Buffer,
  helpers: {
    httpRequest: async (opts) => {
      if (opts.url.includes('/rest/v1/quotes') && opts.method === 'POST') {
        return [{ id: 'quote-123', quoteNumber: 'ORC-2026-9999', ...opts.body }];
      }
      return [];
    }
  }
};

const runner = new Function('$', '$input', 'Buffer', 'helpers', `
  return (async function() {
    ${code}
  })();
`);

runner($, $input, Buffer, context.helpers)
  .then(res => {
    console.log('✅ TEST PDF PASSED:');
    console.log('Returned items:', res.length);
    console.log('Has PDF:', res[0].json.hasPdf);
    console.log('Media Type:', res[0].json.mediaType);
    console.log('Doc Name:', res[0].json.docName);
    console.log('Media URL (prefix):', (res[0].json.mediaUrl || '').substring(0, 40));
    console.log('Resposta formatada:', res[0].json.respostaFormatada);
  })
  .catch(err => {
    console.error('❌ TEST FAILED:', err);
  });
