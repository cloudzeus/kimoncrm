import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

export async function requireAuth() {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  
  if (!allowedRoles.includes(session.user.role as UserRole)) {
    redirect("/dashboard");
  }

  return session;
}

export async function requireAdmin() {
  return requireRole([UserRole.ADMIN]);
}

export async function requireManager() {
  return requireRole([UserRole.ADMIN, UserRole.MANAGER]);
}

export async function requireUser() {
  return requireRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.B2B, UserRole.USER]);
}

export async function requireB2B() {
  return requireRole([UserRole.B2B]);
}

export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

export function isAdmin(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN;
}

export function isManager(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN || userRole === UserRole.MANAGER;
}

export function isUser(userRole: UserRole): boolean {
  return [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.B2B, UserRole.USER].includes(userRole);
}

export function isB2B(userRole: UserRole): boolean {
  return userRole === UserRole.B2B;
}
