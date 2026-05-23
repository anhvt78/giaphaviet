"use client";
import React, { useContext, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GenealogyDetailForm from "@/app/Forms/GenealogyDetailForm";
import GenealogyDiagramForm from "@/app/Forms/GenealogyDiagramForm";
import { useRouter } from "next/navigation";
import sweetalert2 from "@/configs/swal";
import { GenealogyContext } from "@/context/GenealogyContext";
import {
  generateMetadataLink,
  numberToByte32,
} from "@/components/Utils/helpers";
import Lottie from "lottie-react";
import gettingDataAnimation from "../../assets/animations/gettingData.json";

const NONE_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const GENDER_MAP = {
  0: "male",
  1: "female",
  2: "undefined",
};

function GenealogyDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clanId = searchParams.get("id");

  const [tabIndex, setTabIndex] = useState(0);
  const [familyData, setFamilyData] = useState(null);

  const { getClanDetail, getPersonData } = useContext(GenealogyContext);

  const [clanItem, setClanItem] = useState();
  const [loadingClanDetail, setLoadingClanDetail] = useState(true);
  const [loadingClanDialog, setLoadingClanDialog] = useState(true);

  useEffect(() => {
    if (!clanId) {
      setLoadingClanDetail(false);
      setLoadingClanDialog(false);
      return;
    }
    fetchDataDetail();
  }, [clanId]);

  const fetchDataDetail = async () => {
    try {
      const result = await getClanDetail(clanId);

      if (result.sts) {
        fetchDataDialog();
        const object = JSON.parse(result.data?.clanMetadata);
        let allImageUrls = [];

        try {
          const imagesData = object?.value?.LSP4Metadata?.images;
          if (Array.isArray(imagesData)) {
            allImageUrls = imagesData
              .map((subArray) => {
                if (Array.isArray(subArray) && subArray.length > 0) {
                  return generateMetadataLink(subArray[0]?.url);
                }
                return null;
              })
              .filter((url) => url);
          }
        } catch (error) {
          router.push(`/`);
        }

        const item = {
          clanId: clanId,
          clanName: result.data?.clanName,
          clanOwner: result.data?.clanOwner,
          shortDesc: result.data?.clanDesc,
          allImageUrls: allImageUrls,
          clanDetail: object?.value?.LSP4Metadata?.description,
        };

        setClanItem(item);
      } else {
        sweetalert2.popupAlert({
          title: "Đã xảy ra lỗi",
          text: "Lỗi khi tải thông tin Gia phả. Vui lòng kiểm tra lại thông tin địa chỉ dòng họ!",
        });
        router.push(`/`);
      }
    } catch (err) {
      sweetalert2.popupAlert({
        title: "Đã xảy ra lỗi",
        text: "Lỗi khi tải thông tin Gia phả. Vui lòng kiểm tra lại thông tin địa chỉ dòng họ!",
      });
      router.push(`/`);
    } finally {
      setLoadingClanDetail(false);
    }
  };

  const fetchDataDialog = async () => {
    setLoadingClanDialog(true);
    const ancestorId = numberToByte32(1);
    const tempList = [];

    // ✅ FIX 1: Thêm tham số generation (mặc định = 1 cho tiên tổ)
    const traverse = async (personId, generation = 1) => {
      try {
        const result = await getPersonData(clanId, personId);

        console.log("167. result: ", result);

        if (!result.sts) {
          throw new Error(
            `Không thể tải dữ liệu cho cá nhân có ID: ${personId}. Xin vui lòng kiểm tra lại!`,
          );
        }

        const data = result.data;

        // Xử lý Spouses
        const spousesDetails = await Promise.all(
          data.spouses.map(async (el) => {
            const spouseResult = await getPersonData(clanId, el);
            if (!spouseResult.sts) {
              throw new Error(
                `Lỗi khi tải thông tin vợ/chồng của ${data.name}`,
              );
            }
            return {
              id: el,
              name: spouseResult.data.name,
              birthDate: spouseResult.data.birthDate,
              deathDate: spouseResult.data.deathDate,
              shortDesc: spouseResult.data.shortDesc,
              gender: GENDER_MAP[spouseResult.data.sex] || "undefined",
              isSpouse: true,
              spouseId: personId,
              // ✅ Vợ/chồng không có generation riêng, dùng cùng thế hệ với người phối ngẫu
              generation: generation,
              createdAt: spouseResult.data.createdAt,
            };
          }),
        );

        const item = {
          id: personId,
          name: data.name,
          gender: GENDER_MAP[data.sex] || "undefined",
          birthDate: data.birthDate,
          deathDate: data.deathDate,
          shortDesc: data.shortDesc,
          parents: data.parentId !== NONE_ID ? [data.parentId] : [],
          spouses: spousesDetails,
          // ✅ FIX 1: Lưu thế hệ vào item
          generation: generation,
          // ✅ FIX 2: Chuyển createdAt về BigInt an toàn để sort
          createdAt: data.createdAt,
        };

        tempList.push(item);

        console.log("159. data.children: ", data.children);

        // ✅ FIX 1: Đệ quy con với generation + 1
        if (data.children && data.children.length > 0) {
          await Promise.all(
            data.children.map((childId) => traverse(childId, generation + 1)),
          );
        }
      } catch (err) {
        throw err;
      }
    };

    try {
      await traverse(ancestorId, 1);
      setFamilyData(tempList);
    } catch (error) {
      console.error("Gia phả bị gián đoạn:", error);
      sweetalert2.popupAlert({
        title: "Lỗi cấu trúc Gia phả",
        text:
          error.message ||
          "Có lỗi xảy ra trong quá trình truy vấn cây gia phả.",
        icon: "error",
      });
    } finally {
      setLoadingClanDialog(false);
    }
  };

  return (
    <div className="w-full h-screen bg-[#e8d5b5] flex flex-col overflow-hidden font-serif">

      {/* ── SHARED TOP NAVBAR ── */}
      {clanItem && (
        <nav className="flex-shrink-0 bg-[#1e0f05]/96 backdrop-blur-sm border-b border-[#5d3a1a]/30 px-4 md:px-6 py-3 flex items-center justify-between z-40">
          {/* Left: Back */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-[#8b6045] hover:text-[#f2e2ba] text-[11px] font-bold uppercase tracking-wider transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span className="hidden sm:inline">Danh sách</span>
          </button>

          {/* Center: Clan name + tab pills */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-[#c4922a] text-[11px] font-bold uppercase tracking-[0.25em] hidden sm:block truncate max-w-[240px]">
              {clanItem.clanName}
            </span>
            <div className="flex border border-[#5d3a1a]/50 overflow-hidden">
              <button
                onClick={() => setTabIndex(0)}
                className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                  tabIndex === 0
                    ? "bg-[#3d2611] text-[#f2e2ba]"
                    : "text-[#8b6045] hover:text-[#f2e2ba] hover:bg-[#3d2611]/40"
                }`}
              >
                Chi tiết
              </button>
              <button
                onClick={() => !loadingClanDialog && setTabIndex(1)}
                disabled={loadingClanDialog}
                className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider border-l border-[#5d3a1a]/50 transition-all disabled:opacity-40 ${
                  tabIndex === 1
                    ? "bg-[#3d2611] text-[#f2e2ba]"
                    : "text-[#8b6045] hover:text-[#f2e2ba] hover:bg-[#3d2611]/40"
                }`}
              >
                {loadingClanDialog && tabIndex === 1 ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/></svg>
                    Phả đồ
                  </span>
                ) : "Phả đồ"}
              </button>
            </div>
          </div>

          {/* Right: LUKSO badge */}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#FE005B]" />
            <span className="text-[#5a3518] text-[10px] uppercase tracking-[0.2em] font-bold hidden sm:block">LUKSO</span>
          </div>
        </nav>
      )}

      {/* ── CONTENT AREA ── */}
      <div className="flex-1 overflow-hidden relative">
        {tabIndex == 0 && (
          <>
            {!loadingClanDetail ? (
              <GenealogyDetailForm
                clanItem={clanItem}
                setTabIndex={setTabIndex}
                fetchDataDetail={fetchDataDetail}
              />
            ) : (
              <LoadingState message="Đang truy vấn dữ liệu dòng tộc..." />
            )}
          </>
        )}
        {tabIndex == 1 && (
          <>
            {!loadingClanDialog ? (
              <GenealogyDiagramForm
                clanItem={clanItem}
                familyData={familyData}
                setTabIndex={setTabIndex}
                fetchDataDialog={fetchDataDialog}
                fetchDataDetail={fetchDataDetail}
              />
            ) : (
              <LoadingState message="Đang khởi tạo sơ đồ phả hệ..." />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function LoadingState({ message }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center font-serif bg-[#e8d5b5]">
      {/* Spinner rings */}
      <div className="relative w-20 h-20 mb-8">
        {/* Outer ring — slow clockwise */}
        <svg
          className="absolute inset-0 w-full h-full animate-spin"
          style={{ animationDuration: "3s" }}
          viewBox="0 0 80 80"
          aria-hidden="true"
        >
          <circle cx="40" cy="40" r="36" fill="none" stroke="#c9b48a" strokeWidth="2" />
          <circle
            cx="40" cy="40" r="36" fill="none"
            stroke="#c4922a" strokeWidth="2.5"
            strokeDasharray="85 141" strokeLinecap="round"
          />
        </svg>
        {/* Middle ring — faster counter-clockwise */}
        <svg
          className="absolute animate-spin"
          style={{
            top: 12, left: 12, width: 56, height: 56,
            animationDuration: "1.8s",
            animationDirection: "reverse",
          }}
          viewBox="0 0 56 56"
          aria-hidden="true"
        >
          <circle cx="28" cy="28" r="24" fill="none" stroke="#c9b48a" strokeWidth="1.5" />
          <circle
            cx="28" cy="28" r="24" fill="none"
            stroke="#8b5a2b" strokeWidth="2"
            strokeDasharray="40 110" strokeLinecap="round"
          />
        </svg>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="#5d3a1a"
            strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
      </div>

      {/* Message */}
      <p className="text-[#3d2611] text-sm font-serif uppercase tracking-[0.25em] text-center px-6 animate-pulse mb-2">
        {message}
      </p>
      <p className="text-[#8b5a2b]/50 text-[10px] font-mono uppercase tracking-widest">
        LUKSO Mainnet
      </p>
    </div>
  );
}

export default function GenealogyDetail() {
  return (
    <Suspense fallback={<LoadingState message="Đang khởi động..." />}>
      <GenealogyDetailContent />
    </Suspense>
  );
}
