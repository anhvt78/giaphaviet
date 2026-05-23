"use client";
import React, { useState } from "react";

import images from "@/app/img";
import Image from "next/image";

import UpdateClanShortDescModal from "@/components/ui/UpdateClanShortDescModal";
import { useSelector } from "react-redux";
import { useBannerCanvas } from "@/hooks/useBannerCanvas";

export default function GenealogyDetailForm({
  clanItem,
  setTabIndex,
  fetchDataDetail,
}) {
  const [currentIndex, setCurrentIndex] = useState(null);
  const [modalUpdateState, setModalUpdateState] = useState(false);

  const userWalletAddress = useSelector(
    (state) => state.genealogyReducer.walletAddress,
  );

  // ✅ Render chữ vào ảnh banner bằng Canvas — trả về 1 dataUrl duy nhất
  // Next.js import tĩnh trả về object { src, width, height }, lấy .src
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

  return (
    <div className="min-h-screen w-full bg-[#e8d5b5] font-serif overflow-y-auto pb-20">
      {/* LIGHTBOX */}
      {currentIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setCurrentIndex(null)}
        >
          <button className="absolute top-6 right-6 text-white/70 hover:text-white z-[110]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
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
              width="40"
              height="40"
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
              className="max-w-full max-h-full object-contain shadow-2xl animate-in fade-in zoom-in duration-300"
              alt="Full view"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/80 font-sans text-sm tracking-widest">
              {currentIndex + 1} / {clanItem?.allImageUrls.length}
            </div>
          </div>
          <button
            onClick={nextImage}
            className="absolute right-4 md:right-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-[110]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
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

      {/* ✅ BANNER
          - max-w-2xl giới hạn chiều rộng tối đa (~672px), căn giữa mx-auto
          - w-full h-auto giữ đúng tỷ lệ ảnh gốc 600×264, không stretch
          - Nền kem lấp phần trong suốt của PNG
          - Chữ render trong Canvas → không bao giờ lệch khi zoom
      */}
      <div
        className="w-full border-b-4 border-[#5d3a1a] flex justify-center"
        style={{ backgroundColor: "#e8d5b5" }}
      >
        {bannerDataUrl ? (
          <img
            src={bannerDataUrl}
            alt={clanItem?.clanName ?? "Banner"}
            className="w-full h-auto block"
            style={{ maxWidth: "600px" }}
          />
        ) : (
          <div
            className="w-full max-w-2xl animate-pulse bg-[#d4c4a0]"
            style={{ paddingTop: "44%" }}
          />
        )}
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-12 grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Cột trái: Thông tin chính */}
        <div className="order-last md:order-0 md:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between border-b-2 border-[#5d3a1a] pb-2 mb-4">
              <h2 className="text-2xl font-bold text-[#3d2611] uppercase tracking-widest">
                Tóm lược
              </h2>
              {userWalletAddress &&
                clanItem?.clanOwner == userWalletAddress && (
                  <div
                    className="flex border border-[#8b5a2b]/10 size-10 items-center justify-center rounded-full transition-all duration-300 bg-neutral-97 cursor-pointer hover:scale-105 hover:bg-neutral-95 text-[#5d3a1a]"
                    title="Cập nhật thông tin sơ lược"
                    onClick={() => setModalUpdateState(true)}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9.20522 17.4916L18.5695 8.12731C18.9601 7.73679 18.9601 7.10362 18.5695 6.7131L16.5635 4.70704C16.173 4.31652 15.5398 4.31652 15.1493 4.70704L5.78495 14.0714C5.64561 14.2107 5.55055 14.3881 5.51169 14.5813L5.00661 17.0924C4.86572 17.7929 5.48368 18.4109 6.18417 18.27L8.6953 17.7649C8.88848 17.726 9.06588 17.631 9.20522 17.4916Z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke="currentColor"
                        strokeWidth="2"
                      ></path>
                      <path
                        d="M13.2913 6.28015L16.7115 9.70042"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke="currentColor"
                        strokeWidth="2"
                      ></path>
                    </svg>
                  </div>
                )}
            </div>
            <p className="text-[#5d3a1a] text-lg italic leading-relaxed">
              {clanItem?.shortDesc}
            </p>
          </section>

          <section>
            <div className="flex items-center justify-between border-b-2 border-[#5d3a1a] pb-2 mb-4">
              <h2 className="text-2xl font-bold text-[#3d2611] uppercase tracking-widest">
                Lịch sử dòng tộc
              </h2>
              {userWalletAddress &&
                clanItem?.clanOwner == userWalletAddress && (
                  <a
                    href={`https://universaleverything.io/collection/${clanItem?.clanId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex border border-[#8b5a2b]/10 size-10 items-center justify-center rounded-full transition-all duration-300 bg-neutral-97 cursor-pointer hover:scale-105 hover:bg-neutral-95 text-[#5d3a1a]"
                    title="Cập nhật lịch sử dòng tộc"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9.20522 17.4916L18.5695 8.12731C18.9601 7.73679 18.9601 7.10362 18.5695 6.7131L16.5635 4.70704C16.173 4.31652 15.5398 4.31652 15.1493 4.70704L5.78495 14.0714C5.64561 14.2107 5.55055 14.3881 5.51169 14.5813L5.00661 17.0924C4.86572 17.7929 5.48368 18.4109 6.18417 18.27L8.6953 17.7649C8.88848 17.726 9.06588 17.631 9.20522 17.4916Z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke="currentColor"
                        strokeWidth="2"
                      ></path>
                      <path
                        d="M13.2913 6.28015L16.7115 9.70042"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke="currentColor"
                        strokeWidth="2"
                      ></path>
                    </svg>
                  </a>
                )}
            </div>
            <div className="text-[#3d2611] text-lg leading-loose whitespace-pre-line text-justify">
              {clanItem?.clanDetail}
            </div>
          </section>

          {/* Bộ sưu tập hình ảnh */}
          <section>
            <h2 className="text-2xl font-bold text-[#3d2611] border-b-2 border-[#5d3a1a] pb-2 mb-6 uppercase tracking-widest">
              Bộ sưu tập hình ảnh
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {clanItem?.allImageUrls.map((img, index) => (
                <div
                  key={index}
                  className="h-40 overflow-hidden border-2 border-[#5d3a1a] shadow-md group"
                  onClick={() => setCurrentIndex(index)}
                >
                  <img
                    src={img}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 cursor-pointer"
                    alt={`gallery-${index}`}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Cột phải: Sidebar chức năng */}
        <div className="order-first md:order-0 space-y-6">
          <div className="bg-[#f2e2ba] border-2 border-[#5d3a1a] p-6 shadow-[8px_8px_0px_0px_rgba(93,58,26,0.1)]">
            <h3 className="text-[#3d2611] font-bold text-center border-b border-[#5d3a1a]/20 pb-4 mb-6 uppercase tracking-tighter">
              Truy cập dữ liệu
            </h3>
            <button
              onClick={() => setTabIndex(1)}
              className="w-full py-4 bg-[#5d3a1a] text-[#f2e2ba] font-bold rounded hover:bg-[#3d2611] transition-all flex items-center justify-center gap-3 shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
              XEM PHẢ ĐỒ
            </button>
          </div>
          <div className="p-6 border-2 border-dashed border-[#5d3a1a]/30 text-[#5d3a1a] italic text-sm flex items-center justify-center gap-1">
            Hồ sơ này đã được xác thực trên mạng lưới Blockchain LUKSO.
            <a
              href={`https://explorer.execution.mainnet.lukso.network/address/${clanItem?.clanId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center hover:opacity-70 transition-opacity"
              title="Xem trên Blockchain"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: "16px", height: "16px" }}
              >
                <path
                  d="M12 4H7C5.34315 4 4 5.34315 4 7V17C4 18.6569 5.34315 20 7 20H17C18.6569 20 20 18.6569 20 17V12"
                  strokeLinecap="round"
                  stroke="currentColor"
                  strokeWidth="2"
                ></path>
                <path
                  d="M19.9999 8C19.9999 6.17755 20 4 20 4H16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  stroke="currentColor"
                  strokeWidth="2"
                ></path>
                <path
                  d="M14 10L20 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  stroke="currentColor"
                  strokeWidth="2"
                ></path>
              </svg>
            </a>
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
