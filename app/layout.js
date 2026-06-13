import { ThemeProvider } from "@/context/ThemeContext";

export default function RootLayout({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
