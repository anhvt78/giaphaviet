// 回字纹 (Huí zì wén) — imperial meander border strip
export default function HuiZiWenBorder({
  id = "huiZi",
  height = 30,
  barHeight = 5,
  strokeWidth = 2.5,
  strokeColor = "#D4AF37",
  bgColor = "#5C0A0A",
  barColor = "#D4AF37",
  className = "",
}) {
  const bandH = height - barHeight * 2;
  const halfBand = bandH / 2;
  return (
    <svg
      className={`w-full flex-shrink-0 ${className}`}
      height={height}
      preserveAspectRatio="none"
      viewBox={`0 0 400 ${height}`}
      aria-hidden="true"
    >
      <defs>
        <pattern id={id} width="24" height={bandH} patternUnits="userSpaceOnUse" x="0" y={barHeight}>
          <path
            d={`M 0,${bandH} L 0,0 L 8,0 L 8,${halfBand} L 16,${halfBand} L 16,0 L 24,0`}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="miter"
          />
        </pattern>
      </defs>
      <rect width="400" height={height} fill={bgColor} />
      <rect x="0" y="0" width="400" height={barHeight} fill={barColor} />
      <rect x="0" y={barHeight} width="400" height={bandH} fill={`url(#${id})`} />
      <rect x="0" y={height - barHeight} width="400" height={barHeight} fill={barColor} />
    </svg>
  );
}
