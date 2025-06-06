import { PublicKey } from '@solana/web3.js'

export interface ReclaimProof {
  identifier: string
  claimData: {
    provider: string
    parameters: string
    context: string
  }
  signatures: string[]
  witnesses: string[]
}

export interface SolanaAttestation {
  attestation: string
  signature: string
  publicKey: PublicKey
  timestamp: number
}

export interface VerificationResult {
  isValid: boolean
  provider: string
  data: unknown
  error?: string
}

export class VerificationService {
  async verifyReclaimProof(proof: ReclaimProof): Promise<VerificationResult> {
    try {
      // In a real implementation, you would:
      // 1. Verify the proof signatures against known Reclaim witnesses
      // 2. Validate the claim data structure
      // 3. Check the provider-specific requirements
      
      // For demo purposes, we'll simulate verification
      const isValid = this.validateReclaimProofStructure(proof)
      
      if (!isValid) {
        return {
          isValid: false,
          provider: 'reclaim',
          data: null,
          error: 'Invalid proof structure'
        }
      }

      // Extract verified data based on provider
      const verifiedData = this.extractReclaimData(proof)
      
      return {
        isValid: true,
        provider: 'reclaim',
        data: verifiedData
      }
    } catch (error) {
      return {
        isValid: false,
        provider: 'reclaim',
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async verifySolanaAttestation(attestation: SolanaAttestation): Promise<VerificationResult> {
    try {
      // In a real implementation, you would:
      // 1. Verify the signature against the public key
      // 2. Check the attestation format and content
      // 3. Validate against known attestation authorities
      
      // For demo purposes, we'll simulate verification
      const isValid = this.validateSolanaAttestationStructure(attestation)
      
      if (!isValid) {
        return {
          isValid: false,
          provider: 'solana-attestation',
          data: null,
          error: 'Invalid attestation structure'
        }
      }

      const verifiedData = this.extractAttestationData(attestation)
      
      return {
        isValid: true,
        provider: 'solana-attestation',
        data: verifiedData
      }
    } catch (error) {
      return {
        isValid: false,
        provider: 'solana-attestation',
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async checkEligibility(
    userAddress: PublicKey,
    rules: string[],
    verificationMethod: 'reclaim' | 'solana-attestation',
    proof: ReclaimProof | SolanaAttestation
  ): Promise<boolean> {
    try {
      let verificationResult: VerificationResult

      if (verificationMethod === 'reclaim') {
        verificationResult = await this.verifyReclaimProof(proof as ReclaimProof)
      } else {
        verificationResult = await this.verifySolanaAttestation(proof as SolanaAttestation)
      }

      if (!verificationResult.isValid) {
        return false
      }

      // Check if the verified data meets the eligibility rules
      const data = verificationResult.data as Record<string, unknown>
      return this.evaluateEligibilityRules(rules, data)
    } catch (error) {
      console.error('Eligibility check failed:', error)
      return false
    }
  }

  private validateReclaimProofStructure(proof: ReclaimProof): boolean {
    return !!(
      proof.identifier &&
      proof.claimData &&
      proof.claimData.provider &&
      proof.signatures &&
      proof.witnesses &&
      Array.isArray(proof.signatures) &&
      Array.isArray(proof.witnesses)
    )
  }

  private validateSolanaAttestationStructure(attestation: SolanaAttestation): boolean {
    return !!(
      attestation.attestation &&
      attestation.signature &&
      attestation.publicKey &&
      attestation.timestamp
    )
  }

  private extractReclaimData(proof: ReclaimProof): Record<string, unknown> {
    // Extract and parse the claim data based on provider
    const { provider, parameters } = proof.claimData
    
    switch (provider) {
      case 'github':
        return {
          platform: 'github',
          username: this.parseGithubData(parameters),
          verified: true
        }
      case 'twitter':
        return {
          platform: 'twitter',
          username: this.parseTwitterData(parameters),
          verified: true
        }
      case 'discord':
        return {
          platform: 'discord',
          userId: this.parseDiscordData(parameters),
          verified: true
        }
      default:
        return {
          platform: provider,
          data: parameters,
          verified: true
        }
    }
  }

  private extractAttestationData(attestation: SolanaAttestation): Record<string, unknown> {
    // Parse the attestation data
    try {
      const data = JSON.parse(attestation.attestation)
      return {
        ...data,
        publicKey: attestation.publicKey.toString(),
        timestamp: attestation.timestamp,
        verified: true
      }
    } catch {
      return {
        raw: attestation.attestation,
        publicKey: attestation.publicKey.toString(),
        timestamp: attestation.timestamp,
        verified: true
      }
    }
  }

  private evaluateEligibilityRules(rules: string[], verifiedData: Record<string, unknown>): boolean {
    // Evaluate each rule against the verified data
    for (const rule of rules) {
      if (!this.evaluateRule(rule, verifiedData)) {
        return false
      }
    }
    return true
  }

  private evaluateRule(rule: string, data: Record<string, unknown>): boolean {
    // Simple rule evaluation - in production, you'd want a more sophisticated rule engine
    try {
      // Example rules:
      // "github.followers > 100"
      // "twitter.verified = true"
      // "discord.member_since < 2023-01-01"
      
      const [path, operator, value] = rule.split(' ')
      const dataValue = this.getNestedValue(data, path)
      
      switch (operator) {
        case '>':
          return Number(dataValue) > Number(value)
        case '<':
          return Number(dataValue) < Number(value)
        case '>=':
          return Number(dataValue) >= Number(value)
        case '<=':
          return Number(dataValue) <= Number(value)
        case '=':
        case '==':
          return String(dataValue) === String(value)
        case '!=':
          return String(dataValue) !== String(value)
        default:
          return false
      }
    } catch {
      return false
    }
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return path.split('.').reduce((current: any, key) => current?.[key], obj)
  }

  private parseGithubData(parameters: string): string {
    // Parse GitHub-specific parameters
    try {
      const data = JSON.parse(parameters)
      return data.username || data.login || ''
    } catch {
      return parameters
    }
  }

  private parseTwitterData(parameters: string): string {
    // Parse Twitter-specific parameters
    try {
      const data = JSON.parse(parameters)
      return data.username || data.screen_name || ''
    } catch {
      return parameters
    }
  }

  private parseDiscordData(parameters: string): string {
    // Parse Discord-specific parameters
    try {
      const data = JSON.parse(parameters)
      return data.id || data.userId || ''
    } catch {
      return parameters
    }
  }
}

export const verificationService = new VerificationService() 