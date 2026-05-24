// Corner ornament: thick L-bracket + round medallion (concentric circles + cardinal ticks)
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
  const r = 20;

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
          <path d={`M0,${H} L0,0 L${W},0`} stroke={bracketColor} strokeWidth="5" strokeLinejoin="miter" />
          <path d={`M0,${H - 6} L0,8 L${W - 8},8`} stroke={bracketColor} strokeWidth="2" strokeLinejoin="miter" opacity="0.55" />
        </>
      ) : (
        <>
          <path d={`M${W},${H} L${W},0 L0,0`} stroke={bracketColor} strokeWidth="5" strokeLinejoin="miter" />
          <path d={`M${W},${H - 6} L${W},8 L8,8`} stroke={bracketColor} strokeWidth="2" strokeLinejoin="miter" opacity="0.55" />
        </>
      )}
      <circle cx={cx} cy={cy} r={r} fill={medallionBg} stroke={bracketColor} strokeWidth="3" />
      <circle cx={cx} cy={cy} r="14" fill="none" stroke={bracketColor} strokeWidth="1.8" />
      <circle cx={cx} cy={cy} r="7" fill={bracketColor} />
      <circle cx={cx} cy={cy} r="3.5" fill={medallionBg} />
      {/* Cardinal ticks */}
      <line x1={cx} y1={cy - r} x2={cx} y2={cy - 14} stroke={bracketColor} strokeWidth="2.5" />
      <line x1={cx} y1={cy + 14} x2={cx} y2={cy + r} stroke={bracketColor} strokeWidth="2.5" />
      <line x1={cx - r} y1={cy} x2={cx - 14} y2={cy} stroke={bracketColor} strokeWidth="2.5" />
      <line x1={cx + 14} y1={cy} x2={cx + r} y2={cy} stroke={bracketColor} strokeWidth="2.5" />
    </svg>
  );
}
