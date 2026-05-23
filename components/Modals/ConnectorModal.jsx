"use client";
import React, { useState, useEffect, useCallback } from "react";
import sweetalert2 from "@/configs/swal";
import { useDispatch } from "react-redux";
import { setWalletAddress } from "@/redux/genealogySlide";
import Modal from "./Modal";

import { createWalletClient, custom } from "viem";
import { lukso } from "viem/chains";

// ─────────────────────────────────────────────────────────────────────────────
// KIẾN TRÚC PROVIDER CỦA LUKSO
// ─────────────────────────────────────────────────────────────────────────────
//
//  ┌──────────────────────────┬──────────────────────────────────────────────┐
//  │  Môi trường              │  Provider inject vào đâu                     │
//  ├──────────────────────────┼──────────────────────────────────────────────┤
//  │  PC – Chrome Extension   │  window.lukso                                │
//  │  Mobile app (WebView)    │  window.lukso  (app tự inject như Extension) │
//  │  The Grid (mini-app)     │  up-provider  (parent page inject qua msg)   │
//  │  Mobile – không có app   │  undefined → hướng dẫn tải app              │
//  └──────────────────────────┴──────────────────────────────────────────────┘
//
//  • up-provider (createClientUPProvider) cho phép dApp nhúng trong The Grid
//    nhận provider + accounts từ parent page qua postMessage, KHÔNG cần
//    gọi eth_requestAccounts — lắng nghe accountsChanged thay vào đó.
//  • Khi mobile app LUKSO mở dApp qua WebView, nó inject window.lukso
//    y hệt Extension trên PC → dùng chung 1 luồng kết nối.
// ─────────────────────────────────────────────────────────────────────────────

const LUKSO_MAINNET_ID = 42;

// ── Phát hiện môi trường ─────────────────────────────────────────────────────

/** Thiết bị mobile theo userAgent */
const detectMobile = () =>
  typeof navigator !== "undefined" &&
  /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent
  );

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
 * Phát hiện dApp đang chạy bên trong The Grid (iframe của universaleverything.io).
 * Dấu hiệu: đang trong iframe VÀ không có window.lukso inject.
 */
const detectGridContext = () => {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top && !window.lukso;
  } catch {
    // Cross-origin block → chắc chắn trong iframe
    return true;
  }
};

// ── Kiểm tra chain ────────────────────────────────────────────────────────────

const validateChain = async (provider) => {
  const chainIdHex = await provider.request({ method: "eth_chainId" });
  const chainId = parseInt(chainIdHex, 16);
  if (chainId !== LUKSO_MAINNET_ID) {
    await sweetalert2.popupAlert({
      title: "Mạng không đúng",
      text: `Vui lòng chuyển sang LUKSO Mainnet (ID: 42). Hiện tại đang dùng chain ID: ${chainId}.`,
    });
    return false;
  }
  return true;
};

// ── Xử lý lỗi chung ──────────────────────────────────────────────────────────

const resolveErrorMessage = (error, isMobile) => {
  if (error.message === "NO_PROVIDER") {
    return isMobile
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

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export const ConnectorModal = ({ isShow, onHide }) => {
  const dispatch = useDispatch();

  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Thông tin môi trường — tính một lần sau khi mount (client-side only)
  const [envInfo, setEnvInfo] = useState({
    isMobile: false,
    isGridContext: false,
    hasInjected: false,
  });

  useEffect(() => {
    setMounted(true);
    setEnvInfo({
      isMobile: detectMobile(),
      isGridContext: detectGridContext(),
      hasInjected: !!detectInjectedProvider(),
    });
  }, []);

  // ── LUỒNG A: Kết nối qua injected provider (Extension PC / WebView Mobile) ─

  const connectViaInjected = useCallback(async () => {
    setIsProcessing(true);
    try {
      const provider = detectInjectedProvider();
      if (!provider) throw new Error("NO_PROVIDER");

      // Khởi tạo viem walletClient để dùng cho ký giao dịch sau này
      createWalletClient({ chain: lukso, transport: custom(provider) });

      // Extension (PC) và WebView (Mobile) đều hỗ trợ eth_requestAccounts
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });

      if (!accounts?.length) throw new Error("EMPTY_ACCOUNTS");

      const ok = await validateChain(provider);
      if (!ok) return;

      dispatch(setWalletAddress(accounts[0]));
      onHide();
    } catch (error) {
      console.error("[Injected Provider] Lỗi kết nối:", error);
      sweetalert2.popupAlert({
        title: "Lỗi kết nối",
        text: resolveErrorMessage(error, envInfo.isMobile),
      });
    } finally {
      setIsProcessing(false);
    }
  }, [dispatch, onHide, envInfo.isMobile]);

  // ── LUỒNG B: Kết nối trong The Grid qua up-provider ──────────────────────
  //
  //  up-provider KHÔNG dùng eth_requestAccounts.
  //  Parent page (The Grid) inject accounts qua postMessage.
  //  Ta dùng eth_accounts để lấy ngay nếu đã có, hoặc chờ accountsChanged.

  const connectViaUPProvider = useCallback(async () => {
    setIsProcessing(true);
    try {
      // Lazy import — tránh lỗi SSR, giảm bundle size trên môi trường thường
      const { createClientUPProvider } = await import("@lukso/up-provider");
      const upProvider = createClientUPProvider();

      // Khởi tạo viem client
      createWalletClient({ chain: lukso, transport: custom(upProvider) });

      // Thử lấy accounts đã được parent inject sẵn
      let accounts = await upProvider.request({ method: "eth_accounts" });

      if (!accounts?.length) {
        // Chưa có → đăng ký listener, chờ user kết nối trong The Grid
        accounts = await new Promise((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("TIMEOUT")),
            60_000 // chờ tối đa 60 giây
          );

          upProvider.on("accountsChanged", (newAccounts) => {
            clearTimeout(timeout);
            if (newAccounts?.length) resolve(newAccounts);
            else reject(new Error("EMPTY_ACCOUNTS"));
          });
        });
      }

      const ok = await validateChain(upProvider);
      if (!ok) return;

      dispatch(setWalletAddress(accounts[0]));
      onHide();
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
  }, [dispatch, onHide]);

  // ── Dispatcher thông minh ─────────────────────────────────────────────────
  //
  //  Thứ tự ưu tiên:
  //   1. The Grid context   → up-provider   (parent đã inject sẵn)
  //   2. Injected provider  → window.lukso  (Extension PC / WebView mobile)
  //   3. Không tìm thấy    → thông báo hướng dẫn theo thiết bị

  const handleConnect = () => {
    if (envInfo.isGridContext) {
      connectViaUPProvider();
    } else if (envInfo.hasInjected) {
      connectViaInjected();
    } else {
      sweetalert2.popupAlert({
        title: envInfo.isMobile ? "Cần mở bằng ứng dụng" : "Cần cài Extension",
        text: envInfo.isMobile
          ? "Vui lòng mở trang này bên trong ứng dụng Universal Profiles (iOS/Android)."
          : "Vui lòng cài Universal Profile Extension cho Chrome, sau đó tải lại trang.",
      });
    }
  };

  if (!isShow || !mounted) return null;

  // ── Badge trạng thái môi trường ───────────────────────────────────────────

  const statusBadge = envInfo.isGridContext
    ? { color: "bg-purple-500", label: "The Grid — up-provider" }
    : envInfo.hasInjected
    ? {
        color: "bg-green-600",
        label: envInfo.isMobile
          ? "Mobile App — WebView"
          : "Extension — Desktop",
      }
    : {
        color: "bg-amber-500",
        label: envInfo.isMobile
          ? "Cần mở trong Universal Profiles App"
          : "Cần cài Extension",
      };

  const buttonLabel = isProcessing
    ? "ĐANG KẾT NỐI..."
    : envInfo.isGridContext
    ? "KẾT NỐI QUA THE GRID"
    : envInfo.hasInjected
    ? "KẾT NỐI NGAY"
    : envInfo.isMobile
    ? "HƯỚNG DẪN KẾT NỐI"
    : "CÀI EXTENSION";

  const description = envInfo.isGridContext
    ? "Đang chạy trong The Grid. Kết nối qua up-provider của Universal Profile."
    : envInfo.hasInjected
    ? envInfo.isMobile
      ? "Kết nối qua Universal Profiles App đang chạy trên thiết bị của bạn."
      : "Kết nối qua Universal Profile Extension trên trình duyệt."
    : envInfo.isMobile
    ? "Mở trang này bằng ứng dụng Universal Profiles (iOS/Android) để kết nối."
    : "Cài Universal Profile Extension cho Chrome, sau đó tải lại trang.";

  return (
    <Modal onClose={onHide}>
      <div className="p-8 bg-[#f2e2ba] rounded-xl text-center shadow-xl max-w-sm w-full">

        {/* Icon ví */}
        <div className="mb-4 flex justify-center">
          <div className="p-3 bg-[#5d3a1a] rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="#f2e2ba"
              viewBox="0 0 256 256"
            >
              <path d="M216,72H56a8,8,0,0,1,0-16H192a8,8,0,0,0,0-16H56A24,24,0,0,0,32,64V192a24,24,0,0,0,24,24H216a16,16,0,0,0,16-16V88A16,16,0,0,0,216,72Zm0,128H56a8,8,0,0,1-8-8V85.38A23.83,23.83,0,0,0,56,88H216v40H184a24,24,0,0,0,0,48h32v24Zm0-48H184a8,8,0,0,1,0-16h32Z" />
            </svg>
          </div>
        </div>

        {/* Tiêu đề */}
        <h3 className="text-[#3d2611] text-xl font-black mb-2 uppercase">
          Kết nối Quản trị
        </h3>

        {/* Mô tả động */}
        <p className="text-[#5d3a1a] mb-3 text-sm opacity-80 leading-relaxed">
          {description}
        </p>

        {/* Badge môi trường */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5d3a1a]/10 text-[#5d3a1a] text-xs font-semibold">
            <span className={`w-2 h-2 rounded-full ${statusBadge.color}`} />
            {statusBadge.label}
          </span>
        </div>

        {/* Nút kết nối chính */}
        <button
          onClick={handleConnect}
          disabled={isProcessing}
          className="w-full flex items-center justify-center h-[56px] bg-[#5d3a1a] hover:bg-[#3d2611] text-[#f2e2ba] rounded-xl font-bold transition-all active:scale-95 disabled:opacity-70 text-sm tracking-wide uppercase"
        >
          {isProcessing && (
            <svg
              className="animate-spin mr-2 w-4 h-4 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          {buttonLabel}
        </button>

        {/* Link cài Extension trên PC nếu chưa có */}
        {!envInfo.isMobile && !envInfo.hasInjected && !envInfo.isGridContext && (
          <a
            href="https://chrome.google.com/webstore/detail/universal-profiles/abpickdkkbnbcoepogfhkhennhfhehfn"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block text-xs text-[#5d3a1a] underline opacity-60 hover:opacity-100 transition-opacity"
          >
            Tải Universal Profile Extension →
          </a>
        )}

        {/* Hướng dẫn tải app trên mobile nếu không có provider */}
        {envInfo.isMobile && !envInfo.hasInjected && !envInfo.isGridContext && (
          <p className="mt-4 text-xs text-[#5d3a1a] opacity-60 leading-relaxed">
            Tải ứng dụng <strong>Universal Profiles</strong> trên{" "}
            <a
              href="https://apps.apple.com/app/universal-profiles/id1603926842"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              App Store
            </a>{" "}
            hoặc{" "}
            <a
              href="https://play.google.com/store/apps/details?id=io.universalprofile.mobile"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Google Play
            </a>
            , rồi mở trang này bên trong ứng dụng.
          </p>
        )}
      </div>
    </Modal>
  );
};
