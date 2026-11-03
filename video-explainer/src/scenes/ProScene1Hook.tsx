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
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  FileQuestion,
  PackageX,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Background } from "../components/Background";
import { Captions } from "../components/Captions";

export const ProScene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrances
  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const card1 = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const card2 = spring({
    frame: frame - 90,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const card3 = spring({
    frame: frame - 180,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  // Climax reveal at frame 480 (~16s)
  const revealProgress = spring({
    frame: frame - 480,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const pulse = Math.sin(frame / 12) * 6;

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
      <Audio src={staticFile("audio/pro_scene1_hook.mp3")} />
      {frame === 480 && <Audio src={staticFile("audio/whoosh.wav")} />}
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
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 800,
            color: "#f87171",
            letterSpacing: 2,
            textTransform: "uppercase",
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            padding: "6px 18px",
            borderRadius: 100,
            border: "1px solid rgba(239, 68, 68, 0.35)",
            boxShadow: "0 0 20px rgba(239, 68, 68, 0.2)",
          }}
        >
          <AlertCircle size={15} /> Tantangan Nyata Klinik Konvensional
        </div>
        <h1
          style={{
            fontSize: 54,
            fontWeight: 900,
            margin: "16px 0 0 0",
            letterSpacing: -1,
            background: "linear-gradient(135deg, #ffffff 40%, #cbd5e1 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Mengapa Klinik Almedika Dibangun?
        </h1>
      </div>

      {/* 3 Pain Points Cards (Early Phase: 0 - 16s) */}
      <div
        style={{
          display: "flex",
          gap: 28,
          zIndex: 10,
          maxWidth: 1600,
          width: "100%",
          padding: "0 40px",
          opacity: interpolate(revealProgress, [0, 0.8], [1, 0.1]),
          transform: `scale(${interpolate(revealProgress, [0, 1], [1, 0.95])})`,
          pointerEvents: revealProgress > 0.5 ? "none" : "auto",
        }}
      >
        {/* Pain 1 */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(35, 20, 25, 0.85)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            borderRadius: 22,
            padding: 30,
            boxShadow: "0 20px 40px rgba(0,0,0,0.45)",
            opacity: card1,
            transform: `translateY(${(1 - card1) * 35}px)`,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: "rgba(239, 68, 68, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 18,
            }}
          >
            <PackageX size={28} color="#f87171" />
          </div>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fca5a5" }}>
            Resep Manual Tidak Terbaca
          </h3>
          <p style={{ margin: "12px 0 0 0", fontSize: 15, color: "#cbd5e1", lineHeight: 1.5 }}>
            Tulisan tangan resep kertas rawan salah tafsir. Berisiko fatal pada keselamatan pasien (medication error).
          </p>
        </div>

        {/* Pain 2 */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(35, 25, 20, 0.85)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            borderRadius: 22,
            padding: 30,
            boxShadow: "0 20px 40px rgba(0,0,0,0.45)",
            opacity: card2,
            transform: `translateY(${(1 - card2) * 35}px)`,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: "rgba(245, 158, 11, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 18,
            }}
          >
            <FileQuestion size={28} color="#fbbf24" />
          </div>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fcd34d" }}>
            Stok Dokter Tidak Sinkron
          </h3>
          <p style={{ margin: "12px 0 0 0", fontSize: 15, color: "#cbd5e1", lineHeight: 1.5 }}>
            Dokter meresepkan obat tanpa tahu stok aslinya. Pasien sudah mengantre lama, ternyata obat kosong di apotek.
          </p>
        </div>

        {/* Pain 3 */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(35, 20, 25, 0.85)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            borderRadius: 22,
            padding: 30,
            boxShadow: "0 20px 40px rgba(0,0,0,0.45)",
            opacity: card3,
            transform: `translateY(${(1 - card3) * 35}px)`,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: "rgba(239, 68, 68, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 18,
            }}
          >
            <ShieldAlert size={28} color="#f87171" />
          </div>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fca5a5" }}>
            Obat Kadaluarsa Terlewat
          </h3>
          <p style={{ margin: "12px 0 0 0", fontSize: 15, color: "#cbd5e1", lineHeight: 1.5 }}>
            Masa expired batch sulit dilacak manual. Menumpuk di rak hingga kadaluarsa dan merugikan jutaan rupiah.
          </p>
        </div>
      </div>

      {/* Climax Transformation Overlay: The Solution Reveal (After 16s) */}
      {revealProgress > 0.01 && (
        <div
          style={{
            position: "absolute",
            top: 260,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 30,
            transform: `scale(${revealProgress})`,
            opacity: revealProgress,
          }}
        >
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: 32,
              backgroundColor: "rgba(14, 165, 233, 0.2)",
              border: "2px solid rgba(56, 189, 248, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 ${40 + pulse}px rgba(14, 165, 233, 0.5)`,
              marginBottom: 20,
            }}
          >
            <Img
              src={staticFile("logo.png")}
              style={{ width: 110, height: 110, objectFit: "contain", borderRadius: 20 }}
            />
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: 56,
              fontWeight: 900,
              letterSpacing: -1,
              background: "linear-gradient(135deg, #ffffff 40%, #38bdf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            KLINIK ALMEDIKA
          </h2>

          <div
            style={{
              marginTop: 12,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 24px",
              borderRadius: 100,
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              color: "#34d399",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            <Sparkles size={18} /> Solusi SIM Farmasi & Rawat Jalan Terpadu
          </div>
        </div>
      )}

      <Captions
        badge="Latar Belakang"
        text={
          frame < 480
            ? "Pernahkah Anda membayangkan betapa rawannya resep obat manual di klinik? Tulisan tangan sulit dibaca, stok di apotek kosong, dan obat kadaluarsa lolos tanpa terpantau..."
            : "Inilah alasan mengapa Klinik Almedika dibangun: Menghubungkan Dokter, Apotek, dan Logistik dalam satu sistem terintegrasi."
        }
      />
    </div>
  );
};
