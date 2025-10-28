/**
 * Utility functions for adding user attribution to task descriptions
 */

/**
 * Add user attribution to task description
 * Format: "User Name: description content"
 */
export function addUserAttribution(
  userName: string,
  newContent: string,
  existingDescription?: string | null
): string {
  // Clean the user name and new content
  const cleanUserName = userName.trim();
  const cleanContent = newContent.trim();
  
  if (!cleanContent) {
    return existingDescription || '';
  }

  // Format the new attribution line
  const attributionLine = `${cleanUserName}: ${cleanContent}`;
  
  // If there's existing description, append the new line
  if (existingDescription && existingDescription.trim()) {
    return `${existingDescription.trim()}\n${attributionLine}`;
  }
  
  // If no existing description, just return the attribution line
  return attributionLine;
}

/**
 * Update task description with user attribution
 * This handles both new descriptions and updates to existing ones
 */
export function updateTaskDescriptionWithAttribution(
  userName: string,
  newDescription: string,
  currentDescription?: string | null,
  isUpdate: boolean = false
): string {
  // If this is an update and the new description is different from current
  if (isUpdate && newDescription !== (currentDescription || '')) {
    // Check if the new description already has the user attribution
    const userPrefix = `${userName.trim()}:`;
    
    // If the new description already starts with the user's name, don't add it again
    if (newDescription.trim().startsWith(userPrefix)) {
      return newDescription;
    }
    
    // If it's completely different content, add attribution
    return addUserAttribution(userName, newDescription, currentDescription);
  }
  
  // For new tasks, always add attribution if there's content
  if (!isUpdate && newDescription.trim()) {
    return addUserAttribution(userName, newDescription);
  }
  
  // Return as-is if no changes needed
  return newDescription;
}

/**
 * Extract the latest entry from a task description
 * Useful for showing who made the last update
 */
export function getLatestDescriptionEntry(description: string): {
  userName: string | null;
  content: string;
  fullEntry: string;
} | null {
  if (!description || !description.trim()) {
    return null;
  }

  const lines = description.trim().split('\n');
  const lastLine = lines[lines.length - 1].trim();
  
  // Check if the last line has user attribution format
  const match = lastLine.match(/^([^:]+):\s*(.+)$/);
  
  if (match) {
    return {
      userName: match[1].trim(),
      content: match[2].trim(),
      fullEntry: lastLine,
    };
  }
  
  return {
    userName: null,
    content: lastLine,
    fullEntry: lastLine,
  };
}

/**
 * Get all entries from a task description with their authors
 */
export function parseTaskDescriptionEntries(description: string): Array<{
  userName: string | null;
  content: string;
  fullEntry: string;
}> {
  if (!description || !description.trim()) {
    return [];
  }

  const lines = description.trim().split('\n');
  const entries: Array<{
    userName: string | null;
    content: string;
    fullEntry: string;
  }> = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Check if the line has user attribution format
    const match = trimmedLine.match(/^([^:]+):\s*(.+)$/);
    
    if (match) {
      entries.push({
        userName: match[1].trim(),
        content: match[2].trim(),
        fullEntry: trimmedLine,
      });
    } else {
      entries.push({
        userName: null,
        content: trimmedLine,
        fullEntry: trimmedLine,
      });
    }
  }
  
  return entries;
}
