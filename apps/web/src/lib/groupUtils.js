/**
 * Group Types Configuration
 * Maps to PocketBase 'groups' collection 'type' field enum values
 */

export const PRIMARY_GROUP_TYPES = [
  {
    id: 'Cellule',
    label: 'Cellule',
    emoji: '🏠',
    color: '#3B82F6' // Blue
  },
  {
    id: 'Jeunesse',
    label: 'Jeunesse',
    emoji: '👥',
    color: '#8B5CF6' // Purple
  },
  {
    id: 'Femmes',
    label: 'Femmes',
    emoji: '👩',
    color: '#EC4899' // Pink
  },
  {
    id: 'Hommes',
    label: 'Hommes',
    emoji: '👨',
    color: '#06B6D4' // Cyan
  },
  {
    id: 'Louange',
    label: 'Louange',
    emoji: '🎵',
    color: '#F59E0B' // Amber
  },
  {
    id: 'Technique',
    label: 'Technique',
    emoji: '⚙️',
    color: '#6B7280' // Gray
  },
  {
    id: 'Groupe de service',
    label: 'Groupe de service',
    emoji: '🤝',
    color: '#10B981' // Emerald
  }
];

/**
 * Get the color for a group type
 * @param {string} type - The group type ID
 * @returns {string} - The hex color code
 */
export const getGroupTypeColor = (type) => {
  const groupType = PRIMARY_GROUP_TYPES.find(t => t.id === type);
  return groupType ? groupType.color : '#6B7280';
};

/**
 * Get the label for a group type
 * @param {string} type - The group type ID
 * @returns {string} - The display label
 */
export const getGroupTypeLabel = (type) => {
  const groupType = PRIMARY_GROUP_TYPES.find(t => t.id === type);
  return groupType ? groupType.label : type || 'Autre';
};

/**
 * Get the emoji for a group type
 * @param {string} type - The group type ID
 * @returns {string} - The emoji character
 */
export const getGroupTypeEmoji = (type) => {
  const groupType = PRIMARY_GROUP_TYPES.find(t => t.id === type);
  return groupType ? groupType.emoji : '📋';
};

/**
 * Validate if a type is a valid group type
 * @param {string} type - The type to validate
 * @returns {boolean} - True if valid
 */
export const isValidGroupType = (type) => {
  return PRIMARY_GROUP_TYPES.some(t => t.id === type);
};

/**
 * Get all group type IDs (for enum validation)
 * @returns {string[]} - Array of valid type IDs
 */
export const getValidGroupTypeIds = () => {
  return PRIMARY_GROUP_TYPES.map(t => t.id);
};