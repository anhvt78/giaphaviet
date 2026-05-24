// Coiling dragon watermark — sinuous S-curve body with horns, claws, tail
export default function DragonWatermark({
  opacity = 0.04,
  color = "#D4AF37",
  className = "",
}) {
  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      viewBox="0 0 200 420"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity }}
      aria-hidden="true"
    >
      <path
        d="M130,35 C178,65 178,130 130,160 C82,190 82,255 130,285 C178,315 178,380 130,410"
        fill="none" stroke={color} strokeWidth="24" strokeLinecap="round"
      />
      <ellipse cx="130" cy="35" rx="20" ry="14" fill={color} />
      <path d="M119,25 Q110,4 106,17" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M141,25 Q150,4 154,17" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M112,40 Q92,55 98,68" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M126,46 Q112,64 116,76" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M148,88 C162,100 148,112 162,124" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <path d="M112,128 C98,140 112,152 98,164" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <path d="M148,208 C162,220 148,232 162,244" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <path d="M112,248 C98,260 112,272 98,284" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <path d="M148,324 C162,336 148,348 162,360" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <path d="M158,110 L182,96 M182,96 L196,88 M182,96 L188,110 M182,96 L198,100" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M102,250 L78,236 M78,236 L64,228 M78,236 L72,250 M78,236 L62,240" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M130,410 C112,440 88,432 106,414" stroke={color} strokeWidth="12" fill="none" strokeLinecap="round" />
      <path d="M106,414 C88,400 74,412 92,422" stroke={color} strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M92,422 C78,418 70,428 84,432" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  );
}
