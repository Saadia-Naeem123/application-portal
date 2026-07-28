'use client';

import { useRouter } from 'next/navigation';
import { LogOut, UserCircle, Settings } from 'lucide-react';
import Dropdown, { DropdownItem, DropdownLabel, DropdownSeparator } from '@/components/ui/Dropdown';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <Dropdown
      trigger={
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors duration-150 hover:bg-neutral-100"
        >
          <Avatar name={user.fullName} size="sm" />
          <span className="hidden text-left text-sm leading-tight sm:block">
            <span className="block font-medium text-neutral-800">{user.fullName}</span>
            <span className="block text-xs text-neutral-400">{user.role.replace(/_/g, ' ')}</span>
          </span>
        </button>
      }
      className="w-64"
    >
      <DropdownLabel>{user.email}</DropdownLabel>
      <DropdownSeparator />
      <DropdownItem onClick={() => router.push('/profile')}>
        <UserCircle className="h-4 w-4 text-neutral-400" />
        My Profile
      </DropdownItem>
      {user.role === 'ADMIN' && (
        <DropdownItem onClick={() => router.push('/admin/settings')}>
          <Settings className="h-4 w-4 text-neutral-400" />
          System Settings
        </DropdownItem>
      )}
      <DropdownSeparator />
      <DropdownItem onClick={handleLogout} danger>
        <LogOut className="h-4 w-4" />
        Log out
      </DropdownItem>
    </Dropdown>
  );
}
