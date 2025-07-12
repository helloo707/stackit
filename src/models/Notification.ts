import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  type: 'answer' | 'vote' | 'accept' | 'flag' | 'admin';
  title: string;
  message: string;
  relatedQuestion?: mongoose.Types.ObjectId;
  relatedAnswer?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['answer', 'vote', 'accept', 'flag', 'admin'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  relatedQuestion: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
  },
  relatedAnswer: {
    type: Schema.Types.ObjectId,
    ref: 'Answer',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Index for performance
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema); 