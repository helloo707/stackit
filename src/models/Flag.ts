import mongoose, { Schema, Document } from 'mongoose';

export interface IFlag extends Document {
  contentType: 'question' | 'answer';
  contentId: mongoose.Types.ObjectId;
  reason: string;
  reporter: mongoose.Types.ObjectId;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: Date;
  updatedAt: Date;
}

const FlagSchema = new Schema<IFlag>({
  contentType: {
    type: String,
    enum: ['question', 'answer'],
    required: true,
  },
  contentId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'contentType',
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'spam',
      'inappropriate',
      'offensive',
      'duplicate',
      'misleading',
      'other'
    ],
  },
  reporter: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'dismissed'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

// Indexes for performance
FlagSchema.index({ contentType: 1, contentId: 1 });
FlagSchema.index({ status: 1, createdAt: -1 });
FlagSchema.index({ reporter: 1, createdAt: -1 });

export default mongoose.models.Flag || mongoose.model<IFlag>('Flag', FlagSchema); 