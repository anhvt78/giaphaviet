"use client";
import React, {
  useContext,
  useEffect,
  useRef,
  useState,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import GenealogyDetailForm from "@/app/Forms/GenealogyDetailForm";
import GenealogyDiagramForm from "@/app/Forms/GenealogyDiagramForm";
import GenealogyStatisticsForm from "@/app/Forms/GenealogyStatisticsForm";
import { useRouter } from "@/i18n/navigation";
import sweetalert2 from "@/configs/swal";
import { GenealogyContext } from "@/context/GenealogyContext";
import { useDispatch, useSelector } from "react-redux";
import { userSignOut } from "@/redux/genealogySlide";
import { ConnectorModal } from "@/components/Modals/ConnectorModal";
import {
  generateMetadataLink,
  numberToByte32,
} from "@/components/Utils/helpers";
import { useTheme } from "@/context/ThemeContext";
import ThemeSwitcher from "@/components/ui/ThemeSwitcher";

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
  const t = useTranslations("DetailPage");
  const tCommon = useTranslations("Common");

  const { isClassical } = useTheme();
  const [tabIndex, setTabIndex] = useState(0);
  const [familyData, setFamilyData] = useState(null);
  const contentAreaRef = useRef(null);

  const { getClanDetail, getPersonData } = useContext(GenealogyContext);

  const dispatch = useDispatch();
  const userWalletAddress = useSelector((state) => state.genealogyReducer.walletAddress);
  const shortAddress = userWalletAddress
    ? `${userWalletAddress.slice(0, 6)}...${userWalletAddress.slice(-4)}`
    : "";
  const [isShowModalConnector, setIsShowModalConnector] = useState(false);

  const handleDisconnect = () => {
    dispatch(userSignOut());
    router.push("/");
  };

  const [clanItem, setClanItem] = useState();
  const [loadingClanDetail, setLoadingClanDetail] = useState(true);
  const [loadingClanDialog, setLoadingClanDialog] = useState(true);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const accDeltaRef = useRef(0);

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
    const delta = currentY - lastScrollY.current;
    lastScrollY.current = currentY;

    if (currentY <= 0) {
      accDeltaRef.current = 0;
      setNavVisible(true);
      return;
    }

    if (
      (delta > 0 && accDeltaRef.current < 0) ||
      (delta < 0 && accDeltaRef.current > 0)
    ) {
      accDeltaRef.current = 0;
    }
    accDeltaRef.current += delta;

    if (accDeltaRef.current > 80) {
      accDeltaRef.current = 0;
      setNavVisible(false);
    } else if (accDeltaRef.current < -30) {
      accDeltaRef.current = 0;
      setNavVisible(true);
    }
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
          router.push("/");
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
          title: t("loadError"),
          text: t("loadErrorText"),
        });
        router.push("/");
      }
    } catch (err) {
      sweetalert2.popupAlert({
        title: t("loadError"),
        text: t("loadErrorText"),
      });
      router.push("/");
    } finally {
      setLoadingClanDetail(false);
    }
  };

  const fetchDataDialog = async () => {
    setLoadingClanDialog(true);
    const ancestorId = numberToByte32(1);
    const tempList = [];

    const traverse = async (personId, generation = 1) => {
      try {
        const result = await getPersonData(clanId, personId);

        if (!result.sts) {
          throw new Error(`Failed to load person ID: ${personId}`);
        }

        const data = result.data;

        const spousesDetails = await Promise.all(
          data.spouses.map(async (el) => {
            const spouseResult = await getPersonData(clanId, el);
            if (!spouseResult.sts) {
              throw new Error(`Error loading spouse data`);
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
      sweetalert2.popupAlert({
        title: t("structureError"),
        text: error.message || "An error occurred while querying the family tree.",
        icon: "error",
      });
    } finally {
      setLoadingClanDialog(false);
    }
  };

  return (
    <div className="w-full h-screen bg-[#F5EDD0] flex flex-col overflow-hidden font-serif relative">
      {clanItem && tabIndex !== 1 && tabIndex !== 2 && (
        <div
          className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${navVisible ? "max-h-[300px]" : "max-h-0"}`}
        >
          <nav
            className="bg-[#8B1A1A] relative overflow-hidden py-3.5"
            aria-hidden="false"
          >
            <div className="classical-decor absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#D4AF37] via-[#C8960C] to-[#D4AF37]" />
            <div className="classical-decor absolute bottom-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#D4AF37] via-[#C8960C] to-[#D4AF37]" />
            <div className="classical-decor absolute top-[6px] left-0 right-0 h-[1px] bg-[#D4AF37] opacity-40" />
            <div className="classical-decor absolute bottom-[6px] left-0 right-0 h-[1px] bg-[#D4AF37] opacity-40" />

            {/* eslint-disable-next-line @next/next/no-img-element */}
            {isClassical && <img
              src="/hoa_tiet_sen_vang.svg"
              alt=""
              aria-hidden="true"
              className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ height: "calc(100% - 8px)", width: "auto" }}
            />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {isClassical && <img
              src="/hoa_tiet_cay_tre.svg"
              alt=""
              aria-hidden="true"
              className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ height: "calc(100% - 8px)", width: "auto" }}
            />}

            <div className="relative z-10 flex items-center justify-between px-16">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 border border-[#C8960C] flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8960C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <span className="text-[#C8960C] font-bold uppercase tracking-[0.25em] text-[13px] hidden sm:block">
                  {tCommon("appName")}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <ThemeSwitcher compact />
                {shortAddress && (
                  <div className="flex items-center gap-2 bg-[#6B0000]/60 border border-[#C8960C]/30 px-3 py-1.5 rounded-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[#C8960C]/80 text-[11px] font-mono tracking-wide">
                      {shortAddress}
                    </span>
                  </div>
                )}
                {userWalletAddress ? (
                  <button
                    onClick={handleDisconnect}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[#C8960C]/70 hover:text-[#F5EDD0] border border-[#C8960C]/30 hover:border-[#C8960C]/60 text-[11px] font-bold uppercase tracking-wider transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span className="hidden sm:inline">{t("signOut")}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsShowModalConnector(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[#C8960C]/70 hover:text-[#F5EDD0] border border-[#C8960C]/30 hover:border-[#C8960C]/60 text-[11px] font-bold uppercase tracking-wider transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    <span className="hidden sm:inline">{t("signIn")}</span>
                  </button>
                )}
              </div>
            </div>
          </nav>

          {isClassical && (
            <div
              aria-hidden="true"
              className="w-full flex-shrink-0"
              style={{
                height: 15,
                backgroundImage: "url(/hoa_tiet_vien_ngang.svg)",
                backgroundRepeat: "repeat-x",
                backgroundSize: "auto 15px",
              }}
            />
          )}
        </div>
      )}

      <div
        ref={contentAreaRef}
        className="flex-1 overflow-hidden relative flex flex-col"
      >
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
              <LoadingState message={t("loadingClan")} />
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
              <LoadingState message={t("loadingDiagram")} />
            )}
          </>
        )}
        {tabIndex == 2 && (
          <>
            {!loadingClanDialog ? (
              <GenealogyStatisticsForm
                clanItem={clanItem}
                familyData={familyData}
                setTabIndex={setTabIndex}
              />
            ) : (
              <LoadingState message={t("loadingStats")} />
            )}
          </>
        )}
      </div>

      {!userWalletAddress && (
        <ConnectorModal
          isShow={isShowModalConnector}
          onHide={() => setIsShowModalConnector(false)}
        />
      )}
    </div>
  );
}

function LoadingState({ message }) {
  return (
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center font-serif bg-[#F5EDD0]">
      <div className="relative w-20 h-20 mb-8">
        <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: "3s" }} viewBox="0 0 80 80" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#C8960C" strokeWidth="2" />
          <circle cx="40" cy="40" r="36" fill="none" stroke="#C8960C" strokeWidth="2.5" strokeDasharray="85 141" strokeLinecap="round" />
        </svg>
        <svg className="absolute animate-spin" style={{ top: 12, left: 12, width: 56, height: 56, animationDuration: "1.8s", animationDirection: "reverse" }} viewBox="0 0 56 56" aria-hidden="true">
          <circle cx="28" cy="28" r="24" fill="none" stroke="#C8960C" strokeWidth="1.5" />
          <circle cx="28" cy="28" r="24" fill="none" stroke="#C8960C" strokeWidth="2" strokeDasharray="40 110" strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B1A1A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
      </div>
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
    <Suspense fallback={<LoadingState message="Loading..." />}>
      <GenealogyDetailContent />
    </Suspense>
  );
}
