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
  CheckCircle2,
  FileCheck,
  Send,
  Stethoscope,
  Zap,
} from "lucide-react";
import { Background } from "../components/Background";
import { BrowserMockup } from "../components/BrowserMockup";
import { Captions } from "../components/Captions";

export const ProScene3Doctor: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const zoomFactor = interpolate(frame, [0, 90, 450], [1, 1.05, 1.05], {
    extrapolateRight: "clamp",
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
      <Audio src={staticFile("audio/pro_scene3_doctor.mp3")} />
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
              backgroundColor: "rgba(14, 165, 233, 0.2)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Stethoscope size={24} color="#38bdf8" />
          </div>
          <div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#38bdf8",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              MODUL RAWAT JALAN
            </span>
            <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>
              Portal Dokter — Pantau Stok Live & Kirim E-Resep
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
            <Zap size={16} /> Instant E-Resep
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
            <CheckCircle2 size={16} /> Bebas Kertas 100%
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
          videoSrc="recordings/scene2.mp4"
          urlPath="doctor/write_prescription"
          badgeText="LIVE DEMO: E-RESEP DOKTER"
          scale={zoomFactor}
        />
      </div>

      <Captions
        badge="Portal Dokter"
        text="Di layar dokter, stok obat terpantau secara live hingga butir. Dokter memilih pasien, mengatur dosis, lalu mengirimkan E-Resep tanpa kertas dalam hitungan detik."
      />
    </div>
  );
};
