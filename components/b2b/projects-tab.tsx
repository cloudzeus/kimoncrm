// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FolderOpen, Eye, Calendar, User, Clock, CheckCircle, AlertCircle, Pause } from 'lucide-react';

interface ProjectTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueAt: string | null;
  assignee: {
    id: string;
    name: string | null;
  } | null;
}

interface Project {
  id: string;
  name: string;
  status: string;
  startAt: string | null;
  endAt: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  tasks: ProjectTask[];
}

interface ProjectsTabProps {
  companyId: string;
}

export function ProjectsTab({ companyId }: ProjectsTabProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch(`/api/b2b/projects?companyId=${companyId}`);
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [companyId]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'active':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'on_hold':
      case 'on hold':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FolderOpen className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'active':
        return 'secondary';
      case 'on_hold':
      case 'on hold':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getProgressPercentage = (tasks: ProjectTask[]) => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status.toLowerCase() === 'completed').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Project',
      cell: ({ row }: { row: { original: Project } }) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(row.original.status)}
          <div>
            <p className="font-medium">{row.original.name}</p>
            {row.original.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {row.original.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: Project } }) => (
        <Badge variant={getStatusVariant(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'progress',
      header: 'Progress',
      cell: ({ row }: { row: { original: Project } }) => {
        const progress = getProgressPercentage(row.original.tasks);
        return (
          <div className="flex items-center space-x-2">
            <div className="w-20 bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'tasks',
      header: 'Tasks',
      cell: ({ row }: { row: { original: Project } }) => (
        <div className="text-sm">
          <span className="font-medium">{row.original.tasks.length}</span>
          <span className="text-muted-foreground">
            {' '}({row.original.tasks.filter(t => t.status === 'Completed').length} completed)
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'startAt',
      header: 'Start Date',
      cell: ({ row }: { row: { original: Project } }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.startAt ? new Date(row.original.startAt).toLocaleDateString() : 'TBD'}
        </span>
      ),
    },
    {
      accessorKey: 'endAt',
      header: 'End Date',
      cell: ({ row }: { row: { original: Project } }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.endAt ? new Date(row.original.endAt).toLocaleDateString() : 'TBD'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: Project } }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedProject(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FolderOpen className="h-5 w-5" />
            <span>PROJECTS</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FolderOpen className="h-5 w-5" />
            <span>PROJECTS</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length > 0 ? (
            <DataTable columns={columns} data={projects} />
          ) : (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No projects found</h3>
              <p className="text-muted-foreground">You don't have any active projects yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Details Dialog */}
      {selectedProject && (
        <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <FolderOpen className="h-5 w-5" />
                <span>{selectedProject.name}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Project Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Status</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(selectedProject.status)}
                    <Badge variant={getStatusVariant(selectedProject.status)}>
                      {selectedProject.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">Progress</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${getProgressPercentage(selectedProject.tasks)}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {getProgressPercentage(selectedProject.tasks)}%
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">Start Date</h4>
                  <p>{selectedProject.startAt ? new Date(selectedProject.startAt).toLocaleDateString() : 'TBD'}</p>
                </div>
                <div>
                  <h4 className="font-medium">End Date</h4>
                  <p>{selectedProject.endAt ? new Date(selectedProject.endAt).toLocaleDateString() : 'TBD'}</p>
                </div>
                <div>
                  <h4 className="font-medium">Created</h4>
                  <p>{new Date(selectedProject.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="font-medium">Last Updated</h4>
                  <p>{new Date(selectedProject.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Project Description */}
              {selectedProject.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedProject.description}</p>
                  </div>
                </div>
              )}

              {/* Project Tasks */}
              <div>
                <h4 className="font-medium mb-4">Tasks ({selectedProject.tasks.length})</h4>
                {selectedProject.tasks.length > 0 ? (
                  <div className="space-y-3">
                    {selectedProject.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-1 bg-muted rounded">
                            {getStatusIcon(task.status)}
                          </div>
                          <div>
                            <p className="font-medium">{task.title}</p>
                            {task.description && (
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          {task.assignee && (
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>{task.assignee.name}</span>
                            </div>
                          )}
                          {task.dueAt && (
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(task.dueAt).toLocaleDateString()}</span>
                            </div>
                          )}
                          <Badge variant={getStatusVariant(task.status)}>
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No tasks yet</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Timeline
                </Button>
                <Button>
                  <User className="h-4 w-4 mr-2" />
                  Contact Project Manager
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
