import mongoose, { Document, Schema } from 'mongoose'

export interface IProject extends Document {
  _id: string
  companyName: string
  tokenName: string
  tokenSymbol: string
  tokenMint?: string // Solana token mint address
  description: string
  logo?: string
  website?: string
  whitepaper?: string
  
  // Funding details
  raiseGoal: number // In USDC
  raisedAmount: number // Current raised amount
  tokenPrice: number // Price per token in USDC
  totalSupply: number
  
  // Vesting & fund management
  vestingSchedule: {
    projectAllocation: number // Percentage (default 70%)
    daoTreasury: number // Percentage (default 30%)
    vestingPeriod: number // In days
    milestones: {
      title: string
      description: string
      targetDate: Date
      percentage: number // Percentage of funds to release
      status: 'pending' | 'voting' | 'approved' | 'rejected' | 'completed'
    }[]
  }
  
  // Project status
  status: 'draft' | 'active' | 'funding' | 'funded' | 'completed' | 'cancelled'
  launchDate?: Date
  endDate?: Date
  
  // Team info
  team: {
    name: string
    role: string
    bio?: string
    avatar?: string
    linkedin?: string
  }[]
  
  // Investment tracking
  minInvestment: number
  maxInvestment?: number
  whitelistOnly: boolean
  requiresKYC: boolean
  
  // Social & verification
  socialLinks: {
    twitter?: string
    discord?: string
    telegram?: string
    github?: string
  }
  
  // Metadata
  createdBy: mongoose.Types.ObjectId // User ID
  category: string
  tags: string[]
  featured: boolean
  
  createdAt: Date
  updatedAt: Date
}

const ProjectSchema = new Schema<IProject>(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    tokenName: {
      type: String,
      required: true,
      trim: true,
    },
    tokenSymbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    tokenMint: {
      type: String,
      sparse: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    logo: String,
    website: String,
    whitepaper: String,
    
    // Funding
    raiseGoal: {
      type: Number,
      required: true,
      min: 1000, // Minimum $1000 raise
    },
    raisedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    tokenPrice: {
      type: Number,
      required: true,
      min: 0.001, // Minimum $0.001 per token
    },
    totalSupply: {
      type: Number,
      required: true,
      min: 1000,
    },
    
    // Vesting
    vestingSchedule: {
      projectAllocation: {
        type: Number,
        default: 70,
        min: 50,
        max: 90,
      },
      daoTreasury: {
        type: Number,
        default: 30,
        min: 10,
        max: 50,
      },
      vestingPeriod: {
        type: Number,
        default: 365, // 1 year default
        min: 30,
      },
      milestones: [{
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        targetDate: {
          type: Date,
          required: true,
        },
        percentage: {
          type: Number,
          required: true,
          min: 1,
          max: 100,
        },
        status: {
          type: String,
          enum: ['pending', 'voting', 'approved', 'rejected', 'completed'],
          default: 'pending',
        },
      }],
    },
    
    status: {
      type: String,
      enum: ['draft', 'active', 'funding', 'funded', 'completed', 'cancelled'],
      default: 'draft',
      required: true,
    },
    launchDate: Date,
    endDate: Date,
    
    team: [{
      name: {
        type: String,
        required: true,
      },
      role: {
        type: String,
        required: true,
      },
      bio: String,
      avatar: String,
      linkedin: String,
    }],
    
    minInvestment: {
      type: Number,
      default: 10,
      min: 1,
    },
    maxInvestment: Number,
    whitelistOnly: {
      type: Boolean,
      default: false,
    },
    requiresKYC: {
      type: Boolean,
      default: false,
    },
    
    socialLinks: {
      twitter: String,
      discord: String,
      telegram: String,
      github: String,
    },
    
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['DeFi', 'NFT', 'Gaming', 'Infrastructure', 'Social', 'DAO', 'Other'],
    },
    tags: [String],
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for performance
ProjectSchema.index({ status: 1 })
ProjectSchema.index({ category: 1 })
ProjectSchema.index({ featured: -1 })
ProjectSchema.index({ launchDate: -1 })
ProjectSchema.index({ raisedAmount: -1 })
ProjectSchema.index({ createdBy: 1 })

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema) 