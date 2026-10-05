import React from 'react';
import { LocalOrder } from '../db/db';
import { PrinterConfig, DEFAULT_PRINTER_CONFIGS } from './PrintersSettingsView';

interface PrintDispatcherProps {
  order: LocalOrder | null;
  mode: '3VIAS_MATRICIAL' | 'TERMICA_CAIXA' | 'ORCAMENTO_A4';
}

export const PrintDispatcher: React.FC<PrintDispatcherProps> = ({ order, mode }) => {
  if (!order) return null;

  const savedConfigs: PrinterConfig[] = (() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('hubobra_printer_configs') : null;
    return raw ? JSON.parse(raw) : DEFAULT_PRINTER_CONFIGS;
  })();

  const matrixConfig = savedConfigs.find((c) => c.type === 'MATRIX_LX300') || DEFAULT_PRINTER_CONFIGS[1];
  const thermalConfig = savedConfigs.find((c) => c.type === 'THERMAL_80MM') || DEFAULT_PRINTER_CONFIGS[0];

  if (mode === '3VIAS_MATRICIAL') {
    return (
      <div id="thermal-receipt" className="hidden print:block font-mono text-[10px] leading-tight text-black p-2 bg-white max-w-[210mm] mx-auto">
        {/* Renderiza as 3 Vias com separadores */}
        {[matrixConfig.via1Title, matrixConfig.via2Title, matrixConfig.via3Title].map((viaTitle, viaIdx) => {
          const isExpeditionVia = viaIdx === 2;
          return (
            <div key={viaIdx} className="mb-4 pb-4 border-b border-dashed border-black page-break-after">
              <div className="flex justify-between items-start border-b border-black pb-1 mb-1">
                <div>
                  <h2 className="font-black text-xs uppercase">HUBOBRA - MATERIAIS DE CONSTRUÇÃO (DEP. SÃO JOSÉ)</h2>
                  <p className="text-[9px]">CNPJ: 12.345.678/0001-90 | Fone: (85) 99999-8888</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-xs font-mono">{order.orderNumber}</span>
                  <p className="text-[9px] font-bold bg-black text-white px-1.5 py-0.5 rounded">{viaTitle}</p>
                </div>
              </div>

              {/* Informações do Atendimento */}
              <div className="grid grid-cols-2 text-[9px] border-b border-black pb-1 mb-1">
                <div>
                  <p><strong>Cliente:</strong> {order.customerName}</p>
                  {order.customerPhone && <p><strong>Telefone:</strong> {order.customerPhone}</p>}
                </div>
                <div className="text-right">
                  <p><strong>Vendedor:</strong> {order.sellerName}</p>
                  <p><strong>Data/Hora:</strong> {new Date(order.createdAt).toLocaleString('pt-BR')}</p>
                </div>
              </div>

              {/* Tabela de Itens */}
              <table className="w-full text-left text-[9px] mb-2">
                <thead>
                  <tr className="border-b border-black font-bold">
                    <th className="py-0.5">ITEM</th>
                    <th className="py-0.5">LOCAL NO GALPÃO</th>
                    <th className="py-0.5 text-center">UN</th>
                    <th className="py-0.5 text-center">QTD</th>
                    {!isExpeditionVia && <th className="py-0.5 text-right">VL. UNIT</th>}
                    {!isExpeditionVia && <th className="py-0.5 text-right">TOTAL</th>}
                    {isExpeditionVia && <th className="py-0.5 text-center">CONFERIDO</th>}
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it, idx) => (
                    <tr key={idx} className="border-b border-dotted border-gray-400">
                      <td className="py-0.5 font-bold truncate max-w-[200px]">{idx + 1}. {it.name}</td>
                      <td className="py-0.5 text-[8px] font-mono">{it.location || 'Pátio Central'}</td>
                      <td className="py-0.5 text-center">{it.unit}</td>
                      <td className="py-0.5 text-center font-black">{it.quantity}</td>
                      {!isExpeditionVia && <td className="py-0.5 text-right font-mono">R$ {it.unitPrice.toFixed(2)}</td>}
                      {!isExpeditionVia && <td className="py-0.5 text-right font-mono font-bold">R$ {it.total.toFixed(2)}</td>}
                      {isExpeditionVia && <td className="py-0.5 text-center font-mono">[  ]</td>}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totais ou Assinaturas */}
              <div className="flex justify-between items-end pt-1">
                {!isExpeditionVia ? (
                  <>
                    <div className="text-[8px] max-w-[60%]">
                      <p>Condição: <strong>{order.paymentCondition || 'A Vista no Caixa'}</strong></p>
                      {order.payments && order.payments.length > 1 && (
                        <div className="mt-0.5 space-y-0.2 text-[7px] text-gray-700">
                          {order.payments.map((p, pIdx) => (
                            <p key={pIdx}>• {p.method}: R$ {p.amount.toFixed(2)} {p.notes ? `(${p.notes})` : ''}</p>
                          ))}
                        </div>
                      )}
                      {order.change && order.change > 0 ? (
                        <p className="text-[7.5px] font-bold">Troco Devolvido: R$ {order.change.toFixed(2)}</p>
                      ) : null}
                      {order.notes && <p>Obs: {order.notes}</p>}
                    </div>
                    <div className="text-right text-xs font-black">
                      <span>TOTAL: R$ {order.total.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full grid grid-cols-2 gap-4 text-[8px] pt-3">
                    <div className="border-t border-black text-center pt-1">
                      <span>Visto do Conferente / Galpão</span>
                    </div>
                    <div className="border-t border-black text-center pt-1">
                      <span>Assinatura do Motorista / Cliente</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Modo Térmica 80mm
  return (
    <div id="thermal-receipt" className="hidden print:block font-mono text-[11px] leading-tight text-black p-2 bg-white max-w-[80mm] mx-auto">
      <div className="text-center pb-2 border-b border-dashed border-black">
        <h1 className="text-xs font-black uppercase">HUBOBRA MATERIAIS DE CONSTRUÇÃO</h1>
        <p className="text-[9px]">CNPJ: 12.345.678/0001-90 | IE: 06.123.456-7</p>
        <p className="text-[9px]">Av. Depósito São José, 1000 - Fone: (85) 99999-8888</p>
      </div>

      <div className="py-1.5 border-b border-dashed border-black text-center text-[10px]">
        <p className="font-bold">COMPROVANTE DE PEDIDO / PAGAMENTO</p>
        <p>Pedido: <strong>{order.orderNumber}</strong> | Vendedor: {order.sellerName}</p>
        <p>Cliente: {order.customerName}</p>
      </div>

      <div className="py-2 border-b border-dashed border-black">
        <div className="flex justify-between font-bold border-b border-black pb-1 mb-1 text-[10px]">
          <span>QTD x ITEM</span>
          <span>TOTAL</span>
        </div>
        <div className="space-y-1">
          {order.items.map((it, idx) => (
            <div key={idx} className="text-[10px]">
              <div className="font-bold truncate">{idx + 1}. {it.name}</div>
              <div className="flex justify-between text-gray-800">
                <span>{it.quantity} {it.unit} x R$ {it.unitPrice.toFixed(2)}</span>
                <span className="font-bold">R$ {it.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="py-2 border-b border-dashed border-black text-xs space-y-1">
        <div className="flex justify-between font-black text-sm">
          <span>TOTAL:</span>
          <span>R$ {order.total.toFixed(2)}</span>
        </div>
        <div className="text-[9px] text-gray-700">
          <p className="font-bold">Forma: {order.paymentCondition || 'PIX / Dinheiro'}</p>
          {order.payments && order.payments.length > 1 && (
            <div className="mt-0.5 space-y-0.5 pl-1 border-l border-gray-400">
              {order.payments.map((p, pIdx) => (
                <div key={pIdx} className="flex justify-between text-[8.5px]">
                  <span>{p.method} {p.notes ? `(${p.notes})` : ''}:</span>
                  <span className="font-mono font-bold">R$ {p.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          {order.change && order.change > 0 ? (
            <div className="flex justify-between text-[9px] font-bold text-gray-900 pt-0.5">
              <span>Troco Devolvido:</span>
              <span className="font-mono">R$ {order.change.toFixed(2)}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="pt-2 text-center text-[8px] text-gray-600">
        <p>Apresente este cupom no balcão de expedição.</p>
        <p>Obrigado pela preferência!</p>
      </div>
    </div>
  );
};
