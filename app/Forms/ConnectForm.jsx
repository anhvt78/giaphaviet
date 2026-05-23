"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { setWalletAddress } from "@/redux/genealogySlide";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { createWalletClient, custom } from "viem";
import { lukso } from "viem/chains";

const LUKSO_MAINNET_ID = 42;

const detectInjectedProvider = () => {
  if (typeof window === "undefined") return null;
  if (window.lukso) return window.lukso;
  if (window.ethereum?.isLukso) return window.ethereum;
  return null;
};

const detectGridContext = () => {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top && !window.lukso;
  } catch {
    return true;
  }
};

export default function ConnectForm() {
  const [isShaking, setIsShaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputClanId, setInputClanId] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();
  const scannerRef = useRef(null);
  const isStoppingRef = useRef(false);

  useEffect(() => {
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    setIsMobile(isMobileDevice);
  }, []);

  const handleAccessById = () => {
    if (
      !inputClanId.trim().startsWith("0x") ||
      inputClanId.trim().length !== 42
    ) {
      Swal.fire({
        title: "Địa chỉ không hợp lệ",
        text: "Vui lòng nhập đúng địa chỉ ví Blockchain (0x...)",
        icon: "error",
        confirmButtonColor: "#5d3a1a",
      });
      return;
    }
    router.push(`/pages/detail?id=${inputClanId.trim()}`);
  };

  const connectWalletHandler = () => {
    if (detectGridContext()) {
      connectViaUPProvider();
      return;
    }

    const provider = detectInjectedProvider();
    if (provider) {
      connectViaInjected();
      return;
    }

    Swal.fire({
      title: "Cần mở bằng ứng dụng",
      text: isMobile
        ? "Vui lòng nhấn 'Mở ứng dụng' để kết nối ví Universal Profiles."
        : "Không tìm thấy Universal Profile Extension. Vui lòng cài Extension để tiếp tục.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: isMobile ? "Mở ứng dụng" : "Cài đặt ngay",
      cancelButtonText: "Để sau",
      confirmButtonColor: "#5d3a1a",
      cancelButtonColor: "#d33",
    }).then((result) => {
      if (result.isConfirmed) {
        if (isMobile) {
          handleOpenApp();
        } else {
          window.open(
            "https://chromewebstore.google.com/detail/universal-profiles/abpickdkkbnbcoepogfhkhennhfhehfn",
            "_blank",
          );
        }
      }
    });
  };

  const handleOpenApp = () => {
    // 1. Lấy URL hiện tại (bao gồm cả giao thức https://)
    const currentUrl = window.location.href;

    // 2. Sử dụng URL Scheme trực tiếp của app Universal Profiles (up://)
    // Cách này sẽ ép điện thoại mở app ngay lập tức mà không cần qua server trung gian
    const appSchemeUrl = `up://view?url=${encodeURIComponent(currentUrl)}`;

    // Thực thi mở app
    window.location.href = appSchemeUrl;

    // 3. Fallback: Nếu sau 2.5 giây người dùng vẫn ở trình duyệt (nghĩa là chưa cài app)
    // thì mới dẫn họ tới Store.
    setTimeout(() => {
      if (document.visibilityState === "visible") {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const androidUrl =
          "https://play.google.com/store/apps/details?id=io.universaleverything.universalprofiles";
        const iosUrl =
          "https://apps.apple.com/us/app/universal-profiles/id6702018631";

        window.location.href = isIOS ? iosUrl : androidUrl;
      }
    }, 2500);
  };

  const connectViaInjected = useCallback(async () => {
    setIsProcessing(true);
    try {
      const provider = detectInjectedProvider();
      if (!provider) throw new Error("NO_PROVIDER");
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });
      dispatch(setWalletAddress(accounts[0]));
    } catch (error) {
      Swal.fire({
        title: "Lỗi",
        text: "Không thể kết nối. Hãy thử lại trong ứng dụng.",
        icon: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [dispatch]);

  const connectViaUPProvider = useCallback(async () => {
    setIsProcessing(true);
    try {
      const { createClientUPProvider } = await import("@lukso/up-provider");
      const upProvider = createClientUPProvider();
      const accounts = await upProvider.request({ method: "eth_accounts" });
      dispatch(setWalletAddress(accounts[0]));
    } catch (error) {
      Swal.fire({
        title: "Lỗi",
        text: "Lỗi kết nối trong môi trường Grid.",
        icon: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [dispatch]);

  const safeStop = async () => {
    if (!scannerRef.current || isStoppingRef.current) return;
    isStoppingRef.current = true;
    try {
      if (scannerRef.current.getState?.() >= 2) await scannerRef.current.stop();
    } catch (e) {
      console.warn(e);
    } finally {
      scannerRef.current = null;
      isStoppingRef.current = false;
    }
  };

  const handleScanButtonClick = async () => {
    if (!isMobile) return;
    setIsScanning(true);
  };

  const startScanner = async () => {
    await new Promise((r) => setTimeout(r, 200));
    const element = document.getElementById("reader");
    if (!element) return;
    await safeStop();
    try {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: { ideal: "environment" } },
        { fps: 10, qrbox: 250 },
        (text) => {
          const clanId = text.includes("id=")
            ? new URLSearchParams(text.split("?")[1]).get("id")
            : text.split("/").pop();
          safeStop().then(() => {
            setIsScanning(false);
            router.push(`/pages/detail?id=${clanId.trim()}`);
          });
        },
      );
    } catch (err) {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isScanning && isMobile) startScanner();
    return () => safeStop();
  }, [isScanning, isMobile]);

  return (
    <div className="w-full h-screen bg-[#e8d5b5] flex overflow-hidden">
      <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#3d2611]/70 backdrop-blur-md">
        <div className="bg-[#f2e2ba] p-8 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-b-2 border-[#5d3a1a] w-full max-w-md text-center">
          <div className="mb-4 flex justify-center">
            <div className="p-3 bg-[#5d3a1a] rounded-full shadow-lg">
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
            Nhập mã định danh, quét mã QR hoặc kết nối ví.
          </p>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={inputClanId}
                onChange={(e) => setInputClanId(e.target.value)}
                placeholder="Nhập địa chỉ dòng họ (0x...)"
                className="w-full px-4 py-3 bg-[#e8d5b5]/50 border-2 border-[#5d3a1a]/20 rounded-lg text-[#3d2611] text-sm focus:border-[#5d3a1a] outline-none"
              />
              <button
                onClick={handleAccessById}
                className="absolute right-2 top-1.5 px-3 py-1.5 bg-[#5d3a1a] text-[#f2e2ba] rounded-md text-xs font-bold"
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

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleScanButtonClick}
                className={`flex flex-col items-center gap-2 p-3 border-2 rounded-xl transition-all ${isMobile ? "border-[#5d3a1a]/20 text-[#5d3a1a]" : "opacity-50 cursor-not-allowed"}`}
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

              <button
                onClick={connectWalletHandler}
                disabled={isProcessing}
                className="flex flex-col items-center gap-2 p-3 border-2 border-[#5d3a1a]/20 text-[#5d3a1a] rounded-xl hover:border-[#5d3a1a]"
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
                <span className="text-[10px] font-bold uppercase">
                  Kết nối Ví
                </span>
              </button>
            </div>
          </div>

          {isScanning && (
            <div className="mt-4 relative bg-[#1a1007] rounded-lg border-2 border-[#5d3a1a] overflow-hidden">
              <button
                onClick={() => setIsScanning(false)}
                className="absolute top-2 right-2 z-50 bg-red-500 text-white p-1 rounded-full"
              >
                X
              </button>
              <div id="reader" className="w-full"></div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-[#5d3a1a]/10">
            <p className="text-[10px] text-[#5d3a1a]/50 uppercase font-black">
              Bảo mật • Minh bạch • Vĩnh viễn
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
