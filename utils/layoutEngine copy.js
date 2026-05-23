import dagre from "dagre";

export const getLayoutedElements = (nodes, edges) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Trong file layoutEngine.js, hãy chỉnh lại phần config Dagre:
  dagreGraph.setGraph({
    rankdir: "TB",
    nodesep: 220, // Tăng lên từ 280 để có chỗ cho các bà vợ dàn ngang
    ranksep: 100,
    marginx: 100,
    marginy: 100,
  });

  nodes.forEach((node) => {
    const width =
      node.type === "clanTitle" ? 600 : 220 + node.data.spouseNumber * 220;
    const height = node.type === "clanTitle" ? 150 : 150;
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    if (
      !edge.id.includes("partner") &&
      dagreGraph.hasNode(edge.source) &&
      dagreGraph.hasNode(edge.target)
    ) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  const ancestorNode = nodes.find(
    (n) => !n.data.parents?.length && n.type !== "clanTitle",
  );
  const ancestorDagre = ancestorNode ? dagreGraph.node(ancestorNode.id) : null;

  return nodes.map((node) => {
    const dagreNode = dagreGraph.node(node.id);

    if (node.type === "clanTitle" && ancestorDagre) {
      return { ...node, position: { x: ancestorDagre.x - 280, y: 20 } };
    }

    return {
      ...node,
      position: {
        x: dagreNode.x - 110,
        y: dagreNode.y + 120,
      },
    };
  });
};
