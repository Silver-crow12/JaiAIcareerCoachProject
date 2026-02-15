import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
export const metadata: Metadata = {
  title: "Sensai - AI Career Coach",
  description: "Sensai is an AI-powered career coach designed to help you navigate your professional journey with personalized advice, resume building, interview preparation, and continuous learning resources. Whether you're just starting out or looking to advance your career, Sensai is here to support you every step of the way.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={
     { baseTheme:dark
    }}>
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased`}
        >
        
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
            >
            {/* header */}
            <Header />
            <main className="min-h-screen">{children}</main>
            <Toaster richColors/>
            <footer className="bg-muted/50 py-12  ">
              <div className="container mx-auto px-4 text-center text-gray-200">
                <p>Made with ❤️ by Jai</p>
              </div>
            </footer>
          </ThemeProvider>
      </body>
    </html>
    </ClerkProvider>
  );
}
