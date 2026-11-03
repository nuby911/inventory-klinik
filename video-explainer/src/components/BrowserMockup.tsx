import React from "react";
import { Video } from "@remotion/media";
import { Lock, ShieldCheck, Wifi } from "lucide-react";
import { interpolate, staticFile, useCurrentFrame } from "remotion";

interface BrowserMockupProps {
  videoSrc: string;
  urlPath?: string;
  badgeText?: string;
  scale?: number;
  zoomInto?: { x: number; y: number; zoom: number };
}

export const BrowserMockup: React.FC<BrowserMockupProps> = ({
  videoSrc,
  urlPath = "sim-farmasi",
  badgeText = "LIVE SIM SYSTEM",
  scale = 1,
  zoomInto,
}) => {
  const frame = useCurrentFrame();
  const pulse = Math.sin(frame / 12) * 0.4 + 0.6;

  let transformStyle = `scale(${scale})`;
  if (zoomInto) {
    transformStyle = `scale(${zoomInto.zoom}) translate(${zoomInto.x}px, ${zoomInto.y}px)`;
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1560,
        height: 780,
        backgroundColor: "#0d1527",
        borderRadius: 22,
        border: "1.5px solid rgba(56, 189, 248, 0.35)",
        boxShadow:
          "0 30px 80px -15px rgba(0, 0, 0, 0.75), 0 0 35px rgba(14, 165, 233, 0.15)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Browser Title Bar */}
      <div
        style={{
          height: 48,
          backgroundColor: "#0a1122",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          zIndex: 20,
        }}
      >
        {/* Window controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#ef4444",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#f59e0b",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#10b981",
            }}
          />
        </div>

        {/* Address Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 10,
            padding: "5px 24px",
            fontSize: 13,
            color: "#94a3b8",
            fontFamily: "monospace",
          }}
        >
          <Lock size={13} color="#10b981" />
          <span>https://klinik-almedika.internal/{urlPath}</span>
        </div>

        {/* Live Status Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            padding: "4px 12px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            color: "#34d399",
            letterSpacing: 0.8,
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: "#10b981",
              opacity: pulse,
            }}
          />
          {badgeText}
        </div>
      </div>

      {/* Screen Viewport */}
      <div
        style={{
          flex: 1,
          backgroundColor: "#000000",
          overflow: "hidden",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: transformStyle,
            transition: "transform 0.4s ease-out",
          }}
        >
          <Video
            src={staticFile(videoSrc)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      </div>
    </div>
  );
};
