import dbConnect from './mongodb'
import User from '@/models/User'
import Project from '@/models/Project'
import Attestation from '@/models/Attestation'

export async function seedDatabase() {
  try {
    await dbConnect()
    
    // Check if data already exists
    const existingProjects = await Project.countDocuments()
    if (existingProjects > 0) {
      console.log('Database already seeded')
      return
    }
    
    console.log('Seeding database with example data...')
    
    // Create example users
    const exampleUsers = await User.insertMany([
      {
        walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        userType: 'verified',
        rewards: { totalCredits: 500, totalTokens: 0 },
        votingPower: 2,
        socialProfiles: {
          github: 'defi-protocol',
          twitter: '@defiprotocol'
        }
      },
      {
        walletAddress: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
        userType: 'verified',
        rewards: { totalCredits: 750, totalTokens: 0 },
        votingPower: 2,
        socialProfiles: {
          github: 'gaming-dao',
          twitter: '@gamingdao'
        }
      },
      {
        walletAddress: 'AVLLHUrD7v5DWCGo7sFMTgjhQE8ZKrWPCEEPNQZqiGaM',
        userType: 'existing',
        rewards: { totalCredits: 200, totalTokens: 0 },
        votingPower: 1,
        socialProfiles: {
          github: 'social-app'
        }
      }
    ])
    
    // Create example projects
    const exampleProjects = await Project.insertMany([
      {
        companyName: 'DeFi Protocol Labs',
        tokenName: 'DeFi Protocol Token',
        tokenSymbol: 'DPT',
        description: 'A revolutionary DeFi protocol enabling seamless yield farming across multiple chains. Our protocol aggregates the best yields from various DeFi platforms while maintaining security and transparency through automated smart contracts.',
        logo: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop&crop=center',
        website: 'https://defiprotocol.example',
        raiseGoal: 2000000,
        raisedAmount: 1200000,
        tokenPrice: 0.25,
        totalSupply: 10000000,
        category: 'DeFi',
        status: 'funding',
        featured: true,
        team: [
          { name: 'Alex Chen', role: 'CEO & Founder', bio: 'Former lead engineer at Uniswap' },
          { name: 'Sarah Kim', role: 'CTO', bio: 'Smart contract security expert' },
          { name: 'Mike Johnson', role: 'Head of Product', bio: 'Ex-Compound product manager' }
        ],
        vestingSchedule: {
          projectAllocation: 70,
          daoTreasury: 30,
          vestingPeriod: 365,
          milestones: [
            {
              title: 'Protocol MVP Launch',
              description: 'Deploy core protocol smart contracts to mainnet',
              targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
              percentage: 25,
              status: 'pending'
            },
            {
              title: 'Multi-chain Expansion',
              description: 'Deploy to Ethereum, Polygon, and Arbitrum',
              targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
              percentage: 35,
              status: 'pending'
            },
            {
              title: 'DAO Governance Launch',
              description: 'Transfer protocol governance to token holders',
              targetDate: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000),
              percentage: 40,
              status: 'pending'
            }
          ]
        },
        minInvestment: 100,
        maxInvestment: 50000,
        socialLinks: {
          twitter: 'https://twitter.com/defiprotocol',
          discord: 'https://discord.gg/defiprotocol',
          github: 'https://github.com/defi-protocol'
        },
        tags: ['yield-farming', 'multi-chain', 'automated'],
        createdBy: exampleUsers[0]._id,
        launchDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      },
      {
        companyName: 'Gaming DAO',
        tokenName: 'Gaming Governance Token',
        tokenSymbol: 'GGT',
        description: 'A decentralized gaming ecosystem where players truly own their assets. Build, trade, and govern the future of gaming through blockchain technology and community-driven development.',
        logo: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=400&fit=crop&crop=center',
        website: 'https://gamingdao.example',
        raiseGoal: 3500000,
        raisedAmount: 850000,
        tokenPrice: 0.45,
        totalSupply: 15000000,
        category: 'Gaming',
        status: 'funding',
        featured: true,
        team: [
          { name: 'Emma Rodriguez', role: 'CEO', bio: 'Former Riot Games executive' },
          { name: 'James Park', role: 'Game Director', bio: '15 years in AAA game development' },
          { name: 'Lisa Zhang', role: 'Blockchain Lead', bio: 'Smart contract architect' }
        ],
        vestingSchedule: {
          projectAllocation: 75,
          daoTreasury: 25,
          vestingPeriod: 548,
          milestones: [
            {
              title: 'Alpha Game Launch',
              description: 'Release playable alpha version with core mechanics',
              targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
              percentage: 30,
              status: 'pending'
            },
            {
              title: 'NFT Marketplace',
              description: 'Launch in-game asset marketplace',
              targetDate: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000),
              percentage: 40,
              status: 'pending'
            },
            {
              title: 'Full Release',
              description: 'Complete game launch with all features',
              targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              percentage: 30,
              status: 'pending'
            }
          ]
        },
        minInvestment: 50,
        maxInvestment: 25000,
        socialLinks: {
          twitter: 'https://twitter.com/gamingdao',
          discord: 'https://discord.gg/gamingdao',
          github: 'https://github.com/gaming-dao'
        },
        tags: ['gaming', 'nft', 'play-to-earn'],
        createdBy: exampleUsers[1]._id,
        launchDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      },
      {
        companyName: 'SocialFi Network',
        tokenName: 'Social Network Token',
        tokenSymbol: 'SNT',
        description: 'Decentralized social network where users own their data and earn rewards for quality content. Built on Solana for fast, low-cost interactions and true digital ownership.',
        logo: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop&crop=center',
        website: 'https://socialfi.example',
        raiseGoal: 1500000,
        raisedAmount: 300000,
        tokenPrice: 0.12,
        totalSupply: 20000000,
        category: 'Social',
        status: 'active',
        featured: false,
        team: [
          { name: 'David Wilson', role: 'Founder', bio: 'Ex-Twitter product lead' },
          { name: 'Ana Garcia', role: 'Head of Engineering', bio: 'Distributed systems expert' }
        ],
        vestingSchedule: {
          projectAllocation: 65,
          daoTreasury: 35,
          vestingPeriod: 730,
          milestones: [
            {
              title: 'Beta Platform Launch',
              description: 'Launch beta social platform with core features',
              targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
              percentage: 40,
              status: 'pending'
            },
            {
              title: 'Creator Economy',
              description: 'Launch creator monetization features',
              targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
              percentage: 35,
              status: 'pending'
            },
            {
              title: 'Mobile Apps',
              description: 'Release iOS and Android applications',
              targetDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
              percentage: 25,
              status: 'pending'
            }
          ]
        },
        minInvestment: 25,
        maxInvestment: 10000,
        socialLinks: {
          twitter: 'https://twitter.com/socialfi',
          discord: 'https://discord.gg/socialfi'
        },
        tags: ['social', 'content', 'creator-economy'],
        createdBy: exampleUsers[2]._id,
        launchDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000)
      },
      {
        companyName: 'Green Energy DAO',
        tokenName: 'Renewable Energy Token',
        tokenSymbol: 'RET',
        description: 'Tokenizing renewable energy projects to democratize green investments. Our platform enables fractional ownership of solar farms, wind projects, and other sustainable energy infrastructure.',
        logo: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=400&h=400&fit=crop&crop=center',
        raiseGoal: 5000000,
        raisedAmount: 0,
        tokenPrice: 1.25,
        totalSupply: 8000000,
        category: 'Infrastructure',
        status: 'draft',
        featured: false,
        team: [
          { name: 'Dr. Maria Santos', role: 'CEO', bio: 'Renewable energy researcher' },
          { name: 'Robert Chen', role: 'CFO', bio: 'Green finance specialist' }
        ],
        vestingSchedule: {
          projectAllocation: 80,
          daoTreasury: 20,
          vestingPeriod: 1095,
          milestones: []
        },
        minInvestment: 500,
        maxInvestment: 100000,
        tags: ['renewable-energy', 'infrastructure', 'sustainability'],
        createdBy: exampleUsers[0]._id
      }
    ])
    
    // Create example attestations
    await Attestation.insertMany([
      {
        userId: exampleUsers[0]._id,
        type: 'github',
        provider: 'github.com',
        attestationId: 'sas_1704067200_abc123def',
        signedData: JSON.stringify({
          claim: 'github_verification',
          value: 'username:defi-protocol,followers:2500,verified:true'
        }),
        signature: 'mock_signature_1',
        publicKey: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        proofData: {
          claim: 'github_verification',
          value: 'username:defi-protocol,followers:2500,verified:true'
        },
        isVerified: true,
        verifiedAt: new Date(),
        rewardValue: 200
      },
      {
        userId: exampleUsers[1]._id,
        type: 'twitter',
        provider: 'twitter.com',
        attestationId: 'sas_1704067300_xyz789ghi',
        signedData: JSON.stringify({
          claim: 'twitter_verification',
          value: 'username:@gamingdao,verified:true,followers:5000'
        }),
        signature: 'mock_signature_2',
        publicKey: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
        proofData: {
          claim: 'twitter_verification',
          value: 'username:@gamingdao,verified:true,followers:5000'
        },
        isVerified: true,
        verifiedAt: new Date(),
        rewardValue: 225
      }
    ])
    
    console.log('Database seeded successfully!')
    console.log(`Created ${exampleUsers.length} users`)
    console.log(`Created ${exampleProjects.length} projects`)
    
  } catch (error) {
    console.error('Error seeding database:', error)
  }
} 