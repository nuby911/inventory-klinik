import React from "react";
import {
  Audio,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  Building2,
  FileText,
  Pill,
  Printer,
  RefreshCw,
  Search,
  Stethoscope,
  TrendingUp,
  UserCheck,
  Zap,
} from "lucide-react";
import { Background } from "../components/Background";
import { Captions } from "../components/Captions";

export const Scene3Roles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const card1Spring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const card2Spring = spring({
    frame: frame - 25,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const card3Spring = spring({
    frame: frame - 40,
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
      <Audio src={staticFile("audio/scene3_roles.mp3")} />
      <Background />

      {/* Header */}
      <div
        style={{
          textAlign: "center",
          opacity: titleSpring,
          transform: `translateY(${(1 - titleSpring) * 20}px)`,
          zIndex: 10,
          marginBottom: 40,
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
          Kolaborasi Multi-Peran
        </span>
        <h2
          style={{
            fontSize: 48,
            fontWeight: 800,
            margin: "14px 0 0 0",
            letterSpacing: -1,
          }}
        >
          3 Pilar Pengguna Terintegrasi
        </h2>
      </div>

      {/* 3 Role Cards Grid */}
      <div
        style={{
          display: "flex",
          gap: 28,
          zIndex: 10,
          maxWidth: 1600,
          width: "100%",
          padding: "0 40px",
        }}
      >
        {/* Role 1: Dokter */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 25, 45, 0.8)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            borderRadius: 24,
            padding: 30,
            boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
            opacity: card1Spring,
            transform: `translateY(${(1 - card1Spring) * 40}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 20,
              borderBottom: "1px solid rgba(56, 189, 248, 0.2)",
              paddingBottom: 16,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: "rgba(14, 165, 233, 0.2)",
                border: "1px solid rgba(56, 189, 248, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Stethoscope size={28} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#ffffff" }}>
                Dokter
              </h3>
              <span style={{ fontSize: 13, color: "#38bdf8", fontWeight: 600 }}>
                Modul Klinis & E-Resep
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Search size={18} color="#38bdf8" />
              <span style={{ fontSize: 15, color: "#cbd5e1" }}>Pencarian Pasien & No. RM</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <TrendingUp size={18} color="#38bdf8" />
              <span style={{ fontSize: 15, color: "#cbd5e1" }}>Katalog Stok Obat Live</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FileText size={18} color="#38bdf8" />
              <span style={{ fontSize: 15, color: "#cbd5e1" }}>Resep Standar & Racikan</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Zap size={18} color="#38bdf8" />
              <span style={{ fontSize: 15, color: "#cbd5e1" }}>Kirim Resep via Socket.io</span>
            </div>
          </div>
        </div>

        {/* Role 2: Apoteker */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 30, 40, 0.8)",
            border: "1px solid rgba(52, 211, 153, 0.3)",
            borderRadius: 24,
            padding: 30,
            boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
            opacity: card2Spring,
            transform: `translateY(${(1 - card2Spring) * 40}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 20,
              borderBottom: "1px solid rgba(52, 211, 153, 0.2)",
              paddingBottom: 16,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: "rgba(16, 185, 129, 0.2)",
                border: "1px solid rgba(52, 211, 153, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Pill size={28} color="#34d399" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#ffffff" }}>
                Apoteker
              </h3>
              <span style={{ fontSize: 13, color: "#34d399", fontWeight: 600 }}>
                Dispensing & Farmasi
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Zap size={18} color="#34d399" />
              <span style={{ fontSize: 15, color: "#cbd5e1" }}>Antrean Resep Live Socket.io</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <UserCheck size={18} color="#34d399" />
              <span style={{ fontSize: 15, color: "#cbd5e1" }}>Dispensing Obat & Cut Stock</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Printer size={18} color="#34d399" />
              <span style={{ fontSize: 15, color: "#cbd5e1" }}>Cetak Etiket Aturan Pakai</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <RefreshCw size={18} color="#34d399" />
              <span style={{ fontSize: 15, color: "#cbd5e1" }}>Retur & Catat Obat Rusak</span>
            </div>
          </div>
        </div>

        {/* Role 3: Admin */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(25, 20, 45, 0.8)",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            borderRadius: 24,
            padding: 30,
            boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
            opacity: card3Spring,
            transform: `translateY(${(1 - card3Spring) * 40}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 20,
              borderBottom: "1px solid rgba(168, 85, 247, 0.2)",
              paddingBottom: 16,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: "rgba(168, 85, 247, 0.2)",
                border: "1px solid rgba(168, 85, 247, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Building2 size={28} color="#c084fc" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#ffffff" }}>
                Admin & Logistik
              </h3>
              <span style={{ fontSize: 13, color: "#c084fc", fontWeight: 600 }}>
                Master Inventori & Kontrol
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Building2 size={18} color="#c084fc" />
              <span style={{ fontSize: 15, color: "#cbd5e1" }}>Master Obat Multi-Satuan</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <RefreshCw size={18} color="#c084fc" />
              <span style={{ fontSize: 15, color: "#cbd5e1" }}>Restock Batch & Expired Date</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <TrendingUp size={18} color="#c084fc" />
              <span style={{ fontSize: 15, color: "#cbd5e1" }}>Peringatan Stok Kritis (H-90)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FileText size={18} color="#c084fc" />
              <span style={{ fontSize: 15, color: "#cbd5e1" }}>Stok Opname & Audit Trail</span>
            </div>
          </div>
        </div>
      </div>

      <Captions
        badge="Akses Pengguna"
        text="Sistem mengintegrasikan tiga peran utama secara harmonis. Dokter menulis E-Resep dengan pantauan stok live, Apoteker memproses obat seketika, dan Admin mengelola inventori menyeluruh."
      />
    </div>
  );
};
