import React from 'react';

export default function EtiketModal({ isOpen, onClose, etiketData }) {
  if (!isOpen || !etiketData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full overflow-hidden shadow-lg border border-slate-300">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <div className="font-bold text-sm text-slate-900">Cetak Etiket Aturan Pakai Obat</div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-sm">
            ✕
          </button>
        </div>

        {/* Printable Area */}
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto text-xs">
          <div id="etiket-printable" className="space-y-3">
            {etiketData.map((item, idx) => (
              <div key={idx} className="p-3 bg-white border border-slate-400 rounded space-y-2 font-sans">
                {/* Header Klinik */}
                <div className="text-center border-b border-slate-300 pb-1.5">
                  <div className="font-bold text-xs uppercase text-slate-900">{item.clinicName}</div>
                  <div className="text-[10px] text-slate-600">{item.clinicAddress}</div>
                  <div className="text-[10px] font-mono text-slate-500">SIA: 445/028/SIP-A/2026</div>
                </div>

                {/* Info Pasien & Resep */}
                <div className="grid grid-cols-2 text-[11px] text-slate-800">
                  <div>No. Resep: <span className="font-mono">{item.prescriptionCode}</span></div>
                  <div className="text-right">Tgl: {new Date(item.date).toLocaleDateString('id-ID')}</div>
                  <div>Pasien: <span className="font-semibold">{item.patientName}</span></div>
                  <div className="text-right">No. RM: <span className="font-mono">{item.medicalRecordNumber}</span></div>
                </div>

                {/* Nama Obat & Aturan Pakai */}
                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-center space-y-0.5">
                  <div className="font-bold text-xs text-slate-900">{item.medicineName}</div>
                  <div className="text-[11px] text-slate-700">{item.quantity}</div>
                  <div className="text-xs font-bold text-slate-900 border-t border-slate-200 pt-1 mt-1">
                    {item.dosageInstruction}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200 pt-1">
                  <span>Batch: <span className="font-mono">{item.batchNumber}</span></span>
                  <span>Exp: <span className="font-mono">{item.expiredDate}</span></span>
                  <span>Apoteker: {item.pharmacistSign}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded cursor-pointer"
          >
            Cetak Stiker
          </button>
        </div>
      </div>
    </div>
  );
}
