import React, { useState } from 'react';
import { Printer, Tag } from 'lucide-react';
import { formatDateID } from '../../utils/dateUtils';

export default function EtiketModal({ isOpen, onClose, etiketData }) {
  const [filterType, setFilterType] = useState('all');

  if (!isOpen || !etiketData) return null;

  const handlePrint = () => {
    window.print();
  };

  const filteredItems = etiketData.filter(item => {
    if (filterType === 'white') return !item.isExternal;
    if (filterType === 'blue') return item.isExternal;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-sky-400" />
            <div>
              <h3 className="font-bold text-sm">Cetak Etiket Aturan Pakai</h3>
              <p className="text-[11px] text-slate-300">Standar Permenkes No. 73 (Etiket Putih Obat Dalam & Etiket Biru Obat Luar)</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Filter Bar (Semua / Etiket Putih / Etiket Biru) */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Filter Sediaan:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-full font-semibold transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Semua ({etiketData.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('white')}
              className={`px-2.5 py-1 rounded-full font-semibold transition cursor-pointer ${
                filterType === 'white'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Putih (Dalam)
            </button>
            <button
              type="button"
              onClick={() => setFilterType('blue')}
              className={`px-2.5 py-1 rounded-full font-semibold transition cursor-pointer ${
                filterType === 'blue'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100'
              }`}
            >
              Biru (Luar)
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs bg-slate-100/60">
          <div id="etiket-printable" className="space-y-4">
            {filteredItems.map((item, idx) => {
              const isBlue = item.isExternal;
              return (
                <div 
                  key={idx} 
                  className={`p-3.5 rounded-xl border-2 space-y-2.5 font-sans shadow-xs transition ${
                    isBlue 
                      ? 'bg-sky-50/90 border-sky-400 text-sky-950' 
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  {/* Header Klinik & Tipe Etiket */}
                  <div className={`border-b pb-2 ${isBlue ? 'border-sky-200' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between text-[9px] uppercase font-bold tracking-wider mb-1">
                      <span className={`px-1.5 py-0.5 rounded font-mono ${
                        isBlue ? 'bg-sky-200 text-sky-900' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {isBlue ? 'ETIKET BIRU · OBAT LUAR' : 'ETIKET PUTIH · OBAT DALAM'}
                      </span>
                      {item.isRacikan && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                          RACIKAN
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-center">
                      <img src="/logo-badge.png" alt="Logo" className="w-6 h-6 object-contain shrink-0" />
                      <div>
                        <div className="font-extrabold text-xs uppercase tracking-tight text-slate-900">
                          {item.clinicName || 'KLINIK ELMEDIKA'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">Praktek Dokter & Rumah Sunat Modern</div>
                      </div>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 text-center mt-0.5">SIA: 445/028/SIP-A/2026 · APOTEK RAWAT JALAN</div>
                  </div>

                  {/* Warning khusus obat luar */}
                  {isBlue && (
                    <div className="px-2 py-1 bg-sky-100/90 border border-sky-300 rounded text-center text-[10px] font-extrabold text-sky-900 uppercase tracking-wide">
                      OBAT LUAR — TIDAK BOLEH DITELAN
                    </div>
                  )}

                  {/* Info Pasien & Resep */}
                  <div className="grid grid-cols-2 text-[11px] gap-y-1">
                    <div>No. Resep: <span className="font-mono font-semibold">{item.prescriptionCode}</span></div>
                    <div className="text-right">Tgl: <span className="font-medium">{formatDateID(item.date)}</span></div>
                    <div>Pasien: <span className="font-bold">{item.patientName}</span></div>
                    <div className="text-right">No. RM: <span className="font-mono">{item.medicalRecordNumber}</span></div>
                  </div>

                  {/* Nama Obat & Aturan Pakai (Signa) */}
                  <div className={`p-2.5 rounded-lg border text-center space-y-1 ${
                    isBlue ? 'bg-white/80 border-sky-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                    {item.isRacikan && (
                      <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                        Komposisi: {item.racikanName || 'Puyer Racikan'}
                      </div>
                    )}
                    <div className="font-black text-sm text-slate-900">{item.medicineName}</div>
                    <div className="text-xs font-semibold text-slate-600">{item.quantity}</div>
                    <div className="text-sm font-extrabold text-slate-900 border-t border-slate-200/80 pt-1.5 mt-1 leading-tight">
                      {item.dosageInstruction}
                    </div>
                    {item.notes && (
                      <div className="text-[10px] italic text-slate-500 pt-0.5">
                        {item.notes}
                      </div>
                    )}
                  </div>

                  {/* Footer BPOM batch & pharmacist sign */}
                  <div className={`flex items-center justify-between text-[10px] border-t pt-1.5 ${
                    isBlue ? 'border-sky-200 text-sky-800' : 'border-slate-200 text-slate-500'
                  }`}>
                    <span>Batch: <strong className="font-mono">{item.batchNumber}</strong></span>
                    <span>Exp: <strong className="font-mono">{item.expiredDate}</strong></span>
                    <span className="font-semibold">Apoteker: {item.pharmacistSign}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Format cetak: Thermal 80mm / Sticker label
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-[#030879] hover:bg-[#020557] active:bg-[#010338] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Etiket Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
