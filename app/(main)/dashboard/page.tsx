import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export default async function DashboardPage() {
  const session = await requireAuth();
  
  // Fetch full user data including department
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      department: true,
    },
  });

  // ADMIN users go to admin dashboard
  if (session.user.role === 'ADMIN') {
    redirect('/admin');
  }

  // Get department-specific dashboard path
  // Check if there's a department-specific dashboard configured
  const department = user?.department;
  
  if (department) {
    // First, try to find a department-specific dashboard by department ID
    let departmentDashboard = await prisma.menuItem.findFirst({
      where: {
        key: `${department.id}-dashboard`,
        isActive: true,
      },
    });

    // If not found, try by department name (lowercase, no spaces)
    if (!departmentDashboard) {
      const departmentKey = department.name.toLowerCase().replace(/\s+/g, '-') + '-dashboard';
      departmentDashboard = await prisma.menuItem.findFirst({
        where: {
          key: departmentKey,
          isActive: true,
        },
      });
    }

    // If still not found, check if there's a dashboard menu item specific to this department
    if (!departmentDashboard) {
      // Look for any "Dashboard" menu item that the user should be redirected to
      const menuGroups = await prisma.menuGroup.findMany({
        where: { isActive: true },
        include: {
          items: {
            where: { 
              isActive: true,
              key: { contains: 'dashboard' }
            },
            include: {
              permissions: true,
            },
          },
        },
      });

      // Find the first dashboard menu item the user has access to
      for (const group of menuGroups) {
        for (const item of group.items) {
          const hasAccess = item.permissions.some(p => {
            const roleMatch = !p.role || p.role === session.user.role;
            const departmentMatch = !p.departmentId || p.departmentId === department.id;
            return p.canView && roleMatch && departmentMatch;
          });
          
          if (hasAccess && item.path) {
            departmentDashboard = item;
            break;
          }
        }
        if (departmentDashboard) break;
      }
    }

    if (departmentDashboard?.path) {
      redirect(departmentDashboard.path);
    }
  }

  // Default dashboard for all users
  // You can customize this based on role or create specific dashboards
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">DASHBOARD</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name || session.user.email}
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-2">Your Role</h3>
          <p className="text-muted-foreground">{session.user.role}</p>
        </div>
        
        {department && (
          <div className="rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-2">Department</h3>
            <p className="text-muted-foreground">{department.name}</p>
          </div>
        )}
        
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-2">User Info</h3>
          <p className="text-muted-foreground text-sm">{session.user.email}</p>
        </div>
      </div>
    </div>
  );
}
