'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Eye,
  Settings,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportResult {
  success: number;
  errors: Array<{ row: number; message: string; data: any }>;
  warnings: Array<{ row: number; message: string; data: any }>;
  message: string;
}

export default function ImportProductsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importOptions, setImportOptions] = useState({
    updateExisting: true,
    createCategories: true,
    skipErrors: true,
    batchSize: 100,
    autoFetchImages: true,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setPreviewData([]);
      setShowPreview(false);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setResult(null);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('http://localhost:8080/products/import/template');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template-importacao-produtos.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Sucesso',
          description: 'Template baixado com sucesso!'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao baixar template',
        variant: 'destructive'
      });
    }
  };

  const previewFile = async () => {
    if (!file) return;

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('preview', 'true');

      const response = await fetch('http://localhost:8080/products/import/preview', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewData(data.preview || []);
        setShowPreview(true);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao visualizar arquivo',
        variant: 'destructive'
      });
    } finally {
      setImporting(false);
    }
  };

  const importProducts = async () => {
    if (!file) return;

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('options', JSON.stringify(importOptions));

      const response = await fetch('http://localhost:8080/products/import', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        
        if (data.success > 0) {
          toast({
            title: 'Importação Concluída',
            description: `${data.success} produtos importados com sucesso!`
          });
        }
      } else {
        throw new Error('Erro na importação');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro durante a importação',
        variant: 'destructive'
      });
    } finally {
      setImporting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Importação de Produtos</h1>
        <p className="text-gray-600 mt-2">
          Importe produtos em massa usando arquivos Excel ou CSV
        </p>
      </div>

      {/* Template Download */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Template de Importação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Baixe o template com exemplos e instruções detalhadas
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Campos obrigatórios e opcionais</li>
                <li>• Exemplos de produtos de construção</li>
                <li>• Categorias sugeridas</li>
                <li>• Instruções de preenchimento</li>
              </ul>
            </div>
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Baixar Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload do Arquivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <FileSpreadsheet className="h-12 w-12 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.size)} • {file.type}
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Trocar Arquivo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={previewFile}
                    disabled={importing}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium">
                    Arraste seu arquivo aqui ou clique para selecionar
                  </p>
                  <p className="text-sm text-gray-500">
                    Suporta arquivos Excel (.xlsx) e CSV
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Selecionar Arquivo
                </Button>
              </div>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Import Options */}
      {file && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Opções de Importação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={importOptions.updateExisting}
                  onChange={(e) => setImportOptions({
                    ...importOptions,
                    updateExisting: e.target.checked
                  })}
                />
                <span className="text-sm">Atualizar produtos existentes</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={importOptions.createCategories}
                  onChange={(e) => setImportOptions({
                    ...importOptions,
                    createCategories: e.target.checked
                  })}
                />
                <span className="text-sm">Criar categorias automaticamente</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={importOptions.skipErrors}
                  onChange={(e) => setImportOptions({
                    ...importOptions,
                    skipErrors: e.target.checked
                  })}
                />
                <span className="text-sm">Pular linhas com erro</span>
              </label>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm">Tamanho do lote:</span>
                <select
                  value={importOptions.batchSize}
                  onChange={(e) => setImportOptions({
                    ...importOptions,
                    batchSize: parseInt(e.target.value)
                  })}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={500}>500</option>
                </select>
              </div>

              <label className="flex items-start space-x-3 p-3 rounded-xl bg-blue-50/80 border border-blue-200 col-span-1 md:col-span-2 cursor-pointer hover:bg-blue-50 transition-colors">
                <input
                  type="checkbox"
                  checked={importOptions.autoFetchImages}
                  onChange={(e) => setImportOptions({
                    ...importOptions,
                    autoFetchImages: e.target.checked
                  })}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-blue-900 text-sm">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Buscar e baixar imagens automaticamente por EAN / Nome na Internet
                  </div>
                  <p className="text-xs text-blue-700/90 mt-0.5">
                    Para produtos sem foto na planilha, o sistema pesquisa a foto oficial do fabricante, converte para WebP e associa ao produto automaticamente.
                  </p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {showPreview && previewData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Prévia do Arquivo ({previewData.length} produtos)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Nome</th>
                    <th className="text-left p-2">Preço</th>
                    <th className="text-left p-2">Categoria</th>
                    <th className="text-left p-2">SKU</th>
                    <th className="text-left p-2">Estoque</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 10).map((product, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{product.name}</td>
                      <td className="p-2">R$ {product.price}</td>
                      <td className="p-2">{typeof product.category === 'object' ? product.category?.name || 'Sem categoria' : product.category}</td>
                      <td className="p-2">{product.sku}</td>
                      <td className="p-2">{product.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 10 && (
                <p className="text-center text-gray-500 mt-4">
                  ... e mais {previewData.length - 10} produtos
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Button */}
      {file && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Pronto para importar</h3>
                <p className="text-sm text-gray-600">
                  Arquivo selecionado e opções configuradas
                </p>
              </div>
              <Button
                onClick={importProducts}
                disabled={importing}
                className="min-w-[120px]"
              >
                {importing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Produtos
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Resultado da Importação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {result.success}
                  </div>
                  <div className="text-sm text-green-700">Sucessos</div>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {result.errors.length}
                  </div>
                  <div className="text-sm text-red-700">Erros</div>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {result.warnings.length}
                  </div>
                  <div className="text-sm text-yellow-700">Avisos</div>
                </div>
              </div>

              <div className="text-center">
                <Badge variant={result.success > 0 ? 'default' : 'destructive'}>
                  {result.message}
                </Badge>
              </div>

              {/* Errors */}
              {result.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Erros ({result.errors.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-sm bg-red-50 p-2 rounded">
                        <span className="font-medium">Linha {error.row}:</span> {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div>
                  <h4 className="font-semibold text-yellow-600 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Avisos ({result.warnings.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.warnings.map((warning, index) => (
                      <div key={index} className="text-sm bg-yellow-50 p-2 rounded">
                        <span className="font-medium">Linha {warning.row}:</span> {warning.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
