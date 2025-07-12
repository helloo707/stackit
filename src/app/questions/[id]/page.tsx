'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import RichTextEditor from '@/components/RichTextEditor';
import FlagButton from '@/components/FlagButton';
import { 
  ArrowLeft, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Eye, 
  Check, 
  User,
  Calendar,
  Tag,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import React, { useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-markup';

interface Answer {
  _id: string;
  content: string;
  eli5Content?: string;
  author: {
    name: string;
    email: string;
    image?: string;
  };
  votes: {
    upvotes: string[];
    downvotes: string[];
  };
  isAccepted: boolean;
  createdAt: string;
}

interface Question {
  _id: string;
  title: string;
  content: string;
  author: {
    name: string;
    email: string;
    image?: string;
  };
  tags: string[];
  votes: {
    upvotes: string[];
    downvotes: string[];
  };
  views: number;
  answers: string[];
  acceptedAnswer?: string;
  createdAt: string;
}

interface QuestionData {
  question: Question;
  answers: Answer[];
}

interface Comment {
  _id: string;
  answerId: string;
  author: {
    name: string;
    email: string;
    image?: string;
  };
  content: string;
  createdAt: string;
  edited?: boolean;
}

function highlightMentions(text: string) {
  return text.replace(/@([\w]+)/g, '<span class="text-blue-600 font-semibold">@$1</span>');
}

export default function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { id } = use(params);
  
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answerContent, setAnswerContent] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);
  const [acceptingAnswer, setAcceptingAnswer] = useState<string | null>(null);
  const [eli5Mode, setEli5Mode] = useState<Record<string, boolean>>({});
  const [generatingEli5, setGeneratingEli5] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [commentsByAnswer, setCommentsByAnswer] = useState<Record<string, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<{ name: string; email: string; image?: string }[]>([]);
  const [mentionDropdown, setMentionDropdown] = useState<{ answerId: string; show: boolean; query: string; position: { top: number; left: number } }>({ answerId: '', show: false, query: '', position: { top: 0, left: 0 } });
  const commentInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentInput, setEditCommentInput] = useState('');

  useEffect(() => {
    fetchQuestion();
  }, [id]);

  useEffect(() => {
    if (questionData?.question._id && session) {
      checkBookmarkStatus();
    }
  }, [questionData?.question._id, session]);

  useEffect(() => {
    // Fetch users for mention suggestions
    fetch('/api/user/list')
      .then(res => res.json())
      .then(data => setAllUsers(data.users || []));
  }, []);

  useEffect(() => {
    if (questionData?.answers) {
      questionData.answers.forEach((answer) => {
        fetchComments(answer._id);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionData]);

  useEffect(() => {
    Prism.highlightAll();
  }, [questionData, commentsByAnswer]);

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/questions/${id}`);
      if (response.ok) {
        const data: QuestionData = await response.json();
        setQuestionData(data);
      } else {
        toast.error('Question not found');
        router.push('/questions');
      }
    } catch {
      toast.error('Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const checkBookmarkStatus = async () => {
    if (!session) return;
    
    try {
      const response = await fetch(`/api/bookmarks/check/${id}`);
      if (response.ok) {
        const data = await response.json();
        setIsBookmarked(data.isBookmarked);
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  const toggleBookmark = async () => {
    if (!session) {
      toast.error('Please sign in to bookmark questions');
      return;
    }

    try {
      if (isBookmarked) {
        // Remove bookmark
        const response = await fetch(`/api/bookmarks/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setIsBookmarked(false);
          toast.success('Bookmark removed');
        } else {
          toast.error('Failed to remove bookmark');
        }
      } else {
        // Add bookmark
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ questionId: id }),
        });

        if (response.ok) {
          setIsBookmarked(true);
          toast.success('Question bookmarked');
        } else {
          toast.error('Failed to bookmark question');
        }
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!answerContent.trim()) {
      toast.error('Please enter an answer');
      return;
    }

    if (!session) {
      toast.error('Please sign in to answer');
      return;
    }

    setSubmittingAnswer(true);

    try {
      const response = await fetch('/api/answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: id,
          content: answerContent.trim(),
        }),
      });

      if (response.ok) {
        toast.success('Answer posted successfully!');
        setAnswerContent('');
        fetchQuestion(); // Refresh to show new answer
      } else {
        toast.error('Failed to post answer');
      }
    } catch {
      toast.error('An error occurred while posting your answer');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleVote = async (type: 'question' | 'answer', id: string, voteType: 'upvote' | 'downvote') => {
    if (!session) {
      toast.error('Please sign in to vote');
      return;
    }

    setVoting(id);

    try {
      const endpoint = type === 'question' 
        ? `/api/questions/${id}/vote`
        : `/api/answers/${id}/vote`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voteType }),
      });

      if (response.ok) {
        fetchQuestion(); // Refresh to show updated votes
      } else {
        toast.error('Failed to vote');
      }
    } catch {
      toast.error('An error occurred while voting');
    } finally {
      setVoting(null);
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    if (!session) {
      toast.error('Please sign in to accept answers');
      return;
    }

    setAcceptingAnswer(answerId);

    try {
      const response = await fetch(`/api/questions/${id}/accept-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answerId }),
      });

      if (response.ok) {
        toast.success('Answer accepted!');
        fetchQuestion(); // Refresh to show accepted answer
      } else {
        toast.error('Failed to accept answer');
      }
    } catch {
      toast.error('An error occurred while accepting the answer');
    } finally {
      setAcceptingAnswer(null);
    }
  };

  const handleGenerateELI5 = async (answerId: string) => {
    if (!session) {
      toast.error('Please sign in to generate ELI5');
      return;
    }

    setGeneratingEli5(answerId);

    try {
      const response = await fetch(`/api/answers/${answerId}/eli5`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('ELI5 generated successfully!');
        fetchQuestion(); // Refresh to show ELI5 content
      } else {
        toast.error('Failed to generate ELI5');
      }
    } catch {
      toast.error('An error occurred while generating ELI5');
    } finally {
      setGeneratingEli5(null);
    }
  };

  const toggleELI5 = (answerId: string) => {
    setEli5Mode(prev => ({
      ...prev,
      [answerId]: !prev[answerId]
    }));
  };

  const getVoteCount = (votes: { upvotes: string[]; downvotes: string[] }) => {
    return votes.upvotes.length - votes.downvotes.length;
  };

  const hasUserVoted = (votes: { upvotes: string[]; downvotes: string[] }, voteType: 'upvote' | 'downvote') => {
    if (!session?.user?.id) return false;
    return voteType === 'upvote' 
      ? votes.upvotes.includes(session.user.id)
      : votes.downvotes.includes(session.user.id);
  };

  const isQuestionAuthor = () => {
    return session?.user?.email === questionData?.question.author.email;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const fetchComments = async (answerId: string) => {
    try {
      const res = await fetch(`/api/comments?answerId=${answerId}`);
      if (res.ok) {
        const data = await res.json();
        setCommentsByAnswer((prev) => ({ ...prev, [answerId]: data.comments }));
      }
    } catch {
      // Optionally handle error
    }
  };

  const handleSubmitComment = async (answerId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    const content = commentInputs[answerId]?.trim();
    if (!content) return;
    setSubmittingComment(answerId);
    // Parse mentions (usernames after @)
    const mentionMatches = content.match(/@([\w]+)/g) || [];
    const mentionedNames = mentionMatches.map(m => m.slice(1));
    // Map usernames to user objects
    const mentionedUsers = allUsers.filter(u => mentionedNames.includes(u.name));
    const mentions = mentionedUsers.map(u => u.email); // Or use user IDs if available
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerId, content, mentions }),
      });
      if (res.ok) {
        const data = await res.json();
        setCommentsByAnswer((prev) => ({
          ...prev,
          [answerId]: [...(prev[answerId] || []), data.comment],
        }));
        setCommentInputs((prev) => ({ ...prev, [answerId]: '' }));
      } else {
        toast.error('Failed to post comment');
      }
    } catch {
      toast.error('An error occurred while posting your comment');
    } finally {
      setSubmittingComment(null);
    }
  };

  const handleCommentInputChange = (answerId: string, value: string, e: React.ChangeEvent<HTMLInputElement>) => {
    setCommentInputs(prev => ({ ...prev, [answerId]: value }));
    // Detect @mention
    const input = e.target;
    const cursorPos = input.selectionStart || 0;
    const textBefore = value.slice(0, cursorPos);
    const match = /@([\w]*)$/.exec(textBefore);
    if (match) {
      // Get position for dropdown
      const rect = input.getBoundingClientRect();
      setMentionDropdown({
        answerId,
        show: true,
        query: match[1],
        position: { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX },
      });
    } else {
      setMentionDropdown(prev => ({ ...prev, show: false }));
    }
  };

  const handleMentionSelect = (answerId: string, username: string) => {
    const input = commentInputRefs.current[answerId];
    if (!input) return;
    const value = commentInputs[answerId] || '';
    const cursorPos = input.selectionStart || 0;
    const textBefore = value.slice(0, cursorPos);
    const match = /@([\w]*)$/.exec(textBefore);
    if (match) {
      const start = match.index;
      const newValue = value.slice(0, start) + '@' + username + ' ' + value.slice(cursorPos);
      setCommentInputs(prev => ({ ...prev, [answerId]: newValue }));
      setMentionDropdown(prev => ({ ...prev, show: false }));
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + username.length + 2, start + username.length + 2);
      }, 0);
    }
  };

  const handleDeleteComment = async (answerId: string, commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await fetch('/api/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });
      if (res.ok) {
        setCommentsByAnswer(prev => ({
          ...prev,
          [answerId]: (prev[answerId] || []).filter(c => c._id !== commentId),
        }));
      } else {
        toast.error('Failed to delete comment');
      }
    } catch {
      toast.error('An error occurred while deleting the comment');
    }
  };

  const handleEditComment = async (answerId: string, commentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editCommentInput.trim()) return;
    try {
      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, content: editCommentInput }),
      });
      if (res.ok) {
        const data = await res.json();
        setCommentsByAnswer(prev => ({
          ...prev,
          [answerId]: (prev[answerId] || []).map(c =>
            c._id === commentId ? { ...c, ...data.comment } : c
          ),
        }));
        setEditingCommentId(null);
        setEditCommentInput('');
      } else {
        toast.error('Failed to edit comment');
      }
    } catch {
      toast.error('An error occurred while editing the comment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading question...</div>
        </div>
      </div>
    );
  }

  if (!questionData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Question not found</div>
        </div>
      </div>
    );
  }

  const { question, answers } = questionData;

  // Filter out duplicate answers by _id
  const uniqueAnswers = answers.filter(
    (answer, index, self) =>
      index === self.findIndex((a) => a._id === answer._id)
  );

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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{question.title}</h1>
          
          {/* Meta */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Asked by {question.author.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(question.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{question.views} views</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleBookmark}
                className="flex items-center gap-2"
              >
                {isBookmarked ? (
                  <>
                    <BookmarkCheck className="h-4 w-4 text-blue-600" />
                    Bookmarked
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" />
                    Bookmark
                  </>
                )}
              </Button>
              <FlagButton 
                contentType="question" 
                contentId={question._id} 
                className="flex items-center gap-2"
              />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex gap-4">
            {/* Vote buttons */}
            <div className="flex flex-col items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`p-1 ${hasUserVoted(question.votes, 'upvote') ? 'text-blue-600' : ''}`}
                onClick={() => handleVote('question', question._id, 'upvote')}
                disabled={voting === question._id}
              >
                <ThumbsUp className="h-5 w-5" />
              </Button>
              <div className="text-lg font-semibold text-gray-900 my-2">
                {getVoteCount(question.votes)}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`p-1 ${hasUserVoted(question.votes, 'downvote') ? 'text-red-600' : ''}`}
                onClick={() => handleVote('question', question._id, 'downvote')}
                disabled={voting === question._id}
              >
                <ThumbsDown className="h-5 w-5" />
              </Button>
            </div>

            {/* Question content */}
            <div className="flex-1">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: question.content }}
              />
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-6">
                {question.tags.map((tag) => (
                  <Link key={tag} href={`/tags/${tag}`}>
                    <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full hover:bg-blue-200 cursor-pointer flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Answers */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {uniqueAnswers.length} Answer{uniqueAnswers.length !== 1 ? 's' : ''}
            </h2>
          </div>

          {uniqueAnswers.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No answers yet. Be the first to answer this question!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {uniqueAnswers.map((answer) => (
                <div key={answer._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex gap-4">
                    {/* Vote buttons */}
                    <div className="flex flex-col items-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`p-1 ${hasUserVoted(answer.votes, 'upvote') ? 'text-blue-600' : ''}`}
                        onClick={() => handleVote('answer', answer._id, 'upvote')}
                        disabled={voting === answer._id}
                      >
                        <ThumbsUp className="h-5 w-5" />
                      </Button>
                      <div className="text-lg font-semibold text-gray-900 my-2">
                        {getVoteCount(answer.votes)}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`p-1 ${hasUserVoted(answer.votes, 'downvote') ? 'text-red-600' : ''}`}
                        onClick={() => handleVote('answer', answer._id, 'downvote')}
                        disabled={voting === answer._id}
                      >
                        <ThumbsDown className="h-5 w-5" />
                      </Button>
                      {answer.isAccepted && (
                        <div className="mt-2">
                          <Check className="h-6 w-6 text-green-600" />
                        </div>
                      )}
                    </div>

                    {/* Answer content */}
                    <div className="flex-1">
                      <div className="prose max-w-none mb-4">
                        {eli5Mode[answer._id] && answer.eli5Content ? (
                          <div>
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                              <h4 className="text-blue-800 font-medium mb-2">🤔 ELI5 (Explain Like I&apos;m 5)</h4>
                              <div dangerouslySetInnerHTML={{ __html: answer.eli5Content }} />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleELI5(answer._id)}
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            >
                              Show Original Answer
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <div dangerouslySetInnerHTML={{ __html: answer.content }} />
                            {answer.eli5Content && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleELI5(answer._id)}
                                className="text-blue-600 border-blue-600 hover:bg-blue-50 mt-2"
                              >
                                🤔 Show ELI5 Version
                              </Button>
                            )}
                            {!answer.eli5Content && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGenerateELI5(answer._id)}
                                disabled={generatingEli5 === answer._id}
                                className="text-blue-600 border-blue-600 hover:bg-blue-50 mt-2"
                              >
                                {generatingEli5 === answer._id ? 'Generating...' : '🤔 Generate ELI5'}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Meta */}
                      <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{answer.author.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(answer.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FlagButton 
                            contentType="answer" 
                            contentId={answer._id} 
                            className="text-gray-500 hover:text-red-600"
                          />
                          {!answer.isAccepted && isQuestionAuthor() && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAcceptAnswer(answer._id)}
                              disabled={acceptingAnswer === answer._id}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Accept Answer
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="mt-6">
                    <div className="font-semibold text-gray-700 mb-2">Comments</div>
                    <div className="space-y-2 mb-2">
                      {(commentsByAnswer[answer._id] || []).map((comment) => (
                        <div key={comment._id} className="flex items-start gap-2 text-sm">
                          {comment.author.image && (
                            <img src={comment.author.image} alt={comment.author.name} className="w-6 h-6 rounded-full" />
                          )}
                          <div>
                            <span className="font-semibold text-gray-800">{comment.author.name}</span>{' '}
                            <span className="text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                            {comment.edited && <span className="text-xs text-gray-400 ml-2">(edited)</span>}
                            <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: highlightMentions(comment.content) }} />
                            {session?.user?.email === comment.author.email && (
                              <div className="flex gap-2 mt-1">
                                <button
                                  type="button"
                                  className="text-blue-600 hover:underline text-xs"
                                  onClick={() => { setEditingCommentId(comment._id); setEditCommentInput(comment.content); }}
                                >Edit</button>
                                <button
                                  type="button"
                                  className="text-red-600 hover:underline text-xs"
                                  onClick={() => handleDeleteComment(answer._id, comment._id)}
                                >Delete</button>
                              </div>
                            )}
                            {editingCommentId === comment._id && (
                              <form className="flex gap-2 mt-2" onSubmit={e => handleEditComment(answer._id, comment._id, e)}>
                                <input
                                  type="text"
                                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                                  value={editCommentInput}
                                  onChange={e => setEditCommentInput(e.target.value)}
                                  autoFocus
                                />
                                <Button type="submit" size="sm">Save</Button>
                                <Button type="button" size="sm" variant="outline" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                              </form>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {session ? (
                      <form className="flex gap-2 mt-2" onSubmit={e => handleSubmitComment(answer._id, e)}>
                        <input
                          ref={(el: HTMLInputElement | null) => { commentInputRefs.current[answer._id] = el; }}
                          type="text"
                          className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                          placeholder="Add a comment... (use @username to mention)"
                          value={commentInputs[answer._id] || ''}
                          onChange={e => handleCommentInputChange(answer._id, e.target.value, e)}
                          disabled={submittingComment === answer._id}
                        />
                        {/* Mention dropdown */}
                        {mentionDropdown.show && mentionDropdown.answerId === answer._id && (
                          <div
                            className="absolute z-50 bg-white border border-gray-200 rounded shadow-md mt-1"
                            style={{ top: mentionDropdown.position.top, left: mentionDropdown.position.left }}
                          >
                            {allUsers
                              .filter(u => u.name.toLowerCase().includes(mentionDropdown.query.toLowerCase()))
                              .slice(0, 5)
                              .map(u => (
                                <div
                                  key={u.email}
                                  className="px-3 py-2 hover:bg-blue-100 cursor-pointer flex items-center gap-2"
                                  onMouseDown={e => { e.preventDefault(); handleMentionSelect(answer._id, u.name); }}
                                >
                                  {u.image && <img src={u.image} alt={u.name} className="w-5 h-5 rounded-full" />}
                                  <span>{u.name}</span>
                                </div>
                              ))}
                            {allUsers.filter(u => u.name.toLowerCase().includes(mentionDropdown.query.toLowerCase())).length === 0 && (
                              <div className="px-3 py-2 text-gray-400">No users found</div>
                            )}
                          </div>
                        )}
                        <Button
                          type="submit"
                          size="sm"
                          disabled={submittingComment === answer._id || !(commentInputs[answer._id] || '').trim()}
                        >
                          {submittingComment === answer._id ? 'Posting...' : 'Post'}
                        </Button>
                      </form>
                    ) : (
                      <div className="text-xs text-gray-500">Sign in to comment</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Answer Form */}
        {session ? (
          isQuestionAuthor() ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800">You cannot answer your own question.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Answer</h3>
              <form onSubmit={handleSubmitAnswer}>
                <RichTextEditor
                  content={answerContent}
                  onChange={setAnswerContent}
                  placeholder="Write your answer here..."
                />
                <div className="flex justify-end mt-4">
                  <Button
                    type="submit"
                    disabled={submittingAnswer || !answerContent.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {submittingAnswer ? 'Posting...' : 'Post Answer'}
                  </Button>
                </div>
              </form>
            </div>
          )
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-blue-800 mb-4">Please sign in to answer this question</p>
            <Link href="/auth/signin">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Sign In to Answer
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 