const rawAiOutput = `[FALA: Oi Claudio, cuida que já vou te mandar a foto!]

Aqui está a fita isolante imperial de 18mm x 20m, que tá custando R$ 11,99. Olha só a imagem dela:

![Fita Isolante Imperial 18mm x 20m](https://images.tcdn.com.br/img/img_prod/1022541/fita_isolante_imperial_18_mm_x_20_m_3m_6609_1_0ef0a352cbca8baf26a7558e694385c1.jpg)

Se quiser fechar o pedido, é só avisar!`;

// Test extractor
let imageUrl = null;
const fotoTagMatch = rawAiOutput.match(/\[FOTO:\s*([^\s\]]+)\]/i);
const mdImgMatch = rawAiOutput.match(/!\[.*?\]\((https?:\/\/[^\s\)]+)\)/i);
const rawImgMatch = rawAiOutput.match(/(https?:\/\/[^\s\(\)\[\]\"\'\<\>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s\(\)\[\]\"\'\<\>]*)?)/i);

if (fotoTagMatch && fotoTagMatch[1]) {
  imageUrl = fotoTagMatch[1].trim();
} else if (mdImgMatch && mdImgMatch[1]) {
  imageUrl = mdImgMatch[1].trim();
} else if (rawImgMatch && rawImgMatch[1]) {
  imageUrl = rawImgMatch[1].trim();
}

console.log('Tested imageUrl:', imageUrl);
console.log('hasImage:', Boolean(imageUrl && imageUrl.startsWith('http')));
