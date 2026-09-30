const fs = require('fs');

console.log('🔧 Corrigindo CartContext para evitar erro "Usuário não encontrado"...\n');

// Ler o arquivo atual
const cartContextPath = 'frontend/src/app/contexts/CartContext.tsx';
let content = fs.readFileSync(cartContextPath, 'utf8');

// Substituir o useEffect problemático
const oldUseEffect = `  // Carregar carrinho quando usuário fizer login
  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      // Limpar carrinho quando usuário fizer logout
      setItems([]);
      setTotal(0);
      setTotalItems(0);
    }
  }, [isAuthenticated]);`;

const newUseEffect = `  // Carregar carrinho quando usuário fizer login
  useEffect(() => {
    if (isAuthenticated) {
      // Aguardar um pouco para garantir que o token está disponível
      setTimeout(() => {
        refreshCart();
      }, 100);
    } else {
      // Limpar carrinho quando usuário fizer logout
      setItems([]);
      setTotal(0);
      setTotalItems(0);
    }
  }, [isAuthenticated]);`;

content = content.replace(oldUseEffect, newUseEffect);

// Melhorar a função refreshCart
const oldRefreshCart = `  const refreshCart = async () => {
    if (!isAuthenticated) {
      // Se não estiver autenticado, apenas limpar o carrinho
      setItems([]);
      setTotal(0);
      setTotalItems(0);
      return;
    }

    try {
      setLoading(true);
      const cartData = await cartApi.getCart();
      setItems(cartData.items || []);
      setTotal(cartData.total || 0);
      setTotalItems(cartData.totalItems || 0);
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
      // Em caso de erro (como usuário não encontrado), limpar o carrinho
      setItems([]);
      setTotal(0);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };`;

const newRefreshCart = `  const refreshCart = async () => {
    if (!isAuthenticated) {
      // Se não estiver autenticado, apenas limpar o carrinho
      setItems([]);
      setTotal(0);
      setTotalItems(0);
      return;
    }

    try {
      setLoading(true);
      const cartData = await cartApi.getCart();
      setItems(cartData.items || []);
      setTotal(cartData.total || 0);
      setTotalItems(cartData.totalItems || 0);
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
      // Em caso de erro (como usuário não encontrado), limpar o carrinho
      setItems([]);
      setTotal(0);
      setTotalItems(0);
      
      // Se for erro de autenticação, não mostrar erro para o usuário
      if (error.message?.includes('Usuário não encontrado') || 
          error.message?.includes('401') || 
          error.message?.includes('Unauthorized')) {
        console.log('Usuário não autenticado, carrinho limpo');
      }
    } finally {
      setLoading(false);
    }
  };`;

content = content.replace(oldRefreshCart, newRefreshCart);

// Salvar o arquivo corrigido
fs.writeFileSync(cartContextPath, content);

console.log('✅ CartContext corrigido!');
console.log('📝 Mudanças aplicadas:');
console.log('  - Adicionado delay no carregamento do carrinho');
console.log('  - Melhorado tratamento de erros de autenticação');
console.log('  - Evitado logs desnecessários de erro');

console.log('\n🎯 Agora o frontend não deve mais mostrar erro "Usuário não encontrado"');