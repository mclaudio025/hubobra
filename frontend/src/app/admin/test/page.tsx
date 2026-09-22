'use client';

import AdminBreadcrumb from '../../components/admin/AdminBreadcrumb';

export default function AdminTestPage() {
  return (
    <div>
      <AdminBreadcrumb />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Teste de Layout</h1>
        <p className="text-gray-600">Verificando se o header da loja foi removido</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">✅ Layout Administrativo Isolado</h2>
        <p className="text-gray-600 mb-4">
          Se você está vendo apenas este conteúdo sem o header da loja (telefone, categorias, logo), 
          então a correção funcionou perfeitamente!
        </p>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">Funcionalidades Ativas:</h3>
          <ul className="list-disc list-inside space-y-1 text-green-700 text-sm">
            <li>Header administrativo exclusivo</li>
            <li>Sidebar com navegação hierárquica</li>
            <li>Breadcrumb automático</li>
            <li>Layout completamente separado da loja</li>
            <li>Sem chat button da loja</li>
            <li>Sem menu de categorias</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
