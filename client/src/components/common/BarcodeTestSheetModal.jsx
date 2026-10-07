import React, { useEffect, useRef, useState } from 'react';
import { X, QrCode, Barcode, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import bwipjs from 'bwip-js';

function BarcodeCanvas({ bcid, text, options = {}, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !text) return;
    try {
      bwipjs.toCanvas(canvasRef.current, {
        bcid: bcid,
        text: text,
        scale: options.scale || 3,
        height: options.height || 12,
        includetext: options.includetext !== undefined ? options.includetext : true,
        textxalign: 'center',
        backgroundcolor: 'ffffff',
        ...options
      });
    } catch (e) {
      console.error('Barcode render error:', e, text);
    }
  }, [bcid, text, options]);

  return <canvas ref={canvasRef} className={className} />;
}

export default function BarcodeTestSheetModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('2d_bpom');

  if (!isOpen) return null;

  const BPOM_2D_BARCODES = [
    {
      name: 'Paracetamol 500mg (Tablet)',
      factory: 'Kimia Farma',
      nie: 'DBL9504414110A1',
      batch: 'BCH-PCT-2027X',
      ed: '2027-10-31',
      gtin: '08999999001014',
      rawGs1: '(01)08999999001014(17)271031(10)BCH-PCT-2027X(21)SN889104',
      badge: '2D GS1 DataMatrix BPOM'
    },
    {
      name: 'Amoxicillin 500mg (Kaplet)',
      factory: 'Bernofarm',
      nie: 'DKL9804414210B1',
      batch: 'BCH-AMX-2028Z',
      ed: '2028-04-15',
      gtin: '08999999002011',
      rawGs1: '(01)08999999002011(17)280415(10)BCH-AMX-2028Z(21)SN772910',
      badge: '2D GS1 DataMatrix BPOM'
    },
    {
      name: 'Cefixime 100mg (Kapsul)',
      factory: 'Dexa Medica',
      nie: 'DKL0404414310C1',
      batch: 'BCH-CFX-2027K',
      ed: '2027-08-20',
      gtin: '08999999003018',
      rawGs1: '(01)08999999003018(17)270820(10)BCH-CFX-2027K(21)SN102938',
      badge: '2D GS1 DataMatrix BPOM'
    },
    {
      name: 'Omeprazole 20mg (Kapsul Lambung)',
      factory: 'Novell Pharma',
      nie: 'GKL0304415201A1',
      batch: 'BCH-OMP-2027R',
      ed: '2027-12-10',
      gtin: '8999999012010',
      rawGs1: '(01)08999999012010(17)271210(10)BCH-OMP-2027R(21)SN556201',
      badge: '2D GS1 DataMatrix BPOM'
    }
  ];

  const POPULAR_1D_BARCODES = [
    {
      name: 'Panadol Biru (Paracetamol 500mg)',
      barcode: '8992753011402',
      factory: 'Sterling / GSK',
      nie: 'DBL9804414210A1',
      category: 'Analgesik / Penurun Panas'
    },
    {
      name: 'Bodrex Tablet Sakit Kepala',
      barcode: '8992695123010',
      factory: 'Tempo Scan Pacific',
      nie: 'DBL7622702710A1',
      category: 'Sakit Kepala & Nyeri'
    },
    {
      name: 'Promag Tablet Kunyah Maag',
      barcode: '8992695400012',
      factory: 'Kalbe Farma',
      nie: 'DBL9111601963A1',
      category: 'Antasida Lambung'
    },
    {
      name: 'Sanmol Tablet 500mg',
      barcode: '8992745100015',
      factory: 'Sanbe Farma',
      nie: 'DBL7622235610A1',
      category: 'Demam & Nyeri'
    },
    {
      name: 'Tolak Angin Cair Sido Muncul',
      barcode: '8998888123012',
      factory: 'Sido Muncul',
      nie: 'TR032622221',
      category: 'Herbal Masuk Angin'
    },
    {
      name: 'Betadine Antiseptic Solution 60ml',
      barcode: '8992760100012',
      factory: 'Mundipharma',
      nie: 'DKL7614704041A1',
      category: 'Antiseptik Luka'
    },
    {
      name: 'Bioplacenton Gel Luka Bakar 15g',
      barcode: '8992756100018',
      factory: 'Kalbe Farma',
      nie: 'DKL7211601728A1',
      category: 'Salep Luka Bakar'
    },
    {
      name: 'Insto Regular Tetes Mata 7.5ml',
      barcode: '8998838300014',
      factory: 'Combiphar',
      nie: 'DTL1438202046A1',
      category: 'Tetes Mata Steril'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Katalog Barcode Obat Asli Siap Scan</h3>
                <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-xs">
                  Resmi BPOM & EAN-13
                </span>
              </div>
              <p className="text-xs text-blue-100">Arahkan kamera HP Anda langsung ke barcode di layar laptop ini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex gap-4">
          <button
            onClick={() => setActiveTab('2d_bpom')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === '2d_bpom'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <QrCode className="w-4 h-4" />
            2D Barcode GS1 DataMatrix (Standar BPOM RI)
            <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
              Ada Batch & ED
            </span>
          </button>

          <button
            onClick={() => setActiveTab('1d_popular')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === '1d_popular'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Barcode className="w-4 h-4" />
            1D Barcode Kemasan Pabrik (EAN-13 Populer)
            <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
              Panadol, Bodrex, dll
            </span>
          </button>
        </div>

        {/* Petunjuk Penggunaan */}
        <div className="px-6 py-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Cara Tes:</strong> Buka menu <strong>"Scan Kamera"</strong> di HP Anda, lalu arahkan lensa HP langsung ke salah satu kotak barcode di bawah ini!
            </span>
          </div>
          <span className="hidden sm:inline text-[11px] text-blue-600 font-semibold bg-white px-2.5 py-0.5 rounded-lg border border-blue-200">
            Jarak ideal: 10 - 20 cm
          </span>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/60">
          {activeTab === '2d_bpom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BPOM_2D_BARCODES.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-center gap-4"
                >
                  {/* Visual 2D DataMatrix Canvas */}
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center justify-center shrink-0">
                    <BarcodeCanvas
                      bcid="datamatrix"
                      text={item.rawGs1}
                      options={{ scale: 3.5, height: 28 }}
                      className="max-w-[130px] max-h-[130px]"
                    />
                    <span className="text-[9px] font-mono text-slate-400 mt-1 uppercase tracking-wider">
                      GS1 DataMatrix
                    </span>
                  </div>

                  {/* Metadata Info */}
                  <div className="flex-1 min-w-0 text-left w-full">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                        Resmi BPOM
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">{item.factory}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm truncate">{item.name}</h4>
                    
                    <div className="mt-2 space-y-1 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[11px]">No. Batch:</span>
                        <span className="font-bold text-emerald-700">{item.batch}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[11px]">Kadaluarsa (ED):</span>
                        <span className="font-bold text-rose-700">{item.ed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[11px]">NIE BPOM:</span>
                        <span className="font-bold text-slate-700">{item.nie}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === '1d_popular' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {POPULAR_1D_BARCODES.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-center gap-4"
                >
                  {/* Visual 1D Barcode Canvas */}
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center justify-center shrink-0 w-full sm:w-auto">
                    <BarcodeCanvas
                      bcid="ean13"
                      text={item.barcode}
                      options={{ scale: 2.2, height: 16, includetext: true }}
                      className="max-w-[150px]"
                    />
                  </div>

                  {/* Metadata Info */}
                  <div className="flex-1 min-w-0 text-left w-full">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[9px] font-extrabold uppercase bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                        EAN-13 Kemasan
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">{item.factory}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{item.category}</p>
                    
                    <div className="mt-2 text-xs bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between font-mono">
                      <span className="text-slate-400 text-[11px]">NIE:</span>
                      <span className="font-bold text-purple-700">{item.nie}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Semua barcode di atas sudah terdaftar di database server dan siap diuji langsung.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Selesai / Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
