export default function TestPage() {
  return (
    <div className="min-h-screen bg-red-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">Teste Tailwind CSS</h1>
        <p className="text-gray-700 text-lg mb-4">Se você está vendo este texto estilizado, o Tailwind CSS está funcionando!</p>
        <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded">
          <p className="text-green-700 font-semibold">✅ Tailwind CSS está carregado corretamente</p>
        </div>
        <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
          <p className="text-yellow-700">🔍 Teste de cores e espaçamento</p>
        </div>
      </div>
    </div>
  );
}