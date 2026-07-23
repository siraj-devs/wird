"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui/Button";

function displayName(user?: User) {
  return user?.name ?? user?.full_name ?? user?.username ?? "عضو";
}

function initial(name: string) {
  return name.trim().charAt(0) || "؟";
}

export default function ManageProgramFriends({
  boards,
}: {
  boards: ProgramFriendsBoard[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const refresh = () => router.refresh();

  const sendRequest = async (programId: string, friendId: string) => {
    setError("");
    setBusyId(`${programId}:${friendId}`);
    try {
      const response = await fetch(`/api/programs/${programId}/friends`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friend_id: friendId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "فشل إرسال الطلب");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setBusyId(null);
    }
  };

  const respond = async (
    programId: string,
    friendshipId: string,
    action: "accept" | "reject",
  ) => {
    setError("");
    setBusyId(friendshipId);
    try {
      const response = await fetch(`/api/programs/${programId}/friends`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendship_id: friendshipId, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "فشل الرد على الطلب");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (programId: string, friendshipId: string) => {
    setError("");
    setBusyId(friendshipId);
    try {
      const response = await fetch(
        `/api/programs/${programId}/friends?friendship_id=${friendshipId}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "فشل الإزالة");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setBusyId(null);
    }
  };

  if (boards.length === 0) {
    return (
      <div className="ds-card text-center text-sm text-gray-500">
        لست عضواً في أي برنامج بعد.
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {error && (
        <div className="ds-error">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {boards.map((board) => {
        const linkedIds = new Set([
          ...board.accepted.map((f) => f.other_user_id),
          ...board.incoming.map((f) => f.other_user_id),
          ...board.outgoing.map((f) => f.other_user_id),
        ]);
        const available = board.members.filter((m) => !linkedIds.has(m.id));
        const hasAnyContent =
          board.incoming.length > 0 ||
          board.accepted.length > 0 ||
          board.outgoing.length > 0 ||
          available.length > 0;

        return (
          <section key={board.program.id} className="ds-card space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {board.program.name}
              </h2>
            </div>

            {!hasAnyContent && (
              <p className="text-sm text-gray-500">
                لا يوجد أعضاء آخرون في هذا البرنامج حالياً.
              </p>
            )}

            {board.incoming.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-800">
                  طلبات واردة
                </h3>
                <ul className="space-y-2">
                  {board.incoming.map((req) => {
                    const name = displayName(req.other_user);
                    return (
                      <li
                        key={req.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-100 bg-primary-50/50 px-3 py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="grid size-8 place-items-center rounded-full bg-primary-100 text-sm font-bold text-primary-800">
                            {initial(name)}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {name}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            disabled={busyId === req.id}
                            onClick={() =>
                              respond(board.program.id, req.id, "accept")
                            }
                            className="text-xs!"
                          >
                            قبول
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={busyId === req.id}
                            onClick={() =>
                              respond(board.program.id, req.id, "reject")
                            }
                            className="text-xs!"
                          >
                            رفض
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {board.accepted.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-800">
                  أصدقائي في البرنامج
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {board.accepted.map((friend) => {
                    const name = displayName(friend.other_user);
                    return (
                      <li
                        key={friend.id}
                        className="flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50 py-1.5 pl-2 pr-1.5"
                      >
                        <span className="grid size-7 place-items-center rounded-full bg-primary-100 text-xs font-bold text-primary-800">
                          {initial(name)}
                        </span>
                        <span className="text-sm text-gray-800">{name}</span>
                        <button
                          type="button"
                          disabled={busyId === friend.id}
                          onClick={() => remove(board.program.id, friend.id)}
                          className="rounded-full px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                        >
                          إلغاء
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {board.outgoing.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-800">
                  طلبات مرسلة
                </h3>
                <ul className="space-y-2">
                  {board.outgoing.map((req) => {
                    const name = displayName(req.other_user);
                    return (
                      <li
                        key={req.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="grid size-8 place-items-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                            {initial(name)}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {name}
                            </p>
                            <p className="text-xs text-amber-700">
                              بانتظار القبول
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={busyId === req.id}
                          onClick={() => remove(board.program.id, req.id)}
                          className="text-xs! text-red-600"
                        >
                          إلغاء الطلب
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {available.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-800">
                  أعضاء يمكن مراسلتهم
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {available.map((member) => {
                    const name = displayName(member);
                    const key = `${board.program.id}:${member.id}`;
                    return (
                      <li
                        key={member.id}
                        className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-2 py-1.5"
                      >
                        <span className="grid size-7 place-items-center rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                          {initial(name)}
                        </span>
                        <span className="text-sm text-gray-800">{name}</span>
                        <Button
                          type="button"
                          disabled={busyId === key}
                          onClick={() =>
                            sendRequest(board.program.id, member.id)
                          }
                          className="px-2! py-1! text-xs!"
                        >
                          طلب صداقة
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
