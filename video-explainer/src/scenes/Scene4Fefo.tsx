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
  ArrowRight,
  Boxes,
  CheckCircle,
  Clock,
  Layers,
  Pill,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Background } from "../components/Background";
import { Captions } from "../components/Captions";

export const Scene4Fefo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const section1Spring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const section2Spring = spring({
    frame: frame - 25,
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
      <Audio src={staticFile("audio/scene4_fefo.mp3")} />
      <Background />

      {/* Header */}
      <div
        style={{
          textAlign: "center",
          opacity: titleSpring,
          transform: `translateY(${(1 - titleSpring) * 20}px)`,
          zIndex: 10,
          marginBottom: 36,
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#34d399",
            letterSpacing: 2,
            textTransform: "uppercase",
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            padding: "6px 16px",
            borderRadius: 100,
            border: "1px solid rgba(16, 185, 129, 0.3)",
          }}
        >
          Keunggulan Inventori
        </span>
        <h2
          style={{
            fontSize: 48,
            fontWeight: 800,
            margin: "14px 0 0 0",
            letterSpacing: -1,
          }}
        >
          Multi-Satuan Berjenjang & FEFO Otomatis
        </h2>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 32,
          zIndex: 10,
          maxWidth: 1500,
          width: "100%",
          padding: "0 40px",
        }}
      >
        {/* Top: Multi-Unit Hierarchy Visualizer */}
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            border: "1px solid rgba(56, 189, 248, 0.35)",
            borderRadius: 24,
            padding: "26px 36px",
            boxShadow: "0 16px 36px rgba(0,0,0,0.35)",
            opacity: section1Spring,
            transform: `translateY(${(1 - section1Spring) * 30}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Boxes size={24} color="#38bdf8" />
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#ffffff" }}>
                Konversi Satuan Bertingkat
              </h3>
            </div>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>
              Pemotongan otomatis di tingkat satuan dasar (Base Unit)
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 24,
            }}
          >
            {/* 1 Box */}
            <div
              style={{
                flex: 1,
                padding: "18px 24px",
                borderRadius: 16,
                backgroundColor: "rgba(14, 165, 233, 0.12)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 13, color: "#38bdf8", fontWeight: 700 }}>KEMASAN BESAR</div>
              <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0", color: "#f8fafc" }}>
                1 Box
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>Satuan Pembelian Supplier</div>
            </div>

            <ArrowRight size={28} color="#64748b" />

            {/* 10 Strip */}
            <div
              style={{
                flex: 1,
                padding: "18px 24px",
                borderRadius: 16,
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(52, 211, 153, 0.3)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 13, color: "#34d399", fontWeight: 700 }}>KEMASAN MENENGAH</div>
              <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0", color: "#f8fafc" }}>
                10 Strip
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>1 Strip = 10 Butir</div>
            </div>

            <ArrowRight size={28} color="#64748b" />

            {/* 100 Butir (Base Unit) */}
            <div
              style={{
                flex: 1,
                padding: "18px 24px",
                borderRadius: 16,
                backgroundColor: "rgba(168, 85, 247, 0.15)",
                border: "2px solid rgba(168, 85, 247, 0.5)",
                textAlign: "center",
                boxShadow: "0 0 20px rgba(168, 85, 247, 0.2)",
              }}
            >
              <div style={{ fontSize: 13, color: "#c084fc", fontWeight: 800 }}>
                ★ SATUAN TERKECIL (BASE UNIT)
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, margin: "6px 0", color: "#f8fafc" }}>
                100 Tablet / Butir
              </div>
              <div style={{ fontSize: 13, color: "#e2e8f0" }}>Target Pemotongan Dosis Resep</div>
            </div>
          </div>
        </div>

        {/* Bottom: FEFO Batch Priority Queue */}
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            border: "1px solid rgba(52, 211, 153, 0.35)",
            borderRadius: 24,
            padding: "26px 36px",
            boxShadow: "0 16px 36px rgba(0,0,0,0.35)",
            opacity: section2Spring,
            transform: `translateY(${(1 - section2Spring) * 30}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Clock size={24} color="#34d399" />
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#ffffff" }}>
                FEFO (First Expired, First Out)
              </h3>
            </div>
            <span style={{ fontSize: 13, color: "#34d399", fontWeight: 600 }}>
              Sistem otomatis memilih obat dengan tanggal kadaluarsa terdekat
            </span>
          </div>

          <div style={{ display: "flex", gap: 24 }}>
            {/* Batch 1: Prioritas 1 */}
            <div
              style={{
                flex: 1,
                padding: "18px 20px",
                borderRadius: 16,
                backgroundColor: "rgba(16, 185, 129, 0.2)",
                border: "2px solid #10b981",
                boxShadow: "0 0 25px rgba(16, 185, 129, 0.25)",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: 8,
                  backgroundColor: "#10b981",
                  color: "#022c22",
                  fontSize: 11,
                  fontWeight: 800,
                  marginBottom: 8,
                }}
              >
                DIPOTONG PERTAMA (PRIORITAS 1)
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#f8fafc" }}>
                Batch #ALM-2024-09
              </div>
              <div style={{ fontSize: 14, color: "#6ee7b7", margin: "4px 0" }}>
                Exp Date: <strong>Desember 2026</strong>
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>Sisa: 40 Butir (Segera Dikeluarkan)</div>
            </div>

            {/* Batch 2: Antrean 2 */}
            <div
              style={{
                flex: 1,
                padding: "18px 20px",
                borderRadius: 16,
                backgroundColor: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: 8,
                  backgroundColor: "rgba(148, 163, 184, 0.2)",
                  color: "#cbd5e1",
                  fontSize: 11,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                ANTREAN BERIKUTNYA
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#cbd5e1" }}>
                Batch #ALM-2025-01
              </div>
              <div style={{ fontSize: 14, color: "#94a3b8", margin: "4px 0" }}>
                Exp Date: <strong>April 2027</strong>
              </div>
              <div style={{ fontSize: 13, color: "#64748b" }}>Sisa: 100 Butir (Tersimpan aman)</div>
            </div>

            {/* Batch 3: Antrean 3 */}
            <div
              style={{
                flex: 1,
                padding: "18px 20px",
                borderRadius: 16,
                backgroundColor: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: 8,
                  backgroundColor: "rgba(148, 163, 184, 0.2)",
                  color: "#cbd5e1",
                  fontSize: 11,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                STOK CADANGAN
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#cbd5e1" }}>
                Batch #ALM-2025-08
              </div>
              <div style={{ fontSize: 14, color: "#94a3b8", margin: "4px 0" }}>
                Exp Date: <strong>Oktober 2027</strong>
              </div>
              <div style={{ fontSize: 13, color: "#64748b" }}>Sisa: 250 Butir (Batch Baru)</div>
            </div>
          </div>
        </div>
      </div>

      <Captions
        badge="Multi-Satuan & FEFO"
        text="Klinik Almedika mendukung konversi multi-satuan berjenjang dari boks hingga butir terkecil, serta pemotongan stok otomatis berbasis First Expired First Out."
      />
    </div>
  );
};
