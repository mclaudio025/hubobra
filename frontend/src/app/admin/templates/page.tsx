'use client';

import { Download, FileText, Info } from 'lucide-react';

export default function Templates() {
  const templates = [
    {
      name: 'Template Básico de Produtos',
      description: 'Template simples com campos essenciais para cadastro de produtos',
      filename: 'template_produtos_basico.csv',
      fields: ['name', 'price', 'category', 'sku', 'description', 'stock'],
      example: 'Cimento CP II 50kg,25.90,Cimento e Argamassa,CIM001,Cimento Portland,100'
    },
    {
      name: 'Template Completo de Produtos',
      description: 'Template com todos os campos disponíveis para cadastro detalhado',
      filename: 'template_produtos_completo.csv',
      fields: ['name', 'price', 'category', 'subcategory', 'brand', 'description', 'specifications', 'stock', 'sku', 'barcode', 'weight', 'dimensions', 'images', 'tags', 'active'],
      example: 'Cimento CP II 50kg,25.90,Cimento e Argamassa,Cimento,Votoran,Cimento Portland,Resistência 32MPa,100,CIM001,789123456,50,50x30x10cm,img1.jpg|img2.jpg,cimento;construção,true'
    },
    {
      name: 'Template de Materiais Elétricos',
      description: 'Template específico para produtos da categoria elétrica',
      filename: 'template_eletricos.csv',
      fields: ['name', 'price', 'category', 'brand', 'voltage', 'power', 'sku', 'stock'],
      example: 'Lâmpada LED 12W,15.90,Elétrica,Philips,220V,12W,LED001,200'
    },
    {
      name: 'Template de Tintas e Vernizes',
      description: 'Template específico para tintas, vernizes e produtos químicos',
      filename: 'template_tintas.csv',
      fields: ['name', 'price', 'category', 'brand', 'volume', 'color', 'finish', 'coverage', 'sku', 'stock'],
      example: 'Tinta Acrílica Premium,89.90,Tintas e Vernizes,Suvinil,18L,Branco,Fosco,35m²/L,TIN001,50'
    }
  ];

  const downloadTemplate = (template: typeof templates[0]) => {
    let csvContent = '';
    
    switch (template.filename) {
      case 'template_produtos_basico.csv':
        csvContent = [
          'name,price,category,sku,description,stock',
          'Cimento CP II 50kg,25.90,Cimento e Argamassa,CIM001,Cimento Portland CP II-E-32,100',
          'Tijolo Cerâmico 6 Furos,0.45,Tijolos e Blocos,TIJ001,Tijolo cerâmico para alvenaria,5000',
          'Tinta Acrílica Branca 18L,89.90,Tintas e Vernizes,TIN001,Tinta acrílica premium,50'
        ].join('\n');
        break;
        
      case 'template_produtos_completo.csv':
        csvContent = [
          'name,price,category,subcategory,brand,description,specifications,stock,sku,barcode,weight,dimensions,images,tags,active',
          'Cimento CP II 50kg,25.90,Cimento e Argamassa,Cimento,Votoran,"Cimento Portland CP II-E-32","Resistência: 32 MPa",100,CIM001,7891234567890,50,"50x30x10cm","img1.jpg|img2.jpg","cimento,construção,votoran",true',
          'Tijolo Cerâmico 6 Furos,0.45,Tijolos e Blocos,Tijolo Cerâmico,Cerâmica São João,"Tijolo cerâmico de 6 furos","Dimensões: 14x19x29cm",5000,TIJ001,7891234567891,2.8,"14x19x29cm","tijolo1.jpg","tijolo,cerâmico,alvenaria",true',
          'Tinta Acrílica Branca 18L,89.90,Tintas e Vernizes,Tinta Acrílica,Suvinil,"Tinta acrílica premium","Cobertura: 35m²/L",50,TIN001,7891234567892,18,"25x25x35cm","tinta1.jpg|tinta2.jpg","tinta,acrílica,branca,suvinil",true'
        ].join('\n');
        break;
        
      case 'template_eletricos.csv':
        csvContent = [
          'name,price,category,brand,voltage,power,sku,stock',
          'Lâmpada LED 12W,15.90,Elétrica,Philips,220V,12W,LED001,200',
          'Interruptor Simples,8.50,Elétrica,Tramontina,220V,10A,INT001,150',
          'Tomada 2P+T,12.90,Elétrica,Pial Legrand,220V,20A,TOM001,100'
        ].join('\n');
        break;
        
      case 'template_tintas.csv':
        csvContent = [
          'name,price,category,brand,volume,color,finish,coverage,sku,stock',
          'Tinta Acrílica Premium,89.90,Tintas e Vernizes,Suvinil,18L,Branco,Fosco,35m²/L,TIN001,50',
          'Verniz Marítimo,45.90,Tintas e Vernizes,Coral,3.6L,Incolor,Brilhante,12m²/L,VER001,30',
          'Esmalte Sintético,32.90,Tintas e Vernizes,Sherwin Williams,900ml,Azul,Brilhante,8m²/L,ESM001,80'
        ].join('\n');
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = template.filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Templates para Importação</h1>
          <p className="text-gray-600">
            Baixe os templates CSV para facilitar a importação em massa de produtos. 
            Cada template contém exemplos e campos específicos para diferentes tipos de produtos.
          </p>
        </div>

        {/* Instruções */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <Info className="h-6 w-6 text-blue-600 mr-3 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Como usar os templates</h2>
              <ul className="text-blue-800 space-y-1">
                <li>1. Baixe o template mais adequado ao seu tipo de produto</li>
                <li>2. Abra o arquivo em um editor de planilhas (Excel, Google Sheets, etc.)</li>
                <li>3. Substitua os dados de exemplo pelos seus produtos</li>
                <li>4. Salve o arquivo em formato CSV (separado por vírgulas)</li>
                <li>5. Use a função de importação no painel administrativo</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Lista de Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((template, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Campos inclusos:</h4>
                <div className="flex flex-wrap gap-1">
                  {template.fields.map((field, fieldIndex) => (
                    <span
                      key={fieldIndex}
                      className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Exemplo:</h4>
                <div className="bg-gray-50 p-3 rounded text-xs text-gray-600 font-mono overflow-x-auto">
                  {template.example}
                </div>
              </div>

              <button
                onClick={() => downloadTemplate(template)}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                <Download className="h-4 w-4" />
                Baixar Template
              </button>
            </div>
          ))}
        </div>

        {/* Dicas Adicionais */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-900 mb-4">Dicas Importantes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-yellow-800">
            <div>
              <h3 className="font-medium mb-2">Campos Obrigatórios:</h3>
              <ul className="text-sm space-y-1">
                <li>• <strong>name</strong>: Nome do produto</li>
                <li>• <strong>price</strong>: Preço (use ponto para decimais)</li>
                <li>• <strong>category</strong>: Categoria do produto</li>
                <li>• <strong>sku</strong>: Código único do produto</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Formatação:</h3>
              <ul className="text-sm space-y-1">
                <li>• Use vírgula para separar campos</li>
                <li>• Use aspas duplas para textos com vírgulas</li>
                <li>• Múltiplas imagens: separe com |</li>
                <li>• Múltiplas tags: separe com vírgula</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
