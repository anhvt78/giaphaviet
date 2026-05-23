import React from "react";
import { Handle, Position } from "reactflow";

export default function ClanTitleNode({ data }) {
  return (
    /* Sử dụng w-[800px] để khớp tuyệt đối với layoutEngine, giúp căn giữa chính xác */
    <div className="flex flex-col items-center justify-center p-10 w-[800px]">
      {/* Họa tiết trang trí */}
      <div className="flex items-center gap-4 mb-4 opacity-60">
        <div className="h-[1.5px] w-20 bg-[#8b5a2b]"></div>
        <span className="text-[#8b5a2b] text-3xl shadow-sm">✥</span>
        <div className="h-[1.5px] w-20 bg-[#8b5a2b]"></div>
      </div>

      {/* Tên dòng họ */}
      <div className="relative group w-full flex flex-col items-center">
        {/* whitespace-nowrap ngăn chữ bị nhảy dòng trên mobile */}
        <h2 className="text-4xl md:text-6xl font-serif font-black text-[#3d2611] uppercase tracking-[0.3em] text-center drop-shadow-md whitespace-nowrap">
          {data.label || "TÊN DÒNG HỌ"}
        </h2>

        {/* Đường gạch chân */}
        <div className="mt-8 flex flex-col items-center w-full">
          <div className="h-[3px] w-[70%] bg-[#8b5a2b] rounded-full shadow-sm"></div>
          {/* <div className="h-[1px] w-[50%] bg-[#8b5a2b] mt-2 opacity-40"></div> */}
        </div>
      </div>

      {/* Câu khẩu hiệu */}
      {data.subTitle && (
        <div className="mt-6 text-[#5d3a1a] font-serif italic text-2xl opacity-90 tracking-widest text-center max-w-[90%] leading-relaxed">
          {data.subTitle}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!opacity-0 !pointer-events-none"
      />
    </div>
  );
}
