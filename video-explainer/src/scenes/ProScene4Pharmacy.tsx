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
  Clock,
  Pill,
  Printer,
  Radio,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Background } from "../components/Background";
import { BrowserMockup } from "../components/BrowserMockup";
import { Captions } from "../components/Captions";

export const ProScene4Pharmacy: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
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
        paddingTop: 50,
        color: "#ffffff",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      <Audio src={staticFile("audio/pro_scene4_pharmacy.mp3")} />
      {frame === 20 && <Audio src={staticFile("audio/ding.wav")} />}
      <Background />

      {/* Header Info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: 1560,
          marginBottom: 20,
          zIndex: 10,
          opacity: entrance,
          transform: `translateY(${(1 - entrance) * 20}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: "rgba(16, 185, 129, 0.2)",
              border: "1px solid rgba(52, 211, 153, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Pill size={24} color="#34d399" />
          </div>
          <div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#34d399",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              INSTALASI FARMASI & DISPENSING
            </span>
            <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>
              Portal Apoteker — Antrean Real-Time & Metode FEFO
            </h2>
          </div>
        </div>

        {/* Feature Highlights */}
        <div style={{ display: "flex", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 12,
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(52, 211, 153, 0.35)",
              color: "#34d399",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <ShieldCheck size={16} /> FEFO First-Out
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 12,
              backgroundColor: "rgba(14, 165, 233, 0.15)",
              border: "1px solid rgba(56, 189, 248, 0.35)",
              color: "#38bdf8",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <Printer size={16} /> Cetak Etiket 1-Klik
          </div>
        </div>
      </div>

      {/* Browser Mockup */}
      <div
        style={{
          width: "100%",
          maxWidth: 1560,
          zIndex: 10,
          opacity: entrance,
          transform: `scale(${entrance})`,
        }}
      >
        <BrowserMockup
          videoSrc="recordings/scene3.mp4"
          urlPath="pharmacy/queue_dispensing"
          badgeText="LIVE DEMO: FARMASI & FEFO"
        />
      </div>

      <Captions
        badge="Portal Farmasi"
        text="Resep masuk secara live via Socket.io. Sistem otomatis menerapkan metode FEFO untuk memotong batch dengan tanggal expired terdekat dan mencetak etiket obat."
      />
    </div>
  );
};
