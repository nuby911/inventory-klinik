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
import { CheckCircle, Code, Cpu, Database, Heart, Sparkles } from "lucide-react";
import { Background } from "../components/Background";
import { Captions } from "../components/Captions";

export const Scene6Outro: React.FC = () => {
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

  const techSpring = spring({
    frame: frame - 25,
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
      <Audio src={staticFile("audio/scene6_outro.mp3")} />
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
        {/* Clinic Logo */}
        <div
          style={{
            position: "relative",
            width: 150,
            height: 150,
            borderRadius: 32,
            background:
              "linear-gradient(135deg, rgba(14, 165, 233, 0.3) 0%, rgba(16, 185, 129, 0.3) 100%)",
            border: "2px solid rgba(56, 189, 248, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 ${40 + pulse}px rgba(16, 185, 129, 0.4), 0 20px 40px rgba(0,0,0,0.5)`,
            transform: `scale(${logoSpring})`,
            marginBottom: 26,
          }}
        >
          <Img
            src={staticFile("logo.png")}
            style={{
              width: 120,
              height: 120,
              objectFit: "contain",
              borderRadius: 20,
            }}
          />
        </div>

        {/* Heading */}
        <div
          style={{
            opacity: textSpring,
            transform: `translateY(${(1 - textSpring) * 25}px)`,
            textAlign: "center",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 60,
              fontWeight: 900,
              letterSpacing: -1,
              background: "linear-gradient(135deg, #ffffff 40%, #34d399 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            KLINIK ALMEDIKA
          </h2>
          <p
            style={{
              margin: "12px 0 0 0",
              fontSize: 24,
              color: "#94a3b8",
              fontWeight: 500,
            }}
          >
            Modern, Efisien, dan Terpercaya
          </p>
        </div>

        {/* Modern Tech Stack Badges */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 40,
            opacity: techSpring,
            transform: `translateY(${(1 - techSpring) * 20}px)`,
          }}
        >
          <div
            style={{
              padding: "10px 20px",
              borderRadius: 14,
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              fontSize: 15,
              fontWeight: 600,
              color: "#38bdf8",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Code size={18} /> React 19 & Vite
          </div>

          <div
            style={{
              padding: "10px 20px",
              borderRadius: 14,
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              fontSize: 15,
              fontWeight: 600,
              color: "#34d399",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Cpu size={18} /> Node.js & Express
          </div>

          <div
            style={{
              padding: "10px 20px",
              borderRadius: 14,
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              fontSize: 15,
              fontWeight: 600,
              color: "#fbbf24",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Sparkles size={18} /> Socket.io Real-Time
          </div>

          <div
            style={{
              padding: "10px 20px",
              borderRadius: 14,
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(168, 85, 247, 0.3)",
              fontSize: 15,
              fontWeight: 600,
              color: "#c084fc",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Database size={18} /> SQLite & Postgres
          </div>
        </div>
      </div>

      <Captions
        badge="Penutup"
        text="Dibangun dengan React, Node.js, dan Tailwind CSS. Klinik Almedika, transformasi digital untuk layanan kesehatan prima."
      />
    </div>
  );
};
