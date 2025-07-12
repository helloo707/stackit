'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RichTextEditor from '@/components/RichTextEditor';
import { ArrowLeft, Tag, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
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
  const [titleError, setTitleError] = useState('');
  const [contentError, setContentError] = useState('');
  const [tagsError, setTagsError] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<{ _id: string; title: string; createdAt: string }[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Common tags for suggestions
  const commonTags = [
    'javascript', 'react', 'nodejs', 'python', 'java', 'css', 'html', 
    'typescript', 'nextjs', 'mongodb', 'sql', 'aws', 'docker', 'git',
    'algorithm', 'data-structure', 'api', 'frontend', 'backend', 'devops'
  ];

  useEffect(() => {
    // Filter suggested tags based on title and content
    const text = `${title} ${content}`.toLowerCase();
    const relevant = commonTags.filter(tag => 
      text.includes(tag) && !tags.includes(tag)
    );
    setSuggestedTags(relevant.slice(0, 5));
  }, [title, content, tags]);

  useEffect(() => {
    if (!title.trim() && !content.trim()) {
      setSuggestedQuestions([]);
      return;
    }
    setLoadingSuggestions(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ title, content });
        const res = await fetch(`/api/questions/similar?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestedQuestions(data.questions || []);
        } else {
          setSuggestedQuestions([]);
        }
      } catch {
        setSuggestedQuestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content]);

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  const validateForm = () => {
    let isValid = true;
    
    // Title validation
    // if (!title.trim()) {
    //   setTitleError('Title is required');
    //   isValid = false;
    // } else if (title.trim().length < 5) {
    //   setTitleError('Title must be at least 10 characters long');
    //   isValid = false;
    // } else if (title.trim().length > 5) {
    //   setTitleError('Title must be less than 300 characters');
    //   isValid = false;
    // } else {
    //   setTitleError('');
    // }

    // Content validation
    if (!content.trim()) {
      setContentError('Question content is required');
      isValid = false;
    } else if (content.trim().length < 20) {
      setContentError('Question content must be at least 20 characters long');
      isValid = false;
    } else {
      setContentError('');
    }

    // Tags validation
    if (tags.length === 0) {
      setTagsError('At least one tag is required');
      isValid = false;
    } else if (tags.length > 5) {
      setTagsError('Maximum 5 tags allowed');
      isValid = false;
    } else {
      setTagsError('');
    }

    return isValid;
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag) return;

    // Validate tag format
    if (!/^[a-z0-9-]+$/.test(tag)) {
      toast.error('Tags can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    if (tag.length < 2) {
      toast.error('Tags must be at least 2 characters long');
      return;
    }

    if (tag.length > 20) {
      toast.error('Tags must be less than 20 characters');
      return;
    }

    if (tags.includes(tag)) {
      toast.error('Tag already added');
      return;
    }

    if (tags.length >= 5) {
      toast.error('Maximum 5 tags allowed');
      return;
    }

    setTags([...tags, tag]);
    setTagInput('');
    setTagsError('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSuggestedTagClick = (tag: string) => {
    if (!tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagsError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
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
    } catch {
      toast.error('An error occurred while posting your question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCharacterCount = (text: string) => {
    const count = text.length;
    if (count < 10) return { count, color: 'text-red-500' };
    if (count < 50) return { count, color: 'text-yellow-500' };
    return { count, color: 'text-green-500' };
  };

  const titleCount = getCharacterCount(title);

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
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError('');
              }}
              placeholder="What&apos;s your question? Be specific."
              className={`text-lg ${titleError ? 'border-red-500' : ''}`}
              maxLength={300}
            />
            <div className="flex justify-between items-center mt-1">
              <p className={`text-sm ${titleCount.color}`}>
                {titleCount.count}/300 characters
              </p>
              {titleError && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {titleError}
                </p>
              )}
            </div>
          </div>

          {(title.trim() || content.trim()) && (
            <div className="mt-2">
              {loadingSuggestions ? (
                <div className="text-sm text-gray-500 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Checking for similar questions...</div>
              ) : suggestedQuestions.length > 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-2">
                  <div className="text-sm font-medium text-yellow-800 mb-2">Possible duplicates or similar questions:</div>
                  <ul className="space-y-1">
                    {suggestedQuestions.map(q => (
                      <li key={q._id}>
                        <Link href={`/questions/${q._id}`} className="text-blue-700 hover:underline">{q.title}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Details *
            </label>
            <RichTextEditor
              content={content}
              onChange={(newContent) => {
                setContent(newContent);
                if (contentError) setContentError('');
              }}
              placeholder="Provide all the information someone would need to answer your question..."
            />
            {contentError && (
              <p className="text-sm text-red-500 mt-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {contentError}
              </p>
            )}
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
                className={tagsError ? 'border-red-500' : ''}
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
              <div className="flex flex-wrap gap-2 mb-3">
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

            {/* Suggested Tags */}
            {suggestedTags.length > 0 && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">Suggested tags:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleSuggestedTagClick(tag)}
                      disabled={tags.includes(tag) || tags.length >= 5}
                      className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <p className="text-sm text-gray-500">
              Tags help categorize your question and make it easier to find
            </p>
            {tagsError && (
              <p className="text-sm text-red-500 mt-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {tagsError}
              </p>
            )}
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
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Question'
              )}
            </Button>
          </div>
        </form>

        {/* Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Writing a Good Question
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Be specific and provide enough context</li>
            <li>• Include relevant code examples if applicable</li>
            <li>• Explain what you've already tried</li>
            <li>• Use clear and descriptive language</li>
            <li>• Add appropriate tags to help others find your question</li>
            <li>• Check for similar questions before posting</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 