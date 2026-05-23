import React, { useContext, useState } from "react";
import { motion } from "framer-motion";
import { formatDisplayDate } from "../Utils/helpers";
import sweetalert2 from "@/configs/swal";
import { GenealogyContext } from "@/context/GenealogyContext";
import { useSelector } from "react-redux";
import { formatDate } from "../Utils/helpers";

export default function UpdateMemberModal({
  person,
  clanItem,
  onClose,
  fetchDataDialog,
}) {
  const [isStillAlive, setIsStillAlive] = useState(
    person?.deathDate?.year === 0,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    personId: person.id,
    name: person?.name || "",
    // Chuyển object ngày tháng thành chuỗi DD/MM/YYYY ngay khi khởi tạo
    birthDate: formatDisplayDate(person?.birthDate),
    deathDate: formatDisplayDate(person?.deathDate),
    shortDesc: person?.shortDesc,
  });

  const { updatePersonData } = useContext(GenealogyContext);

  const userWalletAddress = useSelector(
    (state) => state.genealogyReducer.walletAddress,
  );

  const parseDateInput = (dateStr) => {
    console.log("dateStr: ", dateStr);

    // Ép kiểu về string và kiểm tra nếu không phải chuỗi hợp lệ
    const str = String(dateStr || "").trim();
    if (!str || str === "0/0/0") return { day: 0, month: 0, year: 0 };

    const parts = str.split(/[\/\-.]/);
    if (parts.length === 3) {
      return {
        day: parseInt(parts[0]) || 0,
        month: parseInt(parts[1]) || 0,
        year: parseInt(parts[2]) || 0,
      };
    }
    // Nếu chỉ nhập năm hoặc dữ liệu không đủ 3 phần
    const yearOnly = parseInt(str.split(/[\/\-.]/).pop());
    return { day: 0, month: 0, year: yearOnly || 0 };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    // Kiểm tra các trường bắt buộc
    if (!formData.name.trim()) newErrors.name = "Danh tánh không được để trống";

    // Nếu có lỗi, cập nhật state và dừng xử lý
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({}); // Xóa sạch lỗi cũ nếu mọi thứ ổn

    setIsProcessing(true); // Bắt đầu trạng thái chờ giống ClanListForm

    const formattedData = {
      ...formData,
      birthDate: parseDateInput(formData.birthDate),
      deathDate: isStillAlive
        ? { day: 0, month: 0, year: 0 }
        : parseDateInput(formData.deathDate),
    };

    updatePersonData(
      userWalletAddress,
      clanItem.clanId,
      formattedData,
      callBack,
      handleErr,
    );
  };

  const callBack = (newChildId) => {
    // console.log("newChildId: ", newChildId);
    onClose();
    setIsProcessing(false);
    fetchDataDialog();
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

  // Hàm hiển thị dòng lỗi nhỏ dưới mỗi ô
  const renderError = (fieldName) =>
    errors[fieldName] ? (
      <p className="text-red-600 text-[10px] font-bold mt-1 uppercase italic tracking-tighter">
        * {errors[fieldName]}
      </p>
    ) : null;

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
          Chỉnh sửa thông tin thành viên trong dòng tộc
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 font-serif">
          {/* Họ và tên */}
          <div>
            <label className="block text-xs font-bold text-[#5d3a1a] uppercase tracking-widest mb-1">
              Họ và Tên
            </label>
            <input
              autoFocus
              disabled={isProcessing}
              className="w-full px-4 py-2 bg-[#f4ece1] border border-[#8b5a2b]/40 focus:border-[#3d2611] outline-none text-[#3d2611] transition-all disabled:opacity-50"
              placeholder="Ví dụ: Nguyễn Văn A"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: null });
              }}
            />
            {renderError("name")}
          </div>

          <div className="flex flex-col md:grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[#5d3a1a] font-bold text-xs uppercase mb-1">
                Năm/Ngày sinh
              </label>
              <input
                type="text"
                name="birthDate"
                disabled={isProcessing}
                value={formData.birthDate}
                onChange={(e) => {
                  setFormData({ ...formData, birthDate: e.target.value });
                  if (errors.birthDate)
                    setErrors({ ...errors, birthDate: null });
                }}
                placeholder="VD: 01/01/1980 hoặc 1980"
                className="w-full bg-white/50 border-2 border-[#5d3a1a] p-2 outline-none focus:bg-white text-sm h-[42px]"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[#5d3a1a] font-bold text-xs uppercase">
                  Năm/Ngày mất
                </label>
                <label className="flex items-center gap-1 text-[10px] font-bold text-[#5d3a1a] cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isProcessing}
                    checked={isStillAlive}
                    onChange={(e) => setIsStillAlive(e.target.checked)}
                    className="accent-[#5d3a1a]"
                  />
                  CÒN SỐNG
                </label>
              </div>
              <input
                type="text"
                name="deathDate"
                disabled={isStillAlive || isProcessing}
                value={isStillAlive ? "" : formData.deathDate}
                onChange={(e) =>
                  setFormData({ ...formData, deathDate: e.target.value })
                }
                placeholder={
                  isStillAlive ? "Đang trống..." : "VD: 01/01/1980 hoặc 1980"
                }
                className={`w-full border-2 border-[#5d3a1a] p-2 outline-none text-sm h-[42px] transition-all ${
                  isStillAlive
                    ? "bg-gray-300/50 opacity-50 cursor-not-allowed"
                    : "bg-white/50 focus:bg-white"
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5d3a1a] uppercase tracking-widest mb-1">
              Tiểu sử sơ lược
            </label>
            <textarea
              disabled={isProcessing}
              className="w-full px-4 py-2 bg-[#f4ece1] border border-[#8b5a2b]/40 outline-none text-[#3d2611] text-sm italic disabled:opacity-50"
              placeholder="Ghi chú về học vấn, sự nghiệp..."
              rows="2"
              value={formData.shortDesc}
              onChange={(e) =>
                setFormData({ ...formData, shortDesc: e.target.value })
              }
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
              <span>{isProcessing ? "Đang ghi sổ..." : "LƯU TỘC PHẢ"}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
