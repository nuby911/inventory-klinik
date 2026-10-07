/**
 * GS1 DataMatrix & BPOM RI Barcode Parser
 * Mendukung pembacaan 2D Barcode Standar BPOM RI (GS1 DataMatrix),
 * QR Code Cek BPOM, dan barcode 1D (EAN-13 / GTIN / Code-128).
 */

/**
 * Konversi tanggal format GS1 YYMMDD ke format ISO YYYY-MM-DD.
 * Jika DD bernilai '00', secara otomatis mengambil hari terakhir di bulan tersebut.
 * @param {string} yymmdd - 6 digit string tanggal
 * @returns {string|null} - Tanggal format YYYY-MM-DD
 */
export function convertYYMMDDtoISODate(yymmdd) {
  if (!yymmdd || yymmdd.length !== 6 || !/^\d{6}$/.test(yymmdd)) {
    return null;
  }

  const yy = parseInt(yymmdd.substring(0, 2), 10);
  const mm = parseInt(yymmdd.substring(2, 4), 10);
  let dd = parseInt(yymmdd.substring(4, 6), 10);

  // Standar GS1: tahun 51-99 adalah 1951-1999, tahun 00-50 adalah 2000-2050
  const year = yy >= 51 ? 1900 + yy : 2000 + yy;

  if (mm < 1 || mm > 12) return null;

  // Jika DD == 00, standar GS1 menetapkan tanggal kedaluwarsa adalah akhir bulan tersebut
  if (dd === 0) {
    dd = new Date(year, mm, 0).getDate();
  }

  const pad = (n) => String(n).padStart(2, '0');
  return `${year}-${pad(mm)}-${pad(dd)}`;
}

/**
 * Parse data string hasil pemindaian (dari Scanner Gun maupun Kamera).
 * @param {string} rawInput - Teks hasil pembacaan barcode
 * @returns {Object} Hasil parsing terstruktur
 */
export function parseGS1DataMatrix(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') {
    return {
      isValid: false,
      error: 'Data pemindaian kosong',
      raw: rawInput
    };
  }

  const raw = rawInput.trim();
  const result = {
    isValid: false,
    raw,
    type: 'UNKNOWN',
    gtin: null,
    nie: null,
    batchNumber: null,
    expiryDate: null,
    serialNumber: null,
    formattedExpiry: null,
    details: {}
  };

  // 1. Cek apakah ini QR Code BPOM berupa URL (misal: cekbpom.pom.go.id / pione)
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    result.type = 'BPOM_URL';
    try {
      const url = new URL(raw);
      // Cari parameter umum: nie, reg, batch, no_batch, exp
      const searchParams = url.searchParams;
      result.nie = searchParams.get('nie') || searchParams.get('reg') || searchParams.get('k') || null;
      result.batchNumber = searchParams.get('batch') || searchParams.get('lot') || null;
      const expParam = searchParams.get('exp') || searchParams.get('ed');
      if (expParam) {
        if (/^\d{6}$/.test(expParam)) {
          result.expiryDate = convertYYMMDDtoISODate(expParam);
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(expParam)) {
          result.expiryDate = expParam;
        }
      }
      result.isValid = Boolean(result.nie || result.batchNumber);
      return result;
    } catch {
      // lanjut ke parser teks
    }
  }

  // 2. Format GS1 dengan tanda kurung Application Identifier (AI):
  // Contoh: (01)08999999001014(17)270831(10)BCH-PCT-2027(21)SN12345
  if (raw.includes('(01)') || raw.includes('(17)') || raw.includes('(10)')) {
    result.type = 'GS1_DATAMATRIX';

    // Regex ekstraksi AI standar
    const gtinMatch = raw.match(/\(01\)(\d{14})/);
    const expMatch = raw.match(/\(17\)(\d{6})/);
    // AI 10 dan 21 memiliki panjang variabel (hingga tanda kurung berikutnya atau akhir string)
    const batchMatch = raw.match(/\(10\)([^()\r\n]+)/);
    const snMatch = raw.match(/\(21\)([^()\r\n]+)/);
    const nieMatch = raw.match(/\(90\)([^()\r\n]+)/); // kadang NIE dicantumkan di AI 90

    if (gtinMatch) result.gtin = gtinMatch[1];
    if (expMatch) {
      result.expiryDate = convertYYMMDDtoISODate(expMatch[1]);
      result.formattedExpiry = expMatch[1];
    }
    if (batchMatch) result.batchNumber = batchMatch[1].trim();
    if (snMatch) result.serialNumber = snMatch[1].trim();
    if (nieMatch) result.nie = nieMatch[1].trim();

    if (result.gtin || result.batchNumber || result.expiryDate) {
      result.isValid = true;
      return result;
    }
  }

  // 3. Format Raw GS1 DataMatrix dengan FNC1 / ASCII 29 (GS delimiter) atau tanpa pemisah:
  // Contoh: 01089999990010141727083110BCH-PCT-2027
  // Fixed length:
  // AI 01 = 14 digit
  // AI 17 = 6 digit
  // Variable length: AI 10 (batch), AI 21 (serial) - dipisahkan oleh \x1d / \u001d / <GS> atau di akhir string
  const GS = String.fromCharCode(29);
  let cleanRaw = raw.replace(/^\]d2/, '').replace(/^\]C1/, ''); // Buang symbology identifier jika ada (misal ]d2 untuk DataMatrix GS1)

  // Cek apakah diawali AI 01 (14 digit GTIN)
  if (/^01\d{14}/.test(cleanRaw)) {
    result.type = 'GS1_DATAMATRIX_RAW';
    result.gtin = cleanRaw.substring(2, 16);
    let remaining = cleanRaw.substring(16);

    // Iterasi sisa string untuk mengekstrak AI lain
    while (remaining.length > 0) {
      // Buang karakter pembatas GS jika ada di awal
      if (remaining.startsWith(GS) || remaining.startsWith('\x1d')) {
        remaining = remaining.substring(1);
      }

      if (remaining.startsWith('17') && remaining.length >= 8 && /^\d{6}/.test(remaining.substring(2, 8))) {
        // AI 17: Expiry date (fixed 6 digit)
        const expDigits = remaining.substring(2, 8);
        result.expiryDate = convertYYMMDDtoISODate(expDigits);
        result.formattedExpiry = expDigits;
        remaining = remaining.substring(8);
      } else if (remaining.startsWith('10')) {
        // AI 10: Batch number (variable up to 20 chars, diakhiri GS atau akhir string)
        remaining = remaining.substring(2);
        const gsIndex = remaining.indexOf(GS);
        const altGsIndex = remaining.indexOf('\x1d');
        const splitIdx = gsIndex !== -1 ? gsIndex : (altGsIndex !== -1 ? altGsIndex : -1);

        if (splitIdx !== -1) {
          result.batchNumber = remaining.substring(0, splitIdx);
          remaining = remaining.substring(splitIdx + 1);
        } else {
          // Tidak ada GS, cek apakah ada AI 21 atau 17 berikutnya jika format tanpa GS
          const nextAi21 = remaining.indexOf('21');
          const nextAi17 = remaining.indexOf('17');
          let nextIdx = -1;
          if (nextAi21 > 0 && (nextIdx === -1 || nextAi21 < nextIdx)) nextIdx = nextAi21;
          if (nextAi17 > 0 && (nextIdx === -1 || nextAi17 < nextIdx)) nextIdx = nextAi17;

          if (nextIdx !== -1) {
            result.batchNumber = remaining.substring(0, nextIdx);
            remaining = remaining.substring(nextIdx);
          } else {
            result.batchNumber = remaining;
            remaining = '';
          }
        }
      } else if (remaining.startsWith('21')) {
        // AI 21: Serial number (variable)
        remaining = remaining.substring(2);
        const gsIndex = remaining.indexOf(GS);
        if (gsIndex !== -1) {
          result.serialNumber = remaining.substring(0, gsIndex);
          remaining = remaining.substring(gsIndex + 1);
        } else {
          result.serialNumber = remaining;
          remaining = '';
        }
      } else {
        // Sisa tidak dikenal
        break;
      }
    }

    if (result.gtin || result.batchNumber) {
      result.isValid = true;
      return result;
    }
  }

  // 4. Format Teks Terstruktur (misal: "NIE: DBL9504414110A1 BATCH: BCH-01 EXP: 2027-10-15")
  const nieRegex = /(?:NIE|BPOM|REG)[:\s]+([A-Z]{3}\d{8,11}[A-Z]\d{1,2})/i;
  const batchRegex = /(?:BATCH|LOT|NO\.?\s*BATCH)[:\s]+([A-Za-z0-9-]+)/i;
  const expRegex = /(?:EXP|ED|KADALUARSA)[:\s]+(\d{4}[-/.]\d{2}[-/.]\d{2}|\d{6})/i;

  const nieMatch = raw.match(nieRegex);
  const batchMatch = raw.match(batchRegex);
  const expMatch = raw.match(expRegex);

  if (nieMatch || batchMatch || expMatch) {
    result.type = 'STRUCTURED_TEXT';
    if (nieMatch) result.nie = nieMatch[1].toUpperCase();
    if (batchMatch) result.batchNumber = batchMatch[1].toUpperCase();
    if (expMatch) {
      const expVal = expMatch[1];
      if (/^\d{6}$/.test(expVal)) {
        result.expiryDate = convertYYMMDDtoISODate(expVal);
      } else {
        result.expiryDate = expVal.replace(/[/.]/g, '-');
      }
    }
    result.isValid = true;
    return result;
  }

  // 5. Fallback: Barcode 1D Biasa (EAN-13 / GTIN-14 / Code-128)
  // Hanya berupa nomor barcode atau kode obat langsung
  if (/^\d{8,14}$/.test(raw)) {
    result.type = 'STANDARD_1D_BARCODE';
    result.gtin = raw.padStart(14, '0'); // normalisasi ke GTIN 14 digit
    result.barcode1D = raw;
    result.isValid = true;
    return result;
  }

  // 6. Fallback: Kode Obat Internal (misal MED-PCT-500) atau Nomor NIE langsung (misal DBL9504414110A1)
  if (/^[A-Z]{3}\d{8,11}[A-Z]\d{1,2}$/i.test(raw)) {
    result.type = 'BPOM_NIE_DIRECT';
    result.nie = raw.toUpperCase();
    result.isValid = true;
    return result;
  }

  if (/^MED-[A-Z0-9-]+$/i.test(raw)) {
    result.type = 'INTERNAL_CODE';
    result.internalCode = raw.toUpperCase();
    result.isValid = true;
    return result;
  }

  // Tandai apakah barcode ini adalah standar BPOM RI
  result.isBPOM = ['GS1_DATAMATRIX', 'GS1_DATAMATRIX_RAW', 'BPOM_URL', 'BPOM_NIE_DIRECT'].includes(result.type);
  result.expiredDate = result.expiryDate; // alias kompatibilitas

  return result;
}

/**
 * Mencocokkan data hasil scan dengan daftar Master Obat di database
 * @param {Array} medicines - Daftar master obat dari API/database
 * @param {Object} parsed - Objek hasil parseGS1DataMatrix
 * @returns {Object|null} Obat yang cocok atau null
 */
export function matchMedicineFromScan(medicines, parsed) {
  if (!medicines || !Array.isArray(medicines) || !parsed) return null;

  // 1. Pencocokan berdasarkan GTIN / Barcode Kemasan
  if (parsed.gtin) {
    const cleanGtin = parsed.gtin.replace(/^0+/, '');
    const found = medicines.find(m => {
      if (!m.barcode) return false;
      const cleanMBarcode = m.barcode.replace(/^0+/, '');
      return (
        m.barcode === parsed.gtin || 
        cleanMBarcode === cleanGtin || 
        m.barcode.endsWith(cleanGtin) || 
        parsed.gtin.endsWith(cleanMBarcode)
      );
    });
    if (found) return found;
  }

  // 2. Pencocokan berdasarkan Nomor Izin Edar (NIE) BPOM RI
  if (parsed.nie) {
    const cleanNie = parsed.nie.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const found = medicines.find(m => {
      if (!m.bpom_nie) return false;
      const cleanMNie = m.bpom_nie.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      return cleanMNie === cleanNie || cleanMNie.includes(cleanNie) || cleanNie.includes(cleanMNie);
    });
    if (found) return found;
  }

  // 3. Pencocokan berdasarkan Kode Obat Internal (misal MED-PCT-500)
  if (parsed.internalCode) {
    const found = medicines.find(m => m.code.toUpperCase() === parsed.internalCode.toUpperCase());
    if (found) return found;
  }

  // 4. Pencocokan Barcode 1D Langsung
  if (parsed.barcode1D) {
    const found = medicines.find(m => m.barcode === parsed.barcode1D || (m.code && m.code === parsed.barcode1D));
    if (found) return found;
  }

  // 5. Fallback: Cocokkan substring raw jika mengandung kode obat atau barcode terdaftar
  if (parsed.raw) {
    const rawUpper = parsed.raw.toUpperCase();
    const found = medicines.find(m => 
      (m.code && rawUpper.includes(m.code.toUpperCase())) ||
      (m.barcode && rawUpper.includes(m.barcode))
    );
    if (found) return found;
  }

  return null;
}

// Alias export untuk fleksibilitas pemanggilan
export const parseGS1Barcode = parseGS1DataMatrix;

