import React from 'react';
import { LocalSale } from '../db/db';

interface ThermalReceiptProps {
  sale: LocalSale | null;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ sale }) => {
  if (!sale) return null;

  return (
    <div id="thermal-receipt" className="hidden print:block font-mono text-[11px] leading-tight text-black p-2 bg-white max-w-[80mm] mx-auto">
      {/* Cabeçalho da Empresa */}
      <div className="text-center pb-2 border-b border-dashed border-black">
        <h1 className="text-sm font-bold uppercase tracking-wide">HUBOBRA MATERIAIS DE CONSTRUÇÃO</h1>
        <p className="text-[10px]">CNPJ: 12.345.678/0001-90 | IE: 06.123.456-7</p>
        <p className="text-[10px]">Av. Principal da Obra, 1000 - Fortaleza / CE</p>
        <p className="text-[10px]">WhatsApp: (85) 99999-8888</p>
      </div>

      {/* Identificação do Documento */}
      <div className="py-2 border-b border-dashed border-black text-center">
        <p className="font-bold text-xs uppercase">
          {sale.fiscalStatus === 'CONTINGENCY_EMITTED'
            ? 'DANFE NFC-e - EMITIDA EM CONTINGÊNCIA'
            : sale.fiscalStatus === 'AUTHORIZED_SEFAZ'
            ? 'DOCUMENTO AUXILIAR DA NFC-e'
            : 'COMPROVANTE DE VENDA - BALCÃO'}
        </p>
        <p className="text-[10px]">Venda Nº: {sale.saleNumber} | Data: {new Date(sale.createdAt).toLocaleString('pt-BR')}</p>
        <p className="text-[10px]">Operador: {sale.cashierName}</p>
      </div>

      {/* Dados do Cliente */}
      <div className="py-1.5 border-b border-dashed border-black text-[10px]">
        <p><strong>Cliente:</strong> {sale.customerName || 'Consumidor Final'}</p>
        {sale.customerCpfCnpj && <p><strong>CPF/CNPJ:</strong> {sale.customerCpfCnpj}</p>}
      </div>

      {/* Tabela de Itens */}
      <div className="py-2 border-b border-dashed border-black">
        <div className="flex justify-between font-bold border-b border-black pb-1 mb-1">
          <span>QTD x ITEM</span>
          <span>TOTAL</span>
        </div>

        <div className="space-y-1.5">
          {sale.items.map((item, idx) => (
            <div key={idx} className="text-[10px]">
              <div className="font-medium truncate">{idx + 1}. {item.name}</div>
              <div className="flex justify-between text-gray-700">
                <span>{item.quantity} {item.unit} x R$ {item.unitPrice.toFixed(2)}</span>
                <span className="font-bold text-black">R$ {item.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totais */}
      <div className="py-2 border-b border-dashed border-black space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>R$ {sale.subtotal.toFixed(2)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Desconto:</span>
            <span>- R$ {sale.discount.toFixed(2)}</span>
          </div>
        )}
        {sale.shipping > 0 && (
          <div className="flex justify-between">
            <span>Frete / Entrega:</span>
            <span>R$ {sale.shipping.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-sm pt-1 border-t border-black">
          <span>TOTAL A PAGAR:</span>
          <span>R$ {sale.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Forma de Pagamento */}
      <div className="py-2 border-b border-dashed border-black text-[10px] space-y-0.5">
        <div className="flex justify-between font-bold">
          <span>Forma de Pagto:</span>
          <span>{sale.paymentMethod}</span>
        </div>
        {sale.cashReceived && sale.cashReceived > 0 && (
          <>
            <div className="flex justify-between">
              <span>Valor Recebido:</span>
              <span>R$ {sale.cashReceived.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Troco:</span>
              <span>R$ {(sale.changeAmount || 0).toFixed(2)}</span>
            </div>
          </>
        )}
      </div>

      {/* QR Code / Chave Fiscal se NFC-e */}
      {sale.fiscalKey && (
        <div className="py-2 text-center border-b border-dashed border-black">
          <p className="font-bold text-[9px] uppercase">Chave de Acesso SEFAZ:</p>
          <p className="text-[8px] break-all font-mono">{sale.fiscalKey}</p>
          <div className="mt-1 flex justify-center">
            {/* Representação visual simplificada de QR Code para impressão térmica */}
            <div className="w-20 h-20 border border-black flex items-center justify-center text-[8px] font-mono">
              [QR-CODE NFC-e]
            </div>
          </div>
        </div>
      )}

      {/* Rodapé */}
      <div className="pt-2 text-center text-[9px] text-gray-800">
        <p>Obrigado pela preferência!</p>
        <p>HubObra - Tudo para sua obra do alicerce ao acabamento.</p>
        <p className="text-[8px] text-gray-500 mt-1">Desenvolvido com HubObra Local-First ERP</p>
      </div>
    </div>
  );
};
