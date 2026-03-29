"use client";

import { hasRole } from "@/lib/auth";
import { getRoleLabel } from "@/lib/roles";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function UserDropdown({ user }: { user: User }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggle = () => setIsOpen((prev) => !prev);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      )
        setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggle}
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
          <div className="border-b border-gray-200 px-3 py-2">
            <p className="truncate text-sm font-semibold text-gray-900">
              {user.full_name ?? user.username}
            </p>
            <p className="truncate text-xs text-gray-500">
              {getRoleLabel(user.role)}
            </p>
          </div>

          <nav
            onClick={toggle}
            className="flex flex-col text-sm text-gray-700 *:px-3 *:py-2 *:hover:bg-gray-50"
          >
            {hasRole(user, ["owner", "admin", "member"]) && (
              <>
                <Link href="/tasks">مهامي</Link>
                {hasRole(user, ["owner", "admin"]) && (
                  <>
                    <Link href="/panel">إدارة المهام</Link>
                    <Link href="/panel/weeks">إدارة الأسابيع</Link>
                  </>
                )}
              </>
            )}
            <Link
              href="/logout"
              className="border-t border-gray-200 text-red-600 transition-colors hover:bg-red-50!"
            >
              تسجيل الخروج
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
