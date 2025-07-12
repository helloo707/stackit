'use client';

import { useState, useEffect } from 'react';
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
    if (!title.trim()) {
      setTitleError('Title is required');
      isValid = false;
    } else if (title.trim().length < 10) {
      setTitleError('Title must be at least 10 characters long');
      isValid = false;
    } else if (title.trim().length > 300) {
      setTitleError('Title must be less than 300 characters');
      isValid = false;
    } else {
      setTitleError('');
    }

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
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/questions" className="inline-flex items-center text-blue hover:text-blue-light mb-4 font-inter">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Questions
          </Link>
          <h1 className="text-3xl font-bold text-foreground font-inter">Ask a Question</h1>
          <p className="text-muted-foreground mt-2 font-inter">
            Share your knowledge and help others in the community
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2 w-full max-w-md">
            <Link href="/questions" className="w-full sm:w-auto">
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim() || tags.length === 0}
              className="bg-blue hover:bg-blue-light w-full"
              form="ask-question-form"
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
        </div>

        {/* Form Card */}
        <form id="ask-question-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card rounded-2xl shadow-md border border-border p-6 space-y-6 font-inter">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2 font-inter">
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
                placeholder="What's your question? Be specific."
                className={`text-lg ${titleError ? 'border-red-500' : ''}`}
                maxLength={300}
              />
              <div className="flex justify-between items-center mt-1">
                <p className={`text-sm ${titleCount.color}`}>{titleCount.count}/300 characters</p>
                {titleError && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {titleError}
                  </p>
                )}
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 font-inter">
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
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 font-inter">
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
                      className="bg-blue/10 text-blue text-sm px-3 py-1 rounded-full flex items-center gap-1 font-inter"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-blue hover:text-blue-dark"
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
                  <p className="text-sm text-muted-foreground mb-2">Suggested tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleSuggestedTagClick(tag)}
                        disabled={tags.includes(tag) || tags.length >= 5}
                        className="bg-muted text-foreground text-sm px-3 py-1 rounded-full hover:bg-muted-foreground/10 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
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
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-foreground font-inter">
                    Post Anonymously
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Your question will be posted without showing your name
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={isAnonymous ? 'bg-blue/10 border-blue' : ''}
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
          </div>
        </form>

        {/* Guidelines Card */}
        <div className="bg-card border border-border rounded-2xl p-6 mt-8 font-inter">
          <h3 className="text-lg font-semibold text-blue mb-3 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Writing a Good Question
          </h3>
          <ul className="space-y-2 text-sm text-foreground">
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