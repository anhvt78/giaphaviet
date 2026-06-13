"use client";
import React, { useState, useEffect } from "react";

import images from "@/app/img";
import modalBackground from "@/images/modal_background.png";
import Image from "next/image";

import UpdateClanShortDescModal from "@/components/ui/UpdateClanShortDescModal";
import { useSelector } from "react-redux";
import { useBannerCanvas } from "@/hooks/useBannerCanvas";
import {
  ImperialCard,
  ImperialSectionHeader as SectionHeader,
} from "@/components/ui/imperial";
const EditButton = ({ onClick, title, href }) => {
  const cls =
    "flex items-center justify-center w-6 h-6 border border-[#8B1A1A]/25 text-[#8B1A1A]/50 hover:text-[#8B1A1A] hover:border-[#8B1A1A]/50 hover:bg-[#8B1A1A]/5 transition-all flex-shrink-0";
  const icon = (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
  if (href)
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
        title={title}
      >
        {icon}
      </a>
    );
  return (
    <button onClick={onClick} className={cls} title={title}>
      {icon}
    </button>
  );
};

export default function GenealogyDetailForm({
  clanItem,
  setTabIndex,
  fetchDataDetail,
  onScroll,
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

  const isOwner =
    userWalletAddress && clanItem?.clanOwner === userWalletAddress;

  return (
    <div
      className="h-full w-full bg-[#F5EDD0] font-serif overflow-y-auto"
      onScroll={onScroll}
    >
      {/* LIGHTBOX */}
      {currentIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setCurrentIndex(null)}
        >
          <button className="absolute top-6 right-6 text-white/70 hover:text-white z-[110]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={prevImage}
            className="absolute left-4 md:left-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-[110]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="relative max-w-5xl max-h-[85vh] flex items-center justify-center">
            <img
              src={clanItem?.allImageUrls[currentIndex]}
              className="max-w-full max-h-full object-contain shadow-2xl"
              alt="Full view"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/60 text-sm tracking-widest">
              {currentIndex + 1} / {clanItem?.allImageUrls.length}
            </div>
          </div>
          <button
            onClick={nextImage}
            className="absolute right-4 md:right-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-[110]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}

      {/* BANNER — capped at 300px tall */}
      {/* <div className="w-full flex justify-center bg-[#F5EDD0]" style={{ maxHeight: "300px", overflow: "hidden" }}>
        {bannerDataUrl ? (
          <img
            src={bannerDataUrl}
            alt={clanItem?.clanName ?? "Banner"}
            className="w-full object-contain block"
            style={{ maxWidth: "560px", maxHeight: "300px" }}
          />
        ) : (
          <div className="w-full max-w-2xl animate-pulse bg-[#D4C4A0]" style={{ height: "300px" }} />
        )}
      </div> */}

      {/* MAIN GRID */}
      <div className="max-w-5xl mx-auto pt-16 px-5 mt-4 pb-16 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* ── LEFT / MAIN COLUMN ── */}
        <div className="order-last md:order-first md:col-span-2 space-y-10">
          {/* Section I — Tóm lược */}
          <section>
            <SectionHeader
              numeral="I"
              title="Tóm lược"
              editButton={
                isOwner && (
                  <EditButton
                    onClick={() => setModalUpdateState(true)}
                    title="Cập nhật tóm lược"
                  />
                )
              }
            />
            <p className="text-[#5d3a1a] text-base italic leading-relaxed pl-3 border-l-2 border-[#C8960C]/40">
              {clanItem?.shortDesc || (
                <span className="text-[#8B1A1A]/40 not-italic text-sm">
                  Chưa có nội dung tóm lược.
                </span>
              )}
            </p>
          </section>

          {/* Section II — Lịch sử dòng tộc */}
          <section>
            <SectionHeader
              numeral="II"
              title="Lịch sử dòng tộc"
              editButton={
                isOwner && (
                  <EditButton
                    href={`https://universaleverything.io/collection/${clanItem?.clanId}`}
                    title="Cập nhật lịch sử dòng tộc"
                  />
                )
              }
            />
            <div className="text-[#3d2611] text-base leading-loose whitespace-pre-line text-justify pl-3">
              {clanItem?.clanDetail || (
                <span className="text-[#8B1A1A]/40 italic text-sm">
                  Chưa có nội dung lịch sử.
                </span>
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
                    className="aspect-square overflow-hidden border border-[#8B1A1A]/25 hover:border-[#8B1A1A]/60 shadow-sm group cursor-pointer transition-all relative"
                    onClick={() => setCurrentIndex(index)}
                  >
                    <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#C8960C]/60 z-10" />
                    <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#C8960C]/60 z-10" />
                    <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#C8960C]/60 z-10" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#C8960C]/60 z-10" />
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

        {/* ── RIGHT SIDEBAR ── */}
        <div className="order-first md:order-last space-y-4">
          {/* Actions card */}
          <ImperialCard
            showCorners={false}
            className="bg-transparent!"
            style={{
              backgroundImage: `url(${modalBackground.src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              aspectRatio: "666 / 1056",
            }}
          >
            {/* <div className="px-5 py-5 border-b border-[#8B1A1A]/15 flex items-center gap-2.5">
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path
                  d="M5,0 L10,5 L5,10 L0,5 Z"
                  fill="#C8960C"
                  opacity="0.8"
                />
              </svg>
              <span className="items-center text-[11px] font-bold text-[#8B1A1A] uppercase tracking-[0.2em]">
                Thao tác
              </span>
            </div> */}
            <div className="px-12 pt-18 space-y-2.5">
              {/* View diagram — primary action */}
              <button
                onClick={() => setTabIndex(1)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#8B1A1A] text-[#C8960C] font-bold text-[11px] uppercase tracking-wider hover:bg-[#6B0000] active:scale-[0.99] transition-all relative overflow-hidden"
              >
                <span className="classical-decor absolute top-0 left-0 w-2 h-2 border-t border-l border-[#D4AF37]/60" />
                <span className="classical-decor absolute top-0 right-0 w-2 h-2 border-t border-r border-[#D4AF37]/60" />
                <span className="classical-decor absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#D4AF37]/60" />
                <span className="classical-decor absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#D4AF37]/60" />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
                Xem Phả Đồ
              </button>

              {/* Explorer link */}
              <a
                href={`https://explorer.execution.mainnet.lukso.network/address/${clanItem?.clanId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-4 py-2.5 border border-[#8B1A1A]/30 text-[#8B1A1A] font-bold text-[11px] uppercase tracking-wider hover:bg-[#8B1A1A]/5 hover:border-[#8B1A1A]/60 transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Xem trên Explorer
              </a>

              {/* UniversalEverything link — owner only */}
              {isOwner && (
                <a
                  href={`https://universaleverything.io/collection/${clanItem?.clanId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 px-4 py-2.5 border border-[#8B1A1A]/30 text-[#8B1A1A] font-bold text-[11px] uppercase tracking-wider hover:bg-[#8B1A1A]/5 hover:border-[#8B1A1A]/60 transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                  Quản lý trên UP
                </a>
              )}

              {/* Contract info */}
              <div className="space-y-3 pt-2 ">
                <div>
                  <p className="text-[10px] text-[#8B1A1A]/60 uppercase tracking-wider font-bold mb-1.5">
                    Địa chỉ hợp đồng
                  </p>
                  <div className="flex items-center gap-2 bg-[#F5EDD0] border border-[#8B1A1A]/15 px-3 py-2">
                    <span className="text-[11px] font-mono text-parchment-dark flex-1 truncate">
                      {clanItem?.clanId
                        ? `${clanItem.clanId.slice(0, 10)}...${clanItem.clanId.slice(-6)}`
                        : "—"}
                    </span>
                    <button
                      onClick={() => handleCopy(clanItem?.clanId)}
                      className="text-[#8B1A1A]/50 hover:text-[#8B1A1A] transition-colors shrink-0"
                      title="Sao chép địa chỉ"
                    >
                      {copied ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#22c55e"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-[#8B1A1A]/60 uppercase tracking-wider font-bold mb-1.5">
                    Chủ sở hữu
                  </p>
                  <div className="bg-[#F5EDD0] border border-[#8B1A1A]/15 px-3 py-2">
                    <span className="text-[11px] font-mono text-parchment-dark">
                      {clanItem?.clanOwner
                        ? `${clanItem.clanOwner.slice(0, 8)}...${clanItem.clanOwner.slice(-6)}`
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-[#8B1A1A]/10">
                  <div className="w-2 h-2 rounded-full bg-[#FE005B]" />
                  <span className="text-[10px] text-[#8B1A1A]/50 uppercase tracking-widest font-bold">
                    LUKSO Mainnet
                  </span>
                  <span className="text-[#8B1A1A]/25 text-[10px]">·</span>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide">
                    Đã xác thực
                  </span>
                </div>
              </div>
            </div>
          </ImperialCard>
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
