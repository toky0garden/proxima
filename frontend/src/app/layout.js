import "./globals.css";
import { AppProvider } from "./AppContext";
import Header from "./components/Header";
import ToastContainer from "./components/ToastContainer";

export const metadata = {
  title: "Gaming Marketplace",
  description: "Премиальный игровой маркетплейс аккаунтов и ключей",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
      </head>
      <body className="bg-brand-dark text-brand-text min-h-screen font-sans antialiased overflow-x-hidden selection:bg-brand-red selection:text-white flex flex-col relative">
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
