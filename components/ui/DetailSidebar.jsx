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
import CrossClanLinkModal from "./CrossClanLinkModal";
import { useSelector } from "react-redux";
import sweetalert2 from "@/configs/swal";
import Swal from "sweetalert2";
import { generateMetadataLink } from "@/components/Utils/helpers";

const GENERATION_LABELS = {
  1: "Tiên tổ", 2: "Nhị đại tôn", 3: "Tam đại tôn", 4: "Tứ đại tôn",
  5: "Ngũ đại tôn", 6: "Lục đại tôn", 7: "Thất đại tôn",
  8: "Bát đại tôn", 9: "Cửu đại tôn", 10: "Thập đại tôn",
};

function getSubTitle(person) {
  if (person.isSpouse) return person.gender === "male" ? "Phu quân" : "Phu nhân";
  const gen = person.generation ?? 1;
  if (gen === 1) return person.gender === "female" ? "Thái Tiên tổ" : "Tiên tổ";
  if (gen === 2) return person.gender === "female" ? "Nhị đại tôn nữ" : "Nhị đại tôn";
  const baseLabel = GENERATION_LABELS[gen] ?? `Đời thứ ${gen}`;
  return person.gender === "female" ? `${baseLabel} nữ` : baseLabel;
}

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

  const [activeTab, setActiveTab] = useState("info");
  const [modalAddChildState, setModalAddChildState] = useState(false);
  const [modalUpdateState, setModalUpdateState] = useState(false);
  const [modalCrossLinkOpen, setModalCrossLinkOpen] = useState(false);

  const [personOrigin, setPersonOrigin] = useState(null);
  const [equivalents, setEquivalents] = useState([]);
  const [removingExternalSpouseId, setRemovingExternalSpouseId] = useState(null);
  const [removingEquivalentId, setRemovingEquivalentId] = useState(null);

  const userWalletAddress = useSelector(
    (state) => state.genealogyReducer.walletAddress,
  );

  // const userWalletAddress = "0x7D351Aad461ea7FE599Ba572eFEf0d8bF8c0B9cC";

  // console.log("userWalletAddress: ", userWalletAddress);

  const { getOwner, removeChild, removeSpouse, getPersonDetail, removeExternalSpouse, getPersonOrigin, getEquivalents, unlinkSamePerson } =
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

  const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

  useEffect(() => {
    if (!clanItem?.clanId || !person?.id) return;
    setPersonOrigin(null);
    setEquivalents([]);
    getPersonOrigin(clanItem.clanId, person.id).then((res) => {
      if (res.sts && res.data?.clanAddress && res.data.clanAddress !== ZERO_ADDR) {
        setPersonOrigin(res.data);
      }
    });
    getEquivalents(clanItem.clanId, person.id).then((res) => {
      if (res.sts && Array.isArray(res.data)) setEquivalents(res.data);
    });
  }, [person?.id, clanItem?.clanId]);

  const handleRemoveExternalSpouse = (extSpouse) => {
    setRemovingExternalSpouseId(extSpouse.personId);
    removeExternalSpouse(
      userWalletAddress, clanItem?.clanId, person.id,
      extSpouse.clanAddress, extSpouse.personId,
      () => { setRemovingExternalSpouseId(null); fetchDataDialog(); },
      (title, err) => { setRemovingExternalSpouseId(null); sweetalert2.popupAlert({ title, text: String(err) }); },
    );
  };

  const handleUnlinkSamePerson = (eq) => {
    setRemovingEquivalentId(eq.personId);
    unlinkSamePerson(
      userWalletAddress, clanItem?.clanId, person.id,
      eq.clanAddress, eq.personId,
      () => { setRemovingEquivalentId(null); fetchDataDialog(); },
      (title, err) => { setRemovingEquivalentId(null); sweetalert2.popupAlert({ title, text: String(err) }); },
    );
  };

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
      className="fixed top-0 right-0 h-full bg-[#fdf8e9] border-l-4 border-[#5d3a1a] shadow-2xl z-[50] flex flex-col transition-[width] duration-68 ease-out overflow-hidden"
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
      {/* Dropdown quản lý - góc trên trái */}
      {isProcessing && userWalletAddress && (
        <div className="absolute top-4 left-4 z-[70]">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#3d2611]"></div>
        </div>
      )}
      {!isProcessing && owner === userWalletAddress && (
          <div className="absolute top-4 left-4 z-[70]">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 bg-[#8b5a2b] text-[#f2e2ba] px-3 py-1.5 rounded shadow-md hover:bg-[#5d3a1a] transition-all text-xs font-bold uppercase"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="12" cy="5" r="1"></circle>
                <circle cx="12" cy="19" r="1"></circle>
              </svg>
              Tùy chọn
            </button>
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-[-1]" onClick={() => setIsMenuOpen(false)}></div>
                <div className="absolute left-0 mt-2 w-56 bg-white border border-[#8b5a2b]/20 shadow-xl rounded-md overflow-hidden animate-in fade-in zoom-in duration-200">
                  {!person.isSpouse && (
                    <>
                      <div className="bg-[#fdf8e9]/50 px-3 py-1 text-[10px] font-bold text-[#8b5a2b] uppercase border-b border-[#8b5a2b]/10">
                        Thêm thành viên
                      </div>
                      <button onClick={() => { setModalAddChildState(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-xs font-semibold text-[#3d2611] hover:bg-[#fdf8e9] transition-colors flex items-center gap-2">
                        <span className="text-lg">+</span> Thêm con cái
                      </button>
                      {person.gender === "male" ? (
                        <button onClick={() => { setModalState({ isOpen: true, type: "spouse", targetId: person.id }); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-xs font-semibold text-[#3d2611] hover:bg-[#fdf8e9] transition-colors flex items-center gap-2">
                          <span className="text-lg">+</span> Thêm Phu nhân (Vợ)
                        </button>
                      ) : (
                        <button onClick={() => { setModalState({ isOpen: true, type: "spouse", targetId: person.id }); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-xs font-semibold text-[#3d2611] hover:bg-[#fdf8e9] transition-colors flex items-center gap-2">
                          <span className="text-lg">+</span> Thêm Phu Quân (Chồng)
                        </button>
                      )}
                    </>
                  )}
                  {!person.isSpouse && (
                    <button onClick={() => { setModalCrossLinkOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-xs font-semibold text-[#3d2611] hover:bg-[#fdf8e9] transition-colors flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      Liên kết xuyên gia phả
                    </button>
                  )}
                  <div className="bg-[#fdf8e9]/50 px-3 py-1 text-[10px] font-bold text-[#8b5a2b] uppercase border-y border-[#8b5a2b]/10">
                    Quản lý
                  </div>
                  <button onClick={() => { setIsMenuOpen(false); setModalUpdateState(true); }} className="w-full text-left px-4 py-3 text-xs font-semibold text-[#3d2611] hover:bg-[#fdf8e9] transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Cập nhật thông tin
                  </button>
                  {!person?.hasChildren && person?.id != ANCESTOR_ID && (
                    <button onClick={() => { handleDelete(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Nút đóng - góc trên phải */}
      <button onClick={onClose} className="absolute top-4 right-4 z-[70] text-[#8b5a2b] hover:text-[#3d2611] transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {/* Modals */}
      {modalState.isOpen && (
        <AddSpouseModal
          onClose={() => setModalState({ isOpen: false, type: null, targetId: null })}
          person={person}
          clanItem={clanItem}
          type={modalState.type}
          fetchDataDialog={fetchDataDialog}
        />
      )}
      {modalAddChildState && (
        <AddChildModal
          onClose={() => setModalAddChildState(false)}
          person={person}
          clanItem={clanItem}
          type={modalState.type}
          fetchDataDialog={fetchDataDialog}
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
      {modalCrossLinkOpen && (
        <CrossClanLinkModal
          onClose={() => setModalCrossLinkOpen(false)}
          person={person}
          clanItem={clanItem}
          fetchDataDialog={fetchDataDialog}
        />
      )}

      {/* Nội dung chính */}
      {person && (
        <>
          {/* Header: Avatar + Tên + Vai trò */}
          <div className="flex-shrink-0 flex flex-col items-center pt-12 pb-5 px-6 border-b border-[#8b5a2b]/20">
            <div className="w-24 h-24 rounded-full bg-[#8b5a2b]/10 border-4 border-[#8b5a2b]/30 flex items-center justify-center mb-3 shadow-inner overflow-hidden">
              {personDetail?.allImageUrls && personDetail.allImageUrls.length > 0 ? (
                <img src={personDetail.allImageUrls[0]} alt={person.name} className="w-full h-full object-cover" />
              ) : person.gender === "male" ? (
                <svg viewBox="0 0 80 80" className="w-14 h-14" fill="#8b5a2b" opacity="0.45">
                  <circle cx="40" cy="26" r="16"/>
                  <path d="M8 76 Q8 52 40 52 Q72 52 72 76Z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 80 80" className="w-14 h-14" fill="#8b5a2b" opacity="0.45">
                  <circle cx="40" cy="26" r="16"/>
                  <path d="M12 76 Q12 50 40 50 Q68 50 68 76Z"/>
                  <path d="M18 63 Q40 71 62 63" stroke="#8b5a2b" fill="none" strokeWidth="3" opacity="0.6"/>
                </svg>
              )}
            </div>
            <p className="text-[9px] text-[#8b5a2b] uppercase tracking-[0.3em] font-bold mb-1">
              {getSubTitle(person)}
            </p>
            <h2 className="text-xl font-bold text-[#3d2611] uppercase tracking-tight text-center leading-tight">
              {person.name}
            </h2>
            <span className={`mt-2 inline-block px-3 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-full border ${
              person.isDeceased
                ? "bg-stone-200 text-stone-600 border-stone-400"
                : "bg-green-50 text-green-700 border-green-300"
            }`}>
              {person.isDeceased ? "Đã qua đời" : "Còn sống"}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex-shrink-0 flex border-b border-[#8b5a2b]/20">
            <button
              onClick={() => setActiveTab("info")}
              className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                activeTab === "info"
                  ? "text-[#5d3a1a] border-b-2 border-[#5d3a1a]"
                  : "text-[#8b5a2b]/50 hover:text-[#8b5a2b]"
              }`}
            >
              Thông tin
            </button>
            <button
              onClick={() => setActiveTab("images")}
              className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                activeTab === "images"
                  ? "text-[#5d3a1a] border-b-2 border-[#5d3a1a]"
                  : "text-[#8b5a2b]/50 hover:text-[#8b5a2b]"
              }`}
            >
              Hình ảnh{personDetail?.allImageUrls?.length > 0 ? ` (${personDetail.allImageUrls.length})` : ""}
            </button>
          </div>

          {/* Nội dung tab */}
          <div className="flex-grow overflow-y-auto custom-scrollbar p-5">
            {activeTab === "info" && (
              <div className="space-y-5">
                {/* Thông tin cơ bản */}
                <section>
                  <h3 className="text-[10px] font-bold text-[#8b5a2b] uppercase tracking-widest border-b border-[#8b5a2b]/20 pb-1 mb-3">
                    Thông tin cơ bản
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/50 p-3 rounded border border-[#8b5a2b]/10">
                      <p className="text-[9px] text-[#8b5a2b] uppercase mb-0.5">Năm sinh</p>
                      <p className="font-bold text-[#3d2611] text-sm">{formatDate(person.birthDate)}</p>
                    </div>
                    <div className="bg-white/50 p-3 rounded border border-[#8b5a2b]/10">
                      <p className="text-[9px] text-[#8b5a2b] uppercase mb-0.5">Năm mất</p>
                      <p className="font-bold text-[#3d2611] text-sm">{formatDate(person.deathDate)}</p>
                    </div>
                  </div>
                </section>

                {/* Phối ngẫu ngoài gia phả */}
                {(person.externalSpouses?.length > 0 || (owner === userWalletAddress && !person.isSpouse)) && (
                  <section>
                    <h3 className="text-[10px] font-bold text-[#8b5a2b] uppercase tracking-widest border-b border-[#8b5a2b]/20 pb-1 mb-3">
                      Phối ngẫu ngoài gia phả
                    </h3>
                    {person.externalSpouses?.length > 0 ? (
                      <div className="space-y-2">
                        {person.externalSpouses.map((ext) => (
                          <div key={ext.personId} className="flex items-center gap-2 bg-white/60 border border-[#8b5a2b]/15 px-3 py-2 rounded">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8b5a2b" strokeWidth="2" className="flex-shrink-0 opacity-60">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-mono text-[#3d2611] truncate">
                                {ext.clanAddress?.slice(0, 8)}...{ext.clanAddress?.slice(-4)}
                              </p>
                              <p className="text-[9px] font-mono text-[#8b5a2b]/60 truncate">
                                ID: {ext.personId?.slice(0, 8)}...{ext.personId?.slice(-4)}
                              </p>
                            </div>
                            {owner === userWalletAddress && (
                              <button
                                onClick={() => handleRemoveExternalSpouse(ext)}
                                disabled={removingExternalSpouseId === ext.personId}
                                className="text-[#8b5a2b]/40 hover:text-red-600 transition-colors flex-shrink-0 disabled:opacity-40"
                                title="Xóa phối ngẫu ngoài"
                              >
                                {removingExternalSpouseId === ext.personId ? (
                                  <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
                                ) : (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                  </svg>
                                )}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#8b5a2b]/40 italic">Chưa có phối ngẫu ngoài gia phả.</p>
                    )}
                  </section>
                )}

                {/* Nguồn gốc xuyên gia phả */}
                {personOrigin && (
                  <section>
                    <h3 className="text-[10px] font-bold text-[#8b5a2b] uppercase tracking-widest border-b border-[#8b5a2b]/20 pb-1 mb-3">
                      Nguồn gốc xuyên gia phả
                    </h3>
                    <div className="bg-white/60 border border-[#8b5a2b]/15 px-3 py-2.5 rounded space-y-1.5">
                      <div className="flex items-center gap-2">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C8960C" strokeWidth="2" className="flex-shrink-0">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                          <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                        <span className="text-[10px] text-[#8b5a2b]/60 uppercase font-bold">Gia phả gốc</span>
                      </div>
                      <p className="text-[11px] font-mono text-[#3d2611]">
                        {personOrigin.clanAddress?.slice(0, 10)}...{personOrigin.clanAddress?.slice(-6)}
                      </p>
                      <p className="text-[9px] font-mono text-[#8b5a2b]/50">
                        Token: {personOrigin.personId?.slice(0, 10)}...{personOrigin.personId?.slice(-6)}
                      </p>
                    </div>
                  </section>
                )}

                {/* Thành viên tương đương */}
                {equivalents.length > 0 && (
                  <section>
                    <h3 className="text-[10px] font-bold text-[#8b5a2b] uppercase tracking-widest border-b border-[#8b5a2b]/20 pb-1 mb-3">
                      Thành viên tương đương
                    </h3>
                    <div className="space-y-2">
                      {equivalents.map((eq, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white/60 border border-[#8b5a2b]/15 px-3 py-2 rounded">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8b5a2b" strokeWidth="2" className="flex-shrink-0 opacity-60">
                            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-mono text-[#3d2611] truncate">
                              {eq.clanAddress?.slice(0, 8)}...{eq.clanAddress?.slice(-4)}
                            </p>
                            <p className="text-[9px] font-mono text-[#8b5a2b]/60 truncate">
                              {eq.personId?.slice(0, 8)}...{eq.personId?.slice(-4)}
                            </p>
                          </div>
                          {owner === userWalletAddress && (
                            <button
                              onClick={() => handleUnlinkSamePerson(eq)}
                              disabled={removingEquivalentId === eq.personId}
                              className="text-[#8b5a2b]/40 hover:text-red-600 transition-colors flex-shrink-0 disabled:opacity-40"
                              title="Hủy liên kết tương đương"
                            >
                              {removingEquivalentId === eq.personId ? (
                                <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
                              ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M18 6L6 18M6 6l12 12"/>
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Tiểu sử & Ghi chép - gộp shortDesc + description */}
                <section>
                  <div className="flex items-center justify-between border-b border-[#8b5a2b]/20 pb-1 mb-3">
                    <h3 className="text-[10px] font-bold text-[#8b5a2b] uppercase tracking-widest">
                      Tiểu sử & Ghi chép
                    </h3>
                    {owner === userWalletAddress && (
                      <a
                        href={`https://universaleverything.io/asset/${clanItem.clanId}/tokenId/${person.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex border border-[#8b5a2b]/10 size-8 items-center justify-center rounded-full transition-all duration-300 cursor-pointer hover:scale-105 hover:bg-[#8b5a2b]/10"
                        title="Cập nhật thông tin chi tiết trên Blockchain"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.20522 17.4916L18.5695 8.12731C18.9601 7.73679 18.9601 7.10362 18.5695 6.7131L16.5635 4.70704C16.173 4.31652 15.5398 4.31652 15.1493 4.70704L5.78495 14.0714C5.64561 14.2107 5.55055 14.3881 5.51169 14.5813L5.00661 17.0924C4.86572 17.7929 5.48368 18.4109 6.18417 18.27L8.6953 17.7649C8.88848 17.726 9.06588 17.631 9.20522 17.4916Z"></path>
                          <path d="M13.2913 6.28015L16.7115 9.70042"></path>
                        </svg>
                      </a>
                    )}
                  </div>
                  {isGettingMetadata ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8b5a2b]"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {person.shortDesc && (
                        <div className="bg-white/40 rounded p-3 border border-[#8b5a2b]/10">
                          <p className="text-[9px] text-[#8b5a2b] uppercase font-bold mb-1.5 tracking-wider">Sơ lược</p>
                          <p className="text-[#3d2611] italic leading-relaxed text-sm">{person.shortDesc}</p>
                        </div>
                      )}
                      <div className="bg-white/40 rounded p-3 border border-[#8b5a2b]/10">
                        <p className="text-[9px] text-[#8b5a2b] uppercase font-bold mb-1.5 tracking-wider">Chi tiết</p>
                        <p className="text-[#3d2611] italic leading-relaxed text-sm">
                          {personDetail?.description || "Chưa có dữ liệu tiểu sử ghi chép cho thành viên này."}
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeTab === "images" && (
              <div>
                {isGettingMetadata ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8b5a2b]"></div>
                  </div>
                ) : personDetail?.allImageUrls?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {personDetail.allImageUrls.map((img, index) => (
                      <div
                        key={index}
                        className="aspect-square overflow-hidden border-2 border-[#5d3a1a] shadow-md group cursor-pointer"
                        onClick={() => setCurrentIndex(index)}
                      >
                        <img
                          src={img}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          alt={`gallery-${index}`}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-[#8b5a2b]/40">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <p className="text-[11px] italic mt-3">Chưa có hình ảnh</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
