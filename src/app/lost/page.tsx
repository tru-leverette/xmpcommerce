export default function LostPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">You seem lost</h1>
      <p>You do not have access to this page or you are not logged in.</p>
      <a href="/login" className="mt-4 text-blue-600 underline">Go to Login</a>
    </div>
  );
}