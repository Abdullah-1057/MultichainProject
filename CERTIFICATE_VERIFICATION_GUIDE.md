# Certificate Verification System

A complete QR code-based certificate verification system that allows users to scan QR codes on certificates and verify their authenticity on your website.

## 🚀 Features

- **QR Code Generation**: Create QR codes for certificates that link to verification pages
- **Certificate Verification**: Scan QR codes or enter verification codes manually
- **Real-time Verification**: Instant verification of certificate authenticity
- **Certificate Display**: Beautiful certificate details display with download options
- **API Integration**: RESTful API for certificate verification
- **Mobile Responsive**: Works perfectly on all devices

## 📁 Generated Files

The system has generated the following files for your CREO certificates:

### QR Code Images
- `public/qr-codes/qr-CREO-2024-001.png` - QR code for CREO Certificate
- `public/qr-codes/qr-CREO-2024-001.svg` - SVG version of QR code
- `public/qr-codes/qr-CREO-2024-002.png` - QR code for CREO Advanced Certificate
- `public/qr-codes/qr-CREO-2024-002.svg` - SVG version of QR code

### QR Code Data
- `public/qr-codes/qr-data-CREO-2024-001.json` - Certificate data for QR code
- `public/qr-codes/qr-data-CREO-2024-002.json` - Certificate data for QR code

## 🔗 Verification URLs

Your certificates can be verified at these URLs:

1. **CREO Certificate**: `http://localhost:3000/certificate-verification?code=CREO-2024-001`
2. **CREO Advanced Certificate**: `http://localhost:3000/certificate-verification?code=CREO-2024-002`

## 📱 How to Use

### For Certificate Recipients

1. **Scan QR Code**: Use your phone's camera to scan the QR code on the certificate
2. **Manual Entry**: Visit the verification page and enter the verification code
3. **View Details**: See all certificate information and verification status
4. **Download**: Download the original certificate PDF

### For Certificate Issuers

1. **Generate QR Codes**: Use the `/generate-qr` page to create new QR codes
2. **Add to Certificates**: Embed QR codes in your PDF certificates
3. **Test Verification**: Use the generated URLs to test verification

## 🛠️ System Components

### Pages

1. **`/certificate-verification`** - Main verification page
   - QR code scanner (placeholder for camera integration)
   - Manual verification form
   - Certificate details display
   - Download functionality

2. **`/generate-qr`** - QR code generation page
   - Certificate form
   - QR code generation
   - Download QR codes
   - Copy verification URLs

### API Endpoints

1. **`/api/certificate/verify`** - Certificate verification API
   - `GET ?code=VERIFICATION_CODE` - Verify by code
   - `POST { verificationCode }` - Verify by JSON

### Utilities

1. **`lib/qr-generator.ts`** - QR code generation utilities
2. **`scripts/generate-certificate-qr.js`** - Batch QR code generation

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install qrcode @types/qrcode
```

### 2. Generate QR Codes

```bash
# Generate QR codes for existing certificates
node scripts/generate-certificate-qr.js

# Or use the web interface
# Visit: http://localhost:3000/generate-qr
```

### 3. Add QR Codes to Certificates

1. Download the generated QR code images from `public/qr-codes/`
2. Add them to your PDF certificates
3. Place them in a visible location (corner or footer)

### 4. Test Verification

1. Visit the verification page: `http://localhost:3000/certificate-verification`
2. Try the sample verification codes:
   - `CREO-2024-001`
   - `CREO-2024-002`

## 📊 Certificate Database

The system currently uses a mock database. To integrate with a real database:

1. Update `app/api/certificate/verify/route.ts`
2. Replace `mockCertificates` with your database queries
3. Add proper error handling and validation

## 🎨 Customization

### Styling
- All components use Tailwind CSS
- Colors and themes can be customized in the component files
- Responsive design works on all screen sizes

### Certificate Data
- Modify `mockCertificates` array to add more certificates
- Update certificate fields as needed
- Add new certificate types and statuses

### QR Code Appearance
- Modify QR code settings in `lib/qr-generator.ts`
- Change colors, size, and error correction level
- Add logos or custom styling

## 🔒 Security Considerations

1. **Verification Codes**: Use secure, unpredictable verification codes
2. **Database Security**: Implement proper database security
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **HTTPS**: Always use HTTPS in production
5. **Input Validation**: Validate all user inputs

## 🚀 Production Deployment

### Environment Variables

```bash
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### Database Integration

1. Set up a real database (PostgreSQL, MongoDB, etc.)
2. Update the API routes to use the database
3. Add proper error handling and logging

### QR Code Storage

1. Store QR codes in a CDN or cloud storage
2. Generate QR codes on-demand for better performance
3. Cache frequently accessed certificates

## 📱 Mobile Integration

### Camera Scanning

To add real camera scanning, install a QR scanner library:

```bash
npm install react-qr-scanner
```

Then update the scanner component in the verification page.

### PWA Support

The system is mobile-responsive and can be easily converted to a PWA for better mobile experience.

## 🧪 Testing

### Test Verification Codes

- `CREO-2024-001` - Valid certificate
- `CREO-2024-002` - Valid certificate
- `INVALID-CODE` - Invalid certificate (for testing error handling)

### Test URLs

1. Main verification: `http://localhost:3000/certificate-verification`
2. Direct verification: `http://localhost:3000/certificate-verification?code=CREO-2024-001`
3. QR generation: `http://localhost:3000/generate-qr`

## 📈 Analytics

Consider adding analytics to track:
- Verification attempts
- Successful verifications
- Popular certificates
- Geographic distribution

## 🔄 Future Enhancements

1. **Blockchain Integration**: Store certificate hashes on blockchain
2. **Digital Signatures**: Add cryptographic signatures
3. **Batch Verification**: Verify multiple certificates at once
4. **Certificate Templates**: Create custom certificate templates
5. **Email Integration**: Send verification links via email
6. **Social Sharing**: Share verified certificates on social media

## 📞 Support

If you need help with the certificate verification system:

1. Check the generated QR codes in `public/qr-codes/`
2. Test the verification URLs
3. Review the API responses
4. Check browser console for errors

The system is fully functional and ready to use for your CREO certificates!
