import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name?: string;
  email: string;
  password?: string;
  role: 'guest' | 'user' | 'admin';
  reputation: number;
  bookmarks: mongoose.Types.ObjectId[];
  follows: mongoose.Types.ObjectId[];
  isBanned: boolean;
  bannedAt?: Date;
  banReason?: string;
  bannedBy?: mongoose.Types.ObjectId;
  notifications: {
    _id?: mongoose.Types.ObjectId;
    type: 'answer' | 'vote' | 'accept' | 'flag' | 'admin';
    title: string;
    message: string;
    relatedQuestion?: mongoose.Types.ObjectId;
    relatedAnswer?: mongoose.Types.ObjectId;
    isRead: boolean;
    createdAt: Date;
  }[];
  reputationHistory?: {
    change: number;
    reason: string;
    relatedQuestion?: mongoose.Types.ObjectId;
    relatedAnswer?: mongoose.Types.ObjectId;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  password: { type: String },
  role: { 
    type: String, 
    enum: ['guest', 'user', 'admin'], 
    default: 'user' 
  },
  reputation: { 
    type: Number, 
    default: 0 
  },
  bookmarks: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Question' 
  }],
  follows: [{
    type: Schema.Types.ObjectId,
    ref: 'Question',
  }],
  isBanned: {
    type: Boolean,
    default: false,
  },
  bannedAt: {
    type: Date,
  },
  banReason: {
    type: String,
  },
  bannedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  notifications: [{
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
    createdAt: {
      type: Date,
      default: Date.now,
    }
  }],
  reputationHistory: [
    {
      change: { type: Number, required: true },
      reason: { type: String, required: true },
      relatedQuestion: { type: Schema.Types.ObjectId, ref: 'Question' },
      relatedAnswer: { type: Schema.Types.ObjectId, ref: 'Answer' },
      createdAt: { type: Date, default: Date.now },
    }
  ]
}, {
  timestamps: true,
  strictPopulate: false, // Allow populate on fields not explicitly defined
});

// Only create index for notifications
UserSchema.index({ 'notifications.createdAt': -1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema); 