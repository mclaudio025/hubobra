import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, CreditCard, Phone, Mail, MapPin } from 'lucide-react';
import { db, LocalCustomer } from '../db/db';

export const CustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<LocalCustomer[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [newCustomer, setNewCustomer] = useState<Partial<LocalCustomer>>({
    name: '',
    cpfCnpj: '',
    phone: '',
    email: '',
    creditLimit: 5000,
    creditUsed: 0,
    notes: '',
  });

  const loadCustomers = async () => {
    const all = await db.customers.toArray();
    setCustomers(all);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) return;

    const customer: LocalCustomer = {
      id: 'c-' + Date.now(),
      name: newCustomer.name,
      cpfCnpj: newCustomer.cpfCnpj,
      phone: newCustomer.phone,
      email: newCustomer.email,
      creditLimit: Number(newCustomer.creditLimit || 0),
      creditUsed: 0,
      notes: newCustomer.notes,
      createdAt: new Date().toISOString(),
      synced: false,
    };

    await db.customers.add(customer);
    setIsNewModalOpen(false);
    setNewCustomer({ name: '', cpfCnpj: '', phone: '', email: '', creditLimit: 5000, creditUsed: 0 });
    await loadCustomers();
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.cpfCnpj && c.cpfCnpj.includes(searchTerm)) ||
      (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            <span>Gestão de Clientes, Obras & Limite de Crediário</span>
          </h2>
          <p className="text-xs text-slate-400">
            Controle de histórico de compras e contas a receber direto no balcão
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewModalOpen(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Cliente</span>
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nome, CPF/CNPJ ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const available = c.creditLimit - c.creditUsed;
          return (
            <div
              key={c.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all shadow-lg"
            >
              <div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                  {c.cpfCnpj || 'Consumidor'}
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5">{c.name}</h3>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800 pt-3">
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {c.notes && (
                  <p className="text-[11px] text-amber-300/80 bg-slate-950 p-2 rounded-lg mt-2">
                    {c.notes}
                  </p>
                )}
              </div>

              {/* Crediário */}
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/80">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-400 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Limite Balcão:
                  </span>
                  <span className="font-bold text-white">R$ {c.creditLimit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Disponível a Prazo:</span>
                  <span className="font-black text-emerald-400">R$ {available.toFixed(2)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Cadastro de Cliente */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCustomer}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-base font-bold text-white">Cadastrar Novo Cliente</h3>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Nome Completo / Razão Social</label>
              <input
                type="text"
                required
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">CPF ou CNPJ</label>
                <input
                  type="text"
                  value={newCustomer.cpfCnpj}
                  onChange={(e) => setNewCustomer({ ...newCustomer, cpfCnpj: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">E-mail</label>
              <input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Limite de Crédito no Balcão (R$)</label>
              <input
                type="number"
                value={newCustomer.creditLimit}
                onChange={(e) => setNewCustomer({ ...newCustomer, creditLimit: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs font-bold text-emerald-400"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Observações / Obra</label>
              <input
                type="text"
                value={newCustomer.notes}
                onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                placeholder="Ex: Obra no condomínio Alphaville"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20"
              >
                Salvar Cliente
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
