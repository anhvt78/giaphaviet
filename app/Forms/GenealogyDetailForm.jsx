"use client";
import React, { useState } from "react";

import images from "@/app/img";
import Image from "next/image";

import UpdateClanShortDescModal from "@/components/ui/UpdateClanShortDescModal";
import { useSelector } from "react-redux";
import { useBannerCanvas } from "@/hooks/useBannerCanvas";

const EditButton = ({ onClick, title, href }) => {
  const cls =
    "flex items-center justify-center w-7 h-7 border border-[#8b5a2b]/20 text-[#8b5a2b] hover:text-[#3d2611] hover:border-[#5d3a1a]/40 hover:bg-[#5d3a1a]/5 transition-all flex-shrink-0";
  const icon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
  if (href)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} title={title}>
        {icon}
      </a>
    );
  return (
    <button onClick={onClick} className={cls} title={title}>
      {icon}
    </button>
  );
};

const SectionHeader = ({ numeral, title, editButton }) => (
  <div className="flex items-center gap-3 mb-5">
    <span className="w-6 h-6 rounded-full bg-[#3d2611] text-[#f2e2ba] flex items-center justify-center text-[10px] font-bold flex-shrink-0 shadow-sm">
      {numeral}
    </span>
    <span className="text-[12px] font-bold text-[#3d2611] uppercase tracking-[0.22em]">
      {title}
    </span>
    <div className="flex-1 h-px bg-[#8b5a2b]/22" />
    {editButton}
  </div>
);

export default function GenealogyDetailForm({
  clanItem,
  setTabIndex,
  fetchDataDetail,
}) {
  const [currentIndex, setCurrentIndex] = useState(null);
  const [modalUpdateState, setModalUpdateState] = useState(false);
  const [copied, setCopied] = useState(false);

  const userWalletAddress = useSelector(
    (state) => state.genealogyReducer.walletAddress,
  );

  const bannerSrc =
    typeof images.banner === "string" ? images.banner : images.banner?.src;
  const bannerDataUrl = useBannerCanvas(bannerSrc, clanItem?.clanName);

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % clanItem?.allImageUrls.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentIndex(
      (prev) =>
        (prev - 1 + clanItem?.allImageUrls.length) %
        clanItem?.allImageUrls.length,
    );
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const isOwner = userWalletAddress && clanItem?.clanOwner === userWalletAddress;

  return (
    <div className="h-full w-full bg-[#e8d5b5] font-serif overflow-y-auto">
      {/* LIGHTBOX */}
      {currentIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setCurrentIndex(null)}
        >
          <button className="absolute top-6 right-6 text-white/70 hover:text-white z-[110]">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <button onClick={prevImage} className="absolute left-4 md:left-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-[110]">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div className="relative max-w-5xl max-h-[85vh] flex items-center justify-center">
            <img src={clanItem?.allImageUrls[currentIndex]} className="max-w-full max-h-full object-contain shadow-2xl" alt="Full view" onClick={(e) => e.stopPropagation()} />
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/60 text-sm tracking-widest">
              {currentIndex + 1} / {clanItem?.allImageUrls.length}
            </div>
          </div>
          <button onClick={nextImage} className="absolute right-4 md:right-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-[110]">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      )}

      {/* BANNER */}
      <div className="w-full border-b-2 border-[#5d3a1a]/40 flex justify-center bg-[#e8d5b5]">
        {bannerDataUrl ? (
          <img src={bannerDataUrl} alt={clanItem?.clanName ?? "Banner"} className="w-full h-auto block" style={{ maxWidth: "600px" }} />
        ) : (
          <div className="w-full max-w-2xl animate-pulse bg-[#d4c4a0]" style={{ paddingTop: "44%" }} />
        )}
      </div>

      {/* MAIN GRID */}
      <div className="max-w-5xl mx-auto px-5 mt-10 pb-16 grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* ── LEFT/MAIN COLUMN ── */}
        <div className="order-last md:order-first md:col-span-2 space-y-10">

          {/* Section I — Tóm lược */}
          <section>
            <SectionHeader
              numeral="I"
              title="Tóm lược"
              editButton={isOwner && (
                <EditButton
                  onClick={() => setModalUpdateState(true)}
                  title="Cập nhật tóm lược"
                />
              )}
            />
            <p className="text-[#5d3a1a] text-base italic leading-relaxed pl-2 border-l-2 border-[#8b5a2b]/30">
              {clanItem?.shortDesc || (
                <span className="text-[#8b5a2b]/50 not-italic text-sm">Chưa có nội dung tóm lược.</span>
              )}
            </p>
          </section>

          {/* Section II — Lịch sử dòng tộc */}
          <section>
            <SectionHeader
              numeral="II"
              title="Lịch sử dòng tộc"
              editButton={isOwner && (
                <EditButton
                  href={`https://universaleverything.io/collection/${clanItem?.clanId}`}
                  title="Cập nhật lịch sử dòng tộc"
                />
              )}
            />
            <div className="text-[#3d2611] text-base leading-loose whitespace-pre-line text-justify pl-2">
              {clanItem?.clanDetail || (
                <span className="text-[#8b5a2b]/50 italic text-sm">Chưa có nội dung lịch sử.</span>
              )}
            </div>
          </section>

          {/* Section III — Bộ sưu tập hình ảnh */}
          {clanItem?.allImageUrls?.length > 0 && (
            <section>
              <SectionHeader numeral="III" title="Bộ sưu tập hình ảnh" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {clanItem.allImageUrls.map((img, index) => (
                  <div
                    key={index}
                    className="aspect-square overflow-hidden border border-[#5d3a1a]/30 hover:border-[#5d3a1a] shadow-sm group cursor-pointer transition-all"
                    onClick={() => setCurrentIndex(index)}
                  >
                    <img
                      src={img}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={`gallery-${index}`}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── RIGHT SIDEBAR COLUMN ── */}
        <div className="order-first md:order-last space-y-4">

          {/* Metadata card */}
          <div className="bg-[#fdf8e9] border border-[#8b5a2b]/25 shadow-sm">
            {/* Card header */}
            <div className="px-5 py-3.5 border-b border-[#8b5a2b]/15 flex items-center gap-2.5">
              <div className="w-1.5 h-4 bg-[#c4922a]" />
              <span className="text-[11px] font-bold text-[#3d2611] uppercase tracking-[0.2em]">
                Thông tin hợp đồng
              </span>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Contract address */}
              <div>
                <p className="text-[10px] text-[#8b5a2b] uppercase tracking-wider font-bold mb-1.5">
                  Địa chỉ hợp đồng
                </p>
                <div className="flex items-center gap-2 bg-[#f4ece1] border border-[#8b5a2b]/20 px-3 py-2">
                  <span className="text-[11px] font-mono text-[#3d2611] flex-1 truncate">
                    {clanItem?.clanId
                      ? `${clanItem.clanId.slice(0, 10)}...${clanItem.clanId.slice(-6)}`
                      : "—"}
                  </span>
                  <button
                    onClick={() => handleCopy(clanItem?.clanId)}
                    className="text-[#8b5a2b] hover:text-[#3d2611] transition-colors flex-shrink-0"
                    title="Sao chép địa chỉ"
                  >
                    {copied ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Owner */}
              <div>
                <p className="text-[10px] text-[#8b5a2b] uppercase tracking-wider font-bold mb-1.5">
                  Chủ sở hữu
                </p>
                <div className="bg-[#f4ece1] border border-[#8b5a2b]/20 px-3 py-2">
                  <span className="text-[11px] font-mono text-[#3d2611]">
                    {clanItem?.clanOwner
                      ? `${clanItem.clanOwner.slice(0, 8)}...${clanItem.clanOwner.slice(-6)}`
                      : "—"}
                  </span>
                </div>
              </div>

              {/* LUKSO badge */}
              <div className="flex items-center gap-2 pt-1 border-t border-[#8b5a2b]/12">
                <div className="w-2 h-2 rounded-full bg-[#FE005B]" />
                <span className="text-[10px] text-[#8b5a2b]/60 uppercase tracking-widest font-bold">
                  LUKSO Mainnet
                </span>
                <span className="text-[#8b5a2b]/30 text-[10px]">·</span>
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide">
                  Đã xác thực
                </span>
              </div>
            </div>
          </div>

          {/* Actions card */}
          <div className="bg-[#fdf8e9] border border-[#8b5a2b]/25 shadow-sm">
            <div className="px-5 py-3.5 border-b border-[#8b5a2b]/15 flex items-center gap-2.5">
              <div className="w-1.5 h-4 bg-[#3d2611]" />
              <span className="text-[11px] font-bold text-[#3d2611] uppercase tracking-[0.2em]">
                Thao tác
              </span>
            </div>
            <div className="px-5 py-4 space-y-2.5">
              {/* View diagram */}
              <button
                onClick={() => setTabIndex(1)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#3d2611] text-[#f2e2ba] font-bold text-[11px] uppercase tracking-wider hover:bg-[#5d3a1a] active:scale-[0.99] transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
                Xem Phả Đồ
              </button>

              {/* Explorer link */}
              <a
                href={`https://explorer.execution.mainnet.lukso.network/address/${clanItem?.clanId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-4 py-2.5 border border-[#8b5a2b]/30 text-[#5d3a1a] font-bold text-[11px] uppercase tracking-wider hover:bg-[#5d3a1a]/8 hover:border-[#5d3a1a]/60 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Xem trên Explorer
              </a>

              {/* UniversalEverything link */}
              {isOwner && (
                <a
                  href={`https://universaleverything.io/collection/${clanItem?.clanId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 px-4 py-2.5 border border-[#8b5a2b]/30 text-[#5d3a1a] font-bold text-[11px] uppercase tracking-wider hover:bg-[#5d3a1a]/8 hover:border-[#5d3a1a]/60 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
                  </svg>
                  Quản lý trên UE
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {modalUpdateState && (
        <UpdateClanShortDescModal
          onClose={() => setModalUpdateState(false)}
          clanItem={clanItem}
          fetchDataDetail={fetchDataDetail}
        />
      )}
    </div>
  );
}
