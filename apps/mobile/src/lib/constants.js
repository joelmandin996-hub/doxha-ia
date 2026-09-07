import { colors } from '../theme/colors';

export const MEMBER_STATUS_COLORS = {
  Actif: colors.success,
  Inactif: colors.mutedForeground,
  Visiteur: colors.sky,
  Nouveau: colors.amber,
  'Baptisé': colors.primary,
};

export const SUIVI_STATUSES = ['Nouveau', 'À contacter', 'Planifié', 'En cours', 'Terminé'];

export const SUIVI_STATUS_COLORS = {
  Nouveau: colors.sky,
  'À contacter': colors.amber,
  'Planifié': colors.secondary,
  'En cours': colors.primary,
  'Terminé': colors.success,
};

export const SUIVI_PRIORITY_COLORS = {
  urgent: colors.destructive,
  normal: colors.amber,
  basse: colors.mutedForeground,
};

export const EVENT_STATUS_COLORS = {
  a_venir: colors.sky,
  fait: colors.success,
  annule: colors.destructive,
};

export const EVENT_STATUS_LABELS = {
  a_venir: 'À venir',
  fait: 'Fait',
  annule: 'Annulé',
};

export const GROUP_TYPE_COLORS = {
  Cellule: colors.secondary,
  Jeunesse: colors.coral,
  Femmes: colors.rose,
  Hommes: colors.sky,
  Louange: colors.amber,
  Technique: colors.emerald,
  'Groupe de service': colors.teal,
};
