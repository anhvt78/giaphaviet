import React, { useContext, useState } from "react";
import { motion } from "framer-motion";
import sweetalert2 from "@/configs/swal";
import { GenealogyContext } from "@/context/GenealogyContext";
import { useSelector } from "react-redux";

export default function UpdateClanShortDescModal({
  clanItem,
  onClose,
  fetchDataDetail,
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const [clanShortDesc, setClanShortDesc] = useState(clanItem.shortDesc);

  const { updateClanShortDesc } = useContext(GenealogyContext);

  const userWalletAddress = useSelector(
    (state) => state.genealogyReducer.walletAddress,
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsProcessing(true); // Bắt đầu trạng thái chờ giống ClanListForm

    updateClanShortDesc(
      userWalletAddress,
      clanItem.clanId,
      clanShortDesc,
      callBack,
      handleErr,
    );
  };

  const callBack = () => {
    // console.log("newChildId: ", newChildId);
    onClose();
    setIsProcessing(false);
    fetchDataDetail();
    // router.push(`/pages/detail/${clanId}`);
  };

  const handleErr = (title, error) => {
    setIsProcessing(false);
    onClose();
    sweetalert2.popupAlert({
      title: title,
      text: error,
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100]">
      {/* Lớp nền mờ */}
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]"
        onClick={!isProcessing ? onClose : null}
      />

      {/* Nội dung Modal - Phong cách sớ/giấy cổ */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#fdf8e9] border-4 border-double border-[#5d3a1a] shadow-2xl w-full max-w-md p-8 z-10 relative"
      >
        <h2 className="text-2xl font-serif font-bold text-[#3d2611] mb-2 text-center border-b border-[#8b5a2b]/30 pb-2 uppercase">
          Cập nhật thông tin
        </h2>
        <p className="text-[#8b5a2b] text-center text-xs font-serif italic mb-6">
          Chỉnh sửa thông tin mô tả sơ lược dòng tộc
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 font-serif">
          {/* Tiểu sử ngắn */}
          <div>
            <label className="block text-xs font-bold text-[#5d3a1a] uppercase tracking-widest mb-1">
              Thông tin sơ lược
            </label>
            <textarea
              disabled={isProcessing}
              className="w-full px-4 py-2 bg-[#f4ece1] border border-[#8b5a2b]/40 outline-none text-[#3d2611] text-sm italic disabled:opacity-50"
              placeholder="Thông tin tóm lược về dòng họ..."
              rows="4"
              value={clanShortDesc}
              onChange={(e) => setClanShortDesc(e.target.value)}
            />
          </div>

          {/* Cụm nút bấm có trạng thái Loading */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-2 text-[#5d3a1a] hover:bg-[#8b5a2b]/10 transition-all font-bold text-sm border border-transparent disabled:opacity-50"
            >
              BÃI BỎ
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 py-3 bg-[#3d2611] text-[#f2e2ba] font-bold text-sm shadow-lg hover:bg-[#5d3a1a] active:scale-95 transition-all border border-[#3d2611] flex items-center justify-center gap-3 uppercase tracking-wider disabled:opacity-80"
            >
              {isProcessing && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#f2e2ba]"></div>
              )}
              <span>{isProcessing ? "Đang ghi sổ..." : "LƯU VÀO TỘC PHẢ"}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
