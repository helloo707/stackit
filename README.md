# StackIt - Collaborative Q&A Platform

A full-stack question-and-answer web platform inspired by StackOverflow, built with Next.js, MongoDB, and NextAuth.

## 🚀 Features

### Core Features
- **Ask Questions** with title, tags, and rich text editor
- **Answer Questions** using the same rich text editor
- **Voting System** for questions and answers (upvote/downvote)
- **Accept Answers** by the original question poster
- **Notifications System** with real-time updates
- **Tag Filtering** and search functionality
- **Recent/Unanswered** question filters

### Advanced Features
- **Anonymous Doubt Mode** - post questions anonymously
- **Bookmark Questions** for later viewing
- **Flag Content** - report inappropriate content
- **Soft Delete System** with timestamp tracking
- **Admin Panel** for content moderation

### AI-Powered Features
- **ELI5 Toggle** - simplified explanations using OpenAI API
- **Smart Prioritization** - bump unanswered questions over time

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js (Google OAuth + Credentials)
- **Database**: MongoDB with Mongoose
- **Rich Text Editor**: TipTap
- **UI Components**: Custom components with Radix UI primitives
- **Notifications**: React Hot Toast
- **Form Validation**: React Hook Form + Zod

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud)
- Google OAuth credentials (optional)
- OpenAI API key (optional, for ELI5 feature)

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone <repository-url>
cd stackit
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/stackit

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OpenAI (optional, for ELI5 feature)
OPENAI_API_KEY=your-openai-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set up MongoDB
Make sure MongoDB is running locally or use a cloud service like MongoDB Atlas.

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
stackit/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── questions/         # Question-related pages
│   │   └── ...
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   └── ...
│   ├── lib/                  # Utility functions
│   ├── models/               # MongoDB models
│   └── types/                # TypeScript type definitions
├── public/                   # Static assets
└── ...
```

## 🔐 Authentication

The application supports two authentication methods:

1. **Google OAuth** - Quick sign-in with Google account
2. **Credentials** - Email/password authentication

### Setting up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

## 🗄️ Database Models

### User
- Basic user information
- Role-based access (guest, user, admin)
- Reputation system
- Bookmarks

### Question
- Title, content, tags
- Anonymous posting support
- Voting system
- Soft delete functionality
- Flagging system

### Answer
- Rich text content
- Voting system
- ELI5 content support
- Acceptance status

### Notification
- Real-time notifications
- Different notification types
- Read/unread status

## 🎨 UI Components

The application uses a custom design system built with:
- **Tailwind CSS** for styling
- **Custom components** for consistency
- **Responsive design** for all screen sizes
- **Accessibility** best practices

## 🔧 API Routes

### Questions
- `GET /api/questions` - List questions with filtering
- `POST /api/questions` - Create new question
- `GET /api/questions/[id]` - Get specific question
- `PUT /api/questions/[id]` - Update question
- `DELETE /api/questions/[id]` - Soft delete question

### Answers
- `GET /api/questions/[id]/answers` - Get answers for question
- `POST /api/questions/[id]/answers` - Create answer
- `PUT /api/answers/[id]` - Update answer
- `DELETE /api/answers/[id]` - Soft delete answer

### Voting
- `POST /api/questions/[id]/vote` - Vote on question
- `POST /api/answers/[id]/vote` - Vote on answer

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/bookmarks` - Get user bookmarks

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/stackit/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

## 🎯 Roadmap

- [ ] PWA support for offline access
- [ ] Real-time chat for questions
- [ ] Advanced search with filters
- [ ] User reputation badges
- [ ] Question bounties
- [ ] Mobile app
- [ ] Multi-language support

## 🙏 Acknowledgments

- Inspired by StackOverflow
- Built with Next.js and the amazing open-source community
- Icons by Lucide React
- UI components inspired by shadcn/ui
