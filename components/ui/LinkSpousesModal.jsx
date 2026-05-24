"use client";
import React, { useContext, useState } from "react";
import { motion } from "framer-motion";
import { GenealogyContext } from "@/context/GenealogyContext";
import sweetalert2 from "@/configs/swal";
import { useSelector } from "react-redux";

export default function LinkSpousesModal({ clanItem, familyData, onClose, fetchDataDialog }) {
  const [person1Id, setPerson1Id] = useState("");
  const [person2Id, setPerson2Id] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { linkSpouses } = useContext(GenealogyContext);
  const userWalletAddress = useSelector((s) => s.genealogyReducer.walletAddress);

  const eligiblePeople = (familyData || []).filter((p) => !p.isSpouse);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!person1Id || !person2Id) {
      sweetalert2.popupAlert({ title: "Thiếu thông tin", text: "Vui lòng chọn đủ hai thành viên." });
      return;
    }
    if (person1Id === person2Id) {
      sweetalert2.popupAlert({ title: "Không hợp lệ", text: "Không thể liên kết một người với chính họ." });
      return;
    }
    setIsProcessing(true);
    linkSpouses(
      userWalletAddress, clanItem.clanId,
      person1Id, person2Id,
      () => { setIsProcessing(false); onClose(); fetchDataDialog(); },
      (title, err) => { setIsProcessing(false); sweetalert2.popupAlert({ title, text: String(err) }); },
    );
  };

  const SelectPerson = ({ label, value, onChange, excludeId }) => (
    <div>
      <label className="block text-[11px] font-bold text-[#8B1A1A]/80 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isProcessing}
        className="w-full bg-white border border-[#8B1A1A]/30 focus:border-[#8B1A1A] px-3.5 py-2.5 outline-none text-sm text-[#8B1A1A] disabled:opacity-50"
      >
        <option value="">— Chọn thành viên —</option>
        {eligiblePeople
          .filter((p) => p.id !== excludeId)
          .map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.gender === "male" ? "Nam" : p.gender === "female" ? "Nữ" : "?"})
            </option>
          ))}
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100]">
      <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-[2px]" onClick={!isProcessing ? onClose : null} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md bg-[#FEFBF0] z-10"
        style={{ boxShadow: "0 24px 60px rgba(61,38,17,0.4), 0 0 0 1px rgba(139,26,26,0.2)" }}
      >
        {/* Top accent */}
        <div className="h-1.5 bg-gradient-to-r from-[#6B0000] via-[#C8960C] to-[#6B0000]" />

        <div className="px-7 pt-6 pb-3 text-center border-b border-[#8B1A1A]/15 bg-[#F5EDD0]">
          <div className="w-11 h-11 mx-auto mb-3 bg-[#8B1A1A] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8960C" strokeWidth="1.8">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[#8B1A1A] uppercase tracking-[0.18em] mb-1">Liên kết Phối ngẫu</h2>
          <p className="text-[#8B1A1A]/55 text-xs italic">Kết nối hai thành viên đã có trong gia phả thành phối ngẫu</p>
        </div>

        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
          <SelectPerson label="Thành viên thứ nhất" value={person1Id} onChange={setPerson1Id} excludeId={person2Id} />
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#8B1A1A]/15" />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8960C" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <div className="flex-1 h-px bg-[#8B1A1A]/15" />
          </div>
          <SelectPerson label="Thành viên thứ hai" value={person2Id} onChange={setPerson2Id} excludeId={person1Id} />

          <div className="flex gap-3 pt-2">
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
              {isProcessing ? "Đang ghi sổ..." : "Xác nhận liên kết"}
            </button>
          </div>
        </form>

        <div className="h-1 bg-gradient-to-r from-[#6B0000] via-[#C8960C] to-[#6B0000]" />
      </motion.div>
    </div>
  );
}
