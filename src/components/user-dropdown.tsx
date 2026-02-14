"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface UserDropdownProps {
  user: {
    username: string;
    avatar_url: string | null;
    role: string;
  };
  arabicName?: string;
  phoneNumber?: string;
}

export default function UserDropdown({
  user,
  arabicName,
  phoneNumber,
}: UserDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      guest: "ضيف",
      member: "عضو",
      admin: "مشرف",
      owner: "مالك",
    };
    return roleLabels[role] || role;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex cursor-pointer items-center gap-3 overflow-hidden rounded-full border-2 border-gray-200 transition-colors focus:outline-none"
      >
        {user.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt={user.username}
            width={32}
            height={32}
          />
        ) : (
          <div className="flex size-10 items-center justify-center bg-gray-200 text-sm font-bold text-gray-700">
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-0.5 w-64 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-200 p-4">
            <p className="truncate text-sm font-semibold text-gray-900">
              {arabicName ?? user.username}
            </p>
            <p className="truncate text-xs text-gray-500">
              {getRoleLabel(user.role)}
            </p>
          </div>

          {user.role !== "guest" && (
            <nav className="flex flex-col gap-2 border-b border-gray-200 px-3 py-2 text-sm text-gray-700">
              <Link href="/tasks">مهامي</Link>
              {user.role !== "member" && (
                <>
                  <Link href="/admin/tasks">إدارة المهام</Link>
                  <Link href="/admin/users">إدارة المستخدمين</Link>
                  <Link href="/admin/access-requests">طلبات الوصول</Link>
                </>
              )}
            </nav>
          )}

          <button
            onClick={() => {
              setIsOpen(false);
              handleLogout();
            }}
            className="w-full cursor-pointer rounded-b-lg px-4 py-3 text-right text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            تسجيل الخروج
          </button>
        </div>
      )}
    </div>
  );
}
