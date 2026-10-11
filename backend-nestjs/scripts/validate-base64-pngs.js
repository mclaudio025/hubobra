const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const masters = await prisma.category.findMany({
    where: { parentId: null }
  });

  console.log('Validating base64 PNG headers:');
  masters.forEach(m => {
    if (!m.image || !m.image.startsWith('data:image/')) {
      console.log(`[${m.name}]: NOT BASE64 (${m.image?.substring(0, 30)})`);
      return;
    }
    const base64Data = m.image.split(';base64,')[1];
    if (!base64Data) {
      console.log(`[${m.name}]: INVALID BASE64 FORMAT!`);
      return;
    }
    const buf = Buffer.from(base64Data, 'base64');
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    const isJpg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    const isWebp = buf.slice(8, 12).toString('ascii') === 'WEBP';

    console.log(`[${m.name}]: size=${buf.length} bytes, format=${isPng ? 'PNG' : (isJpg ? 'JPG' : (isWebp ? 'WEBP' : 'UNKNOWN'))}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
