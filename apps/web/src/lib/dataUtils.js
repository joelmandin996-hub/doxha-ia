export const normalizeString = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
};

export const normalizeDate = (dateVal) => {
  if (!dateVal) return null;
  
  if (dateVal instanceof Date) {
    if (!isNaN(dateVal.getTime())) return dateVal.toISOString();
    return null;
  }

  const d = String(dateVal).trim();
  if (!d) return null;
  
  // Try parsing formats like DD/MM/YYYY or DD-MM-YYYY
  const parts = d.split(/[\/\-]/);
  if (parts.length === 3) {
    let year, month, day;
    if (parts[2].length === 4) {
      // Assume DD/MM/YYYY
      year = parseInt(parts[2], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[0], 10);
    } else if (parts[0].length === 4) {
      // Assume YYYY/MM/DD
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    }
    
    if (year && month && day && month <= 12 && day <= 31) {
      const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString();
      }
    }
  }

  // Fallback to standard JS parsing
  const fallback = new Date(d);
  if (!isNaN(fallback.getTime())) {
    return fallback.toISOString();
  }
  
  return null;
};

export const VALID_STATUSES = ['Actif', 'Inactif', 'Visiteur', 'Nouveau', 'Baptisé'];

export const normalizeStatus = (statusStr) => {
  if (!statusStr) return 'Actif';
  const normInput = normalizeString(statusStr);
  
  for (const valid of VALID_STATUSES) {
    if (normalizeString(valid) === normInput) {
      return valid;
    }
  }
  return 'Actif'; // Default fallback
};

export const validateEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
};

export const validatePhone = (phone) => {
  if (!phone) return true; // Optional field
  return /^[\d\s\-\+\(\)]+$/.test(String(phone).trim());
};