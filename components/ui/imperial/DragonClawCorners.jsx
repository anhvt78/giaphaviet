export default function DragonClawCorners({ color = "#C8960C", size = 40 }) {
  const corners = [
    { cls: "top-0 left-0",     style: {} },
    { cls: "top-0 right-0",    style: { transform: "scaleX(-1)" } },
    { cls: "bottom-0 left-0",  style: { transform: "scaleY(-1)" } },
    { cls: "bottom-0 right-0", style: { transform: "scale(-1,-1)" } },
  ];

  return (
    <>
      {corners.map(({ cls, style }, idx) => (
        <svg
          key={idx}
          className={`absolute ${cls} z-10 pointer-events-none`}
          width={size}
          height={size}
          viewBox="0 0 212 196"
          fill="none"
          style={style}
          aria-hidden="true"
        >
          <line x1="6"        y1="196"    x2="6"        y2="96"     stroke={color} strokeWidth="4"/>
          <line x1="8"        y1="98"     x2="17"       y2="98"     stroke={color} strokeWidth="4"/>
          <line x1="15"       y1="100"    x2="15"       y2="76"     stroke={color} strokeWidth="4"/>
          <line x1="16"       y1="78"     x2="7"        y2="78"     stroke={color} strokeWidth="4"/>
          <line x1="6"        y1="76"     x2="6"        y2="88"     stroke={color} strokeWidth="4"/>
          <line x1="3.98811"  y1="88.5"   x2="25.0119"  y2="88.5"   stroke={color} strokeWidth="4"/>
          <line x1="23"       y1="87"     x2="23"       y2="63"     stroke={color} strokeWidth="4"/>
          <line x1="22"       y1="65"     x2="1"        y2="65"     stroke={color} strokeWidth="4"/>
          <line x1="3"        y1="64"     x2="3"        y2="40"     stroke={color} strokeWidth="4"/>
          <line x1="5"        y1="42"     x2="44"       y2="42"     stroke={color} strokeWidth="4"/>
          <line x1="42"       y1="40"     x2="42"       y2="4"      stroke={color} strokeWidth="4"/>
          <line x1="40"       y1="2"      x2="64"       y2="2"      stroke={color} strokeWidth="4"/>
          <line x1="64"       y1="0"      x2="64"       y2="24"     stroke={color} strokeWidth="4"/>
          <line x1="64"       y1="22"     x2="88"       y2="22"     stroke={color} strokeWidth="4"/>
          <line x1="87"       y1="24"     x2="87"       y2="6"      stroke={color} strokeWidth="4"/>
          <line x1="89"       y1="6"      x2="77"       y2="6"      stroke={color} strokeWidth="4"/>
          <line x1="76"       y1="4"      x2="76"       y2="16"     stroke={color} strokeWidth="4"/>
          <line x1="76"       y1="14"     x2="100"      y2="14"     stroke={color} strokeWidth="4"/>
          <line x1="99"       y1="16"     x2="99"       y2="7"      stroke={color} strokeWidth="4"/>
          <line x1="97"       y1="6"      x2="212"      y2="6"      stroke={color} strokeWidth="4"/>
          <line x1="2"        y1="1"      x2="2"        y2="32"     stroke={color} strokeWidth="4"/>
          <line x1="4"        y1="3"      x2="29"       y2="3"      stroke={color} strokeWidth="4"/>
          <line x1="27"       y1="3"      x2="27"       y2="55"     stroke={color} strokeWidth="4"/>
          <line x1="29"       y1="53"     x2="17"       y2="53"     stroke={color} strokeWidth="4"/>
          <line x1="15"       y1="55"     x2="15"       y2="16"     stroke={color} strokeWidth="4"/>
          <line x1="16"       y1="18"     x2="56"       y2="18"     stroke={color} strokeWidth="4"/>
          <line x1="54"       y1="16"     x2="54"       y2="28"     stroke={color} strokeWidth="4"/>
          <line x1="56"       y1="30"     x2="3"        y2="30"     stroke={color} strokeWidth="4"/>
        </svg>
      ))}
    </>
  );
}
