import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { UserRole } from "@prisma/client"

export async function requireAuth() {
  const session = await auth()

  if (!session) {
    redirect("/sign-in")
  }

  return session
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth()

  if (!allowedRoles.includes(session.user.role as UserRole)) {
    redirect("/dashboard")
  }

  return session
}

export async function requireAdmin() {
  return requireRole(["ADMIN"])
}

export async function requireManagerOrAdmin() {
  return requireRole(["ADMIN", "MANAGER"])
}
