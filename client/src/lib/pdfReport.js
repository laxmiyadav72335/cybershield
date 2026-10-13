/**
 * PDF report generator (jsPDF + autotable). Pure client-side.
 * buildPdf(result) → jsPDF document; downloadPdf(result) saves it.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { VERDICTS, getScanner } from '../config/scanners.js';

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const NAVY = [5, 8, 22];
const CYAN = hex('#22D3EE');
const MUTED = [100, 116, 139];
const TEXT = [30, 41, 59];

const fmtDate = (iso) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

// The built-in PDF fonts cannot encode the rupee or arrow glyphs. Keep the
// currency explicit and readable in both document text and table cells.
export const pdfText = (value) => String(value ?? '').replaceAll('₹', 'INR ').replaceAll('→', '->');

/** Per-module key/value rows for the "Findings" table. */
function findingsRows(r) {
  const s = r.sources || {};
  const rows = [];
  const avail = (x) => (x?.available ? 'Checked' : 'Unavailable');
  switch (r.scanType) {
    case 'url':
    case 'qr': {
      if (r.qr) rows.push(['QR content', r.qr.raw], ['QR type', r.qr.kind.toUpperCase()]);
      if (s.upi) rows.push(['Pay to', s.upi.payeeAddress], ['Payee name', s.upi.payeeName || '—'], ['Amount', s.upi.amount != null ? `Rs ${s.upi.amount}` : 'Open']);
      if (s.safeBrowsing) rows.push(['Google Safe Browsing', s.safeBrowsing.available ? (s.safeBrowsing.matched ? `FLAGGED: ${s.safeBrowsing.threats.join(', ')}` : 'No match') : 'Unavailable']);
      if (s.virusTotal) rows.push(['VirusTotal', s.virusTotal.stats ? `${s.virusTotal.stats.malicious} malicious, ${s.virusTotal.stats.suspicious} suspicious of ${s.virusTotal.engines.length} engines` : avail(s.virusTotal)]);
      if (s.domainAge) rows.push(['Domain age', s.domainAge.available ? `${s.domainAge.ageDays} days (registered ${fmtDate(s.domainAge.registered)})` : 'Unknown']);
      if (s.heuristics) rows.push(['Heuristics', s.heuristics.flags.map((f) => f.label).join('; ')]);
      break;
    }
    case 'file':
      rows.push(['File name', r.fileName], ['Size', r.sizeLabel || '—'], ['SHA-256', r.sha256]);
      rows.push(['VirusTotal', s.virusTotal?.stats ? `${s.virusTotal.stats.malicious} malicious, ${s.virusTotal.stats.suspicious} suspicious of ${s.virusTotal.engines.length} engines` : avail(s.virusTotal)]);
      if (s.virusTotal?.families?.length) rows.push(['Malware families', s.virusTotal.families.join(', ')]);
      break;
    case 'message':
      rows.push(['Analysis', s.ai?.source === 'gemini' ? 'Gemini AI' : 'Rule-based'], ['Scam type', s.ai?.scamType || '—'], ['AI risk score', `${s.ai?.riskScore ?? '—'}/100`]);
      (s.ai?.redFlags || []).forEach((f, i) => rows.push([`Red flag ${i + 1}`, `"${f.phrase}" - ${f.reason}`]));
      (s.links || []).forEach((l) => rows.push(['Link', `${l.url} - ${l.threatScore}/100 (${l.verdict})`]));
      break;
    case 'ip':
      rows.push(['AbuseIPDB', s.abuseIpdb?.available ? `${s.abuseIpdb.abuseConfidenceScore}% confidence, ${s.abuseIpdb.totalReports} reports` : 'Unavailable']);
      if (s.abuseIpdb?.available) rows.push(['Usage type', s.abuseIpdb.usageType || '—'], ['ISP', s.abuseIpdb.isp || '—']);
      if (s.geo?.available) rows.push(['Location', [s.geo.city, s.geo.region, s.geo.country].filter(Boolean).join(', ')], ['Network', `${s.geo.isp || ''} ${s.geo.asn || ''}`.trim()], ['Proxy / hosting', `${s.geo.isProxy ? 'Proxy' : 'No proxy'}, ${s.geo.isHosting ? 'data centre' : 'not hosting'}`]);
      break;
    case 'password':
      rows.push(['Have I Been Pwned', s.hibp?.available ? `${s.hibp.breachCount} breaches (prefix ${s.hibp.prefix})` : 'Unavailable'], ['Strength', `${s.strength.label} (~${s.strength.entropyBits} bits, ${s.strength.crackTime})`]);
      break;
    default:
      break;
  }
  return rows.map(([k, v]) => [pdfText(k), pdfText(v ?? '—')]);
}

export function buildPdf(result) {
  const docPdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = docPdf.internal.pageSize.getWidth();
  const v = VERDICTS[result.verdict] || VERDICTS.unknown;
  const vc = hex(v.color);
  const scanner = getScanner(result.scanType);

  // Header band
  docPdf.setFillColor(...NAVY);
  docPdf.rect(0, 0, W, 90, 'F');
  docPdf.setTextColor(...CYAN);
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(20);
  docPdf.text('CyberShield', 40, 40);
  docPdf.setTextColor(255, 255, 255);
  docPdf.setFontSize(11);
  docPdf.setFont('helvetica', 'normal');
  docPdf.text('Smart Threat Detection Report', 40, 58);
  docPdf.setFontSize(9);
  docPdf.setTextColor(148, 163, 184);
  docPdf.text(`${scanner?.title || 'Scan'}  |  ${fmtDate(result.scannedAt)}`, 40, 74);

  // Score box
  docPdf.setFillColor(...vc);
  docPdf.roundedRect(W - 160, 20, 120, 50, 6, 6, 'F');
  docPdf.setTextColor(255, 255, 255);
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(result.threatScore == null ? 13 : 22);
  docPdf.text(result.threatScore == null ? 'NOT SCORED' : `${result.threatScore}/100`, W - 100, 44, { align: 'center' });
  docPdf.setFontSize(10);
  docPdf.text(v.label.toUpperCase(), W - 100, 60, { align: 'center' });

  let y = 120;
  docPdf.setTextColor(...MUTED);
  docPdf.setFontSize(9);
  docPdf.text('SCANNED ITEM', 40, y);
  docPdf.setTextColor(...TEXT);
  docPdf.setFont('courier', 'normal');
  docPdf.setFontSize(10);
  const item = docPdf.splitTextToSize(pdfText(result.inputPreview || result.input || ''), W - 80);
  docPdf.text(item, 40, y + 14);
  y += 14 + item.length * 12 + 14;

  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(13);
  docPdf.setTextColor(...vc);
  const summary = docPdf.splitTextToSize(pdfText(result.summary || ''), W - 80);
  docPdf.text(summary, 40, y);
  y += summary.length * 16 + 8;

  docPdf.setFont('helvetica', 'normal');
  docPdf.setFontSize(10);
  docPdf.setTextColor(...TEXT);
  const expl = docPdf.splitTextToSize(pdfText(result.explanation || ''), W - 80);
  docPdf.text(expl, 40, y);
  y += expl.length * 13 + 10;

  if (result.unavailableSources?.length) {
    docPdf.setTextColor(180, 83, 9);
    docPdf.setFontSize(9);
    docPdf.text(pdfText(`Partial result: ${result.unavailableSources.join(', ')} could not be checked.`), 40, y);
    y += 16;
  }

  // Score breakdown
  autoTable(docPdf, {
    startY: y + 6,
    head: [['Why this score?', 'Points']],
    body: result.threatScore == null ? [[result.scanType === 'file' ? (result.sources?.virusTotal?.status === 'queued' ? 'VirusTotal analysis is pending' : 'Detection data was unavailable') : result.isPrivate ? 'Public reputation was not checked' : 'Reputation service was unavailable', '—']] : result.breakdown?.length ? result.breakdown.map((b) => [pdfText(b.label), `+${b.points}`]) : [['No risk signals were triggered', '0']],
    foot: [[result.threatScore == null ? 'Result' : 'Total (capped at 100)', result.threatScore == null ? 'Not scored' : String(result.threatScore)]],
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: CYAN, fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: TEXT, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 5, textColor: TEXT },
    columnStyles: { 1: { halign: 'right', cellWidth: 60 } },
    margin: { left: 40, right: 40 },
  });

  // Findings
  const rows = findingsRows(result);
  if (rows.length) {
    autoTable(docPdf, {
      startY: docPdf.lastAutoTable.finalY + 18,
      head: [['Findings', 'Details']],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: NAVY, textColor: CYAN, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 5, textColor: TEXT, overflow: 'linebreak' },
      columnStyles: { 0: { cellWidth: 130, fontStyle: 'bold' } },
      margin: { left: 40, right: 40 },
    });
  }

  // Footer on every page
  const pages = docPdf.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    docPdf.setPage(i);
    docPdf.setFontSize(8);
    docPdf.setTextColor(...MUTED);
    docPdf.text('Generated by CyberShield - Smart Threat Detection (B.Sc. CS final-year project). Sources: Google Safe Browsing, VirusTotal, AbuseIPDB, RDAP, Have I Been Pwned, Gemini.', 40, docPdf.internal.pageSize.getHeight() - 24, { maxWidth: W - 120 });
    docPdf.text(`${i} / ${pages}`, W - 40, docPdf.internal.pageSize.getHeight() - 24, { align: 'right' });
  }
  return docPdf;
}

export function downloadPdf(result) {
  const name = `cybershield-${result.scanType}-${result.verdict}-${new Date(result.scannedAt).toISOString().slice(0, 10)}.pdf`;
  buildPdf(result).save(name);
}
