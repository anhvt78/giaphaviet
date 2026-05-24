// Phoenix divider — section break with phoenix center motif + cloud waves
export default function PhoenixDivider({
  color = "#C8960C",
  accentColor = "#D4AF37",
  height = 36,
  className = "",
}) {
  return (
    <svg
      className={`w-full ${className}`}
      height={height}
      viewBox="0 0 800 36"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line x1="0" y1="18" x2="800" y2="18" stroke={color} strokeWidth="0.8" opacity="0.35" />
      <ellipse cx="400" cy="16" rx="14" ry="7" fill="none" stroke={color} strokeWidth="1.6" opacity="0.85" />
      <path d="M386,16 Q366,5 344,11 Q360,14 386,16" fill="none" stroke={color} strokeWidth="1.3" opacity="0.75" />
      <path d="M414,16 Q434,5 456,11 Q440,14 414,16" fill="none" stroke={color} strokeWidth="1.3" opacity="0.75" />
      <path d="M396,23 Q387,33 374,31 Q386,27 396,23" fill="none" stroke={color} strokeWidth="1.2" opacity="0.65" />
      <path d="M404,23 Q413,33 426,31 Q414,27 404,23" fill="none" stroke={color} strokeWidth="1.2" opacity="0.65" />
      <path d="M399,25 Q397,35 394,33 Q397,29 399,25" fill="none" stroke={accentColor} strokeWidth="1" opacity="0.7" />
      <path d="M401,25 Q403,35 406,33 Q403,29 401,25" fill="none" stroke={accentColor} strokeWidth="1" opacity="0.7" />
      <path d="M397,10 Q396,3 400,1 Q404,3 403,10" fill="none" stroke={accentColor} strokeWidth="1.3" opacity="0.75" />
      <circle cx="404" cy="14" r="2" fill={accentColor} opacity="0.85" />
      <path d="M0,18 Q40,10 80,18 Q120,26 160,18 Q200,10 240,18 Q280,24 340,18 Q360,16 382,18" fill="none" stroke={color} strokeWidth="0.7" opacity="0.3" />
      <path d="M800,18 Q760,10 720,18 Q680,26 640,18 Q600,10 560,18 Q520,24 460,18 Q440,16 418,18" fill="none" stroke={color} strokeWidth="0.7" opacity="0.3" />
    </svg>
  );
}
