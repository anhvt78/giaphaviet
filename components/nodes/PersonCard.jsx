import React from "react";
import { formatDate } from "../Utils/helpers";

export default function PersonCard({ person, subTitle, isMain, onNodeSelect }) {
  // console.log("person: ", person);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (onNodeSelect) onNodeSelect(person);
      }}
      className={`w-55 p-5 transition-all cursor-pointer bg-transparent bg-cover bg-center bg-no-repeat
        ${isMain ? "scale-100" : "scale-100 opacity-90"}`}
      style={{
        backgroundImage: "url(/images/personal_card.png)",
        aspectRatio: "464 / 655",
        WebkitMaskImage: "url(/images/personal_card.png)",
        WebkitMaskSize: "cover",
        WebkitMaskRepeat: "no-repeat",
        maskImage: "url(/images/personal_card.png)",
        maskSize: "cover",
        maskRepeat: "no-repeat",
        filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.35))",
      }}
    >
      <div className="flex flex-col items-center font-serif text-[#3d2611]">
        <div className="pt-4 text-[9px] uppercase tracking-[0.2em] mb-1 opacity-60">
          {subTitle}
        </div>
        <div className="text-lg font-bold border-b border-[#8b5a2b]/40 pb-1 w-full text-center tracking-tight uppercase">
          {person.name || person.label}
        </div>
        <div className="mt-2 flex items-center justify-center h-[32px]">
          <div className="text-[10px] italic text-[#5d3a1a]/80 text-center leading-[16px] max-w-[180px] line-clamp-2 overflow-hidden">
            {person.shortDesc}
          </div>
        </div>
        <div className="text-[10px] mt-2 opacity-70 font-mono">
          {formatDate(person.birthDate)} — {formatDate(person.deathDate)}
        </div>
      </div>
    </div>
  );
}
