"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  FileText,
  MapPin,
  ListTodo,
  User,
  Building2,
  Calendar,
  Eye,
  Edit,
  Filter,
  Search,
  LayoutGrid,
  List,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { AdminTasksKanban } from "./admin-tasks-kanban";

interface AdminDashboardClientProps {
  userId: string;
  statistics: any;
  allData: any;
  userData: any;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const TASK_STATUS_COLORS = {
  NOT_STARTED: "bg-gray-500",
  IN_PROGRESS: "bg-blue-500",
  COMPLETED: "bg-green-500",
  Todo: "bg-gray-500",
  "In Progress": "bg-blue-500",
  Done: "bg-green-500",
};

const LEAD_STATUS_COLORS = {
  ACTIVE: "bg-green-500",
  FROZEN: "bg-blue-500",
  WON: "bg-emerald-500",
  LOST: "bg-red-500",
  CANCELLED: "bg-gray-500",
};

export function AdminDashboardClient({ userId, statistics, allData, userData }: AdminDashboardClientProps) {
  const [activeView, setActiveView] = useState<"all" | "user">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [taskViewMode, setTaskViewMode] = useState<"list" | "kanban">("list");

  const currentData = activeView === "all" ? allData : userData;
  const currentStats = activeView === "all" ? statistics.total : statistics.userSpecific;

  // Prepare chart data
  const taskStatusData = [
    { name: "Not Started", value: currentData.leadTasks.filter((t: any) => t.status === "NOT_STARTED").length + currentData.projectTasks.filter((t: any) => t.status === "Todo").length },
    { name: "In Progress", value: currentData.leadTasks.filter((t: any) => t.status === "IN_PROGRESS").length + currentData.projectTasks.filter((t: any) => t.status === "In Progress").length },
    { name: "Completed", value: currentData.leadTasks.filter((t: any) => t.status === "COMPLETED").length + currentData.projectTasks.filter((t: any) => t.status === "Done").length },
  ];

  const leadStageData = [
    { name: "Active", value: allData.leads.filter((l: any) => l.status === "ACTIVE").length },
    { name: "Frozen", value: allData.leads.filter((l: any) => l.status === "FROZEN").length },
    { name: "Won", value: allData.leads.filter((l: any) => l.status === "WON").length },
    { name: "Lost", value: allData.leads.filter((l: any) => l.status === "LOST").length },
  ];

  const siteSurveyStatusData = [
    { name: "Scheduled", value: allData.siteSurveys.filter((s: any) => s.status === "Scheduled").length },
    { name: "In Progress", value: allData.siteSurveys.filter((s: any) => s.status === "In Progress").length },
    { name: "Completed", value: allData.siteSurveys.filter((s: any) => s.status === "Completed").length },
  ];

  const activityData = allData.statusChanges.slice(0, 7).reverse().map((sc: any) => ({
    date: format(new Date(sc.createdAt), "MMM dd"),
    changes: 1,
  })).reduce((acc: any[], curr: any) => {
    const existing = acc.find(a => a.date === curr.date);
    if (existing) {
      existing.changes += 1;
    } else {
      acc.push(curr);
    }
    return acc;
  }, []);

  const handleViewDetails = (item: any, type?: string) => {
    // If type is not provided, infer it from the item
    const itemType = type || (item.leadId && item.status ? "leadTask" : item.projectId && item.status ? "projectTask" : "unknown");
    setSelectedItem({ ...item, itemType });
    setDetailsDialogOpen(true);
  };

  const handleTaskUpdate = async (taskId: string, status: string) => {
    // Determine if it's a lead task or project task
    const task = [...currentData.leadTasks, ...currentData.projectTasks].find((t: any) => t.id === taskId);
    if (!task) return;

    const isLeadTask = task.leadId !== undefined;
    const endpoint = isLeadTask 
      ? `/api/leads/${task.leadId}/tasks/${taskId}`
      : `/api/projects/${task.projectId}/tasks/${taskId}/status`;

    const response = await fetch(endpoint, {
      method: isLeadTask ? "PATCH" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error("Failed to update task");
    }

    // Refresh page to get updated data
    window.location.reload();
  };

  const filteredLeadTasks = currentData.leadTasks.filter((task: any) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.lead?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || task.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredProjectTasks = currentData.projectTasks.filter((task: any) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.project?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.project?.company?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || task.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "all" | "user")} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="all" className="gap-2">
              <Users className="h-4 w-4" />
              ALL ITEMS
            </TabsTrigger>
            <TabsTrigger value="user" className="gap-2">
              <User className="h-4 w-4" />
              MY ITEMS
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TOTAL TASKS</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.leadTasks + currentStats.projectTasks}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.pending.leadTasks + statistics.pending.projectTasks} pending
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LEADS</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.leads}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.activeLeads} active
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SITE SURVEYS</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.siteSurveys}</div>
            <p className="text-xs text-muted-foreground">
              Site assessments
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NOTES</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.leadNotes}</div>
            <p className="text-xs text-muted-foreground">
              Communication threads
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OVERDUE</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {statistics.overdue.leadTasks + statistics.overdue.projectTasks}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-medium">TASK STATUS DISTRIBUTION</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-medium">LEAD STATUS</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={leadStageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-medium">SITE SURVEY STATUS</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={siteSurveyStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <CardTitle>ACTIVITY OVERVIEW</CardTitle>
              <CardDescription>Search and filter all activities</CardDescription>
            </div>
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="Todo">Todo</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tasks">TASKS</TabsTrigger>
          <TabsTrigger value="leads">LEADS</TabsTrigger>
          <TabsTrigger value="surveys">SURVEYS</TabsTrigger>
          <TabsTrigger value="notes">NOTES</TabsTrigger>
          <TabsTrigger value="activity">ACTIVITY</TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          {/* View Mode Toggle */}
          <div className="flex items-center justify-end gap-2">
            <Button
              variant={taskViewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setTaskViewMode("list")}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              LIST VIEW
            </Button>
            <Button
              variant={taskViewMode === "kanban" ? "default" : "outline"}
              size="sm"
              onClick={() => setTaskViewMode("kanban")}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              KANBAN VIEW
            </Button>
          </div>

          {taskViewMode === "kanban" ? (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5" />
                  ALL TASKS - KANBAN VIEW
                </CardTitle>
                <CardDescription>
                  Drag and drop tasks to change their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminTasksKanban
                  tasks={[...filteredLeadTasks, ...filteredProjectTasks]}
                  onTaskUpdate={handleTaskUpdate}
                  onViewDetails={(task) => handleViewDetails(task)}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
            {/* Lead Tasks */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5" />
                  LEAD TASKS ({filteredLeadTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {filteredLeadTasks.map((task: any) => (
                      <Card key={task.id} className="shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={cn("text-xs", TASK_STATUS_COLORS[task.status as keyof typeof TASK_STATUS_COLORS])}>
                                  {task.status.replace("_", " ")}
                                </Badge>
                                {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "COMPLETED" && (
                                  <Badge variant="destructive" className="text-xs">OVERDUE</Badge>
                                )}
                              </div>
                              <h4 className="font-semibold truncate">{task.title}</h4>
                              {task.lead && (
                                <p className="text-sm text-muted-foreground truncate">
                                  Lead: {task.lead.title}
                                </p>
                              )}
                              {task.assignedTo && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <User className="h-3 w-3" />
                                  {task.assignedTo.name || task.assignedTo.email}
                                </p>
                              )}
                              {task.dueDate && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(task.dueDate), "MMM dd, yyyy")}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(task, "leadTask")}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {task.lead && (
                                <Link href={`/leads/${task.leadId}`}>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {filteredLeadTasks.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No lead tasks found</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Project Tasks */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  PROJECT TASKS ({filteredProjectTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {filteredProjectTasks.map((task: any) => (
                      <Card key={task.id} className="shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={cn("text-xs", TASK_STATUS_COLORS[task.status as keyof typeof TASK_STATUS_COLORS])}>
                                  {task.status}
                                </Badge>
                                {task.dueAt && new Date(task.dueAt) < new Date() && task.status !== "Done" && (
                                  <Badge variant="destructive" className="text-xs">OVERDUE</Badge>
                                )}
                              </div>
                              <h4 className="font-semibold truncate">{task.title}</h4>
                              {task.project && (
                                <p className="text-sm text-muted-foreground truncate">
                                  Project: {task.project.name}
                                </p>
                              )}
                              {task.assignee && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <User className="h-3 w-3" />
                                  {task.assignee.name || task.assignee.email}
                                </p>
                              )}
                              {task.dueAt && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(task.dueAt), "MMM dd, yyyy")}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(task, "projectTask")}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {task.project && (
                                <Link href={`/projects/${task.projectId}`}>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {filteredProjectTasks.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No project tasks found</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          )}
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                LEADS ({currentData.leads.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {currentData.leads.map((lead: any) => (
                    <Card key={lead.id} className="shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={cn("text-xs", LEAD_STATUS_COLORS[lead.status as keyof typeof LEAD_STATUS_COLORS])}>
                                {lead.status}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {lead.stage.replace(/_/g, " ")}
                              </Badge>
                              {lead.priority && (
                                <Badge variant={lead.priority === "HIGH" ? "destructive" : "secondary"} className="text-xs">
                                  {lead.priority}
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-semibold">{lead.title}</h4>
                            {lead.leadNumber && (
                              <p className="text-sm text-muted-foreground">#{lead.leadNumber}</p>
                            )}
                            {lead.customer && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Building2 className="h-3 w-3" />
                                {lead.customer.name}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {lead.owner && (
                                <span className="text-xs text-muted-foreground">
                                  Owner: {lead.owner.name || lead.owner.email}
                                </span>
                              )}
                              {lead.assignee && (
                                <span className="text-xs text-muted-foreground">
                                  Assignee: {lead.assignee.name || lead.assignee.email}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(lead, "lead")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Link href={`/leads/${lead.id}`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {currentData.leads.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No leads found</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Site Surveys Tab */}
        <TabsContent value="surveys" className="space-y-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                SITE SURVEYS ({currentData.siteSurveys.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {currentData.siteSurveys.map((survey: any) => (
                    <Card key={survey.id} className="shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">{survey.status}</Badge>
                              <Badge className="text-xs">{survey.type}</Badge>
                            </div>
                            <h4 className="font-semibold">{survey.title}</h4>
                            {survey.customer && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Building2 className="h-3 w-3" />
                                {survey.customer.name}
                              </p>
                            )}
                            {survey.arrangedDate && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(survey.arrangedDate), "MMM dd, yyyy HH:mm")}
                              </p>
                            )}
                            {survey.assignTo && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <User className="h-3 w-3" />
                                Assigned to: {survey.assignTo.name || survey.assignTo.email}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(survey, "siteSurvey")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Link href={`/site-surveys/${survey.id}`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {currentData.siteSurveys.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No site surveys found</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                NOTES & COMMUNICATIONS ({currentData.leadNotes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {currentData.leadNotes.map((note: any) => (
                    <Card key={note.id} className="shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {note.isSystemNote && (
                                <Badge variant="secondary" className="text-xs">SYSTEM</Badge>
                              )}
                              {note.replies && note.replies.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {note.replies.length} {note.replies.length === 1 ? "reply" : "replies"}
                                </Badge>
                              )}
                            </div>
                            {note.lead && (
                              <h4 className="font-semibold mb-1">
                                Lead: {note.lead.title}
                              </h4>
                            )}
                            <p className="text-sm line-clamp-2">{note.content}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {note.user?.name || note.user?.email}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(note.createdAt), "MMM dd, yyyy HH:mm")}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(note, "leadNote")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {note.lead && (
                              <Link href={`/leads/${note.leadId}`}>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {currentData.leadNotes.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No notes found</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                RECENT ACTIVITY
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="changes" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <Separator className="my-4" />
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {allData.statusChanges.map((change: any) => (
                    <Card key={change.id} className="shadow-sm">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-semibold">{change.changedByUser?.name || change.changedByUser?.email}</span>
                              {" changed status "}
                              {change.fromStatus && (
                                <>
                                  from <Badge variant="outline" className="text-xs mx-1">{change.fromStatus}</Badge> to
                                </>
                              )}
                              <Badge className="text-xs mx-1">{change.toStatus}</Badge>
                            </p>
                            {change.lead && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Lead: {change.lead.title}
                              </p>
                            )}
                            {change.note && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                Note: {change.note}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(change.createdAt), "MMM dd, yyyy HH:mm")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedItem?.itemType === "leadTask" && "LEAD TASK DETAILS"}
              {selectedItem?.itemType === "projectTask" && "PROJECT TASK DETAILS"}
              {selectedItem?.itemType === "lead" && "LEAD DETAILS"}
              {selectedItem?.itemType === "siteSurvey" && "SITE SURVEY DETAILS"}
              {selectedItem?.itemType === "leadNote" && "NOTE DETAILS"}
            </DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              {/* Lead Task Details */}
              {selectedItem.itemType === "leadTask" && (
                <>
                  <div>
                    <label className="text-sm font-semibold">TITLE</label>
                    <p>{selectedItem.title}</p>
                  </div>
                  {selectedItem.description && (
                    <div>
                      <label className="text-sm font-semibold">DESCRIPTION</label>
                      <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold">STATUS</label>
                      <Badge className={cn("mt-1", TASK_STATUS_COLORS[selectedItem.status as keyof typeof TASK_STATUS_COLORS])}>
                        {selectedItem.status.replace("_", " ")}
                      </Badge>
                    </div>
                    {selectedItem.dueDate && (
                      <div>
                        <label className="text-sm font-semibold">DUE DATE</label>
                        <p>{format(new Date(selectedItem.dueDate), "PPP")}</p>
                      </div>
                    )}
                  </div>
                  {selectedItem.lead && (
                    <div>
                      <label className="text-sm font-semibold">RELATED LEAD</label>
                      <p>{selectedItem.lead.title}</p>
                      {selectedItem.lead.customer && (
                        <p className="text-sm text-muted-foreground">Customer: {selectedItem.lead.customer.name}</p>
                      )}
                    </div>
                  )}
                  {selectedItem.assignedTo && (
                    <div>
                      <label className="text-sm font-semibold">ASSIGNED TO</label>
                      <p>{selectedItem.assignedTo.name || selectedItem.assignedTo.email}</p>
                    </div>
                  )}
                  {selectedItem.assignees && selectedItem.assignees.length > 0 && (
                    <div>
                      <label className="text-sm font-semibold">ADDITIONAL ASSIGNEES</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedItem.assignees.map((assignee: any) => (
                          <Badge key={assignee.id} variant="secondary">
                            {assignee.user.name || assignee.user.email}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Project Task Details */}
              {selectedItem.itemType === "projectTask" && (
                <>
                  <div>
                    <label className="text-sm font-semibold">TITLE</label>
                    <p>{selectedItem.title}</p>
                  </div>
                  {selectedItem.description && (
                    <div>
                      <label className="text-sm font-semibold">DESCRIPTION</label>
                      <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold">STATUS</label>
                      <Badge className={cn("mt-1", TASK_STATUS_COLORS[selectedItem.status as keyof typeof TASK_STATUS_COLORS])}>
                        {selectedItem.status}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-semibold">PRIORITY</label>
                      <Badge variant={selectedItem.priority === "Critical" ? "destructive" : "secondary"}>
                        {selectedItem.priority}
                      </Badge>
                    </div>
                  </div>
                  {selectedItem.project && (
                    <div>
                      <label className="text-sm font-semibold">PROJECT</label>
                      <p>{selectedItem.project.name}</p>
                    </div>
                  )}
                  {selectedItem.assignee && (
                    <div>
                      <label className="text-sm font-semibold">ASSIGNED TO</label>
                      <p>{selectedItem.assignee.name || selectedItem.assignee.email}</p>
                    </div>
                  )}
                </>
              )}

              {/* Lead Details */}
              {selectedItem.itemType === "lead" && (
                <>
                  <div>
                    <label className="text-sm font-semibold">TITLE</label>
                    <p>{selectedItem.title}</p>
                  </div>
                  {selectedItem.leadNumber && (
                    <div>
                      <label className="text-sm font-semibold">LEAD NUMBER</label>
                      <p>{selectedItem.leadNumber}</p>
                    </div>
                  )}
                  {selectedItem.description && (
                    <div>
                      <label className="text-sm font-semibold">DESCRIPTION</label>
                      <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold">STATUS</label>
                      <Badge className={cn("mt-1", LEAD_STATUS_COLORS[selectedItem.status as keyof typeof LEAD_STATUS_COLORS])}>
                        {selectedItem.status}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-semibold">STAGE</label>
                      <Badge variant="outline">{selectedItem.stage.replace(/_/g, " ")}</Badge>
                    </div>
                  </div>
                  {selectedItem.customer && (
                    <div>
                      <label className="text-sm font-semibold">CUSTOMER</label>
                      <p>{selectedItem.customer.name}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedItem.owner && (
                      <div>
                        <label className="text-sm font-semibold">OWNER</label>
                        <p>{selectedItem.owner.name || selectedItem.owner.email}</p>
                      </div>
                    )}
                    {selectedItem.assignee && (
                      <div>
                        <label className="text-sm font-semibold">ASSIGNEE</label>
                        <p>{selectedItem.assignee.name || selectedItem.assignee.email}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Site Survey Details */}
              {selectedItem.itemType === "siteSurvey" && (
                <>
                  <div>
                    <label className="text-sm font-semibold">TITLE</label>
                    <p>{selectedItem.title}</p>
                  </div>
                  {selectedItem.description && (
                    <div>
                      <label className="text-sm font-semibold">DESCRIPTION</label>
                      <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold">STATUS</label>
                      <Badge variant="outline">{selectedItem.status}</Badge>
                    </div>
                    <div>
                      <label className="text-sm font-semibold">TYPE</label>
                      <Badge>{selectedItem.type}</Badge>
                    </div>
                  </div>
                  {selectedItem.customer && (
                    <div>
                      <label className="text-sm font-semibold">CUSTOMER</label>
                      <p>{selectedItem.customer.name}</p>
                    </div>
                  )}
                  {selectedItem.arrangedDate && (
                    <div>
                      <label className="text-sm font-semibold">ARRANGED DATE</label>
                      <p>{format(new Date(selectedItem.arrangedDate), "PPP HH:mm")}</p>
                    </div>
                  )}
                  {selectedItem.address && (
                    <div>
                      <label className="text-sm font-semibold">ADDRESS</label>
                      <p>{selectedItem.address}</p>
                    </div>
                  )}
                </>
              )}

              {/* Note Details */}
              {selectedItem.itemType === "leadNote" && (
                <>
                  {selectedItem.lead && (
                    <div>
                      <label className="text-sm font-semibold">RELATED LEAD</label>
                      <p>{selectedItem.lead.title}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-semibold">CONTENT</label>
                    <p className="text-sm whitespace-pre-wrap">{selectedItem.content}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold">AUTHOR</label>
                    <p>{selectedItem.user?.name || selectedItem.user?.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(selectedItem.createdAt), "PPP HH:mm")}
                    </p>
                  </div>
                  {selectedItem.replies && selectedItem.replies.length > 0 && (
                    <div>
                      <label className="text-sm font-semibold">REPLIES ({selectedItem.replies.length})</label>
                      <div className="mt-2 space-y-2">
                        {selectedItem.replies.map((reply: any) => (
                          <Card key={reply.id} className="shadow-sm">
                            <CardContent className="p-3">
                              <p className="text-sm">{reply.content}</p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {reply.user?.name || reply.user?.email}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(reply.createdAt), "MMM dd, HH:mm")}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

