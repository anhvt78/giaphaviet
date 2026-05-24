// Section header: imperial red square numeral + title + gold gradient line
export default function ImperialSectionHeader({ numeral, title, editButton }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="w-7 h-7 border-2 border-[#C8960C] bg-[#8B1A1A] text-[#C8960C] flex items-center justify-center text-[10px] font-black flex-shrink-0 relative">
        {numeral}
        <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-[#D4AF37]/60" />
        <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-[#D4AF37]/60" />
        <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-[#D4AF37]/60" />
        <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-[#D4AF37]/60" />
      </span>
      <span className="text-[12px] font-bold text-[#8B1A1A] uppercase tracking-[0.22em]">
        {title}
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-[#C8960C]/50 to-transparent" />
      {editButton}
    </div>
  );
}
