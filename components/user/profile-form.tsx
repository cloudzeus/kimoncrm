'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserRole } from '@prisma/client';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  phone: string | null;
  workPhone: string | null;
  mobile: string | null;
  avatar: string | null;
  image: string | null;
  department?: { id: string; name: string } | null;
  workPosition?: { id: string; title: string } | null;
  branch?: { id: string; name: string } | null;
  createdAt: string;
  lastLoginAt: string | null;
}

interface ProfileFormProps {
  user: User;
  onUpdate: (user: User) => void;
}

export function ProfileForm({ user, onUpdate }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    workPhone: user.workPhone || '',
    mobile: user.mobile || '',
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const { user: updatedUser } = await response.json();
      onUpdate(updatedUser);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      workPhone: user.workPhone || '',
      mobile: user.mobile || '',
    });
    setIsEditing(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size too large. Maximum size is 5MB.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/users/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const { url } = await response.json();
      
      // Update user with new avatar URL
      const updatedUser = { ...user, avatar: url };
      onUpdate(updatedUser);
      toast.success('Avatar uploaded successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users/profile/avatar', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete avatar');
      }

      const updatedUser = { ...user, avatar: null };
      onUpdate(updatedUser);
      toast.success('Avatar deleted successfully');
    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast.error('Failed to delete avatar');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'destructive';
      case UserRole.MANAGER:
        return 'default';
      case UserRole.USER:
        return 'secondary';
      case UserRole.B2B:
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getAvatarUrl = () => {
    return user.avatar || user.image || null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>PROFILE INFORMATION</CardTitle>
          <CardDescription>
            Manage your personal information and avatar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden relative">
                {getAvatarUrl() ? (
                  <Image
                    src={getAvatarUrl() || ''}
                    alt={user.name || user.email}
                    width={96}
                    height={96}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-2xl font-medium">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {getAvatarUrl() && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                  onClick={handleDeleteAvatar}
                  disabled={isLoading}
                >
                  ×
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? 'UPLOADING...' : 'UPLOAD AVATAR'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, WebP, or GIF. Max 5MB.
              </p>
            </div>
          </div>

          {/* User Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">EMAIL</Label>
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed
                </p>
              </div>
              
              <div>
                <Label htmlFor="name">NAME</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                ) : (
                  <Input
                    id="name"
                    value={user.name || 'Not set'}
                    disabled
                    className="bg-muted"
                  />
                )}
              </div>

              <div>
                <Label htmlFor="role">ROLE</Label>
                <div className="flex items-center space-x-2">
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Contact admin to change role
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">PHONE</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                ) : (
                  <Input
                    id="phone"
                    value={user.phone || 'Not set'}
                    disabled
                    className="bg-muted"
                  />
                )}
              </div>

              <div>
                <Label htmlFor="workPhone">WORK PHONE</Label>
                {isEditing ? (
                  <Input
                    id="workPhone"
                    value={formData.workPhone}
                    onChange={(e) => setFormData({ ...formData, workPhone: e.target.value })}
                    placeholder="Enter work phone"
                  />
                ) : (
                  <Input
                    id="workPhone"
                    value={user.workPhone || 'Not set'}
                    disabled
                    className="bg-muted"
                  />
                )}
              </div>

              <div>
                <Label htmlFor="mobile">MOBILE</Label>
                {isEditing ? (
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="Enter mobile number"
                  />
                ) : (
                  <Input
                    id="mobile"
                    value={user.mobile || 'Not set'}
                    disabled
                    className="bg-muted"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Assignment Info */}
          {(user.department || user.workPosition || user.branch) && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">ASSIGNMENT</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {user.department && (
                  <div>
                    <Label>DEPARTMENT</Label>
                    <div className="p-2 bg-muted rounded-md">
                      {user.department.name}
                    </div>
                  </div>
                )}
                {user.workPosition && (
                  <div>
                    <Label>WORK POSITION</Label>
                    <div className="p-2 bg-muted rounded-md">
                      {user.workPosition.title}
                    </div>
                  </div>
                )}
                {user.branch && (
                  <div>
                    <Label>BRANCH</Label>
                    <div className="p-2 bg-muted rounded-md">
                      {user.branch.name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  CANCEL
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? 'SAVING...' : 'SAVE CHANGES'}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                EDIT PROFILE
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
