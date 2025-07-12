'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RichTextEditor from '@/components/RichTextEditor';
import { 
  Loader2, 
  AlertCircle,
  Save,
  X,
  Tag
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Question {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  author: {
    _id: string;
    email: string;
  };
}

export default function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchQuestion();
  }, [session, status]);

  const fetchQuestion = async () => {
    try {
      const { id } = await params;
      const response = await fetch(`/api/questions/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        setQuestion(data.question);
        setTitle(data.question.title);
        setContent(data.question.content);
        setTags(data.question.tags || []);
      } else {
        const error = await response.json();
        setError(error.message || 'Failed to fetch question');
        toast.error(error.message || 'Failed to fetch question');
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
    
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    if (tags.length === 0) {
      toast.error('At least one tag is required');
      return;
    }

    setSaving(true);

    try {
      const { id } = await params;
      const response = await fetch(`/api/questions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          tags,
        }),
      });

      if (response.ok) {
        toast.success('Question updated successfully');
        router.push(`/questions/${id}`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update question');
      }
    } catch (error) {
      toast.error('An error occurred while updating the question');
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
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
              <p className="mt-4 text-muted-foreground font-inter">Loading question...</p>
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

  if (!question) {
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
              <h3 className="mt-4 text-lg font-medium text-foreground font-inter">Question not found</h3>
              <p className="mt-2 text-muted-foreground font-inter">The question you're looking for doesn't exist.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is the author
  if (question.author.email !== session.user?.email) {
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
              <p className="mt-2 text-muted-foreground font-inter">You can only edit your own questions.</p>
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
          <h1 className="text-3xl font-bold text-foreground">Edit Question</h1>
          <p className="text-muted-foreground mt-2">Update your question to make it clearer and more helpful.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
              Title *
            </label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your question? Be specific."
              className="w-full"
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              Make sure your title clearly describes your problem.
            </p>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-foreground mb-2">
              Content *
            </label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Provide all the information someone would need to answer your question..."
            />
            <p className="text-sm text-muted-foreground mt-1">
              Include relevant code, error messages, and context.
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tags * (up to 5)
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag..."
                className="flex-1"
              />
              <Button
                type="button"
                onClick={addTag}
                disabled={!tagInput.trim() || tags.length >= 5}
                variant="outline"
              >
                Add
              </Button>
            </div>
            
            {/* Tag list */}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-blue/10 text-blue text-sm px-3 py-1 rounded-full font-inter"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-blue-light"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            
            <p className="text-sm text-muted-foreground mt-1">
              Tags help others find your question. Use relevant programming languages, frameworks, or technologies.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              disabled={saving || !title.trim() || !content.trim() || tags.length === 0}
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
            
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="font-inter"
            >
              Cancel
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
} 