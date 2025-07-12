import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Clock, 
  MessageSquare,
  Eye
} from 'lucide-react';
import Link from 'next/link';

// Mock data for demonstration
const mockQuestions = [
  {
    id: '1',
    title: 'How to implement authentication in Next.js with NextAuth?',
    content: 'I\'m building a Next.js application and need to implement user authentication. I\'ve heard NextAuth is a good solution...',
    author: 'John Doe',
    tags: ['nextjs', 'authentication', 'nextauth'],
    votes: 15,
    answers: 3,
    views: 245,
    createdAt: '2024-01-15T10:30:00Z',
    isAnswered: true,
  },
  {
    id: '2',
    title: 'Best practices for MongoDB schema design',
    content: 'I\'m designing a database schema for a social media application. What are the best practices for MongoDB...',
    author: 'Jane Smith',
    tags: ['mongodb', 'database', 'schema-design'],
    votes: 8,
    answers: 1,
    views: 156,
    createdAt: '2024-01-14T15:45:00Z',
    isAnswered: false,
  },
  {
    id: '3',
    title: 'Understanding React Server Components vs Client Components',
    content: 'I\'m confused about the difference between Server Components and Client Components in React 18...',
    author: 'Mike Johnson',
    tags: ['react', 'server-components', 'nextjs'],
    votes: 22,
    answers: 5,
    views: 389,
    createdAt: '2024-01-13T09:20:00Z',
    isAnswered: true,
  },
];

export default function QuestionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Questions</h1>
            <p className="text-gray-600">Find answers to your questions or help others</p>
          </div>
          <Link href="/questions/ask">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Ask Question
            </Button>
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search questions..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                All Questions
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Most Voted
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Unanswered
              </Button>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {mockQuestions.map((question) => (
            <div key={question.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                {/* Stats */}
                <div className="flex flex-col items-center text-center min-w-[80px]">
                  <div className="text-lg font-semibold text-gray-900">{question.votes}</div>
                  <div className="text-sm text-gray-500">votes</div>
                  <div className="text-lg font-semibold text-gray-900 mt-2">{question.answers}</div>
                  <div className="text-sm text-gray-500">answers</div>
                  <div className="text-sm text-gray-500 mt-2">{question.views}</div>
                  <div className="text-xs text-gray-400">views</div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <Link href={`/questions/${question.id}`}>
                      <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">
                        {question.title}
                      </h3>
                    </Link>
                    {question.isAnswered && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Answered
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {question.content}
                  </p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {question.tags.map((tag) => (
                      <Link key={tag} href={`/tags/${tag}`}>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-200 cursor-pointer">
                          {tag}
                        </span>
                      </Link>
                    ))}
                  </div>
                  
                  {/* Meta */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span>Asked by {question.author}</span>
                      <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span>{question.views}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
              1
            </Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
              3
            </Button>
            <span className="text-gray-500">...</span>
            <Button variant="outline" size="sm">
              10
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 