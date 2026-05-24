"use client";
import React, { useState, useEffect, useContext } from "react";

import images from "@/app/img";
import Image from "next/image";

import UpdateClanShortDescModal from "@/components/ui/UpdateClanShortDescModal";
import { useSelector } from "react-redux";
import { useBannerCanvas } from "@/hooks/useBannerCanvas";
import { ImperialCard, ImperialSectionHeader as SectionHeader } from "@/components/ui/imperial";
import { GenealogyContext } from "@/context/GenealogyContext";
import sweetalert2 from "@/configs/swal";

const EditButton = ({ onClick, title, href }) => {
  const cls =
    "flex items-center justify-center w-6 h-6 border border-[#8B1A1A]/25 text-[#8B1A1A]/50 hover:text-[#8B1A1A] hover:border-[#8B1A1A]/50 hover:bg-[#8B1A1A]/5 transition-all flex-shrink-0";
  const icon = (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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


export default function GenealogyDetailForm({
  clanItem,
  setTabIndex,
  fetchDataDetail,
}) {
  const [currentIndex, setCurrentIndex] = useState(null);
  const [modalUpdateState, setModalUpdateState] = useState(false);
  const [copied, setCopied] = useState(false);

  // Linked clans state
  const [linkedClans, setLinkedClans] = useState([]);
  const [linkedClansLoading, setLinkedClansLoading] = useState(false);
  const [proposeInput, setProposeInput] = useState("");
  const [proposeErr, setProposeErr] = useState(null);
  const [isProposing, setIsProposing] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [removingClan, setRemovingClan] = useState(null);

  const { getLinkedClans, proposeClanLink, removeClanLink, claimClanRegistration } = useContext(GenealogyContext);
  const userWalletAddress = useSelector(
    (state) => state.genealogyReducer.walletAddress,
  );

  useEffect(() => {
    if (!clanItem?.clanId) return;
    setLinkedClansLoading(true);
    getLinkedClans(clanItem.clanId).then((res) => {
      setLinkedClansLoading(false);
      if (res.sts) setLinkedClans(res.data || []);
    });
  }, [clanItem?.clanId]);

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

  const handleProposeClanLink = () => {
    const addr = proposeInput.trim();
    if (!addr.startsWith("0x") || addr.length !== 42) {
      setProposeErr("Địa chỉ không hợp lệ (phải là 0x... 42 ký tự)");
      return;
    }
    if (addr.toLowerCase() === clanItem?.clanId?.toLowerCase()) {
      setProposeErr("Không thể liên kết với chính gia phả này");
      return;
    }
    setProposeErr(null);
    setIsProposing(true);
    proposeClanLink(
      userWalletAddress, clanItem.clanId, addr,
      () => {
        setIsProposing(false);
        setProposeInput("");
        sweetalert2.popupAlert({ title: "Thành công", text: "Đã gửi đề xuất liên kết gia phả." });
      },
      (title, err) => { setIsProposing(false); sweetalert2.popupAlert({ title, text: String(err) }); },
    );
  };

  const handleRemoveClanLink = (otherClan) => {
    setRemovingClan(otherClan);
    removeClanLink(
      userWalletAddress, clanItem.clanId, otherClan,
      () => {
        setRemovingClan(null);
        setLinkedClans((prev) => prev.filter((c) => c.toLowerCase() !== otherClan.toLowerCase()));
      },
      (title, err) => { setRemovingClan(null); sweetalert2.popupAlert({ title, text: String(err) }); },
    );
  };

  const handleClaimRegistration = () => {
    setIsClaiming(true);
    claimClanRegistration(
      userWalletAddress, clanItem.clanId,
      () => { setIsClaiming(false); sweetalert2.popupAlert({ title: "Thành công", text: "Đã xác nhận quyền sở hữu gia phả trên blockchain." }); },
      (title, err) => { setIsClaiming(false); sweetalert2.popupAlert({ title, text: String(err) }); },
    );
  };

  return (
    <div className="h-full w-full bg-[#F5EDD0] font-serif overflow-y-auto">

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

      {/* BANNER — capped at 300px tall */}
      <div className="w-full flex justify-center bg-[#F5EDD0]" style={{ maxHeight: "300px", overflow: "hidden" }}>
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
      </div>

      {/* Phoenix divider */}
      <svg className="w-full" height="36" viewBox="0 0 800 36" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="18" x2="800" y2="18" stroke="#C8960C" strokeWidth="0.8" opacity="0.35"/>
        {/* Body */}
        <ellipse cx="400" cy="16" rx="14" ry="7" fill="none" stroke="#C8960C" strokeWidth="1.6" opacity="0.85"/>
        {/* Wings */}
        <path d="M386,16 Q366,5 344,11 Q360,14 386,16" fill="none" stroke="#C8960C" strokeWidth="1.3" opacity="0.75"/>
        <path d="M414,16 Q434,5 456,11 Q440,14 414,16" fill="none" stroke="#C8960C" strokeWidth="1.3" opacity="0.75"/>
        {/* Tail feathers */}
        <path d="M396,23 Q387,33 374,31 Q386,27 396,23" fill="none" stroke="#C8960C" strokeWidth="1.2" opacity="0.65"/>
        <path d="M404,23 Q413,33 426,31 Q414,27 404,23" fill="none" stroke="#C8960C" strokeWidth="1.2" opacity="0.65"/>
        <path d="M399,25 Q397,35 394,33 Q397,29 399,25" fill="none" stroke="#D4AF37" strokeWidth="1" opacity="0.7"/>
        <path d="M401,25 Q403,35 406,33 Q403,29 401,25" fill="none" stroke="#D4AF37" strokeWidth="1" opacity="0.7"/>
        {/* Crest */}
        <path d="M397,10 Q396,3 400,1 Q404,3 403,10" fill="none" stroke="#D4AF37" strokeWidth="1.3" opacity="0.75"/>
        {/* Eye */}
        <circle cx="404" cy="14" r="2" fill="#D4AF37" opacity="0.85"/>
        {/* Side cloud waves */}
        <path d="M0,18 Q40,10 80,18 Q120,26 160,18 Q200,10 240,18 Q280,24 340,18 Q360,16 382,18" fill="none" stroke="#C8960C" strokeWidth="0.7" opacity="0.3"/>
        <path d="M800,18 Q760,10 720,18 Q680,26 640,18 Q600,10 560,18 Q520,24 460,18 Q440,16 418,18" fill="none" stroke="#C8960C" strokeWidth="0.7" opacity="0.3"/>
      </svg>

      {/* MAIN GRID */}
      <div className="max-w-5xl mx-auto px-5 mt-4 pb-16 grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* ── LEFT / MAIN COLUMN ── */}
        <div className="order-last md:order-first md:col-span-2 space-y-10">

          {/* Section I — Tóm lược */}
          <section>
            <SectionHeader
              numeral="I"
              title="Tóm lược"
              editButton={isOwner && (
                <EditButton onClick={() => setModalUpdateState(true)} title="Cập nhật tóm lược" />
              )}
            />
            <p className="text-[#5d3a1a] text-base italic leading-relaxed pl-3 border-l-2 border-[#C8960C]/40">
              {clanItem?.shortDesc || (
                <span className="text-[#8B1A1A]/40 not-italic text-sm">Chưa có nội dung tóm lược.</span>
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
            <div className="text-[#3d2611] text-base leading-loose whitespace-pre-line text-justify pl-3">
              {clanItem?.clanDetail || (
                <span className="text-[#8B1A1A]/40 italic text-sm">Chưa có nội dung lịch sử.</span>
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

          {/* Section IV — Gia phả liên kết */}
          <section>
            <SectionHeader numeral="IV" title="Gia phả liên kết" />

            {/* Linked clans list */}
            {linkedClansLoading ? (
              <div className="flex items-center gap-2 py-4 pl-3">
                <div className="animate-spin h-4 w-4 border-2 border-[#8B1A1A]/20 border-t-[#8B1A1A] rounded-full" />
                <span className="text-[12px] text-[#8B1A1A]/50 italic">Đang tải danh sách liên kết...</span>
              </div>
            ) : linkedClans.length === 0 ? (
              <p className="text-[#8B1A1A]/40 italic text-sm pl-3 border-l-2 border-[#C8960C]/20 py-1">
                Chưa có gia phả nào được liên kết.
              </p>
            ) : (
              <div className="space-y-2">
                {linkedClans.map((addr) => (
                  <div key={addr} className="flex items-center gap-2 bg-white border border-[#8B1A1A]/20 px-3 py-2.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C8960C" strokeWidth="2" className="flex-shrink-0">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    <span className="text-[11px] font-mono text-[#3d2611] flex-1 truncate">
                      {addr.slice(0, 10)}...{addr.slice(-6)}
                    </span>
                    <a
                      href={`https://explorer.execution.mainnet.lukso.network/address/${addr}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8B1A1A]/40 hover:text-[#8B1A1A] transition-colors flex-shrink-0"
                      title="Xem trên Explorer"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </a>
                    {isOwner && (
                      <button
                        onClick={() => handleRemoveClanLink(addr)}
                        disabled={removingClan === addr}
                        className="text-[#8B1A1A]/40 hover:text-red-600 transition-colors flex-shrink-0 disabled:opacity-40"
                        title="Xóa liên kết"
                      >
                        {removingClan === addr ? (
                          <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                            <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Propose link form — owner only */}
            {isOwner && (
              <div className="mt-5 border border-[#8B1A1A]/15 bg-[#FEFBF0] p-4 space-y-3">
                <p className="text-[10px] font-bold text-[#8B1A1A]/60 uppercase tracking-widest">Đề xuất liên kết mới</p>
                <div>
                  <input
                    type="text"
                    value={proposeInput}
                    onChange={(e) => { setProposeInput(e.target.value); setProposeErr(null); }}
                    disabled={isProposing}
                    placeholder="0x... (địa chỉ contract FamilyNFT của gia phả kia)"
                    className="w-full bg-white border border-[#8B1A1A]/30 hover:border-[#8B1A1A]/60 focus:border-[#8B1A1A] px-3 py-2.5 outline-none text-[11px] text-[#8B1A1A] font-mono placeholder:text-[#8B1A1A]/30 disabled:opacity-50"
                  />
                  {proposeErr && <p className="text-red-600 text-[10px] mt-1 font-bold">* {proposeErr}</p>}
                </div>
                <div className="flex items-start gap-2 bg-[#F5EDD0] border border-[#8B1A1A]/10 px-3 py-2">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C8960C" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                  </svg>
                  <p className="text-[10px] text-[#8B1A1A]/55 leading-relaxed">
                    Liên kết hai chiều yêu cầu cả hai bên chủ gia phả đồng ý đề xuất. Đề xuất sẽ có hiệu lực khi gia phả kia cũng xác nhận.
                  </p>
                </div>
                <button
                  onClick={handleProposeClanLink}
                  disabled={isProposing || !proposeInput.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#8B1A1A] text-[#C8960C] font-bold text-[11px] uppercase tracking-wider hover:bg-[#6B0000] transition-all disabled:opacity-50"
                >
                  {isProposing && <div className="animate-spin h-3 w-3 border-2 border-[#C8960C]/30 border-t-[#C8960C] rounded-full" />}
                  {isProposing ? "Đang gửi..." : "Gửi đề xuất liên kết"}
                </button>
              </div>
            )}

            {/* Claim registration — owner only */}
            {isOwner && (
              <div className="mt-4">
                <button
                  onClick={handleClaimRegistration}
                  disabled={isClaiming}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#8B1A1A]/30 text-[#8B1A1A] font-bold text-[11px] uppercase tracking-wider hover:bg-[#8B1A1A]/5 hover:border-[#8B1A1A]/60 transition-all disabled:opacity-50"
                >
                  {isClaiming && <div className="animate-spin h-3 w-3 border-2 border-[#8B1A1A]/20 border-t-[#8B1A1A] rounded-full" />}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  {isClaiming ? "Đang xác nhận..." : "Xác nhận đăng ký gia phả"}
                </button>
                <p className="text-[10px] text-[#8B1A1A]/40 mt-1.5 text-center leading-relaxed">
                  Dùng khi bạn đã nhận token tổ tiên nhưng chưa đăng ký trên Genealogy
                </p>
              </div>
            )}
          </section>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="order-first md:order-last space-y-4">

          {/* Metadata card */}
          <ImperialCard>
            <div className="px-5 py-3.5 border-b border-[#8B1A1A]/15 flex items-center gap-2.5">
              <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5,0 L10,5 L5,10 L0,5 Z" fill="#C8960C" opacity="0.8"/></svg>
              <span className="text-[11px] font-bold text-[#8B1A1A] uppercase tracking-[0.2em]">
                Thông tin hợp đồng
              </span>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <p className="text-[10px] text-[#8B1A1A]/60 uppercase tracking-wider font-bold mb-1.5">
                  Địa chỉ hợp đồng
                </p>
                <div className="flex items-center gap-2 bg-[#F5EDD0] border border-[#8B1A1A]/15 px-3 py-2">
                  <span className="text-[11px] font-mono text-[#3d2611] flex-1 truncate">
                    {clanItem?.clanId
                      ? `${clanItem.clanId.slice(0, 10)}...${clanItem.clanId.slice(-6)}`
                      : "—"}
                  </span>
                  <button
                    onClick={() => handleCopy(clanItem?.clanId)}
                    className="text-[#8B1A1A]/50 hover:text-[#8B1A1A] transition-colors flex-shrink-0"
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

              <div>
                <p className="text-[10px] text-[#8B1A1A]/60 uppercase tracking-wider font-bold mb-1.5">
                  Chủ sở hữu
                </p>
                <div className="bg-[#F5EDD0] border border-[#8B1A1A]/15 px-3 py-2">
                  <span className="text-[11px] font-mono text-[#3d2611]">
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
          </ImperialCard>

          {/* Actions card */}
          <ImperialCard>
            <div className="px-5 py-3.5 border-b border-[#8B1A1A]/15 flex items-center gap-2.5">
              <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5,0 L10,5 L5,10 L0,5 Z" fill="#C8960C" opacity="0.8"/></svg>
              <span className="text-[11px] font-bold text-[#8B1A1A] uppercase tracking-[0.2em]">
                Thao tác
              </span>
            </div>
            <div className="px-5 py-4 space-y-2.5">

              {/* View diagram — primary action */}
              <button
                onClick={() => setTabIndex(1)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#8B1A1A] text-[#C8960C] font-bold text-[11px] uppercase tracking-wider hover:bg-[#6B0000] active:scale-[0.99] transition-all relative overflow-hidden"
              >
                <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#D4AF37]/60" />
                <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#D4AF37]/60" />
                <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#D4AF37]/60" />
                <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#D4AF37]/60" />
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
                className="w-full flex items-center gap-3 px-4 py-2.5 border border-[#8B1A1A]/30 text-[#8B1A1A] font-bold text-[11px] uppercase tracking-wider hover:bg-[#8B1A1A]/5 hover:border-[#8B1A1A]/60 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
                  </svg>
                  Quản lý trên UE
                </a>
              )}
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
