import { useMemo, useContext } from "react";
import { ThemeContext } from "../context/ThemeProvider";

const RADAR_COLORS = [
  "#534AB7",
  "#1D9E75",
  "#185FA5",
  "#BA7517",
  "#D85A30",
  "#993556",
  "#3AAFA3",
  "#7B68EE",
];

const GenreRadarChart = ({ profile, size = 320 }) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const center = size / 2;
  const maxRadius = (size / 2) * 0.7;
  const levels = 5;

  const points = useMemo(() => {
    if (!profile || profile.length === 0) return [];
    const n = profile.length;
    return profile.map((genre, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = (genre.normalized || genre.pct / 100) * maxRadius;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
        genre,
        angle,
      };
    });
  }, [profile, center, maxRadius]);

  const gridRings = useMemo(() => {
    return Array(levels)
      .fill(0)
      .map((_, i) => {
        const r = (maxRadius * (i + 1)) / levels;
        const points = Array(profile.length || 6)
          .fill(0)
          .map((_, j) => {
            const angle = (Math.PI * 2 * j) / (profile.length || 6) - Math.PI / 2;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          });
        return points.join(" ");
      });
  }, [levels, profile.length, center, maxRadius]);

  const labelRadius = maxRadius + 24;

  if (!profile || profile.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-400 text-sm"
        style={{ width: size, height: size }}>
        No genre data
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <svg width={size} height={size} className="overflow-visible">
        {gridRings.map((ring, i) => (
          <polygon
            key={i}
            points={ring}
            fill="none"
            stroke={isDark ? "#4B5563" : "#9CA3AF"}
            strokeWidth="0.5"
          />
        ))}

        {points.map((_, i) => {
          const angle = (Math.PI * 2 * i) / points.length - Math.PI / 2;
          const x2 = center + maxRadius * Math.cos(angle);
          const y2 = center + maxRadius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke={isDark ? "#4B5563" : "#9CA3AF"}
              strokeWidth="0.5"
            />
          );
        })}

        <polygon
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill={RADAR_COLORS[0]}
          fillOpacity={isDark ? "0.25" : "0.4"}
          stroke={RADAR_COLORS[0]}
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill={RADAR_COLORS[i % RADAR_COLORS.length]}
            stroke={isDark ? "white" : "#F3F4F6"}
            strokeWidth="2"
          />
        ))}

        {points.map((p, i) => {
          const labelX = center + labelRadius * Math.cos(p.angle);
          const labelY = center + labelRadius * Math.sin(p.angle);
          const anchor =
            Math.cos(p.angle) > 0.1
              ? "start"
              : Math.cos(p.angle) < -0.1
              ? "end"
              : "middle";
          return (
            <text
              key={i}
              x={labelX}
              y={labelY}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="text-[10px] font-medium"
              fill={isDark ? "#D1D5DB" : "#4B5563"}>
              {p.genre.name}
            </text>
          );
        })}

        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs font-medium"
          fill={isDark ? "#9CA3AF" : "#6B7280"}>
          Taste
        </text>
      </svg>
    </div>
  );
};

export default GenreRadarChart;
