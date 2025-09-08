'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  Download, 
  CreditCard, 
  CheckCircle, 
  Loader2,
  Star,
  Users,
  Clock,
  Shield,
  QrCode,
  FileText,
  Gift
} from 'lucide-react';

interface CertificateOption {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  features: string[];
  popular?: boolean;
  color: string;
}

interface PurchaseData {
  recipientName: string;
  email: string;
  courseName: string;
  description: string;
  selectedOption: string;
}

const certificateOptions: CertificateOption[] = [
  {
    id: 'basic',
    name: 'CREO Basic Certificate',
    description: 'Essential CREO skills and fundamentals',
    price: 49.99,
    duration: '2-3 weeks',
    features: [
      'Digital Certificate',
      'QR Code Verification',
      'Referral Code',
      'Email Delivery',
      'Lifetime Access'
    ],
    color: 'blue'
  },
  {
    id: 'professional',
    name: 'CREO Professional Certificate',
    description: 'Advanced CREO techniques and best practices',
    price: 99.99,
    duration: '4-6 weeks',
    features: [
      'Digital Certificate',
      'QR Code Verification',
      'Referral Code',
      'Email Delivery',
      'Lifetime Access',
      'Priority Support',
      'Advanced Modules'
    ],
    popular: true,
    color: 'purple'
  },
  {
    id: 'expert',
    name: 'CREO Expert Certificate',
    description: 'Master-level CREO expertise and specialization',
    price: 199.99,
    duration: '8-12 weeks',
    features: [
      'Digital Certificate',
      'QR Code Verification',
      'Referral Code',
      'Email Delivery',
      'Lifetime Access',
      'Priority Support',
      'Advanced Modules',
      '1-on-1 Mentoring',
      'Project Portfolio'
    ],
    color: 'gold'
  }
];

function CertificatePurchaseContent() {
  const [purchaseData, setPurchaseData] = useState<PurchaseData>({
    recipientName: '',
    email: '',
    courseName: '',
    description: '',
    selectedOption: 'professional'
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const selectedCertificate = certificateOptions.find(opt => opt.id === purchaseData.selectedOption);

  const handlePurchase = async () => {
    if (!selectedCertificate) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/certificate/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...purchaseData,
          price: selectedCertificate.price,
          courseName: selectedCertificate.name
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(result);
        setShowSuccessPopup(true);
      } else {
        setError(result.error || 'Purchase failed');
      }
    } catch (err: any) {
      setError(err.message || 'Purchase failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'border-blue-500 bg-blue-50 text-blue-700';
      case 'purple':
        return 'border-purple-500 bg-purple-50 text-purple-700';
      case 'gold':
        return 'border-yellow-500 bg-yellow-50 text-yellow-700';
      default:
        return 'border-gray-500 bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              CREO Professional Certificates
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Advance your career with industry-recognized CREO certifications
            </p>
            <div className="flex justify-center items-center space-x-8 text-white/80">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Verified Certificates</span>
              </div>
              <div className="flex items-center space-x-2">
                <QrCode className="h-5 w-5" />
                <span>QR Code Verification</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>10,000+ Graduates</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Certificate Options */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Choose Your Certificate</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {certificateOptions.map((option) => (
                <Card 
                  key={option.id}
                  className={`relative cursor-pointer transition-all duration-300 hover:scale-105 ${
                    purchaseData.selectedOption === option.id 
                      ? 'ring-2 ring-indigo-500 bg-indigo-50/10' 
                      : 'bg-slate-800/70 border-slate-700 hover:bg-slate-700/70'
                  }`}
                  onClick={() => setPurchaseData({ ...purchaseData, selectedOption: option.id })}
                >
                  {option.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${getColorClasses(option.color)}`}>
                      <Award className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-white text-lg">{option.name}</CardTitle>
                    <CardDescription className="text-slate-400">{option.description}</CardDescription>
                    <div className="text-3xl font-bold text-white mt-4">
                      ${option.price}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center text-slate-300 text-sm">
                        <Clock className="h-4 w-4 mr-2" />
                        Duration: {option.duration}
                      </div>
                      
                      <div className="space-y-2">
                        {option.features.map((feature, index) => (
                          <div key={index} className="flex items-center text-slate-300 text-sm">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Purchase Form */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800/70 border-slate-700 sticky top-8">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Purchase Certificate
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Fill in the details to generate your certificate
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Recipient Name *</Label>
                    <Input
                      value={purchaseData.recipientName}
                      onChange={(e) => setPurchaseData({ ...purchaseData, recipientName: e.target.value })}
                      placeholder="Enter full name"
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Email Address *</Label>
                    <Input
                      type="email"
                      value={purchaseData.email}
                      onChange={(e) => setPurchaseData({ ...purchaseData, email: e.target.value })}
                      placeholder="Enter email address"
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Course Description</Label>
                    <Textarea
                      value={purchaseData.description}
                      onChange={(e) => setPurchaseData({ ...purchaseData, description: e.target.value })}
                      placeholder="Optional course description..."
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Order Summary */}
                {selectedCertificate && (
                  <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                    <h4 className="text-white font-medium">Order Summary</h4>
                    <div className="flex justify-between text-slate-300">
                      <span>{selectedCertificate.name}</span>
                      <span>${selectedCertificate.price}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Processing Fee</span>
                      <span>$2.99</span>
                    </div>
                    <div className="border-t border-slate-600 pt-2">
                      <div className="flex justify-between text-white font-bold">
                        <span>Total</span>
                        <span>${(selectedCertificate.price + 2.99).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handlePurchase}
                  disabled={isProcessing || !purchaseData.recipientName || !purchaseData.email}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Purchase Certificate
                    </>
                  )}
                </Button>

                {error && (
                  <Alert className="border-red-500/40 bg-red-500/10">
                    <AlertDescription className="text-red-300">{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && success && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Certificate Generated Successfully!
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2">Certificate Details:</div>
                  <div className="text-lg font-semibold text-gray-900">{success.certificate.recipientName}</div>
                  <div className="text-sm text-gray-600">{success.certificate.courseName}</div>
                  <div className="text-sm text-gray-600">Verification Code: {success.certificate.verificationCode}</div>
                  <div className="text-sm text-green-600 font-medium">Referral Code: {success.certificate.referralCode}</div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => window.open(success.pdfPath, '_blank')}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  onClick={() => setShowSuccessPopup(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export the component with dynamic import to avoid SSR issues
const CertificatePurchase = dynamic(() => Promise.resolve(CertificatePurchaseContent), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Loading certificate purchase...</p>
      </div>
    </div>
  )
});

export default CertificatePurchase;
