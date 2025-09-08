import QRCode from 'qrcode';

export interface CertificateQRData {
  verificationCode: string;
  certificateId: string;
  recipient: string;
  issueDate: string;
  issuer: string;
  verificationUrl: string;
}

export class CertificateQRGenerator {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate QR code data for a certificate
   */
  generateQRData(certificate: {
    id: string;
    verificationCode: string;
    recipient: string;
    issueDate: string;
    issuer: string;
  }): CertificateQRData {
    return {
      verificationCode: certificate.verificationCode,
      certificateId: certificate.id,
      recipient: certificate.recipient,
      issueDate: certificate.issueDate,
      issuer: certificate.issuer,
      verificationUrl: `${this.baseUrl}/certificate-verification?code=${certificate.verificationCode}`,
    };
  }

  /**
   * Generate QR code as data URL
   */
  async generateQRCodeDataURL(certificate: CertificateQRData): Promise<string> {
    try {
      const qrData = JSON.stringify(certificate);
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate QR code as SVG string
   */
  async generateQRCodeSVG(certificate: CertificateQRData): Promise<string> {
    try {
      const qrData = JSON.stringify(certificate);
      const qrCodeSVG = await QRCode.toString(qrData, {
        type: 'svg',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
      return qrCodeSVG;
    } catch (error) {
      console.error('Error generating QR code SVG:', error);
      throw new Error('Failed to generate QR code SVG');
    }
  }

  /**
   * Generate simple verification URL QR code
   */
  async generateVerificationURLQR(verificationCode: string): Promise<string> {
    try {
      const verificationUrl = `${this.baseUrl}/certificate-verification?code=${verificationCode}`;
      const qrCodeDataURL = await QRCode.toDataURL(verificationUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating verification URL QR code:', error);
      throw new Error('Failed to generate verification URL QR code');
    }
  }

  /**
   * Parse QR code data
   */
  parseQRData(qrData: string): CertificateQRData | null {
    try {
      const parsed = JSON.parse(qrData);
      if (parsed.verificationCode && parsed.certificateId) {
        return parsed as CertificateQRData;
      }
      return null;
    } catch (error) {
      console.error('Error parsing QR code data:', error);
      return null;
    }
  }
}

// Export a default instance
export const qrGenerator = new CertificateQRGenerator();
