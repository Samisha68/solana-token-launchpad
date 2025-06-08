import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { PublicKey } from '@solana/web3.js'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const body = await request.json()
    const { walletAddress, email, userType } = body
    
    // Validate wallet address
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }
    
    try {
      // Validate Solana public key format
      new PublicKey(walletAddress)
    } catch {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      )
    }
    
    // Check if user already exists
    let user = await User.findOne({ walletAddress })
    
    if (user) {
      // Update last login time
      user.lastLoginAt = new Date()
      await user.save()
      
      return NextResponse.json({
        success: true,
        user: {
          id: user._id,
          walletAddress: user.walletAddress,
          email: user.email,
          userType: user.userType,
          rewards: user.rewards,
          votingPower: user.votingPower,
          lastLoginAt: user.lastLoginAt,
        },
        message: 'Login successful',
      })
    }
    
    // Create new user
    user = new User({
      walletAddress,
      email: email || undefined,
      userType: userType || 'new',
      lastLoginAt: new Date(),
    })
    
    await user.save()
    
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        email: user.email,
        userType: user.userType,
        rewards: user.rewards,
        votingPower: user.votingPower,
        lastLoginAt: user.lastLoginAt,
      },
      message: 'Registration successful',
    }, { status: 201 })
    
  } catch (error) {
    console.error('Login/Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 