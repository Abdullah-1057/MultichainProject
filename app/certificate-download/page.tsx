'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Search, 
  Award, 
  QrCode, 
  FileText, 
  CheckCircle, 
  XCircle,
  Loader2,
  Calendar,
  User,
  Building,
  Gift,
  Share2
} from 'lucide-react';

interface Certificate {
  id: string;
  recipientName: string;
  courseName: string;
  issueDate: string;
  issuer: string;
  verificationCode: string;
  referralCode: string;
  certificateNumber: string;
  pdfPath: string;
  status: 'valid' | 'invalid' | 'expired';
  description: string;
}

function CertificateDownloadContent() {
  const [searchCode, setSearchCode] = useState('');
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentCertificates, setRecentCertificates] = useState<Certificate[]>([]);

  // Mock recent certificates - in real app, this would come from API
  useEffect(() => {
    const mockRecent = [
      {
        id: 'cert-001',
        recipientName: 'John Doe',
        courseName: 'CREO Professional Certificate',
        issueDate: '2024-01-15',
        issuer: 'CREO Institute',
        verificationCode: 'CREO-2024-001',
        referralCode: 'A1B2',
        certificateNumber: 'CERT-0001',
        pdfPath: '/certificates/certificate-CREO-2024-001.pdf',
        status: 'valid' as const,
        description: 'Certificate of completion for CREO professional development program'
      },
      {
        id: 'cert-002',
        recipientName: 'Jane Smith',
        courseName: 'CREO Expert Certificate',
        issueDate: '2024-02-20',
        issuer: 'CREO Institute',
        verificationCode: 'CREO-2024-002',
        referralCode: 'C3D4',
        certificateNumber: 'CERT-0002',
        pdfPath: '/certificates/certificate-CREO-2024-002.pdf',
        status: 'valid' as const,
        description: 'Advanced certificate in CREO methodologies and practices'
      }
    ];
    setRecentCertificates(mockRecent);
  }, []);

  const searchCertificate = async (code: string) => {
    if (!code.trim()) return;

    setIsSearching(true);
    setError(null);
    setCertificate(null);

    try {
      const response = await fetch(`/api/certificate/verify?code=${encodeURIComponent(code)}`);
      const data = await response.json();

      if (data.success && data.certificate) {
        setCertificate(data.certificate);
      } else {
        setError(data.error || 'Certificate not found');
      }
    } catch (err: any) {
      setError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchCertificate(searchCode);
  };

  const downloadCertificate = (cert: Certificate) => {
    const link = document.createElement('a');
    link.href = cert.pdfPath;
    link.download = `${cert.courseName}_${cert.recipientName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareCertificate = (cert: Certificate) => {
    const shareUrl = `${window.location.origin}/certificate-verification?code=${cert.verificationCode}`;
    if (navigator.share) {
      navigator.share({
        title: `${cert.courseName} Certificate`,
        text: `Check out my ${cert.courseName} certificate!`,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      // Show toast notification
      alert('Certificate link copied to clipboard!');
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Download Your Certificates
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Access and download your CREO professional certificates
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Section */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800/70 border-slate-700 sticky top-8">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Certificate
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Enter your verification code to find and download your certificate
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Verification Code</Label>
                    <Input
                      value={searchCode}
                      onChange={(e) => setSearchCode(e.target.value)}
                      placeholder="Enter verification code (e.g., CREO-2024-001)"
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isSearching || !searchCode.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Search Certificate
                      </>
                    )}
                  </Button>
                </form>

                {error && (
                  <Alert className="border-red-500/40 bg-red-500/10">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Quick Access */}
            <Card className="bg-slate-800/70 border-slate-700 mt-6">
              <CardHeader>
                <CardTitle className="text-white text-lg">Quick Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-600 text-slate-200 hover:bg-slate-700"
                  onClick={() => window.open('/certificate-verification', '_blank')}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Verify Certificate
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-600 text-slate-200 hover:bg-slate-700"
                  onClick={() => window.open('/certificate-purchase', '_blank')}
                >
                  <Award className="h-4 w-4 mr-2" />
                  Buy New Certificate
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Certificate Display */}
          <div className="lg:col-span-2">
            {certificate ? (
              <Card className="bg-slate-800/70 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Award className="h-6 w-6" />
                        {certificate.courseName}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-slate-400" />
                        <div>
                          <div className="text-slate-300 text-sm">Recipient</div>
                          <div className="text-white font-medium">{certificate.recipientName}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-slate-400" />
                        <div>
                          <div className="text-slate-300 text-sm">Issue Date</div>
                          <div className="text-white font-medium">
                            {new Date(certificate.issueDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-slate-400" />
                        <div>
                          <div className="text-slate-300 text-sm">Issuer</div>
                          <div className="text-white font-medium">{certificate.issuer}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-slate-400" />
                        <div>
                          <div className="text-slate-300 text-sm">Certificate Number</div>
                          <div className="text-white font-medium font-mono">{certificate.certificateNumber}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <QrCode className="h-5 w-5 text-slate-400" />
                        <div>
                          <div className="text-slate-300 text-sm">Verification Code</div>
                          <div className="text-white font-medium font-mono">{certificate.verificationCode}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Gift className="h-5 w-5 text-slate-400" />
                        <div>
                          <div className="text-slate-300 text-sm">Referral Code</div>
                          <div className="text-green-400 font-medium font-mono text-lg">{certificate.referralCode}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-600">
                    <Button
                      onClick={() => downloadCertificate(certificate)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    
                    <Button
                      onClick={() => shareCertificate(certificate)}
                      variant="outline"
                      className="border-slate-600 text-slate-200 hover:bg-slate-700"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Certificate
                    </Button>
                    
                    <Button
                      onClick={() => window.open(`/certificate-verification?code=${certificate.verificationCode}`, '_blank')}
                      variant="outline"
                      className="border-slate-600 text-slate-200 hover:bg-slate-700"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Verify Online
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
            ) : (
              <div className="text-center py-12">
                <Award className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Certificate Selected</h3>
                <p className="text-slate-400 mb-6">
                  Search for a certificate using the verification code to view and download it.
                </p>
                
                {/* Recent Certificates */}
                {recentCertificates.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold text-white mb-4">Recent Certificates</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recentCertificates.map((cert) => (
                        <Card 
                          key={cert.id}
                          className="bg-slate-800/70 border-slate-700 cursor-pointer hover:bg-slate-700/70 transition-colors"
                          onClick={() => setCertificate(cert)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-white font-medium">{cert.courseName}</h5>
                              {getStatusBadge(cert.status)}
                            </div>
                            <p className="text-slate-400 text-sm">{cert.recipientName}</p>
                            <p className="text-slate-500 text-xs">{cert.issueDate}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Export the component with dynamic import to avoid SSR issues
const CertificateDownload = dynamic(() => Promise.resolve(CertificateDownloadContent), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Loading certificate download...</p>
      </div>
    </div>
  )
});

export default CertificateDownload;
