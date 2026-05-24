import DragonClawCorners from "./DragonClawCorners";

// Imperial card: top gold bar + dragon claw corners
export default function ImperialCard({ children, className = "" }) {
  return (
    <div className={`bg-[#FEFBF0] border border-[#8B1A1A]/25 shadow-sm relative overflow-hidden ${className}`}>
      <div className="h-[3px] bg-gradient-to-r from-[#6B0000] via-[#C8960C] to-[#6B0000] flex-shrink-0" />
      <DragonClawCorners size={32} />
      {children}
    </div>
  );
}
