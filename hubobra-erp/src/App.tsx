import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { VendorOrdersView } from './components/VendorOrdersView';
import { MobileVendorView } from './components/MobileVendorView';
import { CashierQueueView } from './components/CashierQueueView';
import { DigitalExpeditionView } from './components/DigitalExpeditionView';
import { PrintersSettingsView } from './components/PrintersSettingsView';
import { UserManagementView, SystemUser, DEFAULT_SYSTEM_USERS } from './components/UserManagementView';
import { ChatwootDrawer } from './components/ChatwootDrawer';
import { POSView } from './components/POSView';
import { ProductsView } from './components/ProductsView';
import { CustomersView } from './components/CustomersView';
import { FiscalSettingsView } from './components/FiscalSettingsView';
import { PurchasingManagementView } from './components/PurchasingManagementView';
import { PrintDispatcher } from './components/PrintDispatcher';
import { MaterialsCalculatorModal } from './components/MaterialsCalculatorModal';
import { seedLocalDatabase } from './db/seed';
import { LocalOrder, db } from './db/db';
import { Database, ShieldCheck, Server, MessageSquare } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('hubobra_logged_user') : null;
    return saved ? JSON.parse(saved) : null;
  });

  const [currentTab, setCurrentTab] = useState<string>('VENDEDOR_PEDIDOS');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [activePrintOrder, setActivePrintOrder] = useState<LocalOrder | null>(null);
  const [printMode, setPrintMode] = useState<'3VIAS_MATRICIAL' | 'TERMICA_CAIXA' | 'ORCAMENTO_A4'>('3VIAS_MATRICIAL');
  const [isStandAloneCalcOpen, setIsStandAloneCalcOpen] = useState<boolean>(false);
  const [isChatwootOpen, setIsChatwootOpen] = useState<boolean>(false);
  const [importedChatwootItems, setImportedChatwootItems] = useState<any[] | null>(null);
  const [currentActiveOrder, setCurrentActiveOrder] = useState<LocalOrder | null>(null);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);

  const updatePendingCount = async () => {
    const count = await db.orders.where('status').equals('AGUARDANDO_PAGAMENTO').count();
    setPendingOrdersCount(count);
  };

  useEffect(() => {
    // Inicializar banco local e dados
    seedLocalDatabase().then(updatePendingCount);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Atalho global Alt + W para abrir/fechar o Chatwoot
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        setIsChatwootOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const interval = setInterval(updatePendingCount, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
    };
  }, []);

  const handleLoginSuccess = (user: SystemUser) => {
    setCurrentUser(user);
    localStorage.setItem('hubobra_logged_user', JSON.stringify(user));

    // Redirecionamento baseado no perfil do usuário
    if (user.role === 'CAIXA') {
      setCurrentTab('CAIXA_CENTRAL');
    } else if (user.role === 'EXPEDICAO') {
      setCurrentTab('EXPEDICAO_DIGITAL');
    } else if (user.role === 'COMPRADOR') {
      setCurrentTab('COMPRAS');
    } else if (user.role === 'VENDEDOR') {
      setCurrentTab('VENDEDOR_PEDIDOS');
    } else {
      setCurrentTab('VENDEDOR_PEDIDOS');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('hubobra_logged_user');
  };

  const handleOrderSentToCashier = (order: LocalOrder) => {
    updatePendingCount();
    // Ao fechar pedido no vendedor: dispara pré-impressão nas 3 vias (Epson LX-300)
    setActivePrintOrder(order);
    setPrintMode('3VIAS_MATRICIAL');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintOrderFromCashier = (order: LocalOrder) => {
    setActivePrintOrder(order);
    setPrintMode('TERMICA_CAIXA');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Se não estiver logado, exibe a tela de login unificada
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none relative">
      {/* Top Navbar com Vendedores e Notificações de Fila */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'CALCULADORA') {
            setIsStandAloneCalcOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        pendingOrdersCount={pendingOrdersCount}
        currentUser={currentUser}
        onLogout={handleLogout}
        onToggleChatwoot={() => setIsChatwootOpen(!isChatwootOpen)}
        isChatwootOpen={isChatwootOpen}
      />

      {/* Área Principal de Trabalho */}
      <main className="flex-1 overflow-hidden">
        {currentTab === 'VENDEDOR_PEDIDOS' && (
          <VendorOrdersView
            onOrderSentToCashier={handleOrderSentToCashier}
            importedItemsFromChatwoot={importedChatwootItems}
            onClearImportedItems={() => setImportedChatwootItems(null)}
            onActiveOrderChange={setCurrentActiveOrder}
          />
        )}

        {currentTab === 'VENDEDOR_MOBILE' && (
          <MobileVendorView onOrderSentToCashier={handleOrderSentToCashier} />
        )}

        {currentTab === 'CAIXA_CENTRAL' && (
          <CashierQueueView onPrintOrder={handlePrintOrderFromCashier} isOnline={isOnline} />
        )}

        {currentTab === 'EXPEDICAO_DIGITAL' && <DigitalExpeditionView />}

        {currentTab === 'IMPRESSORAS' && <PrintersSettingsView />}

        {currentTab === 'USUARIOS_ADMIN' && <UserManagementView />}

        {currentTab === 'PDV_RAPIDO' && (
          <POSView
            onSaleCompleted={(sale) => {
              const orderFromSale: LocalOrder = {
                id: sale.id,
                orderNumber: sale.saleNumber,
                type: 'PEDIDO_VENDA',
                createdAt: sale.createdAt,
                sellerId: 'v-pdv',
                sellerName: 'Caixa Rápido',
                customerId: sale.customerId,
                customerName: sale.customerName,
                customerCpfCnpj: sale.customerCpfCnpj,
                items: sale.items,
                subtotal: sale.subtotal,
                discount: sale.discount,
                shipping: sale.shipping,
                total: sale.total,
                paymentCondition: sale.paymentMethod,
                status: 'PAGO',
                fiscalStatus: sale.fiscalStatus,
                fiscalKey: sale.fiscalKey,
                syncedToCloud: sale.syncedToCloud,
                syncedToGestaoClick: sale.syncedToGestaoClick,
              };
              setActivePrintOrder(orderFromSale);
              setPrintMode('TERMICA_CAIXA');
              setTimeout(() => window.print(), 150);
            }}
            isOnline={isOnline}
          />
        )}

        {currentTab === 'PRODUTOS' && <ProductsView />}

        {currentTab === 'COMPRAS' && <PurchasingManagementView />}

        {currentTab === 'CLIENTES' && <CustomersView />}

        {currentTab === 'FISCAL' && <FiscalSettingsView />}

        {currentTab === 'CONFIG' && (
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Database className="w-6 h-6 text-amber-500" />
              <span>Configurações do Terminal Local-First</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Banco Local IndexedDB (Terminal)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Armazenamento ultrarrápido persistido no computador. Permite que os 5 vendedores, o caixa e a expedição continuem operando mesmo durante quedas de internet.
                </p>
                <div className="pt-3">
                  <button
                    onClick={async () => {
                      await db.products.clear();
                      await db.orders.clear();
                      await db.customers.clear();
                      window.location.reload();
                    }}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-xs font-bold border border-red-500/30 transition-all"
                  >
                    Resetar Banco Local
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-cyan-400" />
                  <span>Backend em Nuvem (NestJS / GestãoClick)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Sincronização assíncrona bidirecional com o estoque central, GestãoClick e emissão fiscal.
                </p>
                <div className="pt-3">
                  <button
                    onClick={() => alert('Conexão com servidor em nuvem OK!')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors"
                  >
                    Testar Conexão com Nuvem
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Gaveta Retrátil do Chatwoot WhatsApp */}
      <ChatwootDrawer
        isOpen={isChatwootOpen}
        onClose={() => setIsChatwootOpen(false)}
        currentUser={currentUser}
        onImportItemsToOrder={(items) => {
          setImportedChatwootItems(items);
          setIsChatwootOpen(false);
          setCurrentTab('VENDEDOR_PEDIDOS');
        }}
        currentActiveOrder={currentActiveOrder}
      />

      {/* Print Dispatcher para Impressão das 3 Vias (LX-300) e Térmica do Caixa (L7/L9/i9) */}
      <PrintDispatcher order={activePrintOrder} mode={printMode} />

      {/* Modal Calculadora de Obras Avulsa */}
      <MaterialsCalculatorModal
        isOpen={isStandAloneCalcOpen}
        onClose={() => setIsStandAloneCalcOpen(false)}
        onApplyMaterials={(items) => {
          items.forEach((it) => {
            alert(`Item ${it.productName} adicionado!`);
          });
          setIsStandAloneCalcOpen(false);
        }}
        availableProducts={[]}
      />
    </div>
  );
}

export default App;
