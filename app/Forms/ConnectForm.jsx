"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { setWalletAddress } from "@/redux/genealogySlide";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { DragonWatermark } from "@/components/ui/imperial";

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
    <div className="min-h-screen w-full flex flex-col md:flex-row font-serif overflow-hidden">

      {/* ── LEFT HERO PANEL ── */}
      <div className="hidden md:flex md:w-1/3 relative flex-col justify-between bg-[#1A0505] overflow-hidden px-12 py-10">

        {/* Dragon scale background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
          <defs>
            <pattern id="heroScale" width="24" height="16" patternUnits="userSpaceOnUse">
              <path d="M0,16 C4,6 20,6 24,16" fill="none" stroke="#C8960C" strokeWidth="0.9" opacity="0.18"/>
              <path d="M-12,8 C-8,-2 8,-2 12,8" fill="none" stroke="#C8960C" strokeWidth="0.9" opacity="0.18"/>
              <path d="M12,8 C16,-2 32,-2 36,8" fill="none" stroke="#C8960C" strokeWidth="0.9" opacity="0.18"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#heroScale)"/>
        </svg>
        <DragonWatermark opacity={0.045} />

        {/* Vertical gold accent stripe */}
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#C8960C] to-transparent opacity-60" />

        {/* TOP: Logo */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-9 h-9 border-2 border-[#C8960C] flex items-center justify-center flex-shrink-0 relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8960C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span className="classical-decor absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-[#D4AF37]" />
              <span className="classical-decor absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-[#D4AF37]" />
              <span className="classical-decor absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-[#D4AF37]" />
              <span className="classical-decor absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-[#D4AF37]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[#C8960C] font-bold uppercase tracking-[0.28em] text-[13px]">
                Gia Phả Việt
              </span>
              <span className="text-[#C8960C]/50 text-[10px] tracking-[0.15em]">皇族譜系</span>
            </div>
          </div>

          <h1 className="text-[2.8rem] font-black text-[#F5EDD0] leading-[1.18] mb-6 tracking-tight">
            Lưu giữ<br />
            huyết mạch<br />
            <span className="text-[#C8960C]">dòng tộc.</span>
          </h1>

          <p className="text-[#C8960C]/50 text-[15px] leading-relaxed max-w-xs">
            Nền tảng gia phả blockchain đầu tiên tại Việt Nam — ghi chép, lưu truyền và bảo tồn lịch sử dòng họ vĩnh viễn.
          </p>
        </div>

        {/* BOTTOM: Tagline + LUKSO badge */}
        <div className="relative">
          <div className="border-l-2 border-[#C8960C]/40 pl-5 mb-8">
            <p className="text-[#F5EDD0]/40 italic text-base leading-relaxed">
              "Cây có cội,<br />nước có nguồn."
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded-full bg-[#FE005B]" />
            <span className="text-[#C8960C]/40 text-[11px] uppercase tracking-[0.22em] font-bold">
              Powered by LUKSO Mainnet
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex-1 flex flex-col justify-center bg-[#F5EDD0] px-6 py-12 relative overflow-y-auto">

        {/* Coin pattern SVG background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
          <defs>
            <pattern id="rightCoin" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
              <circle cx="25" cy="25" r="20" fill="none" stroke="#C8960C" strokeWidth="0.7" opacity="0.1"/>
              <rect x="19" y="19" width="12" height="12" fill="none" stroke="#C8960C" strokeWidth="0.7" opacity="0.1"/>
              <circle cx="25" cy="25" r="4" fill="none" stroke="#C8960C" strokeWidth="0.7" opacity="0.1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#rightCoin)"/>
        </svg>

        {/* Subtle top edge line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#C8960C]/40 to-transparent md:hidden" />

        {/* Mobile-only branding */}
        <div className="md:hidden mb-10 text-center relative z-10">
          <div className="w-12 h-12 mx-auto mb-3 border-2 border-[#8B1A1A] flex items-center justify-center relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#C8960C]" />
            <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#C8960C]" />
            <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#C8960C]" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#C8960C]" />
          </div>
          <span className="text-[#8B1A1A] font-bold uppercase tracking-[0.28em] text-lg">Gia Phả Việt</span>
          <p className="text-[#8B1A1A]/50 text-xs italic mt-1">Cây có cội, nước có nguồn</p>
        </div>

        <div className="w-full md:w-1/2 relative z-10">

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-[1.6rem] font-black text-[#8B1A1A] uppercase tracking-[0.15em] mb-2 flex items-center gap-2 whitespace-nowrap">
              <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5,0 L10,5 L5,10 L0,5 Z" fill="#C8960C" opacity="0.6"/></svg>
              Truy cập gia phả
              <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5,0 L10,5 L5,10 L0,5 Z" fill="#C8960C" opacity="0.6"/></svg>
            </h2>
            <p className="text-[#8B1A1A]/60 text-sm leading-relaxed">
              Nhập mã định danh, quét mã QR hoặc kết nối ví Universal Profile.
            </p>
          </div>

          <div className="space-y-5">

            {/* Address input */}
            <div>
              <label className="block text-[11px] font-bold text-[#8B1A1A] uppercase tracking-[0.18em] mb-2">
                Địa chỉ gia tộc
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={inputClanId}
                  onChange={(e) => setInputClanId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAccessById()}
                  placeholder="0x..."
                  className="flex-1 px-4 py-3 bg-white border-2 border-[#8B1A1A]/25 border-r-0 focus:border-[#8B1A1A] outline-none text-[#8B1A1A] text-sm font-mono tracking-tight transition-all placeholder:text-[#8B1A1A]/30"
                />
                <button
                  onClick={handleAccessById}
                  className="px-5 py-3 bg-[#8B1A1A] text-[#C8960C] text-[11px] font-black uppercase tracking-[0.18em] hover:bg-[#6B0000] active:scale-95 transition-all border-2 border-[#8B1A1A] relative overflow-hidden"
                >
                  <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#D4AF37]" />
                  <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#D4AF37]" />
                  <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#D4AF37]" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#D4AF37]" />
                  Vào
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="h-px bg-[#8B1A1A]/15 flex-1" />
              <div className="flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5,0 L10,5 L5,10 L0,5 Z" fill="#C8960C" opacity="0.6"/></svg>
                <span className="text-[10px] font-black text-[#8B1A1A]/40 uppercase tracking-widest">Hoặc</span>
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5,0 L10,5 L5,10 L0,5 Z" fill="#C8960C" opacity="0.6"/></svg>
              </div>
              <div className="h-px bg-[#8B1A1A]/15 flex-1" />
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">

              {/* QR Scan */}
              <button
                onClick={handleScanButtonClick}
                disabled={!isMobile}
                className={`flex flex-col items-center gap-2.5 px-4 py-4 border-2 font-bold text-[11px] uppercase tracking-wider transition-all relative overflow-hidden ${
                  isMobile
                    ? "border-[#8B1A1A]/40 text-[#8B1A1A] hover:border-[#8B1A1A] hover:bg-[#8B1A1A]/5 active:scale-95"
                    : "border-[#8B1A1A]/15 text-[#8B1A1A]/25 cursor-not-allowed"
                }`}
              >
                {isMobile && (
                  <>
                    <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#C8960C]" />
                    <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#C8960C]" />
                    <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#C8960C]" />
                    <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#C8960C]" />
                  </>
                )}
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M224,144v48a16,16,0,0,1-16,16H160a8,8,0,0,1,0-16h48V144a8,8,0,0,1,16,0ZM96,208H48V160a8,8,0,0,0-16,0v48a16,16,0,0,0,16,16H96a8,8,0,0,0,0-16ZM208,32H160a8,8,0,0,0,0,16h48V96a8,8,0,0,0,16,0V48A16,16,0,0,0,208,32ZM48,96a8,8,0,0,0,16,0V48H96a8,8,0,0,0,0-16H48A16,16,0,0,0,32,48V96Z"/>
                </svg>
                <span>Quét QR</span>
              </button>

              {/* Wallet connect */}
              <button
                onClick={connectWalletHandler}
                disabled={isProcessing}
                className="flex flex-col items-center gap-2.5 px-4 py-4 bg-[#8B1A1A] text-[#C8960C] border-2 border-[#8B1A1A] font-bold text-[11px] uppercase tracking-wider hover:bg-[#6B0000] hover:border-[#6B0000] active:scale-95 transition-all disabled:opacity-60 relative overflow-hidden"
              >
                <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#D4AF37]" />
                <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#D4AF37]" />
                <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#D4AF37]" />
                <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#D4AF37]" />
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-[22px] w-[22px] border-2 border-[#C8960C]/30 border-t-[#C8960C]" />
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
            <div className="mt-5 relative bg-[#1A0505] border-2 border-[#8B1A1A] overflow-hidden">
              <button
                onClick={() => setIsScanning(false)}
                className="absolute top-2 right-2 z-50 w-7 h-7 bg-[#8B1A1A] text-[#C8960C] flex items-center justify-center text-xs font-bold hover:bg-[#6B0000] transition-colors"
              >
                ✕
              </button>
              <div id="reader" className="w-full" />
            </div>
          )}

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-[#8B1A1A]/15 flex items-center justify-center gap-5">
            {["Bảo mật", "Minh bạch", "Vĩnh viễn"].map((label, i) => (
              <React.Fragment key={label}>
                {i > 0 && (
                  <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5,0 L10,5 L5,10 L0,5 Z" fill="#C8960C" opacity="0.4"/></svg>
                )}
                <span className="text-[10px] text-[#8B1A1A]/40 uppercase font-black tracking-wider">{label}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
