export const STATUTS_SUIVI = [
  { value: 'nouveau_visiteur', label: 'Nouveau visiteur', emoji: '🆕', color: 'hsl(217, 91%, 60%)' },
  { value: 'premier_contact', label: 'Premier contact', emoji: '📞', color: 'hsl(271, 81%, 56%)' },
  { value: 'premier_rendez_vous', label: 'Premier rendez-vous', emoji: '🤝', color: 'hsl(292, 84%, 61%)' },
  { value: 'participation_reguliere', label: 'Participation régulière', emoji: '⛪', color: 'hsl(330, 81%, 60%)' },
  { value: 'cellule', label: 'Cellule', emoji: '🏠', color: 'hsl(343, 88%, 60%)' },
  { value: 'membre_actif', label: 'Membre actif', emoji: '❤️', color: 'hsl(0, 84%, 60%)' },
  { value: 'serviteur', label: 'Serviteur', emoji: '🙏', color: 'hsl(24, 95%, 53%)' },
  { value: 'integre', label: 'Intégré', emoji: '✅', color: 'hsl(142, 71%, 45%)' }
];

export const PRIORITES_SUIVI = [
  { value: 'urgent', label: 'Urgent', color: 'hsl(var(--destructive))' },
  { value: 'important', label: 'Important', color: 'hsl(var(--warning, 35 92% 65%))' },
  { value: 'normal', label: 'Normal', color: 'hsl(var(--primary))' },
  { value: 'faible', label: 'Faible', color: 'hsl(var(--muted-foreground))' }
];

export const TYPES_SUIVI = [
  { value: 'pastoral', label: 'Pastoral', emoji: '✝️' },
  { value: 'visite_domicile', label: 'Visite à domicile', emoji: '🏠' },
  { value: 'appel', label: 'Appel téléphonique', emoji: '📞' },
  { value: 'email', label: 'Email', emoji: '✉️' },
  { value: 'priere', label: 'Prière', emoji: '🙏' },
  { value: 'accompagnement', label: 'Accompagnement', emoji: '🤝' },
  { value: 'soutien', label: 'Soutien', emoji: '❤️' },
  { value: 'nouveau_membre', label: 'Nouveau membre', emoji: '👋' },
  { value: 'nouveau_visiteur', label: 'Nouveau visiteur', emoji: '👀' },
  { value: 'etude_biblique', label: 'Étude biblique', emoji: '📖' },
  { value: 'formation', label: 'Formation', emoji: '🎓' },
  { value: 'urgence', label: 'Urgence', emoji: '🚨' }
];

export const getPriorityColor = (priorityValue) => {
  const priority = PRIORITES_SUIVI.find(p => p.value === priorityValue);
  return priority ? priority.color : 'hsl(var(--primary))';
};

export const getTypeEmoji = (typeValue) => {
  const type = TYPES_SUIVI.find(t => t.value === typeValue);
  return type ? type.emoji : '📝';
};

export const getTypeLabel = (typeValue) => {
  const type = TYPES_SUIVI.find(t => t.value === typeValue);
  return type ? type.label : typeValue;
};

export const getStatusColor = (statusValue) => {
  const status = STATUTS_SUIVI.find(s => s.value === statusValue);
  return status ? status.color : 'hsl(var(--muted-foreground))';
};

export const getStatusEmoji = (statusValue) => {
  const status = STATUTS_SUIVI.find(s => s.value === statusValue);
  return status ? status.emoji : '📌';
};

export const getStatusLabel = (statusValue) => {
  const status = STATUTS_SUIVI.find(s => s.value === statusValue);
  return status ? status.label : statusValue;
};