"use client";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { setWalletAddress } from "@/redux/genealogySlide";
import { GenealogyContext } from "@/context/GenealogyContext";
import ClanListItem from "./Items/ClanListItem";
import sweetalert2 from "@/configs/swal";
import Lottie from "lottie-react";
import loaderAnimation from "../assets/animations/loader.json";
import { CornerMedallion, HuiZiWenBorder } from "@/components/ui/imperial";

export default function ClanListForm({ userWalletAddress }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { getNFTCollection, createClan } = useContext(GenealogyContext);
  const [isLoading, setIsLoading] = useState(true);
  const [allClanId, setAllClanId] = useState([]);
  const [isCreator, setIsCreator] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStillAlive, setIsStillAlive] = useState(false);
  // Tìm đến phần khởi tạo useState của formData
  const [formData, setFormData] = useState({
    clanName: "",
    ancestorName: "",
    description: "",
    ancestorDesc: "",
    birthDate: "",
    deathDate: "",
    ancestorSex: 0,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const parseDateInput = (dateStr) => {
    if (!dateStr || dateStr.trim() === "") return { day: 0, month: 0, year: 0 };

    const parts = dateStr.split(/[\/\-.]/);
    let day = 0, month = 0, year = 0;

    if (parts.length === 3) {
      day   = parseInt(parts[0]) || 0;
      month = parseInt(parts[1]) || 0;
      year  = parseInt(parts[2]) || 0;
    } else {
      year = parseInt(parts[0]) || 0;
    }

    // Contract yêu cầu: nếu year != 0 thì month và day phải trong [1,12]/[1,31]
    if (year !== 0 && month === 0) month = 1;
    if (year !== 0 && day   === 0) day   = 1;

    return { day, month, year };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // console.log("Dữ liệu mới:", formData);
    // Xử lý logic gửi dữ liệu lên blockchain hoặc API ở đây
    setIsProcessing(true);

    // Chuẩn bị dữ liệu theo cấu trúc DateInfo mới
    const formattedData = {
      ...formData,
      birthDate: parseDateInput(formData.birthDate),
      deathDate: isStillAlive
        ? { year: 0, month: 0, day: 0 }
        : parseDateInput(formData.deathDate),
      isDeceased: !isStillAlive,
    };

    console.log("Dữ liệu gửi lên Blockchain:", JSON.stringify(formattedData, null, 2));

    createClan(userWalletAddress, formattedData, callBack, handleErr);
  };

  const callBack = (clanId) => {
    setIsProcessing(false);
    setIsModalOpen(false); // Đóng modal sau khi xong
    router.push(`/pages/detail?id=${clanId}`);
  };

  const handleErr = (title, error) => {
    setIsProcessing(false);
    sweetalert2.popupAlert({
      title: title,
      text: error,
    });
  };

  const getClanId = () => {
    // setIsLoading(true);
    getNFTCollection(userWalletAddress).then((result) => {
      setIsLoading(false);

      if (result.sts) {
        setAllClanId(result.data.allNFT);
        setIsCreator(result.data.isCreator);
      } else {
        sweetalert2.popupAlert({
          title: "Đã xảy ra lỗi",
          text: "Lỗi khi tải danh sách Gia phả.",
        });
      }
    });
  };

  useEffect(() => {
    if (!userWalletAddress) return;
    getClanId();
  }, [userWalletAddress]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const y = el.scrollTop;
      const delta = y - lastScrollY.current;
      if (delta > 8 && y > 80) setNavVisible(false);
      else if (delta < -8 || y < 40) setNavVisible(true);
      lastScrollY.current = y;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const handleDisconnect = () => {
    dispatch(setWalletAddress(""));
  };

  const shortAddress = userWalletAddress
    ? `${userWalletAddress.slice(0, 6)}...${userWalletAddress.slice(-4)}`
    : "";

  return (
    <div className="min-h-screen w-full bg-[#F5EDD0] font-serif flex flex-col relative">
      {/* Dragon scale background — full page */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" aria-hidden="true">
        <defs>
          <pattern id="pageScale" x="0" y="0" width="30" height="20" patternUnits="userSpaceOnUse">
            <path d="M0,20 C5,9 25,9 30,20" fill="none" stroke="#8B1A1A" strokeWidth="0.6" opacity="0.06"/>
            <path d="M-15,40 C-10,29 10,29 15,40" fill="none" stroke="#8B1A1A" strokeWidth="0.6" opacity="0.06"/>
            <path d="M15,40 C20,29 40,29 45,40" fill="none" stroke="#8B1A1A" strokeWidth="0.6" opacity="0.06"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pageScale)"/>
      </svg>

      {/* ── STICKY NAVBAR ── */}
      <div className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${navVisible ? "max-h-20" : "max-h-0"}`}>
      <nav className="bg-[#8B1A1A] relative overflow-hidden py-3.5" aria-hidden="false">
        {/* Top + bottom thick gold borders */}
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#D4AF37] via-[#C8960C] to-[#D4AF37]" />
        <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#D4AF37] via-[#C8960C] to-[#D4AF37]" />
        {/* Inner thin lines */}
        <div className="absolute top-[6px] left-0 right-0 h-[1px] bg-[#D4AF37] opacity-40" />
        <div className="absolute bottom-[6px] left-0 right-0 h-[1px] bg-[#D4AF37] opacity-40" />

        <CornerMedallion side="left" />
        <CornerMedallion side="right" />

        {/* Nav content — elevated above decorative elements */}
        <div className="relative z-10 flex items-center justify-between px-16">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 border border-[#C8960C] flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8960C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <span className="text-[#C8960C] font-bold uppercase tracking-[0.25em] text-[13px] hidden sm:block">
            Gia Phả Việt
          </span>
        </div>

        <div className="flex items-center gap-3">
          {shortAddress && (
            <div className="flex items-center gap-2 bg-[#6B0000]/60 border border-[#C8960C]/30 px-3 py-1.5 rounded-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[#C8960C]/80 text-[11px] font-mono tracking-wide">{shortAddress}</span>
            </div>
          )}
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[#C8960C]/70 hover:text-[#F5EDD0] border border-[#C8960C]/30 hover:border-[#C8960C]/60 text-[11px] font-bold uppercase tracking-wider transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
        </div>{/* end nav content wrapper */}
      </nav>

      <HuiZiWenBorder id="clanHuiZi" />
      </div>

      {/* ── MAIN CONTENT ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-12 md:py-16">
      {isLoading ? (
        <div className="fixed inset-0 flex flex-col justify-center items-center bg-[#1A0505]/90 backdrop-blur-sm z-40">
          {/* Spinner */}
          <div className="relative w-24 h-24 mb-8">
            {/* Outer ring — slow clockwise */}
            <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: "3s" }} viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="44" fill="none" stroke="#3D0505" strokeWidth="2"/>
              <circle cx="48" cy="48" r="44" fill="none" stroke="#C8960C" strokeWidth="2"
                strokeDasharray="138 138" strokeDashoffset="103" strokeLinecap="round"/>
            </svg>
            {/* Middle ring — faster counter-clockwise */}
            <svg className="absolute inset-3 w-[72px] h-[72px] animate-spin" style={{ animationDuration: "2s", animationDirection: "reverse" }} viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="32" fill="none" stroke="#3D0505" strokeWidth="1.5"/>
              <circle cx="36" cy="36" r="32" fill="none" stroke="#C8960C" strokeWidth="1.5"
                strokeDasharray="60 141" strokeLinecap="round"/>
            </svg>
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C8960C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
          </div>

          {/* Text */}
          <p className="text-[#F5EDD0] text-sm font-serif uppercase tracking-[0.3em] animate-pulse mb-2">
            Đang kết nối blockchain...
          </p>
          <p className="text-[#C8960C]/50 text-[11px] font-mono tracking-widest uppercase">
            LUKSO Mainnet
          </p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">

          {/* Page header */}
          <div className="w-full max-w-5xl text-center mb-12">
            <p className="text-[#8B1A1A]/60 text-xs uppercase tracking-[0.3em] font-bold mb-3">
              Kho lưu trữ dòng tộc
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-[#8B1A1A] tracking-[0.15em] uppercase mb-4">
              Gia Phả Của Bạn
            </h1>
            {/* Phoenix divider */}
            <svg className="w-full max-w-lg mx-auto mb-5" height="36" viewBox="0 0 420 36" aria-hidden="true">
              <line x1="0" y1="17" x2="148" y2="17" stroke="#8B1A1A" strokeWidth="0.8" opacity="0.35"/>
              {/* Body */}
              <ellipse cx="210" cy="15" rx="12" ry="6" fill="none" stroke="#C8960C" strokeWidth="1.6"/>
              {/* Left wing upper */}
              <path d="M198,15 Q180,4 158,9 Q173,13 198,15" fill="none" stroke="#C8960C" strokeWidth="1.4"/>
              <path d="M198,15 Q183,2 165,5 Q177,9 198,15" fill="none" stroke="#C8960C" strokeWidth="0.8" opacity="0.55"/>
              <path d="M173,10 Q177,7 182,10" fill="none" stroke="#C8960C" strokeWidth="0.6" opacity="0.5"/>
              {/* Right wing upper */}
              <path d="M222,15 Q240,4 262,9 Q247,13 222,15" fill="none" stroke="#C8960C" strokeWidth="1.4"/>
              <path d="M222,15 Q237,2 255,5 Q243,9 222,15" fill="none" stroke="#C8960C" strokeWidth="0.8" opacity="0.55"/>
              <path d="M247,10 Q243,7 238,10" fill="none" stroke="#C8960C" strokeWidth="0.6" opacity="0.5"/>
              {/* Tail feathers */}
              <path d="M205,21 Q200,30 195,36" fill="none" stroke="#C8960C" strokeWidth="1.1" opacity="0.85"/>
              <path d="M210,21 Q210,30 210,36" fill="none" stroke="#C8960C" strokeWidth="1.1" opacity="0.85"/>
              <path d="M215,21 Q220,30 225,36" fill="none" stroke="#C8960C" strokeWidth="1.1" opacity="0.85"/>
              <path d="M202,20 Q195,28 189,34" fill="none" stroke="#C8960C" strokeWidth="0.7" opacity="0.5"/>
              <path d="M218,20 Q225,28 231,34" fill="none" stroke="#C8960C" strokeWidth="0.7" opacity="0.5"/>
              {/* Crest */}
              <path d="M210,9 Q208,2 210,0 Q212,2 210,9" fill="none" stroke="#D4AF37" strokeWidth="1.4"/>
              <path d="M210,9 Q205,3 203,0" fill="none" stroke="#D4AF37" strokeWidth="0.9" opacity="0.7"/>
              <path d="M210,9 Q215,3 217,0" fill="none" stroke="#D4AF37" strokeWidth="0.9" opacity="0.7"/>
              {/* Eye */}
              <circle cx="207" cy="14" r="2" fill="#D4AF37"/>
              <line x1="272" y1="17" x2="420" y2="17" stroke="#8B1A1A" strokeWidth="0.8" opacity="0.35"/>
            </svg>
            <p className="text-[#8B1A1A]/70 italic text-base mb-6">
              Cây có cội, nước có nguồn
            </p>
            {/* Stats badge */}
            {allClanId.length > 0 && (
              <div className="inline-flex items-center gap-2 bg-[#8B1A1A]/8 border border-[#C8960C]/30 px-4 py-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8960C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span className="text-[#8B1A1A] text-[12px] font-bold tracking-wide">
                  {allClanId.length} gia tộc đã đăng ký
                </span>
              </div>
            )}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
            {allClanId.map((clanId, index) => (
              <ClanListItem clanId={clanId} key={index} />
            ))}

            {/* Add new card */}
            <div
              onClick={() => setIsModalOpen(true)}
              className="border-2 border-dashed border-[#8B1A1A]/25 flex flex-col items-center justify-center p-10 min-h-[160px] opacity-50 hover:opacity-100 hover:border-[#8B1A1A]/60 hover:bg-[#8B1A1A]/5 transition-all duration-300 cursor-pointer group"
            >
              <div className="w-12 h-12 border-2 border-dashed border-[#8B1A1A]/40 flex items-center justify-center mb-3 group-hover:border-[#8B1A1A] group-hover:bg-[#8B1A1A] group-hover:text-[#C8960C] text-[#8B1A1A] transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="font-bold text-[#8B1A1A] uppercase tracking-widest text-xs text-center">
                Khai báo<br />gia tộc mới
              </span>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Modal — Khai báo gia tộc */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-950/75 backdrop-blur-sm"
              onClick={() => !isProcessing && setIsModalOpen(false)}
            />

            {/* Modal card */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto custom-scrollbar flex flex-col bg-[#FEFBF0]"
              style={{
                boxShadow:
                  "0 32px 80px rgba(61,38,17,0.45), 0 0 0 1px rgba(93,58,26,0.25)",
              }}
            >
              {/* Top accent bar */}
              <div className="h-1.5 flex-shrink-0 bg-gradient-to-r from-[#6B0000] via-[#C8960C] to-[#6B0000]" />

              {/* ── HEADER ── */}
              <div className="relative px-8 pt-7 pb-6 text-center border-b border-[#8B1A1A]/20 bg-[#F5EDD0]">
                <button
                  type="button"
                  onClick={() => !isProcessing && setIsModalOpen(false)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-[#8B1A1A]/60 hover:text-[#8B1A1A] hover:bg-[#8B1A1A]/10 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>

                {/* Clan icon */}
                <div className="w-12 h-12 mx-auto mb-3 bg-[#8B1A1A] flex items-center justify-center shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C8960C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>

                <h2 className="text-xl font-serif font-bold text-[#8B1A1A] uppercase tracking-[0.2em] mb-1">
                  Khai Báo Gia Tộc
                </h2>
                <p className="text-[#8B1A1A]/60 text-xs font-serif italic">
                  Ghi danh dòng tộc vào sổ bộ — lưu truyền muôn đời trên chuỗi khối
                </p>
              </div>

              {/* ── FORM ── */}
              <form onSubmit={handleSubmit} className="px-8 py-7 space-y-7">

                {/* ─── SECTION I: Dòng tộc ─── */}
                <div>
                  <div className="flex items-center gap-2.5 mb-5">
                    <span className="w-6 h-6 bg-[#8B1A1A] text-[#C8960C] flex items-center justify-center text-[10px] font-bold flex-shrink-0">I</span>
                    <span className="text-[11px] font-bold text-[#8B1A1A] uppercase tracking-[0.22em]">Thông tin Dòng tộc</span>
                    <div className="flex-1 h-px bg-[#8B1A1A]/20" />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-[#8B1A1A]/80 uppercase tracking-wider mb-1.5">
                        Tên dòng tộc
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="clanName"
                        required
                        disabled={isProcessing}
                        onChange={handleInputChange}
                        placeholder="VD: Nguyễn Tộc, Trần Tộc..."
                        className="w-full bg-white border border-[#8B1A1A]/30 hover:border-[#8B1A1A]/60 focus:border-[#8B1A1A] focus:ring-2 focus:ring-[#8B1A1A]/10 px-3.5 py-2.5 outline-none text-sm text-[#8B1A1A] placeholder:text-[#8B1A1A]/40 transition-all disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#8B1A1A]/80 uppercase tracking-wider mb-1.5">
                        Thông tin sơ lược về dòng tộc
                      </label>
                      <textarea
                        name="description"
                        rows="2"
                        disabled={isProcessing}
                        onChange={handleInputChange}
                        placeholder="Vùng đất, thế kỷ định cư, truyền thống đặc trưng..."
                        className="w-full bg-white border border-[#8B1A1A]/30 hover:border-[#8B1A1A]/60 focus:border-[#8B1A1A] focus:ring-2 focus:ring-[#8B1A1A]/10 px-3.5 py-2.5 outline-none text-sm text-[#8B1A1A] placeholder:text-[#8B1A1A]/40 resize-none transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* ─── SECTION II: Thủy tổ ─── */}
                <div>
                  <div className="flex items-center gap-2.5 mb-5">
                    <span className="w-6 h-6 bg-[#8B1A1A] text-[#C8960C] flex items-center justify-center text-[10px] font-bold flex-shrink-0">II</span>
                    <span className="text-[11px] font-bold text-[#8B1A1A] uppercase tracking-[0.22em]">Thông tin Thủy tổ</span>
                    <div className="flex-1 h-px bg-[#8B1A1A]/20" />
                  </div>

                  <div className="space-y-4">
                    {/* Tên + Giới tính (2 cột) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-1 text-[11px] font-bold text-[#8B1A1A]/80 uppercase tracking-wider mb-1.5">
                          Tên Thủy tổ
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="ancestorName"
                          required
                          disabled={isProcessing}
                          onChange={handleInputChange}
                          placeholder="Họ và tên đầy đủ"
                          className="w-full bg-white border border-[#8B1A1A]/30 hover:border-[#8B1A1A]/60 focus:border-[#8B1A1A] focus:ring-2 focus:ring-[#8B1A1A]/10 px-3.5 py-2.5 outline-none text-sm text-[#8B1A1A] placeholder:text-[#8B1A1A]/40 transition-all disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#8B1A1A]/80 uppercase tracking-wider mb-1.5">
                          Giới tính
                        </label>
                        {/* Button-group sex selector */}
                        <div className="flex border border-[#8B1A1A]/30 overflow-hidden">
                          {[
                            { value: 0, label: "Nam" },
                            { value: 1, label: "Nữ" },
                            { value: 2, label: "Không rõ" },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              disabled={isProcessing}
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  ancestorSex: opt.value,
                                }))
                              }
                              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide transition-all disabled:opacity-50 ${
                                formData.ancestorSex === opt.value
                                  ? "bg-[#8B1A1A] text-[#C8960C]"
                                  : "bg-white text-[#8B1A1A]/70 hover:bg-[#F5EDD0]"
                              } ${opt.value !== 2 ? "border-r border-[#8B1A1A]/30" : ""}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Ngày sinh / Ngày mất */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-[#8B1A1A]/80 uppercase tracking-wider mb-1.5">
                          Năm / Ngày sinh
                        </label>
                        <input
                          type="text"
                          name="birthDate"
                          disabled={isProcessing}
                          onChange={handleInputChange}
                          placeholder="VD: 1820 hoặc 15/03/1820"
                          className="w-full bg-white border border-[#8B1A1A]/30 hover:border-[#8B1A1A]/60 focus:border-[#8B1A1A] focus:ring-2 focus:ring-[#8B1A1A]/10 px-3.5 py-2.5 outline-none text-sm text-[#8B1A1A] placeholder:text-[#8B1A1A]/40 transition-all disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${isStillAlive ? "text-[#8B1A1A]/40" : "text-[#8B1A1A]/80"}`}>
                            Năm / Ngày mất
                          </label>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => setIsStillAlive((v) => !v)}
                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-all disabled:opacity-50 ${
                              isStillAlive
                                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                : "bg-stone-100 border-stone-300 text-stone-500"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isStillAlive ? "bg-emerald-500" : "bg-stone-400"}`} />
                            {isStillAlive ? "Còn sống" : "Đã mất"}
                          </button>
                        </div>
                        <input
                          type="text"
                          name="deathDate"
                          disabled={isStillAlive || isProcessing}
                          onChange={handleInputChange}
                          placeholder={isStillAlive ? "—" : "VD: 1895 hoặc 15/03/1895"}
                          className={`w-full border px-3.5 py-2.5 outline-none text-sm transition-all ${
                            isStillAlive
                              ? "bg-stone-50 border-stone-200 text-stone-400 cursor-not-allowed"
                              : "bg-white border-[#8B1A1A]/30 hover:border-[#8B1A1A]/60 focus:border-[#8B1A1A] focus:ring-2 focus:ring-[#8B1A1A]/10 text-[#8B1A1A] placeholder:text-[#8B1A1A]/40"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Tiểu sử */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#8B1A1A]/80 uppercase tracking-wider mb-1.5">
                        Tiểu sử sơ lược
                      </label>
                      <textarea
                        name="ancestorDesc"
                        rows="3"
                        disabled={isProcessing}
                        onChange={handleInputChange}
                        placeholder="Công lao khai phá, vùng đất định cư, giai thoại lưu truyền..."
                        className="w-full bg-white border border-[#8B1A1A]/30 hover:border-[#8B1A1A]/60 focus:border-[#8B1A1A] focus:ring-2 focus:ring-[#8B1A1A]/10 px-3.5 py-2.5 outline-none text-sm text-[#8B1A1A] placeholder:text-[#8B1A1A]/40 resize-none transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* ─── SUBMIT ─── */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full relative bg-[#8B1A1A] hover:bg-[#6B0000] text-[#C8960C] font-bold py-4 uppercase tracking-[0.2em] text-sm shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group"
                  >
                    {/* Shimmer on hover */}
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#C8960C]/30 border-t-[#C8960C]" />
                        <span>Đang ghi sổ bộ...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        <span>Xác nhận khởi tạo</span>
                      </>
                    )}
                  </button>

                  {/* Blockchain note */}
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    <p className="text-[10px] text-[#8B1A1A]/50 italic">
                      Giao dịch sẽ được ký và lưu vĩnh viễn trên LUKSO Mainnet
                    </p>
                  </div>
                </div>
              </form>

              {/* Bottom accent bar */}
              <div className="h-1 flex-shrink-0 bg-gradient-to-r from-[#6B0000] via-[#C8960C] to-[#6B0000]" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
