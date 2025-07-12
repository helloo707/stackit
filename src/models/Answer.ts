import mongoose, { Schema, Document } from 'mongoose';

export interface IAnswer extends Document {
  content: string;
  author: mongoose.Types.ObjectId;
  question: mongoose.Types.ObjectId;
  votes: {
    upvotes: mongoose.Types.ObjectId[];
    downvotes: mongoose.Types.ObjectId[];
  };
  isAccepted: boolean;
  eli5Content?: string;
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

const AnswerSchema = new Schema<IAnswer>({
  content: {
    type: String,
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  question: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
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
  isAccepted: {
    type: Boolean,
    default: false,
  },
  eli5Content: {
    type: String,
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

// Index for performance
AnswerSchema.index({ question: 1, createdAt: -1 });
AnswerSchema.index({ isDeleted: 1, 'votes.upvotes': -1 });

export default mongoose.models.Answer || mongoose.model<IAnswer>('Answer', AnswerSchema); 