import sweetalert2 from "@/configs/swal";
import { GenealogyContext } from "@/context/GenealogyContext";
import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DragonClawCorners } from "@/components/ui/imperial";

const AVATAR_GRADIENTS = [
  ["#3d2611", "#7a4820"],
  ["#1e3a5f", "#2e5c9a"],
  ["#1a3a2a", "#2d6348"],
  ["#3a1a3a", "#6b3a6b"],
  ["#3a2a10", "#7a5a20"],
];

function getGradient(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const ClanListItem = ({ clanId }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clanName, setClanName] = useState("");
  const { getClanInfo } = useContext(GenealogyContext);

  useEffect(() => {
    if (!clanId) return;
    getClanInfo(clanId).then((result) => {
      setLoading(false);
      if (result.sts) {
        setClanName(result.data?.clanName || "");
      } else {
        sweetalert2.popupAlert({
          title: "Đã xảy ra lỗi",
          text: "Lỗi khi tải thông tin Gia phả.",
        });
      }
    });
  }, [clanId]);

  const shortId = clanId
    ? `${clanId.slice(0, 6)}...${clanId.slice(-4)}`
    : "";

  const [gradFrom, gradTo] = getGradient(clanId || "");

  return (
    <div
      onClick={() => router.push(`/pages/detail?id=${clanId}`)}
      className="group cursor-pointer bg-[#FEFBF0] border border-[#8B1A1A]/30 hover:border-[#8B1A1A]/70 shadow-sm hover:shadow-[0_8px_24px_rgba(139,26,26,0.12)] transition-all duration-300 overflow-hidden flex flex-col relative"
    >
      <DragonClawCorners size={40} />

      {/* Top accent bar */}
      <div className="h-[3px] bg-gradient-to-r from-[#6B0000] via-[#C8960C] to-[#6B0000] flex-shrink-0" />

      <div className="p-5 flex flex-col flex-1">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-[#8B1A1A]/10 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-[#8B1A1A]/10 rounded w-3/4" />
                <div className="h-2.5 bg-[#8B1A1A]/6 rounded w-1/2" />
              </div>
            </div>
            <div className="h-px bg-[#8B1A1A]/8 mt-4" />
            <div className="h-2.5 bg-[#8B1A1A]/6 rounded w-1/3" />
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3.5 mb-auto">
              {/* Square avatar with imperial styling */}
              <div
                className="w-11 h-11 flex items-center justify-center text-[#C8960C] font-black text-base flex-shrink-0 border border-[#8B1A1A]/40 relative"
                style={{ background: `linear-gradient(135deg, #8B1A1A, #5C0A0A)` }}
              >
                {getInitials(clanName)}
                <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-[#D4AF37]/60" />
                <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-[#D4AF37]/60" />
                <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-[#D4AF37]/60" />
                <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-[#D4AF37]/60" />
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="text-[#8B1A1A] font-bold text-[15px] uppercase tracking-wide leading-tight group-hover:text-[#6B0000] transition-colors line-clamp-2">
                  {clanName || "Không có tên"}
                </h3>
                <p className="text-[#8B1A1A]/40 text-[11px] font-mono mt-1 tracking-tight">
                  {shortId}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-[#8B1A1A]/10">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#8B1A1A] uppercase tracking-widest group-hover:gap-2.5 transition-all">
                Xem gia phả
                <svg className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>

              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FE005B]" />
                <span className="text-[9px] font-black text-[#8B1A1A]/40 uppercase tracking-[0.2em]">LUKSO</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ClanListItem;
