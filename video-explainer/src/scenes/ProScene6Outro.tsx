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
import {
  Activity,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  Heart,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Background } from "../components/Background";
import { Captions } from "../components/Captions";

export const ProScene6Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const contentSpring = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const cardsSpring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const pulse = Math.sin(frame / 12) * 8;

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
      <Audio src={staticFile("audio/pro_scene6_outro.mp3")} />
      {frame === 10 && <Audio src={staticFile("audio/ding.wav")} />}
      <Background />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 10,
          marginTop: -40,
        }}
      >
        {/* Animated Brand Logo */}
        <div
          style={{
            position: "relative",
            width: 140,
            height: 140,
            borderRadius: 32,
            background:
              "linear-gradient(135deg, rgba(14, 165, 233, 0.3) 0%, rgba(16, 185, 129, 0.3) 100%)",
            border: "2px solid rgba(56, 189, 248, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 ${45 + pulse}px rgba(16, 185, 129, 0.45), 0 20px 40px rgba(0,0,0,0.5)`,
            transform: `scale(${logoSpring})`,
            marginBottom: 20,
          }}
        >
          <Img
            src={staticFile("logo.png")}
            style={{ width: 110, height: 110, objectFit: "contain", borderRadius: 22 }}
          />
        </div>

        {/* Brand Titles */}
        <div
          style={{
            textAlign: "center",
            opacity: contentSpring,
            transform: `translateY(${(1 - contentSpring) * 20}px)`,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 58,
              fontWeight: 900,
              letterSpacing: -1,
              background: "linear-gradient(135deg, #ffffff 40%, #34d399 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            KLINIK ALMEDIKA
          </h2>
          <p style={{ margin: "8px 0 0 0", fontSize: 22, color: "#94a3b8", fontWeight: 500 }}>
            Transformasi Digital Layanan Kesehatan Prima
          </p>
        </div>

        {/* 3 Value Transformation Cards */}
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 36,
            opacity: cardsSpring,
            transform: `translateY(${(1 - cardsSpring) * 25}px)`,
            maxWidth: 1400,
          }}
        >
          <div
            style={{
              flex: 1,
              padding: "20px 28px",
              borderRadius: 18,
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(56, 189, 248, 0.35)",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#38bdf8", fontWeight: 800, fontSize: 26, marginBottom: 4 }}>
              ⚡ 3x Lebih Cepat
            </div>
            <div style={{ fontSize: 14, color: "#cbd5e1" }}>
              Antrean resep instan tanpa jeda manual
            </div>
          </div>

          <div
            style={{
              flex: 1,
              padding: "20px 28px",
              borderRadius: 18,
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(52, 211, 153, 0.35)",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#34d399", fontWeight: 800, fontSize: 26, marginBottom: 4 }}>
              🛡️ Zero Expired Terlewat
            </div>
            <div style={{ fontSize: 14, color: "#cbd5e1" }}>
              Otomasi FEFO & sistem peringatan dini
            </div>
          </div>

          <div
            style={{
              flex: 1,
              padding: "20px 28px",
              borderRadius: 18,
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(168, 85, 247, 0.35)",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#c084fc", fontWeight: 800, fontSize: 26, marginBottom: 4 }}>
              🎯 100% Akurat
            </div>
            <div style={{ fontSize: 14, color: "#cbd5e1" }}>
              Pemotongan stok presisi hingga butir terkecil
            </div>
          </div>
        </div>

        {/* Tech Stack Chips */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 32,
            opacity: cardsSpring,
          }}
        >
          <div
            style={{
              padding: "8px 18px",
              borderRadius: 12,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: 13,
              fontWeight: 600,
              color: "#94a3b8",
            }}
          >
            React 19 & Vite
          </div>
          <div
            style={{
              padding: "8px 18px",
              borderRadius: 12,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: 13,
              fontWeight: 600,
              color: "#94a3b8",
            }}
          >
            Node.js & Express
          </div>
          <div
            style={{
              padding: "8px 18px",
              borderRadius: 12,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: 13,
              fontWeight: 600,
              color: "#94a3b8",
            }}
          >
            Socket.io WebSockets
          </div>
          <div
            style={{
              padding: "8px 18px",
              borderRadius: 12,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: 13,
              fontWeight: 600,
              color: "#94a3b8",
            }}
          >
            SQLite / PostgreSQL
          </div>
        </div>
      </div>

      <Captions
        badge="Kesimpulan"
        text="Dari peresepan hingga penyerahan obat, Klinik Almedika mengubah operasional klinik menjadi lebih cepat, aman, dan tanpa celah."
      />
    </div>
  );
};
