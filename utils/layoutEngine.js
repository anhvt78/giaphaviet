// import dagre from "dagre";

// export const getLayoutedElements = (nodes, edges) => {
//   const dagreGraph = new dagre.graphlib.Graph();
//   dagreGraph.setDefaultEdgeLabel(() => ({}));

//   // Trong file layoutEngine.js, hãy chỉnh lại phần config Dagre:
//   dagreGraph.setGraph({
//     rankdir: "TB",
//     nodesep: 220, // Tăng lên từ 280 để có chỗ cho các bà vợ dàn ngang
//     ranksep: 100,
//     marginx: 100,
//     marginy: 100,
//   });

//   nodes.forEach((node) => {
//     console.log("node: ", node);

//     let width;
//     let height;

//     // const width =
//     //   node.type === "clanTitle" ? 600 : 220 + node.data.spouseNumber * 220;
//     // const height = node.type === "clanTitle" ? 100 : 150;
//     if (node.type === "clanTitle") {
//       // Giả sử mỗi ký tự chiếm khoảng 10-15px, cộng thêm padding
//       const textLength = node.data.label ? node.data.label.length : 0;
//       width = Math.max(200, textLength * 12 + 40); // Tối thiểu 200px
//       height = 100;
//     } else {
//       width = 220 + (node.data.spouseNumber || 0) * 220;
//       height = 150;
//     }

//     dagreGraph.setNode(node.id, { width, height });
//   });

//   edges.forEach((edge) => {
//     if (
//       !edge.id.includes("partner") &&
//       dagreGraph.hasNode(edge.source) &&
//       dagreGraph.hasNode(edge.target)
//     ) {
//       dagreGraph.setEdge(edge.source, edge.target);
//     }
//   });

//   dagre.layout(dagreGraph);

//   const ancestorNode = nodes.find(
//     (n) => !n.data.parents?.length && n.type !== "clanTitle",
//   );
//   const ancestorDagre = ancestorNode ? dagreGraph.node(ancestorNode.id) : null;

//   // let delta = 0;

//   return nodes.map((node) => {
//     const dagreNode = dagreGraph.node(node.id);

//     if (node.type === "clanTitle" && ancestorDagre) {
//       return { ...node, position: { x: ancestorDagre.x - 560, y: 20 } };
//     }

//     // delta += node.data.spouseNumber * 280;

//     // console.log("node = ", node.data.spouseNumber, " | dagreNode = ", dagreNode);

//     return {
//       ...node,
//       position: {
//         x: dagreNode.x - 110,
//         y: dagreNode.y + 120,
//       },
//     };
//   });
// };

import dagre from "dagre";

export const getLayoutedElements = (nodes, edges, showFemales) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: "TB",
    nodesep: 220,
    ranksep: 100,
    marginx: 100,
    marginy: 100,
  });

  // 1. Gán kích thước cho Dagre
  nodes.forEach((node) => {
    console.log("node = ", node);

    let width, height;
    if (node.type === "clanTitle") {
      width = 800; // Cố định con số này
      height = 250;
    } else {
      // width = 220 + (node.data.spouseNumber || 0) * 220;
      // height = 150;
      // const visibleSpouses = edges.filter(
      //   (edge) =>
      //     edge.source === node.id &&
      //     edge.id.includes("partner") &&
      //     nodes.find((n) => n.id === edge.target),
      // );

      const spouseCount = showFemales ? node.data.spouseNumber : 0;

      console.log("spouseCount: ", spouseCount);

      // Nếu ẩn nữ giới, spouseCount sẽ bằng 0 và width tự động thu về 220px
      width = 220 + spouseCount * 220;
      height = 150;
    }
    dagreGraph.setNode(node.id, { width, height });
  });

  // 2. Thiết lập Edges (giữ nguyên)
  edges.forEach((edge) => {
    // console.log("edge:  ", edge);

    if (
      !edge.id.includes("partner") &&
      dagreGraph.hasNode(edge.source) &&
      dagreGraph.hasNode(edge.target)
    ) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  // 3. Tìm cụ tổ để làm mốc căn giữa
  const ancestorNode = nodes.find(
    (n) => !n.data.parents?.length && n.type !== "clanTitle",
  );
  const ancestorDagre = ancestorNode ? dagreGraph.node(ancestorNode.id) : null;

  return nodes.map((node) => {
    const dagreNode = dagreGraph.node(node.id);

    // ĐIỂM QUAN TRỌNG: React Flow đặt vị trí dựa trên TOP-LEFT của node.
    // Dagre trả về vị trí X, Y là CENTER của node.
    // Công thức đúng: Position = Center - (Size / 2)

    if (node.type === "clanTitle" && ancestorDagre) {
      return {
        ...node,
        position: {
          x: ancestorDagre.x - 400, // 800 / 2 = 400
          y: 20,
        },
      };
    }

    return {
      ...node,
      position: {
        x: dagreNode.x - dagreNode.width / 2,
        y: dagreNode.y + 120,
      },
    };
  });
};
