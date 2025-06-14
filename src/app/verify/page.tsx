'use client'

import { useState, useEffect, useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, Shield, User, AlertTriangle, Clock } from 'lucide-react'
import { getAttestationService, KYCAttestation, ComplianceAttestation, AttestationData } from '@/services/attestationService'
import { AttestationIssuer } from '@/components/AttestationIssuer'

interface EligibilityCheck {
  eligible: boolean;
  reasons: string[];
  kycStatus?: KYCAttestation;
  complianceStatus?: ComplianceAttestation;
}

export default function VerifyPage() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [loading, setLoading] = useState(false)
  const [verificationAddress, setVerificationAddress] = useState('')
  const [kycStatus, setKycStatus] = useState<KYCAttestation | null>(null)
  const [complianceStatus, setComplianceStatus] = useState<ComplianceAttestation | null>(null)
  const [allAttestations, setAllAttestations] = useState<AttestationData[]>([])
  const [eligibilityCheck, setEligibilityCheck] = useState<EligibilityCheck | null>(null)

  const attestationService = getAttestationService(connection)

  const handleVerification = useCallback(async (address?: string) => {
    const targetAddress = address || verificationAddress
    if (!targetAddress) return

    setLoading(true)
    try {
      const publicKey = new PublicKey(targetAddress)
      
      // Fetch all verification data in parallel
      const [kyc, compliance, attestations, eligibility] = await Promise.all([
        attestationService.verifyKYCStatus(publicKey),
        attestationService.verifyComplianceStatus(publicKey),
        attestationService.getUserAttestations(publicKey),
        attestationService.checkTokenSaleEligibility(publicKey, {
          requireKYC: true,
          requireCompliance: true,
          minKYCLevel: 'enhanced',
          allowedJurisdictions: ['US', 'EU', 'UK'],
          requireAccreditedInvestor: true,
        })
      ])

      setKycStatus(kyc)
      setComplianceStatus(compliance)
      setAllAttestations(attestations)
      setEligibilityCheck(eligibility)
    } catch (error) {
      console.error('Verification failed:', error)
    } finally {
      setLoading(false)
    }
  }, [verificationAddress, attestationService])

  // Auto-verify connected wallet
  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      setVerificationAddress(wallet.publicKey.toString())
      handleVerification(wallet.publicKey.toString())
    }
  }, [wallet.connected, wallet.publicKey, handleVerification])

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  }

  const getKYCLevelColor = (level: string) => {
    switch (level) {
      case 'basic': return 'bg-yellow-100 text-yellow-800'
      case 'enhanced': return 'bg-blue-100 text-blue-800'
      case 'institutional': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Identity Verification</h1>
          <p className="text-gray-600">
            Verify wallet credentials and compliance status using Solana Attestation Service
          </p>
        </div>

        {/* Address Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Wallet Verification
            </CardTitle>
            <CardDescription>
              Enter a wallet address to verify or use your connected wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="address">Wallet Address</Label>
                <Input
                  id="address"
                  placeholder="Enter Solana wallet address..."
                  value={verificationAddress}
                  onChange={(e) => setVerificationAddress(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={() => handleVerification()}
                  disabled={loading || !verificationAddress}
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
            </div>
            {wallet.connected && (
              <p className="text-sm text-gray-500 mt-2">
                Connected wallet: {wallet.publicKey?.toString().slice(0, 8)}...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Verification Results */}
        {(kycStatus || complianceStatus) && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* KYC Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  KYC Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kycStatus ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Verification Status</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(kycStatus.isVerified)}
                        <span className={kycStatus.isVerified ? 'text-green-600' : 'text-red-600'}>
                          {kycStatus.isVerified ? 'Verified' : 'Not Verified'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>KYC Level</span>
                      <Badge className={getKYCLevelColor(kycStatus.level)}>
                        {kycStatus.level.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Jurisdiction</span>
                      <span className="font-medium">{kycStatus.jurisdiction}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Age Verified</span>
                      {getStatusIcon(kycStatus.ageVerified)}
                    </div>

                    {kycStatus.accreditedInvestor !== undefined && (
                      <div className="flex items-center justify-between">
                        <span>Accredited Investor</span>
                        {getStatusIcon(kycStatus.accreditedInvestor)}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Verified</span>
                      <span>{new Date(kycStatus.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No KYC verification found
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Compliance Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Compliance Check
                </CardTitle>
              </CardHeader>
              <CardContent>
                {complianceStatus ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Sanctions Check</span>
                      {getStatusIcon(complianceStatus.sanctionsCheck)}
                    </div>

                    <div className="flex items-center justify-between">
                      <span>AML Compliant</span>
                      {getStatusIcon(complianceStatus.amlCompliant)}
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Risk Level</span>
                      <Badge className={getRiskLevelColor(complianceStatus.riskLevel)}>
                        {complianceStatus.riskLevel.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Jurisdiction</span>
                      <span className="font-medium">{complianceStatus.jurisdiction}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Checked</span>
                      <span>{new Date(complianceStatus.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No compliance check found
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Token Sale Eligibility */}
        {eligibilityCheck && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Token Sale Eligibility
              </CardTitle>
              <CardDescription>
                Eligibility check for enhanced token sales with KYC and compliance requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(eligibilityCheck.eligible)}
                  <span className={`font-medium ${eligibilityCheck.eligible ? 'text-green-600' : 'text-red-600'}`}>
                    {eligibilityCheck.eligible ? 'Eligible for Token Sales' : 'Not Eligible for Token Sales'}
                  </span>
                </div>

                {!eligibilityCheck.eligible && eligibilityCheck.reasons.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-600 mb-2">Requirements not met:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                      {eligibilityCheck.reasons.map((reason: string, index: number) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Attestations */}
        {allAttestations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                All Attestations
              </CardTitle>
              <CardDescription>
                Complete history of attestations for this wallet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allAttestations.map((attestation, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{attestation.schema}</Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(attestation.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p><strong>Issuer:</strong> {attestation.issuer.toString().slice(0, 8)}...</p>
                      <p><strong>Subject:</strong> {attestation.subject.toString().slice(0, 8)}...</p>
                      <p><strong>Signature:</strong> {attestation.signature}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Results */}
        {!loading && verificationAddress && !kycStatus && !complianceStatus && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No attestations found for this wallet address.</p>
              <p className="text-sm text-gray-400 mt-2">
                The wallet may not have completed KYC or compliance verification yet.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Attestation Issuer (Demo) */}
        <div className="mt-8 pt-8 border-t">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Issue Attestations (Demo)</h2>
            <p className="text-gray-600">
              For demonstration purposes - issue KYC and compliance attestations
            </p>
          </div>
          <AttestationIssuer />
        </div>
      </div>
    </div>
  )
} 