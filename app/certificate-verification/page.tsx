'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  CheckCircle, 
  XCircle, 
  Download, 
  Eye, 
  Calendar,
  User,
  Award,
  Shield,
  Loader2
} from 'lucide-react';

interface CertificateData {
  id: string;
  name: string;
  recipient: string;
  issueDate: string;
  issuer: string;
  certificateType: string;
  verificationCode: string;
  status: 'valid' | 'invalid' | 'expired';
  filePath: string;
  description: string;
}

// Mock certificate database - in production, this would be a real database
const mockCertificates: CertificateData[] = [
  {
    id: 'cert-001',
    name: 'CREO Certificate',
    recipient: 'John Doe',
    issueDate: '2024-01-15',
    issuer: 'CREO Institute',
    certificateType: 'Professional Development',
    verificationCode: 'CREO-2024-001',
    status: 'valid',
    filePath: '/CREO_Certificate.pdf',
    description: 'Certificate of completion for CREO professional development program'
  },
  {
    id: 'cert-002',
    name: 'CREO Advanced Certificate',
    recipient: 'Jane Smith',
    issueDate: '2024-02-20',
    issuer: 'CREO Institute',
    certificateType: 'Advanced Training',
    verificationCode: 'CREO-2024-002',
    status: 'valid',
    filePath: '/CREO_Certificate.pdf',
    description: 'Advanced certificate in CREO methodologies and practices'
  }
];

function CertificateVerificationContent() {
  const searchParams = useSearchParams();
  const [verificationCode, setVerificationCode] = useState('');
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  // Check for verification code in URL parameters
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setVerificationCode(codeFromUrl);
      verifyCertificate(codeFromUrl);
    }
  }, [searchParams]);

  const verifyCertificate = async (code: string) => {
    setIsVerifying(true);
    setError(null);
    setCertificate(null);

    try {
      const response = await fetch(`/api/certificate/verify?code=${encodeURIComponent(code)}`);
      const data = await response.json();

      if (data.success && data.certificate) {
        setCertificate(data.certificate);
      } else {
        setError(data.error || 'Certificate not found. Please check the verification code.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.trim()) {
      verifyCertificate(verificationCode.trim());
    }
  };

  const handleQRScan = (scannedCode: string) => {
    setVerificationCode(scannedCode);
    verifyCertificate(scannedCode);
    setShowScanner(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-500 text-white">Valid</Badge>;
      case 'invalid':
        return <Badge className="bg-red-500 text-white">Invalid</Badge>;
      case 'expired':
        return <Badge className="bg-yellow-500 text-white">Expired</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">Unknown</Badge>;
    }
  };

  const downloadCertificate = () => {
    if (certificate) {
      const link = document.createElement('a');
      link.href = certificate.filePath;
      link.download = `${certificate.name}_${certificate.recipient}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center justify-center gap-2">
            <Shield className="h-8 w-8" />
            Certificate Verification
          </h1>
          <p className="text-slate-300">
            Verify the authenticity of certificates by scanning QR codes or entering verification codes
          </p>
        </div>

        {/* Verification Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* QR Code Scanner */}
          <Card className="bg-slate-800/70 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Scan QR Code
              </CardTitle>
              <CardDescription className="text-slate-400">
                Use your camera to scan the QR code on the certificate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setShowScanner(!showScanner)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {showScanner ? 'Hide Scanner' : 'Open QR Scanner'}
              </Button>
              
              {showScanner && (
                <div className="mt-4 p-4 bg-slate-700/60 rounded-lg border border-slate-600">
                  <p className="text-slate-300 text-sm text-center">
                    QR Scanner would be implemented here using a library like react-qr-scanner
                  </p>
                  <p className="text-slate-400 text-xs text-center mt-2">
                    For now, you can manually enter the verification code below
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Verification */}
          <Card className="bg-slate-800/70 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Award className="h-5 w-5" />
                Manual Verification
              </CardTitle>
              <CardDescription className="text-slate-400">
                Enter the verification code manually
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualVerification} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Verification Code</Label>
                  <Input
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter verification code (e.g., CREO-2024-001)"
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isVerifying || !verificationCode.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify Certificate
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="border-red-500/40 bg-red-500/10">
            <XCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {/* Certificate Display */}
        {certificate && (
          <Card className="bg-slate-800/70 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Award className="h-6 w-6" />
                    {certificate.name}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {certificate.description}
                  </CardDescription>
                </div>
                {getStatusBadge(certificate.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Certificate Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-300 font-medium">Recipient:</span>
                    <span className="text-white">{certificate.recipient}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-300 font-medium">Issue Date:</span>
                    <span className="text-white">{new Date(certificate.issueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-300 font-medium">Issuer:</span>
                    <span className="text-white">{certificate.issuer}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-300 font-medium">Type:</span>
                    <span className="text-white">{certificate.certificateType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-300 font-medium">Code:</span>
                    <span className="text-white font-mono">{certificate.verificationCode}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-600">
                <Button
                  onClick={downloadCertificate}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Certificate
                </Button>
                <Button
                  onClick={() => window.open(certificate.filePath, '_blank')}
                  variant="outline"
                  className="border-slate-600 text-slate-200 hover:bg-slate-700"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Certificate
                </Button>
              </div>

              {/* Verification Success Message */}
              {certificate.status === 'valid' && (
                <Alert className="border-green-500/40 bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-300">
                    ✅ This certificate is valid and authentic. It has been verified in our system.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sample Verification Codes */}
        <Card className="bg-slate-800/70 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Sample Verification Codes</CardTitle>
            <CardDescription className="text-slate-400">
              Try these sample codes to test the verification system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-slate-300 font-medium">Valid Certificates:</p>
                <div className="space-y-1">
                  <code className="block p-2 bg-slate-700 rounded text-green-300 font-mono text-sm">
                    CREO-2024-001
                  </code>
                  <code className="block p-2 bg-slate-700 rounded text-green-300 font-mono text-sm">
                    CREO-2024-002
                  </code>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-slate-300 font-medium">Test Invalid Code:</p>
                <code className="block p-2 bg-slate-700 rounded text-red-300 font-mono text-sm">
                  INVALID-CODE
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Export the component with dynamic import to avoid SSR issues
const CertificateVerification = dynamic(() => Promise.resolve(CertificateVerificationContent), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Loading certificate verification...</p>
      </div>
    </div>
  )
});

export default CertificateVerification;
