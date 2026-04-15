"use client";

import { hasRole } from "@/lib/auth";
import { getRoleLabel } from "@/lib/roles";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type TrackableUser = Pick<User, "id" | "username" | "full_name" | "avatar_url">;

export default function UserDropdown({
  user,
  users,
}: {
  user: User;
  users: TrackableUser[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const canTrackMembers = hasRole(user, ["owner", "admin"]);

  const toggle = () => setIsOpen((prev) => !prev);
  const closeMembersModal = () => setIsMembersModalOpen(false);
  const navigateTo = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

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

  useEffect(() => {
    if (!isMembersModalOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeMembersModal();
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMembersModalOpen]);

  return (
    <>
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

            <nav className="flex flex-col text-sm text-gray-700 *:px-3 *:py-2 *:hover:bg-gray-50">
              {hasRole(user, ["owner", "admin", "member"]) && (
                <>
                  <button
                    type="button"
                    onClick={() => navigateTo("/tasks")}
                    className="cursor-pointer text-right"
                  >
                    متابعة مهامي
                  </button>
                  {canTrackMembers && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        setIsMembersModalOpen(true);
                      }}
                      className="cursor-pointer text-right"
                    >
                      متابعة الأعضاء
                    </button>
                  )}
                  {user.friend_id && (
                    <button
                      type="button"
                      onClick={() => navigateTo(`/tasks/${user.friend_id}`)}
                      className="cursor-pointer text-right"
                    >
                      متابعة الصديق
                    </button>
                  )}
                  {hasRole(user, ["owner"]) && (
                    <>
                      <button
                        type="button"
                        onClick={() => navigateTo("/panel")}
                        className="cursor-pointer text-right"
                      >
                        إدارة المهام والمستخدمين
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateTo("/stats")}
                        className="cursor-pointer text-right"
                      >
                        إحصائيات المستخدمين
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateTo("/panel/weeks")}
                        className="cursor-pointer text-right"
                      >
                        إدارة الأسابيع
                      </button>
                    </>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={() => navigateTo("/logout")}
                className="cursor-pointer border-t border-gray-200 text-right text-red-600 transition-colors hover:bg-red-50!"
              >
                تسجيل الخروج
              </button>
            </nav>
          </div>
        )}
      </div>

      {canTrackMembers && isMembersModalOpen && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/35 p-4"
          onClick={closeMembersModal}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white shadow-2xl"
            dir="rtl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h2 className="text-base font-semibold text-gray-900">
                متابعة الأعضاء
              </h2>
              <button
                type="button"
                onClick={closeMembersModal}
                className="cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-2">
              {users.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-gray-500">
                  لا يوجد أعضاء للعرض.
                </p>
              ) : (
                <ul className="space-y-1">
                  {users.map((trackedUser) => (
                    <li key={trackedUser.id}>
                      <button
                        type="button"
                        onClick={() => {
                          closeMembersModal();
                          router.push(`/tasks/${trackedUser.id}`);
                        }}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-right transition-colors hover:bg-gray-100"
                      >
                        {trackedUser.avatar_url ? (
                          <Image
                            src={trackedUser.avatar_url}
                            alt={trackedUser.username}
                            className="size-8 rounded-full"
                            width={32}
                            height={32}
                          />
                        ) : (
                          <div className="flex size-8 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700">
                            {trackedUser.username.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {trackedUser.full_name ?? trackedUser.username}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            @{trackedUser.username}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
