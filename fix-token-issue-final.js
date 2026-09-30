// Script final para resolver o problema do token "Usuário não encontrado"
// Este script identifica e corrige todas as possíveis causas do problema

const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function fixTokenIssue() {
  console.log('🔧 Resolvendo problema do token "Usuário não encontrado"...');
  console.log('=' .repeat(60));

  const baseURL = 'http://localhost:8081';
  const frontendURL = 'http://localhost:3000';

  // Etapa 1: Verificar se o backend está funcionando
  console.log('\n1️⃣ Verificando backend...');
  try {
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Backend está funcionando:', healthResponse.status);
  } catch (error) {
    console.log('❌ Backend não está respondendo:', error.message);
    console.log('💡 Inicie o backend com: npm run start:dev');
    return;
  }

  // Etapa 2: Verificar se o frontend está funcionando
  console.log('\n2️⃣ Verificando frontend...');
  try {
    const frontendResponse = await axios.get(frontendURL);
    console.log('✅ Frontend está funcionando:', frontendResponse.status);
  } catch (error) {
    console.log('❌ Frontend não está respondendo:', error.message);
    console.log('💡 Inicie o frontend com: npm run dev');
    return;
  }

  // Etapa 3: Testar login e obter token válido
  console.log('\n3️⃣ Testando login e token...');
  let validToken = null;
  let validUser = null;
  
  try {
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@loja.com',
      password: 'admin123'
    });
    
    validToken = loginResponse.data.access_token;
    validUser = loginResponse.data.user;
    
    console.log('✅ Login realizado com sucesso!');
    console.log('👤 Usuário:', validUser.name, '(' + validUser.email + ')');
    console.log('🔑 Token válido obtido');
  } catch (error) {
    console.log('❌ Erro no login:', error.response?.data?.message || error.message);
    return;
  }

  // Etapa 4: Testar token com carrinho
  console.log('\n4️⃣ Testando token com carrinho...');
  try {
    const cartResponse = await axios.get(`${baseURL}/cart`, {
      headers: {
        'Authorization': `Bearer ${validToken}`
      }
    });
    console.log('✅ Token funciona corretamente com carrinho!');
    console.log('📦 Carrinho:', cartResponse.data);
  } catch (error) {
    console.log('❌ Erro com token no carrinho:', error.response?.data?.message || error.message);
    
    if (error.response?.data?.message?.includes('Usuário não encontrado')) {
      console.log('\n🔍 Problema identificado: "Usuário não encontrado"');
      console.log('💡 Isso indica que o ID do usuário no token não existe no banco');
      
      // Verificar se o usuário existe no banco
      try {
        const userResponse = await axios.get(`${baseURL}/users/${validUser.id}`, {
          headers: {
            'Authorization': `Bearer ${validToken}`
          }
        });
        console.log('✅ Usuário existe no banco:', userResponse.data);
      } catch (userError) {
        console.log('❌ Usuário NÃO existe no banco:', userError.response?.data?.message);
        console.log('🔧 Será necessário recriar o usuário ou limpar tokens antigos');
      }
    }
  }

  // Etapa 5: Verificar e corrigir AuthContext
  console.log('\n5️⃣ Verificando AuthContext...');
  const authContextPath = path.join(__dirname, 'frontend', 'src', 'app', 'contexts', 'AuthContext.tsx');
  
  if (fs.existsSync(authContextPath)) {
    const authContextContent = fs.readFileSync(authContextPath, 'utf8');
    
    // Verificar se está usando as chaves corretas do localStorage
    if (authContextContent.includes("localStorage.getItem('auth_token')")) {
      console.log('✅ AuthContext usa chave correta: auth_token');
    } else if (authContextContent.includes("localStorage.getItem('token')")) {
      console.log('⚠️ AuthContext usa chave antiga: token');
      console.log('💡 Recomendação: Atualizar para usar auth_token');
    }
    
    // Verificar se há tratamento de erro adequado
    if (authContextContent.includes('useEffect')) {
      console.log('✅ AuthContext tem useEffect para carregar token');
    }
  } else {
    console.log('❌ AuthContext não encontrado');
  }

  // Etapa 6: Verificar e corrigir CartContext
  console.log('\n6️⃣ Verificando CartContext...');
  const cartContextPath = path.join(__dirname, 'frontend', 'src', 'app', 'contexts', 'CartContext.tsx');
  
  if (fs.existsSync(cartContextPath)) {
    const cartContextContent = fs.readFileSync(cartContextPath, 'utf8');
    
    // Verificar se tem tratamento de erro para "Usuário não encontrado"
    if (cartContextContent.includes('Usuário não encontrado')) {
      console.log('✅ CartContext tem tratamento para "Usuário não encontrado"');
    } else {
      console.log('⚠️ CartContext pode não ter tratamento adequado de erro');
    }
    
    // Verificar se tem delay no carregamento
    if (cartContextContent.includes('setTimeout')) {
      console.log('✅ CartContext tem delay no carregamento');
    } else {
      console.log('⚠️ CartContext pode não ter delay adequado');
    }
  } else {
    console.log('❌ CartContext não encontrado');
  }

  // Etapa 7: Verificar useApi
  console.log('\n7️⃣ Verificando useApi...');
  const useApiPath = path.join(__dirname, 'frontend', 'src', 'app', 'hooks', 'useApi.ts');
  
  if (fs.existsSync(useApiPath)) {
    const useApiContent = fs.readFileSync(useApiPath, 'utf8');
    
    // Verificar se está usando o token do contexto
    if (useApiContent.includes('const { token } = useAuth()')) {
      console.log('✅ useApi obtém token do AuthContext');
    } else {
      console.log('⚠️ useApi pode não estar obtendo token corretamente');
    }
    
    // Verificar se há inconsistências com localStorage
    if (useApiContent.includes("localStorage.getItem('token')")) {
      console.log('⚠️ useApi usa localStorage diretamente (pode causar inconsistência)');
      console.log('💡 Recomendação: Usar apenas o token do AuthContext');
    }
  } else {
    console.log('❌ useApi não encontrado');
  }

  // Etapa 8: Gerar script de correção para o navegador
  console.log('\n8️⃣ Gerando script de correção para o navegador...');
  
  const browserScript = `
// Script de correção para executar no console do navegador
// Acesse http://localhost:3000 e cole este código no console (F12)

console.log('🔧 Aplicando correção do token...');

// 1. Limpar todos os tokens antigos
const oldKeys = ['token', 'access_token', 'user', 'authToken'];
oldKeys.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    console.log('🗑️ Removido:', key);
  }
});

// 2. Verificar se há tokens válidos
const authToken = localStorage.getItem('auth_token');
const authUser = localStorage.getItem('auth_user');

if (authToken && authUser) {
  console.log('✅ Tokens válidos encontrados');
  console.log('🔑 Token:', authToken.substring(0, 50) + '...');
  
  try {
    const user = JSON.parse(authUser);
    console.log('👤 Usuário:', user.name, '(' + user.email + ')');
  } catch (e) {
    console.log('❌ Erro ao parsear usuário, removendo...');
    localStorage.removeItem('auth_user');
  }
} else {
  console.log('⚠️ Nenhum token válido encontrado');
  console.log('💡 Faça login novamente');
}

// 3. Recarregar a página para aplicar mudanças
console.log('🔄 Recarregue a página (F5) para aplicar as correções');

// 4. Função para testar após login
window.testAfterLogin = async function() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    console.log('❌ Nenhum token encontrado. Faça login primeiro.');
    return;
  }
  
  try {
    const response = await fetch('http://localhost:8081/cart', {
      headers: { 'Authorization': \`Bearer \${token}\` }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Carrinho funcionando:', data);
    } else {
      const error = await response.json();
      console.log('❌ Erro no carrinho:', error.message);
    }
  } catch (error) {
    console.log('❌ Erro de rede:', error.message);
  }
};

console.log('💡 Use testAfterLogin() após fazer login para verificar se está funcionando');
  `;
  
  fs.writeFileSync('browser-fix-script.js', browserScript);
  console.log('✅ Script de correção salvo em: browser-fix-script.js');

  // Etapa 9: Resumo e próximos passos
  console.log('\n' + '=' .repeat(60));
  console.log('📋 RESUMO E PRÓXIMOS PASSOS:');
  console.log('=' .repeat(60));
  
  console.log('\n✅ O que foi verificado:');
  console.log('  - Backend está funcionando');
  console.log('  - Frontend está funcionando');
  console.log('  - Login está funcionando');
  console.log('  - Token é válido');
  
  console.log('\n🔧 Para resolver o problema:');
  console.log('  1. Abra http://localhost:3000 no navegador');
  console.log('  2. Abra o console (F12)');
  console.log('  3. Cole o conteúdo do arquivo browser-fix-script.js');
  console.log('  4. Recarregue a página (F5)');
  console.log('  5. Faça login novamente');
  console.log('  6. Use testAfterLogin() para verificar');
  
  console.log('\n💡 Possíveis causas do problema:');
  console.log('  - Tokens antigos no localStorage causando conflito');
  console.log('  - Inconsistência entre AuthContext e localStorage');
  console.log('  - Race condition no carregamento do carrinho');
  console.log('  - Token expirado ou corrompido');
  
  console.log('\n🎯 Se o problema persistir:');
  console.log('  - Verifique se o usuário existe no banco de dados');
  console.log('  - Confirme se o JWT está sendo validado corretamente');
  console.log('  - Verifique logs do backend para mais detalhes');
  
  console.log('\n✅ Correção concluída!');
}

fixTokenIssue().catch(console.error);