"use client";
import React, { useMemo, useState } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import { toPng } from "html-to-image";

import PersonNode from "@/components/nodes/PersonNode";
import DetailSidebar from "@/components/ui/DetailSidebar";
import { getLayoutedElements } from "@/utils/layoutEngine";
import ClanTitleNode from "@/components/nodes/ClanTitleNode";

import { useDispatch, useSelector } from "react-redux";
import { userSignOut } from "@/redux/genealogySlide";
import { useRouter } from "next/navigation";

import QRGeneratorModal from "@/components/ui/QRGeneratorModal";
import TransferOwnershipModal from "@/components/ui/TransferOwnershipModal";
import { ConnectorModal } from "@/components/Modals/ConnectorModal";

const nodeTypes = {
  personNode: PersonNode,
  clanTitle: ClanTitleNode,
};

const getVisibleData = (allData, collapsedList) => {
  const hiddenIds = new Set();
  const addChildrenToHidden = (parentId) => {
    allData.forEach((p) => {
      if (p.parents && p.parents.includes(parentId)) {
        hiddenIds.add(p.id);
        p.partners?.forEach((partnerId) => hiddenIds.add(partnerId));
        addChildrenToHidden(p.id);
      }
    });
  };
  collapsedList.forEach((id) => addChildrenToHidden(id));
  return allData.filter((p) => !hiddenIds.has(p.id));
};

export default function GenealogyDiagramForm({
  clanItem,
  familyData,
  setTabIndex,
  fetchDataDetail,
  fetchDataDialog,
}) {
  const dispatch = useDispatch();
  const router = useRouter();
  const [modalQROpen, setModalQROpen] = useState(false);
  const [modalTransferOwner, setModalTransferOwner] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showFemales, setShowFemales] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [collapsedIds, setCollapsedIds] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isShowModalConnector, setIsShowModalConnector] = useState(false);

  const userWalletAddress = useSelector(
    (state) => state.genealogyReducer.walletAddress,
  );

  const toggleCollapse = (id) => {
    setCollapsedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const onNodeClick = (event, node) => {
    const person = familyData.find((p) => p.id === node.id);
    if (person) setSelectedPerson(person);
  };

  const { nodes, edges } = useMemo(() => {
    const filteredData = (
      showFemales
        ? familyData
        : familyData.filter(
            (p) => p.gender !== "female" && p.gender !== "FEMALE",
          )
    ).sort((a, b) => {
      // ✅ FIX: So sánh BigInt đúng cách, không dùng phép trừ
      const aVal = BigInt(a.createdAt ?? 0);
      const bVal = BigInt(b.createdAt ?? 0);
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    });

    const visibleFamily = getVisibleData(filteredData, collapsedIds);

    const rawNodes = [
      {
        id: "clan-header-top",
        type: "clanTitle",
        data: {
          label: `${clanItem?.clanName || "DÒNG TỘC"} PHẢ ĐỒ`,
          subTitle: "Uống nước nhớ nguồn - Ăn quả nhớ kẻ trồng cây",
        },
        position: { x: 0, y: 0 },
      },
      ...visibleFamily.map((p) => ({
        id: p.id,
        type: "personNode",
        data: {
          ...p,
          label: p.name,
          isCollapsed: collapsedIds.includes(p.id),
          hasChildren: filteredData.some((child) =>
            child.parents?.includes(p.id),
          ),
          onNodeClick: (nodeData) => setSelectedPerson(nodeData),
          spouseNumber: p.spouses?.length || 0,
          gender: p.gender || "undefined",
          onToggleCollapse: toggleCollapse,
          showFemales: showFemales,
        },
        position: { x: 0, y: 0 },
      })),
    ];

    const rawEdges = [];
    visibleFamily.forEach((p) => {
      if (p.parents && p.parents.length > 0) {
        const primaryParent = p.parents[0];
        rawEdges.push({
          id: `e-${primaryParent}-${p.id}`,
          source: primaryParent,
          target: p.id,
          type: "step",
          style: { stroke: "#5d3a1a", strokeWidth: 2 },
        });
      }

      if (p.partners && p.partners.length > 0) {
        p.partners.forEach((partnerId) => {
          if (p.id < partnerId) {
            rawEdges.push({
              id: `partner-${p.id}-${partnerId}`,
              source: p.id,
              target: partnerId,
              sourceHandle: "right",
              targetHandle: "left",
              type: "straight",
              style: {
                stroke: "#8b5a2b",
                strokeWidth: 2,
                strokeDasharray: "5,5",
              },
            });
          }
        });
      }
    });

    return {
      nodes: getLayoutedElements(rawNodes, rawEdges, showFemales),
      edges: rawEdges,
    };
  }, [familyData, collapsedIds, clanItem, showFemales]);

  const exportImage = () => {
    const el = document.querySelector(".react-flow__viewport");
    if (el) {
      toPng(el, { backgroundColor: "#e8d5b5", quality: 1 }).then((dataUrl) => {
        const link = document.createElement("a");
        link.download = "gia-pha-dong-ho.png";
        link.href = dataUrl;
        link.click();
      });
    }
  };

  return (
    <div className="w-full h-screen bg-[#e8d5b5] flex overflow-hidden">
      {/* SIDEBAR BÊN TRÁI */}
      <div
        className={`transition-all duration-300 bg-[#3d2611] text-[#f2e2ba] flex flex-col shadow-2xl z-50 ${isSidebarOpen ? "w-64" : "w-0"}`}
      >
        <div
          className={`p-6 flex flex-col h-full ${!isSidebarOpen && "hidden"}`}
        >
          <h2 className="text-xl font-bold mb-8 border-b border-[#5d3a1a] pb-2 text-center uppercase tracking-widest">
            Quản Lý
          </h2>

          <div className="flex flex-col gap-4 flex-grow">
            <button
              onClick={() => setTabIndex(0)}
              className="flex items-center gap-3 px-4 py-3 bg-[#5d3a1a] hover:bg-[#8b5a2b] transition-colors rounded-md text-sm font-semibold"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Xem chi tiết
            </button>

            {userWalletAddress && (
              <>
                <button
                  onClick={() => setModalTransferOwner(true)}
                  className="flex items-center gap-3 px-4 py-3 bg-[#5d3a1a] hover:bg-[#8b5a2b] transition-colors rounded-md text-sm font-semibold"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Chuyển quyền sở hữu
                </button>
              </>
            )}

            {/* Nút Gạt Ẩn/Hiện Con Gái */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#5d3a1a] rounded-md text-sm font-semibold">
              {showFemales ? (
                <div className="flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="text-orange-400"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>Hiện nữ giới</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="opacity-50"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                  <span>Ẩn nữ giới</span>
                </div>
              )}

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={showFemales}
                  onChange={() => setShowFemales(!showFemales)}
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>

            <button
              onClick={() => setModalQROpen(true)}
              className="flex items-center gap-3 px-4 py-3 bg-[#5d3a1a] hover:bg-[#8b5a2b] transition-colors rounded-md text-sm font-semibold"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              In mã QR
            </button>

            <button
              onClick={exportImage}
              className="flex items-center gap-3 px-4 py-3 bg-[#5d3a1a] hover:bg-[#8b5a2b] transition-colors rounded-md text-sm font-semibold"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Xuất ảnh gia phả
            </button>

            {userWalletAddress ? (
              <button
                onClick={() => {
                  dispatch(userSignOut());
                  router.push("/");
                }}
                className="flex items-center gap-3 px-4 py-3 bg-red-900/40 hover:bg-red-800 transition-colors rounded-md text-sm font-semibold text-red-200 mt-auto mb-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Đăng xuất
              </button>
            ) : (
              <button
                onClick={() => setIsShowModalConnector(true)}
                className="flex items-center gap-3 px-4 py-3 bg-green-900/40 hover:bg-green-800 transition-colors rounded-md text-sm font-semibold text-green-200 mt-auto mb-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
                </svg>
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </div>

      {/* NÚT ĐÓNG/MỞ SIDEBAR */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed left-4 top-4 z-[60] p-2 bg-[#5d3a1a] text-[#f2e2ba] rounded-full shadow-md hover:bg-[#8b5a2b] transition-all"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            d={
              isSidebarOpen
                ? "M19 12H5M12 19l-7-7 7-7"
                : "M4 12h14M12 5l7 7-7 7"
            }
          />
        </svg>
      </button>

      {/* Vùng sơ đồ chính */}
      <div className="flex-grow relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedPerson(null)}
          nodesDraggable={!isLocked}
          nodesConnectable={!isLocked}
          panOnDrag={!isLocked}
          zoomOnScroll={!isLocked}
          zoomOnPinch={!isLocked}
          fitView
        >
          <Background color="#8b5a2b" opacity={0.1} />
          <Controls
            onInteractiveChange={(interactive) => setIsLocked(!interactive)}
            showInteractive={true}
          />
        </ReactFlow>
      </div>

      {selectedPerson && (
        <DetailSidebar
          person={selectedPerson}
          clanItem={clanItem}
          onClose={() => setSelectedPerson(null)}
          fetchDataDialog={fetchDataDialog}
        />
      )}
      {modalQROpen && (
        <QRGeneratorModal
          clanItem={clanItem}
          onClose={() => setModalQROpen(false)}
        />
      )}
      {modalTransferOwner && (
        <TransferOwnershipModal
          clanItem={clanItem}
          fetchDataDetail={fetchDataDetail}
          onClose={() => setModalTransferOwner(false)}
        />
      )}
      {!userWalletAddress && (
        <ConnectorModal
          isShow={isShowModalConnector}
          onHide={() => setIsShowModalConnector(false)}
        />
      )}
    </div>
  );
}
