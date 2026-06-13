"use client";
import React, { useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GenealogyContext } from "@/context/GenealogyContext";
import sweetalert2 from "@/configs/swal";
import { useSelector } from "react-redux";
import { formatDate } from "../Utils/helpers";

const LINK_TYPES = [
  {
    id: "samePerson",
    label: "Cùng một người thực",
    desc: "Người này trong gia phả của tôi là cùng một cá nhân với người được chọn.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h2"/>
        <circle cx="17" cy="7" r="4"/><path d="M13 21v-2a4 4 0 0 1 4-4h2"/>
        <path d="M9 14h6" strokeDasharray="2 2"/>
      </svg>
    ),
  },
  {
    id: "externalSpouse",
    label: "Phối ngẫu (vợ / chồng)",
    desc: "Người được chọn là vợ hoặc chồng của người này nhưng thuộc gia phả khác.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
];

export default function CrossClanLinkModal({ person, clanItem, onClose, fetchDataDialog }) {
  const [targetClanAddr, setTargetClanAddr] = useState("");
  const [addrError, setAddrError] = useState(null);
  const [loadingPersons, setLoadingPersons] = useState(false);
  const [persons, setPersons] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [linkType, setLinkType] = useState("samePerson");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { getPersonsFromClan, linkSamePerson, addExternalSpouse } = useContext(GenealogyContext);
  const userWalletAddress = useSelector((s) => s.genealogyReducer.walletAddress);

  const handleLoadPersons = async () => {
    const addr = targetClanAddr.trim();
    if (!addr.startsWith("0x") || addr.length !== 42) {
      setAddrError("Địa chỉ không hợp lệ (0x... 42 ký tự)");
      return;
    }
    if (addr.toLowerCase() === clanItem?.clanId?.toLowerCase()) {
      setAddrError("Không thể liên kết với chính gia phả này");
      return;
    }
    setAddrError(null);
    setLoadingPersons(true);
    setPersons(null);
    setSelectedPerson(null);
    const res = await getPersonsFromClan(addr);
    setLoadingPersons(false);
    if (!res.sts) {
      setAddrError("Không thể tải danh sách — kiểm tra lại địa chỉ.");
      return;
    }
    setPersons(res.data);
  };

  const handleSubmit = () => {
    if (!selectedPerson) return;
    setIsSubmitting(true);
    const addr = targetClanAddr.trim();

    const onSuccess = () => {
      setIsSubmitting(false);
      onClose();
      fetchDataDialog();
      sweetalert2.popupAlert({
        title: "Liên kết thành công",
        text: linkType === "samePerson"
          ? `Đã đánh dấu ${person.name} là cùng người với ${selectedPerson.name}.`
          : `Đã liên kết ${selectedPerson.name} là phối ngẫu của ${person.name}.`,
      });
    };

    const onError = (title, err) => {
      setIsSubmitting(false);
      sweetalert2.popupAlert({ title, text: String(err) });
    };

    if (linkType === "samePerson") {
      linkSamePerson(userWalletAddress, clanItem.clanId, person.id, addr, selectedPerson.id, onSuccess, onError);
    } else {
      addExternalSpouse(userWalletAddress, clanItem.clanId, person.id, addr, selectedPerson.id, onSuccess, onError);
    }
  };

  const filtered = persons?.filter((p) =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const step = persons === null ? "lookup" : selectedPerson ? "confirm" : "pick";

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100]">
      <div
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-[2px]"
        onClick={!isSubmitting ? onClose : undefined}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-lg bg-[#FEFBF0] z-10 flex flex-col max-h-[90vh]"
        style={{ boxShadow: "0 24px 60px rgba(61,38,17,0.4), 0 0 0 1px rgba(139,26,26,0.2)" }}
      >
        {/* Top bar */}
        <div className="classical-decor h-1.5 bg-gradient-to-r from-[#6B0000] via-[#C8960C] to-[#6B0000] flex-shrink-0" />

        {/* Header */}
        <div className="px-7 pt-5 pb-4 border-b border-[#8B1A1A]/15 bg-[#F5EDD0] flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#8B1A1A] flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8960C" strokeWidth="1.8">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#8B1A1A] uppercase tracking-[0.15em]">Liên kết xuyên gia phả</h2>
              <p className="text-[#8B1A1A]/55 text-xs italic mt-0.5">
                Kết nối <span className="font-bold not-italic">{person?.name}</span> với thành viên thuộc gia phả khác
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-5 space-y-5 min-h-0">

          {/* Step 1: Clan address input */}
          <div>
            <label className="block text-[10px] font-bold text-[#8B1A1A]/70 uppercase tracking-widest mb-1.5">
              Địa chỉ FamilyNFT contract của gia phả kia
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={targetClanAddr}
                onChange={(e) => { setTargetClanAddr(e.target.value); setAddrError(null); setPersons(null); setSelectedPerson(null); }}
                disabled={loadingPersons || isSubmitting}
                placeholder="0x... (42 ký tự)"
                className="flex-1 min-w-0 bg-white border border-[#8B1A1A]/30 hover:border-[#8B1A1A]/60 focus:border-[#8B1A1A] px-3 py-2.5 outline-none text-sm text-[#8B1A1A] font-mono placeholder:text-[#8B1A1A]/30 disabled:opacity-50"
              />
              <button
                onClick={handleLoadPersons}
                disabled={!targetClanAddr.trim() || loadingPersons || isSubmitting}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#8B1A1A] text-[#C8960C] text-[11px] font-bold uppercase tracking-wider hover:bg-[#6B0000] transition-all disabled:opacity-40 whitespace-nowrap flex-shrink-0"
              >
                {loadingPersons ? (
                  <div className="animate-spin h-3 w-3 border-2 border-[#C8960C]/30 border-t-[#C8960C] rounded-full" />
                ) : (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.55"/>
                  </svg>
                )}
                {loadingPersons ? "Đang tải..." : "Tải danh sách"}
              </button>
            </div>
            {addrError && <p className="text-red-600 text-[10px] mt-1 font-bold">* {addrError}</p>}
          </div>

          {/* Step 2: Person list */}
          <AnimatePresence>
            {persons !== null && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {/* Search */}
                <div className="relative">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B1A1A" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên..."
                    className="w-full pl-8 pr-3 py-2 bg-white border border-[#8B1A1A]/20 focus:border-[#8B1A1A]/50 outline-none text-sm text-[#8B1A1A] placeholder:text-[#8B1A1A]/30"
                  />
                </div>

                {/* Count */}
                <p className="text-[10px] text-[#8B1A1A]/50 uppercase tracking-wider">
                  {filtered.length} thành viên {searchQuery ? `khớp "${searchQuery}"` : `trong gia phả`} — chọn một để liên kết
                </p>

                {/* List */}
                <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                  {filtered.length === 0 ? (
                    <p className="text-center text-[12px] text-[#8B1A1A]/40 italic py-6">Không tìm thấy thành viên nào.</p>
                  ) : filtered.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPerson(selectedPerson?.id === p.id ? null : p)}
                      className={`w-full text-left px-3 py-2.5 border transition-all flex items-center gap-3 ${
                        selectedPerson?.id === p.id
                          ? "border-[#8B1A1A] bg-[#8B1A1A]/5"
                          : "border-[#8B1A1A]/15 bg-white hover:border-[#8B1A1A]/40 hover:bg-[#8B1A1A]/3"
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full border ${
                        p.gender === "female" ? "border-rose-300 bg-rose-50" : "border-[#8B1A1A]/20 bg-[#8B1A1A]/5"
                      }`}>
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill={p.gender === "female" ? "#be185d" : "#8B1A1A"} opacity="0.7">
                          <circle cx="12" cy="8" r="4"/><path d="M4 20 Q4 15 12 15 Q20 15 20 20Z"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#3d2611] truncate">{p.name}</p>
                        <p className="text-[10px] text-[#8B1A1A]/50 truncate">
                          {p.isDeceased ? "✝ " : ""}{formatDate(p.birthDate) || "—"}
                          {p.shortDesc ? ` · ${p.shortDesc.slice(0, 40)}` : ""}
                        </p>
                      </div>
                      {selectedPerson?.id === p.id && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B1A1A" strokeWidth="2.5" className="flex-shrink-0">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3: Relationship type (shown after selecting a person) */}
          <AnimatePresence>
            {selectedPerson && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2 border-t border-[#8B1A1A]/10 pt-4"
              >
                <p className="text-[10px] font-bold text-[#8B1A1A]/70 uppercase tracking-widest mb-2">
                  Kiểu liên kết với <span className="text-[#8B1A1A]">{selectedPerson.name}</span>
                </p>
                {LINK_TYPES.map((lt) => (
                  <button
                    key={lt.id}
                    onClick={() => setLinkType(lt.id)}
                    className={`w-full text-left px-4 py-3 border transition-all flex items-start gap-3 ${
                      linkType === lt.id
                        ? "border-[#8B1A1A] bg-[#8B1A1A]/5"
                        : "border-[#8B1A1A]/15 bg-white hover:border-[#8B1A1A]/30"
                    }`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 ${linkType === lt.id ? "text-[#8B1A1A]" : "text-[#8B1A1A]/40"}`}>
                      {lt.icon}
                    </div>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-wide ${linkType === lt.id ? "text-[#8B1A1A]" : "text-[#8B1A1A]/60"}`}>
                        {lt.label}
                      </p>
                      <p className="text-[10px] text-[#8B1A1A]/50 mt-0.5 leading-relaxed">{lt.desc}</p>
                    </div>
                    <div className={`ml-auto flex-shrink-0 mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      linkType === lt.id ? "border-[#8B1A1A]" : "border-[#8B1A1A]/30"
                    }`}>
                      {linkType === lt.id && <div className="w-2 h-2 rounded-full bg-[#8B1A1A]" />}
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-[#8B1A1A]/15 bg-[#F5EDD0]/60 flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 border border-[#8B1A1A]/30 text-[#8B1A1A] font-bold text-[11px] uppercase tracking-wider hover:bg-[#8B1A1A]/5 transition-all disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedPerson || isSubmitting}
            className="flex-1 py-2.5 bg-[#8B1A1A] text-[#C8960C] font-bold text-[11px] uppercase tracking-wider hover:bg-[#6B0000] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting && <div className="animate-spin h-3.5 w-3.5 border-2 border-[#C8960C]/30 border-t-[#C8960C] rounded-full" />}
            {isSubmitting ? "Đang ghi sổ..." : "Xác nhận liên kết"}
          </button>
        </div>

        <div className="classical-decor h-1 bg-gradient-to-r from-[#6B0000] via-[#C8960C] to-[#6B0000] flex-shrink-0" />
      </motion.div>
    </div>
  );
}
