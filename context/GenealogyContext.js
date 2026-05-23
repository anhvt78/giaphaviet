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
import { privateKeyToAccount } from "viem/accounts";
import { lukso } from "viem/chains";

import { ERC725 } from "@erc725/erc725.js";
import profileSchema from "@erc725/erc725.js/schemas/LSP3ProfileMetadata.json";
import lsp4Schema from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";

import { ERC725YDataKeys } from "@lukso/lsp-smart-contracts";

import { generateMetadataLink } from "@/components/Utils/helpers";

const privateKey = `${process.env.PRIVATE_KEY}`;

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

// Kết nối qua private key (read/write không cần user ký) — dùng cho các hàm đọc dữ liệu
const connectingSmartContractByPrivatekey = (contractAddress, contractABI) => {
  try {
    const account = privateKeyToAccount(
      privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`,
    );

    const publicClient = createPublicClient({
      chain: lukso,
      transport: http(RPC_URL),
    });

    const walletClient = createWalletClient({
      account,
      chain: lukso,
      transport: http(RPC_URL),
    });

    const contract = getContract({
      address: contractAddress,
      abi: contractABI,
      client: { public: publicClient, wallet: walletClient },
    });

    return contract;
  } catch (error) {
    console.error("Error connecting to smart contract:", error);
    throw error;
  }
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
      const contract = connectingSmartContractByPrivatekey(
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
      const contract = connectingSmartContractByPrivatekey(
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
      const contract = connectingSmartContractByPrivatekey(
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
      const familyNFTContract = connectingSmartContractByPrivatekey(
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
      console.log("formData: ", formData);

      const contract = await connectingWithSmartContract(
        genealogyAddress,
        genealogyABI,
      );

      const publicClient = createPublicClient({
        chain: lukso,
        transport: http(RPC_URL),
      });

      const txHash = await contract.write.createClan([
        formData.clanName,
        formData.description,
        formData.ancestorName,
        formData.ancestorDesc,
        formData.birthDate,
        formData.deathDate,
      ]);

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
        // FIX: Đổi event.args.clanId → event.args.nftAddress (đúng tên trong contract)
        callBack(event.args.nftAddress);
      } else {
        handleErr("Event not found", "ClanCreated event not found in receipt");
      }
    } catch (error) {
      handleErr("Error", error);
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
        formData.birthDate,
        formData.deathDate,
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

      const nftContract = connectingSmartContractByPrivatekey(
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

        transferOwnership,
        getUserProfile,
        getNFTCollection,
      }}
    >
      {children}
    </GenealogyContext.Provider>
  );
};
