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
import LinkSpousesModal from "@/components/ui/LinkSpousesModal";
import ImportPersonModal from "@/components/ui/ImportPersonModal";

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
  const [modalLinkSpousesOpen, setModalLinkSpousesOpen] = useState(false);
  const [modalImportPersonOpen, setModalImportPersonOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showFemales, setShowFemales] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [collapsedIds, setCollapsedIds] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isShowModalConnector, setIsShowModalConnector] = useState(false);

  const userWalletAddress = useSelector(
    (state) => state.genealogyReducer.walletAddress,
  );

  const isOwner = userWalletAddress && clanItem?.clanOwner === userWalletAddress;

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
    <div className="w-full h-full bg-[#e8d5b5] flex overflow-hidden font-serif">

      {/* ── LEFT SIDEBAR ── */}
      <div className={`transition-all duration-300 bg-[#1e0f05] text-[#f2e2ba] flex flex-col shadow-2xl z-50 flex-shrink-0 ${isSidebarOpen ? "w-60" : "w-0"}`}>
        <div className={`flex flex-col h-full ${!isSidebarOpen && "hidden"}`}>

          {/* Sidebar header */}
          <div className="px-5 py-4 border-b border-[#5d3a1a]/40 flex items-center gap-3">
            <div className="w-1.5 h-5 bg-[#c4922a]" />
            <span className="text-[11px] font-bold text-[#c4922a] uppercase tracking-[0.25em]">
              Công cụ
            </span>
          </div>

          <div className="flex flex-col gap-1 flex-grow p-3 overflow-y-auto">

            {/* Navigation group */}
            <div className="mb-1">
              <p className="text-[9px] font-bold text-[#5a3518] uppercase tracking-[0.25em] px-3 py-2">
                Điều hướng
              </p>
              <button
                onClick={() => setTabIndex(0)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[#c4a97a] hover:text-[#f2e2ba] hover:bg-[#3d2611]/60 text-[12px] font-semibold uppercase tracking-wide transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                Xem chi tiết
              </button>
            </div>

            <div className="h-px bg-[#3d2611]/60 mx-3 mb-1" />

            {/* Display group */}
            <div className="mb-1">
              <p className="text-[9px] font-bold text-[#5a3518] uppercase tracking-[0.25em] px-3 py-2">
                Hiển thị
              </p>
              <button
                onClick={() => setShowFemales(!showFemales)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-[#c4a97a] hover:text-[#f2e2ba] hover:bg-[#3d2611]/60 text-[12px] font-semibold uppercase tracking-wide transition-all"
              >
                <span className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    {showFemales
                      ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                      : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                    }
                  </svg>
                  {showFemales ? "Hiện nữ giới" : "Ẩn nữ giới"}
                </span>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${showFemales ? "bg-[#c4922a]" : "bg-[#3d2611]"}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${showFemales ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
              </button>
            </div>

            <div className="h-px bg-[#3d2611]/60 mx-3 mb-1" />

            {/* Actions group */}
            <div className="mb-1">
              <p className="text-[9px] font-bold text-[#5a3518] uppercase tracking-[0.25em] px-3 py-2">
                Xuất dữ liệu
              </p>
              <button
                onClick={() => setModalQROpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[#c4a97a] hover:text-[#f2e2ba] hover:bg-[#3d2611]/60 text-[12px] font-semibold uppercase tracking-wide transition-all"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                In mã QR
              </button>
              <button
                onClick={exportImage}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[#c4a97a] hover:text-[#f2e2ba] hover:bg-[#3d2611]/60 text-[12px] font-semibold uppercase tracking-wide transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Xuất ảnh gia phả
              </button>
            </div>

            {/* Owner actions */}
            {userWalletAddress && (
              <>
                <div className="h-px bg-[#3d2611]/60 mx-3 mb-1" />
                <div>
                  <p className="text-[9px] font-bold text-[#5a3518] uppercase tracking-[0.25em] px-3 py-2">
                    Quản lý
                  </p>
                  {isOwner && (
                    <>
                      <button
                        onClick={() => setModalLinkSpousesOpen(true)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-[#c4a97a] hover:text-[#f2e2ba] hover:bg-[#3d2611]/60 text-[12px] font-semibold uppercase tracking-wide transition-all"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        Liên kết vợ/chồng
                      </button>
                      <button
                        onClick={() => setModalImportPersonOpen(true)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-[#c4a97a] hover:text-[#f2e2ba] hover:bg-[#3d2611]/60 text-[12px] font-semibold uppercase tracking-wide transition-all"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="8.5" cy="7" r="4"/>
                          <line x1="20" y1="8" x2="20" y2="14"/>
                          <line x1="23" y1="11" x2="17" y2="11"/>
                        </svg>
                        Nhập thành viên
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setModalTransferOwner(true)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-[#c4a97a] hover:text-[#f2e2ba] hover:bg-[#3d2611]/60 text-[12px] font-semibold uppercase tracking-wide transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    Thay đổi quyền
                  </button>
                </div>
              </>
            )}

            {/* Sign in/out — bottom */}
            <div className="mt-auto pb-2 pt-3 border-t border-[#3d2611]/60">
              {userWalletAddress ? (
                <button
                  onClick={() => { dispatch(userSignOut()); router.push("/"); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400/70 hover:text-red-300 hover:bg-red-900/20 text-[12px] font-semibold uppercase tracking-wide transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                  </svg>
                  Đăng xuất
                </button>
              ) : (
                <button
                  onClick={() => setIsShowModalConnector(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-emerald-400/70 hover:text-emerald-300 hover:bg-emerald-900/20 text-[12px] font-semibold uppercase tracking-wide transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"/>
                  </svg>
                  Đăng nhập
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── SIDEBAR TOGGLE BUTTON ── */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed left-3 top-[calc(50%-20px)] z-[60] w-5 h-10 bg-[#3d2611] text-[#c4922a] hover:bg-[#5d3a1a] shadow-lg transition-all flex items-center justify-center"
        title={isSidebarOpen ? "Đóng menu" : "Mở menu"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path d={isSidebarOpen ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
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
      {modalLinkSpousesOpen && (
        <LinkSpousesModal
          clanItem={clanItem}
          familyData={familyData}
          onClose={() => setModalLinkSpousesOpen(false)}
          fetchDataDialog={fetchDataDialog}
        />
      )}
      {modalImportPersonOpen && (
        <ImportPersonModal
          clanItem={clanItem}
          onClose={() => setModalImportPersonOpen(false)}
          fetchDataDialog={fetchDataDialog}
        />
      )}
    </div>
  );
}
