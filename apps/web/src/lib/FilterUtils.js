export const filterBySearchTerm = (members, searchTerm) => {
  if (!searchTerm || searchTerm.trim() === '') return members;
  const term = searchTerm.toLowerCase().trim();
  return members.filter(member => {
    const nameMatch = member.name?.toLowerCase().includes(term);
    const emailMatch = member.email?.toLowerCase().includes(term);
    const phoneMatch = member.phone?.toLowerCase().includes(term);
    return nameMatch || emailMatch || phoneMatch;
  });
};

export const filterByGroups = (members, selectedGroupIds, groupMembersMappings) => {
  if (!selectedGroupIds || selectedGroupIds.length === 0) return members;
  
  // groupMembersMappings is an array of records from 'group_members' collection
  // Create a Set of member IDs that belong to the selected groups
  const membersInSelectedGroups = new Set(
    groupMembersMappings
      .filter(gm => selectedGroupIds.includes(gm.group_id))
      .map(gm => gm.member_id)
  );

  return members.filter(member => membersInSelectedGroups.has(member.id));
};

export const filterByStatuses = (members, selectedStatuses) => {
  if (!selectedStatuses || selectedStatuses.length === 0) return members;
  
  const statusesLower = selectedStatuses.map(s => s.toLowerCase());
  return members.filter(member => {
    const status = (member.status || 'Actif').toLowerCase();
    return statusesLower.includes(status);
  });
};

export const filterByDateRange = (members, startDate, endDate) => {
  if (!startDate && !endDate) return members;
  
  return members.filter(member => {
    if (!member.join_date) return false; // If member has no join date, they might be excluded if a range is set. Adjust if needed.
    
    const joinDate = new Date(member.join_date);
    joinDate.setHours(0, 0, 0, 0);

    let isValid = true;

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (joinDate < start) isValid = false;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (joinDate > end) isValid = false;
    }

    return isValid;
  });
};