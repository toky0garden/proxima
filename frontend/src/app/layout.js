import "./globals.css";
import { Inter } from "next/font/google";
import { AppProvider } from "./AppContext";
import Header from "./components/Header";
import ToastContainer from "./components/ToastContainer";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata = {
  title: "Gaming Marketplace",
  description: "Премиальный игровой маркетплейс аккаунтов и ключей",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
      </head>
      <body className={`${inter.className} bg-brand-dark text-brand-text min-h-screen font-sans antialiased overflow-x-hidden selection:bg-brand-red selection:text-white flex flex-col relative`}>
        <AppProvider>
          <Header />
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <ToastContainer />
        </AppProvider>
      </body>
    </html>
  );
}
