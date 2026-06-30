import * as QRCode from 'qrcode';

/**
 * Generates a base64 encoded PNG Data URL for a given text payload
 */
export const generateQRCodeDataURL = async (text: string): Promise<string> => {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 250,
    });
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate QR Code:', error);
    throw new Error('QR Code generation failed');
  }
};
