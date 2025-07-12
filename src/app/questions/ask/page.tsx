'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RichTextEditor from '@/components/RichTextEditor';
import { ArrowLeft, Tag, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AskQuestionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not authenticated
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim() || tags.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content,
          tags,
          isAnonymous,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Question posted successfully!');
        router.push(`/questions/${data.id}`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to post question');
      }
    } catch (error) {
      toast.error('An error occurred while posting your question');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/questions" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Questions
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Ask a Question</h1>
          <p className="text-gray-600 mt-2">
            Share your knowledge and help others in the community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your question? Be specific."
              className="text-lg"
              maxLength={300}
            />
            <p className="text-sm text-gray-500 mt-1">
              {title.length}/300 characters
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Details *
            </label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Provide all the information someone would need to answer your question..."
            />
          </div>

          {/* Tags */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags * (up to 5)
            </label>
            <div className="flex gap-2 mb-3">
              <Input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || tags.length >= 5}
                variant="outline"
              >
                <Tag className="h-4 w-4" />
              </Button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            <p className="text-sm text-gray-500 mt-2">
              Tags help categorize your question and make it easier to find
            </p>
          </div>

          {/* Anonymous Option */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Post Anonymously
                </label>
                <p className="text-sm text-gray-500">
                  Your question will be posted without showing your name
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={isAnonymous ? 'bg-blue-50 border-blue-200' : ''}
              >
                {isAnonymous ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Anonymous
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Public
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link href="/questions">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim() || tags.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Posting...' : 'Post Question'}
            </Button>
          </div>
        </form>

        {/* Guidelines */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Writing a Good Question</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Be specific and provide enough context</li>
            <li>• Include relevant code examples if applicable</li>
            <li>• Explain what you've already tried</li>
            <li>• Use clear and descriptive language</li>
            <li>• Add appropriate tags to help others find your question</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 