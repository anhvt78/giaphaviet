"use client";
import React, { useState } from "react";
import "reactflow/dist/style.css";

import { useSelector } from "react-redux";

import ConnectForm from "./Forms/ConnectForm";
import ClanListForm from "./Forms/ClanListForm";

export default function FamilyTreePage() {
  const [isShowModalConnector, setIsShowModalConnector] = useState(true);

  const userWalletAddress = useSelector(
    (state) => state.genealogyReducer.walletAddress,
  );

  return (
    <div className="w-full h-screen bg-[#e8d5b5] flex overflow-hidden">
      {!userWalletAddress ? (
        <ConnectForm setIsShowModalConnector={setIsShowModalConnector} />
      ) : (
        <ClanListForm userWalletAddress={userWalletAddress} />
        // <GenealogyDetailPage clanId = {"0x632d00e238fb6919b2b461dd5d75e6002da64210"}/>
      )}
    </div>
  );
}
