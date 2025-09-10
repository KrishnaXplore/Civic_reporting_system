// components/Header.js
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-md">
      <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-gray-800">
          CivicResolve
        </Link>
        <div>
          <Link href="/login" className="px-4 py-2 text-gray-800">Login</Link>
          <Link href="/report" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Report Issue
          </Link>
        </div>
      </nav>
    </header>
  );
}