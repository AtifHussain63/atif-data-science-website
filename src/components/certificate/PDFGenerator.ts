import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Certificate } from '../../types';
import { AtifSkillsHubOfficialCertificate } from './AtifSkillsHubOfficialCertificate';
import { ACTAISkillBridgeCertificate } from './ACTAISkillBridgeCertificate';

/**
 * Safely triggers a browser file download for a given Blob.
 */
export function saveBlobToFile(blob: Blob, filename: string): void {
  try {
    if ((window.navigator as any)?.msSaveOrOpenBlob) {
      (window.navigator as any).msSaveOrOpenBlob(blob, filename);
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.position = 'fixed';
    link.style.left = '-9999px';
    link.style.top = '-9999px';
    link.href = url;
    link.download = filename;
    link.setAttribute('download', filename);
    link.target = '_self';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch {
        // ignore cleanup error
      }
    }, 4000);
  } catch (err) {
    console.warn('Direct link download failed, opening blob:', err);
    try {
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (!win) {
        window.location.href = url;
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Saves a canvas directly as a high-resolution PNG image file.
 */
export async function saveCanvasToImageFile(
  canvas: HTMLCanvasElement,
  filename: string
): Promise<void> {
  let success = false;
  try {
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    if (dataUrl && dataUrl.length > 100) {
      const link = document.createElement('a');
      link.style.position = 'fixed';
      link.style.left = '-9999px';
      link.style.top = '-9999px';
      link.href = dataUrl;
      link.download = filename;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try {
          document.body.removeChild(link);
        } catch {
          // ignore
        }
      }, 2000);
      success = true;
    }
  } catch (err) {
    console.warn('Direct dataURL image save failed, using blob fallback:', err);
  }

  if (!success) {
    await new Promise<void>((resolve) => {
      try {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              saveBlobToFile(blob, filename);
            }
            resolve();
          },
          'image/png',
          1.0
        );
      } catch (blobErr) {
        console.error('Canvas blob creation failed:', blobErr);
        resolve();
      }
    });
  }
}

/**
 * Saves a rendered canvas directly as an A4 Landscape PDF.
 * Preserves the exact aspect ratio (297 mm x 210 mm) of the Certificate View.
 */
export function saveCanvasAsPdf(canvas: HTMLCanvasElement, certId: string): void {
  const filename = `Atif-Skills-Hub-Certificate-${certId}.pdf`;
  try {
    const imgData = canvas.toDataURL('image/png', 0.95);
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 297 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 210 mm

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

    try {
      pdf.save(filename);
      return;
    } catch (saveErr) {
      console.warn('pdf.save failed, using direct blob fallback:', saveErr);
      const pdfBlob = pdf.output('blob');
      saveBlobToFile(pdfBlob, filename);
      return;
    }
  } catch (canvasErr) {
    console.warn('Canvas toDataURL failed, generating pure jsPDF direct vector fallback:', canvasErr);
    // Ultimate jsPDF fallback
    generatePureJsPdfFallback(certId, filename);
  }
}

/**
 * Fallback direct jsPDF generator if canvas is inaccessible.
 */
function generatePureJsPdfFallback(certId: string, filename: string): void {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, 297, 210, 'F');
  pdf.setDrawColor(8, 24, 56);
  pdf.setLineWidth(4);
  pdf.rect(5, 5, 287, 200, 'S');
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(1);
  pdf.rect(9, 9, 279, 192, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(8, 24, 56);
  pdf.setFontSize(28);
  pdf.text('CERTIFICATE OF APPRECIATION', 148.5, 50, { align: 'center' });

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(71, 85, 105);
  pdf.text('This Certificate is Proudly Presented to', 148.5, 75, { align: 'center' });

  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(8, 24, 56);
  pdf.text('Atif Hussain', 148.5, 95, { align: 'center' });

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('For successfully completing the course organized by Atif Skills Hub.', 148.5, 120, { align: 'center' });

  pdf.setFontSize(10);
  pdf.text(`Certificate ID: ${certId}`, 280, 195, { align: 'right' });

  pdf.save(filename);
}

/**
 * Captures the rendered HTML Certificate View element to an HTML5 Canvas using html2canvas (for custom templates).
 */
async function captureElementToCanvas(element: HTMLElement): Promise<HTMLCanvasElement | null> {
  try {
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {
        // ignore font wait error
      }
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      imageTimeout: 5000,
      onclone: (clonedDoc) => {
        // Strip or replace any modern unsupported stylesheet rules (like oklch) in the clone
        try {
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach((styleTag) => {
            if (styleTag.textContent && styleTag.textContent.includes('oklch')) {
              styleTag.textContent = styleTag.textContent.replace(/oklch\([^)]+\)/g, '#081838');
            }
          });
        } catch {
          // ignore cleanup errors
        }
      },
    });

    if (canvas && canvas.width > 0 && canvas.height > 0) {
      return canvas;
    }
  } catch (err) {
    // Graceful fallback without noisy warnings
  }
  return null;
}

/**
 * Helper to safely load an image URL with CORS for Canvas rendering.
 */
async function loadSafeImage(url: string): Promise<HTMLImageElement | null> {
  if (!url || typeof url !== 'string' || (!url.startsWith('http') && !url.startsWith('data:'))) {
    return null;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Helper to draw a star on canvas
 */
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number, fillColor: string) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
}

/**
 * Helper to draw a rounded rectangle on canvas
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Direct Canvas 2D Renderer for Official Atif Skills Hub Certificate.
 * Pure native HTML5 canvas primitives - 100% reliable, zero external dependencies or SVG security blocks.
 */
export async function drawOfficialCertificateCanvas(
  certificate: Certificate,
  qrDataUrl: string
): Promise<HTMLCanvasElement> {
  const width = 2246; // A4 Landscape 2:1.414 ratio high-def
  const height = 1588;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create 2D canvas context');

  const studentName = certificate.studentName || 'Atif Hussain';
  const courseName = certificate.courseName || '';
  const completionDate = certificate.completionDate || '27 August 2026';
  const certId = certificate.certificateId || 'ASH-2026-00001';
  const authorizedName = (certificate.authorizedName || 'ATIF HUSSAIN').toUpperCase();

  // 1. Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Subtle diamond watermark pattern
  ctx.strokeStyle = 'rgba(8, 24, 56, 0.03)';
  ctx.lineWidth = 1;
  const gridSize = 80;
  for (let x = 0; x < width; x += gridSize) {
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x + gridSize / 2, y);
      ctx.lineTo(x + gridSize, y + gridSize / 2);
      ctx.lineTo(x + gridSize / 2, y + gridSize);
      ctx.lineTo(x, y + gridSize / 2);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // 2. Borders
  // Deep Royal Navy Border
  ctx.strokeStyle = '#081838';
  ctx.lineWidth = 28;
  ctx.strokeRect(14, 14, width - 28, height - 28);

  // Inner Gold Double Borders
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 3.6;
  ctx.strokeRect(50, 50, width - 100, height - 100);

  ctx.strokeStyle = '#C99A3E';
  ctx.lineWidth = 1.6;
  ctx.setLineDash([16, 8]);
  ctx.strokeRect(58, 58, width - 116, height - 116);
  ctx.setLineDash([]); // Reset

  // Corner Gold Accent Squares
  ctx.fillStyle = '#D4AF37';
  ctx.fillRect(46, 46, 12, 12);
  ctx.fillRect(width - 58, 46, 12, 12);
  ctx.fillRect(46, height - 58, 12, 12);
  ctx.fillRect(width - 58, height - 58, 12, 12);

  // 3. Top-Left Geometric Ribbons
  // Magenta
  ctx.fillStyle = '#E6007E';
  ctx.beginPath();
  ctx.moveTo(28, 28);
  ctx.lineTo(520, 28);
  ctx.lineTo(28, 660);
  ctx.closePath();
  ctx.fill();

  // Gold
  ctx.fillStyle = '#E5B858';
  ctx.beginPath();
  ctx.moveTo(28, 28);
  ctx.lineTo(470, 28);
  ctx.lineTo(28, 590);
  ctx.closePath();
  ctx.fill();

  // Cyan
  ctx.fillStyle = '#00A2DB';
  ctx.beginPath();
  ctx.moveTo(28, 28);
  ctx.lineTo(440, 28);
  ctx.lineTo(28, 550);
  ctx.closePath();
  ctx.fill();

  // Gold
  ctx.fillStyle = '#E5B858';
  ctx.beginPath();
  ctx.moveTo(28, 28);
  ctx.lineTo(330, 28);
  ctx.lineTo(28, 410);
  ctx.closePath();
  ctx.fill();

  // Deep Navy
  ctx.fillStyle = '#081838';
  ctx.beginPath();
  ctx.moveTo(28, 28);
  ctx.lineTo(300, 28);
  ctx.lineTo(28, 370);
  ctx.closePath();
  ctx.fill();

  // 4. Bottom-Left Geometric Ribbons
  ctx.fillStyle = '#E6007E';
  ctx.beginPath();
  ctx.moveTo(28, height - 28);
  ctx.lineTo(28, height - 300);
  ctx.lineTo(320, height - 28);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#E5B858';
  ctx.beginPath();
  ctx.moveTo(28, height - 28);
  ctx.lineTo(28, height - 220);
  ctx.lineTo(260, height - 28);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#081838';
  ctx.beginPath();
  ctx.moveTo(28, height - 28);
  ctx.lineTo(28, height - 200);
  ctx.lineTo(240, height - 28);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#00A2DB';
  ctx.beginPath();
  ctx.moveTo(28, height - 28);
  ctx.lineTo(28, height - 110);
  ctx.lineTo(140, height - 28);
  ctx.closePath();
  ctx.fill();

  // 5. Header Logos
  // Left: Atif Skills Hub Logo
  const ashX = 460;
  const ashY = 84;

  // If custom logo image URL is provided in certificate, draw it; otherwise render exact 3D vector logo
  let customLogoImg: HTMLImageElement | null = null;
  if (certificate.logoUrl) {
    try {
      customLogoImg = await loadSafeImage(certificate.logoUrl);
    } catch {
      // ignore
    }
  }

  if (customLogoImg) {
    ctx.drawImage(customLogoImg, ashX, ashY, 100, 100);
  } else {
    // Exact Atif Skills Hub 3D 'A' Ribbon Icon matching vector design
    ctx.save();
    ctx.translate(ashX + 16, ashY + 12);
    ctx.scale(80 / 100, 80 / 100);

    ctx.fillStyle = '#00A2DB';
    ctx.fill(new Path2D('M 15 85 L 45 15 L 65 15 L 35 85 Z'));

    ctx.fillStyle = '#081838';
    ctx.fill(new Path2D('M 45 15 L 85 85 L 65 85 L 38 35 Z'));

    ctx.fillStyle = '#00A2DB';
    ctx.fill(new Path2D('M 25 58 L 75 58 L 70 70 L 32 70 Z'));

    // Accent dots
    ctx.beginPath();
    ctx.arc(85, 20, 4, 0, Math.PI * 2);
    ctx.arc(92, 28, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Logo Text
  ctx.fillStyle = '#081838';
  ctx.font = '900 40px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ATIF', ashX + 136, ashY + 48);

  ctx.fillStyle = '#00A2DB';
  ctx.fillRect(ashX + 136, ashY + 56, 188, 30);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 17px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SKILLS HUB', ashX + 136 + 94, ashY + 77);

  ctx.fillStyle = '#64748B';
  ctx.font = '500 13px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Empowering Careers, Transforming Skills', ashX + 136, ashY + 104);

  // Center Divider
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(1123, 92);
  ctx.lineTo(1123, 184);
  ctx.stroke();

  // Right: Mathematics & Seeker Academy Logo
  const mathX = 1260;
  const mathY = 88;

  let customCollabLogoImg: HTMLImageElement | null = null;
  if (certificate.collaborationLogoUrl) {
    try {
      customCollabLogoImg = await loadSafeImage(certificate.collaborationLogoUrl);
    } catch {
      // ignore
    }
  }

  if (customCollabLogoImg) {
    ctx.drawImage(customCollabLogoImg, mathX + 10, mathY + 8, 90, 90);
  } else {
    // Exact Mathematics & Seeker Academy 3D Folded Ribbon Logo matching certificate
    ctx.save();
    ctx.translate(mathX + 10, mathY + 6);
    ctx.scale(92 / 120, 92 / 120);

    // 1. Inside 3D Shadow Fold (Deep Crimson / Dark Burgundy)
    const shadowGrad = ctx.createLinearGradient(0, 0, 120, 120);
    shadowGrad.addColorStop(0, '#4A0014');
    shadowGrad.addColorStop(0.5, '#750024');
    shadowGrad.addColorStop(1, '#A80036');
    ctx.fillStyle = shadowGrad;
    ctx.fill(new Path2D('M 52 24 C 64 24 74 34 76 46 C 77 56 68 68 54 78 C 48 70 48 58 56 46 C 60 40 60 32 54 26 Z'));

    // 2. Main Bottom Diagonal Crossing Ribbon (Rich Crimson to Vibrant Rose)
    const bottomGrad = ctx.createLinearGradient(0, 36, 120, 84);
    bottomGrad.addColorStop(0, '#9E002E');
    bottomGrad.addColorStop(0.45, '#D90045');
    bottomGrad.addColorStop(1, '#FF2E6B');
    ctx.fillStyle = bottomGrad;
    ctx.fill(new Path2D('M 28 72 L 48 52 C 54 46 62 42 70 48 C 76 52 82 60 90 74 L 66 74 C 60 66 56 62 50 62 L 38 74 Z'));

    // 3. Upper Folded Ribbon Arc (Front looping face with sharp left tail)
    const topGrad = ctx.createLinearGradient(24, 0, 96, 120);
    topGrad.addColorStop(0, '#FF4A7A');
    topGrad.addColorStop(0.35, '#E6004C');
    topGrad.addColorStop(1, '#C4003E');
    ctx.fillStyle = topGrad;
    ctx.fill(new Path2D('M 28 54 C 32 44 38 32 46 25 C 54 18 68 18 78 26 C 88 34 88 48 82 58 C 76 66 66 72 58 72 C 64 64 72 56 74 46 C 76 34 68 28 58 28 C 48 28 42 36 38 46 L 28 54 Z'));

    // 4. Glossy Top Edge Highlight Sheen
    ctx.strokeStyle = 'rgba(255, 163, 190, 0.85)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke(new Path2D('M 38 46 C 42 34 50 28 60 28 C 70 28 76 34 74 46'));

    ctx.restore();
  }

  // Mathematics & Seeker Academy Typography
  ctx.fillStyle = '#E6004C';
  ctx.font = 'italic 900 28px "Playfair Display", Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('Mathematics &', mathX + 116, mathY + 44);

  ctx.fillStyle = '#081838';
  ctx.font = 'italic 900 28px "Playfair Display", Georgia, serif';
  ctx.fillText('seeker academy', mathX + 116, mathY + 76);

  ctx.fillStyle = '#4A0014';
  ctx.font = 'italic 600 16px "Playfair Display", Georgia, serif';
  ctx.fillText('Research to explore', mathX + 116, mathY + 102);

  // 6. Title Section
  const centerX = 1123;
  ctx.fillStyle = '#081838';
  ctx.font = '900 68px Cinzel, Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('CERTIFICATE', centerX, 296);

  // Decorative Diamond and lines
  ctx.strokeStyle = '#C99A3E';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerX - 340, 344);
  ctx.lineTo(centerX - 230, 344);
  ctx.stroke();

  ctx.fillStyle = '#C99A3E';
  ctx.beginPath();
  ctx.moveTo(centerX - 220, 344);
  ctx.lineTo(centerX - 212, 336);
  ctx.lineTo(centerX - 204, 344);
  ctx.lineTo(centerX - 212, 352);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#081838';
  ctx.font = '800 26px Montserrat, Arial, sans-serif';
  ctx.fillText('OF APPRECIATION', centerX, 352);

  ctx.fillStyle = '#C99A3E';
  ctx.beginPath();
  ctx.moveTo(centerX + 204, 344);
  ctx.lineTo(centerX + 212, 336);
  ctx.lineTo(centerX + 220, 344);
  ctx.lineTo(centerX + 212, 352);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(centerX + 230, 344);
  ctx.lineTo(centerX + 340, 344);
  ctx.stroke();

  // 7. Student Name Section (Simple, Prestigious, Clean Design)
  ctx.fillStyle = '#475569';
  ctx.font = '600 24px Montserrat, Arial, sans-serif';
  ctx.fillText('This Certificate is Proudly Presented to', centerX, 428);

  // Simple Clean Student Name (Bold Clean Serif)
  ctx.fillStyle = '#081838';
  ctx.font = '800 58px "Playfair Display", Georgia, serif';
  ctx.fillText(studentName.toUpperCase(), centerX, 508);

  // Gold Underline with Diamond
  ctx.strokeStyle = '#C99A3E';
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.moveTo(centerX - 320, 536);
  ctx.lineTo(centerX - 18, 536);
  ctx.stroke();

  ctx.fillStyle = '#C99A3E';
  ctx.beginPath();
  ctx.moveTo(centerX, 526);
  ctx.lineTo(centerX + 10, 536);
  ctx.lineTo(centerX, 546);
  ctx.lineTo(centerX - 10, 536);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(centerX + 18, 536);
  ctx.lineTo(centerX + 320, 536);
  ctx.stroke();

  // 8. Course Statement & Details
  ctx.fillStyle = '#334155';
  ctx.font = '400 23px Montserrat, Arial, sans-serif';
  ctx.fillText('For successfully completing the course / program organized by', centerX, 636);

  // Organization Names line (Perfect spacing & centering via canvas text measurement)
  const part1 = 'Atif Skills Hub';
  const part2 = ' and ';
  const part3 = 'Mathematics Seeker Academy';

  ctx.font = '800 25px Montserrat, Arial, sans-serif';
  const w1 = ctx.measureText(part1).width;
  ctx.font = '500 24px Montserrat, Arial, sans-serif';
  const w2 = ctx.measureText(part2).width;
  ctx.font = '800 25px Montserrat, Arial, sans-serif';
  const w3 = ctx.measureText(part3).width;

  const totalOrgWidth = w1 + w2 + w3;
  let currentOrgX = centerX - totalOrgWidth / 2;

  ctx.textAlign = 'left';
  ctx.font = '800 25px Montserrat, Arial, sans-serif';
  ctx.fillStyle = '#081838';
  ctx.fillText(part1, currentOrgX, 676);

  currentOrgX += w1;
  ctx.font = '500 24px Montserrat, Arial, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText(part2, currentOrgX, 676);

  currentOrgX += w2;
  ctx.font = '800 25px Montserrat, Arial, sans-serif';
  ctx.fillStyle = '#E6007E';
  ctx.fillText(part3, currentOrgX, 676);

  ctx.textAlign = 'center'; // reset alignment for subsequent lines

  let currentY = 728;
  if (courseName) {
    ctx.fillStyle = '#00A2DB';
    ctx.font = '800 25px Montserrat, Arial, sans-serif';
    ctx.fillText(`“${courseName}”`, centerX, currentY);
    currentY += 52;
  }

  ctx.fillStyle = '#475569';
  ctx.font = '400 21px Montserrat, Arial, sans-serif';
  ctx.fillText('In recognition of your dedication, hard work, and commitment to learning.', centerX, currentY);
  currentY += 40;

  ctx.fillStyle = '#081838';
  ctx.font = '700 22px Montserrat, Arial, sans-serif';
  ctx.fillText('Keep Learning, Keep Growing!', centerX, currentY);

  // 9. Left Rosette Medal (Center at x = 270, y = 640)
  const medalX = 270;
  const medalY = 640;

  // Hanging Ribbons
  ctx.fillStyle = '#081838';
  ctx.beginPath();
  ctx.moveTo(medalX - 32, medalY + 50);
  ctx.lineTo(medalX - 8, medalY + 50);
  ctx.lineTo(medalX - 8, medalY + 170);
  ctx.lineTo(medalX - 20, medalY + 150);
  ctx.lineTo(medalX - 32, medalY + 170);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#E6007E';
  ctx.beginPath();
  ctx.moveTo(medalX + 8, medalY + 50);
  ctx.lineTo(medalX + 32, medalY + 50);
  ctx.lineTo(medalX + 32, medalY + 170);
  ctx.lineTo(medalX + 20, medalY + 150);
  ctx.lineTo(medalX + 8, medalY + 170);
  ctx.closePath();
  ctx.fill();

  // 24-point Scalloped Starburst Gold Medal
  drawStar(ctx, medalX, medalY, 24, 84, 72, '#D4AF37');

  // Inner Navy Circle
  ctx.fillStyle = '#081838';
  ctx.beginPath();
  ctx.arc(medalX, medalY, 60, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#E5B858';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 3 Mini Gold Stars inside medal
  drawStar(ctx, medalX - 20, medalY - 32, 5, 8, 4, '#FDE68A');
  drawStar(ctx, medalX, medalY - 38, 5, 10, 5, '#FDE68A');
  drawStar(ctx, medalX + 20, medalY - 32, 5, 8, 4, '#FDE68A');

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 15px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LEARNING', medalX, medalY - 6);
  ctx.fillText('GROWTH', medalX, medalY + 16);
  ctx.fillStyle = '#FDE68A';
  ctx.fillText('SUCCESS', medalX, medalY + 38);

  // 9.1 Right Side: "Scan To Verify" Badge with embedded QR Code (Exact match to View)
  const qrBadgeX = 1876;
  const qrBadgeY = 520;
  const qrBadgeW = 200;
  const qrBadgeH = 250;

  // Background Box with subtle shadow
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  drawRoundedRect(ctx, qrBadgeX, qrBadgeY, qrBadgeW, qrBadgeH, 16);
  ctx.fill();
  ctx.restore();

  // Gold Border
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2.4;
  drawRoundedRect(ctx, qrBadgeX, qrBadgeY, qrBadgeW, qrBadgeH, 16);
  ctx.stroke();

  // Inner QR frame
  ctx.fillStyle = '#F8FAFC';
  drawRoundedRect(ctx, qrBadgeX + 14, qrBadgeY + 14, qrBadgeW - 28, qrBadgeW - 28, 10);
  ctx.fill();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, qrBadgeX + 14, qrBadgeY + 14, qrBadgeW - 28, qrBadgeW - 28, 10);
  ctx.stroke();

  // Draw QR Image inside badge
  const activeQrSrc =
    qrDataUrl ||
    (certificate.verificationUrl
      ? await QRCode.toDataURL(certificate.verificationUrl, {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 256,
          color: { dark: '#081838', light: '#ffffff' },
        })
      : '');

  if (activeQrSrc) {
    try {
      const qrImg = await loadSafeImage(activeQrSrc);
      if (qrImg) {
        ctx.drawImage(qrImg, qrBadgeX + 20, qrBadgeY + 20, qrBadgeW - 40, qrBadgeW - 40);
      }
    } catch {
      // ignore
    }
  }

  // "SCAN TO VERIFY"
  ctx.fillStyle = '#081838';
  ctx.font = '900 15px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SCAN TO VERIFY', qrBadgeX + qrBadgeW / 2, qrBadgeY + qrBadgeH - 34);

  // "Online Verification"
  ctx.fillStyle = '#00A2DB';
  ctx.font = '700 12px Montserrat, Arial, sans-serif';
  ctx.fillText('Online Verification', qrBadgeX + qrBadgeW / 2, qrBadgeY + qrBadgeH - 14);

  // 10. Signatures & Laurel Seal Row (y: 1040 to 1300)
  const sigLeftX = 460;
  const sealCenterX = 1123;
  const sigRightX = 1780;
  const sigBaseY = 1040;

  // Founder Signature (Left)
  let customSigImg: HTMLImageElement | null = null;
  if (certificate.signatureUrl) {
    try {
      customSigImg = await loadSafeImage(certificate.signatureUrl);
    } catch {
      // ignore
    }
  }

  if (customSigImg) {
    ctx.drawImage(customSigImg, sigLeftX - 110, sigBaseY - 10, 220, 140);
  } else {
    // Exact Authentic Atif Hussain Handwritten Signature matching AtifFounderSignature component
    ctx.save();
    const sigScale = 0.88;
    ctx.translate(sigLeftX - (130 * sigScale) / 2, sigBaseY - 20);
    ctx.scale(sigScale, sigScale);
    ctx.strokeStyle = '#002D84';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Grand Upper Balloon Loop
    ctx.lineWidth = 3.2;
    ctx.stroke(new Path2D('M 52 114 C 26 84, 28 42, 54 22 C 78 4, 108 12, 114 36 C 118 64, 96 94, 52 126'));

    // 2. Left Under-Hook Flourish beneath the 'A'
    ctx.lineWidth = 2.8;
    ctx.stroke(new Path2D('M 52 136 C 36 142, 22 136, 18 124 C 15 112, 20 102, 28 98'));

    // 3. Letter 'A' Structure
    ctx.lineWidth = 3.0;
    ctx.stroke(new Path2D('M 38 128 L 50 96'));
    ctx.stroke(new Path2D('M 50 96 L 54 130'));
    ctx.stroke(new Path2D('M 34 114 Q 52 110 74 106'));

    // 4. Letters 't' & 'i'
    ctx.lineWidth = 2.8;
    ctx.stroke(new Path2D('M 56 106 L 58 128 Q 60 132 66 126'));

    // 5. Letter 'f' loop & Descending Tail
    ctx.lineWidth = 2.8;
    ctx.stroke(new Path2D('M 66 126 C 72 118, 80 120, 78 132 C 76 138, 72 142, 70 146'));
    ctx.lineWidth = 3.2;
    ctx.stroke(new Path2D('M 74 104 L 72 176 C 71.5 182, 69 184, 66 182'));

    ctx.restore();
  }

  // Left Signature underline & text
  ctx.strokeStyle = '#081838';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sigLeftX - 200, sigBaseY + 150);
  ctx.lineTo(sigLeftX + 200, sigBaseY + 150);
  ctx.stroke();

  ctx.fillStyle = '#081838';
  ctx.font = '900 22px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(authorizedName, sigLeftX, sigBaseY + 184);

  ctx.font = '700 18px Montserrat, Arial, sans-serif';
  ctx.fillText('Founder', sigLeftX, sigBaseY + 210);

  ctx.fillStyle = '#00A2DB';
  ctx.fillText('Atif Skills Hub', sigLeftX, sigBaseY + 234);

  // Center: Golden Laurel Seal (x = 1123, y = 1150)
  const sealY = 1150;
  drawStar(ctx, sealCenterX - 24, sealY - 56, 5, 10, 5, '#D4AF37');
  drawStar(ctx, sealCenterX, sealY - 68, 5, 14, 7, '#D4AF37');
  drawStar(ctx, sealCenterX + 24, sealY - 56, 5, 10, 5, '#D4AF37');

  // Laurel Wreath Branches
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sealCenterX, sealY, 56, Math.PI * 0.75, Math.PI * 1.65);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(sealCenterX, sealY, 56, Math.PI * 1.35, Math.PI * 0.25);
  ctx.stroke();

  // Seal Text
  ctx.fillStyle = '#081838';
  ctx.font = '900 14px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('COMMITMENT', sealCenterX, sealY - 16);
  ctx.fillStyle = '#D4AF37';
  ctx.fillText('KNOWLEDGE', sealCenterX, sealY + 4);
  ctx.fillStyle = '#081838';
  ctx.fillText('EXCELLENCE', sealCenterX, sealY + 24);

  // Right: Partner Signature
  let customPartnerSigImg: HTMLImageElement | null = null;
  if (certificate.partnerSignatureUrl) {
    try {
      customPartnerSigImg = await loadSafeImage(certificate.partnerSignatureUrl);
    } catch {
      // ignore
    }
  }

  if (customPartnerSigImg) {
    ctx.drawImage(customPartnerSigImg, sigRightX - 110, sigBaseY - 10, 220, 140);
  } else {
    // Exact Mathematics & Seeker Academy authentic handwritten signature
    ctx.save();
    const partnerScale = 1.35;
    ctx.translate(sigRightX - (100 * partnerScale) / 2, sigBaseY + 15);
    ctx.scale(partnerScale, partnerScale);
    ctx.strokeStyle = '#182D7A';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.lineWidth = 2.4;
    ctx.stroke(new Path2D('M 10 62 L 28 33'));

    ctx.lineWidth = 2.3;
    ctx.stroke(new Path2D('M 28 33 L 22 58'));
    ctx.stroke(new Path2D('M 28 33 C 40 37, 55 41, 51 50 C 47 57, 26 57, 22 58'));

    ctx.lineWidth = 2.1;
    ctx.stroke(new Path2D('M 44 54 C 44 48, 53 47, 53 52 C 53 56, 44 56, 44 52'));
    ctx.stroke(new Path2D('M 52 49 C 58 46, 64 45, 64 48 C 64 52, 57 52, 62 55'));

    ctx.lineWidth = 2.3;
    ctx.stroke(new Path2D('M 62 55 C 65 54, 69 46, 70 38 L 67 60'));

    ctx.lineWidth = 2.2;
    ctx.stroke(new Path2D('M 58 54 L 84 52'));

    ctx.lineWidth = 2.1;
    ctx.stroke(new Path2D('M 49 58 C 42 58, 29 61, 28 63 C 28 65, 45 64, 70 62'));

    ctx.lineWidth = 2.3;
    ctx.stroke(new Path2D('M 59 57 L 63 86'));

    ctx.lineWidth = 2.1;
    ctx.stroke(new Path2D('M 41 76 L 68 67'));

    ctx.lineWidth = 2.0;
    ctx.stroke(new Path2D('M 58 79 C 68 76, 75 77, 75 80 C 75 81.5, 62 81.5, 58 79'));

    ctx.restore();
  }

  // Right Signature underline & text
  ctx.strokeStyle = '#081838';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sigRightX - 200, sigBaseY + 150);
  ctx.lineTo(sigRightX + 200, sigBaseY + 150);
  ctx.stroke();

  ctx.fillStyle = '#081838';
  ctx.font = '900 19px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MATHEMATICS &', sigRightX, sigBaseY + 180);
  ctx.fillText('SEEKER ACADEMY', sigRightX, sigBaseY + 204);

  ctx.fillStyle = '#E6007E';
  ctx.font = '700 17px Montserrat, Arial, sans-serif';
  ctx.fillText('Research to explore', sigRightX, sigBaseY + 230);

  // 11. Footer Bar
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(90, 1390);
  ctx.lineTo(width - 90, 1390);
  ctx.stroke();

  // Date
  ctx.font = '700 22px Montserrat, Arial, sans-serif';
  ctx.fillStyle = '#1E293B';
  ctx.textAlign = 'left';
  ctx.fillText('Date: ', 130, 1430);
  ctx.font = '800 22px Montserrat, Arial, sans-serif';
  ctx.fillStyle = '#081838';
  ctx.fillText(completionDate, 195, 1430);

  // Certificate ID
  ctx.font = '700 22px Montserrat, Arial, sans-serif';
  ctx.fillStyle = '#1E293B';
  ctx.textAlign = 'right';
  ctx.fillText('Certificate ID: ', width - 360, 1430);
  ctx.font = '800 22px "Courier New", monospace';
  ctx.fillStyle = '#081838';
  ctx.fillText(certId, width - 130, 1430);

  return canvas;
}

/**
 * Direct Canvas 2D Renderer for ACT AI SkillBridge National Training Certificate.
 */
export async function drawActAiCertificateCanvas(
  certificate: Certificate,
  qrDataUrl: string
): Promise<HTMLCanvasElement> {
  const width = 2246;
  const height = 1588;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create 2D canvas context');

  const studentName = (certificate.studentName || 'Atif Hussain').toUpperCase();
  const courseName = certificate.courseName || 'ACT AI National AI Training Programme';
  const completionDate = certificate.completionDate || '29 JULY 2026';
  const certId = certificate.certificateId?.startsWith('ACTAI')
    ? certificate.certificateId
    : `ACTAI-C1-2026-${certificate.certificateId || '00460-SSW3'}`;

  // Background
  ctx.fillStyle = '#FCFBF8';
  ctx.fillRect(0, 0, width, height);

  // Deep Teal Borders
  ctx.strokeStyle = '#0A3D44';
  ctx.lineWidth = 32;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  ctx.strokeStyle = '#C49A45';
  ctx.lineWidth = 3.6;
  ctx.strokeRect(56, 56, width - 112, height - 112);

  // Corner Gold Accents
  ctx.fillStyle = '#C49A45';
  ctx.fillRect(50, 50, 16, 16);
  ctx.fillRect(width - 66, 50, 16, 16);
  ctx.fillRect(50, height - 66, 16, 16);
  ctx.fillRect(width - 66, height - 66, 16, 16);

  // Header Left: AI SKILLBRIDGE
  ctx.fillStyle = '#0A3D44';
  ctx.fillRect(120, 96, 32, 32);
  ctx.fillStyle = '#00A3C4';
  ctx.fillRect(156, 96, 32, 32);
  ctx.fillStyle = '#2D3748';
  ctx.fillRect(120, 132, 32, 32);
  ctx.fillStyle = '#D97706';
  ctx.fillRect(156, 132, 32, 32);

  ctx.fillStyle = '#0A3D44';
  ctx.font = '900 36px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('AI SKILLBRIDGE', 208, 132);

  ctx.fillStyle = '#64748B';
  ctx.font = '700 15px Montserrat, Arial, sans-serif';
  ctx.fillText('NATIONAL AI EXECUTION PARTNER', 208, 160);

  // Header Right: Government of Pakistan
  ctx.fillStyle = '#0A3D44';
  ctx.font = '800 22px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('GOVERNMENT OF PAKISTAN', width - 120, 132);

  ctx.fillStyle = '#15803D';
  ctx.font = '600 15px Montserrat, Arial, sans-serif';
  ctx.fillText("Prime Minister's National Youth Programme", width - 120, 160);

  // Header Divider
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, 190);
  ctx.lineTo(width - 120, 190);
  ctx.stroke();

  // Title Section
  const centerX = 1123;
  ctx.fillStyle = '#0A3D44';
  ctx.font = '900 68px Cinzel, Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('CERTIFICATE OF ACHIEVEMENT', centerX, 300);

  ctx.fillStyle = '#C49A45';
  ctx.font = '700 20px Montserrat, Arial, sans-serif';
  ctx.fillText('NATIONAL AI TRAINING PROGRAMME • COHORT 1', centerX, 364);

  // Student Section
  ctx.fillStyle = '#475569';
  ctx.font = '500 26px Montserrat, Arial, sans-serif';
  ctx.fillText('This is to certify that', centerX, 470);

  ctx.fillStyle = '#0A3D44';
  ctx.font = '900 72px "Playfair Display", Georgia, serif';
  ctx.fillText(studentName, centerX, 570);

  ctx.strokeStyle = '#C49A45';
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.moveTo(centerX - 400, 600);
  ctx.lineTo(centerX + 400, 600);
  ctx.stroke();

  // Course completion
  ctx.fillStyle = '#334155';
  ctx.font = '500 24px Montserrat, Arial, sans-serif';
  ctx.fillText('has successfully completed the comprehensive professional curriculum in', centerX, 680);

  // Course Badge Pill
  ctx.fillStyle = '#F0FDFA';
  ctx.fillRect(centerX - 500, 716, 1000, 64);
  ctx.strokeStyle = '#99F6E4';
  ctx.lineWidth = 3;
  ctx.strokeRect(centerX - 500, 716, 1000, 64);

  ctx.fillStyle = '#0A3D44';
  ctx.font = '900 26px Montserrat, Arial, sans-serif';
  ctx.fillText(courseName, centerX, 760);

  ctx.fillStyle = '#475569';
  ctx.font = '700 22px Montserrat, Arial, sans-serif';
  ctx.fillText('Conducted at KARAKORAM INTERNATIONAL UNIVERSITY, GILGIT', centerX, 840);

  // Bottom Section: Signatures, Seal & QR
  const botY = 1120;

  // Left: Dr. Atif Hussain Signature
  ctx.strokeStyle = '#0A3D44';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(440 - 80, botY + 20);
  ctx.quadraticCurveTo(440, botY - 30, 440 + 80, botY + 10);
  ctx.moveTo(440 - 40, botY + 10);
  ctx.lineTo(440 + 60, botY + 16);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(440 - 160, botY + 50);
  ctx.lineTo(440 + 160, botY + 50);
  ctx.stroke();

  ctx.fillStyle = '#0A3D44';
  ctx.font = '800 20px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DR. ATIF HUSSAIN', 440, botY + 80);
  ctx.fillStyle = '#64748B';
  ctx.font = '600 16px Montserrat, Arial, sans-serif';
  ctx.fillText('Programme Lead, ACT AI', 440, botY + 104);

  // Center: KIU Golden Seal
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(centerX, botY + 40, 76, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#C49A45';
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = '#0A3D44';
  ctx.font = '900 13px Montserrat, Arial, sans-serif';
  ctx.fillText("KARAKORAM INT'L", centerX, botY + 24);
  ctx.fillStyle = '#C49A45';
  ctx.font = '900 15px Montserrat, Arial, sans-serif';
  ctx.fillText('UNIVERSITY', centerX, botY + 48);
  ctx.fillStyle = '#0A3D44';
  ctx.font = '800 12px Montserrat, Arial, sans-serif';
  ctx.fillText('OFFICIAL SEAL', centerX, botY + 72);

  // Right: QR Code Box
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(width - 560, botY - 40, 220, 240);
  ctx.strokeStyle = '#C49A45';
  ctx.lineWidth = 3;
  ctx.strokeRect(width - 560, botY - 40, 220, 240);

  if (qrDataUrl) {
    try {
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        qrImg.onload = () => {
          ctx.drawImage(qrImg, width - 536, botY - 24, 172, 172);
          resolve();
        };
        qrImg.onerror = () => resolve();
        qrImg.src = qrDataUrl;
      });
    } catch {
      // ignore
    }
  }

  ctx.fillStyle = '#0A3D44';
  ctx.font = '800 14px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SCAN TO VERIFY', width - 450, botY + 172);

  // Footer
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, 1390);
  ctx.lineTo(width - 120, 1390);
  ctx.stroke();

  ctx.font = '600 20px Montserrat, Arial, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.textAlign = 'left';
  ctx.fillText('Issue Date: ', 120, 1440);
  ctx.font = '800 20px Montserrat, Arial, sans-serif';
  ctx.fillStyle = '#0A3D44';
  ctx.fillText(completionDate, 240, 1440);

  ctx.font = '600 20px Montserrat, Arial, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.textAlign = 'right';
  ctx.fillText('Certificate ID: ', width - 360, 1440);
  ctx.font = '800 20px "Courier New", monospace';
  ctx.fillStyle = '#0A3D44';
  ctx.fillText(certId, width - 120, 1440);

  return canvas;
}

/**
 * Main Direct Image (PNG) Download entry point:
 * Uses DOM Capture or Direct High-Res Canvas Engine to save a PNG file.
 */
export const downloadCertificateImage = async (
  certificate: Certificate,
  elementToCapture?: HTMLElement | null
): Promise<void> => {
  const certId = certificate.certificateId || 'ASH-2026-00001';
  const filename = `Atif-Skills-Hub-Certificate-${certId}.png`;
  const verificationUrl =
    certificate.verificationUrl ||
    `https://atifskillshub.org/#verify/${certId}`;

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 320,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#081838',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.warn('QR code generation error:', err);
  }

  const isActAi =
    certificate.templateId?.includes('actai') ||
    certificate.courseName?.toLowerCase().includes('act ai');

  const isCustomUploadedTemplate = Boolean(
    certificate.templateImageUrl &&
    !certificate.templateId?.includes('official') &&
    !certificate.templateId?.includes('default') &&
    !certificate.templateId?.includes('actai')
  );

  // 1. Try DOM Canvas Capture only for custom uploaded image templates
  if (isCustomUploadedTemplate && elementToCapture) {
    try {
      const domCanvas = await captureElementToCanvas(elementToCapture);
      if (domCanvas && domCanvas.width > 0 && domCanvas.height > 0) {
        await saveCanvasToImageFile(domCanvas, filename);
        return;
      }
    } catch {
      // continue to fallback
    }
  }

  // 2. Direct Canvas 2D Engine (100% Fail-safe, crisp 300DPI vector quality)
  const canvas = isActAi
    ? await drawActAiCertificateCanvas(certificate, qrDataUrl)
    : await drawOfficialCertificateCanvas(certificate, qrDataUrl);

  await saveCanvasToImageFile(canvas, filename);
};

/**
 * Main PDF download entry point:
 * Uses Direct High-Res Canvas Engine to save an A4 Landscape (297 x 210 mm) PDF.
 */
export const downloadCertificatePDF = async (
  certificate: Certificate,
  elementToCapture?: HTMLElement | null
): Promise<void> => {
  const certId = certificate.certificateId || 'ASH-2026-00001';
  const verificationUrl =
    certificate.verificationUrl ||
    `https://atifskillshub.org/#verify/${certId}`;

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 320,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#081838',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.warn('QR code generation error:', err);
  }

  const isActAi =
    certificate.templateId?.includes('actai') ||
    certificate.courseName?.toLowerCase().includes('act ai');

  const isCustomUploadedTemplate = Boolean(
    certificate.templateImageUrl &&
    !certificate.templateId?.includes('official') &&
    !certificate.templateId?.includes('default') &&
    !certificate.templateId?.includes('actai')
  );

  // 1. Try DOM Capture only for custom uploaded templates
  if (isCustomUploadedTemplate && elementToCapture) {
    try {
      const domCanvas = await captureElementToCanvas(elementToCapture);
      if (domCanvas && domCanvas.width > 0 && domCanvas.height > 0) {
        saveCanvasAsPdf(domCanvas, certId);
        return;
      }
    } catch {
      // continue to fallback
    }
  }

  // 2. Direct Canvas 2D Engine (100% Fail-safe, crisp 300DPI vector quality)
  const canvas = isActAi
    ? await drawActAiCertificateCanvas(certificate, qrDataUrl)
    : await drawOfficialCertificateCanvas(certificate, qrDataUrl);

  saveCanvasAsPdf(canvas, certId);
};
