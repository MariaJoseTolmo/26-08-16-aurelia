import { useState } from 'react';
import type { UserResponse } from '@aurelia/contracts';

export function PersonnelPicker({ users, suggestedUserId, confirmed, onConfirm }: { users: UserResponse[]; suggestedUserId: string | null; confirmed: boolean; onConfirm: (selected: UserResponse[]) => void }) {
  const [selectedIds, setSelectedIds] = useState<string[]>(suggestedUserId ? [suggestedUserId] : []);
  const selectedUsers = users.filter((user) => selectedIds.includes(user.id));
  return (
    <div className="mb-[10px] ml-[33px] mr-[12px] rounded-[12px] border border-[#E3E3E3] bg-white p-[12px]">
      <div className="flex flex-wrap gap-[8px]">
        {users.map((user) => {
          const active = selectedIds.includes(user.id);
          return (
            <button key={user.id} type="button" disabled={confirmed} onClick={() => setSelectedIds((current) => current.includes(user.id) ? current.filter((id) => id !== user.id) : [...current, user.id])} className={`rounded-full border-[1.5px] px-[12px] py-[6px] text-[11px] font-semibold ${active ? 'border-[#052B63] bg-[#052B63] text-white' : 'border-[#D1D1D1] bg-white text-[#646464]'}`}>
              {user.id === suggestedUserId ? '★ ' : ''}{user.fullName}
            </button>
          );
        })}
      </div>
      <button type="button" disabled={confirmed || selectedUsers.length === 0} onClick={() => onConfirm(selectedUsers)} className="mt-[10px] h-[42px] w-full rounded-[10px] bg-[#C8A064] text-[13px] font-bold text-white disabled:opacity-50">Confirmar personal</button>
    </div>
  );
}
