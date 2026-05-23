import ReduxProvider from "@/components/ReduxProvider";
import "./globals.css";
import { GenealogyProvider } from "@/context/GenealogyContext";

// const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Gia Phả Việt - Nơi Dòng Dõi Việt Mãi Lưu Truyền",
  description: "Hệ thống quản lý gia phả số lưu trữ trên Blockchain",
  alternates: {
    canonical: "https://giaphaviet.top",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <ReduxProvider>
          <GenealogyProvider>{children}</GenealogyProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
