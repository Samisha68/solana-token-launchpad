import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  _id: string
  walletAddress: string
  email?: string
  userType: 'new' | 'existing'
  attestations: string[] // Array of attestation IDs
  rewards: {
    totalCredits: number
    totalTokens: number
    lastRewardDate?: Date
  }
  socialProfiles: {
    github?: string
    twitter?: string
    discord?: string
    gmail?: string
  }
  preferences: {
    notifications: boolean
    newsletter: boolean
  }
  investments: string[] // Array of investment IDs
  votingPower: number
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

const UserSchema = new Schema<IUser>(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      sparse: true,
      index: true,
    },
    userType: {
      type: String,
      enum: ['new', 'existing'],
      default: 'new',
      required: true,
    },
    attestations: [{
      type: Schema.Types.ObjectId,
      ref: 'Attestation',
    }],
    rewards: {
      totalCredits: {
        type: Number,
        default: 0,
      },
      totalTokens: {
        type: Number,
        default: 0,
      },
      lastRewardDate: Date,
    },
    socialProfiles: {
      github: String,
      twitter: String,
      discord: String,
      gmail: String,
    },
    preferences: {
      notifications: {
        type: Boolean,
        default: true,
      },
      newsletter: {
        type: Boolean,
        default: false,
      },
    },
    investments: [{
      type: Schema.Types.ObjectId,
      ref: 'Investment',
    }],
    votingPower: {
      type: Number,
      default: 1,
    },
    lastLoginAt: Date,
  },
  {
    timestamps: true,
  }
)

// Indexes for performance
UserSchema.index({ userType: 1 })
UserSchema.index({ 'rewards.totalCredits': -1 })
UserSchema.index({ votingPower: -1 })

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema) 