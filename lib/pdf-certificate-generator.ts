import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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

    // Load template from public folder
    const fs = require('fs');
    const path = require('path');
    const templatePath = path.join(process.cwd(), 'public', 'CREO_Certificate.pdf');
    const templateExists = fs.existsSync(templatePath);

    // Create a PDFDocument from template or blank
    const pdfDoc = templateExists
      ? await PDFDocument.load(fs.readFileSync(templatePath))
      : await PDFDocument.create();

    if (!templateExists) {
      // fallback: blank landscape A4 page
      const page = pdfDoc.addPage([842, 595]);
      page.drawRectangle({ x: 0, y: 0, width: 842, height: 595, color: rgb(0.94, 0.97, 1) });
    }

    const pages = pdfDoc.getPages();
    const page = pages[0];
    const { width, height } = page.getSize();

    // Fonts
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // QR code image
    const qrDataUrl = await this.generateQRCodeImage(certificate);
    const qrBase64 = qrDataUrl.split(',')[1];
    const qrBytes = Buffer.from(qrBase64, 'base64');
    const qrImage = await pdfDoc.embedPng(qrBytes);
    const qrSize = 80; // px

    // Positions tuned to overlay on template (adjust if needed)
    const centerX = width / 2;
    const textColor = rgb(0.0, 0.0, 0.2);

    // Recipient name
    page.drawText(certificate.recipientName, {
      x: centerX - fontBold.widthOfTextAtSize(certificate.recipientName, 28) / 2,
      y: height - 290,
      size: 28,
      font: fontBold,
      color: textColor,
    });

    // Course line
    const course = certificate.courseName;
    page.drawText(course, {
      x: centerX - fontBold.widthOfTextAtSize(course, 20) / 2,
      y: height - 330,
      size: 20,
      font: fontBold,
      color: textColor,
    });

    // Issued date
    const dateStr = `Issued on: ${new Date(certificate.issueDate).toLocaleDateString()}`;
    page.drawText(dateStr, {
      x: centerX - fontRegular.widthOfTextAtSize(dateStr, 12) / 2,
      y: height - 360,
      size: 12,
      font: fontRegular,
      color: rgb(0, 0, 0),
    });

    // Certificate number and referral code at bottom
    const certNum = `Certificate #: ${certificate.certificateNumber}`;
    const ref = `Referral: ${certificate.referralCode}`;
    page.drawText(certNum, { x: 40, y: 40, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(ref, { x: 40, y: 28, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

    // Verification code right side
    const ver = `Verification: ${certificate.verificationCode}`;
    const verWidth = fontRegular.widthOfTextAtSize(ver, 10);
    page.drawText(ver, { x: width - verWidth - 40, y: 28, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

    // Draw QR bottom-right
    page.drawImage(qrImage, { x: width - qrSize - 40, y: 40, width: qrSize, height: qrSize });
    const qrLabel = 'Scan to verify';
    const qrLabelWidth = fontRegular.widthOfTextAtSize(qrLabel, 10);
    page.drawText(qrLabel, { x: width - 40 - (qrLabelWidth / 2) - (qrSize / 2) + qrSize / 2, y: 30, size: 10, font: fontRegular, color: rgb(0, 0, 0) });

    // Increment counter
    this.certificateCount++;

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
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
