'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Bell, 
  User, 
  LogIn, 
  LogOut, 
  Plus,
  Bookmark,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function Navigation() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">StackIt</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2"
              />
            </div>
          </form>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            <Link href="/questions">
              <Button variant="ghost" size="sm">
                Questions
              </Button>
            </Link>
            
            <Link href="/tags">
              <Button variant="ghost" size="sm">
                Tags
              </Button>
            </Link>

            {session?.user && (
              <>
                <Link href="/questions/ask">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-1" />
                    Ask Question
                  </Button>
                </Link>

                <Link href="/bookmarks">
                  <Button variant="ghost" size="sm">
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </Link>

                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    3
                  </span>
                </Button>

                <div className="flex items-center space-x-2">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                  
                  <div className="relative group">
                    <Button variant="ghost" size="sm">
                      {session.user.name}
                    </Button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden group-hover:block">
                      <Link href="/profile">
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </Button>
                      </Link>
                      {session.user.role === 'admin' && (
                        <Link href="/admin">
                          <Button variant="ghost" size="sm" className="w-full justify-start">
                            <Settings className="h-4 w-4 mr-2" />
                            Admin Panel
                          </Button>
                        </Link>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start text-red-600 hover:text-red-700"
                        onClick={() => signOut()}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!session && (
              <Button onClick={() => signIn()} size="sm">
                <LogIn className="h-4 w-4 mr-1" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 