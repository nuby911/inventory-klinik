import React from "react";
import {
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Activity, Clock, ShieldCheck, Zap } from "lucide-react";
import { Background } from "../components/Background";
import { Captions } from "../components/Captions";

export const Scene1Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const textSpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const badgesSpring = spring({
    frame: frame - 25,
    fps,
    config: { damping: 15, stiffness: 90 },
  });

  const pulse = Math.sin(frame / 15) * 6;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#ffffff",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      <Audio src={staticFile("audio/scene1_intro.mp3")} />
      <Background />

      {/* Main Hero Container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 10,
          marginTop: -40,
        }}
      >
        {/* Animated Clinic Logo */}
        <div
          style={{
            position: "relative",
            width: 170,
            height: 170,
            borderRadius: 36,
            background:
              "linear-gradient(135deg, rgba(14, 165, 233, 0.25) 0%, rgba(16, 185, 129, 0.25) 100%)",
            border: "2px solid rgba(56, 189, 248, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 ${40 + pulse}px rgba(14, 165, 233, 0.4), 0 20px 40px rgba(0,0,0,0.4)`,
            transform: `scale(${logoSpring})`,
            marginBottom: 32,
          }}
        >
          <Img
            src={staticFile("logo.png")}
            style={{
              width: 140,
              height: 140,
              objectFit: "contain",
              borderRadius: 24,
            }}
          />
        </div>

        {/* Brand Title with Gradient */}
        <div
          style={{
            opacity: textSpring,
            transform: `translateY(${(1 - textSpring) * 30}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 20px",
              borderRadius: 100,
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              color: "#34d399",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            <Activity size={16} /> Web-Based Hospital & Pharmacy SIM
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 68,
              fontWeight: 900,
              letterSpacing: -1.5,
              background: "linear-gradient(135deg, #ffffff 30%, #38bdf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1.1,
            }}
          >
            KLINIK ALMEDIKA
          </h1>

          <p
            style={{
              margin: "16px 0 0 0",
              fontSize: 26,
              color: "#94a3b8",
              fontWeight: 400,
              letterSpacing: -0.2,
            }}
          >
            Sistem Informasi Manajemen Farmasi & Rawat Jalan Terpadu
          </p>
        </div>

        {/* Feature Badges Row */}
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 48,
            opacity: badgesSpring,
            transform: `translateY(${(1 - badgesSpring) * 20}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 24px",
              borderRadius: 16,
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            }}
          >
            <Zap size={22} color="#38bdf8" />
            <span style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0" }}>
              Real-Time E-Resep (Socket.io)
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 24px",
              borderRadius: 16,
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            }}
          >
            <ShieldCheck size={22} color="#34d399" />
            <span style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0" }}>
              Stok Otomatis FEFO
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 24px",
              borderRadius: 16,
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              border: "1px solid rgba(168, 85, 247, 0.3)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            }}
          >
            <Clock size={22} color="#c084fc" />
            <span style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0" }}>
              Konversi Multi-Satuan
            </span>
          </div>
        </div>
      </div>

      <Captions
        badge="Pengenalan"
        text="Selamat datang di Klinik Almedika. Sistem Informasi Manajemen Klinik dan Farmasi internal terpadu berbasis web."
      />
    </div>
  );
};
