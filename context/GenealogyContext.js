"use client"; // Thêm dòng này vào đầu file
import React from "react";

import {
  createWalletClient,
  createPublicClient,
  custom,
  http,
  getContract,
  parseEventLogs,
} from "viem";
import { lukso } from "viem/chains";

import { ERC725 } from "@erc725/erc725.js";
import profileSchema from "@erc725/erc725.js/schemas/LSP3ProfileMetadata.json";
import lsp4Schema from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";

import { ERC725YDataKeys } from "@lukso/lsp-smart-contracts";

import { generateMetadataLink } from "@/components/Utils/helpers";

const RPC_URL = "https://rpc.mainnet.lukso.network"; // RPC URL cho LUKSO Testnet

import { genealogyAddress, genealogyABI, familyNftABI } from "./constants";

//---CONNECTING WITH SMART CONTRACT

// Kết nối qua injected provider (window.lukso) — dùng cho giao dịch cần chữ ký user
const connectingWithSmartContract = async (smAddr, smABI) => {
  const injectedProvider =
    window.lukso || (window.ethereum?.isLukso ? window.ethereum : null);
  if (!injectedProvider) throw new Error("NO_PROVIDER");

  // Lấy danh sách accounts từ provider — bắt buộc để viem biết account nào ký
  const accounts = await injectedProvider.request({
    method: "eth_requestAccounts",
  });
  if (!accounts?.length) throw new Error("EMPTY_ACCOUNTS");

  const walletClient = createWalletClient({
    account: accounts[0], // ← gắn account vào client, viem mới cho phép write
    chain: lukso,
    transport: custom(injectedProvider),
  });

  const publicClient = createPublicClient({
    chain: lukso,
    transport: custom(injectedProvider),
  });

  const contract = getContract({
    address: smAddr,
    abi: smABI,
    client: { public: publicClient, wallet: walletClient },
  });

  return contract;
};

// Kết nối chỉ đọc — không cần private key, dùng cho contract.read.*
const connectReadOnlyContract = (contractAddress, contractABI) => {
  const publicClient = createPublicClient({
    chain: lukso,
    transport: http(RPC_URL),
  });
  return getContract({
    address: contractAddress,
    abi: contractABI,
    client: publicClient,
  });
};


const fetchContractData = async (contractAddress, lspSchema, dataType) => {
  try {
    const erc725 = new ERC725(lspSchema, contractAddress, RPC_URL, {
      ipfsGateway: "https://api.universalprofile.cloud/ipfs/",
    });
    const data = await erc725.fetchData(dataType);
    return data;
  } catch (error) {
    console.error("Error with ERC725:", error);
    throw error;
  }
};

export const GenealogyContext = React.createContext();

export const GenealogyProvider = ({ children }) => {
  const getClanInfo = async (clanId) => {
    try {
      const clanName = await fetchContractData(
        clanId,
        lsp4Schema,
        "LSP4TokenName",
      );

      return {
        sts: true,
        data: {
          clanName: clanName.value,
        },
      };
    } catch (error) {
      return { sts: false, data: error };
    }
  };

  const getClanDetail = async (clanId) => {
    try {
      const contract = connectReadOnlyContract(
        clanId,
        familyNftABI,
      );

      const clanMetadata = await fetchContractData(
        clanId,
        lsp4Schema,
        "LSP4Metadata",
      );
      const clanName = await fetchContractData(
        clanId,
        lsp4Schema,
        "LSP4TokenName",
      );

      const clanOwner = await contract.read.tokenOwnerOf([
        "0x0000000000000000000000000000000000000000000000000000000000000001",
      ]);

      const clanDesc = await contract.read.clanShortDesc();

      return {
        sts: true,
        data: {
          clanMetadata: JSON.stringify(clanMetadata, null, 2),
          clanName: clanName.value,
          clanDesc: clanDesc,
          clanOwner: clanOwner,
        },
      };
    } catch (error) {
      return { sts: false, data: error };
    }
  };

  const getPersonData = async (clanId, personId) => {
    try {
      const contract = connectReadOnlyContract(
        clanId,
        familyNftABI,
      );

      const personData = await contract.read.getPersonInfo([personId]);

      return {
        sts: true,
        data: personData,
      };
    } catch (error) {
      return { sts: false, data: error };
    }
  };

  const getPersonDetail = async (clanId, personId) => {
    try {
      const contract = connectReadOnlyContract(
        clanId,
        familyNftABI,
      );
      const personMetadata = await contract.read.getDataForTokenId([
        personId,
        ERC725YDataKeys.LSP4["LSP4Metadata"],
      ]);

      // Chưa có metadata on-chain → trả về null thay vì báo lỗi
      if (!personMetadata || personMetadata === "0x") {
        return { sts: true, data: null };
      }

      const erc725js = new ERC725(lsp4Schema);

      const decodedMetadata = erc725js.decodeData([
        {
          keyName: "LSP4Metadata",
          value: personMetadata,
        },
      ]);

      // decodedMetadata[0].value có thể null nếu bytes rỗng sau decode
      const metadataURL = decodedMetadata?.[0]?.value?.url;
      if (!metadataURL) {
        return { sts: true, data: null };
      }

      const metadataJsonLink = generateMetadataLink(metadataURL);
      if (!metadataJsonLink) {
        return { sts: true, data: null };
      }

      const response = await fetch(metadataJsonLink);
      if (!response.ok) {
        return { sts: true, data: null };
      }

      const jsonMetadata = await response.json();
      return { sts: true, data: jsonMetadata?.LSP4Metadata ?? null };
    } catch (error) {
      return { sts: false, data: error };
    }
  };

  const getOwner = async (clanId, personId) => {
    try {
      const familyNFTContract = connectReadOnlyContract(
        clanId,
        familyNftABI,
      );
      const ownerOfToken = await familyNFTContract.read.tokenOwnerOf([
        personId,
      ]);

      return {
        sts: true,
        data: ownerOfToken,
      };
    } catch (error) {
      return { sts: false, data: error };
    }
  };

  const createClan = async (walletAddress, formData, callBack, handleErr) => {
    try {
      const clanArgs = [
        formData.clanName,
        formData.description,
        formData.ancestorName,
        formData.ancestorDesc,
        formData.birthDate,
        formData.deathDate,
        formData.isDeceased,
        formData.ancestorSex,
      ];
      console.log("createClan args:", JSON.stringify(clanArgs, null, 2));

      const publicClient = createPublicClient({
        chain: lukso,
        transport: http(RPC_URL),
      });

      // Simulate trước để bắt revert reason rõ ràng
      try {
        await publicClient.simulateContract({
          address: genealogyAddress,
          abi: genealogyABI,
          functionName: "createClan",
          args: clanArgs,
          account: walletAddress,
        });
      } catch (simErr) {
        const reason =
          simErr?.cause?.reason ||
          simErr?.shortMessage ||
          simErr?.message ||
          "Giao dịch sẽ thất bại";
        console.error("Simulation revert:", simErr);
        handleErr("Lỗi tham số hợp đồng", reason);
        return;
      }

      const contract = await connectingWithSmartContract(
        genealogyAddress,
        genealogyABI,
      );

      const txHash = await contract.write.createClan(clanArgs);

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      // FIX: Kiểm tra transaction có thành công không
      if (receipt.status !== "success") {
        handleErr("Transaction reverted", receipt);
        return;
      }

      // FIX: Đổi tên event arg từ _creatorAddress → creatorAddress (đúng tên trong contract)
      const logs = parseEventLogs({
        abi: genealogyABI,
        eventName: "ClanCreated",
        logs: receipt.logs,
      });
      const event = logs.find(
        (l) =>
          l.args.creatorAddress?.toLowerCase() === walletAddress.toLowerCase(),
      );

      if (event) {
        callBack(event.args.clanAddress);
      } else {
        handleErr("Event not found", "ClanCreated event not found in receipt");
      }
    } catch (error) {
      const msg =
        error?.cause?.reason ||
        error?.shortMessage ||
        error?.message ||
        String(error);
      console.error("createClan error:", error);
      handleErr("Lỗi khởi tạo gia phả", msg);
    }
  };

  const updateClanShortDesc = async (
    walletAddress,
    clanId,
    newShortDesc,
    callBack,
    handleErr,
  ) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);

      const publicClient = createPublicClient({
        chain: lukso,
        transport: http(RPC_URL),
      });

      const txHash = await contract.write.setClanShortDesc([newShortDesc]);
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      // FIX: Kiểm tra transaction status
      if (receipt.status !== "success") {
        handleErr("Transaction reverted", receipt);
        return;
      }

      // FIX: Parse và xác nhận event ClanShortDescChanged từ contract
      const logs = parseEventLogs({
        abi: familyNftABI,
        eventName: "ClanShortDescChanged",
        logs: receipt.logs,
      });
      const event = logs.find(
        (l) => l.args.owner?.toLowerCase() === walletAddress.toLowerCase(),
      );

      if (event) {
        callBack();
      } else {
        handleErr(
          "Event not found",
          "ClanShortDescChanged event not found in receipt",
        );
      }
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const addChild = async (
    walletAddress,
    clanId,
    formData,
    callBack,
    handleErr,
  ) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);

      const publicClient = createPublicClient({
        chain: lukso,
        transport: http(RPC_URL),
      });

      const txHash = await contract.write.addChild([
        formData.parentId,
        formData.name,
        formData.shortDesc,
        formData.gender,
        formData.birthDate,
        formData.deathDate,
        formData.isDeceased,
      ]);

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      if (receipt.status !== "success") {
        handleErr("Transaction reverted", receipt);
        return;
      }

      const logs = parseEventLogs({
        abi: familyNftABI,
        eventName: "ChildAdded",
        logs: receipt.logs,
      });
      const event = logs.find(
        (l) => l.args.sender?.toLowerCase() === walletAddress.toLowerCase(),
      );

      if (event) {
        callBack(event.args.newChildId);
      } else {
        handleErr("Event not found", "ChildAdded event not found in receipt");
      }
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const removeChild = async (
    walletAddress,
    clanId,
    childId,
    callBack,
    handleErr,
  ) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);

      const publicClient = createPublicClient({
        chain: lukso,
        transport: http(RPC_URL),
      });

      const txHash = await contract.write.removeChild([childId]);
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      // FIX: Kiểm tra transaction status
      if (receipt.status !== "success") {
        handleErr("Transaction reverted", receipt);
        return;
      }

      // FIX: Parse và xác nhận event ChildRemoved từ contract
      const logs = parseEventLogs({
        abi: familyNftABI,
        eventName: "ChildRemoved",
        logs: receipt.logs,
      });
      const event = logs.find(
        (l) => l.args.sender?.toLowerCase() === walletAddress.toLowerCase(),
      );

      if (event) {
        callBack();
      } else {
        handleErr("Event not found", "ChildRemoved event not found in receipt");
      }
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const removeSpouse = async (
    walletAddress,
    clanId,
    personId,
    spouseId,
    callBack,
    handleErr,
  ) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);

      const publicClient = createPublicClient({
        chain: lukso,
        transport: http(RPC_URL),
      });

      const txHash = await contract.write.removeSpouse([personId, spouseId]);
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      // FIX: Kiểm tra transaction status
      if (receipt.status !== "success") {
        handleErr("Transaction reverted", receipt);
        return;
      }

      // FIX: Parse và xác nhận event SpouseRemoved từ contract
      const logs = parseEventLogs({
        abi: familyNftABI,
        eventName: "SpouseRemoved",
        logs: receipt.logs,
      });
      const event = logs.find(
        (l) => l.args.sender?.toLowerCase() === walletAddress.toLowerCase(),
      );

      if (event) {
        callBack();
      } else {
        handleErr(
          "Event not found",
          "SpouseRemoved event not found in receipt",
        );
      }
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const addSpouse = async (
    walletAddress,
    clanId,
    formData,
    callBack,
    handleErr,
  ) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);

      const publicClient = createPublicClient({
        chain: lukso,
        transport: http(RPC_URL),
      });

      const txHash = await contract.write.addSpouse([
        formData.personId,
        formData.name,
        formData.shortDesc,
        formData.gender,
        formData.birthDate,
        formData.deathDate,
        formData.isDeceased,
      ]);

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      if (receipt.status !== "success") {
        handleErr("Transaction reverted", receipt);
        return;
      }

      const logs = parseEventLogs({
        abi: familyNftABI,
        eventName: "SpouseAdded",
        logs: receipt.logs,
      });
      const event = logs.find(
        (l) => l.args.sender?.toLowerCase() === walletAddress.toLowerCase(),
      );

      if (event) {
        callBack(event.args.newSpouseId);
      } else {
        handleErr("Event not found", "SpouseAdded event not found in receipt");
      }
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const updatePersonData = async (
    walletAddress,
    clanId,
    formData,
    callBack,
    handleErr,
  ) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);

      const publicClient = createPublicClient({
        chain: lukso,
        transport: http(RPC_URL),
      });

      const txHash = await contract.write.updatePersonData([
        formData.personId,
        formData.name,
        formData.shortDesc,
        formData.birthDate,
        formData.deathDate,
        formData.isDeceased,
      ]);

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      // FIX: Kiểm tra transaction status
      if (receipt.status !== "success") {
        handleErr("Transaction reverted", receipt);
        return;
      }

      // FIX: Parse và xác nhận event UpdatePersonData từ contract
      const logs = parseEventLogs({
        abi: familyNftABI,
        eventName: "UpdatePersonData",
        logs: receipt.logs,
      });
      const event = logs.find(
        (l) => l.args.sender?.toLowerCase() === walletAddress.toLowerCase(),
      );

      if (event) {
        callBack();
      } else {
        handleErr(
          "Event not found",
          "UpdatePersonData event not found in receipt",
        );
      }
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const linkSpouses = async (walletAddress, clanId, personId1, personId2, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);
      const publicClient = createPublicClient({ chain: lukso, transport: http(RPC_URL) });
      const txHash = await contract.write.linkSpouses([personId1, personId2]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") { handleErr("Transaction reverted", receipt); return; }
      callBack();
    } catch (error) {
      const msg = error?.cause?.reason || error?.shortMessage || error?.message || String(error);
      handleErr("Lỗi liên kết vợ chồng", msg);
    }
  };

  const addExternalSpouse = async (walletAddress, clanId, personId, externalClanAddress, externalPersonId, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);
      const publicClient = createPublicClient({ chain: lukso, transport: http(RPC_URL) });
      const txHash = await contract.write.addExternalSpouse([personId, externalClanAddress, externalPersonId]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") { handleErr("Transaction reverted", receipt); return; }
      const logs = parseEventLogs({ abi: familyNftABI, eventName: "ExternalSpouseAdded", logs: receipt.logs });
      const event = logs.find(l => l.args.sender?.toLowerCase() === walletAddress.toLowerCase());
      if (event) callBack();
      else handleErr("Event not found", "ExternalSpouseAdded event not found in receipt");
    } catch (error) {
      const msg = error?.cause?.reason || error?.shortMessage || error?.message || String(error);
      handleErr("Lỗi thêm phối ngẫu xuyên clan", msg);
    }
  };

  const removeExternalSpouse = async (walletAddress, clanId, personId, externalClanAddress, externalPersonId, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);
      const publicClient = createPublicClient({ chain: lukso, transport: http(RPC_URL) });
      const txHash = await contract.write.removeExternalSpouse([personId, externalClanAddress, externalPersonId]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") { handleErr("Transaction reverted", receipt); return; }
      const logs = parseEventLogs({ abi: familyNftABI, eventName: "ExternalSpouseRemoved", logs: receipt.logs });
      const event = logs.find(l => l.args.sender?.toLowerCase() === walletAddress.toLowerCase());
      if (event) callBack();
      else handleErr("Event not found", "ExternalSpouseRemoved event not found in receipt");
    } catch (error) {
      const msg = error?.cause?.reason || error?.shortMessage || error?.message || String(error);
      handleErr("Lỗi xóa phối ngẫu xuyên clan", msg);
    }
  };

  const importPerson = async (walletAddress, clanId, formData, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);
      const publicClient = createPublicClient({ chain: lukso, transport: http(RPC_URL) });
      const txHash = await contract.write.importPerson([
        formData.name, formData.shortDesc, formData.sex,
        formData.birthDate, formData.deathDate, formData.isDeceased,
        formData.srcClanAddress, formData.srcPersonId,
      ]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") { handleErr("Transaction reverted", receipt); return; }
      const logs = parseEventLogs({ abi: familyNftABI, eventName: "PersonImported", logs: receipt.logs });
      const event = logs.find(l => l.args.sender?.toLowerCase() === walletAddress.toLowerCase());
      if (event) callBack(event.args.newPersonId);
      else handleErr("Event not found", "PersonImported event not found in receipt");
    } catch (error) {
      const msg = error?.cause?.reason || error?.shortMessage || error?.message || String(error);
      handleErr("Lỗi nhập thành viên", msg);
    }
  };

  const linkSamePerson = async (walletAddress, clanId, localPersonId, otherClanAddress, otherPersonId, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);
      const publicClient = createPublicClient({ chain: lukso, transport: http(RPC_URL) });
      const txHash = await contract.write.linkSamePerson([localPersonId, otherClanAddress, otherPersonId]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") { handleErr("Transaction reverted", receipt); return; }
      callBack();
    } catch (error) {
      const msg = error?.cause?.reason || error?.shortMessage || error?.message || String(error);
      handleErr("Lỗi liên kết cùng người", msg);
    }
  };

  const unlinkSamePerson = async (walletAddress, clanId, localPersonId, otherClanAddress, otherPersonId, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);
      const publicClient = createPublicClient({ chain: lukso, transport: http(RPC_URL) });
      const txHash = await contract.write.unlinkSamePerson([localPersonId, otherClanAddress, otherPersonId]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") { handleErr("Transaction reverted", receipt); return; }
      callBack();
    } catch (error) {
      const msg = error?.cause?.reason || error?.shortMessage || error?.message || String(error);
      handleErr("Lỗi xóa liên kết cùng người", msg);
    }
  };

  const personExists = async (clanId, personId) => {
    try {
      const contract = connectReadOnlyContract(clanId, familyNftABI);
      const exists = await contract.read.personExists([personId]);
      return { sts: true, data: exists };
    } catch (error) { return { sts: false, data: error }; }
  };

  const getPersonOrigin = async (clanId, personId) => {
    try {
      const contract = connectReadOnlyContract(clanId, familyNftABI);
      const origin = await contract.read.getPersonOrigin([personId]);
      return { sts: true, data: origin };
    } catch (error) { return { sts: false, data: error }; }
  };

  const getEquivalents = async (clanId, personId) => {
    try {
      const contract = connectReadOnlyContract(clanId, familyNftABI);
      const refs = await contract.read.getEquivalents([personId]);
      return { sts: true, data: refs };
    } catch (error) { return { sts: false, data: error }; }
  };

  const pauseClan = async (walletAddress, clanId, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);
      const publicClient = createPublicClient({ chain: lukso, transport: http(RPC_URL) });
      const txHash = await contract.write.pause([]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") { handleErr("Transaction reverted", receipt); return; }
      callBack();
    } catch (error) {
      const msg = error?.cause?.reason || error?.shortMessage || error?.message || String(error);
      handleErr("Lỗi tạm dừng gia phả", msg);
    }
  };

  const unpauseClan = async (walletAddress, clanId, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);
      const publicClient = createPublicClient({ chain: lukso, transport: http(RPC_URL) });
      const txHash = await contract.write.unpause([]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") { handleErr("Transaction reverted", receipt); return; }
      callBack();
    } catch (error) {
      const msg = error?.cause?.reason || error?.shortMessage || error?.message || String(error);
      handleErr("Lỗi mở lại gia phả", msg);
    }
  };

  const getClanCount = async () => {
    try {
      const contract = connectReadOnlyContract(genealogyAddress, genealogyABI);
      const count = await contract.read.clanCount();
      return { sts: true, data: count };
    } catch (error) { return { sts: false, data: error }; }
  };

  const isClanRegistered = async (clanAddress) => {
    try {
      const contract = connectReadOnlyContract(genealogyAddress, genealogyABI);
      const ok = await contract.read.isClanRegistered([clanAddress]);
      return { sts: true, data: ok };
    } catch (error) { return { sts: false, data: error }; }
  };

  const proposeClanLink = async (walletAddress, myClanAddress, targetClanAddress, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(genealogyAddress, genealogyABI);
      const publicClient = createPublicClient({ chain: lukso, transport: http(RPC_URL) });
      const txHash = await contract.write.proposeClanLink([myClanAddress, targetClanAddress]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") { handleErr("Transaction reverted", receipt); return; }
      callBack();
    } catch (error) {
      const msg = error?.cause?.reason || error?.shortMessage || error?.message || String(error);
      handleErr("Lỗi đề xuất liên kết gia phả", msg);
    }
  };

  const areClansLinked = async (clan1, clan2) => {
    try {
      const contract = connectReadOnlyContract(genealogyAddress, genealogyABI);
      const linked = await contract.read.areClansLinked([clan1, clan2]);
      return { sts: true, data: linked };
    } catch (error) { return { sts: false, data: error }; }
  };

  const isClanLinkProposed = async (clan1, clan2) => {
    try {
      const contract = connectReadOnlyContract(genealogyAddress, genealogyABI);
      const proposed = await contract.read.isClanLinkProposed([clan1, clan2]);
      return { sts: true, data: proposed };
    } catch (error) { return { sts: false, data: error }; }
  };

  const getLinkedClans = async (clanAddress) => {
    try {
      const contract = connectReadOnlyContract(genealogyAddress, genealogyABI);
      const clans = await contract.read.getLinkedClans([clanAddress]);
      return { sts: true, data: clans };
    } catch (error) { return { sts: false, data: error }; }
  };

  const withdrawClanLinkProposal = async (walletAddress, myClan, targetClan, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(genealogyAddress, genealogyABI);
      const publicClient = createPublicClient({ chain: lukso, transport: http(RPC_URL) });
      const txHash = await contract.write.withdrawClanLinkProposal([myClan, targetClan]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") { handleErr("Transaction reverted", receipt); return; }
      callBack();
    } catch (error) {
      const msg = error?.cause?.reason || error?.shortMessage || error?.message || String(error);
      handleErr("Lỗi rút đề xuất liên kết", msg);
    }
  };

  const removeClanLink = async (walletAddress, myClan, otherClan, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(genealogyAddress, genealogyABI);
      const publicClient = createPublicClient({ chain: lukso, transport: http(RPC_URL) });
      const txHash = await contract.write.removeClanLink([myClan, otherClan]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") { handleErr("Transaction reverted", receipt); return; }
      callBack();
    } catch (error) {
      const msg = error?.cause?.reason || error?.shortMessage || error?.message || String(error);
      handleErr("Lỗi xóa liên kết gia phả", msg);
    }
  };

  const claimClanRegistration = async (walletAddress, clanAddress, callBack, handleErr) => {
    try {
      const contract = await connectingWithSmartContract(genealogyAddress, genealogyABI);
      const publicClient = createPublicClient({ chain: lukso, transport: http(RPC_URL) });
      const txHash = await contract.write.claimClanRegistration([clanAddress]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") { handleErr("Transaction reverted", receipt); return; }
      callBack();
    } catch (error) {
      const msg = error?.cause?.reason || error?.shortMessage || error?.message || String(error);
      handleErr("Lỗi nhận quyền đăng ký clan", msg);
    }
  };

  const transferOwnership = async (
    walletAddress,
    clanId,
    newOwner,
    callBack,
    handleErr,
  ) => {
    try {
      const contract = await connectingWithSmartContract(clanId, familyNftABI);

      const publicClient = createPublicClient({
        chain: lukso,
        transport: http(RPC_URL),
      });

      const txHash = await contract.write.transferOwnership([newOwner]);
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      // FIX: Kiểm tra transaction status
      if (receipt.status !== "success") {
        handleErr("Transaction reverted", receipt);
        return;
      }

      // FIX: Parse event OwnershipTransferred (standard từ LSP8/Ownable) để xác nhận
      // newOwner on-chain khớp với địa chỉ đã truyền vào
      const logs = parseEventLogs({
        abi: familyNftABI,
        eventName: "OwnershipTransferred",
        logs: receipt.logs,
      });
      const event = logs.find(
        (l) => l.args.newOwner?.toLowerCase() === newOwner.toLowerCase(),
      );

      if (event) {
        callBack();
      } else {
        handleErr(
          "Event not found",
          "OwnershipTransferred event not found in receipt",
        );
      }
    } catch (error) {
      handleErr("Error", error);
    }
  };

  const checkDeployedCode = async (address) => {
    try {
      const publicClient = createPublicClient({
        chain: lukso,
        transport: http(RPC_URL),
      });
      const code = await publicClient.getBytecode({ address });

      return code !== undefined && code !== "0x";
    } catch (error) {
      // console.log("error: ", error);
    }
  };

  const getUserProfile = async (walletAddress) => {
    const isContract = await checkDeployedCode(walletAddress);

    if (isContract) {
      try {
        const userData = await fetchContractData(
          walletAddress,
          profileSchema,
          "LSP3Profile",
        );

        return { sts: true, data: { userData: userData } };
      } catch (error) {
        return {
          sts: false,
          data: error,
        };
      }
    } else {
      return {
        sts: true,
        data: { key: walletAddress, name: "NotLSP3Profile", value: null },
      };
    }
  };

  const getNFTCollection = async (walletAddress) => {
    try {
      let allNFT = [];
      let isCreator = false;
      const receivedAssetsValue = await fetchContractData(
        walletAddress,
        profileSchema,
        "LSP5ReceivedAssets[]",
      );

      const nftContract = connectReadOnlyContract(
        genealogyAddress,
        genealogyABI,
      );

      if (Array.isArray(receivedAssetsValue?.value)) {
        await Promise.all(
          receivedAssetsValue?.value?.map(async (el) => {
            const ownerNFT = await nftContract.read.getClanOwner([el]);
            if (ownerNFT != 0x0000000000000000000000000000000000000000) {
              if (!allNFT.includes(el)) {
                allNFT.push(el);
              }
              if (ownerNFT == walletAddress) {
                isCreator = true;
              }
            }
          }),
        );
      }

      return { sts: true, data: { allNFT: allNFT, isCreator: isCreator } };
    } catch (error) {
      return { sts: false, data: error };
    }
  };

  return (
    <GenealogyContext.Provider
      value={{
        createClan,
        getClanInfo,
        getClanDetail,
        updateClanShortDesc,
        getPersonData,
        getPersonDetail,
        getOwner,
        addChild,
        removeChild,
        addSpouse,
        removeSpouse,
        updatePersonData,
        linkSpouses,
        addExternalSpouse,
        removeExternalSpouse,
        importPerson,
        linkSamePerson,
        unlinkSamePerson,
        personExists,
        getPersonOrigin,
        getEquivalents,
        pauseClan,
        unpauseClan,
        getClanCount,
        isClanRegistered,
        proposeClanLink,
        areClansLinked,
        isClanLinkProposed,
        getLinkedClans,
        withdrawClanLinkProposal,
        removeClanLink,
        claimClanRegistration,
        transferOwnership,
        getUserProfile,
        getNFTCollection,
      }}
    >
      {children}
    </GenealogyContext.Provider>
  );
};
