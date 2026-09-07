#!/usr/bin/env node
// Dev-only helper: creates a demo login and a handful of sample records
// (members, groups, events, follow-ups, a donation) so a freshly
// bootstrapped PocketBase instance isn't empty on first run.
//
// Never run this against a production database — it creates a real
// login with a known password.
//
// Usage: node scripts/seed-demo-data.js
// (respects POCKETBASE_URL, DEMO_EMAIL, DEMO_PASSWORD env vars)

const BASE = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@doxha.church';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo1234!';

async function ensureDemoUser() {
  await fetch(`${BASE}/api/collections/users/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      passwordConfirm: DEMO_PASSWORD,
      name: 'Pasteur Demo',
    }),
  }).catch(() => {});

  const res = await fetch(`${BASE}/api/collections/users/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: DEMO_EMAIL, password: DEMO_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`Could not log in as ${DEMO_EMAIL} — check PocketBase is running at ${BASE}`);
  }
  const { token, record } = await res.json();
  return { token, userId: record.id };
}

async function create(token, collection, data) {
  const res = await fetch(`${BASE}/api/collections/${collection}/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    console.warn(`  skip ${collection}:`, JSON.stringify(json.data || json.message));
    return null;
  }
  console.log(`  + ${collection}: ${data.name || data.titre || data.description || json.id}`);
  return json;
}

async function main() {
  console.log(`Seeding demo data into ${BASE} ...`);
  const { token, userId } = await ensureDemoUser();
  console.log(`Demo login ready: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

  const members = [];
  const memberDefs = [
    { name: 'Marie Dubois', email: 'marie.dubois@example.com', phone: '+33 6 12 34 56 78', status: 'Actif', join_date: '2022-03-14 00:00:00' },
    { name: 'Jean Kabila', email: 'jean.kabila@example.com', phone: '+33 6 98 76 54 32', status: 'Actif', join_date: '2021-09-01 00:00:00' },
    { name: 'Sarah Nkomo', email: 'sarah.nkomo@example.com', phone: '+33 6 22 33 44 55', status: 'Nouveau', join_date: '2026-06-10 00:00:00' },
    { name: 'David Mensah', email: 'david.mensah@example.com', phone: '+33 6 44 55 66 77', status: 'Baptisé', join_date: '2020-01-20 00:00:00', baptism_date: '2020-05-17 00:00:00' },
    { name: 'Grace Ilunga', email: 'grace.ilunga@example.com', phone: '+33 6 77 88 99 00', status: 'Visiteur', join_date: '2026-08-01 00:00:00' },
  ];
  for (const m of memberDefs) {
    const rec = await create(token, 'members', m);
    if (rec) members.push(rec);
  }

  const groups = [];
  const groupDefs = [
    { name: 'Cellule Nord', type: 'Cellule', description: 'Groupe de maison du quartier Nord', responsible: members[0]?.id },
    { name: 'Louange & Adoration', type: 'Louange', description: 'Équipe de louange du dimanche', responsible: members[1]?.id },
  ];
  for (const g of groupDefs) {
    const rec = await create(token, 'groups', g);
    if (rec) groups.push(rec);
  }

  if (groups[0] && members[2]) await create(token, 'group_members', { group_id: groups[0].id, member_id: members[2].id });
  if (groups[0] && members[4]) await create(token, 'group_members', { group_id: groups[0].id, member_id: members[4].id });
  if (groups[1] && members[3]) await create(token, 'group_members', { group_id: groups[1].id, member_id: members[3].id });

  const now = Date.now();
  const inDays = (d) => new Date(now + d * 86400000).toISOString();

  await create(token, 'evenements', {
    titre: 'Culte du dimanche',
    categorie: "Vie d'Église",
    description: 'Culte hebdomadaire avec louange et prédication.',
    lieu: 'Salle principale',
    responsable: members[1]?.id,
    date_debut: inDays(2),
    date_fin: inDays(2),
    statut: 'a_venir',
    capacite_max: 150,
    created_by: userId,
  });

  await create(token, 'evenements', {
    titre: 'Soirée de louange',
    categorie: 'Louange & Adoration',
    description: 'Soirée spéciale de louange et adoration.',
    lieu: 'Auditorium',
    responsable: members[1]?.id,
    date_debut: inDays(9),
    date_fin: inDays(9),
    statut: 'a_venir',
    capacite_max: 80,
    created_by: userId,
  });

  await create(token, 'suivis', {
    membre_id: members[2]?.id,
    description: 'Premier contact après le culte',
    type: 'Nouveau membre',
    statut: 'À contacter',
    priorite: 'normal',
    notes: "Rencontrée à l'accueil, intéressée par le groupe de jeunes.",
    created_by: userId,
  });

  await create(token, 'suivis', {
    membre_id: members[4]?.id,
    description: 'Visite de bienvenue',
    type: 'Visite',
    statut: 'Planifié',
    priorite: 'urgent',
    notes: 'Prévoir une visite cette semaine.',
    created_by: userId,
  });

  await create(token, 'donations', {
    member_id: members[0]?.id,
    donor_name: members[0]?.name,
    amount: 50,
    donation_type: 'offering',
    donation_date: inDays(-3),
    membre_id: members[0]?.id,
    date_don: inDays(-3),
    type_don: 'unique',
    statut: 'completed',
    description: 'Offrande dominicale',
    created_by: userId,
  });

  console.log('\nDone. Log in to the mobile/web app with:');
  console.log(`  ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
