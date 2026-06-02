"use client";
import React, { useContext, useEffect, useRef, useState, Suspense } from "react";
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
  const contentAreaRef = useRef(null);

  const { getClanDetail, getPersonData } = useContext(GenealogyContext);

  const [clanItem, setClanItem] = useState();
  const [loadingClanDetail, setLoadingClanDetail] = useState(true);
  const [loadingClanDialog, setLoadingClanDialog] = useState(true);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (!clanId) {
      setLoadingClanDetail(false);
      setLoadingClanDialog(false);
      return;
    }
    fetchDataDetail();
  }, [clanId]);

  const handleContentScroll = (e) => {
    const currentY = e.currentTarget.scrollTop ?? 0;
    if (currentY <= 0) {
      setNavVisible(true);
    } else if (currentY > lastScrollY.current + 8) {
      setNavVisible(false);
    } else if (currentY < lastScrollY.current - 8) {
      setNavVisible(true);
    }
    lastScrollY.current = currentY;
  };

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
              isDeceased: spouseResult.data.isDeceased ?? false,
              shortDesc: spouseResult.data.shortDesc,
              gender: GENDER_MAP[spouseResult.data.sex] || "undefined",
              isSpouse: true,
              spouseId: personId,
              generation: generation,
              createdAt: spouseResult.data.createdAt,
              externalSpouses: spouseResult.data.externalSpouses || [],
            };
          }),
        );

        const item = {
          id: personId,
          name: data.name,
          gender: GENDER_MAP[data.sex] || "undefined",
          birthDate: data.birthDate,
          deathDate: data.deathDate,
          isDeceased: data.isDeceased ?? false,
          shortDesc: data.shortDesc,
          parents: data.parentId !== NONE_ID ? [data.parentId] : [],
          spouses: spousesDetails,
          externalSpouses: data.externalSpouses || [],
          generation: generation,
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
    <div className="w-full h-screen bg-[#F5EDD0] flex flex-col overflow-hidden font-serif relative">

      {/* ── SHARED TOP NAVBAR ── */}
      {clanItem && (
        <div className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${navVisible ? "max-h-[300px]" : "max-h-0"}`}>
        <nav className="bg-[#8B1A1A] z-40 relative overflow-hidden py-0" style={{ minHeight: 176 }}>
          {/* Top + bottom thick gold borders */}
          <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#D4AF37] via-[#C8960C] to-[#D4AF37]" />
          <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#D4AF37] via-[#C8960C] to-[#D4AF37]" />
          {/* Inner thin lines */}
          <div className="absolute top-[6px] left-0 right-0 h-[1px] bg-[#D4AF37] opacity-40" />
          <div className="absolute bottom-[6px] left-0 right-0 h-[1px] bg-[#D4AF37] opacity-40" />

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hoa_tiet_sen_vang.svg" alt="" aria-hidden="true"
            className="absolute left-0 top-2/3 -translate-y-1/2 pointer-events-none"
            style={{ height: "calc(70% - 8px)", width: "auto" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hoa_tiet_cay_tre.svg" alt="" aria-hidden="true"
            className="absolute right-0 top-2/3 -translate-y-1/2 pointer-events-none"
            style={{ height: "calc(70% - 8px)", width: "auto" }} />

          {/* Nav content — z-10 to sit above decorative SVGs */}
          <div className="relative z-10 flex items-center justify-between px-16 h-full" style={{ minHeight: 176 }}>

          {/* Left: Back */}
          {/* <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-[#C8960C]/70 hover:text-[#F5EDD0] text-[11px] font-bold uppercase tracking-wider transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span className="hidden sm:inline">Danh sách</span>
          </button> */}

          {/* Center: Banner hoành phi + tên dòng tộc */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ height: 200, width: 1200 }}>
            <div className="relative w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/banner_hoanh_phi.svg" alt="" aria-hidden="true"
                className="absolute inset-0 w-full h-full" />
              {/* Tên dòng tộc — nằm trong vùng đỏ giữa banner */}
              <div className="absolute flex flex-col items-center justify-center gap-0.5 ml-2"
                style={{ left: "10%", right: "10%", top: "38%", bottom: "14%" }}>
                {/* <span className="uppercase text-center tracking-[0.3em]"
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#FFF8E7",
                    textShadow: "0 0 6px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.8)",
                  }}>
                  Họ
                </span> */}
                <span className="uppercase text-center leading-tight"
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    letterSpacing: "0.2em",
                    color: "#fffbbc",
                    textShadow: "0 0 8px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.8), 0 -1px 2px rgba(0,0,0,0.6)",
                  }}>
                  {clanItem.clanName}
                </span>
              </div>
            </div>
          </div>

          {/* Right: LUKSO badge */}
          {/* <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#FE005B]" />
            <span className="text-[#C8960C]/50 text-[10px] uppercase tracking-[0.2em] font-bold hidden sm:block">LUKSO</span>
          </div> */}

          </div>{/* end nav content */}
        </nav>

        <div aria-hidden="true" className="w-full flex-shrink-0"
          style={{ height: 15, backgroundImage: "url(/hoa_tiet_vien_ngang.svg)", backgroundRepeat: "repeat-x", backgroundSize: "auto 15px" }} />
        </div>
      )}

{/* ── CONTENT AREA ── */}
      <div ref={contentAreaRef} className="flex-1 overflow-hidden relative flex flex-col">
        {tabIndex == 0 && (
          <>
            {!loadingClanDetail ? (
              <GenealogyDetailForm
                clanItem={clanItem}
                setTabIndex={setTabIndex}
                fetchDataDetail={fetchDataDetail}
                onScroll={handleContentScroll}
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
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center font-serif bg-[#F5EDD0]">
      {/* Spinner rings */}
      <div className="relative w-20 h-20 mb-8">
        {/* Outer ring — slow clockwise */}
        <svg
          className="absolute inset-0 w-full h-full animate-spin"
          style={{ animationDuration: "3s" }}
          viewBox="0 0 80 80"
          aria-hidden="true"
        >
          <circle cx="40" cy="40" r="36" fill="none" stroke="#C8960C" strokeWidth="2" />
          <circle
            cx="40" cy="40" r="36" fill="none"
            stroke="#C8960C" strokeWidth="2.5"
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
          <circle cx="28" cy="28" r="24" fill="none" stroke="#C8960C" strokeWidth="1.5" />
          <circle
            cx="28" cy="28" r="24" fill="none"
            stroke="#C8960C" strokeWidth="2"
            strokeDasharray="40 110" strokeLinecap="round"
          />
        </svg>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="#8B1A1A"
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
      <p className="text-[#8B1A1A] text-sm font-serif uppercase tracking-[0.25em] text-center px-6 animate-pulse mb-2">
        {message}
      </p>
      <p className="text-[#8B1A1A]/40 text-[10px] font-mono uppercase tracking-widest">
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
