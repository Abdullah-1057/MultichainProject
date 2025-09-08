#!/usr/bin/env node

/**
 * Script to generate sample certificates for testing
 * This will create PDF certificates with QR codes and referral codes
 */

// Import the PDF certificate generator
// Note: This script should be run with ts-node or compiled first
const path = require('path');
const fs = require('fs');

// For now, we'll create a simple mock implementation
class MockPDFCertificateGenerator {
  constructor() {
    this.certificateCount = 0;
    this.maxCertificates = 1000;
  }

  generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  generateVerificationCode(referralCode) {
    const timestamp = Date.now().toString().slice(-6);
    return `CREO-${timestamp}-${referralCode}`;
  }

  canGenerateCertificate() {
    return this.certificateCount < this.maxCertificates;
  }

  createCertificateData(data) {
    if (!this.canGenerateCertificate()) {
      throw new Error(`Maximum certificate limit reached (${this.maxCertificates})`);
    }

    const referralCode = this.generateReferralCode();
    const verificationCode = this.generateVerificationCode(referralCode);
    const certificateNumber = `CERT-${String(this.certificateCount + 1).padStart(4, '0')}`;

    return {
      id: `cert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      recipientName: data.recipientName || '',
      courseName: data.courseName || 'CREO Professional Development',
      issueDate: data.issueDate || new Date().toISOString().split('T')[0],
      issuer: data.issuer || 'CREO Institute',
      verificationCode,
      referralCode,
      certificateNumber,
      description: data.description || 'Certificate of completion for CREO professional development program',
      price: data.price || 0,
    };
  }

  async generateCompleteCertificate(data) {
    if (!this.canGenerateCertificate()) {
      throw new Error(`Maximum certificate limit reached (${this.maxCertificates})`);
    }

    const certificate = this.createCertificateData(data);
    
    // Create certificates directory
    const certificatesDir = path.join(__dirname, '..', 'public', 'certificates');
    if (!fs.existsSync(certificatesDir)) {
      fs.mkdirSync(certificatesDir, { recursive: true });
    }

    // Generate filename
    const filename = `certificate-${certificate.verificationCode}.pdf`;
    const filepath = path.join(certificatesDir, filename);
    const pdfPath = `/certificates/${filename}`;

    // For now, create a simple text file as placeholder
    // In a real implementation, this would generate a PDF
    const certificateContent = `
CREO INSTITUTE
CERTIFICATE OF COMPLETION

This is to certify that
${certificate.recipientName}

has successfully completed
${certificate.courseName}

Issued on: ${new Date(certificate.issueDate).toLocaleDateString()}
Certificate Number: ${certificate.certificateNumber}
Verification Code: ${certificate.verificationCode}
Referral Code: ${certificate.referralCode}

${certificate.issuer}
${new Date().toLocaleString()}
    `;

    fs.writeFileSync(filepath, certificateContent);

    // Increment certificate count
    this.certificateCount++;

    return {
      certificate,
      pdfPath,
      qrCodeDataURL: `data:image/png;base64,${Buffer.from('QR_CODE_PLACEHOLDER').toString('base64')}`
    };
  }

  getStats() {
    return {
      generated: this.certificateCount,
      remaining: this.maxCertificates - this.certificateCount,
      maxCertificates: this.maxCertificates,
      canGenerate: this.canGenerateCertificate()
    };
  }
}

const pdfCertificateGenerator = new MockPDFCertificateGenerator();

const sampleCertificates = [
  {
    recipientName: 'John Doe',
    courseName: 'CREO Professional Certificate',
    description: 'Certificate of completion for CREO professional development program',
    price: 99.99
  },
  {
    recipientName: 'Jane Smith',
    courseName: 'CREO Expert Certificate',
    description: 'Advanced certificate in CREO methodologies and practices',
    price: 199.99
  },
  {
    recipientName: 'Mike Johnson',
    courseName: 'CREO Basic Certificate',
    description: 'Essential CREO skills and fundamentals',
    price: 49.99
  },
  {
    recipientName: 'Sarah Wilson',
    courseName: 'CREO Professional Certificate',
    description: 'Certificate of completion for CREO professional development program',
    price: 99.99
  },
  {
    recipientName: 'David Brown',
    courseName: 'CREO Expert Certificate',
    description: 'Advanced certificate in CREO methodologies and practices',
    price: 199.99
  }
];

async function generateSampleCertificates() {
  console.log('🚀 Starting sample certificate generation...\n');
  
  const results = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < sampleCertificates.length; i++) {
    const certData = sampleCertificates[i];
    console.log(`\n📄 Generating certificate ${i + 1}/${sampleCertificates.length}: ${certData.recipientName}`);
    
    try {
      const result = await pdfCertificateGenerator.generateCompleteCertificate({
        recipientName: certData.recipientName,
        courseName: certData.courseName,
        description: certData.description,
        price: certData.price,
        issuer: 'CREO Institute',
        issueDate: new Date().toISOString().split('T')[0]
      });

      console.log(`✅ Certificate generated successfully!`);
      console.log(`   Recipient: ${result.certificate.recipientName}`);
      console.log(`   Course: ${result.certificate.courseName}`);
      console.log(`   Verification Code: ${result.certificate.verificationCode}`);
      console.log(`   Referral Code: ${result.certificate.referralCode}`);
      console.log(`   PDF Path: ${result.pdfPath}`);
      console.log(`   Certificate Number: ${result.certificate.certificateNumber}`);

      results.push(result);
      successCount++;

    } catch (error) {
      console.error(`❌ Error generating certificate for ${certData.recipientName}:`, error.message);
      errorCount++;
    }
  }

  // Display statistics
  const stats = pdfCertificateGenerator.getStats();
  console.log('\n' + '='.repeat(60));
  console.log('📊 Generation Summary:');
  console.log(`✅ Successfully generated: ${successCount}/${sampleCertificates.length} certificates`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📈 Total certificates in system: ${stats.generated}`);
  console.log(`📉 Remaining capacity: ${stats.remaining}`);
  console.log(`🔢 Maximum capacity: ${stats.maxCertificates}`);

  if (results.length > 0) {
    console.log('\n📋 Generated Certificates:');
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.certificate.recipientName}`);
      console.log(`   Course: ${result.certificate.courseName}`);
      console.log(`   Verification Code: ${result.certificate.verificationCode}`);
      console.log(`   Referral Code: ${result.certificate.referralCode}`);
      console.log(`   Certificate Number: ${result.certificate.certificateNumber}`);
      console.log(`   PDF: ${result.pdfPath}`);
    });

    console.log('\n🔗 Test Verification URLs:');
    results.forEach((result, index) => {
      const verificationUrl = `http://localhost:3000/certificate-verification?code=${result.certificate.verificationCode}`;
      console.log(`${index + 1}. ${verificationUrl}`);
    });

    console.log('\n💡 Next Steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Visit the certificate verification page');
    console.log('3. Test the verification URLs above');
    console.log('4. Check the generated PDF files in public/certificates/');
    console.log('5. Test the certificate purchase flow');
  }

  console.log('\n🎉 Sample certificate generation complete!');
}

// Run the script
generateSampleCertificates().catch(console.error);
