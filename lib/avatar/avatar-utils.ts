/**
 * Avatar utility functions for handling user avatars and images
 */

interface UserWithAvatar {
  image?: string | null;
  avatar?: string | null;
}

/**
 * Get the avatar URL for a user, preferring the avatar field over image field
 * @param user - User object with potential image or avatar fields
 * @returns The avatar URL or undefined if none exists
 */
export function getAvatarUrl(user: UserWithAvatar | null | undefined): string | undefined {
  if (!user) return undefined;
  
  // Prefer avatar field over image field
  return user.avatar || user.image || undefined;
}

/**
 * Get initials from a name for fallback avatar display
 * @param name - Full name of the user
 * @returns Two-letter initials in uppercase
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Check if a URL is a valid image URL
 * @param url - URL to check
 * @returns True if the URL appears to be a valid image URL
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

