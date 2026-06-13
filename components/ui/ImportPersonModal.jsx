"use client";
import React, { useContext, useState } from "react";
import { motion } from "framer-motion";
import { GenealogyContext } from "@/context/GenealogyContext";
import sweetalert2 from "@/configs/swal";
import { useSelector } from "react-redux";

export default function ImportPersonModal({ clanItem, onClose, fetchDataDialog }) {
  const [isStillAlive, setIsStillAlive] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    shortDesc: "",
    sex: 0,
    birthDate: "",
    deathDate: "",
    srcClanAddress: "",
    srcPersonId: "",
  });

  const { importPerson } = useContext(GenealogyContext);
  const userWalletAddress = useSelector((s) => s.genealogyReducer.walletAddress);

  const parseDateInput = (dateStr) => {
    if (!dateStr || dateStr.trim() === "") return { day: 0, month: 0, year: 0 };
    const parts = dateStr.split(/[\/\-.]/);
    let day = 0, month = 0, year = 0;
    if (parts.length === 3) {
      day = parseInt(parts[0]) || 0;
      month = parseInt(parts[1]) || 0;
      year = parseInt(parts[2]) || 0;
    } else {
      year = parseInt(parts[0]) || 0;
    }
    if (year !== 0 && month === 0) month = 1;
    if (year !== 0 && day === 0) day = 1;
    return { day, month, year };
  };

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = "Danh tánh không được để trống";
    if (!formData.srcClanAddress.trim().startsWith("0x") || formData.srcClanAddress.trim().length !== 42)
      e.srcClanAddress = "Địa chỉ gia phả nguồn không hợp lệ";
    if (!formData.srcPersonId.trim().startsWith("0x") || formData.srcPersonId.trim().length !== 66)
      e.srcPersonId = "Token ID nguồn không hợp lệ (bytes32)";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setIsProcessing(true);

    const payload = {
      name: formData.name.trim(),
      shortDesc: formData.shortDesc.trim(),
      sex: formData.sex,
      birthDate: parseDateInput(formData.birthDate),
      deathDate: isStillAlive ? { day: 0, month: 0, year: 0 } : parseDateInput(formData.deathDate),
      isDeceased: !isStillAlive,
      srcClanAddress: formData.srcClanAddress.trim(),
      srcPersonId: formData.srcPersonId.trim(),
    };

    importPerson(
      userWalletAddress, clanItem.clanId, payload,
      (newPersonId) => { setIsProcessing(false); onClose(); fetchDataDialog(); },
      (title, err) => { setIsProcessing(false); sweetalert2.popupAlert({ title, text: String(err) }); },
    );
  };

  const field = (label, key, placeholder, type = "text") => (
    <div>
      <label className="block text-[11px] font-bold text-[#8B1A1A]/80 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={formData[key]}
        onChange={(e) => { setFormData((f) => ({ ...f, [key]: e.target.value })); setErrors((err) => ({ ...err, [key]: null })); }}
        disabled={isProcessing}
        placeholder={placeholder}
        className="w-full bg-white border border-[#8B1A1A]/30 hover:border-[#8B1A1A]/60 focus:border-[#8B1A1A] px-3.5 py-2.5 outline-none text-sm text-[#8B1A1A] font-mono placeholder:text-[#8B1A1A]/30 disabled:opacity-50"
      />
      {errors[key] && <p className="text-red-600 text-[10px] mt-1 font-bold">* {errors[key]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100]">
      <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-[2px]" onClick={!isProcessing ? onClose : null} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-lg bg-[#FEFBF0] z-10 max-h-[92vh] flex flex-col"
        style={{ boxShadow: "0 24px 60px rgba(61,38,17,0.4), 0 0 0 1px rgba(139,26,26,0.2)" }}
      >
        <div className="classical-decor h-1.5 bg-gradient-to-r from-[#6B0000] via-[#C8960C] to-[#6B0000] flex-shrink-0" />

        <div className="px-7 pt-6 pb-4 text-center border-b border-[#8B1A1A]/15 bg-[#F5EDD0] flex-shrink-0">
          <div className="w-11 h-11 mx-auto mb-3 bg-[#8B1A1A] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8960C" strokeWidth="1.8">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[#8B1A1A] uppercase tracking-[0.18em] mb-1">Nhập Thành viên Xuyên gia phả</h2>
          <p className="text-[#8B1A1A]/55 text-xs italic">Nhập bản ghi từ gia phả khác và liên kết nguồn gốc</p>
        </div>

        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5 overflow-y-auto flex-1">

          {/* Section A: Thông tin cá nhân */}
          <div className="border-b border-[#8B1A1A]/10 pb-5 space-y-4">
            <p className="text-[10px] font-bold text-[#8B1A1A]/50 uppercase tracking-widest">Thông tin cá nhân</p>

            <div>
              <label className="block text-[11px] font-bold text-[#8B1A1A]/80 uppercase tracking-wider mb-1.5">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={formData.name}
                onChange={(e) => { setFormData((f) => ({ ...f, name: e.target.value })); setErrors((err) => ({ ...err, name: null })); }}
                disabled={isProcessing}
                placeholder="Ví dụ: Nguyễn Thị A"
                className="w-full bg-white border border-[#8B1A1A]/30 hover:border-[#8B1A1A]/60 focus:border-[#8B1A1A] px-3.5 py-2.5 outline-none text-sm text-[#8B1A1A] placeholder:text-[#8B1A1A]/30 disabled:opacity-50"
              />
              {errors.name && <p className="text-red-600 text-[10px] mt-1 font-bold">* {errors.name}</p>}
            </div>

            {/* Giới tính */}
            <div>
              <label className="block text-[11px] font-bold text-[#8B1A1A]/80 uppercase tracking-wider mb-1.5">Giới tính</label>
              <div className="flex border border-[#8B1A1A]/30 overflow-hidden">
                {[{ v: 0, l: "Nam" }, { v: 1, l: "Nữ" }, { v: 2, l: "Không rõ" }].map(({ v, l }, i) => (
                  <button
                    key={v}
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setFormData((f) => ({ ...f, sex: v }))}
                    className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide transition-all disabled:opacity-50 ${formData.sex === v ? "bg-[#8B1A1A] text-[#C8960C]" : "bg-white text-[#8B1A1A]/70 hover:bg-[#F5EDD0]"} ${i < 2 ? "border-r border-[#8B1A1A]/30" : ""}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Ngày sinh / mất */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#8B1A1A]/80 uppercase tracking-wider mb-1.5">Năm/Ngày sinh</label>
                <input
                  type="text"
                  value={formData.birthDate}
                  onChange={(e) => setFormData((f) => ({ ...f, birthDate: e.target.value }))}
                  disabled={isProcessing}
                  placeholder="VD: 1860 hoặc 01/03/1860"
                  className="w-full bg-white border border-[#8B1A1A]/30 focus:border-[#8B1A1A] px-3 py-2.5 outline-none text-sm text-[#8B1A1A] placeholder:text-[#8B1A1A]/30 disabled:opacity-50"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${isStillAlive ? "text-[#8B1A1A]/40" : "text-[#8B1A1A]/80"}`}>
                    Năm/Ngày mất
                  </label>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setIsStillAlive((v) => !v)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-all disabled:opacity-50 ${isStillAlive ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-stone-100 border-stone-300 text-stone-500"}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isStillAlive ? "bg-emerald-500" : "bg-stone-400"}`} />
                    {isStillAlive ? "Còn sống" : "Đã mất"}
                  </button>
                </div>
                <input
                  type="text"
                  value={isStillAlive ? "" : formData.deathDate}
                  onChange={(e) => setFormData((f) => ({ ...f, deathDate: e.target.value }))}
                  disabled={isStillAlive || isProcessing}
                  placeholder={isStillAlive ? "—" : "VD: 1920 hoặc 15/03/1920"}
                  className={`w-full border px-3 py-2.5 outline-none text-sm transition-all ${isStillAlive ? "bg-stone-50 border-stone-200 text-stone-400 cursor-not-allowed" : "bg-white border-[#8B1A1A]/30 focus:border-[#8B1A1A] text-[#8B1A1A] placeholder:text-[#8B1A1A]/30"}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#8B1A1A]/80 uppercase tracking-wider mb-1.5">Tiểu sử sơ lược</label>
              <textarea
                rows="2"
                value={formData.shortDesc}
                onChange={(e) => setFormData((f) => ({ ...f, shortDesc: e.target.value }))}
                disabled={isProcessing}
                placeholder="Ghi chú nguồn gốc, công lao..."
                className="w-full bg-white border border-[#8B1A1A]/30 focus:border-[#8B1A1A] px-3.5 py-2.5 outline-none text-sm text-[#8B1A1A] placeholder:text-[#8B1A1A]/30 resize-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Section B: Nguồn gốc */}
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-[#8B1A1A]/50 uppercase tracking-widest">Nguồn gốc Blockchain</p>
            {field("Địa chỉ gia phả nguồn *", "srcClanAddress", "0x... (FamilyNFT contract address)")}
            {field("Token ID nguồn (bytes32) *", "srcPersonId", "0x0000000000000000000000000000000000000000000000000000000000000001")}
            <div className="flex items-start gap-2 bg-[#F5EDD0] border border-[#8B1A1A]/15 px-3 py-2.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C8960C" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
              </svg>
              <p className="text-[10px] text-[#8B1A1A]/60 leading-relaxed">
                Chỉ chủ sở hữu token tổ tiên mới có quyền nhập thành viên xuyên gia phả. Dữ liệu liên kết nguồn được lưu vĩnh viễn trên blockchain.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-2.5 border border-[#8B1A1A]/30 text-[#8B1A1A] font-bold text-[11px] uppercase tracking-wider hover:bg-[#8B1A1A]/5 transition-all disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 py-2.5 bg-[#8B1A1A] text-[#C8960C] font-bold text-[11px] uppercase tracking-wider hover:bg-[#6B0000] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isProcessing && <div className="animate-spin h-3.5 w-3.5 border-2 border-[#C8960C]/30 border-t-[#C8960C] rounded-full" />}
              {isProcessing ? "Đang ghi sổ..." : "Xác nhận nhập liệu"}
            </button>
          </div>
        </form>

        <div className="classical-decor h-1 bg-gradient-to-r from-[#6B0000] via-[#C8960C] to-[#6B0000] flex-shrink-0" />
      </motion.div>
    </div>
  );
}
