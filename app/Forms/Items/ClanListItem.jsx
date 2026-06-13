import sweetalert2 from "@/configs/swal";
import { GenealogyContext } from "@/context/GenealogyContext";
import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DragonClawCorners } from "@/components/ui/imperial";
import bookCover from "@/images/book.jpg";

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

  /* Next.js static import trả về object { src, width, height } hoặc string */
  const bgUrl = typeof bookCover === "object" ? bookCover.src : bookCover;

  return (
    <div
      onClick={() => router.push(`/pages/detail?id=${clanId}`)}
      /* Tỷ lệ 7:10 khớp với ảnh book.jpg (350×500) */
      className="group cursor-pointer relative overflow-hidden aspect-[7/10] flex flex-col shadow-md hover:shadow-[0_16px_40px_rgba(139,26,26,0.22)] transition-all duration-300"
    >
      {/* Hình nền bìa sách */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.04]"
        style={{ backgroundImage: `url(${bgUrl})` }}
      />

      {/* Lớp phủ gradient — tối phần dưới, nhạt phần trên */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#100500]/92 via-[#100500]/30 to-[#100500]/15" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#100500]/35 to-transparent" />

      {/* Viền vàng trên đỉnh */}
      <div className="classical-decor relative z-10 h-[3px] bg-gradient-to-r from-[#6B0000] via-[#C8960C] to-[#6B0000] flex-shrink-0" />

      {/* Họa tiết 4 góc */}
      <span className="classical-decor"><DragonClawCorners size={36} color="#C8960C" /></span>

      {/* Nội dung */}
      {loading ? (
        <div className="relative z-10 mt-auto px-4 pb-5 pt-8 space-y-2 animate-pulse">
          <div className="h-4 bg-white/15 rounded w-4/5" />
          <div className="h-3 bg-white/8 rounded w-2/5" />
          <div className="mt-4 h-px bg-white/10" />
          <div className="h-3 bg-white/10 rounded w-1/3" />
        </div>
      ) : (
        <div className="relative z-10 flex-1 px-4 flex flex-col items-center text-center">

          {/* Tên gia phả — căn giữa card */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <h3 className="text-[#D4AF37] font-bold text-[13px] uppercase tracking-wider leading-snug line-clamp-2 w-full">
              {clanName || "Không có tên"}
            </h3>
            <p className="text-[#C8960C]/45 text-[10px] font-mono mt-0.5 tracking-tight">
              {shortId}
            </p>
          </div>

          {/* Thanh phân cách + action — cố định ở bottom */}
          <div className="pb-4 pt-2.5 border-t border-[#C8960C]/20 w-full flex items-center justify-center">
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#C8960C] uppercase tracking-[0.15em] group-hover:gap-2 transition-all">
              Xem gia phả
              <svg className="h-2.5 w-2.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClanListItem;
