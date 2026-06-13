import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import ReduxProvider from "@/components/ReduxProvider";
import "../globals.css";
import { GenealogyProvider } from "@/context/GenealogyContext";

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

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ReduxProvider>
            <GenealogyProvider>{children}</GenealogyProvider>
          </ReduxProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
