import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  Camera, 
  X, 
  RefreshCw, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  QrCode,
  Layers,
  Volume2
} from 'lucide-react';
import { parseGS1DataMatrix } from '../../utils/gs1Parser';

export default function BarcodeScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [cameraError, setCameraError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedResult, setLastScannedResult] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const isStoppingRef = useRef(false);

  // Suara Beep Feedback Pemindaian
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 880Hz (A5)
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Abaikan jika audio tidak diizinkan browser sebelum interaksi
    }

    // Getar pada smartphone (Haptic Feedback)
    if (navigator.vibrate) {
      try {
        navigator.vibrate([80, 40, 80]);
      } catch {}
    }
  };

  // Inisialisasi daftar kamera dan mulai scanner saat modal dibuka
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    setCameraError(null);
    setLastScannedResult(null);

    let isMounted = true;

    // Dapatkan daftar kamera perangkat
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMounted) return;
        if (devices && devices.length) {
          setCameras(devices);
          // Prioritaskan kamera belakang (environment) untuk scanning kemasan
          const backCam = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('belakang') ||
            d.label.toLowerCase().includes('environment')
          );
          const defaultCamId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(defaultCamId);
          startScannerWithCamera(defaultCamId);
        } else {
          // Coba fallback dengan facingMode environment
          startScannerWithFacingMode('environment');
        }
      })
      .catch((err) => {
        console.warn('Gagal membaca getCameras, fallback ke environment:', err);
        startScannerWithFacingMode('environment');
      });

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen]);

  async function startScannerWithCamera(cameraId) {
    await stopScanner();
    if (!scannerRef.current) return;

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-target', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A
        ],
        verbose: false
      });
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 20,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const edge = Math.min(viewfinderWidth, viewfinderHeight) * 0.72;
          return { width: Math.max(220, edge), height: Math.max(220, edge) };
        },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        cameraId,
        config,
        onDecodeSuccess,
        () => {
          // frame ignore callback
        }
      );

      setIsScanning(true);
      setCameraError(null);

      // Cek ketersediaan torch / senter
      try {
        const capabilities = html5QrCode.getRunningTrackCapabilities();
        if (capabilities && capabilities.torch) {
          setHasTorch(true);
        }
      } catch {}
    } catch (err) {
      console.error('Start scanner error:', err);
      setCameraError(err.message || 'Gagal mengakses kamera perangkat. Pastikan izin kamera aktif.');
      setIsScanning(false);
    }
  }

  async function startScannerWithFacingMode(facingMode = 'environment') {
    await stopScanner();
    if (!scannerRef.current) return;

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-target', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13
        ],
        verbose: false
      });
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 20,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        { facingMode: facingMode },
        config,
        onDecodeSuccess,
        () => {}
      );

      setIsScanning(true);
      setCameraError(null);
    } catch (err) {
      console.error('Start facingMode scanner error:', err);
      setCameraError('Tidak dapat membuka kamera. Pastikan browser diizinkan mengakses kamera.');
      setIsScanning(false);
    }
  }

  async function stopScanner() {
    if (isStoppingRef.current) return;
    if (html5QrCodeRef.current && isScanning) {
      isStoppingRef.current = true;
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Stop scanner warning:', err);
      } finally {
        html5QrCodeRef.current = null;
        setIsScanning(false);
        setTorchOn(false);
        setHasTorch(false);
        isStoppingRef.current = false;
      }
    }
  }

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !hasTorch) return;
    try {
      const newTorch = !torchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: newTorch }]
      });
      setTorchOn(newTorch);
    } catch (e) {
      console.warn('Torch toggle error:', e);
    }
  };

  const handleCameraChange = (e) => {
    const newId = e.target.value;
    setSelectedCameraId(newId);
    startScannerWithCamera(newId);
  };

  const onDecodeSuccess = (decodedText) => {
    playBeep();
    const parsed = parseGS1DataMatrix(decodedText);
    setLastScannedResult(parsed);

    // Kirim hasil pemindaian ke callback induk
    if (onScanSuccess) {
      onScanSuccess(parsed, decodedText);
    }

    // Berikan sedikit jeda animasi sukses sebelum menutup
    setTimeout(() => {
      onClose();
    }, 600);
  };

  // Simulasi / Contoh Uji Coba Cepat (Sangat Berguna untuk Demonstrasi & Testing)
  const handleSimulateSample = (sampleType) => {
    let sampleRaw = '';
    if (sampleType === 'paracetamol') {
      // GS1 DataMatrix resmi BPOM Paracetamol 500mg
      sampleRaw = '(01)08999999001014(17)271031(10)BCH-PCT-2027X(21)SN889104';
    } else if (sampleType === 'amoxicillin') {
      // GS1 DataMatrix Amoxicillin 500mg
      sampleRaw = '(01)08999999002011(17)280415(10)BCH-AMX-2028Z(21)SN772910';
    } else if (sampleType === 'cefixime') {
      // 1D EAN Barcode Cefixime 100mg
      sampleRaw = '08999999003018';
    }

    playBeep();
    const parsed = parseGS1DataMatrix(sampleRaw);
    setLastScannedResult(parsed);
    if (onScanSuccess) {
      onScanSuccess(parsed, sampleRaw);
    }
    setTimeout(() => {
      onClose();
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 to-indigo-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-base">Pemindai Kamera Obat</h3>
                <span className="text-[10px] font-bold tracking-wider uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  GS1 / BPOM RI
                </span>
              </div>
              <p className="text-xs text-slate-500">2D Barcode DataMatrix, QR BPOM, & EAN-13 Kemasan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Area Viewfinder Scanner */}
        <div className="relative bg-black flex-1 min-h-[320px] max-h-[380px] overflow-hidden flex items-center justify-center">
          {/* Target Element untuk html5-qrcode */}
          <div id="qr-reader-target" ref={scannerRef} className="w-full h-full overflow-hidden" />

          {/* Overlay Bingkai Pemindai (Viewfinder Frame & Animasi Laser) */}
          {isScanning && !cameraError && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Dimmed background cutout */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 border-2 border-dashed border-white/40 rounded-3xl overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                {/* 4 Corner Brackets */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

                {/* Laser Scanning Line */}
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse top-1/2 -translate-y-1/2" />
                
                {/* Center target icon */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
                  <QrCode className="w-10 h-10 stroke-[1.2] opacity-40 animate-pulse" />
                  <span className="text-[11px] font-medium tracking-wide mt-2 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs">
                    Posisikan 2D Barcode di sini
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Fallback jika Kamera Error / Ditolak */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-100 mb-1">Akses Kamera Belum Diizinkan</h4>
              <p className="text-xs text-slate-400 max-w-xs mb-4 leading-relaxed">
                {cameraError}
              </p>
              <button
                onClick={() => startScannerWithFacingMode('environment')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-500/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Coba Buka Kamera Lagi
              </button>
            </div>
          )}

          {/* Banner Indikator Sukses Deteksi */}
          {lastScannedResult && (
            <div className="absolute top-4 inset-x-4 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top duration-300 z-10">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">Berhasil Memindai Barcode!</p>
                <p className="text-[11px] opacity-90 truncate">
                  {lastScannedResult.batchNumber ? `Batch: ${lastScannedResult.batchNumber}` : ''} 
                  {lastScannedResult.expiryDate ? ` | ED: ${lastScannedResult.expiryDate}` : ''}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar Pengaturan Kamera (Ganti Kamera & Senter) */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {cameras.length > 1 ? (
              <select
                value={selectedCameraId || ''}
                onChange={handleCameraChange}
                className="w-full max-w-[200px] text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 truncate"
              >
                {cameras.map((cam, idx) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Kamera ${idx + 1}`}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                Audio bip & deteksi otomatis aktif
              </span>
            )}
          </div>

          {hasTorch && (
            <button
              onClick={toggleTorch}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all text-xs ${
                torchOn 
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25' 
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${torchOn ? 'fill-current' : ''}`} />
              {torchOn ? 'Senter Aktif' : 'Senter'}
            </button>
          )}
        </div>

        {/* Area Demonstrasi / Pengujian Cepat (Sample Barcodes) */}
        <div className="p-5 bg-white border-t border-slate-100">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Simulasi Cepat untuk Pengujian (Tanpa Fisik Box)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleSimulateSample('paracetamol')}
              className="px-3 py-2 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 group-hover:text-blue-700">Paracetamol 500mg</span>
                <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded">GS1 BPOM</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">Batch: BCH-PCT-2027X | 2027-10</p>
            </button>

            <button
              type="button"
              onClick={() => handleSimulateSample('amoxicillin')}
              className="px-3 py-2 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 group-hover:text-blue-700">Amoxicillin 500mg</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.2 rounded">GS1 BPOM</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">Batch: BCH-AMX-2028Z | 2028-04</p>
            </button>

            <button
              type="button"
              onClick={() => handleSimulateSample('cefixime')}
              className="px-3 py-2 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 border border-slate-200 rounded-xl text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 group-hover:text-purple-700">Cefixime 100mg</span>
                <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.2 rounded">1D Barcode</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">EAN: 08999999003018</p>
            </button>
          </div>
        </div>

        {/* Footer Catatan Standar */}
        <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            Scanner Gun USB/Bluetooth dapat langsung ditembakkan di form.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
