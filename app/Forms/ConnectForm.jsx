"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { setWalletAddress } from "@/redux/genealogySlide";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";

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
    const currentUrl = window.location.href;
    const appSchemeUrl = `up://view?url=${encodeURIComponent(currentUrl)}`;
    window.location.href = appSchemeUrl;
    setTimeout(() => {
      if (document.visibilityState === "visible") {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        window.location.href = isIOS
          ? "https://apps.apple.com/us/app/universal-profiles/id6702018631"
          : "https://play.google.com/store/apps/details?id=io.universaleverything.universalprofiles";
      }
    }, 2500);
  };

  const connectViaInjected = useCallback(async () => {
    setIsProcessing(true);
    try {
      const provider = detectInjectedProvider();
      if (!provider) throw new Error("NO_PROVIDER");
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      dispatch(setWalletAddress(accounts[0]));
    } catch (error) {
      Swal.fire({ title: "Lỗi", text: "Không thể kết nối. Hãy thử lại trong ứng dụng.", icon: "error" });
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
      Swal.fire({ title: "Lỗi", text: "Lỗi kết nối trong môi trường Grid.", icon: "error" });
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
    <div className="min-h-screen flex flex-col md:flex-row font-serif overflow-hidden">

      {/* ── LEFT HERO PANEL ── */}
      <div className="hidden md:flex md:w-[45%] relative flex-col justify-between bg-[#1e0f05] overflow-hidden px-12 py-10">

        {/* Background geometric pattern */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <pattern id="heroPattern" x="0" y="0" width="56" height="56" patternUnits="userSpaceOnUse">
              <path d="M28 4 L52 28 L28 52 L4 28 Z" fill="none" stroke="#c4922a" strokeWidth="0.5" opacity="0.15"/>
              <circle cx="28" cy="28" r="2.5" fill="#c4922a" opacity="0.12"/>
              <circle cx="0" cy="0" r="1.5" fill="#c4922a" opacity="0.08"/>
              <circle cx="56" cy="0" r="1.5" fill="#c4922a" opacity="0.08"/>
              <circle cx="0" cy="56" r="1.5" fill="#c4922a" opacity="0.08"/>
              <circle cx="56" cy="56" r="1.5" fill="#c4922a" opacity="0.08"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#heroPattern)"/>
        </svg>

        {/* Vertical gold accent stripe */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#c4922a] to-transparent opacity-60" />

        {/* TOP: Logo */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-9 h-9 rounded-full border-2 border-[#c4922a] flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4922a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <span className="text-[#c4922a] font-bold uppercase tracking-[0.28em] text-[13px]">
              Gia Phả Việt
            </span>
          </div>

          <h1 className="text-[2.8rem] font-black text-[#f2e2ba] leading-[1.18] mb-6 tracking-tight">
            Lưu giữ<br />
            huyết mạch<br />
            <span className="text-[#c4922a]">dòng tộc.</span>
          </h1>

          <p className="text-[#8b6045] text-[15px] leading-relaxed max-w-xs">
            Nền tảng gia phả blockchain đầu tiên tại Việt Nam — ghi chép, lưu truyền và bảo tồn lịch sử dòng họ vĩnh viễn.
          </p>
        </div>

        {/* BOTTOM: Tagline + LUKSO badge */}
        <div className="relative">
          <div className="border-l-2 border-[#c4922a]/40 pl-5 mb-8">
            <p className="text-[#f2e2ba]/40 italic text-base leading-relaxed">
              "Cây có cội,<br />nước có nguồn."
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded-full bg-[#FE005B]" />
            <span className="text-[#5a3a20] text-[11px] uppercase tracking-[0.22em] font-bold">
              Powered by LUKSO Mainnet
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex-1 flex flex-col justify-center items-center bg-[#fdf8e9] px-6 py-12 relative overflow-y-auto">

        {/* Subtle top edge line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#c4922a]/40 to-transparent md:hidden" />

        {/* Mobile-only branding */}
        <div className="md:hidden mb-10 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full border-2 border-[#3d2611] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3d2611" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <span className="text-[#3d2611] font-bold uppercase tracking-[0.28em] text-lg">Gia Phả Việt</span>
          <p className="text-[#8b5a2b] text-xs italic mt-1">Cây có cội, nước có nguồn</p>
        </div>

        <div className="w-full max-w-[340px]">

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-[1.6rem] font-black text-[#3d2611] uppercase tracking-[0.15em] mb-2">
              Truy cập gia phả
            </h2>
            <p className="text-[#8b5a2b] text-sm leading-relaxed">
              Nhập mã định danh, quét mã QR hoặc kết nối ví Universal Profile.
            </p>
          </div>

          <div className="space-y-5">

            {/* Address input */}
            <div>
              <label className="block text-[11px] font-bold text-[#5d3a1a] uppercase tracking-[0.18em] mb-2">
                Địa chỉ gia tộc
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={inputClanId}
                  onChange={(e) => setInputClanId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAccessById()}
                  placeholder="0x..."
                  className="flex-1 px-4 py-3 bg-white border-2 border-[#8b5a2b]/30 border-r-0 focus:border-[#3d2611] outline-none text-[#3d2611] text-sm font-mono tracking-tight transition-all placeholder:text-[#8b5a2b]/35"
                />
                <button
                  onClick={handleAccessById}
                  className="px-5 py-3 bg-[#3d2611] text-[#f2e2ba] text-[11px] font-black uppercase tracking-[0.18em] hover:bg-[#5d3a1a] active:scale-95 transition-all border-2 border-[#3d2611]"
                >
                  Vào
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="h-px bg-[#5d3a1a]/15 flex-1" />
              <span className="text-[10px] font-black text-[#8b5a2b]/40 uppercase tracking-widest">Hoặc</span>
              <div className="h-px bg-[#5d3a1a]/15 flex-1" />
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">

              {/* QR Scan */}
              <button
                onClick={handleScanButtonClick}
                disabled={!isMobile}
                className={`flex flex-col items-center gap-2.5 px-4 py-4 border-2 font-bold text-[11px] uppercase tracking-wider transition-all ${
                  isMobile
                    ? "border-[#5d3a1a]/30 text-[#5d3a1a] hover:border-[#5d3a1a] hover:bg-[#5d3a1a]/5 active:scale-95"
                    : "border-[#5d3a1a]/10 text-[#5d3a1a]/25 cursor-not-allowed"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M224,144v48a16,16,0,0,1-16,16H160a8,8,0,0,1,0-16h48V144a8,8,0,0,1,16,0ZM96,208H48V160a8,8,0,0,0-16,0v48a16,16,0,0,0,16,16H96a8,8,0,0,0,0-16ZM208,32H160a8,8,0,0,0,0,16h48V96a8,8,0,0,0,16,0V48A16,16,0,0,0,208,32ZM48,96a8,8,0,0,0,16,0V48H96a8,8,0,0,0,0-16H48A16,16,0,0,0,32,48V96Z"/>
                </svg>
                <span>Quét QR</span>
              </button>

              {/* Wallet connect */}
              <button
                onClick={connectWalletHandler}
                disabled={isProcessing}
                className="flex flex-col items-center gap-2.5 px-4 py-4 bg-[#3d2611] text-[#f2e2ba] border-2 border-[#3d2611] font-bold text-[11px] uppercase tracking-wider hover:bg-[#5d3a1a] hover:border-[#5d3a1a] active:scale-95 transition-all disabled:opacity-60"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-[22px] w-[22px] border-2 border-[#f2e2ba]/30 border-t-[#f2e2ba]" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M216,72H56a8,8,0,0,1,0-16H192a8,8,0,0,0,0-16H56A24,24,0,0,0,32,64V192a24,24,0,0,0,24,24H216a16,16,0,0,0,16-16V88A16,16,0,0,0,216,72Zm0,128H56a8,8,0,0,1-8-8V85.38A23.83,23.83,0,0,0,56,88H216v40H184a24,24,0,0,0,0,48h32v24Zm0-48H184a8,8,0,0,1,0-16h32Z"/>
                  </svg>
                )}
                <span>Kết nối ví</span>
              </button>
            </div>
          </div>

          {/* QR Scanner */}
          {isScanning && (
            <div className="mt-5 relative bg-[#1a1007] border-2 border-[#5d3a1a] overflow-hidden">
              <button
                onClick={() => setIsScanning(false)}
                className="absolute top-2 right-2 z-50 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors"
              >
                ✕
              </button>
              <div id="reader" className="w-full" />
            </div>
          )}

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-[#8b5a2b]/15 flex items-center justify-center gap-5">
            {["Bảo mật", "Minh bạch", "Vĩnh viễn"].map((label, i) => (
              <React.Fragment key={label}>
                {i > 0 && <span className="w-1 h-1 rounded-full bg-[#8b5a2b]/20" />}
                <span className="text-[10px] text-[#8b5a2b]/40 uppercase font-black tracking-wider">{label}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
