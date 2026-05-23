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
    <div className="w-full h-screen bg-[#e8d5b5] flex overflow-hidden">
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
  );
}

function LoadingState({ message }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center font-serif">
      <div className="w-48 h-48 mb-4">
        <Lottie animationData={gettingDataAnimation} loop={true} />
      </div>
      <div className="relative w-full px-4 flex justify-center">
        <p className="text-[#000000] animate-pulse text-xl font-bold tracking-widest uppercase text-center px-4">
          {message}
        </p>
      </div>
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
