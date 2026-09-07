import express from 'express';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Convert number to French text representation
 * @param {number} num
 * @returns {string}
 */
function numberToFrenchWords(num) {
  const ones = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const scales = ['', 'mille', 'million', 'milliard'];

  if (num === 0) return 'zéro';
  if (num < 0) return 'moins ' + numberToFrenchWords(-num);

  let result = '';
  let scaleIndex = 0;

  while (num > 0) {
    const chunk = num % 1000;
    if (chunk !== 0) {
      let chunkText = '';
      const hundreds = Math.floor(chunk / 100);
      const remainder = chunk % 100;

      if (hundreds > 0) {
        chunkText += ones[hundreds] + ' cent';
        if (hundreds > 1 && remainder === 0) chunkText += 's';
        if (remainder > 0) chunkText += ' ';
      }

      if (remainder >= 10 && remainder < 20) {
        chunkText += teens[remainder - 10];
      } else {
        const ten = Math.floor(remainder / 10);
        const one = remainder % 10;
        if (ten > 0) {
          chunkText += tens[ten];
          if (one > 0) chunkText += '-' + ones[one];
        } else if (one > 0) {
          chunkText += ones[one];
        }
      }

      if (scaleIndex > 0) chunkText += ' ' + scales[scaleIndex];
      result = chunkText + (result ? ' ' + result : '');
    }
    num = Math.floor(num / 1000);
    scaleIndex++;
  }

  return result.trim();
}

/**
 * Generate sequential receipt number
 * Format: RECU-YYYY-XXXXX (e.g., RECU-2024-00001)
 * @returns {Promise<string>}
 */
async function generateReceiptNumber() {
  const year = new Date().getFullYear();
  const allReceipts = await pb.collection('recus_fiscaux').getFullList({
    sort: '-created',
  });

  // Filter receipts from current year
  const currentYearReceipts = allReceipts.filter(r => {
    const receiptYear = new Date(r.created).getFullYear();
    return receiptYear === year;
  });

  const nextNumber = currentYearReceipts.length + 1;
  const paddedNumber = String(nextNumber).padStart(5, '0');
  return `RECU-${year}-${paddedNumber}`;
}

// POST /donations/generate-receipt - Generate PDF receipt for a donation
router.post('/generate-receipt', async (req, res) => {
  const { donationId } = req.body;

  // Input validation
  if (!donationId || typeof donationId !== 'string' || donationId.trim() === '') {
    return res.status(400).json({ error: 'donationId is required and must be a non-empty string' });
  }

  // Fetch donation with member details
  const donation = await pb.collection('donations').getOne(donationId, {
    expand: 'membre_id',
  });

  if (!donation) {
    throw new Error(`Donation not found: ${donationId}`);
  }

  const member = donation.expand?.membre_id;
  if (!member) {
    throw new Error(`Member not found for donation: ${donationId}`);
  }

  // Generate receipt number
  const receiptNumber = await generateReceiptNumber();

  // Create PDF
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 10;

  // Header
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('REÇU FISCAL', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Association info
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Association Name', 10, yPosition);
  yPosition += 5;
  doc.text('SIRET/RNA: [SIRET/RNA Placeholder]', 10, yPosition);
  yPosition += 5;
  doc.text('Address: [Association Address]', 10, yPosition);
  yPosition += 10;

  // Receipt number and date
  doc.setFont(undefined, 'bold');
  doc.text(`Numéro de reçu: ${receiptNumber}`, 10, yPosition);
  yPosition += 5;
  const donationDate = new Date(donation.date_don).toLocaleDateString('fr-FR');
  doc.setFont(undefined, 'normal');
  doc.text(`Date du don: ${donationDate}`, 10, yPosition);
  yPosition += 10;

  // Donor info
  doc.setFont(undefined, 'bold');
  doc.text('Donateur:', 10, yPosition);
  yPosition += 5;
  doc.setFont(undefined, 'normal');
  doc.text(`Nom: ${member.nom || member.name || 'N/A'}`, 10, yPosition);
  yPosition += 4;
  if (member.adresse) {
    doc.text(`Adresse: ${member.adresse}`, 10, yPosition);
    yPosition += 4;
  }
  if (member.email) {
    doc.text(`Email: ${member.email}`, 10, yPosition);
    yPosition += 4;
  }
  yPosition += 5;

  // Donation amount
  doc.setFont(undefined, 'bold');
  doc.text('Montant du don:', 10, yPosition);
  yPosition += 5;
  doc.setFont(undefined, 'normal');
  const amount = donation.montant || 0;
  doc.text(`${amount.toFixed(2)} €`, 10, yPosition);
  yPosition += 4;
  const amountInWords = numberToFrenchWords(Math.floor(amount));
  const centsPart = Math.round((amount % 1) * 100);
  const fullAmountInWords = centsPart > 0 
    ? `${amountInWords} euros et ${centsPart} centimes`
    : `${amountInWords} euros`;
  doc.text(`Montant en lettres: ${fullAmountInWords}`, 10, yPosition);
  yPosition += 10;

  // Legal text
  doc.setFont(undefined, 'bold');
  doc.text('Attestation:', 10, yPosition);
  yPosition += 5;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  const legalText = "L'association certifie que le don ouvre droit à une réduction d'impôt de 66% du montant donné, conformément aux dispositions de l'article 200 du Code général des impôts.";
  const splitText = doc.splitTextToSize(legalText, pageWidth - 20);
  doc.text(splitText, 10, yPosition);
  yPosition += splitText.length * 4 + 5;

  // Tax reduction info
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  const taxReduction = amount * 0.66;
  doc.text(`Réduction d'impôt estimée: ${taxReduction.toFixed(2)} €`, 10, yPosition);
  yPosition += 10;

  // Signature placeholder
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.text('Signature / Tampon:', 10, yPosition);
  yPosition += 15;
  doc.rect(10, yPosition - 10, 50, 15);

  // Footer
  doc.setFontSize(8);
  doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 10, pageHeight - 10);

  // Convert PDF to blob
  const pdfBlob = doc.output('blob');
  const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

  // Upload PDF to PocketBase
  const formData = new FormData();
  formData.append('pdf', new Blob([pdfBuffer], { type: 'application/pdf' }), `${receiptNumber}.pdf`);

  const receiptRecord = await pb.collection('recus_fiscaux').create({
    donation_id: donationId,
    membre_id: member.id,
    numero_recu: receiptNumber,
    montant: amount,
    date_don: donation.date_don,
    status: 'generated',
  });

  // Upload PDF file
  const updatedRecord = await pb.collection('recus_fiscaux').update(receiptRecord.id, formData);

  const pdfUrl = pb.files.getURL(updatedRecord, updatedRecord.pdf);

  logger.info('Receipt generated successfully', {
    receiptId: receiptRecord.id,
    receiptNumber,
    donationId,
    amount,
  });

  res.json({
    success: true,
    receiptId: receiptRecord.id,
    receiptNumber,
    pdfUrl,
  });
});

// POST /donations/send-receipt - Send receipt email to donor
router.post('/send-receipt', async (req, res) => {
  const { receiptId, donorEmail, message } = req.body;

  // Input validation
  if (!receiptId || typeof receiptId !== 'string' || receiptId.trim() === '') {
    return res.status(400).json({ error: 'receiptId is required and must be a non-empty string' });
  }

  if (!donorEmail || typeof donorEmail !== 'string' || donorEmail.trim() === '') {
    return res.status(400).json({ error: 'donorEmail is required and must be a non-empty string' });
  }

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'message is required and must be a non-empty string' });
  }

  // Fetch receipt
  const receipt = await pb.collection('recus_fiscaux').getOne(receiptId);

  if (!receipt) {
    throw new Error(`Receipt not found: ${receiptId}`);
  }

  // Get PDF URL
  const pdfUrl = pb.files.getURL(receipt, receipt.pdf);

  if (!pdfUrl) {
    throw new Error(`PDF not found for receipt: ${receiptId}`);
  }

  // Create email record in PocketBase - the platform's built-in mailer will send it
  const emailRecord = await pb.collection('emails_recus').create({
    recu_id: receiptId,
    destinataire_email: donorEmail,
    sujet: 'Reçu fiscal de votre don',
    corps: message,
    pdf_url: pdfUrl,
    status: 'pending',
    sent_at: new Date().toISOString(),
  });

  logger.info('Receipt email created for sending', {
    emailId: emailRecord.id,
    receiptId,
    donorEmail,
  });

  res.json({
    success: true,
    emailId: emailRecord.id,
    status: 'pending',
    note: 'Email will be sent via PocketBase hook',
  });
});

// POST /donations/annual-summary - Generate annual donation summary (PDF + Excel)
router.post('/annual-summary', async (req, res) => {
  const { memberId, year } = req.body;

  // Input validation
  if (!memberId || typeof memberId !== 'string' || memberId.trim() === '') {
    return res.status(400).json({ error: 'memberId is required and must be a non-empty string' });
  }

  if (!year || typeof year !== 'number' || year < 2000 || year > new Date().getFullYear()) {
    return res.status(400).json({ error: 'year is required and must be a valid year' });
  }

  // Fetch member
  const member = await pb.collection('membres').getOne(memberId);

  if (!member) {
    throw new Error(`Member not found: ${memberId}`);
  }

  // Fetch all donations for member in given year
  const allDonations = await pb.collection('donations').getFullList({
    filter: `membre_id="${memberId}"`,
    sort: 'date_don',
  });

  // Filter donations by year
  const yearDonations = allDonations.filter(d => {
    const donationYear = new Date(d.date_don).getFullYear();
    return donationYear === year;
  });

  if (yearDonations.length === 0) {
    return res.status(400).json({ error: `No donations found for member ${memberId} in year ${year}` });
  }

  // Calculate totals
  const totalAmount = yearDonations.reduce((sum, d) => sum + (d.montant || 0), 0);
  const taxReduction = totalAmount * 0.66;

  // Generate PDF
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 10;

  // Header
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('RÉSUMÉ ANNUEL DES DONS', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Association info
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Association Name', 10, yPosition);
  yPosition += 4;
  doc.text('SIRET/RNA: [SIRET/RNA Placeholder]', 10, yPosition);
  yPosition += 4;
  doc.text('Address: [Association Address]', 10, yPosition);
  yPosition += 10;

  // Donor info
  doc.setFont(undefined, 'bold');
  doc.text('Donateur:', 10, yPosition);
  yPosition += 4;
  doc.setFont(undefined, 'normal');
  doc.text(`Nom: ${member.nom || member.name || 'N/A'}`, 10, yPosition);
  yPosition += 4;
  if (member.adresse) {
    doc.text(`Adresse: ${member.adresse}`, 10, yPosition);
    yPosition += 4;
  }
  if (member.email) {
    doc.text(`Email: ${member.email}`, 10, yPosition);
    yPosition += 4;
  }
  yPosition += 5;

  // Year and summary
  doc.setFont(undefined, 'bold');
  doc.text(`Année: ${year}`, 10, yPosition);
  yPosition += 8;

  // Donations table
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text('Date', 10, yPosition);
  doc.text('Montant', 100, yPosition);
  yPosition += 5;
  doc.setFont(undefined, 'normal');

  for (const donation of yearDonations) {
    const donationDate = new Date(donation.date_don).toLocaleDateString('fr-FR');
    const amount = (donation.montant || 0).toFixed(2);
    doc.text(donationDate, 10, yPosition);
    doc.text(`${amount} €`, 100, yPosition);
    yPosition += 5;

    // Check if we need a new page
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 10;
    }
  }

  yPosition += 5;

  // Totals
  doc.setFont(undefined, 'bold');
  doc.text('TOTAL ANNUEL:', 10, yPosition);
  doc.text(`${totalAmount.toFixed(2)} €`, 100, yPosition);
  yPosition += 8;

  doc.setFont(undefined, 'normal');
  doc.text('Réduction d\'impôt estimée (66%):', 10, yPosition);
  doc.text(`${taxReduction.toFixed(2)} €`, 100, yPosition);
  yPosition += 10;

  // Legal text
  doc.setFontSize(8);
  const legalText = "L'association certifie que les dons ouvrent droit à une réduction d'impôt de 66% du montant donné, conformément aux dispositions de l'article 200 du Code général des impôts.";
  const splitText = doc.splitTextToSize(legalText, pageWidth - 20);
  doc.text(splitText, 10, yPosition);

  // Convert PDF to blob
  const pdfBlob = doc.output('blob');
  const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

  // Create Excel workbook
  const workbook = XLSX.utils.book_new();
  const worksheetData = [
    ['Résumé Annuel des Dons', year],
    [],
    ['Donateur:', member.nom || member.name || 'N/A'],
    ['Email:', member.email || 'N/A'],
    ['Adresse:', member.adresse || 'N/A'],
    [],
    ['Date', 'Montant (€)'],
    ...yearDonations.map(d => [
      new Date(d.date_don).toLocaleDateString('fr-FR'),
      d.montant || 0,
    ]),
    [],
    ['TOTAL ANNUEL', totalAmount],
    ['Réduction d\'impôt (66%)', taxReduction],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dons');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

  // Upload PDF to PocketBase
  const pdfFormData = new FormData();
  pdfFormData.append('pdf', new Blob([pdfBuffer], { type: 'application/pdf' }), `resume-dons-${year}.pdf`);

  const summaryRecord = await pb.collection('resumes_dons_annuels').create({
    membre_id: memberId,
    annee: year,
    montant_total: totalAmount,
    reduction_impot: taxReduction,
    nombre_dons: yearDonations.length,
  });

  // Upload PDF file
  const updatedPdfRecord = await pb.collection('resumes_dons_annuels').update(summaryRecord.id, pdfFormData);
  const pdfUrl = pb.files.getURL(updatedPdfRecord, updatedPdfRecord.pdf);

  // Upload Excel to PocketBase
  const excelFormData = new FormData();
  excelFormData.append('excel', new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `resume-dons-${year}.xlsx`);

  const updatedExcelRecord = await pb.collection('resumes_dons_annuels').update(summaryRecord.id, excelFormData);
  const excelUrl = pb.files.getURL(updatedExcelRecord, updatedExcelRecord.excel);

  logger.info('Annual donation summary generated', {
    summaryId: summaryRecord.id,
    memberId,
    year,
    totalAmount,
    donationCount: yearDonations.length,
  });

  res.json({
    success: true,
    summaryId: summaryRecord.id,
    pdfUrl,
    excelUrl,
    totalAmount,
    taxReduction,
    donationCount: yearDonations.length,
  });
});

export default router;