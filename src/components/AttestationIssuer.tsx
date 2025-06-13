'use client'

import { useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// Using native elements for simplicity
import { getAttestationService, KYCAttestation, ComplianceAttestation } from '@/services/attestationService'
import { Shield, FileCheck, Loader2 } from 'lucide-react'

export const AttestationIssuer = () => {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [loading, setLoading] = useState(false)
  const [subjectAddress, setSubjectAddress] = useState('')
  const [attestationType, setAttestationType] = useState<'kyc' | 'compliance'>('kyc')
  
  // KYC form data
  const [kycData, setKycData] = useState<KYCAttestation>({
    isVerified: true,
    level: 'enhanced',
    jurisdiction: 'US',
    ageVerified: true,
    accreditedInvestor: true,
    timestamp: Date.now(),
  })

  // Compliance form data
  const [complianceData, setComplianceData] = useState<ComplianceAttestation>({
    sanctionsCheck: true,
    amlCompliant: true,
    jurisdiction: 'US',
    riskLevel: 'low',
    timestamp: Date.now(),
  })

  const handleIssueAttestation = async () => {
    if (!wallet.connected || !subjectAddress) return

    setLoading(true)
    try {
      const attestationService = getAttestationService(connection)
      const subject = new PublicKey(subjectAddress)
      
      let signature: string
      if (attestationType === 'kyc') {
        signature = await attestationService.issueKYCAttestation(
          wallet,
          subject,
          { ...kycData, timestamp: Date.now() }
        )
      } else {
        signature = await attestationService.issueComplianceAttestation(
          wallet,
          subject,
          { ...complianceData, timestamp: Date.now() }
        )
      }

      alert(`Attestation issued successfully! Signature: ${signature}`)
      setSubjectAddress('')
    } catch (error) {
      console.error('Failed to issue attestation:', error)
      alert(`Failed to issue attestation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!wallet.connected) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Connect your wallet to issue attestations</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Issue Attestation
          </CardTitle>
          <CardDescription>
            Issue KYC or compliance attestations for users (Demo purposes)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subject Address */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject Wallet Address</Label>
            <Input
              id="subject"
              placeholder="Enter wallet address to attest..."
              value={subjectAddress}
              onChange={(e) => setSubjectAddress(e.target.value)}
            />
          </div>

          {/* Attestation Type */}
          <div className="space-y-2">
            <Label>Attestation Type</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={attestationType} 
              onChange={(e) => setAttestationType(e.target.value as 'kyc' | 'compliance')}
            >
              <option value="kyc">KYC Verification</option>
              <option value="compliance">Compliance Check</option>
            </select>
          </div>

          {/* KYC Form */}
          {attestationType === 'kyc' && (
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">KYC Details</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>KYC Level</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={kycData.level} 
                    onChange={(e) => setKycData(prev => ({ ...prev, level: e.target.value as 'basic' | 'enhanced' | 'institutional' }))}
                  >
                    <option value="basic">Basic</option>
                    <option value="enhanced">Enhanced</option>
                    <option value="institutional">Institutional</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Jurisdiction</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={kycData.jurisdiction} 
                    onChange={(e) => setKycData(prev => ({ ...prev, jurisdiction: e.target.value }))}
                  >
                    <option value="US">United States</option>
                    <option value="EU">European Union</option>
                    <option value="UK">United Kingdom</option>
                    <option value="CA">Canada</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="verified"
                    checked={kycData.isVerified}
                    onChange={(e) => setKycData(prev => ({ ...prev, isVerified: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="verified">Identity Verified</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="age"
                    checked={kycData.ageVerified}
                    onChange={(e) => setKycData(prev => ({ ...prev, ageVerified: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="age">Age Verified (18+)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="accredited"
                    checked={kycData.accreditedInvestor}
                    onChange={(e) => setKycData(prev => ({ ...prev, accreditedInvestor: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="accredited">Accredited Investor</Label>
                </div>
              </div>
            </div>
          )}

          {/* Compliance Form */}
          {attestationType === 'compliance' && (
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">Compliance Details</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Risk Level</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={complianceData.riskLevel} 
                    onChange={(e) => setComplianceData(prev => ({ ...prev, riskLevel: e.target.value as 'low' | 'medium' | 'high' }))}
                  >
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Jurisdiction</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={complianceData.jurisdiction} 
                    onChange={(e) => setComplianceData(prev => ({ ...prev, jurisdiction: e.target.value }))}
                  >
                    <option value="US">United States</option>
                    <option value="EU">European Union</option>
                    <option value="UK">United Kingdom</option>
                    <option value="CA">Canada</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="sanctions"
                    checked={complianceData.sanctionsCheck}
                    onChange={(e) => setComplianceData(prev => ({ ...prev, sanctionsCheck: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="sanctions">Sanctions Check Passed</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="aml"
                    checked={complianceData.amlCompliant}
                    onChange={(e) => setComplianceData(prev => ({ ...prev, amlCompliant: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="aml">AML Compliant</Label>
                </div>
              </div>
            </div>
          )}

          {/* Issue Button */}
          <Button 
            onClick={handleIssueAttestation}
            disabled={loading || !subjectAddress}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Issuing Attestation...
              </>
            ) : (
              `Issue ${attestationType.toUpperCase()} Attestation`
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 