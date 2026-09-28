const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function generateIcons() {
  console.log('🚀 Iniciando geração de ícones PWA...');
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  const svgPath = path.join(__dirname, '../frontend/public/icons/icon-512x512.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  const sizes = [16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512];
  
  for (const size of sizes) {
    await page.setViewport({ width: size, height: size });
    await page.setContent(`<!DOCTYPE html><html><head><style>* { margin: 0; padding: 0; } html, body { width: ${size}px; height: ${size}px; overflow: hidden; background: transparent; } svg { width: 100%; height: 100%; display: block; }</style></head><body>${svgContent}</body></html>`);
    
    const outPath = path.join(__dirname, `../frontend/public/icons/icon-${size}x${size}.png`);
    await page.screenshot({ path: outPath, omitBackground: true });
    console.log(`✅ Gerado: icon-${size}x${size}.png`);
  }

  // Favicons e Apple Touch Icons
  await page.setViewport({ width: 180, height: 180 });
  await page.screenshot({ path: path.join(__dirname, '../frontend/public/apple-touch-icon.png'), omitBackground: true });
  await page.screenshot({ path: path.join(__dirname, '../frontend/public/icons/apple-touch-icon.png'), omitBackground: true });
  
  await browser.close();
  console.log('🎉 Todos os ícones PNG PWA gerados com sucesso!');
}

generateIcons().catch(err => {
  console.error('❌ Erro ao gerar ícones:', err);
  process.exit(1);
});
