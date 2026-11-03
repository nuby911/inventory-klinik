import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export const Background: React.FC = () => {
  const frame = useCurrentFrame();

  const orb1X = interpolate(Math.sin(frame / 60), [-1, 1], [15, 35]);
  const orb1Y = interpolate(Math.cos(frame / 70), [-1, 1], [20, 40]);

  const orb2X = interpolate(Math.sin(frame / 80 + 2), [-1, 1], [65, 85]);
  const orb2Y = interpolate(Math.cos(frame / 65 + 1), [-1, 1], [60, 80]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#070D1E",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      {/* Ambient Radial Gradients */}
      <div
        style={{
          position: "absolute",
          left: `${orb1X}%`,
          top: `${orb1Y}%`,
          width: 800,
          height: 800,
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, rgba(14, 165, 233, 0) 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `${orb2X}%`,
          top: `${orb2Y}%`,
          width: 900,
          height: 900,
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0) 70%)",
          filter: "blur(50px)",
        }}
      />

      {/* Subtle Grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse 90% 80% at 50% 50%, #000 60%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 80% at 50% 50%, #000 60%, transparent 100%)",
        }}
      />

      {/* Top ambient glow line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background:
            "linear-gradient(90deg, transparent, #0284c7, #10b981, transparent)",
          opacity: 0.8,
        }}
      />
    </div>
  );
};
