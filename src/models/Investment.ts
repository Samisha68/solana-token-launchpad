import mongoose, { Document, Schema } from 'mongoose'

export interface IInvestment extends Document {
  _id: string
  userId: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  
  // Investment details
  amount: number // Amount invested in USDC
  tokenAmount: number // Tokens allocated
  pricePerToken: number // Price at time of investment
  
  // Transaction info
  transactionSignature: string // Solana transaction signature
  blockchainConfirmed: boolean
  
  // Vesting details
  vestingSchedule: {
    totalTokens: number
    releasedTokens: number
    nextReleaseDate?: Date
    releases: {
      date: Date
      amount: number
      transactionSignature?: string
      status: 'pending' | 'released' | 'claimed'
    }[]
  }
  
  // Status
  status: 'pending' | 'confirmed' | 'vesting' | 'completed' | 'refunded'
  
  // Metadata
  notes?: string
  referralCode?: string
  
  createdAt: Date
  updatedAt: Date
}

const InvestmentSchema = new Schema<IInvestment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    
    // Investment
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    tokenAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    pricePerToken: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // Transaction
    transactionSignature: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    blockchainConfirmed: {
      type: Boolean,
      default: false,
    },
    
    // Vesting
    vestingSchedule: {
      totalTokens: {
        type: Number,
        required: true,
      },
      releasedTokens: {
        type: Number,
        default: 0,
      },
      nextReleaseDate: Date,
      releases: [{
        date: {
          type: Date,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        transactionSignature: String,
        status: {
          type: String,
          enum: ['pending', 'released', 'claimed'],
          default: 'pending',
        },
      }],
    },
    
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'vesting', 'completed', 'refunded'],
      default: 'pending',
      required: true,
    },
    
    notes: String,
    referralCode: String,
  },
  {
    timestamps: true,
  }
)

// Compound indexes
InvestmentSchema.index({ userId: 1, projectId: 1 })
InvestmentSchema.index({ status: 1 })
InvestmentSchema.index({ 'vestingSchedule.nextReleaseDate': 1 })
InvestmentSchema.index({ blockchainConfirmed: 1 })

export default mongoose.models.Investment || mongoose.model<IInvestment>('Investment', InvestmentSchema) 