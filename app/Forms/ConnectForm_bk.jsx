"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { setWalletAddress } from "@/redux/genealogySlide";
import sweetalert2 from "@/configs/swal";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { createWalletClient, custom } from "viem";
import { lukso } from "viem/chains";
import Swal from 'sweetalert2';
// ─────────────────────────────────────────────────────────────────────────────
// KIẾN TRÚC PROVIDER CỦA LUKSO
// ─────────────────────────────────────────────────────────────────────────────
//
//  ┌──────────────────────────┬──────────────────────────────────────────────┐
//  │  Môi trường              │  Provider inject vào đâu                     │
//  ├──────────────────────────┼──────────────────────────────────────────────┤
//  │  PC – Chrome Extension   │  window.lukso                                │
//  │  Mobile app (WebView)    │  window.lukso  (app inject như Extension)    │
//  │  The Grid (mini-app)     │  up-provider  (parent page inject)           │
//  │  Mobile – không có app   │  undefined → hướng dẫn tải app              │
//  └──────────────────────────┴──────────────────────────────────────────────┘

const LUKSO_MAINNET_ID = 42;

/**
 * Trả về injected EIP-1193 provider theo thứ tự ưu tiên:
 *  1. window.lukso               — Extension (PC) hoặc WebView (Mobile app)
 *  2. window.ethereum.isLukso   — fallback build cũ
 *  3. null                       — không tìm thấy
 */
const detectInjectedProvider = () => {
  if (typeof window === "undefined") return null;
  if (window.lukso) return window.lukso;
  if (window.ethereum?.isLukso) return window.ethereum;
  return null;
};

/**
 * Phát hiện dApp đang chạy trong The Grid (iframe universaleverything.io).
 * Dấu hiệu: đang trong iframe VÀ không có window.lukso inject.
 */
const detectGridContext = () => {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top && !window.lukso;
  } catch {
    return true; // cross-origin block → chắc chắn trong iframe
  }
};

export default function ConnectForm() {
  const [isShaking, setIsShaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputClanId, setInputClanId] = useState(""); // State cho ô nhập liệu
  const [isScanning, setIsScanning] = useState(false); // State cho hiệu ứng giả lập scan
  const [isMobile, setIsMobile] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();

  // Hàm xử lý khi nhập ID thủ công
  const handleAccessById = () => {
    // if (!inputClanId.trim()) {
    //   sweetalert2.popupAlert({
    //     title: "Thông báo",
    //     text: "Vui lòng nhập địa chỉ dòng họ để tiếp tục.",
    //   });
    //   return;
    // }

    // Kiểm tra định dạng địa chỉ ví cơ bản
        if (!inputClanId.trim().startsWith("0x") || inputClanId.trim().length !== 42) {
          sweetalert2.popupAlert({
            title: "Địa chỉ không lệ",
            text: "Vui lòng nhập đúng địa chỉ ví Blockchain (0x...)",
          });
          return;
        }
    // router.push(`/pages/detail/${inputClanId.trim()}`);
    router.push(`/pages/detail?id=${inputClanId.trim()}`);
  };

  // ── Kiểm tra & chuyển đổi chain về LUKSO Mainnet ────────────────────────
  const ensureCorrectChain = async (provider) => {
    const chainIdHex = await provider.request({ method: "eth_chainId" });
    const chainId = parseInt(chainIdHex, 16);
    if (chainId === LUKSO_MAINNET_ID) return true;

    // Thử switch trước
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x2A" }],
      });
      return true;
    } catch (switchError) {
      // Chain chưa được thêm vào ví → thêm mới
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x2A",
                chainName: "LUKSO Mainnet",
                nativeCurrency: { name: "LYX", symbol: "LYX", decimals: 18 },
                rpcUrls: ["https://rpc.mainnet.lukso.network"],
                blockExplorerUrls: [
                  "https://explorer.execution.mainnet.lukso.network",
                ],
              },
            ],
          });
          return true;
        } catch {
          sweetalert2.popupAlert({
            title: "Lỗi mạng",
            text: "Không thể thêm LUKSO Mainnet vào ví.",
          });
          return false;
        }
      }
    }
    sweetalert2.popupAlert({
      title: "Mạng không đúng",
      text: `Vui lòng chuyển sang LUKSO Mainnet (ID: 42). Hiện tại: ${chainId}.`,
    });
    return false;
  };

  // ── LUỒNG A: Injected provider — Extension (PC) / WebView (Mobile app) ──
  const connectViaInjected = useCallback(async () => {
    setIsProcessing(true);
    try {
      const provider = detectInjectedProvider();
      if (!provider) throw new Error("NO_PROVIDER");

      // Khởi tạo viem walletClient (dùng cho ký giao dịch sau này)
      createWalletClient({ chain: lukso, transport: custom(provider) });

      const ok = await ensureCorrectChain(provider);
      if (!ok) return;

      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });
      if (!accounts?.length) throw new Error("EMPTY_ACCOUNTS");

      dispatch(setWalletAddress(accounts[0]));
    } catch (error) {
      console.error("[Injected Provider] Lỗi kết nối:", error);
      resolveAndShowError(error);
    } finally {
      setIsProcessing(false);
    }
  }, [dispatch]);

  // ── LUỒNG B: up-provider — dApp nhúng trong The Grid ────────────────────
  const connectViaUPProvider = useCallback(async () => {
    setIsProcessing(true);
    try {
      const { createClientUPProvider } = await import("@lukso/up-provider");
      const upProvider = createClientUPProvider();

      createWalletClient({ chain: lukso, transport: custom(upProvider) });

      let accounts = await upProvider.request({ method: "eth_accounts" });

      if (!accounts?.length) {
        // Chờ parent page inject accounts qua postMessage
        accounts = await new Promise((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("TIMEOUT")),
            60_000
          );
          upProvider.on("accountsChanged", (newAccounts) => {
            clearTimeout(timeout);
            if (newAccounts?.length) resolve(newAccounts);
            else reject(new Error("EMPTY_ACCOUNTS"));
          });
        });
      }

      const chainIdHex = await upProvider.request({ method: "eth_chainId" });
      if (parseInt(chainIdHex, 16) !== LUKSO_MAINNET_ID) {
        sweetalert2.popupAlert({
          title: "Mạng không đúng",
          text: "The Grid đang dùng sai mạng. Vui lòng kiểm tra lại.",
        });
        return;
      }

      dispatch(setWalletAddress(accounts[0]));
    } catch (error) {
      console.error("[UP Provider / Grid] Lỗi kết nối:", error);
      const msg =
        error.message === "TIMEOUT"
          ? "Hết thời gian chờ. Vui lòng thử kết nối lại trong The Grid."
          : resolveErrorMessage(error, false);
      sweetalert2.popupAlert({ title: "Lỗi kết nối", text: msg });
    } finally {
      setIsProcessing(false);
    }
  }, [dispatch]);

  // ── Xử lý lỗi chung ─────────────────────────────────────────────────────
  const resolveErrorMessage = (error, mobile) => {
    if (error.message === "NO_PROVIDER") {
      return mobile
        ? "Không tìm thấy Universal Profiles App. Vui lòng mở trang này bên trong ứng dụng Universal Profiles trên điện thoại."
        : "Không tìm thấy Universal Profile Extension. Vui lòng cài Extension cho Chrome và thử lại.";
    }
    if (error.code === 4001 || error.message?.includes("rejected")) {
      return "Bạn đã từ chối yêu cầu kết nối.";
    }
    if (error.message === "EMPTY_ACCOUNTS") {
      return "Không lấy được tài khoản. Vui lòng mở khóa ví và thử lại.";
    }
    return "Không thể kết nối Universal Profile. Vui lòng thử lại.";
  };

  const resolveAndShowError = (error) => {
    sweetalert2.popupAlert({
      title: "Lỗi kết nối",
      text: resolveErrorMessage(error, isMobile),
    });
  };

  // ── Dispatcher thông minh — tự chọn luồng phù hợp ──────────────────────
  //  Thứ tự ưu tiên:
  //   1. The Grid context   → up-provider
  //   2. Injected provider  → window.lukso (Extension PC / WebView mobile)
  //   3. Không tìm thấy    → hướng dẫn theo thiết bị

const connectWalletHandler = () => {
  if (detectGridContext()) {
    connectViaUPProvider();
  } else if (detectInjectedProvider()) {
    connectViaInjected();
  } else if (isMobile) {
    // 1. Hỏi người dùng trên Mobile
    Swal.fire({
      title: "Cài đặt ứng dụng ví",
      text: "Để kết nối Gia Phả, bạn cần cài đặt Universal Profile. Bạn có muốn tải ngay không?",
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#5d3a1a", // Màu nâu gỗ hợp tone Gia Phả
      cancelButtonColor: "#8e8e8e",
      confirmButtonText: "Tải ứng dụng",
      cancelButtonText: "Để sau",
    }).then((result) => {
      if (result.isConfirmed) {
        // Gọi hàm chuyển hướng thẳng, không hiện popup nữa
        handleRedirectToStore();
      }
    });
  } else {
    // 2. Hỏi người dùng trên Desktop (Chrome Extension)
    Swal.fire({
      title: "Cài đặt tiện ích",
      text: "Trình duyệt của bạn chưa có Universal Profile Extension.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#5d3a1a",
      confirmButtonText: "Cài tiện ích",
      cancelButtonText: "Đóng",
    }).then((result) => {
      if (result.isConfirmed) {
        window.open("https://chromewebstore.google.com/detail/universal-profiles/abpickdkkbnbcoepogfhkhennhfhehfn", "_blank");
      }
    });
  }
};

  const handleRedirectToStore = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  const isAndroid = /android/i.test(userAgent);

  // ID thực tế bạn đã kiểm tra (Cập nhật 2026)
  const appIdIOS = "6702018631"; 
  const appIdAndroid = "io.universaleverything.universalprofiles";

  if (isIOS) {
    // Chuyển hướng thẳng đến App Store
    window.location.href = `https://apps.apple.com/app/id${appIdIOS}`;
  } else if (isAndroid) {
    // Thử mở bằng giao thức app trước (Market)
    window.location.href = `market://details?id=${appIdAndroid}`;
    
    // Fallback nếu máy không phản hồi giao thức market://
    setTimeout(() => {
      window.location.href = `https://play.google.com/store/apps/details?id=${appIdAndroid}`;
    }, 500);
  }
};

  // Sử dụng useRef để theo dõi trạng thái scanner, tránh khởi tạo nhiều lần
  const scannerRef = useRef(null);

  // 1. Kiểm tra thiết bị khi load trang
  useEffect(() => {
    const checkDevice = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      setIsMobile(isMobileDevice);
    };
    checkDevice();
  }, []);

  // Logic quét QR thực tế

  // Hàm khởi tạo camera tách biệt
  // const startScanner = async () => {
  //   // Đợi một chút để React render xong thẻ div#reader
  //   setTimeout(async () => {
  //     const element = document.getElementById("reader");
  //     if (!element) return; // Nếu vẫn chưa có thì thoát để tránh lỗi crash

  //     try {
  //       scannerRef.current = new Html5Qrcode("reader");
  //       const config = { fps: 10, qrbox: { width: 250, height: 250 } };

  //       await scannerRef.current.start(
  //         { facingMode: "environment" },
  //         config,
  //         (decodedText) => {
  //           const clanId = decodedText.includes("/")
  //             ? decodedText.split("/").pop()
  //             : decodedText;
  //           stopScanner();
  //           // router.push(`/pages/detail/${clanId.trim()}`);
  //           router.push(`/pages/detail?id=${clanId.trim()}`);
  //         },
  //       );
  //     } catch (err) {
  //       console.error("Lỗi khởi tạo camera:", err);
  //       setIsScanning(false);
  //     }
  //   }, 100); // Delay 100ms để đảm bảo DOM đã sẵn sàng
  // };

  // Thêm một state để kiểm tra xem camera đã sẵn sàng chưa
  const [isCameraReady, setIsCameraReady] = useState(false);

  // const startScanner = async () => {
  //   try {
  //     // Luôn dọn dẹp scanner cũ trước khi bắt đầu
  //     if (scannerRef.current) {
  //       await stopScanner();
  //     }

  //     // Đợi một khoảng thời gian nhỏ để đảm bảo thẻ #reader đã lên giao diện
  //     setTimeout(async () => {
  //       const element = document.getElementById("reader");
  //       if (!element) return;

  //       const html5QrCode = new Html5Qrcode("reader");
  //       scannerRef.current = html5QrCode;

  //       const config = {
  //         fps: 15, // Tăng fps để quét mượt hơn trên mobile
  //         qrbox: { width: 250, height: 250 },
  //         aspectRatio: 1.0,
  //       };

  //       await html5QrCode.start(
  //         { facingMode: "environment" },
  //         config,
  //         (decodedText) => {
  //           // Xử lý logic lấy ID từ URL hoặc text thuần
  //           const urlParams = new URLSearchParams(decodedText.split("?")[1]);
  //           const clanId = urlParams.get("id") || decodedText.split("/").pop();

  //           stopScanner();
  //           router.push(`/pages/detail?id=${clanId.trim()}`);
  //         },
  //       );
  //       setIsCameraReady(true);
  //     }, 500);
  //   } catch (err) {
  //     console.error("Manual Camera Error:", err);
  //     setIsScanning(false);
  //     // Thông báo chi tiết hơn để debug
  //     sweetalert2.popupAlert({
  //       title: "Lỗi Camera",
  //       text: "Thiết bị báo lỗi: " + err.message,
  //     });
  //   }
  // };

  // Ref để tránh gọi stop() đồng thời nhiều lần
  const isStoppingRef = useRef(false);

  const safeStop = async () => {
    if (!scannerRef.current || isStoppingRef.current) return;
    isStoppingRef.current = true;
    try {
      const state = scannerRef.current.getState?.();
      // getState: 2=SCANNING, 3=PAUSED
      if (state === 2 || state === 3) {
        await scannerRef.current.stop();
      }
    } catch (e) {
      if (
        !e?.message?.includes("not running") &&
        !e?.message?.includes("not scanning")
      ) {
        console.warn("safeStop warning:", e);
      }
    } finally {
      scannerRef.current = null;
      isStoppingRef.current = false;
    }
  };

  // Chọn camera sau phù hợp nhất — hỗ trợ cả iOS và Android
  const selectBackCamera = (cameras) => {
    if (!cameras?.length) return null;

    // Android: tên camera thường chứa "back", "facing back", "environment"
    // iOS: thường chứa "back", "Back"
    const backByLabel = cameras.find((c) =>
      /back|rear|environment|facing back/i.test(c.label),
    );
    if (backByLabel) return backByLabel;

    // Fallback: camera cuối trong danh sách
    // (thường là camera sau trên cả Android lẫn iOS)
    return cameras[cameras.length - 1];
  };

  // Hàm này được gọi TRỰC TIẾP từ user tap
  // iOS WebKit bắt buộc getUserMedia phải nằm trong user gesture
  const handleScanButtonClick = async () => {
    if (!isMobile) return;

    // Kiểm tra trình duyệt hỗ trợ
    if (!navigator.mediaDevices?.getUserMedia) {
      sweetalert2.popupAlert({
        title: "Không hỗ trợ",
        text: "Trình duyệt không hỗ trợ camera. Hãy dùng Safari hoặc Chrome mới nhất.",
      });
      return;
    }

    // Xin quyền camera NGAY TẠI ĐÂY — phải nằm trong user gesture
    // iOS Safari yêu cầu; Android Chrome cũng chấp nhận cách này
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      stream.getTracks().forEach((t) => t.stop());
    } catch (permErr) {
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const msg =
        permErr.name === "NotAllowedError"
          ? isIOS
            ? "Quyền camera bị từ chối. Vào Cài đặt > Safari > Camera và cho phép trang này."
            : "Quyền camera bị từ chối. Nhấn vào biểu tượng khoá trên thanh địa chỉ và cho phép Camera."
          : permErr.name === "NotFoundError"
            ? "Không tìm thấy camera. Hãy kiểm tra thiết bị."
            : permErr.message || "Không thể truy cập camera.";
      sweetalert2.popupAlert({ title: "Lỗi Camera", text: msg });
      return;
    }

    // Quyền đã được cấp — hiện UI và để useEffect gọi startScanner()
    setIsScanning(true);
  };

  const startScanner = async () => {
    // Chờ DOM render xong thẻ #reader
    await new Promise((r) => setTimeout(r, 200));
    const element = document.getElementById("reader");
    if (!element) return;

    await safeStop();

    try {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      const onSuccess = (decodedText) => {
        const clanId = decodedText.includes("id=")
          ? new URLSearchParams(decodedText.split("?")[1]).get("id")
          : decodedText.split("/").pop();
        safeStop().then(() => {
          setIsScanning(false);
          router.push(`/pages/detail?id=${clanId.trim()}`);
        });
      };

      let started = false;

      // Thử lấy danh sách camera cụ thể trước
      // Android: getCameras() trả về đầy đủ sau khi đã grant permission
      // iOS: cũng hoạt động sau khi đã grant permission ở bước trên
      try {
        const cameras = await Html5Qrcode.getCameras();
        const chosen = selectBackCamera(cameras);
        if (chosen) {
          await html5QrCode.start(chosen.id, config, onSuccess);
          started = true;
        }
      } catch (_) {
        // Không lấy được danh sách — fallback bên dưới
      }

      // Fallback: dùng facingMode ideal — an toàn cho cả iOS và Android
      if (!started) {
        await html5QrCode.start(
          { facingMode: { ideal: "environment" } },
          config,
          onSuccess,
        );
      }

      setIsCameraReady(true);
    } catch (err) {
      console.error("Camera Error:", err);
      await safeStop();
      setTimeout(() => {
        setIsScanning(false);
        sweetalert2.popupAlert({
          title: "Lỗi Camera",
          text: err.message || "Không thể khởi động scanner.",
        });
      }, 0);
    }
  };

  const stopScanner = async () => {
    await safeStop();
    setIsScanning(false);
  };
  // 2. Logic khởi tạo và dừng Camera thực tế
  // Lắng nghe biến isScanning để kích hoạt/tắt
  // Cấu trúc lại useEffect để tránh render chồng chéo
  useEffect(() => {
    let isMounted = true;

    const initScanner = async () => {
      if (isScanning && isMobile && isMounted) {
        await startScanner();
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      safeStop();
    };
  }, [isScanning, isMobile]); // Thêm isMobile vào dependency

  // const handleAccessById = () => {
  //   if (!inputClanId.trim()) return;
  //   router.push(`/detail/${inputClanId.trim()}`);
  // };

  return (
    <div className="w-full h-screen bg-[#e8d5b5] flex overflow-hidden">
      <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#3d2611]/70 backdrop-blur-md transition-all duration-500">
        <div
          onClick={(e) => e.stopPropagation()}
          className={`bg-[#f2e2ba] p-8 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-b-2 border-[#5d3a1a] w-full max-w-md text-center transform transition-all 
              ${isShaking ? "animate-shake" : "scale-100"}`}
        >
          {/* Header & Icon */}
          <div className="mb-4 flex justify-center relative">
            <div className="relative p-3 bg-[#5d3a1a] rounded-full shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                fill="#f2e2ba"
                viewBox="0 0 256 256"
              >
                <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z"></path>
                <path d="M128,80a12,12,0,1,0,12,12A12,12,0,0,0,128,80Zm0,96a8,8,0,0,0,8-8V128a8,8,0,0,0-16,0v40A8,8,0,0,0,128,176Z"></path>
              </svg>
            </div>
          </div>

          <h3 className="text-[#3d2611] text-xl font-black mb-2 uppercase tracking-widest">
            Truy cập gia phả
          </h3>
          <p className="text-[#5d3a1a] mb-6 text-sm opacity-80">
            Nhập mã định danh, quét mã QR hoặc kết nối ví để bắt đầu.
          </p>

          <div className="space-y-4">
            {/* PHẦN 1: NHẬP ID THỦ CÔNG */}
            <div className="relative group">
              <input
                type="text"
                value={inputClanId}
                onChange={(e) => setInputClanId(e.target.value)}
                placeholder="Nhập địa chỉ dòng họ (0x...)"
                className="w-full px-4 py-3 bg-[#e8d5b5]/50 border-2 border-[#5d3a1a]/20 rounded-lg text-[#3d2611] placeholder-[#5d3a1a]/40 focus:border-[#5d3a1a] focus:outline-none transition-all text-sm"
              />
              <button
                onClick={handleAccessById}
                className="absolute right-2 top-1.5 px-3 py-1.5 bg-[#5d3a1a] text-[#f2e2ba] rounded-md text-xs font-bold hover:bg-[#3d2611] transition-colors"
              >
                TRUY CẬP
              </button>
            </div>

            <div className="flex items-center gap-3 py-1">
              <div className="h-[1px] bg-[#5d3a1a]/20 flex-grow"></div>
              <span className="text-[10px] font-bold text-[#5d3a1a]/40 uppercase">
                Hoặc
              </span>
              <div className="h-[1px] bg-[#5d3a1a]/20 flex-grow"></div>
            </div>

            {/* PHẦN 2: SCAN & WALLET */}
            <div className="grid grid-cols-2 gap-3">
              {/* <button
                onClick={() => setIsScanning(!isScanning)}
                className={`flex flex-col items-center gap-2 p-3 border-2 rounded-xl transition-all ${
                  isScanning
                    ? "bg-[#5d3a1a] text-[#f2e2ba] border-[#5d3a1a]"
                    : "bg-transparent border-[#5d3a1a]/20 text-[#5d3a1a] hover:border-[#5d3a1a]"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M224,144v48a16,16,0,0,1-16,16H160a8,8,0,0,1,0-16h48V144a8,8,0,0,1,16,0ZM96,208H48V160a8,8,0,0,0-16,0v48a16,16,0,0,0,16,16H96a8,8,0,0,0,0-16ZM208,32H160a8,8,0,0,0,0,16h48V96a8,8,0,0,0,16,0V48A16,16,0,0,0,208,32ZM48,96a8,8,0,0,0,16,0V48H96a8,8,0,0,0,0-16H48A16,16,0,0,0,32,48V96ZM80,88h32a8,8,0,0,1,8,8v32a8,8,0,0,1-8,8H80a8,8,0,0,1-8-8V96A8,8,0,0,1,80,88Zm24,32V104H88v16Zm40-32h32a8,8,0,0,1,8,8v32a8,8,0,0,1-8,8H144a8,8,0,0,1-8-8V96A8,8,0,0,1,144,88Zm24,32V104H152v16Zm-88,24h32a8,8,0,0,1,8,8v32a8,8,0,0,1-8,8H80a8,8,0,0,1-8-8V152A8,8,0,0,1,80,144Zm24,32V160H88v16Zm40-32h8a8,8,0,0,1,0,16h-8a8,8,0,0,1,0-16Zm24,24a8,8,0,0,1,8-8h8a8,8,0,0,1,0,16h-8A8,8,0,0,1,168,168Zm0-24a8,8,0,0,1,8-8h8a8,8,0,0,1,0,16h-8A8,8,0,0,1,168,144Zm-24,24a8,8,0,0,1,8-8h8a8,8,0,0,1,0,16h-8A8,8,0,0,1,144,168Z"></path>
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-tighter">
                  Quét QR Code
                </span>
              </button> */}

              <button
                onClick={handleScanButtonClick}
                className={`flex flex-col items-center gap-2 p-3 border-2 rounded-xl transition-all w-full
      ${
        isMobile
          ? "border-[#5d3a1a]/20 text-[#5d3a1a] hover:border-[#5d3a1a] active:scale-95"
          : "border-gray-300 text-gray-400 cursor-not-allowed opacity-50"
      }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M224,144v48a16,16,0,0,1-16,16H160a8,8,0,0,1,0-16h48V144a8,8,0,0,1,16,0ZM96,208H48V160a8,8,0,0,0-16,0v48a16,16,0,0,0,16,16H96a8,8,0,0,0,0-16ZM208,32H160a8,8,0,0,0,0,16h48V96a8,8,0,0,0,16,0V48A16,16,0,0,0,208,32ZM48,96a8,8,0,0,0,16,0V48H96a8,8,0,0,0,0-16H48A16,16,0,0,0,32,48V96Z"></path>
                </svg>
                <span className="text-[10px] font-bold uppercase">Quét QR</span>
              </button>

              {/* Tooltip hiển thị khi rê chuột vào trên Desktop */}
              {!isMobile && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                  Chỉ hỗ trợ trên thiết bị di động
                </div>
              )}

              <button
                onClick={connectWalletHandler}
                disabled={isProcessing}
                className="flex flex-col items-center gap-2 p-3 bg-transparent border-2 border-[#5d3a1a]/20 text-[#5d3a1a] rounded-xl hover:border-[#5d3a1a] transition-all active:scale-95"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#5d3a1a]"></div>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M216,72H56a8,8,0,0,1,0-16H192a8,8,0,0,0,0-16H56A24,24,0,0,0,32,64V192a24,24,0,0,0,24,24H216a16,16,0,0,0,16-16V88A16,16,0,0,0,216,72Zm0,128H56a8,8,0,0,1-8-8V85.38A23.83,23.83,0,0,0,56,88H216v40H184a24,24,0,0,0,0,48h32v24Zm0-48H184a8,8,0,0,1,0-16h32Z"></path>
                  </svg>
                )}
                <span className="text-[10px] font-bold uppercase tracking-tighter">
                  Kết nối Ví
                </span>
              </button>
            </div>
          </div>

          {/* Vùng hiển thị Camera giả lập khi bấm Scan */}
          {/* {isScanning && (
            <div className="mt-4 p-4 bg-[#1a1007] rounded-lg border-2 border-dashed border-[#5d3a1a] animate-pulse">
              <div className="text-[10px] text-[#f2e2ba]/60 mb-1">
                Đang khởi động Camera...
              </div>
              <div className="h-24 flex items-center justify-center">
                <div className="w-16 h-16 border-2 border-[#f2e2ba]/30 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500 animate-scan"></div>
                </div>
              </div>
            </div>
          )} */}

          {/* Thay thế phần hiển thị Camera giả lập bằng code này */}
          {isScanning && (
            <div className="mt-4 relative bg-[#1a1007] rounded-lg border-2 border-[#5d3a1a] overflow-hidden">
              {/* Nút đóng camera */}
              <button
                onClick={() => stopScanner()}
                className="absolute top-2 right-2 z-50 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
                </svg>
              </button>

              {/* Đây là nơi Camera thực tế sẽ hiển thị */}
              <div id="reader" className="w-full"></div>

              <div className="py-2 bg-[#5d3a1a] text-[#f2e2ba] text-[10px] font-bold uppercase">
                Đang quét mã QR...
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-[#5d3a1a]/10">
            <p className="text-[10px] text-[#5d3a1a]/50 uppercase tracking-[0.2em] font-black">
              Bảo mật • Minh bạch • Vĩnh viễn
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
