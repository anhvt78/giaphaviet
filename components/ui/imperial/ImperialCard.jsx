import DragonClawCorners from "./DragonClawCorners";

// Imperial card: top gold bar + dragon claw corners
export default function ImperialCard({
  children,
  className = "",
  style,
  showCorners = true,
}) {
  return (
    <div
      className={`bg-[#FEFBF0] shadow-sm relative overflow-hidden ${className}`}
      style={style}
    >
      {/* <div className="h-[3px] bg-gradient-to-r from-[#6B0000] via-[#C8960C] to-[#6B0000] flex-shrink-0" /> */}
      {showCorners && <DragonClawCorners size={32} />}
      {children}
    </div>
  );
}
