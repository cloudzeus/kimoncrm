"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Paperclip, ChevronDown, ChevronRight, Send, X, Upload, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getAvatarUrl } from "@/lib/avatar/avatar-utils";

interface Note {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    avatar: string | null;
  };
  attachments: Array<{
    id: string;
    file: {
      id: string;
      name: string;
      url: string;
      filetype: string;
      size: number | null;
    };
  }>;
  replies?: Note[];
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface LeadNotesTimelineProps {
  leadId: string;
  notes: Note[];
  onNoteAdded: () => void;
  participants?: Array<{
    id: string;
    user: User;
  }>;
  allUsers?: User[];
}

export function LeadNotesTimeline({
  leadId,
  notes,
  onNoteAdded,
  participants = [],
  allUsers = [],
}: LeadNotesTimelineProps) {
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [notifyUsers, setNotifyUsers] = useState<Set<string>>(new Set());
  const [showNotifyOptions, setShowNotifyOptions] = useState(true); // Show by default
  const [availableUsers, setAvailableUsers] = useState<User[]>(allUsers);
  const { toast } = useToast();

  // Fetch all users who can be notified (employees, managers, admins)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users?roles=EMPLOYEE,MANAGER,ADMIN');
        if (response.ok) {
          const data = await response.json();
          setAvailableUsers(data.users || []);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    
    if (allUsers.length === 0) {
      fetchUsers();
    }
  }, [allUsers]);

  const toggleExpand = (noteId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const toggleNotifyUser = (userId: string) => {
    const newNotify = new Set(notifyUsers);
    if (newNotify.has(userId)) {
      newNotify.delete(userId);
    } else {
      newNotify.add(userId);
    }
    setNotifyUsers(newNotify);
  };

  const selectAllUsers = () => {
    setNotifyUsers(new Set(availableUsers.map(u => u.id)));
  };

  const deselectAllUsers = () => {
    setNotifyUsers(new Set());
  };

  const uploadFiles = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return [];

    const fileIds: string[] = [];

    for (const file of selectedFiles) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("entityId", leadId);
        formData.append("type", "LEAD_NOTE");

        const response = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          fileIds.push(data.file.id);
        } else {
          throw new Error("Upload failed");
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        toast({
          title: "Error",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
      }
    }

    return fileIds;
  };

  const handleSubmitNote = async () => {
    if (!newNoteContent.trim()) return;

    setIsSubmitting(true);
    try {
      const fileIds = await uploadFiles();

      const response = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newNoteContent,
          fileIds,
          notifyUserIds: Array.from(notifyUsers),
        }),
      });

      if (!response.ok) throw new Error("Failed to create note");

      toast({
        title: "Success",
        description: `Note posted${notifyUsers.size > 0 ? ` and ${notifyUsers.size} user(s) notified` : ''}`,
      });

      setNewNoteContent("");
      setSelectedFiles([]);
      setNotifyUsers(new Set());
      setShowNotifyOptions(false);
      onNoteAdded();
    } catch (error) {
      console.error("Error creating note:", error);
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const fileIds = await uploadFiles();

      const response = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyContent,
          parentId,
          fileIds,
          notifyUserIds: Array.from(notifyUsers),
        }),
      });

      if (!response.ok) throw new Error("Failed to create reply");

      toast({
        title: "Success",
        description: `Reply posted${notifyUsers.size > 0 ? ` and ${notifyUsers.size} user(s) notified` : ''}`,
      });

      setReplyContent("");
      setReplyingTo(null);
      setSelectedFiles([]);
      setNotifyUsers(new Set());
      onNoteAdded();
    } catch (error) {
      console.error("Error creating reply:", error);
      toast({
        title: "Error",
        description: "Failed to create reply",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const renderNotifySection = () => {
    if (availableUsers.length === 0) {
      return (
        <div className="border rounded-lg p-4 bg-gray-50 text-center">
          <p className="text-sm text-gray-500">Loading users...</p>
        </div>
      );
    }

    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-600" />
            <Label className="text-sm font-semibold">NOTIFY USERS (Employees, Managers, Admins)</Label>
            <Badge variant="secondary" className="text-xs">
              {notifyUsers.size} selected
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={selectAllUsers}
              className="h-7 text-xs"
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={deselectAllUsers}
              className="h-7 text-xs"
            >
              Clear
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
          {availableUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => toggleNotifyUser(user.id)}
            >
              <Checkbox
                id={`notify-${user.id}`}
                checked={notifyUsers.has(user.id)}
                onCheckedChange={() => toggleNotifyUser(user.id)}
              />
              <label
                htmlFor={`notify-${user.id}`}
                className="text-sm cursor-pointer flex-1"
              >
                {user.name || user.email}
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderNote = (note: Note, isReply: boolean = false) => {
    const isExpanded = expandedNotes.has(note.id);
    const hasReplies = note.replies && note.replies.length > 0;

    return (
      <div key={note.id} className={`${isReply ? "ml-12 mt-3" : ""}`}>
        <div className="flex gap-3">
          {/* Avatar with connecting line */}
          <div className="flex flex-col items-center relative">
            <Avatar className="h-10 w-10 border-2 border-white shadow-md">
              <AvatarImage src={getAvatarUrl(note.user)} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
                {getUserInitials(note.user.name)}
              </AvatarFallback>
            </Avatar>
            {!isReply && hasReplies && (
              <div className="w-0.5 flex-1 bg-gradient-to-b from-gray-300 to-transparent mt-2" />
            )}
          </div>

          {/* Note Content */}
          <div className="flex-1 pb-6">
            <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-sm text-gray-900">{note.user.name || "Unknown User"}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span>{formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}</span>
                    </p>
                  </div>
                  {hasReplies && !isReply && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(note.id)}
                      className="h-8 -mt-1"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="ml-1 text-xs font-semibold">
                        {note.replies?.length} {note.replies?.length === 1 ? "reply" : "replies"}
                      </span>
                    </Button>
                  )}
                </div>

                {/* Content */}
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-3">
                  {note.content}
                </div>

                {/* Attachments */}
                {note.attachments && note.attachments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1 font-semibold uppercase">
                      <Paperclip className="h-3 w-3" />
                      {note.attachments.length} Attachment{note.attachments.length !== 1 ? "s" : ""}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {note.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-purple-100 transition-colors group"
                        >
                          <Paperclip className="h-3 w-3 text-blue-600 group-hover:text-blue-700" />
                          <span className="text-xs font-medium text-gray-700">{attachment.file.name}</span>
                          {attachment.file.size && (
                            <span className="text-xs text-gray-500">
                              ({(attachment.file.size / 1024).toFixed(1)} KB)
                            </span>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reply Button */}
                {!isReply && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(note.id)}
                      className="h-8 text-xs hover:bg-blue-50"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Reply Form */}
            {replyingTo === note.id && (
              <Card className="mt-3 shadow-md border-l-4 border-l-purple-500">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-bold text-gray-900">Reply to {note.user.name}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent("");
                        setSelectedFiles([]);
                        setNotifyUsers(new Set());
                      }}
                      className="h-7"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write your reply..."
                    className="min-h-[100px] mb-3"
                  />
                  
                  <div className="mb-3">
                    <label htmlFor={`reply-file-${note.id}`} className="cursor-pointer">
                      <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                        <Upload className="h-4 w-4" />
                        <span>Attach files</span>
                      </div>
                    </label>
                    <input
                      id={`reply-file-${note.id}`}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {selectedFiles.map((file, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1 pr-1">
                          {file.name}
                          <button onClick={() => removeFile(index)} className="ml-1 hover:bg-gray-200 rounded p-0.5">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        EMAIL NOTIFICATIONS
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNotifyOptions(!showNotifyOptions)}
                        className="h-7 text-xs"
                      >
                        {showNotifyOptions ? "Hide" : "Show"}
                      </Button>
                    </div>
                    {showNotifyOptions && renderNotifySection()}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleSubmitReply(note.id)}
                      disabled={isSubmitting || !replyContent.trim()}
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Reply
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Replies */}
            {isExpanded && hasReplies && (
              <div className="mt-3">
                {note.replies?.map((reply) => renderNote(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* New Note Form */}
      <Card className="shadow-lg border-l-4 border-l-green-500">
        <div className="p-6">
          <h3 className="text-sm font-bold mb-4 uppercase text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Add New Note
          </h3>
          <Textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Write a note..."
            className="min-h-[120px] mb-3 text-sm"
          />
          
          <div className="mb-3">
            <label htmlFor="note-file-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                <Upload className="h-4 w-4" />
                <span>Attach files</span>
              </div>
            </label>
            <input
              id="note-file-upload"
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1 pr-1">
                  {file.name}
                  <button onClick={() => removeFile(index)} className="ml-1 hover:bg-gray-200 rounded p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                EMAIL NOTIFICATIONS
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifyOptions(!showNotifyOptions)}
                className="h-7 text-xs"
              >
                {showNotifyOptions ? "Hide" : "Show"}
              </Button>
            </div>
            {showNotifyOptions && renderNotifySection()}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSubmitNote}
              disabled={isSubmitting || !newNoteContent.trim()}
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 uppercase font-bold"
            >
              <Send className="h-4 w-4 mr-2" />
              Post Note
            </Button>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Separator className="flex-1" />
          <h3 className="text-sm font-bold uppercase text-gray-600 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversation Timeline ({notes.length})
          </h3>
          <Separator className="flex-1" />
        </div>
        
        {notes.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed">
            <MessageSquare className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No notes yet</p>
            <p className="text-sm text-gray-400 mt-1">Start the conversation by posting the first note!</p>
          </Card>
        ) : (
          <div className="space-y-0">
            {notes.map((note) => renderNote(note))}
          </div>
        )}
      </div>
    </div>
  );
}
