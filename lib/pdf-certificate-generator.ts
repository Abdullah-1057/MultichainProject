import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

export interface CertificateData {
  id: string;
  recipientName: string;
  courseName: string;
  issueDate: string;
  issuer: string;
  verificationCode: string;
  referralCode: string;
  certificateNumber: string;
  description: string;
  price: number;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  template: string;
  width: number;
  height: number;
  qrPosition: { x: number; y: number };
  textPositions: {
    recipientName: { x: number; y: number };
    courseName: { x: number; y: number };
    issueDate: { x: number; y: number };
    certificateNumber: { x: number; y: number };
    referralCode: { x: number; y: number };
  };
}

class PDFCertificateGenerator {
  private certificateCount: number = 0;
  private maxCertificates: number = 1000;
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate a unique referral code (last 4 digits/letters)
   */
  generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate verification code with referral code as last 4 digits
   */
  generateVerificationCode(referralCode: string): string {
    const timestamp = Date.now().toString().slice(-6);
    return `CREO-${timestamp}-${referralCode}`;
  }

  /**
   * Check if we can generate more certificates
   */
  canGenerateCertificate(): boolean {
    return this.certificateCount < this.maxCertificates;
  }

  /**
   * Get remaining certificate count
   */
  getRemainingCount(): number {
    return this.maxCertificates - this.certificateCount;
  }

  /**
   * Generate QR code data with referral code
   */
  async generateQRCodeData(certificate: CertificateData): Promise<string> {
    const qrData = {
      verificationCode: certificate.verificationCode,
      certificateId: certificate.id,
      recipient: certificate.recipientName,
      course: certificate.courseName,
      issueDate: certificate.issueDate,
      issuer: certificate.issuer,
      referralCode: certificate.referralCode,
      verificationUrl: `${this.baseUrl}/certificate-verification?code=${certificate.verificationCode}`,
      generatedAt: new Date().toISOString()
    };

    return JSON.stringify(qrData);
  }

  /**
   * Generate QR code as data URL
   */
  async generateQRCodeImage(certificate: CertificateData): Promise<string> {
    const qrData = await this.generateQRCodeData(certificate);
    return await QRCode.toDataURL(qrData, {
      width: 150,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
  }

  /**
   * Create certificate data
   */
  createCertificateData(data: Partial<CertificateData>): CertificateData {
    if (!this.canGenerateCertificate()) {
      throw new Error(`Maximum certificate limit reached (${this.maxCertificates})`);
    }

    const referralCode = this.generateReferralCode();
    const verificationCode = this.generateVerificationCode(referralCode);
    const certificateNumber = `CERT-${String(this.certificateCount + 1).padStart(4, '0')}`;

    return {
      id: uuidv4(),
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

  /**
   * Generate PDF certificate
   */
  async generatePDFCertificate(certificate: CertificateData): Promise<Buffer> {
    if (!this.canGenerateCertificate()) {
      throw new Error(`Maximum certificate limit reached (${this.maxCertificates})`);
    }

    // Create new PDF document
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Set up fonts and colors
    pdf.setFont('helvetica');
    pdf.setTextColor(0, 0, 0);

    // Background gradient effect
    pdf.setFillColor(240, 248, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Border
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(2);
    pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Inner border
    pdf.setLineWidth(1);
    pdf.setDrawColor(100, 100, 100);
    pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);

    // Header
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 139); // Dark blue
    pdf.text('CERTIFICATE OF COMPLETION', pageWidth / 2, 40, { align: 'center' });

    // Decorative line
    pdf.setDrawColor(0, 0, 139);
    pdf.setLineWidth(2);
    pdf.line(50, 50, pageWidth - 50, 50);

    // This is to certify that
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text('This is to certify that', pageWidth / 2, 70, { align: 'center' });

    // Recipient name
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 139);
    pdf.text(certificate.recipientName, pageWidth / 2, 90, { align: 'center' });

    // Has successfully completed
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text('has successfully completed', pageWidth / 2, 110, { align: 'center' });

    // Course name
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 139);
    pdf.text(certificate.courseName, pageWidth / 2, 130, { align: 'center' });

    // Date
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Issued on: ${new Date(certificate.issueDate).toLocaleDateString()}`, pageWidth / 2, 150, { align: 'center' });

    // Certificate number
    pdf.setFontSize(12);
    pdf.text(`Certificate Number: ${certificate.certificateNumber}`, pageWidth / 2, 160, { align: 'center' });

    // Referral code
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 100, 0);
    pdf.text(`Referral Code: ${certificate.referralCode}`, pageWidth / 2, 170, { align: 'center' });

    // Generate and add QR code
    try {
      const qrCodeDataURL = await this.generateQRCodeImage(certificate);
      const qrCodeImg = new Image();
      
      // Convert data URL to base64
      const base64Data = qrCodeDataURL.split(',')[1];
      
      // Add QR code to PDF
      pdf.addImage(base64Data, 'PNG', pageWidth - 60, pageHeight - 60, 40, 40);
      
      // QR code label
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Scan to verify', pageWidth - 40, pageHeight - 20, { align: 'center' });
    } catch (error) {
      console.error('Error adding QR code to PDF:', error);
    }

    // Signature line
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Authorized Signature', pageWidth - 100, pageHeight - 40);
    pdf.line(pageWidth - 100, pageHeight - 35, pageWidth - 50, pageHeight - 35);

    // Issuer
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 139);
    pdf.text(certificate.issuer, pageWidth - 75, pageHeight - 25, { align: 'center' });

    // Footer
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Verification Code: ${certificate.verificationCode}`, 20, pageHeight - 10);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 80, pageHeight - 10);

    // Increment certificate count
    this.certificateCount++;

    // Return PDF as buffer
    return Buffer.from(pdf.output('arraybuffer'));
  }

  /**
   * Save certificate to file
   */
  async saveCertificate(certificate: CertificateData, pdfBuffer: Buffer): Promise<string> {
    const fs = require('fs');
    const path = require('path');

    // Ensure certificates directory exists
    const certificatesDir = path.join(process.cwd(), 'public', 'certificates');
    if (!fs.existsSync(certificatesDir)) {
      fs.mkdirSync(certificatesDir, { recursive: true });
    }

    // Generate filename
    const filename = `certificate-${certificate.verificationCode}.pdf`;
    const filepath = path.join(certificatesDir, filename);

    // Save PDF
    fs.writeFileSync(filepath, pdfBuffer);

    return `/certificates/${filename}`;
  }

  /**
   * Generate complete certificate (PDF + save)
   */
  async generateCompleteCertificate(data: Partial<CertificateData>): Promise<{
    certificate: CertificateData;
    pdfPath: string;
    qrCodeDataURL: string;
  }> {
    const certificate = this.createCertificateData(data);
    const pdfBuffer = await this.generatePDFCertificate(certificate);
    const pdfPath = await this.saveCertificate(certificate, pdfBuffer);
    const qrCodeDataURL = await this.generateQRCodeImage(certificate);

    return {
      certificate,
      pdfPath,
      qrCodeDataURL
    };
  }

  /**
   * Get certificate statistics
   */
  getStats() {
    return {
      generated: this.certificateCount,
      remaining: this.maxCertificates - this.certificateCount,
      maxCertificates: this.maxCertificates,
      canGenerate: this.canGenerateCertificate()
    };
  }
}

export const pdfCertificateGenerator = new PDFCertificateGenerator();
