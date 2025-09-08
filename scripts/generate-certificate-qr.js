#!/usr/bin/env node

/**
 * Script to generate QR codes for existing certificates
 * This will create QR codes that link to the verification page
 */

const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Certificate data for your CREO certificates
const certificates = [
  {
    id: 'cert-creo-001',
    name: 'CREO Certificate',
    recipient: 'John Doe',
    issueDate: '2024-01-15',
    issuer: 'CREO Institute',
    verificationCode: 'CREO-2024-001',
    description: 'Certificate of completion for CREO professional development program'
  },
  {
    id: 'cert-creo-002',
    name: 'CREO Advanced Certificate',
    recipient: 'Jane Smith',
    issueDate: '2024-02-20',
    issuer: 'CREO Institute',
    verificationCode: 'CREO-2024-002',
    description: 'Advanced certificate in CREO methodologies and practices'
  }
];

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function generateQRCode(certificate) {
  try {
    console.log(`\n🔍 Generating QR code for: ${certificate.name}`);
    
    // Create verification URL
    const verificationUrl = `${baseUrl}/certificate-verification?code=${certificate.verificationCode}`;
    
    // Generate QR code as PNG
    const qrCodeDataURL = await QRCode.toDataURL(verificationUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });

    // Convert data URL to buffer
    const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Save QR code image
    const qrFileName = `qr-${certificate.verificationCode}.png`;
    const qrPath = path.join(__dirname, '..', 'public', 'qr-codes', qrFileName);
    
    // Ensure directory exists
    const qrDir = path.dirname(qrPath);
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    fs.writeFileSync(qrPath, buffer);
    console.log(`✅ QR code saved: ${qrPath}`);

    // Generate QR code as SVG
    const qrCodeSVG = await QRCode.toString(verificationUrl, {
      type: 'svg',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });

    const svgFileName = `qr-${certificate.verificationCode}.svg`;
    const svgPath = path.join(__dirname, '..', 'public', 'qr-codes', svgFileName);
    fs.writeFileSync(svgPath, qrCodeSVG);
    console.log(`✅ QR code SVG saved: ${svgPath}`);

    // Generate detailed QR data
    const qrData = {
      verificationCode: certificate.verificationCode,
      certificateId: certificate.id,
      recipient: certificate.recipient,
      issueDate: certificate.issueDate,
      issuer: certificate.issuer,
      verificationUrl: verificationUrl,
      generatedAt: new Date().toISOString()
    };

    const dataFileName = `qr-data-${certificate.verificationCode}.json`;
    const dataPath = path.join(__dirname, '..', 'public', 'qr-codes', dataFileName);
    fs.writeFileSync(dataPath, JSON.stringify(qrData, null, 2));
    console.log(`✅ QR data saved: ${dataPath}`);

    return {
      pngPath: qrPath,
      svgPath: svgPath,
      dataPath: dataPath,
      verificationUrl: verificationUrl
    };

  } catch (error) {
    console.error(`❌ Error generating QR code for ${certificate.name}:`, error);
    return null;
  }
}

async function generateAllQRCodes() {
  console.log('🚀 Starting QR code generation for certificates...\n');
  console.log(`Base URL: ${baseUrl}\n`);

  const results = [];

  for (const certificate of certificates) {
    const result = await generateQRCode(certificate);
    if (result) {
      results.push({
        certificate: certificate,
        ...result
      });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Generation Summary:');
  console.log(`✅ Successfully generated: ${results.length}/${certificates.length} QR codes`);
  
  if (results.length > 0) {
    console.log('\n📋 Generated Files:');
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.certificate.name} (${result.certificate.verificationCode})`);
      console.log(`   PNG: ${result.pngPath}`);
      console.log(`   SVG: ${result.svgPath}`);
      console.log(`   Data: ${result.dataPath}`);
      console.log(`   URL: ${result.verificationUrl}`);
    });

    console.log('\n💡 Next Steps:');
    console.log('1. Add the QR code images to your PDF certificates');
    console.log('2. Test the verification URLs in your browser');
    console.log('3. Share the verification URLs with certificate recipients');
    console.log('\n🔗 Test URLs:');
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.verificationUrl}`);
    });
  }

  console.log('\n🎉 QR code generation complete!');
}

// Run the script
generateAllQRCodes().catch(console.error);
