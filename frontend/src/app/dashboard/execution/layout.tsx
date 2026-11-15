'use client';

import { RoleGuard } from "@/components/auth/role-guard";
import { UserRole } from "@/store/auth-store";

export default function ExecutionLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={[UserRole.STAFF, UserRole.WAREHOUSE_MANAGER, UserRole.SUPER_ADMIN]}>
      {children}
    </RoleGuard>
  );
}
