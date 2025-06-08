import mongoose, { Document, Schema } from 'mongoose'

export interface IProposal extends Document {
  _id: string
  projectId: mongoose.Types.ObjectId
  milestoneId: string // Reference to milestone in project
  
  // Proposal details
  title: string
  description: string
  requestedAmount: number // Amount to release from vesting
  
  // Voting mechanics
  votingPeriod: {
    startDate: Date
    endDate: Date
  }
  
  votes: {
    userId: mongoose.Types.ObjectId
    vote: 'yes' | 'no' | 'abstain'
    votingPower: number
    timestamp: Date
    comment?: string
  }[]
  
  // Results
  totalVotes: number
  yesVotes: number
  noVotes: number
  abstainVotes: number
  totalVotingPower: number
  yesVotingPower: number
  noVotingPower: number
  abstainVotingPower: number
  
  // Status
  status: 'draft' | 'active' | 'passed' | 'rejected' | 'executed' | 'expired'
  
  // Execution details
  executionDetails?: {
    executedAt: Date
    transactionSignature: string
    executedBy: mongoose.Types.ObjectId
    actualAmountReleased: number
  }
  
  // Metadata
  createdBy: mongoose.Types.ObjectId
  category: 'milestone' | 'governance' | 'emergency' | 'treasury'
  requiredQuorum: number // Minimum voting power needed
  requiredMajority: number // Percentage needed to pass (e.g., 60%)
  
  createdAt: Date
  updatedAt: Date
}

const ProposalSchema = new Schema<IProposal>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    milestoneId: {
      type: String,
      required: true,
    },
    
    // Details
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    requestedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // Voting period
    votingPeriod: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    
    // Votes
    votes: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      vote: {
        type: String,
        enum: ['yes', 'no', 'abstain'],
        required: true,
      },
      votingPower: {
        type: Number,
        required: true,
        min: 0,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      comment: {
        type: String,
        maxlength: 500,
      },
    }],
    
    // Results summary
    totalVotes: {
      type: Number,
      default: 0,
    },
    yesVotes: {
      type: Number,
      default: 0,
    },
    noVotes: {
      type: Number,
      default: 0,
    },
    abstainVotes: {
      type: Number,
      default: 0,
    },
    totalVotingPower: {
      type: Number,
      default: 0,
    },
    yesVotingPower: {
      type: Number,
      default: 0,
    },
    noVotingPower: {
      type: Number,
      default: 0,
    },
    abstainVotingPower: {
      type: Number,
      default: 0,
    },
    
    status: {
      type: String,
      enum: ['draft', 'active', 'passed', 'rejected', 'executed', 'expired'],
      default: 'draft',
      required: true,
    },
    
    // Execution
    executionDetails: {
      executedAt: Date,
      transactionSignature: String,
      executedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      actualAmountReleased: Number,
    },
    
    // Metadata
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['milestone', 'governance', 'emergency', 'treasury'],
      default: 'milestone',
      required: true,
    },
    requiredQuorum: {
      type: Number,
      default: 10, // 10% of total voting power
      min: 1,
      max: 100,
    },
    requiredMajority: {
      type: Number,
      default: 60, // 60% majority
      min: 50,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
ProposalSchema.index({ projectId: 1 })
ProposalSchema.index({ status: 1 })
ProposalSchema.index({ 'votingPeriod.endDate': 1 })
ProposalSchema.index({ category: 1 })
ProposalSchema.index({ createdBy: 1 })

// Compound indexes
ProposalSchema.index({ projectId: 1, status: 1 })
ProposalSchema.index({ 'votes.userId': 1, projectId: 1 })

export default mongoose.models.Proposal || mongoose.model<IProposal>('Proposal', ProposalSchema) 