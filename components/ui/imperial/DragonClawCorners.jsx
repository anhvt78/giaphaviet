// Four dragon claw corners — drop inside any relative-positioned card
export default function DragonClawCorners({
  color = "#C8960C",
  accentColor = "#D4AF37",
  size = 40,
}) {
  const s = size;
  const r = s * 0.075;
  const mid = s * 0.65;
  const near = s * 0.375;

  const TopLeft = () => (
    <svg className="absolute top-0 left-0 z-10 pointer-events-none" width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
      <path d={`M0,${s} L0,${s*0.15} Q0,0 ${s*0.15},0 L${s},0`} stroke={color} strokeWidth="1.8" opacity="0.85" />
      <path d={`M0,${mid} C${s*0.225},${s*0.475} ${s*0.5},${s*0.25} ${mid},0`} stroke={accentColor} strokeWidth="1.3" opacity="0.7" />
      <path d={`M0,${near} C${s*0.125},${s*0.275} ${s*0.275},${s*0.125} ${near},0`} stroke={accentColor} strokeWidth="1" opacity="0.5" />
      <circle cx={r*2} cy={r*2} r={r*2} fill={accentColor} opacity="0.85" />
    </svg>
  );

  const TopRight = () => (
    <svg className="absolute top-0 right-0 z-10 pointer-events-none" width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
      <path d={`M${s},${s} L${s},${s*0.15} Q${s},0 ${s*0.85},0 L0,0`} stroke={color} strokeWidth="1.8" opacity="0.85" />
      <path d={`M${s},${mid} C${s*0.775},${s*0.475} ${s*0.5},${s*0.25} ${s-mid},0`} stroke={accentColor} strokeWidth="1.3" opacity="0.7" />
      <path d={`M${s},${near} C${s*0.875},${s*0.275} ${s*0.725},${s*0.125} ${s-near},0`} stroke={accentColor} strokeWidth="1" opacity="0.5" />
      <circle cx={s - r*2} cy={r*2} r={r*2} fill={accentColor} opacity="0.85" />
    </svg>
  );

  const BottomLeft = () => (
    <svg className="absolute bottom-0 left-0 z-10 pointer-events-none" width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
      <path d={`M0,0 L0,${s*0.85} Q0,${s} ${s*0.15},${s} L${s},${s}`} stroke={color} strokeWidth="1.8" opacity="0.85" />
      <path d={`M0,${s-mid} C${s*0.225},${s*0.525} ${s*0.5},${s*0.75} ${mid},${s}`} stroke={accentColor} strokeWidth="1.3" opacity="0.7" />
      <path d={`M0,${s-near} C${s*0.125},${s*0.725} ${s*0.275},${s*0.875} ${near},${s}`} stroke={accentColor} strokeWidth="1" opacity="0.5" />
      <circle cx={r*2} cy={s - r*2} r={r*2} fill={accentColor} opacity="0.85" />
    </svg>
  );

  const BottomRight = () => (
    <svg className="absolute bottom-0 right-0 z-10 pointer-events-none" width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
      <path d={`M${s},0 L${s},${s*0.85} Q${s},${s} ${s*0.85},${s} L0,${s}`} stroke={color} strokeWidth="1.8" opacity="0.85" />
      <path d={`M${s},${s-mid} C${s*0.775},${s*0.525} ${s*0.5},${s*0.75} ${s-mid},${s}`} stroke={accentColor} strokeWidth="1.3" opacity="0.7" />
      <path d={`M${s},${s-near} C${s*0.875},${s*0.725} ${s*0.725},${s*0.875} ${s-near},${s}`} stroke={accentColor} strokeWidth="1" opacity="0.5" />
      <circle cx={s - r*2} cy={s - r*2} r={r*2} fill={accentColor} opacity="0.85" />
    </svg>
  );

  return (
    <>
      <TopLeft />
      <TopRight />
      <BottomLeft />
      <BottomRight />
    </>
  );
}
