import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;
  type: 'answer' | 'vote' | 'accept' | 'flag' | 'admin' | 'bookmark';
  title: string;
  message: string;
  relatedQuestion?: mongoose.Types.ObjectId;
  relatedAnswer?: mongoose.Types.ObjectId;
  isRead: boolean;
  metadata?: {
    questionTitle?: string;
    answerSnippet?: string;
    senderName?: string;
    senderImage?: string;
    actionDetails?: {
      who: string;
      what: string;
      where: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  type: {
    type: String,
    enum: ['answer', 'vote', 'accept', 'flag', 'admin', 'bookmark'],
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
  metadata: {
    questionTitle: String,
    answerSnippet: String,
    senderName: String,
    senderImage: String,
    actionDetails: {
      who: String,
      what: String,
      where: String,
    },
  },
}, {
  timestamps: true,
});

// Index for performance
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Static method to count unread notifications for a user
NotificationSchema.statics.countUnreadNotifications = async function(userId: mongoose.Types.ObjectId) {
  return this.countDocuments({ 
    recipient: userId, 
    isRead: false 
  });
};

export interface INotificationModel extends mongoose.Model<INotification> {
  countUnreadNotifications(userId: mongoose.Types.ObjectId): Promise<number>;
}

export default mongoose.models.Notification || mongoose.model<INotification, INotificationModel>('Notification', NotificationSchema); 