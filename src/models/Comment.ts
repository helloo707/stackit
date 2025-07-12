import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  content: string;
  author: mongoose.Types.ObjectId;
  answer: mongoose.Types.ObjectId; // The answer this comment belongs to
  mentions?: mongoose.Types.ObjectId[]; // Users mentioned in the comment
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  edited: boolean;
  parent?: mongoose.Types.ObjectId | null;
}

const CommentSchema = new Schema<IComment>({
  content: {
    type: String,
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  answer: {
    type: Schema.Types.ObjectId,
    ref: 'Answer',
    required: true,
  },
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
  edited: {
    type: Boolean,
    default: false,
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
CommentSchema.index({ answer: 1, createdAt: -1 });
CommentSchema.index({ author: 1, createdAt: -1 });

export default mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema); 