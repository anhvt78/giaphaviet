import React, { useContext, useState } from "react";
import { motion } from "framer-motion";
import sweetalert2 from "@/configs/swal";
import { GenealogyContext } from "@/context/GenealogyContext";
import { useSelector } from "react-redux";

export default function TransferOwnershipModal({
  clanItem,
  onClose,
  fetchDataDetail,
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [newOwnerAddress, setNewOwnerAddress] = useState("");

  // Giả định bạn có hàm transferOwnership trong GenealogyContext
  const { transferOwnership } = useContext(GenealogyContext);

  const userWalletAddress = useSelector(
    (state) => state.genealogyReducer.walletAddress,
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra định dạng địa chỉ ví cơ bản
    if (!newOwnerAddress.startsWith("0x") || newOwnerAddress.length !== 42) {
      sweetalert2.popupAlert({
        title: "Địa chỉ không lệ",
        text: "Vui lòng nhập đúng địa chỉ ví Blockchain (0x...)",
      });
      return;
    }

    setIsProcessing(true);

    // Gọi hàm chuyển quyền từ Context
    transferOwnership(
      userWalletAddress,
      clanItem.clanId,
      newOwnerAddress,
      callBack,
      handleErr,
    );
  };

  const callBack = () => {
    onClose();
    setIsProcessing(false);
    sweetalert2.popupAlert({
      title: "Thành công",
      text: "Quyền quản lý đã được chuyển giao.",
    });
    if (fetchDataDetail) fetchDataDetail();
  };

  const handleErr = (title, error) => {
    setIsProcessing(false);
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
          Chuyển Quyền Cập Nhật
        </h2>
        
        {/* Dòng lưu ý quan trọng */}
        <div className="bg-[#f4ece1] border-l-4 border-orange-600 p-3 mb-6">
          <p className="text-[#8b5a2b] text-xs font-serif italic leading-relaxed">
            <span className="font-bold text-orange-800">Lưu ý:</span> Cần phải chuyển Token đại diện cho thuỷ tổ sang địa chỉ mới để có thể cập nhật đầy đủ thông tin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 font-serif">
          {/* Nhập địa chỉ ví */}
          <div>
            <label className="block text-xs font-bold text-[#5d3a1a] uppercase tracking-widest mb-1">
              Địa chỉ ví người nhận (Wallet Address)
            </label>
            <input
              type="text"
              required
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-[#f4ece1] border border-[#8b5a2b]/40 outline-none text-[#3d2611] text-sm font-mono disabled:opacity-50"
              placeholder="0x..."
              value={newOwnerAddress}
              onChange={(e) => setNewOwnerAddress(e.target.value)}
            />
          </div>

          {/* Cụm nút bấm */}
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
              <span>{isProcessing ? "Đang thực thi..." : "XÁC NHẬN CHUYỂN"}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}