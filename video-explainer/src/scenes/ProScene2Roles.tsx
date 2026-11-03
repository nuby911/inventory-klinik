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
  Building2,
  CheckCircle,
  Pill,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import { Background } from "../components/Background";
import { BrowserMockup } from "../components/BrowserMockup";
import { Captions } from "../components/Captions";

export const ProScene2Roles: React.FC = () => {
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
      <Audio src={staticFile("audio/pro_scene2_roles.mp3")} />
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
        <div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "#38bdf8",
              letterSpacing: 2,
              textTransform: "uppercase",
              backgroundColor: "rgba(14, 165, 233, 0.15)",
              padding: "4px 14px",
              borderRadius: 100,
              border: "1px solid rgba(56, 189, 248, 0.35)",
            }}
          >
            DEMO LIVE: ARSITEKTUR MULTI-PERAN
          </span>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: "6px 0 0 0" }}>
            Satu Sistem Terpadu untuk 3 Peran Kunci
          </h2>
        </div>

        {/* 3 Role Badges */}
        <div style={{ display: "flex", gap: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 14,
              backgroundColor: "rgba(14, 165, 233, 0.15)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              color: "#38bdf8",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            <Stethoscope size={18} /> Dokter
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 14,
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              color: "#34d399",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            <Pill size={18} /> Apoteker
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 14,
              backgroundColor: "rgba(168, 85, 247, 0.15)",
              border: "1px solid rgba(168, 85, 247, 0.4)",
              color: "#c084fc",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            <Building2 size={18} /> Logistik
          </div>
        </div>
      </div>

      {/* Browser Mockup with Real Live Recording */}
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
          videoSrc="recordings/scene1.mp4"
          urlPath="login"
          badgeText="LIVE DEMO: AUTH & ROLE SELECT"
        />
      </div>

      <Captions
        badge="Multi-Peran"
        text="Klinik Almedika hadir sebagai solusi terpadu berbasis web. Menghubungkan Dokter, Apoteker, dan Bagian Logistik secara real-time."
      />
    </div>
  );
};
