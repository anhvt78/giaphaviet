"use client";
import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { setWalletAddress } from "@/redux/genealogySlide";
import { GenealogyContext } from "@/context/GenealogyContext";
import ClanListItem from "./Items/ClanListItem";
import sweetalert2 from "@/configs/swal";
import Lottie from "lottie-react";
import loaderAnimation from "../assets/animations/loader.json";

export default function ClanListForm({ userWalletAddress }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { getNFTCollection, createClan } = useContext(GenealogyContext);
  const [isLoading, setIsLoading] = useState(true);
  const [allClanId, setAllClanId] = useState([]);
  const [isCreator, setIsCreator] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleDisconnect = () => {
    dispatch(setWalletAddress(""));
  };

  const shortAddress = userWalletAddress
    ? `${userWalletAddress.slice(0, 6)}...${userWalletAddress.slice(-4)}`
    : "";

  return (
    <div className="min-h-screen w-full bg-[#e8d5b5] font-serif flex flex-col">

      {/* ── STICKY NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-[#1e0f05]/95 backdrop-blur-sm border-b border-[#5d3a1a]/30 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full border border-[#c4922a] flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c4922a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <span className="text-[#c4922a] font-bold uppercase tracking-[0.25em] text-[13px] hidden sm:block">
            Gia Phả Việt
          </span>
        </div>

        <div className="flex items-center gap-3">
          {shortAddress && (
            <div className="flex items-center gap-2 bg-[#3d2611]/60 border border-[#5d3a1a]/40 px-3 py-1.5 rounded-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[#c4922a]/80 text-[11px] font-mono tracking-wide">{shortAddress}</span>
            </div>
          )}
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[#8b6045] hover:text-[#f2e2ba] border border-[#5d3a1a]/30 hover:border-[#5d3a1a]/60 text-[11px] font-bold uppercase tracking-wider transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 overflow-y-auto py-12 md:py-16">
      {isLoading ? (
        <div className="fixed inset-0 flex flex-col justify-center items-center bg-[#1a0d05]/90 backdrop-blur-sm z-40">
          {/* Spinner */}
          <div className="relative w-24 h-24 mb-8">
            {/* Outer ring — slow clockwise */}
            <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: "3s" }} viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="44" fill="none" stroke="#3d2611" strokeWidth="2"/>
              <circle cx="48" cy="48" r="44" fill="none" stroke="#c4922a" strokeWidth="2"
                strokeDasharray="138 138" strokeDashoffset="103" strokeLinecap="round"/>
            </svg>
            {/* Middle ring — faster counter-clockwise */}
            <svg className="absolute inset-3 w-[72px] h-[72px] animate-spin" style={{ animationDuration: "2s", animationDirection: "reverse" }} viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="32" fill="none" stroke="#5d3a1a" strokeWidth="1.5"/>
              <circle cx="36" cy="36" r="32" fill="none" stroke="#8b5a2b" strokeWidth="1.5"
                strokeDasharray="60 141" strokeLinecap="round"/>
            </svg>
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c4922a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
          </div>

          {/* Text */}
          <p className="text-[#f2e2ba] text-sm font-serif uppercase tracking-[0.3em] animate-pulse mb-2">
            Đang kết nối blockchain...
          </p>
          <p className="text-[#5d3a1a] text-[11px] font-mono tracking-widest uppercase">
            LUKSO Mainnet
          </p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">

          {/* Page header */}
          <div className="w-full max-w-5xl text-center mb-12">
            <p className="text-[#8b5a2b] text-xs uppercase tracking-[0.3em] font-bold mb-3">
              Kho lưu trữ dòng tộc
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-[#3d2611] tracking-[0.15em] uppercase mb-4">
              Gia Phả Của Bạn
            </h1>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-16 bg-[#5d3a1a]/40" />
              <p className="text-[#5d3a1a] italic text-base">
                Cây có cội, nước có nguồn
              </p>
              <div className="h-px w-16 bg-[#5d3a1a]/40" />
            </div>
            {/* Stats badge */}
            {allClanId.length > 0 && (
              <div className="inline-flex items-center gap-2 bg-[#3d2611]/8 border border-[#8b5a2b]/25 px-4 py-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5a2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span className="text-[#5d3a1a] text-[12px] font-bold tracking-wide">
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
              className="border-2 border-dashed border-[#5d3a1a]/25 flex flex-col items-center justify-center p-10 min-h-[160px] opacity-50 hover:opacity-100 hover:border-[#5d3a1a]/60 hover:bg-[#3d2611]/5 transition-all duration-300 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#5d3a1a]/40 flex items-center justify-center mb-3 group-hover:border-[#5d3a1a] group-hover:bg-[#5d3a1a] group-hover:text-[#f2e2ba] text-[#5d3a1a] transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="font-bold text-[#5d3a1a] uppercase tracking-widest text-xs text-center">
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
              className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto custom-scrollbar flex flex-col bg-[#fdf8e9]"
              style={{
                boxShadow:
                  "0 32px 80px rgba(61,38,17,0.45), 0 0 0 1px rgba(93,58,26,0.25)",
              }}
            >
              {/* Top accent bar */}
              <div className="h-1.5 flex-shrink-0 bg-gradient-to-r from-[#3d2611] via-[#c4922a] to-[#3d2611]" />

              {/* ── HEADER ── */}
              <div className="relative px-8 pt-7 pb-6 text-center border-b border-[#8b5a2b]/20 bg-[#f5edd8]">
                <button
                  type="button"
                  onClick={() => !isProcessing && setIsModalOpen(false)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-[#8b5a2b] hover:text-[#3d2611] hover:bg-[#8b5a2b]/10 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>

                {/* Clan icon */}
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#3d2611] flex items-center justify-center shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f2e2ba" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>

                <h2 className="text-xl font-serif font-bold text-[#3d2611] uppercase tracking-[0.2em] mb-1">
                  Khai Báo Gia Tộc
                </h2>
                <p className="text-[#8b5a2b] text-xs font-serif italic">
                  Ghi danh dòng tộc vào sổ bộ — lưu truyền muôn đời trên chuỗi khối
                </p>
              </div>

              {/* ── FORM ── */}
              <form onSubmit={handleSubmit} className="px-8 py-7 space-y-7">

                {/* ─── SECTION I: Dòng tộc ─── */}
                <div>
                  <div className="flex items-center gap-2.5 mb-5">
                    <span className="w-6 h-6 rounded-full bg-[#3d2611] text-[#f2e2ba] flex items-center justify-center text-[10px] font-bold flex-shrink-0">I</span>
                    <span className="text-[11px] font-bold text-[#3d2611] uppercase tracking-[0.22em]">Thông tin Dòng tộc</span>
                    <div className="flex-1 h-px bg-[#8b5a2b]/25" />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-[#5d3a1a] uppercase tracking-wider mb-1.5">
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
                        className="w-full bg-white border border-[#8b5a2b]/35 hover:border-[#5d3a1a]/60 focus:border-[#3d2611] focus:ring-2 focus:ring-[#3d2611]/10 px-3.5 py-2.5 outline-none text-sm text-[#3d2611] placeholder:text-[#8b5a2b]/50 transition-all disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#5d3a1a] uppercase tracking-wider mb-1.5">
                        Thông tin sơ lược về dòng tộc
                      </label>
                      <textarea
                        name="description"
                        rows="2"
                        disabled={isProcessing}
                        onChange={handleInputChange}
                        placeholder="Vùng đất, thế kỷ định cư, truyền thống đặc trưng..."
                        className="w-full bg-white border border-[#8b5a2b]/35 hover:border-[#5d3a1a]/60 focus:border-[#3d2611] focus:ring-2 focus:ring-[#3d2611]/10 px-3.5 py-2.5 outline-none text-sm text-[#3d2611] placeholder:text-[#8b5a2b]/50 resize-none transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* ─── SECTION II: Thủy tổ ─── */}
                <div>
                  <div className="flex items-center gap-2.5 mb-5">
                    <span className="w-6 h-6 rounded-full bg-[#3d2611] text-[#f2e2ba] flex items-center justify-center text-[10px] font-bold flex-shrink-0">II</span>
                    <span className="text-[11px] font-bold text-[#3d2611] uppercase tracking-[0.22em]">Thông tin Thủy tổ</span>
                    <div className="flex-1 h-px bg-[#8b5a2b]/25" />
                  </div>

                  <div className="space-y-4">
                    {/* Tên + Giới tính (2 cột) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-1 text-[11px] font-bold text-[#5d3a1a] uppercase tracking-wider mb-1.5">
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
                          className="w-full bg-white border border-[#8b5a2b]/35 hover:border-[#5d3a1a]/60 focus:border-[#3d2611] focus:ring-2 focus:ring-[#3d2611]/10 px-3.5 py-2.5 outline-none text-sm text-[#3d2611] placeholder:text-[#8b5a2b]/50 transition-all disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#5d3a1a] uppercase tracking-wider mb-1.5">
                          Giới tính
                        </label>
                        {/* Button-group sex selector */}
                        <div className="flex border border-[#8b5a2b]/35 overflow-hidden">
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
                                  ? "bg-[#3d2611] text-[#f2e2ba]"
                                  : "bg-white text-[#5d3a1a] hover:bg-[#f5edd8]"
                              } ${opt.value !== 2 ? "border-r border-[#8b5a2b]/35" : ""}`}
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
                        <label className="block text-[11px] font-bold text-[#5d3a1a] uppercase tracking-wider mb-1.5">
                          Năm / Ngày sinh
                        </label>
                        <input
                          type="text"
                          name="birthDate"
                          disabled={isProcessing}
                          onChange={handleInputChange}
                          placeholder="VD: 1820 hoặc 15/03/1820"
                          className="w-full bg-white border border-[#8b5a2b]/35 hover:border-[#5d3a1a]/60 focus:border-[#3d2611] focus:ring-2 focus:ring-[#3d2611]/10 px-3.5 py-2.5 outline-none text-sm text-[#3d2611] placeholder:text-[#8b5a2b]/50 transition-all disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${isStillAlive ? "text-[#8b5a2b]/50" : "text-[#5d3a1a]"}`}>
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
                              : "bg-white border-[#8b5a2b]/35 hover:border-[#5d3a1a]/60 focus:border-[#3d2611] focus:ring-2 focus:ring-[#3d2611]/10 text-[#3d2611] placeholder:text-[#8b5a2b]/50"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Tiểu sử */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#5d3a1a] uppercase tracking-wider mb-1.5">
                        Tiểu sử sơ lược
                      </label>
                      <textarea
                        name="ancestorDesc"
                        rows="3"
                        disabled={isProcessing}
                        onChange={handleInputChange}
                        placeholder="Công lao khai phá, vùng đất định cư, giai thoại lưu truyền..."
                        className="w-full bg-white border border-[#8b5a2b]/35 hover:border-[#5d3a1a]/60 focus:border-[#3d2611] focus:ring-2 focus:ring-[#3d2611]/10 px-3.5 py-2.5 outline-none text-sm text-[#3d2611] placeholder:text-[#8b5a2b]/50 resize-none transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* ─── SUBMIT ─── */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full relative bg-[#3d2611] hover:bg-[#2a1a0a] text-[#f2e2ba] font-bold py-4 uppercase tracking-[0.2em] text-sm shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group"
                  >
                    {/* Shimmer on hover */}
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#f2e2ba]/30 border-t-[#f2e2ba]" />
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b5a2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    <p className="text-[10px] text-[#8b5a2b]/70 italic">
                      Giao dịch sẽ được ký và lưu vĩnh viễn trên LUKSO Mainnet
                    </p>
                  </div>
                </div>
              </form>

              {/* Bottom accent bar */}
              <div className="h-1 flex-shrink-0 bg-gradient-to-r from-[#3d2611] via-[#c4922a] to-[#3d2611]" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
