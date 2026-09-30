const axios = require('axios');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    console.log('🧪 TESTE: Verificando visibilidade de componentes na página inicial');
    console.log('=' .repeat(60));
    
    const backendUrl = 'http://localhost:8081';
    const frontendUrl = 'http://localhost:3001';
    
    // 1. Verificar se o backend está rodando
    console.log('\n1️⃣ Verificando backend...');
    try {
      const backendResponse = await axios.get(`${backendUrl}/health`, { timeout: 5000 });
      console.log('✅ Backend está rodando');
    } catch (error) {
      console.log('❌ Backend não está acessível:', error.message);
      console.log('💡 Execute: npm run start:dev no diretório backend-nestjs');
      return;
    }
    
    // 2. Verificar endpoint público de configurações
    console.log('\n2️⃣ Testando endpoint público de configurações...');
    try {
      const configResponse = await axios.get(`${backendUrl}/components/config-public`);
      console.log('✅ Endpoint público funcionando');
      console.log('📋 Configurações atuais:');
      
      configResponse.data.forEach(component => {
        const status = component.enabled ? '🟢 ATIVO' : '🔴 DESATIVADO';
        console.log(`   ${component.order}. ${component.name} (${component.id}) - ${status}`);
      });
      
      // Contar componentes ativos e inativos
      const activeCount = configResponse.data.filter(c => c.enabled).length;
      const inactiveCount = configResponse.data.filter(c => !c.enabled).length;
      
      console.log(`\n📊 Resumo: ${activeCount} ativos, ${inactiveCount} desativados`);
      
      if (inactiveCount === 0) {
        console.log('⚠️  Todos os componentes estão ativos. Para testar, desative alguns no painel admin.');
      }
      
    } catch (error) {
      console.log('❌ Erro ao acessar configurações:', error.message);
      return;
    }
    
    // 3. Verificar se o frontend está rodando
    console.log('\n3️⃣ Verificando frontend...');
    try {
      const frontendResponse = await axios.get(frontendUrl, { timeout: 5000 });
      console.log('✅ Frontend está acessível');
    } catch (error) {
      console.log('❌ Frontend não está acessível:', error.message);
      console.log('💡 Execute: npm run dev no diretório frontend');
      return;
    }
    
    // 4. Verificar se o hook foi criado corretamente
    console.log('\n4️⃣ Verificando hook useComponentsConfig...');
    const hookPath = path.join(__dirname, 'frontend', 'src', 'app', 'hooks', 'useComponentsConfig.ts');
    
    if (fs.existsSync(hookPath)) {
      console.log('✅ Hook useComponentsConfig.ts criado');
      
      const hookContent = fs.readFileSync(hookPath, 'utf8');
      
      if (hookContent.includes('config-public')) {
        console.log('✅ Hook configurado para usar endpoint público');
      } else {
        console.log('❌ Hook não está usando endpoint público');
      }
      
      if (hookContent.includes('isComponentEnabled')) {
        console.log('✅ Função isComponentEnabled disponível');
      }
      
    } else {
      console.log('❌ Hook useComponentsConfig.ts não encontrado');
    }
    
    // 5. Verificar se a página inicial foi atualizada
    console.log('\n5️⃣ Verificando página inicial...');
    const pageePath = path.join(__dirname, 'frontend', 'src', 'app', 'page.tsx');
    
    if (fs.existsSync(pageePath)) {
      const pageContent = fs.readFileSync(pageePath, 'utf8');
      
      if (pageContent.includes('useComponentsConfig')) {
        console.log('✅ Página inicial usa useComponentsConfig');
      } else {
        console.log('❌ Página inicial não usa useComponentsConfig');
      }
      
      if (pageContent.includes('isComponentEnabled')) {
        console.log('✅ Página inicial verifica componentes habilitados');
      } else {
        console.log('❌ Página inicial não verifica componentes habilitados');
      }
      
      // Contar renderizações condicionais
      const conditionalRenders = (pageContent.match(/isComponentEnabled\(/g) || []).length;
      console.log(`📊 ${conditionalRenders} componentes com renderização condicional`);
      
    } else {
      console.log('❌ Página inicial não encontrada');
    }
    
    // 6. Instruções para teste manual
    console.log('\n6️⃣ TESTE MANUAL:');
    console.log('=' .repeat(40));
    console.log('1. Abra http://localhost:3001/admin/settings');
    console.log('2. Faça login como admin');
    console.log('3. Desative alguns componentes (ex: banners, carrossel, rodapé)');
    console.log('4. Clique em "Salvar Alterações de Componentes"');
    console.log('5. Aguarde o recarregamento automático');
    console.log('6. Abra http://localhost:3001 em uma nova aba');
    console.log('7. Verifique se os componentes desativados não aparecem');
    
    console.log('\n✅ VERIFICAÇÃO CONCLUÍDA!');
    console.log('\n💡 Se os componentes ainda aparecem após desativar:');
    console.log('   - Verifique o console do navegador (F12)');
    console.log('   - Limpe o cache do navegador (Ctrl+F5)');
    console.log('   - Verifique se não há erros de JavaScript');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
})();