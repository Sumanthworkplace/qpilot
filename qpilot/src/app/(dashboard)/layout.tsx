'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Home, Plus, LogOut } from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🚀</span>
              <span className="text-xl font-bold text-gray-800">QPilot</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/" className="px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50">
                <Home className="inline h-4 w-4 mr-1" />
                Home
              </Link>
              <Link href="/new-paper" className="px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50">
                <Plus className="inline h-4 w-4 mr-1" />
                New Paper
              </Link>
              <Link href="/my-papers" className="px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50">
                <FileText className="inline h-4 w-4 mr-1" />
                My Papers
              </Link>
              <Link href="/login" className="px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50">
                <LogOut className="inline h-4 w-4 mr-1" />
                Logout
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}