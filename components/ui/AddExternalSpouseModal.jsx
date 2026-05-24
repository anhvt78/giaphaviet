"use client";
import React, { useContext, useState } from "react";
import { motion } from "framer-motion";
import { GenealogyContext } from "@/context/GenealogyContext";
import sweetalert2 from "@/configs/swal";
import { useSelector } from "react-redux";

export default function AddExternalSpouseModal({ person, clanItem, onClose, fetchDataDialog }) {
  const [externalClanAddress, setExternalClanAddress] = useState("");
  const [externalPersonId, setExternalPersonId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  const { addExternalSpouse } = useContext(GenealogyContext);
  const userWalletAddress = useSelector((s) => s.genealogyReducer.walletAddress);

  const validate = () => {
    const e = {};
    if (!externalClanAddress.trim().startsWith("0x") || externalClanAddress.trim().length !== 42)
      e.clanAddress = "Địa chỉ gia phả không hợp lệ (0x... 42 ký tự)";
    if (!externalPersonId.trim().startsWith("0x") || externalPersonId.trim().length !== 66)
      e.personId = "Token ID không hợp lệ (0x... 66 ký tự)";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setIsProcessing(true);
    addExternalSpouse(
      userWalletAddress, clanItem.clanId,
      person.id, externalClanAddress.trim(), externalPersonId.trim(),
      () => { setIsProcessing(false); onClose(); fetchDataDialog(); },
      (title, err) => { setIsProcessing(false); sweetalert2.popupAlert({ title, text: String(err) }); },
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100]">
      <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-[2px]" onClick={!isProcessing ? onClose : null} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md bg-[#FEFBF0] z-10"
        style={{ boxShadow: "0 24px 60px rgba(61,38,17,0.4), 0 0 0 1px rgba(139,26,26,0.2)" }}
      >
        <div className="h-1.5 bg-gradient-to-r from-[#6B0000] via-[#C8960C] to-[#6B0000]" />

        <div className="px-7 pt-6 pb-3 text-center border-b border-[#8B1A1A]/15 bg-[#F5EDD0]">
          <div className="w-11 h-11 mx-auto mb-3 bg-[#8B1A1A] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8960C" strokeWidth="1.8">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[#8B1A1A] uppercase tracking-[0.18em] mb-1">Phối ngẫu Xuyên gia phả</h2>
          <p className="text-[#8B1A1A]/55 text-xs italic">
            Liên kết <span className="font-bold not-italic">{person?.name}</span> với phối ngẫu thuộc gia phả khác
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
          {/* Clan address input */}
          <div>
            <label className="block text-[11px] font-bold text-[#8B1A1A]/80 uppercase tracking-wider mb-1.5">
              Địa chỉ gia phả ngoài
            </label>
            <input
              type="text"
              value={externalClanAddress}
              onChange={(e) => { setExternalClanAddress(e.target.value); setErrors((err) => ({ ...err, clanAddress: null })); }}
              disabled={isProcessing}
              placeholder="0x... (địa chỉ contract FamilyNFT)"
              className="w-full bg-white border border-[#8B1A1A]/30 hover:border-[#8B1A1A]/60 focus:border-[#8B1A1A] px-3.5 py-2.5 outline-none text-sm text-[#8B1A1A] font-mono placeholder:text-[#8B1A1A]/30 disabled:opacity-50"
            />
            {errors.clanAddress && <p className="text-red-600 text-[10px] mt-1 font-bold">* {errors.clanAddress}</p>}
          </div>

          {/* Person token ID input */}
          <div>
            <label className="block text-[11px] font-bold text-[#8B1A1A]/80 uppercase tracking-wider mb-1.5">
              Token ID của phối ngẫu (bytes32)
            </label>
            <input
              type="text"
              value={externalPersonId}
              onChange={(e) => { setExternalPersonId(e.target.value); setErrors((err) => ({ ...err, personId: null })); }}
              disabled={isProcessing}
              placeholder="0x0000000000000000000000000000000000000000000000000000000000000001"
              className="w-full bg-white border border-[#8B1A1A]/30 hover:border-[#8B1A1A]/60 focus:border-[#8B1A1A] px-3.5 py-2.5 outline-none text-[11px] text-[#8B1A1A] font-mono placeholder:text-[#8B1A1A]/25 disabled:opacity-50"
            />
            {errors.personId && <p className="text-red-600 text-[10px] mt-1 font-bold">* {errors.personId}</p>}
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 bg-[#F5EDD0] border border-[#8B1A1A]/15 px-3 py-2.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C8960C" strokeWidth="2" className="mt-0.5 flex-shrink-0">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
            </svg>
            <p className="text-[10px] text-[#8B1A1A]/60 leading-relaxed">
              Token ID được lấy từ địa chỉ hợp đồng FamilyNFT của gia phả kia. Tìm thấy trên LUKSO Explorer.
            </p>
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
              {isProcessing ? "Đang ghi sổ..." : "Xác nhận liên kết"}
            </button>
          </div>
        </form>

        <div className="h-1 bg-gradient-to-r from-[#6B0000] via-[#C8960C] to-[#6B0000]" />
      </motion.div>
    </div>
  );
}
