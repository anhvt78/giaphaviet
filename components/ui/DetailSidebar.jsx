import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  // useCallback,
} from "react";
import { formatDate } from "../Utils/helpers";
// import { useSelector } from "react-redux";
import { GenealogyContext } from "@/context/GenealogyContext";
import AddSpouseModal from "./AddSpouseModal";
import AddChildModal from "./AddChildModal";
import UpdateMemberModal from "./UpdateMemberModal";
import { useSelector } from "react-redux";
import sweetalert2 from "@/configs/swal";
import Swal from "sweetalert2";
import { generateMetadataLink } from "@/components/Utils/helpers";

const ANCESTOR_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000001";

export default function DetailSidebar({
  person,
  clanItem,
  onClose,
  // onAddChild,
  // onAddSpouse,
  fetchDataDialog,
}) {
  // console.log("21. person: ", person);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  //   // 1. Khởi tạo chiều rộng từ localStorage (nếu có) hoặc mặc định là 384px
  const [width, setWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const savedWidth = localStorage.getItem("sidebarWidth");
      return savedWidth ? parseInt(savedWidth, 10) : 384;
    }
    return 384;
  });

  const isResizing = useRef(false);

  // 2. Định nghĩa các hàm xử lý kéo (Dùng function để tránh lỗi thứ tự khai báo)
  function resize(e) {
    if (isResizing.current) {
      // Tính toán chiều rộng dựa trên vị trí chuột (Sidebar nằm bên phải)
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 300 && newWidth < 900) {
        setWidth(newWidth);
      }
    }
  }

  function stopResizing() {
    isResizing.current = false;
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResizing);

    // THAY ĐỔI: Sử dụng classList thay vì .style
    if (typeof document !== "undefined") {
      document.body.classList.remove("is-resizing");
    }
  }

  function startResizing(e) {
    isResizing.current = true;
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResizing);

    // THAY ĐỔI: Sử dụng classList thay vì .style
    if (typeof document !== "undefined") {
      document.body.classList.add("is-resizing");
    }
  }

  // 2. Đảm bảo dọn dẹp (Cleanup) khi Sidebar bị đóng
  useEffect(() => {
    return () => {
      // Khi component unmount, đưa mọi thứ về mặc định để tránh treo cursor
      if (typeof document !== "undefined") {
        document.body.style.cursor = "default";
        document.body.style.userSelect = "auto";
      }
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResizing);
    };
  }, []);

  // 3. Ghi nhớ chiều rộng vào localStorage
  useEffect(() => {
    localStorage.setItem("sidebarWidth", width);
  }, [width]);

  // Đảm bảo gỡ bỏ sự kiện khi Component bị hủy (unmount)
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResizing);
    };
  }, []);

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    targetId: null,
  });

  const [modalAddChildState, setModalAddChildState] = useState(false);
  const [modalUpdateState, setModalUpdateState] = useState(false);

  const userWalletAddress = useSelector(
    (state) => state.genealogyReducer.walletAddress,
  );

  // const userWalletAddress = "0x7D351Aad461ea7FE599Ba572eFEf0d8bF8c0B9cC";

  // console.log("userWalletAddress: ", userWalletAddress);

  const { getOwner, removeChild, removeSpouse, getPersonDetail } =
    useContext(GenealogyContext);

  const [owner, setOwner] = useState("0x");

  const [currentIndex, setCurrentIndex] = useState(null);
  const [isGettingMetadata, setIsGettingMetadata] = useState(true);
  const [personDetail, setPersonDetail] = useState(null);

  useEffect(() => {
    if (!userWalletAddress) return;
    getOwner(clanItem?.clanId, person.id).then((result) => {
      setIsProcessing(false);
      if (result.sts) {
        setOwner(result.data);
      }
    });
  }, [userWalletAddress, person]);

  useEffect(() => {
    getPersonDetail(clanItem?.clanId, person.id).then(
      (personMetadataResult) => {
        console.log("personMetadataResult: ", personMetadataResult);
        setIsGettingMetadata(false);
        if (personMetadataResult.sts) {
          // setPersonMetadata(personMetadataResult.data);
          // const object = JSON.parse(personMetadataResult.data);
          let allImageUrls = [];

          // console.log("object: ", object);

          try {
            const imagesData = personMetadataResult?.data?.images;
            if (Array.isArray(imagesData)) {
              allImageUrls = imagesData
                .map((subArray) => {
                  if (Array.isArray(subArray) && subArray.length > 0) {
                    // return subArray[0];
                    console.log("157: subArray[0]: ", subArray[0]?.url);

                    console.log(
                      "161: subArray[0]: ",
                      generateMetadataLink(subArray[0]?.url),
                    );
                    return generateMetadataLink(subArray[0]?.url);
                  }
                  return null;
                })
                .filter((url) => url);
            }
          } catch (error) {
            // console.error("Error extracting CIDs:", error);
          }

          const item = {
            allImageUrls: allImageUrls,
            description: personMetadataResult?.data?.description,
          };

          console.log("170: item: ", item);

          setPersonDetail(item);
        }
      },
    );
  }, [person]);

  const handleDelete = async () => {
    Swal.fire({
      title: "Xác nhận xóa?",
      text: `Bạn có chắc chắn muốn xóa ${person.name} khỏi gia phả? Hành động này không thể hoàn tác.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33", // Màu đỏ cho nút xóa
      cancelButtonColor: "#3085d6", // Màu xanh cho nút hủy
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Huỷ",
      reverseButtons: true, // Đưa nút Huỷ sang bên phải cho tự nhiên
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Đang xử lý...",
          text: "Vui lòng chờ trong giây lát",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading(); // Hiển thị biểu tượng quay (spinner)
          },
        });
        // try {
        // setIsProcessing(true); // Bật trạng thái đang xử lý

        // --- CHỖ NÀY: Gọi hàm xóa từ Context hoặc API của bạn ---
        // Ví dụ: const res = await deleteMember(clanItem.clanId, person.id);
        if (person.isSpouse) {
          removeSpouse(
            userWalletAddress,
            clanItem?.clanId,
            person.spouseId,
            person.id,
            callBack,
            handleErr,
          );
        } else {
          removeChild(
            userWalletAddress,
            clanItem?.clanId,
            person.id,
            callBack,
            handleErr,
          );
        }

        // Giả lập xử lý thành công:
        //   setTimeout(() => {
        //     Swal.fire(
        //       "Đã xóa!",
        //       "Thành viên đã được loại bỏ khỏi gia phả.",
        //       "success",
        //     );

        //     // Gọi callback để load lại dữ liệu và đóng sidebar
        //     callBack();
        //   }, 2000);
        // } catch (error) {
        //   handleErr("Lỗi khi xóa", error.message);
        // } finally {
        //   setIsProcessing(false);
        // }
      }
    });
  };

  const callBack = (newChildId) => {
    // console.log("newChildId: ", newChildId);
    onClose();
    // setIsProcessing(false);
    Swal.fire("Đã xóa!", "Thành viên đã được loại bỏ khỏi gia phả.", "success");
    fetchDataDialog();
    // router.push(`/pages/detail/${clanId}`);
  };

  const handleErr = (title, error) => {
    // setIsProcessing(false);
    onClose();
    sweetalert2.popupAlert({
      title: title,
      text: error,
    });
  };

  // Hàm chuyển ảnh tiếp theo
  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % personDetail?.allImageUrls.length);
  };

  // Hàm quay lại ảnh trước
  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentIndex(
      (prev) =>
        (prev - 1 + personDetail?.allImageUrls.length) %
        personDetail?.allImageUrls.length,
    );
  };

  return (
    <div
      style={{ width: `${width}px` }}
      className="fixed top-0 right-0 h-full bg-[#fdf8e9] border-l-4 border-[#5d3a1a] shadow-2xl z-[50] flex flex-col transition-[width] duration-68 ease-out"
    >
      {currentIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setCurrentIndex(null)}
        >
          {/* Nút Đóng */}
          <button className="absolute top-6 right-6 text-white/70 hover:text-white z-[110]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Nút Trước (<) */}
          <button
            onClick={prevImage}
            className="absolute left-4 md:left-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-[110]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Ảnh hiển thị */}
          <div className="relative max-w-5xl max-h-[85vh] flex items-center justify-center">
            <img
              src={personDetail?.allImageUrls[currentIndex]}
              className="max-w-full max-h-full object-contain shadow-2xl animate-in fade-in zoom-in duration-300"
              alt="Full view"
              onClick={(e) => e.stopPropagation()}
            />
            {/* Hiển thị số thứ tự ảnh (Ví dụ: 1/8) */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/80 font-sans text-sm tracking-widest">
              {currentIndex + 1} / {clanItem?.allImageUrls.length}
            </div>
          </div>

          {/* Nút Tiếp Theo (>) */}
          <button
            onClick={nextImage}
            className="absolute right-4 md:right-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-[110]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
      {/* THANH NẮM ĐỂ KÉO (Resizer Handle) */}
      <div
        onMouseDown={startResizing}
        className="absolute left-[-4px] top-0 w-2 h-full cursor-col-resize hover:bg-[#8b5a2b]/30 transition-colors z-[60]"
        title="Kéo để thay đổi kích thước"
      />
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {/* DROPDOWN MENU - GÓC TRÊN BÊN TRÁI */}
        {isProcessing ? (
          <>
            {userWalletAddress && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#3d2611]"></div>
            )}
          </>
        ) : (
          <>
            {owner === userWalletAddress && (
              <div className="absolute top-4 left-4 z-[70]">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 bg-[#8b5a2b] text-[#f2e2ba] px-3 py-1.5 rounded shadow-md hover:bg-[#5d3a1a] transition-all text-xs font-bold uppercase"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                  </svg>
                  Tùy chọn
                </button>

                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[-1]"
                      onClick={() => setIsMenuOpen(false)}
                    ></div>

                    <div className="absolute left-0 mt-2 w-56 bg-white border border-[#8b5a2b]/20 shadow-xl rounded-md overflow-hidden animate-in fade-in zoom-in duration-200">
                      {/* Nhóm: Thêm mới */}
                      {!person.isSpouse && (
                        <>
                          <div className="bg-[#fdf8e9]/50 px-3 py-1 text-[10px] font-bold text-[#8b5a2b] uppercase border-b border-[#8b5a2b]/10">
                            Thêm thành viên
                          </div>
                          <button
                            onClick={() => {
                              setModalAddChildState(true);
                              setIsMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-xs font-semibold text-[#3d2611] hover:bg-[#fdf8e9] transition-colors flex items-center gap-2"
                          >
                            <span className="text-lg">+</span> Thêm con cái
                          </button>

                          {person.gender === "male" ? (
                            <button
                              onClick={() => {
                                setModalState({
                                  isOpen: true,
                                  type: "spouse",
                                  targetId: person.id,
                                });
                                setIsMenuOpen(false);
                              }}
                              className="w-full text-left px-4 py-3 text-xs font-semibold text-[#3d2611] hover:bg-[#fdf8e9] transition-colors flex items-center gap-2"
                            >
                              <span className="text-lg">+</span> Thêm Phu nhân
                              (Vợ)
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setModalState({
                                  isOpen: true,
                                  type: "spouse",
                                  targetId: person.id,
                                });
                                setIsMenuOpen(false);
                              }}
                              className="w-full text-left px-4 py-3 text-xs font-semibold text-[#3d2611] hover:bg-[#fdf8e9] transition-colors flex items-center gap-2"
                            >
                              <span className="text-lg">+</span> Thêm Phu Quân
                              (Chồng)
                            </button>
                          )}
                        </>
                      )}

                      {/* Nhóm: Chỉnh sửa */}
                      <div className="bg-[#fdf8e9]/50 px-3 py-1 text-[10px] font-bold text-[#8b5a2b] uppercase border-y border-[#8b5a2b]/10">
                        Quản lý
                      </div>

                      <button
                        onClick={() => {
                          // Logic mở modal cập nhật của bạn ở đây
                          // console.log("Mở modal cập nhật cho:", person.id);
                          setIsMenuOpen(false);
                          setModalUpdateState(true);
                        }}
                        className="w-full text-left px-4 py-3 text-xs font-semibold text-[#3d2611] hover:bg-[#fdf8e9] transition-colors flex items-center gap-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Cập nhật thông tin
                      </button>
                      {!person?.hasChildren && person?.id != ANCESTOR_ID && (
                        <button
                          onClick={() => {
                            // if (
                            //   window.confirm(
                            //     `Bạn có chắc chắn muốn xóa ${person.name} khỏi gia phả? Hành động này không thể hoàn tác.`,
                            //   )
                            // ) {
                            //   // Logic xóa của bạn ở đây
                            //   console.log("Xóa thành viên:", person.id);
                            // }
                            handleDelete();
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                          Xóa khỏi gia phả
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8b5a2b] hover:text-[#3d2611] transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {person && (
          <div className="p-8 h-full flex flex-col">
            <div className="flex-grow overflow-y-auto pr-2">
              <div className="flex flex-col items-center mb-8">
                <div className="w-28 h-28 rounded-full bg-[#8b5a2b]/10 border-4 border-[#8b5a2b]/30 flex items-center justify-center mb-4 shadow-inner overflow-hidden">
                  {personDetail?.allImageUrls &&
                  personDetail.allImageUrls.length > 0 ? (
                    <img
                      src={personDetail.allImageUrls[0]}
                      alt={person.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl">
                      {person.gender === "male" ? "👴" : "👵"}
                    </span>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[#8b5a2b] uppercase tracking-[0.3em] mb-1 font-bold">
                    {person.gender === "male"
                      ? "Thành viên Nam"
                      : "Thành viên Nữ"}
                  </p>
                  <h2 className="text-2xl font-bold text-[#3d2611] uppercase tracking-tight">
                    {person.name}
                  </h2>
                </div>
              </div>

              <div className="space-y-6">
                <section>
                  <h3 className="text-xs font-bold text-[#8b5a2b] uppercase tracking-widest border-b border-[#8b5a2b]/20 pb-1 mb-3">
                    Thông tin cơ bản
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/50 p-3 rounded border border-[#8b5a2b]/10">
                      <p className="text-[10px] text-[#8b5a2b] uppercase">
                        Năm sinh
                      </p>
                      <p className="font-bold text-[#3d2611]">
                        {formatDate(person.birthDate)}
                      </p>
                    </div>
                    <div className="bg-white/50 p-3 rounded border border-[#8b5a2b]/10">
                      <p className="text-[10px] text-[#8b5a2b] uppercase">
                        Năm mất
                      </p>
                      <p className="font-bold text-[#3d2611]">
                        {formatDate(person.deathDate)}
                      </p>
                    </div>
                  </div>
                </section>

                {person.shortDesc && (
                  <section>
                    {/* Thẻ div bao ngoài để căn lề giữa text và icon */}
                    <div className="flex items-center justify-between border-b border-[#8b5a2b]/20 pb-1 mb-3">
                      <h3 className="text-xs font-bold text-[#8b5a2b] uppercase tracking-widest">
                        Thông tin sơ lược
                      </h3>
                    </div>

                    <div className="relative">
                      <span className="absolute top-0 left-0 text-4xl text-[#8b5a2b]/20 font-serif">
                        “
                      </span>
                      <p className="text-[#3d2611] italic leading-relaxed pt-4 px-4 text-sm">
                        {person.shortDesc ||
                          "Chưa có dữ liệu tiểu sử ghi chép cho thành viên này."}
                      </p>
                      <span className="absolute bottom-0 right-0 text-4xl text-[#8b5a2b]/20 font-serif">
                        ”
                      </span>
                    </div>
                  </section>
                )}

                {isGettingMetadata ? (
                  /* Hiệu ứng loading cho Avatar */
                  // <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8b5a2b]"></div>
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8b5a2b]"></div>
                  </div>
                ) : (
                  <>
                    <section>
                      {/* Thẻ div bao ngoài để căn lề giữa text và icon */}
                      <div className="flex items-center justify-between border-b border-[#8b5a2b]/20 pb-1 mb-3">
                        <h3 className="text-xs font-bold text-[#8b5a2b] uppercase tracking-widest">
                          Thông tin Tiểu sử
                        </h3>
                        {owner === userWalletAddress && (
                          <a
                            href={`https://universaleverything.io/asset/${clanItem.clanId}/tokenId/${person.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex border border-[#8b5a2b]/10 size-10 items-center justify-center rounded-full transition-all duration-300 bg-neutral-97 cursor-pointer hover:scale-105 hover:bg-neutral-95"
                            title="Cập nhật thông tin chi tiết trên Blockchain"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              style={{ width: "24px", height: "24px" }}
                            >
                              <path
                                d="M9.20522 17.4916L18.5695 8.12731C18.9601 7.73679 18.9601 7.10362 18.5695 6.7131L16.5635 4.70704C16.173 4.31652 15.5398 4.31652 15.1493 4.70704L5.78495 14.0714C5.64561 14.2107 5.55055 14.3881 5.51169 14.5813L5.00661 17.0924C4.86572 17.7929 5.48368 18.4109 6.18417 18.27L8.6953 17.7649C8.88848 17.726 9.06588 17.631 9.20522 17.4916Z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                stroke="currentColor"
                                strokeWidth="2"
                              ></path>
                              <path
                                d="M13.2913 6.28015L16.7115 9.70042"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                stroke="currentColor"
                                strokeWidth="2"
                              ></path>
                            </svg>
                          </a>
                        )}
                      </div>

                      <div className="relative">
                        <span className="absolute top-0 left-0 text-4xl text-[#8b5a2b]/20 font-serif">
                          “
                        </span>
                        <p className="text-[#3d2611] italic leading-relaxed pt-4 px-4 text-sm">
                          {personDetail?.description ||
                            "Chưa có dữ liệu tiểu sử ghi chép cho thành viên này."}
                        </p>
                        <span className="absolute bottom-0 right-0 text-4xl text-[#8b5a2b]/20 font-serif">
                          ”
                        </span>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xs font-bold text-[#8b5a2b] uppercase tracking-widest border-b border-[#8b5a2b]/20 pb-1 mb-3">
                        Bộ sưu tập hình ảnh
                      </h3>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {personDetail?.allImageUrls.map((img, index) => (
                          <div
                            key={index}
                            className="h-40 overflow-hidden border-2 border-[#5d3a1a] shadow-md group"
                            onClick={() => setCurrentIndex(index)} // Truyền index vào state
                          >
                            <img
                              src={img}
                              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 cursor-pointer"
                              alt={`gallery-${index}`}
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}
              </div>
            </div>

            {/* Cụm nút thao tác ở dưới cùng */}
            {/* {owner == userWalletAddress && (
              <div className="mt-6 pt-6 border-t-2 border-[#8b5a2b]/20 flex flex-col gap-3">
                <button
                  onClick={() => setModalAddChildState(true)}
                  className="w-full bg-[#5d3a1a] text-[#f2e2ba] py-3 rounded font-bold text-xs hover:bg-black transition-all shadow-md uppercase tracking-wider"
                >
                  + Thêm con trực hệ
                </button>

                {person.gender === "male" && (
                  <button
                    onClick={() =>
                      setModalState({
                        isOpen: true,
                        type: "child",
                        targetId: person.id,
                      })
                    }
                    className="w-full bg-[#8b5a2b] text-[#f2e2ba] py-3 rounded font-bold text-xs hover:bg-[#3d2611] transition-all shadow-md uppercase tracking-wider"
                  >
                    + Thêm{" "}
                    {person.gender === "male"
                      ? "Phu nhân (Vợ)"
                      : "Phu quân (Chồng)"}
                  </button>
                )}
              </div>
            )} */}
          </div>
        )}

        {modalState.isOpen && (
          <AddSpouseModal
            // isOpen={modalState.isOpen}
            onClose={() =>
              setModalState({ isOpen: false, type: null, targetId: null })
            }
            // onAdd={(newData) => {
            //   setFamilyData([
            //     ...familyData,
            //     { ...newData, id: Date.now().toString() },
            //   ]);
            //   setModalState({ isOpen: false, type: null, targetId: null });
            // }}
            person={person}
            clanItem={clanItem}
            type={modalState.type}
            fetchDataDialog={fetchDataDialog}
            // targetId={modalState.targetId}
          />
        )}

        {modalAddChildState && (
          <AddChildModal
            // isOpen={modalState.isOpen}
            onClose={() => setModalAddChildState(false)}
            // onAdd={(newData) => {
            //   setFamilyData([
            //     ...familyData,
            //     { ...newData, id: Date.now().toString() },
            //   ]);
            //   setModalState({ isOpen: false, type: null, targetId: null });
            // }}
            person={person}
            clanItem={clanItem}
            type={modalState.type}
            fetchDataDialog={fetchDataDialog}
            // targetId={modalState.targetId}
          />
        )}
        {modalUpdateState && (
          <UpdateMemberModal
            onClose={() => setModalUpdateState(false)}
            person={person}
            clanItem={clanItem}
            fetchDataDialog={fetchDataDialog}
          />
        )}
      </div>
    </div>
  );
}
