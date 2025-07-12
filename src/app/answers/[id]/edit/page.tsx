'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import RichTextEditor from '@/components/RichTextEditor';
import { 
  Loader2, 
  AlertCircle,
  Save,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Answer {
  _id: string;
  content: string;
  question: {
    _id: string;
    title: string;
  };
  author: {
    _id: string;
    email: string;
  };
}

export default function EditAnswerPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [content, setContent] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchAnswer();
  }, [session, status]);

  const fetchAnswer = async () => {
    try {
      const { id } = await params;
      const response = await fetch(`/api/answers/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        setAnswer(data.answer);
        setContent(data.answer.content);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch answer');
        toast.error(errorData.message || 'Failed to fetch answer');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Content is required');
      return;
    }

    setSaving(true);

    try {
      const { id } = await params;
      const response = await fetch(`/api/answers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
        }),
      });

      if (response.ok) {
        toast.success('Answer updated successfully');
        router.push(`/questions/${answer?.question._id}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update answer');
      }
    } catch (err) {
      toast.error('An error occurred while updating the answer');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue font-inter" />
              <p className="mt-4 text-muted-foreground font-inter">Loading answer...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 font-inter">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 font-inter">Error</h3>
                  <p className="mt-1 text-sm text-red-700 font-inter">{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!answer) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground font-inter" />
              <h3 className="mt-4 text-lg font-medium text-foreground font-inter">Answer not found</h3>
              <p className="mt-2 text-muted-foreground font-inter">The answer you&apos;re looking for doesn&apos;t exist.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is the author
  if (answer.author.email !== session.user?.email) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground font-inter" />
              <h3 className="mt-4 text-lg font-medium text-foreground font-inter">Access Denied</h3>
              <p className="mt-2 text-muted-foreground font-inter">You can only edit your own answers.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/questions/${answer.question._id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Question
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Edit Answer</h1>
          <p className="text-muted-foreground mt-2">
            Update your answer to the question: &quot;{answer.question.title}&quot;
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-foreground mb-2">
              Answer Content *
            </label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Provide a clear and helpful answer to the question..."
            />
            <p className="text-sm text-muted-foreground mt-1">
              Make sure your answer is clear, well-structured, and addresses the question completely.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              disabled={saving || !content.trim()}
              className="bg-blue hover:bg-blue-light font-inter"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            
            <Link href={`/questions/${answer.question._id}`}>
              <Button type="button" variant="outline" className="font-inter">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
} 