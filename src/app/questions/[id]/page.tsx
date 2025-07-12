'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import RichTextEditor from '@/components/RichTextEditor';
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

  useEffect(() => {
    fetchQuestion();
  }, [id]);

  useEffect(() => {
    if (questionData?.question._id && session) {
      checkBookmarkStatus();
    }
  }, [questionData?.question._id, session]);

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
    } catch (error) {
      console.error('Error checking bookmark status:', error);
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
          const error = await response.json();
          toast.error(error.message || 'Failed to bookmark question');
        }
      }
    } catch (error) {
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
        const error = await response.json();
        toast.error(error.message || 'Failed to post answer');
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
        const error = await response.json();
        toast.error(error.message || 'Failed to vote');
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
        const error = await response.json();
        toast.error(error.message || 'Failed to accept answer');
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
        const error = await response.json();
        toast.error(error.message || 'Failed to generate ELI5');
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleBookmark}
                className="flex items-center gap-2 font-inter"
              >
                {isBookmarked ? (
                  <>
                    <BookmarkCheck className="h-4 w-4 text-blue" />
                    Bookmarked
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" />
                    Bookmark
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-card rounded-2xl shadow-md border border-border p-6 mb-8 font-inter">
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

        {/* Answers */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground font-inter">
              {answers.length} Answer{answers.length !== 1 ? 's' : ''}
            </h2>
          </div>

          {answers.length === 0 ? (
            <div className="bg-card rounded-2xl shadow-md border border-border p-8 text-center font-inter">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4 font-inter">No answers yet. Be the first to answer this question!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {answers.map((answer) => (
                <div key={answer._id} className="bg-card rounded-2xl shadow-md border border-border p-6 font-inter">
                  <div className="flex gap-4">
                    {/* Vote buttons */}
                    <div className="flex flex-col items-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`p-1 ${hasUserVoted(answer.votes, 'upvote') ? 'text-blue' : ''}`}
                        onClick={() => handleVote('answer', answer._id, 'upvote')}
                        disabled={voting === answer._id}
                      >
                        <ThumbsUp className="h-5 w-5" />
                      </Button>
                      <div className="text-lg font-semibold text-blue my-2 font-inter">
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
                          <Check className="h-6 w-6 text-emerald" />
                        </div>
                      )}
                    </div>

                    {/* Answer content */}
                    <div className="flex-1">
                      <div 
                        className="prose max-w-none text-foreground font-inter"
                        dangerouslySetInnerHTML={{ __html: answer.content }}
                      />
                      
                      <div className="prose max-w-none mb-4">
                        {eli5Mode[answer._id] && answer.eli5Content ? (
                          <div>
                            <div className="bg-blue/10 border-l-4 border-blue p-4 mb-4">
                              <h4 className="text-blue font-medium mb-2 font-inter">🤔 ELI5 (Explain Like I&apos;m 5)</h4>
                              <div dangerouslySetInnerHTML={{ __html: answer.eli5Content }} />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleELI5(answer._id)}
                              className="text-blue border-blue hover:bg-blue/10 font-inter"
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
                      
                      {/* Meta */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-4 font-inter">
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
                        {!answer.isAccepted && isQuestionAuthor() && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAcceptAnswer(answer._id)}
                            disabled={acceptingAnswer === answer._id}
                            className="font-inter"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Accept Answer
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Answer Form */}
        {session ? (
          <div className="bg-card rounded-2xl shadow-md border border-border p-6 font-inter">
            <h3 className="text-lg font-semibold text-foreground mb-4 font-inter">Your Answer</h3>
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
                  className="bg-blue hover:bg-blue-light font-inter"
                >
                  {submittingAnswer ? 'Posting...' : 'Post Answer'}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-blue/10 border border-blue rounded-2xl p-6 text-center font-inter">
            <p className="text-blue mb-4 font-inter">Please sign in to answer this question</p>
            <Link href="/auth/signin">
              <Button className="bg-blue hover:bg-blue-light font-inter">
                Sign In to Answer
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 