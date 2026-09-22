'use client';

import { useState, useRef } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';

interface ImportResult {
  success: number;
  errors: Array<{ row: number; message: string; data: any }>;
  warnings: Array<{ row: number; message: string; data: any }>;
}

export default function ImportacaoProdutos() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);
    setShowPreview(false);

    // Preview do arquivo
    if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
      const text = await selectedFile.text();
      const lines = text.split('\n').slice(0, 6); // Primeiras 5 linhas + header
      const csvData = lines.map(line => line.split(','));
      setPreview(csvData);
      setShowPreview(true);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);

    try {
      const { useProducts } = await import('../../hooks/useApi');
      const productsApi = useProducts();
      const result = await productsApi.importProducts(file);
      setResult(result);
    } catch (error: any) {
      console.error('Erro na importação:', error);
      setResult({
        success: 0,
        errors: [{ row: 0, message: error.message || 'Erro ao processar arquivo', data: {} }],
        warnings: []
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      'name,price,category,subcategory,brand,description,specifications,stock,sku,barcode,weight,dimensions,images,tags,active',
      'Cimento CP II 50kg,25.90,Cimento e Argamassa,Cimento,Votoran,"Cimento Portland CP II-E-32 para uso geral em construção civil","Resistência: 32 MPa; Tempo de pega: 1-10h",100,CIM001,7891234567890,50,"50x30x10cm","https://example.com/cimento1.jpg|https://example.com/cimento2.jpg","cimento,construção,votoran,cp2",true',
      'Tijolo Cerâmico 6 Furos,0.45,Tijolos e Blocos,Tijolo Cerâmico,Cerâmica São João,"Tijolo cerâmico de 6 furos para alvenaria","Dimensões: 14x19x29cm; Resistência: 2,5 MPa",5000,TIJ001,7891234567891,2.8,"14x19x29cm","https://example.com/tijolo1.jpg","tijolo,cerâmico,alvenaria,6furos",true',
      'Tinta Acrílica Branca 18L,89.90,Tintas e Vernizes,Tinta Acrílica,Suvinil,"Tinta acrílica premium para paredes internas e externas","Cobertura: 35m²/L; Secagem: 30min",50,TIN001,7891234567892,18,"25x25x35cm","https://example.com/tinta1.jpg|https://example.com/tinta2.jpg","tinta,acrílica,branca,suvinil,18l",true'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_importacao_produtos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadErrorReport = () => {
    if (!result || result.errors.length === 0) return;

    const csvContent = [
      'Linha,Erro,Dados',
      ...result.errors.map(error => 
        `${error.row},"${error.message}","${JSON.stringify(error.data).replace(/"/g, '""')}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio_erros_importacao.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Importação de Produtos</h1>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            <Download className="h-4 w-4" />
            Baixar Template
          </button>
        </div>

        {/* Instruções */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Como importar produtos</h2>
          <div className="space-y-2 text-blue-800">
            <p>1. Baixe o template CSV clicando no botão "Baixar Template"</p>
            <p>2. Preencha o arquivo com os dados dos seus produtos</p>
            <p>3. Salve o arquivo em formato CSV (separado por vírgulas)</p>
            <p>4. Faça o upload do arquivo preenchido</p>
            <p>5. Revise os dados na prévia e confirme a importação</p>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="font-semibold text-yellow-800 mb-2">Campos obrigatórios:</h3>
            <p className="text-yellow-700">name, price, category, sku</p>
          </div>
        </div>

        {/* Upload de arquivo */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Selecionar Arquivo</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!file ? (
              <div>
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Arraste um arquivo CSV ou Excel aqui, ou clique para selecionar</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
                >
                  Selecionar Arquivo
                </button>
              </div>
            ) : (
              <div>
                <FileText className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-gray-900 font-semibold">{file.name}</p>
                <p className="text-gray-600 mb-4">{(file.size / 1024).toFixed(1)} KB</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Trocar arquivo
                  </button>
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreview([]);
                      setShowPreview(false);
                      setResult(null);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remover
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview dos dados */}
        {showPreview && preview.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Prévia dos Dados</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {preview[0]?.map((header, index) => (
                      <th key={index} className="px-4 py-2 text-left text-sm font-semibold text-gray-900 border-b">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(1, 6).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-2 text-sm text-gray-700">
                          {cell.length > 30 ? `${cell.substring(0, 30)}...` : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Mostrando primeiras 5 linhas. Total de linhas no arquivo: {preview.length - 1}
            </p>
          </div>
        )}

        {/* Botão de importação */}
        {file && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Confirmar Importação</h2>
                <p className="text-gray-600">Clique em "Importar" para processar o arquivo</p>
              </div>
              <button
                onClick={handleImport}
                disabled={loading}
                className="bg-green-600 text-white px-8 py-3 rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Importando...' : 'Importar Produtos'}
              </button>
            </div>
          </div>
        )}

        {/* Resultado da importação */}
        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Resultado da Importação</h2>
            
            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-green-900">{result.success}</p>
                    <p className="text-green-700">Produtos importados</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <X className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-red-900">{result.errors.length}</p>
                    <p className="text-red-700">Erros</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-yellow-900">{result.warnings.length}</p>
                    <p className="text-yellow-700">Avisos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Erros */}
            {result.errors.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-red-900">Erros Encontrados</h3>
                  <button
                    onClick={downloadErrorReport}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Baixar relatório de erros
                  </button>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {result.errors.slice(0, 10).map((error, index) => (
                    <div key={index} className="mb-2 pb-2 border-b border-red-200 last:border-b-0">
                      <p className="text-red-800 font-medium">Linha {error.row}: {error.message}</p>
                      <p className="text-red-600 text-sm">{JSON.stringify(error.data)}</p>
                    </div>
                  ))}
                  {result.errors.length > 10 && (
                    <p className="text-red-600 text-sm mt-2">
                      E mais {result.errors.length - 10} erros...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Avisos */}
            {result.warnings.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-yellow-900 mb-4">Avisos</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {result.warnings.slice(0, 10).map((warning, index) => (
                    <div key={index} className="mb-2 pb-2 border-b border-yellow-200 last:border-b-0">
                      <p className="text-yellow-800 font-medium">Linha {warning.row}: {warning.message}</p>
                      <p className="text-yellow-600 text-sm">{JSON.stringify(warning.data)}</p>
                    </div>
                  ))}
                  {result.warnings.length > 10 && (
                    <p className="text-yellow-600 text-sm mt-2">
                      E mais {result.warnings.length - 10} avisos...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
