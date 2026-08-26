import { ImageResponse } from "next/og";

export const alt = "SelfMastery — 30 Days. One Meaningful Change.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The link preview. Generated rather than shipped as a binary so it stays in
 * step with the wording, and drawn in the product's own palette.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background:
            "radial-gradient(ellipse 90% 70% at 50% -10%, #353b80, #262a60 55%, #101120 100%)",
          color: "#e9e9ed",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: 6,
            color: "#d2cefd",
            display: "flex",
          }}
        >
          SELFMASTERY 30
        </div>
        <div
          style={{
            fontSize: 76,
            lineHeight: 1.1,
            marginTop: 28,
            maxWidth: 900,
            letterSpacing: -2,
            display: "flex",
          }}
        >
          Become the person you keep saying you want to be.
        </div>
        <div
          style={{
            fontSize: 30,
            marginTop: 32,
            color: "#b5afe8",
            maxWidth: 820,
            display: "flex",
          }}
        >
          One meaningful goal, turned into small daily actions you can actually
          follow.
        </div>
      </div>
    ),
    size
  );
}
