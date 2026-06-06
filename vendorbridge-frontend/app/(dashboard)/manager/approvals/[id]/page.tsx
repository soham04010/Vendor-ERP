export default async function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Approval Detail</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Approval ID: {id}</p>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Coming soon</p>
      </div>
    </div>
  );
}
