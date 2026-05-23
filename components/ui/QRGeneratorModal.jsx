"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import QRCode from "qrcode";

const PRESETS = [
  { label: "Danh thiếp", size: 200, desc: "5×5 cm" },
  { label: "Tờ rơi", size: 400, desc: "10×10 cm" },
  { label: "Poster A4", size: 600, desc: "15×15 cm" },
  { label: "Banner", size: 1000, desc: "25×25 cm" },
];

const ERROR_LEVELS = [
  { value: "L", label: "Thấp" },
  { value: "M", label: "Vừa" },
  { value: "Q", label: "Cao" },
  { value: "H", label: "Tối đa" },
];

// Map errorLevel sang giá trị qrcode lib chấp nhận
const ECC_MAP = { L: "low", M: "medium", Q: "quartile", H: "high" };

export default function QRGeneratorModal({ clanItem, onClose }) {
  const text = `https://giaphaviet.top/pages/detail?id=${clanItem?.clanId}`;

  const [size, setSize] = useState(300);
  const [customSize, setCustomSize] = useState("300");
  const [useCustom, setUseCustom] = useState(false);
  const [activePreset, setActivePreset] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null); // data:image/png;base64,...
  const [loading, setLoading] = useState(true);
  const [printLabel, setPrintLabel] = useState(clanItem?.clanName || "");
  const [showLabel, setShowLabel] = useState(false);
  const [errorLevel, setErrorLevel] = useState("M");

  const finalSize = useCustom
    ? Math.min(Math.max(parseInt(customSize) || 100, 100), 1000)
    : size;

  // ── Tạo QR offline bằng thư viện qrcode ──
  const generateQR = useCallback(async () => {
    if (!text) return;
    setLoading(true);
    setQrDataUrl(null);
    try {
      // toDataURL trả về chuỗi base64 PNG — hoàn toàn offline, không gọi API
      const url = await QRCode.toDataURL(text, {
        width: finalSize,
        margin: 1,
        errorCorrectionLevel: ECC_MAP[errorLevel],
        color: { dark: "#000000", light: "#ffffff" },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error("Lỗi tạo QR:", err);
    } finally {
      setLoading(false);
    }
  }, [text, finalSize, errorLevel]);

  // Tạo lại QR mỗi khi size hoặc errorLevel thay đổi
  useEffect(() => {
    generateQR();
  }, [generateQR]);

  const handlePreset = (preset, idx) => {
    setSize(preset.size);
    setUseCustom(false);
    setActivePreset(idx);
  };

  const handleCustomSizeChange = (val) => {
    setCustomSize(val);
    setUseCustom(true);
    setActivePreset(null);
  };

  // ── In: nhúng data URL trực tiếp vào iframe — không cần internet ──
  const handlePrint = () => {
    if (!qrDataUrl) return;

    const labelHtml =
      showLabel && printLabel
        ? `<p style="margin:12px 0 0;font-family:serif;font-size:14px;color:#3d2611;text-align:center;letter-spacing:0.05em;">${printLabel}</p>`
        : "";

    const iframeId = "qr-print-frame";
    let iframe = document.getElementById(iframeId);
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = iframeId;
      iframe.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0;";
      document.body.appendChild(iframe);
    }

    // Nhúng thẳng data URL vào <img> — không phụ thuộc mạng khi in
    const content = `<!DOCTYPE html><html><head><title>In mã QR</title>
      <style>
        @media print { @page { margin: 0; } body { margin: 1cm; } }
        body { display:flex; flex-direction:column; align-items:center;
               justify-content:center; min-height:100vh; margin:0;
               background:white; font-family:serif; }
        .wrap { display:inline-flex; flex-direction:column; align-items:center;
                padding:28px; border:3px double #5d3a1a; }
        img { display:block; max-width:100%; image-rendering:pixelated; }
      </style></head>
      <body><div class="wrap">
        <img src="${qrDataUrl}" width="${finalSize}" height="${finalSize}" />
        ${labelHtml}
      </div></body></html>`;

    iframe.srcdoc = content;
    iframe.onload = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        // Fallback: mở tab mới
        const win = window.open("", "_blank");
        if (win) {
          win.document.write(content);
          win.document.close();
        }
      }
    };
  };

  // ── Tải về: dùng thẳng data URL — không cần tạo lại từ API ──
  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr-${clanItem?.clanId ?? "code"}-${finalSize}px.png`;
    a.click();
  };

  const isReady = !!qrDataUrl && !loading;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#fdf8e9] border-4 border-double border-[#5d3a1a] shadow-2xl w-full max-w-lg p-8 z-10 relative overflow-y-auto max-h-[90vh]"
      >
        {/* Header */}
        <h2 className="text-2xl font-serif font-bold text-[#3d2611] mb-2 text-center border-b border-[#8b5a2b]/30 pb-2 uppercase">
          In mã QR
        </h2>
        <p className="text-[#8b5a2b] text-center text-xs font-serif italic mb-6">
          In tuỳ chỉnh kích thước mã QR họ tộc để tiện truy cập
        </p>

        <div className="space-y-5 font-serif">

          {/* Kích thước */}
          <div>
            <label className="block text-xs font-bold text-[#5d3a1a] uppercase tracking-widest mb-2">
              Kích thước in
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handlePreset(p, i)}
                  className={`py-2 px-1 border text-center transition-all
                    ${activePreset === i
                      ? "border-[#3d2611] bg-[#3d2611] text-[#f2e2ba]"
                      : "border-[#8b5a2b]/40 bg-[#f4ece1] text-[#5d3a1a] hover:border-[#3d2611]"
                    }`}
                >
                  <div className="text-[11px] font-bold">{p.label}</div>
                  <div className="text-[10px] opacity-70">{p.size}px</div>
                </button>
              ))}
            </div>

            {/* Custom size */}
            <div
              onClick={() => { setUseCustom(true); setActivePreset(null); }}
              className={`flex items-center gap-2 px-3 py-2 border cursor-pointer transition-all
                ${useCustom
                  ? "border-[#3d2611] bg-[#f4ece1]"
                  : "border-dashed border-[#8b5a2b]/40 hover:border-[#3d2611]"
                }`}
            >
              <span className="text-[11px] text-[#5d3a1a] uppercase font-bold whitespace-nowrap">
                Tuỳ chỉnh:
              </span>
              <input
                type="number"
                value={customSize}
                min={100}
                max={1000}
                onChange={(e) => handleCustomSizeChange(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-transparent text-center text-sm font-bold text-[#3d2611] outline-none border-none min-w-0"
              />
              <span className="text-[10px] text-[#8b5a2b] whitespace-nowrap">
                100–1000 px
              </span>
            </div>

            <p className="text-[11px] text-[#8b5a2b] text-center mt-1.5 italic">
              Kích thước in:{" "}
              <strong className="text-[#3d2611] not-italic">
                {finalSize} × {finalSize} px
              </strong>
            </p>
          </div>

          {/* Mức sửa lỗi */}
          <div>
            <label className="block text-xs font-bold text-[#5d3a1a] uppercase tracking-widest mb-2">
              Mức độ sửa lỗi
            </label>
            <div className="flex gap-2">
              {ERROR_LEVELS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setErrorLevel(value)}
                  className={`flex-1 py-2 border text-center transition-all
                    ${errorLevel === value
                      ? "border-[#3d2611] bg-[#3d2611] text-[#f2e2ba]"
                      : "border-[#8b5a2b]/40 bg-[#f4ece1] text-[#5d3a1a] hover:border-[#3d2611]"
                    }`}
                >
                  <div className="text-[12px] font-bold">{value}</div>
                  <div className="text-[10px] opacity-75">{label}</div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#8b5a2b]/60 italic mt-1">
              Mức H: che tới 30% mã vẫn đọc được
            </p>
          </div>

          {/* Nhãn in */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#5d3a1a] uppercase tracking-widest">
              <input
                type="checkbox"
                checked={showLabel}
                onChange={(e) => setShowLabel(e.target.checked)}
                className="accent-[#5d3a1a]"
              />
              Thêm nhãn khi in
            </label>
            {showLabel && (
              <input
                type="text"
                value={printLabel}
                onChange={(e) => setPrintLabel(e.target.value)}
                placeholder="Nhãn hiển thị dưới mã QR..."
                className="mt-2 w-full px-4 py-2 bg-[#f4ece1] border border-[#8b5a2b]/40 focus:border-[#3d2611] outline-none text-[#3d2611] text-sm italic transition-all placeholder:text-[#8b5a2b]/40"
              />
            )}
          </div>

          {/* Preview */}
          <div className="border border-[#8b5a2b]/30 bg-[#f4ece1] p-4 flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-[#5d3a1a] font-bold">
              Xem trước
              {isReady && (
                <span className="ml-2 text-green-700">✔ Sẵn sàng</span>
              )}
            </span>

            <div className="relative inline-block p-2 bg-white border border-[#8b5a2b]/20 shadow">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#5d3a1a]" />
                </div>
              )}
              {qrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="QR preview"
                  width={160}
                  height={160}
                  className={`block transition-opacity duration-300 ${isReady ? "opacity-100" : "opacity-0"}`}
                />
              )}
              {/* Placeholder giữ kích thước khi chưa có QR */}
              {!qrDataUrl && !loading && (
                <div className="w-40 h-40 flex items-center justify-center text-[#8b5a2b]/30 text-4xl">
                  ▦
                </div>
              )}
            </div>

            {showLabel && printLabel && (
              <p className="text-xs italic text-[#3d2611]">{printLabel}</p>
            )}
            <p className="text-[10px] text-[#8b5a2b]/60 italic">
              Preview 160px · In với {finalSize}px
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            {/* Huỷ */}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-[#5d3a1a] hover:bg-[#8b5a2b]/10 transition-all font-bold text-sm border border-transparent uppercase tracking-wider"
            >
              Huỷ
            </button>

            {/* Tải về */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={!isReady}
              className="flex-1 py-2.5 border border-[#5d3a1a] text-[#5d3a1a] font-bold text-sm
                         hover:bg-[#8b5a2b]/10 active:scale-95 transition-all uppercase tracking-wider
                         disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Tải PNG
            </button>

            {/* In */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={!isReady}
              className="flex-1 py-2.5 bg-[#3d2611] text-[#f2e2ba] font-bold text-sm shadow-lg
                         hover:bg-[#5d3a1a] active:scale-95 transition-all border border-[#3d2611]
                         flex items-center justify-center gap-2 uppercase tracking-wider
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              In mã QR
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
