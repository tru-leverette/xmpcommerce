import Link from 'next/link';

export default function HuntErrorPage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Unable to Create Hunt</h1>
                <p className="mb-6 text-gray-700">Sorry we were unable to create your hunt, please try again.</p>
                <Link href="/dashboard" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">Back to Dashboard</Link>
            </div>
        </main>
    );
}
