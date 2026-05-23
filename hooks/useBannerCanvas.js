import { useEffect, useState } from "react";

/**
 * Hook render tên dòng tộc vào ảnh banner bằng HTML Canvas.
 * Ảnh gốc banner.png: 600 × 264 px (PNG nền trong suốt)
 *
 * Toạ độ đo bằng Pillow (weighted center of red region):
 *   Bảng đỏ: X=168→431, Y=79→223
 *   Weighted center: centerX=298, centerY=156
 *   Chiều rộng bảng: 263px
 */
export function useBannerCanvas(bannerSrc, clanName) {
  const [dataUrl, setDataUrl] = useState(null);

  useEffect(() => {
    if (!bannerSrc || !clanName) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = bannerSrc;

    img.onload = () => {
      const W = img.naturalWidth; // 600
      const H = img.naturalHeight; // 264

      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");

      // Vẽ ảnh PNG — phần trong suốt để CSS background lo
      ctx.drawImage(img, 0, 0, W, H);

      // --- Toạ độ chính xác (weighted center đo bằng Pillow) ---
      const CENTER_X = 300;
      const CENTER_Y = 162;
      const BOARD_WIDTH = 260;

      // --- Tách tên thành 2 dòng tại từ cuối ---
      const words = clanName.trim().split(/\s+/);
      const lines =
        words.length >= 2
          ? [words.slice(0, -1).join(" "), words[words.length - 1]]
          : [clanName];

      // --- fontSize tự động: 52% chiều rộng bảng (~136px) ---
      const maxLineWidth = BOARD_WIDTH * 0.52;
      let fontSize = 34;
      ctx.font = `900 ${fontSize}px serif`;

      const longestLine = lines.reduce(
        (a, b) => (ctx.measureText(a).width > ctx.measureText(b).width ? a : b),
        "",
      );
      while (
        ctx.measureText(longestLine).width > maxLineWidth &&
        fontSize > 10
      ) {
        fontSize -= 1;
        ctx.font = `900 ${fontSize}px serif`;
      }

      // --- Vẽ chữ ---
      const lineHeight = fontSize * 1.25;
      const totalTextHeight = lines.length * lineHeight;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.shadowColor = "rgba(0,0,0,0.65)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = "#f5e3a0";
      ctx.font = `900 ${fontSize}px serif`;

      lines.forEach((line, i) => {
        const y =
          CENTER_Y - (totalTextHeight - lineHeight) / 2 + i * lineHeight;
        ctx.fillText(line, CENTER_X, y);
      });

      setDataUrl(canvas.toDataURL("image/png"));
    };

    img.onerror = () => {
      setDataUrl(bannerSrc);
    };
  }, [bannerSrc, clanName]);

  return dataUrl;
}
