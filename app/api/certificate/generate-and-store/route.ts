import { NextRequest, NextResponse } from 'next/server';
import { pdfCertificateGenerator } from '@/lib/pdf-certificate-generator';
import { MotokoBackendService } from '@/lib/motoko-backend-real';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress, recipientName, courseName, description, price, issuer, transactionId } = body || {};

    if (!userAddress || !recipientName || !courseName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await pdfCertificateGenerator.generateCompleteCertificate({
      recipientName,
      courseName,
      description,
      price,
      issuer: issuer || 'CREO Institute',
      issueDate: new Date().toISOString().split('T')[0],
    });

    // Read PDF back to base64 to store in canister
    const fs = require('fs');
    const path = require('path');
    const absolutePath = path.join(process.cwd(), 'public', result.pdfPath.replace(/^\/+/, ''));
    const fileBuf = fs.readFileSync(absolutePath);
    const pdfBase64 = fileBuf.toString('base64');

    const motoko = MotokoBackendService.getInstance();
    const certId = await motoko.createCertificate({
      userAddress,
      recipientName: result.certificate.recipientName,
      courseName: result.certificate.courseName,
      verificationCode: result.certificate.verificationCode,
      pdfBase64,
      transactionId,
    });

    return NextResponse.json({
      success: true,
      certificateId: certId,
      certificate: result.certificate,
      pdfPath: result.pdfPath,
    });
  } catch (error: any) {
    console.error('Error generating/storing certificate:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}


