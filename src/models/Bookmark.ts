import mongoose, { Schema, Document } from 'mongoose';

export interface IBookmark extends Document {
  user: mongoose.Types.ObjectId;
  question: mongoose.Types.ObjectId;
  createdAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  question: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
}, {
  timestamps: true,
});

// Compound index to ensure a user can only bookmark a question once
BookmarkSchema.index({ user: 1, question: 1 }, { unique: true });

// Index for efficient queries
BookmarkSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.Bookmark || mongoose.model<IBookmark>('Bookmark', BookmarkSchema); 