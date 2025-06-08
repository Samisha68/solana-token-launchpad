import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Project from '@/models/Project'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    
    // Build query
    const query: Record<string, unknown> = {}
    
    if (status) {
      query.status = status
    }
    if (category) {
      query.category = category
    }
    if (featured === 'true') {
      query.featured = true
    }
    
    // Get projects with pagination
    const projects = await Project.find(query)
      .populate('createdBy', 'walletAddress userType')
      .sort({ featured: -1, createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean()
    
    const total = await Project.countDocuments(query)
    
    return NextResponse.json({
      success: true,
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
    
  } catch (error) {
    console.error('Get projects error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const body = await request.json()
    const {
      walletAddress,
      companyName,
      tokenName,
      tokenSymbol,
      description,
      raiseGoal,
      tokenPrice,
      totalSupply,
      category,
      team,
      vestingSchedule,
      minInvestment,
      maxInvestment,
      socialLinks,
      website,
      whitepaper,
    } = body
    
    // Validate required fields
    if (!walletAddress || !companyName || !tokenName || !tokenSymbol || !description || !raiseGoal || !tokenPrice || !totalSupply || !category) {
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
    
    // Create project
    const project = new Project({
      companyName,
      tokenName,
      tokenSymbol: tokenSymbol.toUpperCase(),
      description,
      raiseGoal,
      tokenPrice,
      totalSupply,
      category,
      team: team || [],
      vestingSchedule: {
        projectAllocation: vestingSchedule?.projectAllocation || 70,
        daoTreasury: vestingSchedule?.daoTreasury || 30,
        vestingPeriod: vestingSchedule?.vestingPeriod || 365,
        milestones: vestingSchedule?.milestones || [],
      },
      minInvestment: minInvestment || 10,
      maxInvestment,
      socialLinks: socialLinks || {},
      website,
      whitepaper,
      createdBy: user._id,
      status: 'draft',
    })
    
    await project.save()
    
    return NextResponse.json({
      success: true,
      project: {
        id: project._id,
        companyName: project.companyName,
        tokenName: project.tokenName,
        tokenSymbol: project.tokenSymbol,
        description: project.description,
        raiseGoal: project.raiseGoal,
        raisedAmount: project.raisedAmount,
        tokenPrice: project.tokenPrice,
        status: project.status,
        category: project.category,
        createdAt: project.createdAt,
      },
      message: 'Project created successfully',
    }, { status: 201 })
    
  } catch (error) {
    console.error('Create project error:', error)
    
    // Handle duplicate key errors
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return NextResponse.json(
        { error: 'A project with this token symbol already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
} 