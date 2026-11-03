import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

interface CaptionsProps {
  text: string;
  badge?: string;
}

export const Captions: React.FC<CaptionsProps> = ({ text, badge }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 50,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 50,
        padding: "0 60px",
        transform: `translateY(${(1 - entrance) * 30}px)`,
        opacity: entrance,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          backgroundColor: "rgba(10, 20, 40, 0.82)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          borderRadius: 24,
          padding: "16px 28px",
          boxShadow: "0 12px 36px -4px rgba(0, 0, 0, 0.5), 0 0 20px rgba(14, 165, 233, 0.15)",
          maxWidth: 1400,
        }}
      >
        {badge && (
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              padding: "6px 14px",
              borderRadius: 12,
              backgroundColor: "rgba(14, 165, 233, 0.2)",
              color: "#38bdf8",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              whiteSpace: "nowrap",
            }}
          >
            {badge}
          </div>
        )}
        <p
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 500,
            color: "#f8fafc",
            lineHeight: 1.45,
            textAlign: "center",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
};
