import sweetalert2 from "@/configs/swal";
import { GenealogyContext } from "@/context/GenealogyContext";
import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
      className="group cursor-pointer bg-[#fdf8e9] border border-[#8b5a2b]/25 hover:border-[#5d3a1a]/60 shadow-sm hover:shadow-[0_8px_24px_rgba(61,38,17,0.12)] transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Top accent bar */}
      <div className="h-0.5 bg-gradient-to-r from-[#3d2611] via-[#c4922a] to-[#3d2611] flex-shrink-0" />

      <div className="p-5 flex flex-col flex-1">
        {loading ? (
          /* Skeleton */
          <div className="space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#8b5a2b]/20 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-[#8b5a2b]/15 rounded w-3/4" />
                <div className="h-2.5 bg-[#8b5a2b]/10 rounded w-1/2" />
              </div>
            </div>
            <div className="h-px bg-[#8b5a2b]/10 mt-4" />
            <div className="h-2.5 bg-[#8b5a2b]/10 rounded w-1/3" />
          </div>
        ) : (
          <>
            {/* Header: Avatar + Name */}
            <div className="flex items-start gap-3.5 mb-auto">
              {/* Avatar */}
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-[#f2e2ba] font-black text-base flex-shrink-0 shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
                }}
              >
                {getInitials(clanName)}
              </div>

              {/* Name + address */}
              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="text-[#3d2611] font-bold text-[15px] uppercase tracking-wide leading-tight group-hover:text-[#8b3a0e] transition-colors line-clamp-2">
                  {clanName || "Không có tên"}
                </h3>
                <p className="text-[#8b5a2b]/50 text-[11px] font-mono mt-1 tracking-tight">
                  {shortId}
                </p>
              </div>
            </div>

            {/* Footer: CTA + LUKSO badge */}
            <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-[#8b5a2b]/12">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#5d3a1a] uppercase tracking-widest group-hover:gap-2.5 transition-all">
                Xem gia phả
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>

              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FE005B]" />
                <span className="text-[9px] font-black text-[#8b5a2b]/50 uppercase tracking-[0.2em]">LUKSO</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ClanListItem;
