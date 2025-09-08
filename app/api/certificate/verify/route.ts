import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const verificationCode = searchParams.get('code');

    if (!verificationCode) {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }

    // Find certificate by verification code
    const certificate = mockCertificates.find(
      cert => cert.verificationCode.toLowerCase() === verificationCode.toLowerCase()
    );

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    // Return certificate data
    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.id,
        name: certificate.name,
        recipient: certificate.recipient,
        issueDate: certificate.issueDate,
        issuer: certificate.issuer,
        certificateType: certificate.certificateType,
        verificationCode: certificate.verificationCode,
        status: certificate.status,
        filePath: certificate.filePath,
        description: certificate.description,
        verifiedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Error verifying certificate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { verificationCode } = body;

    if (!verificationCode) {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }

    // Find certificate by verification code
    const certificate = mockCertificates.find(
      cert => cert.verificationCode.toLowerCase() === verificationCode.toLowerCase()
    );

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    // Return certificate data
    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.id,
        name: certificate.name,
        recipient: certificate.recipient,
        issueDate: certificate.issueDate,
        issuer: certificate.issuer,
        certificateType: certificate.certificateType,
        verificationCode: certificate.verificationCode,
        status: certificate.status,
        filePath: certificate.filePath,
        description: certificate.description,
        verifiedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Error verifying certificate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
