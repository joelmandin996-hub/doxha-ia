import { addDays, addWeeks, addMonths, isBefore, isSameDay } from 'date-fns';

export const EVENT_CATEGORIES = [
  { value: 'Réunion de prière', label: 'Réunion de prière', emoji: '🙏', color: '#6366f1', fg: '#ffffff' },
  { value: 'Cellule de maison', label: 'Cellule de maison', emoji: '🏠', color: '#10b981', fg: '#ffffff' },
  { value: 'Prédication spéciale', label: 'Prédication spéciale', emoji: '🎤', color: '#8b5cf6', fg: '#ffffff' },
  { value: 'Louange & Adoration', label: 'Louange & Adoration', emoji: '🎶', color: '#ec4899', fg: '#ffffff' },
  { value: 'Vie d\'Église', label: 'Vie d\'Église', emoji: '👨‍👩‍👧‍👦', color: '#f59e0b', fg: '#ffffff' },
  { value: 'Formation biblique', label: 'Formation biblique', emoji: '🧑‍🎓', color: '#3b82f6', fg: '#ffffff' },
  { value: 'Étude biblique', label: 'Étude biblique', emoji: '📖', color: '#0ea5e9', fg: '#ffffff' },
  { value: 'Jeunesse', label: 'Jeunesse', emoji: '🔥', color: '#ef4444', fg: '#ffffff' },
  { value: 'Enfants', label: 'Enfants', emoji: '👦', color: '#f97316', fg: '#ffffff' },
  { value: 'Mariage', label: 'Mariage', emoji: '💍', color: '#d946ef', fg: '#ffffff' },
  { value: 'Présentation d\'enfant', label: 'Présentation d\'enfant', emoji: '👶', color: '#fb923c', fg: '#ffffff' },
  { value: 'Baptême', label: 'Baptême', emoji: '🎉', color: '#06b6d4', fg: '#ffffff' },
  { value: 'Visite pastorale', label: 'Visite pastorale', emoji: '🤝', color: '#14b8a6', fg: '#ffffff' },
  { value: 'Accompagnement', label: 'Accompagnement', emoji: '❤️', color: '#f43f5e', fg: '#ffffff' },
  { value: 'Visite malade', label: 'Visite malade', emoji: '🏥', color: '#059669', fg: '#ffffff' },
  { value: 'Mission & Évangélisation', label: 'Mission & Évangélisation', emoji: '🌍', color: '#84cc16', fg: '#ffffff' },
  { value: 'Retraite spirituelle', label: 'Retraite spirituelle', emoji: '🏕️', color: '#65a30d', fg: '#ffffff' },
  { value: 'Événement spécial', label: 'Événement spécial', emoji: '🎪', color: '#a855f7', fg: '#ffffff' },
  { value: 'Repas fraternel', label: 'Repas fraternel', emoji: '🍽️', color: '#eab308', fg: '#ffffff' },
  { value: 'Réunion de responsables', label: 'Réunion de responsables', emoji: '💼', color: '#334155', fg: '#ffffff' },
  { value: 'Conseil d\'administration', label: 'Conseil d\'administration', emoji: '📊', color: '#475569', fg: '#ffffff' },
  { value: 'Collecte & Offrandes', label: 'Collecte & Offrandes', emoji: '💰', color: '#eab308', fg: '#000000' },
  { value: 'Fête chrétienne', label: 'Fête chrétienne', emoji: '🎄', color: '#2dd4bf', fg: '#000000' },
  { value: 'Conférence', label: 'Conférence', emoji: '📅', color: '#6366f1', fg: '#ffffff' },
  { value: 'Séminaire', label: 'Séminaire', emoji: '🎙️', color: '#8b5cf6', fg: '#ffffff' },
  { value: 'Projet d\'Église', label: 'Projet d\'Église', emoji: '🚀', color: '#f43f5e', fg: '#ffffff' },
  { value: 'Bénévolat & Service', label: 'Bénévolat & Service', emoji: '✅', color: '#10b981', fg: '#ffffff' }
];

export const CATEGORIES = EVENT_CATEGORIES.map(c => c.value);

export const getCategoryColor = (categorie) => {
  const cat = EVENT_CATEGORIES.find(c => c.value === categorie);
  return cat ? cat.color : '#94a3b8';
};

export const getCategoryForeground = (categorie) => {
  const cat = EVENT_CATEGORIES.find(c => c.value === categorie);
  return cat ? cat.fg : '#ffffff';
};

export const getCategoryEmoji = (categorie) => {
  const cat = EVENT_CATEGORIES.find(c => c.value === categorie);
  return cat ? cat.emoji : '📅';
};

export const getCategoryLabel = (categorie) => {
  const cat = EVENT_CATEGORIES.find(c => c.value === categorie);
  return cat ? cat.label : categorie;
};

export const getRecurrenceLabel = (recurrence) => {
  const map = {
    une_fois: 'Une fois',
    quotidien: 'Quotidien',
    hebdomadaire: 'Hebdomadaire',
    mensuel: 'Mensuel',
  };
  return map[recurrence] || 'Non défini';
};

export const formatEventTime = (startDate, endDate) => {
  const s = new Date(startDate);
  const e = new Date(endDate);
  
  const formatTime = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  
  if (isSameDay(s, e)) {
    return `${formatTime(s)} - ${formatTime(e)}`;
  }
  
  return `${s.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short'})} ${formatTime(s)} - ${e.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short'})} ${formatTime(e)}`;
};

export const filterEvents = (events, filters) => {
  return events.filter((event) => {
    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.includes(event.categorie)) return false;
    }
    
    // Status filter
    if (filters.status && filters.status !== 'tous') {
      if (filters.status === 'a_venir' && event.statut !== 'a_venir') return false;
      if (filters.status === 'passes' && event.statut !== 'fait') return false;
    }
    
    // Responsable filter
    if (filters.responsable && filters.responsable !== 'tous') {
      if (event.responsable !== filters.responsable) return false;
    }
    
    // Search filter
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!event.titre.toLowerCase().includes(q) && !event.description?.toLowerCase().includes(q)) {
        return false;
      }
    }
    
    return true;
  });
};

export const generateRecurringEvents = (baseEvent, endDateLimit) => {
  if (!baseEvent.recurrence || baseEvent.recurrence === 'une_fois') {
    return [baseEvent];
  }

  const results = [];
  let currentStart = new Date(baseEvent.date_debut);
  let currentEnd = new Date(baseEvent.date_fin);
  const limit = new Date(endDateLimit);
  
  const duration = currentEnd.getTime() - currentStart.getTime();

  let idCounter = 1;
  while (isBefore(currentStart, limit)) {
    results.push({
      ...baseEvent,
      id: `${baseEvent.id}_${idCounter}`,
      originalId: baseEvent.id,
      date_debut: currentStart.toISOString(),
      date_fin: currentEnd.toISOString(),
      isRecurringInstance: idCounter > 1
    });

    if (baseEvent.recurrence === 'quotidien') {
      currentStart = addDays(currentStart, 1);
    } else if (baseEvent.recurrence === 'hebdomadaire') {
      currentStart = addWeeks(currentStart, 1);
    } else if (baseEvent.recurrence === 'mensuel') {
      currentStart = addMonths(currentStart, 1);
    } else {
      break;
    }
    
    currentEnd = new Date(currentStart.getTime() + duration);
    idCounter++;
  }

  return results;
};