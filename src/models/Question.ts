import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  title: string;
  content: string;
  author: mongoose.Types.ObjectId;
  tags: string[];
  isAnonymous: boolean;
  votes: {
    upvotes: mongoose.Types.ObjectId[];
    downvotes: mongoose.Types.ObjectId[];
  };
  views: number;
  answers: mongoose.Types.ObjectId[];
  acceptedAnswer?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  flags: {
    userId: mongoose.Types.ObjectId;
    reason: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  votes: {
    upvotes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    downvotes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  views: {
    type: Number,
    default: 0,
  },
  answers: [{
    type: Schema.Types.ObjectId,
    ref: 'Answer',
  }],
  acceptedAnswer: {
    type: Schema.Types.ObjectId,
    ref: 'Answer',
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
  flags: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

// Index for search and filtering
QuestionSchema.index({ title: 'text', content: 'text', tags: 'text' });
QuestionSchema.index({ isDeleted: 1, createdAt: -1 });
QuestionSchema.index({ isDeleted: 1, 'votes.upvotes': -1 });

export default mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema); 