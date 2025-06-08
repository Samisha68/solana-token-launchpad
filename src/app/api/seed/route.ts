import { NextResponse } from 'next/server'
import { seedDatabase } from '@/lib/seedData'

export async function POST() {
  try {
    // In production, you might want to add authentication here
    // to prevent unauthorized database seeding
    
    await seedDatabase()
    
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully with example projects and users',
    })
    
  } catch (error) {
    console.error('Seed database error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    )
  }
} 