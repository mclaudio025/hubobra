const { createClient } = require('redis');

async function testRedis() {
  console.log('🔴 Testando conexão com Redis...');
  
  const client = createClient({
    host: 'localhost',
    port: 6379,
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao Redis!');
    
    // Teste básico
    await client.set('test:key', 'Hello Redis!');
    const value = await client.get('test:key');
    console.log('📝 Teste SET/GET:', value);
    
    // Teste com TTL
    await client.setEx('test:ttl', 5, 'Expires in 5 seconds');
    const ttlValue = await client.get('test:ttl');
    console.log('⏰ Teste TTL:', ttlValue);
    
    // Verificar TTL
    const ttl = await client.ttl('test:ttl');
    console.log('🕐 TTL restante:', ttl, 'segundos');
    
    // Limpar chaves de teste
    await client.del('test:key');
    await client.del('test:ttl');
    
    console.log('🎉 Todos os testes passaram!');
    
  } catch (error) {
    console.error('❌ Erro ao conectar com Redis:', error.message);
    console.log('\n💡 Soluções:');
    console.log('1. Verificar se Redis está rodando: docker ps | grep redis');
    console.log('2. Iniciar Redis: docker run -d -p 6379:6379 redis:7-alpine');
    console.log('3. Ou usar Docker Compose: cd infra && docker-compose up -d redis');
  } finally {
    await client.quit();
  }
}

testRedis();