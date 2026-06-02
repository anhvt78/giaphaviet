// 回字纹 — imperial diamond-necklace border strip
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
  const hb = bandH / 2;
  // All measures scale from halfBand
  const lhH = hb * 0.70;  // large diamond half-height
  const lhW = hb * 0.50;  // large diamond half-width
  const lX  = hb * 1.00;  // large diamond x-center
  const shS = hb * 0.30;  // small diamond half-size
  const sX  = hb * 2.70;  // small diamond x-center
  const tW  = hb * 3.60;  // tile width

  return (
    <svg
      className={`w-full flex-shrink-0 ${className}`}
      height={height}
      preserveAspectRatio="none"
      viewBox={`0 0 400 ${height}`}
      aria-hidden="true"
    >
      <defs>
        <pattern id={id} width={tW} height={bandH} patternUnits="userSpaceOnUse" x="0" y={barHeight}>
          {/* Hairline connecting the diamonds */}
          <line x1="0" y1={hb} x2={tW} y2={hb} stroke={strokeColor} strokeWidth="0.65" opacity="0.4"/>
          {/* Large diamond */}
          <path
            d={`M ${lX},${hb-lhH} L ${lX+lhW},${hb} L ${lX},${hb+lhH} L ${lX-lhW},${hb} Z`}
            fill={strokeColor}
            opacity="0.92"
          />
          {/* Center hole */}
          <circle cx={lX} cy={hb} r={hb * 0.18} fill={bgColor}/>
          {/* Tick marks to band top/bottom */}
          <line x1={lX} y1="0" x2={lX} y2={hb-lhH} stroke={strokeColor} strokeWidth="0.8" opacity="0.5"/>
          <line x1={lX} y1={hb+lhH} x2={lX} y2={bandH} stroke={strokeColor} strokeWidth="0.8" opacity="0.5"/>
          {/* Small accent diamond */}
          <path
            d={`M ${sX},${hb-shS} L ${sX+shS},${hb} L ${sX},${hb+shS} L ${sX-shS},${hb} Z`}
            fill={strokeColor}
            opacity="0.78"
          />
          {/* Center hole in small diamond */}
          <circle cx={sX} cy={hb} r={hb * 0.10} fill={bgColor}/>
        </pattern>
      </defs>

      {/* Background */}
      <rect width="400" height={height} fill={bgColor}/>

      {/* Top gold bar */}
      <rect x="0" y="0" width="400" height={barHeight} fill={barColor}/>

      {/* Diamond pattern band */}
      <rect x="0" y={barHeight} width="400" height={bandH} fill={`url(#${id})`}/>

      {/* Subtle inner lines flanking the band */}
      <line x1="0" y1={barHeight + 2}          x2="400" y2={barHeight + 2}          stroke={strokeColor} strokeWidth="0.45" opacity="0.3"/>
      <line x1="0" y1={height - barHeight - 2}  x2="400" y2={height - barHeight - 2}  stroke={strokeColor} strokeWidth="0.45" opacity="0.3"/>

      {/* Bottom gold bar */}
      <rect x="0" y={height - barHeight} width="400" height={barHeight} fill={barColor}/>
    </svg>
  );
}
