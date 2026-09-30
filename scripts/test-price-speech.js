function cleanSpeech(text) {
  return text
    .replace(/<<<LEARN_TERM:[\s\S]*?>>>/gi, '')
    .replace(/<<<LEARN_RULE:[\s\S]*?>>>/gi, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/HubObra/gi, 'Hub, Obra')
    .replace(/Hub\s*Obra/gi, 'Hub, Obra')
    .replace(/\bPIX\b/g, 'Pícs')
    .replace(/\bPix\b/g, 'Pícs')
    .replace(/\bWhatsApp\b/gi, 'Uatizap')
    .replace(/[*_~#`\[\]!]/g, '')
    // 1. Valores R$ com 00 centavos redondos -> X reais
    .replace(/R\$\s*([0-9]+)[,\.]00\b/gi, (match, reais) => {
      return (reais === '1' ? '1 real' : `${reais} reais`);
    })
    // 2. Valores R$ com centavos quebrados -> X reais e Y centavos
    .replace(/R\$\s*([0-9]+)[,\.]([0-9]{1,2})\b/gi, (match, reais, cents) => {
      const c = parseInt(cents, 10);
      if (c === 0) {
        return (reais === '1' ? '1 real' : `${reais} reais`);
      }
      if (reais === '0') {
        return `${c} centavos`;
      }
      const unit = reais === '1' ? 'real' : 'reais';
      return `${reais} ${unit} e ${cents} centavos`;
    })
    // 3. Valores com R$ sem centavos -> X reais
    .replace(/R\$\s*([0-9]+)/gi, (match, reais) => {
      return (reais === '1' ? '1 real' : `${reais} reais`);
    })
    // 4. Valores avulsos no áudio com ,00 -> apenas o número inteiro
    .replace(/\b([0-9]+)[,\.]00\s*reais\b/gi, (match, reais) => {
      return (reais === '1' ? '1 real' : `${reais} reais`);
    })
    .replace(/\b([0-9]+)[,\.]00\b/g, '$1')
    // 5. Remover qualquer menção textual a "zero centavos" ou "00 centavos"
    .replace(/\s+e\s+(?:00|zero|0)\s+centavos\b/gi, '')
    .replace(/\s+(?:00|zero|0)\s+centavos\b/gi, '')
    .replace(/\s+vírgula\s+zero\s+zero\b/gi, '')
    .replace(/\s+virgula\s+zero\s+zero\b/gi, '')
    .replace(/m²/g, 'metros quadrados')
    .replace(/m³/g, 'metros cúbicos')
    .replace(/kg/g, 'quilos')
    .replace(/\s+/g, ' ')
    .trim();
}

const testCases = [
  'a caixa dgua de 500 litros da fortlev esta R$ 379,00',
  'a caixa dgua de 500 litros da fortlev esta 379 reais e zero centavos',
  'o cimento poty esta R$ 32,90 cada saco',
  'o tubo esgoto esta R$ 42,00 a barra',
  'fica R$ 100,00 no PIX',
  'o parafuso custa R$ 0,50 cada',
  'sai por 379,00 reais a vista',
  'temos por 379 reais e 00 centavos',
  'o conector custa R$ 1,00'
];

testCases.forEach(tc => {
  console.log('INPUT: ', tc);
  console.log('OUTPUT:', cleanSpeech(tc));
  console.log('---');
});
