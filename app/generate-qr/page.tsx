'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  QrCode, 
  Download, 
  Copy, 
  CheckCircle,
  Loader2,
  FileText,
  User,
  Calendar,
  Building
} from 'lucide-react';
import { qrGenerator, CertificateQRData } from '@/lib/qr-generator';

interface CertificateForm {
  id: string;
  verificationCode: string;
  recipient: string;
  issueDate: string;
  issuer: string;
  description: string;
}

export default function GenerateQR() {
  const [certificate, setCertificate] = useState<CertificateForm>({
    id: '',
    verificationCode: '',
    recipient: '',
    issueDate: '',
    issuer: 'CREO Institute',
    description: ''
  });

  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateQRCode = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!certificate.id || !certificate.verificationCode || !certificate.recipient || !certificate.issueDate) {
        throw new Error('Please fill in all required fields');
      }

      // Generate QR data
      const qrData = qrGenerator.generateQRData({
        id: certificate.id,
        verificationCode: certificate.verificationCode,
        recipient: certificate.recipient,
        issueDate: certificate.issueDate,
        issuer: certificate.issuer,
      });

      // Generate QR code
      const qrCode = await qrGenerator.generateQRCodeDataURL(qrData);
      setQrCodeDataURL(qrCode);
      setSuccess('QR code generated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeDataURL) {
      const link = document.createElement('a');
      link.href = qrCodeDataURL;
      link.download = `certificate-qr-${certificate.verificationCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const copyVerificationURL = async () => {
    if (certificate.verificationCode) {
      const verificationUrl = `${window.location.origin}/certificate-verification?code=${certificate.verificationCode}`;
      try {
        await navigator.clipboard.writeText(verificationUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy URL:', err);
      }
    }
  };

  const generateSampleCertificate = () => {
    const sampleId = `cert-${Date.now()}`;
    const sampleCode = `CREO-2024-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    setCertificate({
      id: sampleId,
      verificationCode: sampleCode,
      recipient: 'John Doe',
      issueDate: new Date().toISOString().split('T')[0],
      issuer: 'CREO Institute',
      description: 'Certificate of completion for CREO professional development program'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center justify-center gap-2">
            <QrCode className="h-8 w-8" />
            Generate Certificate QR Codes
          </h1>
          <p className="text-slate-300">
            Create QR codes for your certificates that users can scan to verify authenticity
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Certificate Form */}
          <Card className="bg-slate-800/70 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Certificate Details
              </CardTitle>
              <CardDescription className="text-slate-400">
                Enter the certificate information to generate a QR code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Certificate ID *</Label>
                  <Input
                    value={certificate.id}
                    onChange={(e) => setCertificate({ ...certificate, id: e.target.value })}
                    placeholder="cert-001"
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Verification Code *</Label>
                  <Input
                    value={certificate.verificationCode}
                    onChange={(e) => setCertificate({ ...certificate, verificationCode: e.target.value })}
                    placeholder="CREO-2024-001"
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Recipient Name *</Label>
                <Input
                  value={certificate.recipient}
                  onChange={(e) => setCertificate({ ...certificate, recipient: e.target.value })}
                  placeholder="John Doe"
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Issue Date *</Label>
                  <Input
                    type="date"
                    value={certificate.issueDate}
                    onChange={(e) => setCertificate({ ...certificate, issueDate: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Issuer</Label>
                  <Input
                    value={certificate.issuer}
                    onChange={(e) => setCertificate({ ...certificate, issuer: e.target.value })}
                    placeholder="CREO Institute"
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Description</Label>
                <Textarea
                  value={certificate.description}
                  onChange={(e) => setCertificate({ ...certificate, description: e.target.value })}
                  placeholder="Certificate description..."
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={generateQRCode}
                  disabled={isGenerating}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Generate QR Code
                    </>
                  )}
                </Button>
                <Button
                  onClick={generateSampleCertificate}
                  variant="outline"
                  className="border-slate-600 text-slate-200 hover:bg-slate-700"
                >
                  Sample
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Display */}
          <Card className="bg-slate-800/70 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Generated QR Code
              </CardTitle>
              <CardDescription className="text-slate-400">
                Scan this QR code to verify the certificate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {qrCodeDataURL ? (
                <>
                  <div className="flex justify-center">
                    <img
                      src={qrCodeDataURL}
                      alt="Certificate QR Code"
                      className="max-w-full h-auto border border-slate-600 rounded-lg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-300">Verification URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={`${window.location.origin}/certificate-verification?code=${certificate.verificationCode}`}
                        readOnly
                        className="bg-slate-700 border-slate-600 text-white text-sm"
                      />
                      <Button
                        onClick={copyVerificationURL}
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-slate-200 hover:bg-slate-700"
                      >
                        {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={downloadQRCode}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <QrCode className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Generate a QR code to see it here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Alert className="border-red-500/40 bg-red-500/10">
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500/40 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300">{success}</AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <Card className="bg-slate-800/70 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">How to Use QR Codes</CardTitle>
            <CardDescription className="text-slate-400">
              Instructions for implementing QR codes in your certificates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-white font-medium mb-2">For Digital Certificates:</h4>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Add the QR code image to your PDF certificate</li>
                  <li>• Place it in a corner or footer area</li>
                  <li>• Ensure it's clearly visible and scannable</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium mb-2">For Physical Certificates:</h4>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Print the QR code on the certificate</li>
                  <li>• Use high-quality printing for better scanning</li>
                  <li>• Consider laminating to protect the QR code</li>
                </ul>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-600">
              <h4 className="text-white font-medium mb-2">Verification Process:</h4>
              <ol className="text-slate-300 text-sm space-y-1 list-decimal list-inside">
                <li>User scans the QR code with their phone camera</li>
                <li>QR code contains verification URL and certificate data</li>
                <li>User is redirected to verification page</li>
                <li>Certificate details are displayed and verified</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
