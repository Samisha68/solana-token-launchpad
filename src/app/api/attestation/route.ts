import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Attestation from '@/models/Attestation'

// Mock Solana Attestation Service integration
// In production, this would integrate with the actual SAS
class SolanaAttestationService {
  static async verifyAttestation(attestationData: {
    type: string
    provider: string
    signedData: string
    signature: string
    publicKey: string
  }) {
    // Mock verification logic
    // In production, this would:
    // 1. Verify the signature against the public key
    // 2. Validate the attestation data format
    // 3. Check against known SAS authorities
    
    try {
      // Parse the signed data to extract claims
      const claimData = JSON.parse(attestationData.signedData)
      
      // Simulate verification success/failure
      const isValid = claimData && claimData.claim && claimData.value
      
      return {
        isValid,
        attestationId: `sas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        claimData,
        verifiedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      }
    } catch {
      return {
        isValid: false,
        error: 'Invalid signed data format',
      }
    }
  }
  
  static calculateRewardValue(type: string, claimData: Record<string, unknown>): number {
    // Reward calculation based on attestation type and claim data
    const baseRewards: Record<string, number> = {
      github: 100,
      gmail: 50,
      twitter: 75,
      discord: 60,
      domain: 200,
      custom: 25,
    }
    
    let reward = baseRewards[type] || 25
    
    // Bonus rewards based on claim values
    if (type === 'github' && claimData.value) {
      const followersMatch = claimData.value.toString().match(/followers:(\d+)/)
      if (followersMatch) {
        const followers = parseInt(followersMatch[1])
        if (followers > 1000) reward += 50
        if (followers > 10000) reward += 100
      }
    }
    
    if (type === 'twitter' && claimData.value) {
      const verifiedMatch = claimData.value.toString().includes('verified:true')
      if (verifiedMatch) reward += 150
    }
    
    return reward
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const body = await request.json()
    const {
      walletAddress,
      type,
      provider,
      signedData,
      signature,
      publicKey,
    } = body
    
    // Validate required fields
    if (!walletAddress || !type || !provider || !signedData || !signature || !publicKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Find user
    const user = await User.findOne({ walletAddress })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please login first.' },
        { status: 404 }
      )
    }
    
    // Check if attestation already exists
    const existingAttestation = await Attestation.findOne({
      userId: user._id,
      type,
      provider,
    })
    
    if (existingAttestation) {
      return NextResponse.json(
        { error: 'Attestation for this provider already exists' },
        { status: 409 }
      )
    }
    
    // Verify attestation with SAS
    const verification = await SolanaAttestationService.verifyAttestation({
      type,
      provider,
      signedData,
      signature,
      publicKey,
    })
    
    if (!verification.isValid) {
      return NextResponse.json(
        { error: verification.error || 'Attestation verification failed' },
        { status: 400 }
      )
    }
    
    // Calculate reward value
    const rewardValue = SolanaAttestationService.calculateRewardValue(type, verification.claimData)
    
    // Create attestation record
    const attestation = new Attestation({
      userId: user._id,
      type,
      provider,
      attestationId: verification.attestationId,
      signedData,
      signature,
      publicKey,
      proofData: {
        claim: verification.claimData.claim,
        value: verification.claimData.value,
        metadata: verification.claimData.metadata || {},
      },
      isVerified: true,
      verifiedAt: verification.verifiedAt,
      expiresAt: verification.expiresAt,
      rewardValue,
    })
    
    await attestation.save()
    
    // Update user rewards and type
    user.rewards.totalCredits += rewardValue
    user.attestations.push(attestation._id.toString())
    
    // Upgrade user type based on attestations
    const userAttestationCount = user.attestations.length
    if (userAttestationCount >= 3 && user.userType === 'new') {
      user.userType = 'verified'
      user.votingPower = 2 // Verified users get more voting power
    } else if (userAttestationCount >= 1 && user.userType === 'new') {
      user.userType = 'existing'
    }
    
    await user.save()
    
    return NextResponse.json({
      success: true,
      attestation: {
        id: attestation._id,
        type: attestation.type,
        provider: attestation.provider,
        isVerified: attestation.isVerified,
        rewardValue: attestation.rewardValue,
        verifiedAt: attestation.verifiedAt,
        expiresAt: attestation.expiresAt,
      },
      user: {
        userType: user.userType,
        totalCredits: user.rewards.totalCredits,
        votingPower: user.votingPower,
        attestationCount: user.attestations.length,
      },
      message: 'Attestation verified successfully',
    }, { status: 201 })
    
  } catch (error) {
    console.error('Attestation verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify attestation' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }
    
    // Find user
    const user = await User.findOne({ walletAddress }).populate('attestations')
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Get user's attestations
    const attestations = await Attestation.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean()
    
    return NextResponse.json({
      success: true,
      attestations: attestations.map(att => ({
        id: att._id,
        type: att.type,
        provider: att.provider,
        isVerified: att.isVerified,
        rewardValue: att.rewardValue,
        verifiedAt: att.verifiedAt,
        expiresAt: att.expiresAt,
        proofData: {
          claim: att.proofData.claim,
          value: att.proofData.value,
        },
      })),
      totalRewards: user.rewards.totalCredits,
      userType: user.userType,
      votingPower: user.votingPower,
    })
    
  } catch (error) {
    console.error('Get attestations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attestations' },
      { status: 500 }
    )
  }
} 