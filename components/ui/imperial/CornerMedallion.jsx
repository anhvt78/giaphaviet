// Corner ornament: refined double-bracket + 8-petal lotus medallion
export default function CornerMedallion({
  side = "left",
  bracketColor = "#D4AF37",
  medallionBg = "#6B0000",
  className = "",
}) {
  const isLeft = side === "left";
  const W = 64, H = 52;
  const cx = isLeft ? 28 : 36;
  const cy = H / 2;
  const r = 19;

  return (
    <svg
      className={`absolute ${isLeft ? "left-0" : "right-0"} top-0 h-full w-16 pointer-events-none ${className}`}
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {isLeft ? (
        <>
          {/* Outer bracket */}
          <path d={`M0,${H} L0,0 L${W},0`} stroke={bracketColor} strokeWidth="3.5" strokeLinejoin="miter"/>
          {/* Inner echo */}
          <path d={`M3.5,${H - 5} L3.5,3.5 L${W},3.5`} stroke={bracketColor} strokeWidth="1.1" strokeLinejoin="miter" opacity="0.6"/>
          {/* Horizontal accent */}
          <line x1="3.5" y1="9" x2={W} y2="9" stroke={bracketColor} strokeWidth="0.7" opacity="0.35"/>
          {/* Side tick marks */}
          <line x1="0" y1={H * 0.28} x2="9" y2={H * 0.28} stroke={bracketColor} strokeWidth="1.1" opacity="0.55"/>
          <line x1="0" y1={H * 0.72} x2="9" y2={H * 0.72} stroke={bracketColor} strokeWidth="1.1" opacity="0.55"/>
        </>
      ) : (
        <>
          <path d={`M${W},${H} L${W},0 L0,0`} stroke={bracketColor} strokeWidth="3.5" strokeLinejoin="miter"/>
          <path d={`M${W - 3.5},${H - 5} L${W - 3.5},3.5 L0,3.5`} stroke={bracketColor} strokeWidth="1.1" strokeLinejoin="miter" opacity="0.6"/>
          <line x1="0" y1="9" x2={W - 3.5} y2="9" stroke={bracketColor} strokeWidth="0.7" opacity="0.35"/>
          <line x1={W - 9} y1={H * 0.28} x2={W} y2={H * 0.28} stroke={bracketColor} strokeWidth="1.1" opacity="0.55"/>
          <line x1={W - 9} y1={H * 0.72} x2={W} y2={H * 0.72} stroke={bracketColor} strokeWidth="1.1" opacity="0.55"/>
        </>
      )}

      {/* Medallion base circles */}
      <circle cx={cx} cy={cy} r={r}     fill={medallionBg} stroke={bracketColor} strokeWidth="2.2"/>
      <circle cx={cx} cy={cy} r={r - 5} fill="none"        stroke={bracketColor} strokeWidth="0.9" opacity="0.55"/>

      {/* 8-petal lotus — 4 cardinal petals */}
      <ellipse cx={cx}     cy={cy - 7} rx="2.5" ry="6.5" fill={bracketColor} opacity="0.9"/>
      <ellipse cx={cx + 7} cy={cy}     rx="6.5" ry="2.5" fill={bracketColor} opacity="0.9"/>
      <ellipse cx={cx}     cy={cy + 7} rx="2.5" ry="6.5" fill={bracketColor} opacity="0.9"/>
      <ellipse cx={cx - 7} cy={cy}     rx="6.5" ry="2.5" fill={bracketColor} opacity="0.9"/>
      {/* 4 diagonal petals */}
      <ellipse cx={cx + 5} cy={cy - 5} rx="2" ry="5" transform={`rotate(45,${cx + 5},${cy - 5})`}  fill={bracketColor} opacity="0.7"/>
      <ellipse cx={cx + 5} cy={cy + 5} rx="2" ry="5" transform={`rotate(-45,${cx + 5},${cy + 5})`} fill={bracketColor} opacity="0.7"/>
      <ellipse cx={cx - 5} cy={cy + 5} rx="2" ry="5" transform={`rotate(45,${cx - 5},${cy + 5})`}  fill={bracketColor} opacity="0.7"/>
      <ellipse cx={cx - 5} cy={cy - 5} rx="2" ry="5" transform={`rotate(-45,${cx - 5},${cy - 5})`} fill={bracketColor} opacity="0.7"/>

      {/* Center ring + dot */}
      <circle cx={cx} cy={cy} r="4.5" fill={bracketColor}/>
      <circle cx={cx} cy={cy} r="2.2" fill={medallionBg}/>
    </svg>
  );
}
