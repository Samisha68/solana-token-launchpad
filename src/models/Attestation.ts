import mongoose, { Document, Schema } from 'mongoose'

export interface IAttestation extends Document {
  _id: string
  userId: mongoose.Types.ObjectId
  type: 'github' | 'gmail' | 'twitter' | 'discord' | 'domain' | 'custom'
  provider: string // e.g., 'github.com', 'gmail.com'
  
  // Solana Attestation Service data
  attestationId: string // Unique identifier from SAS
  signedData: string // The signed attestation data
  signature: string // Cryptographic signature
  publicKey: string // Public key used for verification
  
  // Proof details
  proofData: {
    claim: string // What is being attested
    value: string // The actual verified value
    metadata?: Record<string, unknown> // Additional proof metadata
  }
  
  // Verification status
  isVerified: boolean
  verifiedAt?: Date
  expiresAt?: Date
  
  // Usage in eligibility
  usedInRewards: boolean
  rewardValue: number // Credits or tokens earned from this attestation
  
  createdAt: Date
  updatedAt: Date
}

const AttestationSchema = new Schema<IAttestation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['github', 'gmail', 'twitter', 'discord', 'domain', 'custom'],
      required: true,
    },
    provider: {
      type: String,
      required: true,
      trim: true,
    },
    
    // SAS integration
    attestationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    signedData: {
      type: String,
      required: true,
    },
    signature: {
      type: String,
      required: true,
    },
    publicKey: {
      type: String,
      required: true,
    },
    
    // Proof details
    proofData: {
      claim: {
        type: String,
        required: true,
      },
      value: {
        type: String,
        required: true,
      },
      metadata: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },
    
    // Verification
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verifiedAt: Date,
    expiresAt: Date,
    
    // Rewards
    usedInRewards: {
      type: Boolean,
      default: false,
    },
    rewardValue: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Compound indexes for efficient queries
AttestationSchema.index({ userId: 1, type: 1 })
AttestationSchema.index({ userId: 1, isVerified: 1 })
AttestationSchema.index({ type: 1, isVerified: 1 })
AttestationSchema.index({ expiresAt: 1 })

export default mongoose.models.Attestation || mongoose.model<IAttestation>('Attestation', AttestationSchema) 