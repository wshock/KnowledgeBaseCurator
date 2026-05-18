"use client";
import React from "react";
import { AuthHeader } from "./AuthHeader";

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  loginLink?: string;
  showSidebar?: boolean;
  showSocialButtons?: boolean;
  headerText?: string;
  linkText?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title = "SchoolAI",
  loginLink = "/login",
  showSidebar = false,
  headerText,
  linkText,
}) => {
  return (
    <div className="min-h-screen flex flex-col">
      <AuthHeader title={title} loginLink={loginLink} headerText={headerText} linkText={linkText} />

      <main className="flex flex-1">
        {showSidebar && (
          <div className="bg-blue-950 hidden md:flex flex-col items-center justify-center gap-6 px-12 w-1/2" />
        )}

        <div
          className={`
            flex-1 flex flex-col items-center justify-center
            bg-sky-50 px-4 py-8 md:px-6
            ${showSidebar ? "md:w-1/2" : "w-full"}
            overflow-y-auto
          `}
        >
          {children}
        </div>
      </main>
    </div>
  );
};
