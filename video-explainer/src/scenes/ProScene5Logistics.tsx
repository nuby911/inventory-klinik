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
  Boxes,
  Building2,
  FileSpreadsheet,
  History,
  Layers,
  Sparkles,
} from "lucide-react";
import { Background } from "../components/Background";
import { BrowserMockup } from "../components/BrowserMockup";
import { Captions } from "../components/Captions";

export const ProScene5Logistics: React.FC = () => {
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
      <Audio src={staticFile("audio/pro_scene5_logistics.mp3")} />
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
              backgroundColor: "rgba(168, 85, 247, 0.2)",
              border: "1px solid rgba(168, 85, 247, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Building2 size={24} color="#c084fc" />
          </div>
          <div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#c084fc",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              GUDANG & MASTER INVENTORI
            </span>
            <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>
              Portal Logistik — Multi-Satuan Berjenjang & Audit Trail
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
              backgroundColor: "rgba(168, 85, 247, 0.15)",
              border: "1px solid rgba(168, 85, 247, 0.35)",
              color: "#c084fc",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <Boxes size={16} /> Box ➔ Strip ➔ Butir
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
            <History size={16} /> Stok Opname Otomatis
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
          videoSrc="recordings/scene4.mp4"
          urlPath="admin/inventory_master"
          badgeText="LIVE DEMO: LOGISTIK & AUDIT"
        />
      </div>

      <Captions
        badge="Portal Logistik"
        text="Almedika mendukung konversi multi-satuan otomatis (Box ke Strip ke Butir) dan mencatat seluruh mutasi stok dalam audit log yang transparan."
      />
    </div>
  );
};
