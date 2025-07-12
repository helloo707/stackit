'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Users, 
  BookOpen,
  Search,
  Plus,
  Tag
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (session) {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render the landing page if user is logged in (will redirect to dashboard)
  if (session) {
    return null;
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to StackIt
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            The community-driven platform where knowledge meets collaboration
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/questions">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <Search className="h-5 w-5 mr-2" />
                Browse Questions
              </Button>
            </Link>
            <Link href="/questions/ask">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                <Plus className="h-5 w-5 mr-2" />
                Ask a Question
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">1,234</div>
              <div className="text-gray-600">Questions Asked</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">5,678</div>
              <div className="text-gray-600">Answers Given</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">890</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">156</div>
              <div className="text-gray-600">Tags Created</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose StackIt?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community-Driven</h3>
              <p className="text-gray-600">
                Join a vibrant community of learners and experts sharing knowledge and helping each other grow.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Rich Content</h3>
              <p className="text-gray-600">
                Use our powerful rich text editor to create detailed questions and answers with code, images, and formatting.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Features</h3>
              <p className="text-gray-600">
                Enjoy AI-powered features like ELI5 explanations, smart search, and intelligent question prioritization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Get Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/questions">
              <div className="bg-gray-50 p-6 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <Search className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold mb-2">Browse Questions</h3>
                <p className="text-sm text-gray-600">Explore existing questions and find answers</p>
              </div>
            </Link>
            
            <Link href="/questions/ask">
              <div className="bg-gray-50 p-6 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <Plus className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-semibold mb-2">Ask a Question</h3>
                <p className="text-sm text-gray-600">Post your question to the community</p>
              </div>
            </Link>
            
            <Link href="/tags">
              <div className="bg-gray-50 p-6 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <Tag className="h-8 w-8 text-purple-600 mb-3" />
                <h3 className="font-semibold mb-2">Explore Tags</h3>
                <p className="text-sm text-gray-600">Find topics that interest you</p>
              </div>
            </Link>
            
            <Link href="/auth/signin">
              <div className="bg-gray-50 p-6 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <Users className="h-8 w-8 text-orange-600 mb-3" />
                <h3 className="font-semibold mb-2">Join Community</h3>
                <p className="text-sm text-gray-600">Sign up to participate fully</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">StackIt</h3>
              <p className="text-gray-300">
                A community-driven question and answer platform for developers and learners.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/questions" className="hover:text-white">Questions</Link></li>
                <li><Link href="/tags" className="hover:text-white">Tags</Link></li>
                <li><Link href="/users" className="hover:text-white">Users</Link></li>
                <li><Link href="/help" className="hover:text-white">Help</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/guidelines" className="hover:text-white">Guidelines</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <p className="text-gray-300 mb-4">
                Join our community and start contributing today.
              </p>
              <Link href="/auth/signin">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 StackIt. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
