"use client";
import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GenealogyContext } from "@/context/GenealogyContext";
import ClanListItem from "./Items/ClanListItem";
import sweetalert2 from "@/configs/swal";
import Lottie from "lottie-react";
import loaderAnimation from "../assets/animations/loader.json"; // Thay đổi đường dẫn cho đúng file của bạn

export default function ClanListForm({ userWalletAddress }) {
  const router = useRouter();
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
    description: "", // Đây là mô tả chung của dòng tộc
    ancestorDesc: "", // THÊM MỚI: Tiểu sử tóm tắt của thủy tổ
    birthDate: "",
    deathDate: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const parseDateInput = (dateStr) => {
    // Nếu trống hoặc "CÒN SỐNG", trả về giá trị 0 mặc định
    if (!dateStr || dateStr.trim() === "") {
      return { year: 0, month: 0, day: 0 };
    }

    // Thử tách chuỗi theo định dạng ngày/tháng/năm
    const parts = dateStr.split(/[\/\-.]/);

    if (parts.length === 3) {
      // Trường hợp: DD/MM/YYYY
      return {
        day: parseInt(parts[0]) || 0,
        month: parseInt(parts[1]) || 0,
        year: parseInt(parts[2]) || 0,
      };
    } else if (parts.length === 1) {
      // Trường hợp: Chỉ nhập YYYY
      return {
        day: 0,
        month: 0,
        year: parseInt(parts[0]) || 0,
      };
    }

    // Mặc định nếu không đúng định dạng
    return { year: parseInt(dateStr) || 0, month: 0, day: 0 };
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
    };

    // console.log("Dữ liệu gửi lên Blockchain:", formattedData);

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

  return (
    // <div className="min-h-screen bg-[#e8d5b5] p-8 md:p-16 font-serif flex flex-col items-center">
    <div className="min-h-screen w-full bg-[#e8d5b5] font-serif overflow-y-auto py-12 md:py-20">
      {isLoading ? (
        <div className="fixed inset-0 flex flex-col justify-center items-center bg-[#f2e2ba]/50 backdrop-blur-sm z-50">
          <div className="w-48 h-48">
            <Lottie animationData={loaderAnimation} loop={true} />
          </div>
          <p className="text-[#000000] animate-pulse text-xl">
            Đang kết nối tới blockchain...
          </p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          {/* Tiêu đề trang phong cách cổ điển */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-black text-[#3d2611] tracking-[0.2em] uppercase mb-4">
              Hệ Thống Gia Phả Trực Tuyến
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="h-[2px] w-20 bg-[#5d3a1a]"></div>
              <p className="text-[#5d3a1a] italic text-lg italic">
                Cây có cội, nước có nguồn
              </p>
              <div className="h-[2px] w-20 bg-[#5d3a1a]"></div>
            </div>
          </div>

          {/* Danh sách các mục chọn */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl w-full">
            {allClanId.map((clanId, index) => (
              <ClanListItem clanId={clanId} key={index} />
            ))}

            {/* Nút Thêm Gia Phả Mới (Dạng Placeholder) */}

            <div
              onClick={() => setIsModalOpen(true)}
              className="border-4 border-dashed border-[#5d3a1a]/30 flex flex-col items-center justify-center p-8 opacity-60 hover:opacity-100 transition-opacity cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full bg-[#5d3a1a]/10 flex items-center justify-center mb-4 group-hover:bg-[#5d3a1a] group-hover:text-[#f2e2ba] transition-all">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <span className="font-bold text-[#5d3a1a] uppercase tracking-tighter">
                Thêm gia tộc mới
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hộp Thoại - Đã sửa lỗi Scroll và Lệch hàng */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          {/* Thêm max-h-[90vh] và overflow-y-auto để cho phép cuộn trên mobile */}
          <div className="bg-[#f2e2ba] border-4 border-[#5d3a1a] w-full max-w-lg p-6 md:p-8 shadow-[20px_20px_0px_0px_rgba(93,58,26,0.3)] relative animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-2xl text-[#5d3a1a] hover:rotate-90 transition-transform z-10"
            >
              ✕
            </button>

            <h2 className="text-2xl font-black text-[#3d2611] uppercase tracking-widest mb-6 text-center border-b-2 border-[#5d3a1a] pb-2">
              Khai báo gia tộc
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[#5d3a1a] font-bold text-xs uppercase mb-1">
                  Tên dòng tộc
                </label>
                <input
                  type="text"
                  name="clanName"
                  required
                  onChange={handleInputChange}
                  className="w-full bg-white/50 border-2 border-[#5d3a1a] p-2 outline-none focus:bg-white text-sm"
                  placeholder="VD: Nguyễn Tộc"
                />
              </div>

              <div>
                <label className="block text-[#5d3a1a] font-bold text-xs uppercase mb-1">
                  Thông tin sơ lược
                </label>
                <textarea
                  name="description"
                  rows="2"
                  onChange={handleInputChange}
                  placeholder="Thông tin sơ lược về dòng tộc."
                  className="w-full bg-white/50 border-2 border-[#5d3a1a] p-2 outline-none focus:bg-white text-sm resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-[#5d3a1a] font-bold text-xs uppercase mb-1">
                  Tên Thuỷ tổ
                </label>
                <input
                  type="text"
                  name="ancestorName"
                  required
                  onChange={handleInputChange}
                  className="w-full bg-white/50 border-2 border-[#5d3a1a] p-2 outline-none focus:bg-white text-sm"
                  placeholder="Tên vị tổ tiên đời thứ nhất"
                />
              </div>

              <div>
                <label className="block text-[#3d2611] font-bold mb-1 text-xs uppercase">
                  Tiểu sử tóm tắt của Thủy tổ
                </label>
                <textarea
                  name="ancestorDesc"
                  onChange={handleInputChange}
                  placeholder="Nhập tiểu sử ngắn gọn của vị thủy tổ..."
                  rows="3"
                  className="w-full bg-white/50 border-2 border-[#5d3a1a] p-2 outline-none focus:bg-white text-sm transition-all resize-none"
                />
              </div>

              {/* PHẦN QUAN TRỌNG: Tách thành 2 hàng trên mobile, 2 cột trên PC */}
              <div className="flex flex-col md:grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[#5d3a1a] font-bold text-xs uppercase mb-1">
                    Năm/Ngày sinh
                  </label>
                  <input
                    type="text"
                    name="birthDate"
                    onChange={handleInputChange}
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
                    disabled={isStillAlive}
                    onChange={handleInputChange}
                    placeholder={
                      isStillAlive
                        ? "Đang trống..."
                        : "VD: 01/01/1980 hoặc 1980"
                    }
                    className={`w-full border-2 border-[#5d3a1a] p-2 outline-none text-sm h-[42px] transition-all ${
                      isStillAlive
                        ? "bg-gray-300/50 opacity-50 cursor-not-allowed"
                        : "bg-white/50 focus:bg-white"
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-[#5d3a1a] text-[#f2e2ba] font-bold py-4 mt-4 hover:bg-[#3d2611] transition-all uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-3 active:scale-95"
              >
                {isProcessing && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#eeeae6]"></div>
                )}
                <span>Xác nhận khởi tạo</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
