import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  password?: string;
  role: 'guest' | 'user' | 'admin';
  reputation: number;
  bookmarks: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    type: String,
  },
  password: {
    type: String,
  },
  role: {
    type: String,
    enum: ['guest', 'user', 'admin'],
    default: 'user',
  },
  reputation: {
    type: Number,
    default: 0,
  },
  bookmarks: [{
    type: Schema.Types.ObjectId,
    ref: 'Question',
  }],
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema); 