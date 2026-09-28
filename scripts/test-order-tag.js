const text = `Perfeito, Claudio! A entrega será feita na Rua Trajano de Medeiros, 566, e o pagamento será na entrega com a maquininha. O total será de R$ 96,00 pelos três sacos de cimento de 50kg.

Vou registrar tudo agora para que a equipe possa preparar seu pedido! 😊

<<<PEDIDO: {"customerName":"Claudio","items":[{"name":"Cimento 50kg","quantity":3,"price":32.00}],"paymentMethod":"CREDIT_CARD","deliveryType":"DELIVERY","street":"Rua Trajano de Medeiros","number":"566","neighborhood":"Messejana","referencePoint":""} >>>`;

const m = text.match(/<<<PEDIDO:\s*([\s\S]*?)\s*>>>/i);
console.log('Match found:', Boolean(m));
if (m) {
  const parsed = JSON.parse(m[1]);
  console.log('Parsed Items:', parsed.items);
  console.log('Customer:', parsed.customerName);
}
