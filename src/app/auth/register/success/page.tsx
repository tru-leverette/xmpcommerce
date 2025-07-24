import Link from 'next/link';

export default function RegistrationSuccess() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                <h1 className="text-2xl font-bold text-green-700 mb-4">Registration Successful!</h1>
                <p className="text-gray-700 mb-6">
                    Your account has been created. Please log in with your credentials to continue.
                </p>
                <Link
                    href="/auth/login"
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                    Go to Login
                </Link>
            </div>
        </div>
    );
}
