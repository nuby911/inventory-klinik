import React from "react";
import {
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileQuestion,
  Layers,
  PackageX,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Background } from "../components/Background";
import { Captions } from "../components/Captions";

export const Scene2Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const leftCardSpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const arrowSpring = spring({
    frame: frame - 25,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const rightCardSpring = spring({
    frame: frame - 35,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 80,
        color: "#ffffff",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      <Audio src={staticFile("audio/scene2_problem.mp3")} />
      <Background />

      {/* Header */}
      <div
        style={{
          textAlign: "center",
          opacity: titleSpring,
          transform: `translateY(${(1 - titleSpring) * 20}px)`,
          zIndex: 10,
          marginBottom: 44,
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#f59e0b",
            letterSpacing: 2,
            textTransform: "uppercase",
            backgroundColor: "rgba(245, 158, 11, 0.15)",
            padding: "6px 16px",
            borderRadius: 100,
            border: "1px solid rgba(245, 158, 11, 0.3)",
          }}
        >
          Transformasi Operasional
        </span>
        <h2
          style={{
            fontSize: 48,
            fontWeight: 800,
            margin: "14px 0 0 0",
            letterSpacing: -1,
          }}
        >
          Dari Manual ke Otomasi Cerdas
        </h2>
      </div>

      {/* Comparison Grid */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
          zIndex: 10,
          maxWidth: 1500,
          width: "100%",
          padding: "0 40px",
        }}
      >
        {/* Left: Problem Card */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(30, 20, 25, 0.75)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: 24,
            padding: 32,
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            opacity: leftCardSpring,
            transform: `translateX(${(1 - leftCardSpring) * -40}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 24,
              borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
              paddingBottom: 16,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: "rgba(239, 68, 68, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertTriangle size={24} color="#f87171" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f87171" }}>
                Klinik Konvensional
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
                Proses manual & rawan kesalahan
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <PackageX size={20} color="#f87171" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: 16, color: "#fecaca" }}>Resep Kertas Manual</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#94a3b8" }}>
                  Tulisan tangan rawan salah tafsir, antrean pasien menumpuk lama.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <FileQuestion size={20} color="#f87171" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: 16, color: "#fecaca" }}>Stok Tidak Sinkron</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#94a3b8" }}>
                  Dokter meresepkan obat yang ternyata kosong di bagian farmasi.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <AlertTriangle size={20} color="#f87171" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: 16, color: "#fecaca" }}>Obat Kadaluarsa Terlewat</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#94a3b8" }}>
                  Sulit melacak masa expired batch, menimbulkan kerugian klinik.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Center Transition Icon */}
        <div
          style={{
            transform: `scale(${arrowSpring})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "rgba(14, 165, 233, 0.2)",
              border: "2px solid rgba(56, 189, 248, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 25px rgba(14, 165, 233, 0.5)",
            }}
          >
            <ArrowRight size={28} color="#38bdf8" />
          </div>
        </div>

        {/* Right: Solution Card */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 30, 45, 0.85)",
            border: "1px solid rgba(56, 189, 248, 0.4)",
            borderRadius: 24,
            padding: 32,
            boxShadow: "0 20px 40px rgba(0,0,0,0.4), 0 0 30px rgba(14, 165, 233, 0.15)",
            opacity: rightCardSpring,
            transform: `translateX(${(1 - rightCardSpring) * 40}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 24,
              borderBottom: "1px solid rgba(56, 189, 248, 0.2)",
              paddingBottom: 16,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: "rgba(14, 165, 233, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={24} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#38bdf8" }}>
                Solusi Klinik Almedika
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
                Integrasi real-time & akurasi penuh
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <Zap size={20} color="#34d399" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: 16, color: "#bae6fd" }}>E-Resep Digital Instan</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#94a3b8" }}>
                  Terhubung via Socket.io seketika saat dokter selesai mengetik.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <Layers size={20} color="#34d399" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: 16, color: "#bae6fd" }}>Visibilitas Stok Real-Time</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#94a3b8" }}>
                  Dokter langsung melihat sisa stok dalam format multi-satuan.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <ShieldCheck size={20} color="#34d399" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: 16, color: "#bae6fd" }}>Manajemen Batch FEFO</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#94a3b8" }}>
                  Pemotongan stok mendahulukan obat yang paling dekat tanggal kadaluarsanya.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Captions
        badge="Masalah & Solusi"
        text="Di klinik konvensional, resep manual rentan salah baca, stok obat sering tidak akurat, dan risiko obat kadaluarsa tinggi. Almedika hadir menghadirkan digitalisasi menyeluruh."
      />
    </div>
  );
};
