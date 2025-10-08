import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { TaskKanban } from '@/components/projects/task-kanban';
import { ProjectTemplates } from '@/components/projects/project-templates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Kanban, 
  Save, 
  Users, 
  Calendar,
  Clock,
  Building2
} from 'lucide-react';
import { SaveProjectAsTemplateDialog } from '@/components/projects/save-project-as-template-dialog';

interface ProjectPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await auth();

  if (!session) {
    redirect('/dashboard');
  }

  // Fetch project details
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      contact: true,
      order: true,
      assignedUsers: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          tasks: true,
        },
      },
    },
  });

  if (!project) {
    redirect('/dashboard');
  }

  // Check if user has access to this project
  const isAssigned = project.assignedUsers.some(
    assignment => assignment.userId === session.user.id
  );
  const isManager = ['ADMIN', 'MANAGER'].includes(session.user.role);

  if (!isAssigned && !isManager) {
    redirect('/dashboard');
  }

  // Get project stats
  const taskStats = await prisma.task.groupBy({
    by: ['status'],
    where: { projectId: params.id },
    _count: {
      status: true,
    },
  });

  const completedTasks = taskStats.find(stat => stat.status === 'Done')?._count.status || 0;
  const totalTasks = taskStats.reduce((sum, stat) => sum + stat._count.status, 0);
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Project Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">
            {project.company.name} • {project.contact?.firstName} {project.contact?.lastName}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isManager && (
            <SaveProjectAsTemplateDialog
              projectId={project.id}
              projectName={project.name}
            />
          )}
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">TOTAL TASKS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">COMPLETED</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">PROGRESS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressPercentage}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">TEAM MEMBERS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.assignedUsers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Project Details */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Tabs defaultValue="tasks" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tasks" className="flex items-center space-x-2">
                <Kanban className="h-4 w-4" />
                <span>TASKS</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>TEMPLATES</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks">
              <Suspense fallback={<TaskKanbanSkeleton />}>
                <TaskKanban
                  projectId={project.id}
                  isManager={isManager}
                  currentUserId={session.user.id}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="templates">
              <Suspense fallback={<ProjectTemplatesSkeleton />}>
                <ProjectTemplates
                  projectId={project.id}
                  showCreateFromTemplate={isManager}
                />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>

        {/* Project Info Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>PROJECT DETAILS</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">Company</h4>
                <p className="text-sm text-muted-foreground">{project.company.name}</p>
              </div>
              
              {project.contact && (
                <div>
                  <h4 className="font-medium">Contact</h4>
                  <p className="text-sm text-muted-foreground">
                    {project.contact.firstName} {project.contact.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{project.contact.email}</p>
                </div>
              )}

              {project.startAt && (
                <div>
                  <h4 className="font-medium">Start Date</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(project.startAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {project.endAt && (
                <div>
                  <h4 className="font-medium">End Date</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(project.endAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-medium">Status</h4>
                <p className="text-sm text-muted-foreground">{project.status}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>TEAM MEMBERS</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {project.assignedUsers.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {assignment.user.name || assignment.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">{assignment.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TaskKanbanSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>PROJECT TASKS</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-1">
              <div className="p-4 rounded-lg bg-gray-100">
                <h3 className="font-medium mb-4">Column {i + 1}</h3>
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="bg-white p-3 rounded border animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectTemplatesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>PROJECT TEMPLATES</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

