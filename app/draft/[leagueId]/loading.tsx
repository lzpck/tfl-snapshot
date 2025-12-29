export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-500 dark:text-gray-400 text-lg">Carregando dados do Draft...</p>
    </div>
  );
}
