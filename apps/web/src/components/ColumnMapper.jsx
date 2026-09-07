import { normalizeString } from '@/lib/dataUtils.js';

export const TARGET_FIELDS = [
  { id: 'firstName', label: 'Prénom' },
  { id: 'lastName', label: 'Nom' },
  { id: 'name', label: 'Nom Complet' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Téléphone' },
  { id: 'status', label: 'Statut' },
  { id: 'baptism_date', label: 'Date de baptême' },
  { id: 'church_join_date', label: 'Date d\'adhésion' }
];

const FIELD_ALIASES = {
  firstName: ['prenom', 'first name', 'firstname', 'first_name'],
  lastName: ['nom', 'last name', 'lastname', 'last_name', 'surname'],
  name: ['nom complet', 'full name', 'fullname', 'name', 'nom prenom', 'membre'],
  email: ['email', 'e-mail', 'mail', 'courriel', 'adresse e-mail', 'adresse mail'],
  phone: ['telephone', 'phone', 'tel', 'mobile', 'cell', 'portable', 'numero'],
  status: ['statut', 'status', 'etat', 'etat civil'],
  baptism_date: ['date bapteme', 'baptism date', 'date_bapteme', 'bapteme', 'date de bapteme'],
  church_join_date: ['date adhesion', 'join date', 'date_adhesion', 'date adhesion eglise', 'date entree', 'adhesion']
};

export const detectColumns = (headers) => {
  const mapping = {};
  
  headers.forEach(header => {
    const normHeader = normalizeString(header);
    let bestMatch = 'ignore';

    for (const [fieldId, aliases] of Object.entries(FIELD_ALIASES)) {
      // Exact match check
      if (aliases.includes(normHeader)) {
        bestMatch = fieldId;
        break;
      }
      // Partial match check
      if (aliases.some(alias => normHeader.includes(alias))) {
         bestMatch = fieldId;
      }
    }
    
    mapping[header] = bestMatch;
  });

  return mapping;
};

// Utility component to fulfill requirements if rendering is needed, 
// though the logic is primarily used directly via the exported constants and functions above.
const ColumnMapper = () => null;
export default ColumnMapper;