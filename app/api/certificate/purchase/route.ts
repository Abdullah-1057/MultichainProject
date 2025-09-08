import { NextRequest, NextResponse } from 'next/server';
import { pdfCertificateGenerator } from '@/lib/pdf-certificate-generator';

interface PurchaseRequest {
  recipientName: string;
  email: string;
  courseName: string;
  description: string;
  selectedOption: string;
  price: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: PurchaseRequest = await request.json();
    
    // Validate required fields
    if (!body.recipientName || !body.email || !body.courseName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if we can generate more certificates
    if (!pdfCertificateGenerator.canGenerateCertificate()) {
      return NextResponse.json(
        { error: 'Certificate generation limit reached (1000 certificates)' },
        { status: 400 }
      );
    }

    // Generate certificate
    const result = await pdfCertificateGenerator.generateCompleteCertificate({
      recipientName: body.recipientName,
      courseName: body.courseName,
      description: body.description,
      price: body.price,
      issuer: 'CREO Institute',
      issueDate: new Date().toISOString().split('T')[0]
    });

    // In a real application, you would:
    // 1. Process payment with Stripe/PayPal
    // 2. Send email with certificate
    // 3. Store purchase record in database
    // 4. Send confirmation email

    // For now, we'll simulate a successful purchase
    const purchaseRecord = {
      id: result.certificate.id,
      recipientName: result.certificate.recipientName,
      email: body.email,
      courseName: result.certificate.courseName,
      price: body.price,
      verificationCode: result.certificate.verificationCode,
      referralCode: result.certificate.referralCode,
      pdfPath: result.pdfPath,
      purchasedAt: new Date().toISOString(),
      status: 'completed'
    };

    // TODO: Save to database
    console.log('Purchase record:', purchaseRecord);

    // TODO: Send email with certificate
    // await sendCertificateEmail(body.email, result.certificate, result.pdfPath);

    return NextResponse.json({
      success: true,
      message: 'Certificate generated successfully',
      certificate: result.certificate,
      pdfPath: result.pdfPath,
      qrCodeDataURL: result.qrCodeDataURL,
      purchaseRecord
    });

  } catch (error: any) {
    console.error('Certificate purchase error:', error);
    
    if (error.message.includes('Maximum certificate limit reached')) {
      return NextResponse.json(
        { error: 'Certificate generation limit reached. Please try again later.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate certificate' },
      { status: 500 }
    );
  }
}

// Get certificate statistics
export async function GET() {
  try {
    const stats = pdfCertificateGenerator.getStats();
    
    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting certificate stats:', error);
    return NextResponse.json(
      { error: 'Failed to get certificate statistics' },
      { status: 500 }
    );
  }
}
