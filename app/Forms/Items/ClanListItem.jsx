import sweetalert2 from "@/configs/swal";
import { GenealogyContext } from "@/context/GenealogyContext";
import React, { useContext, useEffect, useState } from "react";
// import images from "@/app/img";
// import Image from "next/image";
import { useRouter } from "next/navigation";
// import { generateMetadataLink } from "@/components/Utils/helpers";
// import { useDispatch } from "react-redux";
// import { setClanInfo } from "@/redux/genealogySlide";

const ClanListItem = ({ clanId }) => {
  const router = useRouter();

  // const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [clanName, setClanName] = useState();
  const { getClanInfo } = useContext(GenealogyContext);

  useEffect(() => {
    if (!clanId) return;
    getClanInfo(clanId).then((result) => {
      setLoading(false);
      if (result.sts) {
        console.log("25. result: ", result.data);

        // const object = JSON.parse(result.data?.clanMetadata);
        // let imageUrl;

        // console.log("object: ", object.value.LSP4Metadata.images);

        // try {
        //   if (
        //     object?.value?.LSP4Metadata?.images &&
        //     Array.isArray(object.value.LSP4Metadata.images) &&
        //     object.value.LSP4Metadata.images.length > 0 &&
        //     Array.isArray(object.value.LSP4Metadata.images[0]) &&
        //     object.value.LSP4Metadata.images[0].length > 0 &&
        //     object.value.LSP4Metadata.images[0][0]?.url
        //   ) {
        //     imageUrl = generateMetadataLink(
        //       object?.value?.LSP4Metadata?.images[0][0]?.url,
        //     );
        //   }
        // } catch (error) {
        //   console.error("Error extracting CID:", error);
        // }

        // const item = {
        //   clanId: clanId,
        //   clanName: result.data?.clanName,
        //   shortDesc: result.data?.clanDesc,
        //   images: object?.value?.LSP4Metadata?.images,
        //   clanDetail: object?.value?.LSP4Metadata?.description,
        //   clanImage: imageUrl,
        // };

        // setClanItem(item);

        setClanName(result.data?.clanName);

        // dispatch(setClanInfo(item));
      } else {
        sweetalert2.popupAlert({
          title: "Đã xả ra lỗi",
          text: "Lỗi khi tải thông tin Gia phả.",
        });
      }
    });
  }, [clanId]);
  // const GENEALOGY_DATA = [
  //   {
  //     id: "nguyen-toc",
  //     title: "NGUYỄN TỘC PHẢ ĐỒ",
  //     description:
  //       "Dòng dõi cụ Nguyễn Văn Tổ, khởi nguồn từ vùng đất tổ linh thiêng.",
  //     image:
  //       "https://cdn3648.cdn4s7.io.vn/media/1547697242_1496913269_custom_1.png", // Thay bằng link ảnh thật
  //     clanId: "0x632d00e238fb6919b2b461dd5d75e6002da64210",
  //   },
  //   {
  //     id: "le-toc",
  //     title: "LÊ TỘC THẾ PHẢ",
  //     description:
  //       "Ghi chép về sự phát triển của dòng họ Lê qua 12 đời con cháu.",
  //     image:
  //       "https://cdn3648.cdn4s7.io.vn/media/1547697242_1496913269_custom_1.png",
  //     clanId: "0x632d00e238fb6919b2b461dd5d75e6002da64210",
  //   },
  //   {
  //     id: "le-toc1",
  //     title: "LÊ TỘC THẾ PHẢ",
  //     description:
  //       "Ghi chép về sự phát triển của dòng họ Lê qua 12 đời con cháu.",
  //     image:
  //       "https://cdn3648.cdn4s7.io.vn/media/1547697242_1496913269_custom_1.png",
  //     clanId: "0x632d00e238fb6919b2b461dd5d75e6002da64210",
  //   },
  //   {
  //     id: "le-toc2",
  //     title: "LÊ TỘC THẾ PHẢ",
  //     description:
  //       "Ghi chép về sự phát triển của dòng họ Lê qua 12 đời con cháu.",
  //     image:
  //       "https://cdn3648.cdn4s7.io.vn/media/1547697242_1496913269_custom_1.png",
  //     clanId: "0x632d00e238fb6919b2b461dd5d75e6002da64210",
  //   },
  //   // Thêm các mục khác tại đây...
  // ];
  return (
    <div
      // onClick={() =>
      //   router.push(`/genealogyDetail?clanId=${item.clanId}`)
      // }
      onClick={() => router.push(`/pages/detail?id=${clanId}`)}
      className="group cursor-pointer bg-[#f2e2ba] border-2 border-[#5d3a1a] shadow-[10px_10px_0px_0px_rgba(93,58,26,0.1)] hover:shadow-[15px_15px_0px_0px_rgba(93,58,26,0.2)] hover:-translate-y-2 transition-all duration-300 overflow-hidden"
    >
      {/* Hình ảnh đại diện */}
      {/* <div className="h-48 overflow-hidden border-b-2 border-[#5d3a1a] relative">
        <Image
          src={images.tu_duong}
          alt="Hình ảnh dòng họ"
          fill
          sizes="300px"
          className="object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-[#3d2611]/10 group-hover:bg-transparent transition-colors"></div>
      </div> */}

      {/* Nội dung mô tả */}

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#5d3a1a]"></div>
          </div>
        ) : (
          <h3 className="text-[#3d2611] text-xl font-bold mb-3 uppercase tracking-wider group-hover:text-[#8b5a2b] transition-colors">
            {clanName}
          </h3>
        )}
        {/* <h3 className="text-[#3d2611] text-xl font-bold mb-3 uppercase tracking-wider group-hover:text-[#8b5a2b] transition-colors">
          {clanName}
        </h3> */}
        {/* <p className="text-[#5d3a1a] text-sm leading-relaxed line-clamp-3">
          {clanItem?.shortDesc}
        </p> */}

        <div className="mt-6 flex items-center text-[#3d2611] font-bold text-xs uppercase tracking-widest">
          <span>Xem chi tiết</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 ml-2 group-hover:translate-x-2 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ClanListItem;
