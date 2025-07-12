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
  BookmarkCheck,
  Bell
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import Image from 'next/image';

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

interface Bounty {
  amount: number;
  status: 'open' | 'awarded' | 'cancelled';
  awardedTo?: string;
  awardedAt?: string;
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
  bounty?: Bounty;
}

interface QuestionData {
  question: Question;
  answers: Answer[];
}

type Comment = {
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
  parent?: string | null;
};

type CommentTreeNode = Comment & { children: CommentTreeNode[] };

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
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [replyTo, setReplyTo] = useState<{ answerId: string; parentId: string | null } | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [isFollowed, setIsFollowed] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [bountyAmount, setBountyAmount] = useState('');
  const [bountyLoading, setBountyLoading] = useState(false);
  const [awardLoading, setAwardLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestion();
  }, [id]);

  useEffect(() => {
    if (questionData?.question._id && session) {
      checkBookmarkStatus();
      checkFollowStatus();
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

  const checkFollowStatus = async () => {
    if (!session) return;
    try {
      const response = await fetch(`/api/questions/${id}/follow`);
      if (response.ok) {
        const data = await response.json();
        setIsFollowed(data.followed);
      }
    } catch {}
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

  const toggleFollow = async () => {
    if (!session) {
      toast.error('Please sign in to follow questions');
      return;
    }
    setFollowLoading(true);
    try {
      if (isFollowed) {
        const response = await fetch(`/api/questions/${id}/follow`, { method: 'DELETE' });
        if (response.ok) {
          setIsFollowed(false);
          toast.success('Unfollowed question');
        } else {
          toast.error('Failed to unfollow');
        }
      } else {
        const response = await fetch(`/api/questions/${id}/follow`, { method: 'POST' });
        if (response.ok) {
          setIsFollowed(true);
          toast.success('Following question');
        } else {
          toast.error('Failed to follow');
        }
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setFollowLoading(false);
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
      toast.error('Please sign in to generate a simplified answer');
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
        toast.success('Simplified answer generated successfully!');
        fetchQuestion(); // Refresh to show simplified answer
      } else {
        toast.error('Failed to generate simplified answer');
      }
    } catch {
      toast.error('An error occurred while generating a simplified answer');
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

  function buildCommentTree(comments: Comment[]): CommentTreeNode[] {
    const map: Record<string, CommentTreeNode> = {};
    const roots: CommentTreeNode[] = [];
    comments.forEach(comment => {
      map[comment._id] = { ...comment, children: [] };
    });
    comments.forEach(comment => {
      if (comment.parent) {
        map[comment.parent]?.children.push(map[comment._id]);
      } else {
        roots.push(map[comment._id]);
      }
    });
    return roots;
  }

  function renderComments(comments: CommentTreeNode[], answerId: string, level = 0): React.ReactElement[] {
    return comments.map(comment => (
      <div key={comment._id} style={{ marginLeft: level * 24 }} className="flex items-start gap-2 text-sm mt-2">
        {comment.author.image && (
          <Image src={comment.author.image} alt={comment.author.name} width={24} height={24} className="w-6 h-6 rounded-full" />
        )}
        <div className="flex-1">
          <span className="font-semibold text-gray-800">{comment.author.name}</span>{' '}
          <span className="text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
          {comment.edited && <span className="text-xs text-gray-400 ml-2">(edited)</span>}
          <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: highlightMentions(comment.content) }} />
          <div className="flex gap-2 mt-1">
            {session?.user?.email === comment.author.email && (
              <>
                <button type="button" className="text-blue-600 hover:underline text-xs" onClick={() => { setEditingCommentId(comment._id); setEditCommentInput(comment.content); }}>Edit</button>
                <button type="button" className="text-red-600 hover:underline text-xs" onClick={() => handleDeleteComment(answerId, comment._id)}>Delete</button>
              </>
            )}
            <button type="button" className="text-gray-600 hover:underline text-xs" onClick={() => { setReplyTo({ answerId, parentId: comment._id }); setReplyInput(''); }}>Reply</button>
          </div>
          {editingCommentId === comment._id && (
            <form className="flex gap-2 mt-2" onSubmit={e => handleEditComment(answerId, comment._id, e)}>
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
          {replyTo && replyTo.parentId === comment._id && replyTo.answerId === answerId && (
            <form className="flex gap-2 mt-2" onSubmit={e => handleSubmitComment(answerId, e, comment._id)}>
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                placeholder="Reply..."
                value={replyInput}
                onChange={e => setReplyInput(e.target.value)}
                autoFocus
              />
              <Button type="submit" size="sm">Reply</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setReplyTo(null)}>Cancel</Button>
            </form>
          )}
          {comment.children && comment.children.length > 0 && renderComments(comment.children, answerId, level + 1)}
        </div>
      </div>
    ));
  }

  const handleSubmitComment = async (answerId: string, e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    if (!session) return;
    const content = parentId ? replyInput.trim() : commentInputs[answerId]?.trim();
    if (!content) return;
    setSubmittingComment(answerId);
    // Parse mentions (usernames after @)
    const mentionMatches = content.match(/@([\w]+)/g) || [];
    const mentionedNames = mentionMatches.map(m => m.slice(1));
    const mentionedUsers = allUsers.filter(u => mentionedNames.includes(u.name));
    const mentions = mentionedUsers.map(u => u.email);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerId, content, mentions, parent: parentId }),
      });
      if (res.ok) {
        const data = await res.json();
        setCommentsByAnswer(prev => ({
          ...prev,
          [answerId]: [...(prev[answerId] || []), data.comment],
        }));
        if (parentId) {
          setReplyTo(null);
          setReplyInput('');
        } else {
          setCommentInputs(prev => ({ ...prev, [answerId]: '' }));
        }
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

  const offerOrIncreaseBounty = async () => {
    if (!bountyAmount.trim() || isNaN(Number(bountyAmount)) || Number(bountyAmount) <= 0) {
      toast.error('Enter a valid bounty amount');
      return;
    }
    setBountyLoading(true);
    try {
      const res = await fetch(`/api/questions/${id}/bounty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(bountyAmount) }),
      });
      if (res.ok) {
        toast.success('Bounty updated!');
        setBountyAmount('');
        fetchQuestion();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to offer bounty');
      }
    } catch {
      toast.error('Failed to offer bounty');
    } finally {
      setBountyLoading(false);
    }
  };

  const awardBounty = async (answerId: string) => {
    setAwardLoading(answerId);
    try {
      const res = await fetch(`/api/questions/${id}/bounty/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerId }),
      });
      if (res.ok) {
        toast.success('Bounty awarded!');
        fetchQuestion();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to award bounty');
      }
    } catch {
      toast.error('Failed to award bounty');
    } finally {
      setAwardLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-muted-foreground font-inter">Loading question...</div>
        </div>
      </div>
    );
  }

  if (!questionData) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-muted-foreground font-inter">Question not found</div>
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
            <Link href="/questions" className="inline-flex items-center text-blue hover:text-blue-light mb-4 font-inter">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Questions
          </Link>
            <h1 className="text-3xl font-bold text-foreground mb-4 font-inter">{question.title}</h1>
          
          {/* Meta */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-6 font-inter">
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
              <Button
                variant={isFollowed ? 'default' : 'outline'}
                size="sm"
                onClick={toggleFollow}
                className="flex items-center gap-2"
                disabled={followLoading}
              >
                <Bell className={`h-4 w-4 ${isFollowed ? 'text-blue-600' : ''}`} />
                {isFollowed ? 'Following' : 'Follow'}
              </Button>
          </div>
        </div>

        {/* Question */}
          <div className="bg-card rounded-2xl shadow-md border border-border p-6 mb-8 font-inter">
            {/* Bounty status display */}
            {question.bounty && (
              <div className="mb-4 flex items-center gap-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  💰 Bounty: {question.bounty.amount} {question.bounty.status === 'awarded' && question.bounty.awardedTo ? '(Awarded)' : question.bounty.status === 'open' ? '(Open)' : '(Cancelled)'}
                </span>
                {question.bounty.status === 'awarded' && question.bounty.awardedTo && (
                  <span className="text-xs text-gray-600">Awarded to user ID: {question.bounty.awardedTo}</span>
                )}
              </div>
            )}
            {/* Bounty offer/increase form for author */}
            {isQuestionAuthor() && (!question.bounty || question.bounty.status === 'open') && (
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  className="border border-gray-300 rounded px-2 py-1 text-sm w-32"
                  placeholder="Bounty amount"
                  value={bountyAmount}
                  onChange={e => setBountyAmount(e.target.value)}
                  disabled={bountyLoading}
                />
                <Button
                  size="sm"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  onClick={offerOrIncreaseBounty}
                  disabled={bountyLoading}
                >
                  {question.bounty && question.bounty.amount > 0 ? 'Increase Bounty' : 'Offer Bounty'}
                </Button>
              </div>
            )}
          <div className="flex gap-4">
            {/* Vote buttons */}
            <div className="flex flex-col items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                  className={`p-1 ${hasUserVoted(question.votes, 'upvote') ? 'text-blue' : ''}`}
                onClick={() => handleVote('question', question._id, 'upvote')}
                disabled={voting === question._id}
              >
                <ThumbsUp className="h-5 w-5" />
              </Button>
                <div className="text-lg font-semibold text-blue my-2 font-inter">
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
                  className="prose max-w-none text-foreground font-inter"
                dangerouslySetInnerHTML={{ __html: question.content }}
              />
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-6">
                {question.tags.map((tag) => (
                  <Link key={tag} href={`/tags/${tag}`}>
                      <span className="bg-blue/10 text-blue text-sm px-3 py-1 rounded-full hover:bg-blue/20 cursor-pointer flex items-center gap-1 font-inter">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

          {/* Toggle Button Group */}
          <div className="flex justify-end mb-6">
            <ToggleGroup onValueChange={val => setShowAnswerForm(val === 'answer')}>
              <ToggleGroupItem value="answers" aria-label="View Answers" className="font-inter">View Answers</ToggleGroupItem>
              <ToggleGroupItem value="answer" aria-label="Your Answer" className="font-inter">Your Answer</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Conditionally render answer form or answers list */}
          {showAnswerForm ? (
            session ? (
              isQuestionAuthor() ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center mb-8">
                  <p className="text-yellow-800">You cannot answer your own question.</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
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
              <div className="bg-blue/10 border border-blue rounded-2xl p-6 text-center font-inter mb-8">
                <p className="text-blue mb-4 font-inter">Please sign in to answer this question</p>
                <Link href="/auth/signin">
                  <Button className="bg-blue hover:bg-blue-light font-inter">
                    Sign In to Answer
                  </Button>
                </Link>
              </div>
            )
          ) : (
            <>
        {/* Answers */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground font-inter">
                    {uniqueAnswers.length} Answer{uniqueAnswers.length !== 1 ? 's' : ''}
            </h2>
          </div>

                {uniqueAnswers.length === 0 ? (
                  <div className="bg-card rounded-2xl shadow-md border border-border p-8 text-center font-inter">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4 font-inter">No answers yet. Be the first to answer this question!</p>
            </div>
          ) : (
            <div className="space-y-6">
                    {uniqueAnswers.map((answer) => (
                      <div
                        key={answer._id}
                        className={`relative bg-card rounded-2xl shadow-md border p-6 font-inter transition-all ${answer.isAccepted ? 'border-emerald shadow-lg ring-2 ring-emerald/30' : 'border-border'}`}
                      >
                        {/* Top Row: Author, Date, Accepted Badge, Vote Buttons */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                          <div className="flex items-center gap-3">
                            {answer.author.image ? (
                              <Image src={answer.author.image} alt={answer.author.name} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <User className="w-8 h-8 text-muted-foreground bg-muted rounded-full p-1" />
                            )}
                            <span className="font-semibold text-foreground font-inter">{answer.author.name}</span>
                            <span className="text-xs text-muted-foreground font-inter">{new Date(answer.createdAt).toLocaleDateString()}</span>
                            {answer.isAccepted && (
                              <span className="inline-flex items-center gap-1 bg-emerald/10 text-emerald text-xs px-2 py-1 rounded-full font-semibold ml-2">
                                <Check className="h-4 w-4" /> Accepted
                              </span>
                            )}
                          </div>
                          {/* Vote Buttons */}
                          <div className="flex items-center gap-2 self-start sm:self-auto">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                              className={`p-1 ${hasUserVoted(answer.votes, 'upvote') ? 'text-blue' : ''}`}
                        onClick={() => handleVote('answer', answer._id, 'upvote')}
                        disabled={voting === answer._id}
                              aria-label="Upvote"
                      >
                        <ThumbsUp className="h-5 w-5" />
                      </Button>
                            <span className="font-bold text-lg text-blue font-inter min-w-[2rem] text-center">{getVoteCount(answer.votes)}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`p-1 ${hasUserVoted(answer.votes, 'downvote') ? 'text-red-600' : ''}`}
                        onClick={() => handleVote('answer', answer._id, 'downvote')}
                        disabled={voting === answer._id}
                              aria-label="Downvote"
                      >
                        <ThumbsDown className="h-5 w-5" />
                      </Button>
                        </div>
                    </div>

                        {/* Answer Content */}
                        <div className="prose max-w-none text-foreground font-inter mb-4">
                          <div dangerouslySetInnerHTML={{ __html: answer.content }} />
                        </div>

                        {/* ELI5 Section */}
                      <div className="prose max-w-none mb-4">
                        {eli5Mode[answer._id] && answer.eli5Content ? (
                          <div>
                              <div className="bg-blue/10 border-l-4 border-blue p-4 mb-4 rounded-xl">
                                <h4 className="text-blue font-medium mb-2 font-inter">🤔 ELI5 (Explain Like I&apos;m 5)</h4>
                              <div dangerouslySetInnerHTML={{ __html: answer.eli5Content }} />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleELI5(answer._id)}
                                className="text-blue border-blue hover:bg-blue/10 font-inter"
                            >
                                🧩 Show Simplified Answer
                            </Button>
                          </div>
                        ) : (
                          <div>
                            {answer.eli5Content && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleELI5(answer._id)}
                                  className="text-blue border-blue hover:bg-blue/10 mt-2 font-inter"
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
                                  className="text-blue border-blue hover:bg-blue/10 mt-2 font-inter"
                              >
                                {generatingEli5 === answer._id ? 'Generating...' : '🤔 Generate ELI5'}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      
                        {/* Actions Row */}
                        <div className="flex items-center justify-between border-t border-border pt-4 mt-4 gap-2 flex-wrap">
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
                                className="ml-2"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Accept Answer
                          </Button>
                        )}
                      </div>
                          {/* Award bounty button for author if bounty is open */}
                          {isQuestionAuthor() && question.bounty && question.bounty.status === 'open' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => awardBounty(answer._id)}
                              disabled={awardLoading === answer._id}
                            >
                              💰 Award Bounty
                            </Button>
                          )}
                    </div>

                        {/* Bounty awarded indicator */}
                        {question.bounty && question.bounty.status === 'awarded' && question.bounty.awardedTo === answer.author.email && (
                          <div className="mt-2 text-yellow-700 font-semibold">Bounty Awarded 🏆</div>
                        )}

                        {/* Comments Section */}
                        <div className="mt-6">
                          <div className="font-semibold text-gray-700 mb-2">Comments</div>
                          <div className="space-y-2 mb-2">
                            {renderComments(buildCommentTree(commentsByAnswer[answer._id] || []), answer._id)}
                  </div>
                          {session ? (
                            <form className="flex gap-2 mt-2" onSubmit={e => handleSubmitComment(answer._id, e, null)}>
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
                                        {u.image && <Image src={u.image} alt={u.name} width={20} height={20} className="w-5 h-5 rounded-full" />}
                                        <span>{u.name}</span>
                </div>
              ))}
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
                            <div className="text-xs text-muted-foreground">Sign in to comment</div>
                          )}
                        </div>
                      </div>
                    ))}
          </div>
        )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 