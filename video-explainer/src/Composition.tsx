import React from "react";
import { Composition, Series } from "remotion";
import { ProScene1Hook } from "./scenes/ProScene1Hook";
import { ProScene2Roles } from "./scenes/ProScene2Roles";
import { ProScene3Doctor } from "./scenes/ProScene3Doctor";
import { ProScene4Pharmacy } from "./scenes/ProScene4Pharmacy";
import { ProScene5Logistics } from "./scenes/ProScene5Logistics";
import { ProScene6Outro } from "./scenes/ProScene6Outro";

export const PRO_DURATIONS = {
  scene1: 675, // 22.5s
  scene2: 510, // 17.0s
  scene3: 540, // 18.0s
  scene4: 675, // 22.5s
  scene5: 480, // 16.0s
  scene6: 555, // 18.5s
};

export const PRO_TOTAL_DURATION =
  PRO_DURATIONS.scene1 +
  PRO_DURATIONS.scene2 +
  PRO_DURATIONS.scene3 +
  PRO_DURATIONS.scene4 +
  PRO_DURATIONS.scene5 +
  PRO_DURATIONS.scene6;

export const ProMainExplainer: React.FC = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={PRO_DURATIONS.scene1}>
        <ProScene1Hook />
      </Series.Sequence>

      <Series.Sequence durationInFrames={PRO_DURATIONS.scene2}>
        <ProScene2Roles />
      </Series.Sequence>

      <Series.Sequence durationInFrames={PRO_DURATIONS.scene3}>
        <ProScene3Doctor />
      </Series.Sequence>

      <Series.Sequence durationInFrames={PRO_DURATIONS.scene4}>
        <ProScene4Pharmacy />
      </Series.Sequence>

      <Series.Sequence durationInFrames={PRO_DURATIONS.scene5}>
        <ProScene5Logistics />
      </Series.Sequence>

      <Series.Sequence durationInFrames={PRO_DURATIONS.scene6}>
        <ProScene6Outro />
      </Series.Sequence>
    </Series>
  );
};

export const MyComposition: React.FC = () => {
  return (
    <Composition
      id="KlinikAlmedikaProExplainer"
      component={ProMainExplainer}
      durationInFrames={PRO_TOTAL_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
