'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  User,
  LogOut,
  Bell,
  Search,
  Plus,
  Bookmark,
  Menu,
  X,
  TrendingUp,
  MessageSquare,
  Shield,
  Flag,
  Trash2,
  Users,
  LogIn,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import NotificationModal from './NotificationModal';

export default function Navigation() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close mobile menu when route changes
  useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && !(event.target as Element).closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      if (!session) return;
      try {
        const response = await fetch('/api/notifications?filter=unread');
        if (response.ok) {
          const data = await response.json();
          setUnreadNotificationsCount(data.pagination?.total || 0);
        }
      } catch (error) {
        setUnreadNotificationsCount(0);
      }
    };
    fetchUnreadNotifications();
    const intervalId = setInterval(fetchUnreadNotifications, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [session]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/questions?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      searchRef.current?.blur();
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-opacity-80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-foreground">StackIt</span>
          </Link>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                ref={searchRef}
                type="text"
                placeholder="Search questions, tags, or users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                className="pl-10 pr-4 py-2 bg-background border-border focus:border-ring focus:ring-ring"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/questions">
              <Button
                variant="ghost"
                size="sm"
                className={isActive('/questions') ? 'text-muted-foreground hover:text-foreground hover:bg-accent' : ''}
              >
                Questions
              </Button>
            </Link>
            <Link href="/tags">
              <Button
                variant="ghost"
                size="sm"
                className={isActive('/tags') ? 'text-muted-foreground hover:text-foreground hover:bg-accent' : ''}
              >
                Tags
              </Button>
            </Link>
            <ThemeToggle />
            {session?.user ? (
              <>
                <Link href="/questions/ask">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="h-4 w-4 mr-1" />
                    Ask Question
                  </Button>
                </Link>
                <Link href="/bookmarks">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={isActive('/bookmarks') ? 'text-muted-foreground hover:text-foreground hover:bg-accent' : ''}
                  >
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative"
                  onClick={() => setShowNotificationModal(true)}
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </Button>
                <div className="relative user-menu">
                  <div className="flex items-center space-x-2">
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        className="w-8 h-8 rounded-full cursor-pointer"
                        onClick={() => setShowUserMenu((v) => !v)}
                      />
                    ) : (
                      <div
                        className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center cursor-pointer"
                        onClick={() => setShowUserMenu((v) => !v)}
                      >
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowUserMenu((v) => !v)}
                      className="hidden sm:block"
                    >
                      {session.user.name}
                    </Button>
                  </div>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <User className="h-4 w-4 mr-2" />
                          Dashboard
                        </Button>
                      </Link>
                      <Link href="/profile">
                        <Button variant="ghost" size="sm" className="w-full justify-start text-popover-foreground hover:bg-accent">
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </Button>
                      </Link>
                      <Link href="/my-questions">
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          My Questions
                        </Button>
                      </Link>
                      <Link href="/my-answers">
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          My Answers
                        </Button>
                      </Link>
                      {session.user.role === 'admin' && (
                        <>
                          <div className="border-t border-gray-200 my-1" />
                          <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Admin
                          </div>
                          <Link href="/admin/dashboard">
                            <Button variant="ghost" size="sm" className="w-full justify-start">
                              <Shield className="h-4 w-4 mr-2" />
                              Admin Dashboard
                            </Button>
                          </Link>
                        </>
                      )}
                      <div className="border-t border-gray-200 my-1" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => signOut()}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Button onClick={() => signIn()} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <LogIn className="h-4 w-4 mr-1" />
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileMenu((v) => !v)}
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        {showMobileMenu && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2"
                />
              </div>
            </form>
          </div>
        )}

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-2">
              <Link href="/questions">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start ${isActive('/questions') ? 'bg-blue-50 text-blue-700' : ''}`}
                >
                  Questions
                </Button>
              </Link>
              <Link href="/tags">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start ${isActive('/tags') ? 'bg-blue-50 text-blue-700' : ''}`}
                >
                  Tags
                </Button>
              </Link>
              {session?.user ? (
                <>
                  <Link href="/questions/ask">
                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Ask Question
                    </Button>
                  </Link>
                  <Link href="/bookmarks">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`w-full justify-start ${isActive('/bookmarks') ? 'bg-blue-50 text-blue-700' : ''}`}
                    >
                      <Bookmark className="h-4 w-4 mr-2" />
                      Bookmarks
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start`}
                    onClick={() => setShowNotificationModal(true)}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                    {unreadNotificationsCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </Button>
                  <Link href="/dashboard">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`w-full justify-start ${isActive('/dashboard') ? 'bg-blue-50 text-blue-700' : ''}`}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`w-full justify-start ${isActive('/profile') ? 'bg-blue-50 text-blue-700' : ''}`}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                  </Link>
                  {session.user.role === 'admin' && (
                    <>
                      <div className="border-t border-gray-200 my-2" />
                      <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admin
                      </div>
                      <Link href="/admin/dashboard">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`w-full justify-start ${isActive('/admin/dashboard') ? 'bg-blue-50 text-blue-700' : ''}`}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Admin Dashboard
                        </Button>
                      </Link>
                    </>
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
                </>
              ) : (
                <Button onClick={() => signIn()} size="sm" className="w-full">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      <NotificationModal
        open={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />
    </nav>
  );
}