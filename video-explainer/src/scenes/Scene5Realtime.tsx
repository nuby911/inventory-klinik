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
  Activity,
  ArrowRight,
  Bell,
  CheckCircle2,
  Radio,
  Send,
  Stethoscope,
  Wifi,
  Zap,
} from "lucide-react";
import { Background } from "../components/Background";
import { Captions } from "../components/Captions";

export const Scene5Realtime: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const layoutSpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  // Pulse animation for data beam
  const packetPos = interpolate(frame % 45, [0, 45], [0, 100]);

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
      <Audio src={staticFile("audio/scene5_realtime.mp3")} />
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
            color: "#38bdf8",
            letterSpacing: 2,
            textTransform: "uppercase",
            backgroundColor: "rgba(14, 165, 233, 0.15)",
            padding: "6px 16px",
            borderRadius: 100,
            border: "1px solid rgba(56, 189, 248, 0.3)",
          }}
        >
          Konektivitas Instan
        </span>
        <h2
          style={{
            fontSize: 48,
            fontWeight: 800,
            margin: "14px 0 0 0",
            letterSpacing: -1,
          }}
        >
          Sinkronisasi Real-Time Socket.io
        </h2>
      </div>

      {/* Real-time Transmission Flowchart */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          zIndex: 10,
          maxWidth: 1550,
          width: "100%",
          padding: "0 40px",
          opacity: layoutSpring,
          transform: `translateY(${(1 - layoutSpring) * 30}px)`,
        }}
      >
        {/* Step 1: Doctor sends prescription */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            border: "1px solid rgba(56, 189, 248, 0.35)",
            borderRadius: 20,
            padding: 26,
            boxShadow: "0 16px 36px rgba(0,0,0,0.35)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Stethoscope size={22} color="#38bdf8" />
            <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#38bdf8" }}>
              Dokter Menulis E-Resep
            </h4>
          </div>

          <div
            style={{
              backgroundColor: "rgba(10, 15, 30, 0.8)",
              borderRadius: 14,
              padding: 16,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ fontSize: 13, color: "#94a3b8" }}>Pasien: <strong>Tn. Budi (RM-2026-089)</strong></div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc", margin: "6px 0" }}>
              Amoxicillin 500mg (10 Tablet)
            </div>
            <div style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>
              Aturan: 3 x 1 Sesudah Makan
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: "#0284c7",
              color: "#ffffff",
              padding: "10px 16px",
              borderRadius: 12,
              marginTop: 16,
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            <Send size={16} /> [Klik] Kirim E-Resep
          </div>
        </div>

        {/* Transmission Beam / Server */}
        <div
          style={{
            width: 180,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 800,
              color: "#38bdf8",
              backgroundColor: "rgba(14, 165, 233, 0.15)",
              padding: "4px 10px",
              borderRadius: 20,
              border: "1px solid rgba(56, 189, 248, 0.4)",
              marginBottom: 10,
            }}
          >
            <Wifi size={14} /> WebSocket
          </div>

          {/* Beam track */}
          <div
            style={{
              width: "100%",
              height: 6,
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 4,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: `${packetPos}%`,
                top: 0,
                bottom: 0,
                width: 50,
                background: "linear-gradient(90deg, transparent, #38bdf8, #34d399)",
                borderRadius: 4,
                boxShadow: "0 0 10px #38bdf8",
              }}
            />
          </div>

          <span style={{ fontSize: 11, color: "#64748b", marginTop: 8, fontWeight: 600 }}>
            Latensi: &lt; 0.08 detik
          </span>
        </div>

        {/* Step 2: Pharmacy Screen triggers immediately */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 30, 40, 0.85)",
            border: "2px solid #10b981",
            borderRadius: 20,
            padding: 26,
            boxShadow: "0 0 35px rgba(16, 185, 129, 0.25), 0 16px 36px rgba(0,0,0,0.35)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Radio size={22} color="#34d399" />
              <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#34d399" }}>
                Layar Farmasi (Live Queue)
              </h4>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                backgroundColor: "#10b981",
                color: "#022c22",
                padding: "4px 10px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              <Bell size={12} /> RESEP MASUK!
            </div>
          </div>

          <div
            style={{
              backgroundColor: "rgba(10, 25, 20, 0.8)",
              borderRadius: 14,
              padding: 16,
              border: "1px solid rgba(52, 211, 153, 0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "#6ee7b7", fontWeight: 700 }}>Tiket #RX-8942</span>
              <span style={{ fontSize: 12, color: "#cbd5e1" }}>Baru saja</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc", margin: "6px 0" }}>
              Dispensing Otomatis Batch FEFO Terpilih
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              Amoxicillin Batch #ALM-2024-09 (Exp: 12/2026)
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 16,
            }}
          >
            <span style={{ fontSize: 12, color: "#34d399", display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={16} /> Stok Terpotong Otomatis
            </span>
            <span style={{ fontSize: 12, color: "#38bdf8", fontWeight: 700 }}>
              [Siap Cetak Etiket]
            </span>
          </div>
        </div>
      </div>

      <Captions
        badge="Real-Time Sync"
        text="Didukung teknologi Socket.io, alur resep terhubung secara real-time dalam hitungan detik. Cepat, aman, dan meningkatkan kepuasan pasien."
      />
    </div>
  );
};
