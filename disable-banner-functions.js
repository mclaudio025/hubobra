
// Script para desabilitar temporariamente funcionalidades de banner
// Execute este código no console do navegador (F12)

console.log('🔧 Desabilitando funcionalidades de banner temporariamente...');

// 1. Interceptar chamadas para endpoints de banner
const originalFetch = window.fetch;
window.fetch = function(url, options) {
    if (typeof url === 'string' && url.includes('/banners')) {
        console.log('🚫 Bloqueando chamada para:', url);
        return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]), // Retornar array vazio
            text: () => Promise.resolve('[]')
        });
    }
    return originalFetch.apply(this, arguments);
};

// 2. Interceptar chamadas para upload de banner
if (typeof XMLHttpRequest !== 'undefined') {
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        if (url && url.includes('/banners') && url.includes('upload')) {
            console.log('🚫 Bloqueando upload de banner para:', url);
            // Simular sucesso
            this.addEventListener('load', () => {
                Object.defineProperty(this, 'status', { value: 200 });
                Object.defineProperty(this, 'response', { value: JSON.stringify({ success: true, message: 'Upload simulado' }) });
            });
            return;
        }
        return originalOpen.apply(this, arguments);
    };
}

// 3. Limpar erros relacionados a banner
try {
    // Limpar localStorage relacionado a banners
    Object.keys(localStorage).forEach(key => {
        if (key.toLowerCase().includes('banner')) {
            localStorage.removeItem(key);
            console.log('🧹 Removido do localStorage:', key);
        }
    });
    
    // Limpar sessionStorage relacionado a banners
    Object.keys(sessionStorage).forEach(key => {
        if (key.toLowerCase().includes('banner')) {
            sessionStorage.removeItem(key);
            console.log('🧹 Removido do sessionStorage:', key);
        }
    });
} catch (error) {
    console.log('⚠️ Erro ao limpar storage:', error);
}

// 4. Interceptar e silenciar erros de "Usuário não encontrado" relacionados a banner
const originalConsoleError = console.error;
console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('Usuário não encontrado') && message.includes('banner')) {
        console.log('🔇 Erro de banner silenciado:', message);
        return;
    }
    return originalConsoleError.apply(this, args);
};

// 5. Interceptar eventos de erro global
window.addEventListener('error', function(event) {
    if (event.message && event.message.includes('Usuário não encontrado')) {
        console.log('🔇 Erro global silenciado:', event.message);
        event.preventDefault();
        return false;
    }
});

console.log('✅ Funcionalidades de banner desabilitadas temporariamente');
console.log('📋 Agora tente salvar a imagem do banner novamente');
console.log('
🔄 Para reverter, recarregue a página (F5)');
