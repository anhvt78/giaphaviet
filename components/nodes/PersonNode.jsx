import React from "react";
import { Handle, Position } from "reactflow";
import PersonCard from "@/components/nodes/PersonCard";

// ✅ Nhãn thế hệ theo chữ Hán-Việt
const GENERATION_LABELS = {
  1: "Tiên tổ",
  2: "Nhị đại tôn",
  3: "Tam đại tôn",
  4: "Tứ đại tôn",
  5: "Ngũ đại tôn",
  6: "Lục đại tôn",
  7: "Thất đại tôn",
  8: "Bát đại tôn",
  9: "Cửu đại tôn",
  10: "Thập đại tôn",
};

// ✅ Hàm xác định subTitle theo vai trò, thế hệ và giới tính
// function getSubTitle(person) {
//   // Vợ/chồng kết nạp (không thuộc dòng huyết thống chính)
//   if (person.isSpouse) {
//     return person.gender === "male" ? "Phu quân" : "Phu nhân";
//   }

//   const gen = person.generation ?? 1;

//   // Thế hệ 1 luôn là Tiên tổ bất kể giới tính
//   if (gen === 1) return "Tiên tổ";

//   // Nữ thuộc dòng huyết thống (thế hệ 2 trở đi)
//   if (person.gender === "female") return "Nội tộc";

//   // Nam thuộc dòng huyết thống — dùng nhãn Hán-Việt hoặc "Đời thứ N"
//   return GENERATION_LABELS[gen] ?? `Đời thứ ${gen}`;
// }

// ✅ Hàm xác định subTitle theo vai trò, thế hệ và giới tính
function getSubTitle(person) {
  // 1. Vợ/chồng kết nạp (không thuộc dòng huyết thống chính)
  if (person.isSpouse) {
    return person.gender === "male" ? "Phu quân" : "Phu nhân";
  }

  const gen = person.generation ?? 1;

  // 2. Thế hệ 1: Tiên tổ (Dùng chung hoặc phân biệt giới tính)
  if (gen === 1) {
    return person.gender === "female" ? "Thái Tiên tổ" : "Tiên tổ";
  }

  // 3. Thế hệ 2 (Con): Nam tử / Nữ tử
  if (gen === 2) {
    // Lưu ý: Trong logic của bạn gen 2 đang được map là "Nhị đại tôn" (Cháu),
    // nếu gen 2 là Con thì dùng:
    // return person.gender === "female" ? "Nữ tử" : "Nam tử";

    // Nếu vẫn giữ gen 2 là "Nhị đại tôn" theo bảng GENERATION_LABELS của bạn:
    return person.gender === "female" ? "Nhị đại tôn nữ" : "Nhị đại tôn";
  }

  // 4. Các thế hệ từ đời thứ 3 trở đi (Cháu, Chắt...)
  const baseLabel = GENERATION_LABELS[gen] ?? `Đời thứ ${gen}`;

  if (person.gender === "female") {
    // Thay vì gọi chung là "Nội tộc", ta thêm hậu tố "nữ" vào danh xưng thế hệ
    return `${baseLabel} nữ`;
  }

  // Mặc định cho Nam giới thuộc dòng tộc
  return baseLabel;
}

export default function PersonNode({ data }) {
  const isMale = data.gender === "male";

  // ✅ Tính subTitle động thay vì hardcode
  const subTitle = getSubTitle(data);

  return (
    <div className="relative flex flex-row items-start">
      <div className="flex flex-row items-center">
        <div className="group relative">
          {data.id != 1 && (
            <Handle
              type="target"
              position={Position.Top}
              style={{ left: "50%" }}
              className="!bg-[#5d3a1a] !w-3 !h-1 !rounded-none !border-none"
            />
          )}
          <PersonCard
            person={data}
            subTitle={subTitle}
            isMain={true}
            onNodeSelect={data.onNodeClick}
          />

          {data.hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onToggleCollapse(data.id);
              }}
              className="absolute scale-80 bottom-[-16px] left-1/2 -translate-x-1/2 w-8 h-8 bg-[#5d3a1a] text-white rounded-full border-2 border-[#f2e2ba] flex items-center justify-center text-xs shadow-md z-[110] hover:scale-100 font-bold transition-transform cursor-pointer"
            >
              {data.isCollapsed ? "+" : "-"}
            </button>
          )}
          {data.hasChildren && (
            <Handle
              type="source"
              position={Position.Bottom}
              style={{
                left: "50%",
                bottom: "0px",
                transform: "translateX(-50%)",
              }}
              className="!bg-[#5d3a1a] !w-3 !h-1 !rounded-none !border-none"
            />
          )}
        </div>

        {/* Danh sách vợ/chồng */}
        {data.showFemales && data.spouses && data.spouses.length > 0 && (
          <div className="flex flex-row items-center animate-in fade-in slide-in-from-left-5 duration-300">
            {data.spouses.map((spouse, index) => {
              // ✅ subTitle cho từng vợ/chồng
              const spouseSubTitle = isMale
                ? `Phu nhân ${data.spouses.length > 1 ? index + 1 : ""}`
                : `Phu quân ${data.spouses.length > 1 ? index + 1 : ""}`;

              return (
                <div key={index} className="flex flex-row items-center">
                  <div className="w-2 border-t-2 border-dashed border-[#8b5a2b]/40"></div>
                  <div className="relative">
                    <PersonCard
                      data={data}
                      person={spouse}
                      subTitle={spouseSubTitle.trim()}
                      isMain={false}
                      onNodeSelect={data.onNodeClick}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
