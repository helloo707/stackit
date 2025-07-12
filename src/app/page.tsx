'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Users, 
  BookOpen,
  Plus,
  Tag,
  Zap,
  Cpu,
  Rocket,
  ArrowRight,
  Sparkles,
  Globe,
  Shield,
  Brain,
  CloudLightning
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // useEffect(() => {
  //   if (status === 'loading') return;
    
  //   if (session) {
  //     router.push('/dashboard');
  //   }
  // }, [session, status, router]);

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden ">
        {/* Grid and Pattern Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-grid z-0"></div>
          <div className="absolute inset-0 bg-pattern z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/90"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue/5 via-purple/5 to-emerald/5"></div>
          </div>
        </div>
        <div className="relative z-10 pt-16">
          <Navigation />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue mx-auto"></div>
              <p className="mt-4 text-muted-foreground font-inter">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render the landing page if user is logged in (will redirect to dashboard)
  // if (session) {
  //   return null;
  // }
  return (
    <div className="min-h-screen bg-background relative overflow-hidden ">
      {/* Enhanced Animated Background with Grid */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-grid z-0"></div>
        <div className="absolute inset-0 bg-pattern z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/90"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue/5 via-purple/5 to-emerald/5"></div>
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-ocean rounded-full opacity-20 blur-3xl float-animation"></div>
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-gradient-forest rounded-full opacity-20 blur-3xl float-animation" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-fire rounded-full opacity-20 blur-3xl float-animation" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>

      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 pt-16">
        <div className="max-w-7xl mx-auto text-center relative z-10 pt-16">
          <div className="slide-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-ocean text-foreground  px-6 py-3 rounded-full text-sm font-medium mb-8 shadow-glow">
              <Sparkles className="h-4 w-4" />
              The Future of Q&A is Here
            </div>
            
            <h1 className="text-responsive font-bold mb-6 text-foreground bg-gradient-to-r from-blue via-purple to-emerald bg-clip-text dark:bg-clip-text font-orbitron font-inter">
              StackIt
          </h1>
            
            <p className="text-responsive-lg mb-8 text-foreground max-w-3xl mx-auto leading-relaxed font-inter">
              Experience the next generation of collaborative learning. 
              Where questions meet answers in a seamless, intelligent platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/questions">
                <Button 
                  size="lg" 
                  className="bg-blue text-white shadow-futuristic pulse-glow group hover:bg-blue-light focus:bg-blue-light"
                >
                  <Search className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform" />
                  Explore Questions
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/questions/ask">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-purple text-purple hover:bg-purple hover:text-white transition-all duration-300 group shadow-glow"
                >
                  <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform" />
                Ask a Question
              </Button>
            </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="card-modern p-6 rounded-2xl slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="text-4xl text-blue mb-2">1,234</div>
              <div className="text-foreground font-medium">Questions Asked</div>
            </div>
            <div className="card-modern p-6 rounded-2xl slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="text-4xl text-emerald mb-2">5,678</div>
              <div className="text-foreground font-medium">Answers Given</div>
            </div>
            <div className="card-modern p-6 rounded-2xl slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="text-4xl text-purple mb-2">890</div>
              <div className="text-foreground font-medium">Active Users</div>
            </div>
            <div className="card-modern p-6 rounded-2xl slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="text-4xl text-orange mb-2">156</div>
              <div className="text-foreground font-medium">Tags Created</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 slide-up">
            <h2 className="text-3xl font-bold mb-4 text-foreground font-inter">
              Why Choose StackIt?
            </h2>
            <p className="text-foreground max-w-2xl mx-auto font-inter">
              Built for the modern developer with cutting-edge features and seamless collaboration
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card-modern p-8 rounded-2xl group slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8 text-blue" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground font-inter">Community-Driven</h3>
              <p className="text-foreground leading-relaxed font-inter">
                Join a vibrant community of learners and experts sharing knowledge and helping each other grow.
              </p>
            </div>
            
            <div className="card-modern p-8 rounded-2xl group slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Brain className="h-8 w-8 text-emerald" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground font-inter">AI-Powered</h3>
              <p className="text-foreground leading-relaxed font-inter">
                Advanced AI algorithms help you find the best answers and suggest relevant questions.
              </p>
            </div>
            
            <div className="card-modern p-8 rounded-2xl group slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CloudLightning className="h-8 w-8 text-orange" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground font-inter">Lightning Fast</h3>
              <p className="text-foreground leading-relaxed font-inter">
                Experience blazing-fast search and real-time collaboration with instant updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 slide-up">
            <h2 className="text-3xl font-bold mb-4 text-foreground font-inter">
              Get Started Today
            </h2>
            <p className="text-foreground max-w-2xl mx-auto font-inter">
              Choose your path and start contributing to the community
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            <Link href="/questions">
              <div className="card-modern p-6 rounded-2xl cursor-pointer group slide-up h-full flex flex-col" style={{ animationDelay: '0.1s' }}>
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Search className="h-6 w-6 text-blue" />
                  </div>
                </div>
                <h3 className="font-bold mb-2 text-foreground font-inter">Browse Questions</h3>
                <p className="text-sm text-foreground font-inter">Explore existing questions and find answers</p>
              </div>
            </Link>
            
            <Link href="/questions/ask">
              <div className="card-modern p-6 rounded-2xl cursor-pointer group slide-up h-full flex flex-col" style={{ animationDelay: '0.2s' }}>
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="h-6 w-6 text-emerald" />
                  </div>
                </div>
                <h3 className="font-bold mb-2 text-foreground font-inter">Ask a Question</h3>
                <p className="text-sm text-foreground font-inter">Post your question to the community</p>
              </div>
            </Link>
            
            <Link href="/tags">
              <div className="card-modern p-6 rounded-2xl cursor-pointer group slide-up h-full flex flex-col" style={{ animationDelay: '0.3s' }}>
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Tag className="h-6 w-6 text-purple" />
                  </div>
                </div>
                <h3 className="font-bold mb-2 text-foreground font-inter">Explore Tags</h3>
                <p className="text-sm text-foreground font-inter">Find topics that interest you</p>
              </div>
            </Link>
            
            <Link href="/auth/signin">
              <div className="card-modern p-6 rounded-2xl cursor-pointer group slide-up h-full flex flex-col" style={{ animationDelay: '0.4s' }}>
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="h-6 w-6 text-orange" />
                  </div>
                </div>
                <h3 className="font-bold mb-2 text-foreground font-inter">Join Community</h3>
                <p className="text-sm text-foreground font-inter">Sign up to participate fully</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4 text-foreground font-inter">
                StackIt
              </h3>
              <p className="text-foreground font-inter">
                A community-driven question and answer platform for developers and learners.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-foreground font-inter">Platform</h4>
              <ul className="space-y-2 text-foreground font-inter">
                <li><Link href="/questions" className="hover:text-blue transition-colors">Questions</Link></li>
                <li><Link href="/tags" className="hover:text-purple transition-colors">Tags</Link></li>
                <li><Link href="/users" className="hover:text-emerald transition-colors">Users</Link></li>
                <li><Link href="/help" className="hover:text-orange transition-colors">Help</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-foreground font-inter">Community</h4>
              <ul className="space-y-2 text-foreground font-inter">
                <li><Link href="/guidelines" className="hover:text-rose transition-colors">Guidelines</Link></li>
                <li><Link href="/privacy" className="hover:text-indigo transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-blue transition-colors">Terms</Link></li>
                <li><Link href="/contact" className="hover:text-purple transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-foreground font-inter">Connect</h4>
              <p className="text-foreground mb-4 font-inter">
                Join our community and start contributing today.
              </p>
              <Link href="/auth/signin">
                <Button className="bg-gradient-ocean hover:bg-gradient-ocean/90 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-foreground font-inter">
            <p>&copy; 2024 StackIt. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
