// Phoenix divider — section break with detailed phoenix + layered cloud waves
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
      {/* Background divider line */}
      <line x1="0" y1="18" x2="800" y2="18" stroke={color} strokeWidth="0.7" opacity="0.22"/>

      {/* ── Body ── */}
      <ellipse cx="400" cy="17" rx="14" ry="7"   fill="none" stroke={color} strokeWidth="1.8" opacity="0.92"/>
      <ellipse cx="400" cy="17" rx="9"  ry="4.5" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4"/>

      {/* ── Left wing — 3 layers ── */}
      <path d="M386,17 Q366,5 342,10 Q358,14 386,17" fill="none" stroke={color} strokeWidth="1.5" opacity="0.88"/>
      <path d="M386,17 Q370,3 350,5 Q362,10 384,17"  fill="none" stroke={color} strokeWidth="0.9" opacity="0.6"/>
      <path d="M384,17 Q372,2 356,3 Q366,9 382,17"   fill="none" stroke={color} strokeWidth="0.6" opacity="0.4"/>
      {/* Left wing tip curls */}
      <path d="M342,10 Q332,14 330,18 Q336,13 342,10" fill="none" stroke={color} strokeWidth="0.85" opacity="0.5"/>
      <path d="M350,5 Q340,10 338,14 Q344,9 350,5"   fill="none" stroke={color} strokeWidth="0.7"  opacity="0.42"/>

      {/* ── Right wing — 3 layers ── */}
      <path d="M414,17 Q434,5 458,10 Q442,14 414,17" fill="none" stroke={color} strokeWidth="1.5" opacity="0.88"/>
      <path d="M414,17 Q430,3 450,5 Q438,10 416,17"  fill="none" stroke={color} strokeWidth="0.9" opacity="0.6"/>
      <path d="M416,17 Q428,2 444,3 Q434,9 418,17"   fill="none" stroke={color} strokeWidth="0.6" opacity="0.4"/>
      {/* Right wing tip curls */}
      <path d="M458,10 Q468,14 470,18 Q464,13 458,10" fill="none" stroke={color} strokeWidth="0.85" opacity="0.5"/>
      <path d="M450,5 Q460,10 462,14 Q456,9 450,5"   fill="none" stroke={color} strokeWidth="0.7"  opacity="0.42"/>

      {/* ── Tail — 5 main feathers ── */}
      <path d="M394,24 Q387,30 383,36" fill="none" stroke={color} strokeWidth="1.2" opacity="0.9"/>
      <path d="M397,25 Q392,31 390,36" fill="none" stroke={color} strokeWidth="1.2" opacity="0.9"/>
      <path d="M400,25 Q400,31 400,36" fill="none" stroke={color} strokeWidth="1.2" opacity="0.9"/>
      <path d="M403,25 Q408,31 410,36" fill="none" stroke={color} strokeWidth="1.2" opacity="0.9"/>
      <path d="M406,24 Q413,30 417,36" fill="none" stroke={color} strokeWidth="1.2" opacity="0.9"/>
      {/* 4 secondary tail feathers */}
      <path d="M391,24 Q383,29 379,35" fill="none" stroke={color} strokeWidth="0.75" opacity="0.52"/>
      <path d="M395,24 Q390,30 388,35" fill="none" stroke={color} strokeWidth="0.75" opacity="0.52"/>
      <path d="M405,24 Q410,30 412,35" fill="none" stroke={color} strokeWidth="0.75" opacity="0.52"/>
      <path d="M409,24 Q417,29 421,35" fill="none" stroke={color} strokeWidth="0.75" opacity="0.52"/>

      {/* ── Crest — 5 feathers ── */}
      <path d="M400,10 Q398,3 400,1 Q402,3 400,10" fill="none" stroke={accentColor} strokeWidth="1.6" opacity="0.9"/>
      <path d="M400,10 Q394,4 390,1"                fill="none" stroke={accentColor} strokeWidth="1.1" opacity="0.75"/>
      <path d="M400,10 Q406,4 410,1"                fill="none" stroke={accentColor} strokeWidth="1.1" opacity="0.75"/>
      <path d="M399,11 Q391,5 386,2"                fill="none" stroke={accentColor} strokeWidth="0.7" opacity="0.5"/>
      <path d="M401,11 Q409,5 414,2"                fill="none" stroke={accentColor} strokeWidth="0.7" opacity="0.5"/>

      {/* ── Eye ── */}
      <circle cx="406" cy="16" r="2.2" fill={accentColor}/>
      <circle cx="406" cy="16" r="1"   fill="#5C0A0A"/>

      {/* ── Cloud waves left — 2 layers ── */}
      <path d="M0,18 Q38,10 76,18 Q114,26 152,18 Q190,10 228,18 Q262,22 302,18 Q336,15 370,17 Q385,17.5 392,18"
            fill="none" stroke={color} strokeWidth="0.8" opacity="0.33"/>
      <path d="M0,18 Q40,13 80,18 Q120,23 160,18 Q200,13 236,18 Q268,21 304,18 Q336,16 368,17.5 Q382,17.8 390,18"
            fill="none" stroke={color} strokeWidth="0.4" opacity="0.18"/>

      {/* ── Cloud waves right — 2 layers ── */}
      <path d="M800,18 Q762,10 724,18 Q686,26 648,18 Q610,10 572,18 Q538,22 498,18 Q464,15 430,17 Q415,17.5 408,18"
            fill="none" stroke={color} strokeWidth="0.8" opacity="0.33"/>
      <path d="M800,18 Q760,13 720,18 Q680,23 640,18 Q600,13 564,18 Q532,21 496,18 Q464,16 432,17.5 Q418,17.8 410,18"
            fill="none" stroke={color} strokeWidth="0.4" opacity="0.18"/>
    </svg>
  );
}
