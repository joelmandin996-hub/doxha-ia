import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// POST /groups/sync - Sync group with events and agenda
router.post('/sync', async (req, res) => {
  console.log('--- [BACKEND] DIAGNOSTIC: POST /groups/sync TRIGGERED ---');
  console.log('[BACKEND] Request Body:', req.body);
  
  const { groupId, action, userId } = req.body;

  // 1. Validation stricte
  if (!groupId || typeof groupId !== 'string') {
    const errorMsg = 'Validation Error: groupId is required';
    console.error(`[BACKEND] ${errorMsg}`);
    return res.status(400).json({ error: errorMsg });
  }

  if (!action || !['create', 'update', 'delete'].includes(action)) {
    const errorMsg = 'Validation Error: action must be create, update, or delete';
    console.error(`[BACKEND] ${errorMsg}`);
    return res.status(400).json({ error: errorMsg });
  }

  // userId est requis car le champ `created_by` de 'events' est obligatoire
  if (action === 'create' && !userId) {
    const errorMsg = 'Validation Error: userId is required for creating events';
    console.error(`[BACKEND] ${errorMsg}`);
    return res.status(400).json({ error: errorMsg });
  }

  try {
    if (action === 'create') {
      console.log(`[BACKEND] Action: CREATE for group ${groupId}`);
      
      // A. Vérifier que le groupe existe
      console.log(`[BACKEND] Fetching group ${groupId}...`);
      const group = await pb.collection('groups').getOne(groupId);
      if (!group) {
        throw new Error(`Group not found: ${groupId}`);
      }
      console.log(`[BACKEND] Group found: ${group.name} (auto_sync: ${group.auto_sync})`);

      // B. Création de l'événement lié
      const now = new Date();
      const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const eventPayload = {
        title: `Réunion: ${group.name}`,
        description: group.description || `Événement généré automatiquement pour le groupe ${group.name}`,
        start_date: now.toISOString(),
        end_date: inSevenDays.toISOString(),
        group_id: groupId,
        source: 'group',
        auto_created: true,
        created_by: userId
      };
      
      console.log('[BACKEND] Creating event with payload:', eventPayload);
      const eventRecord = await pb.collection('events').create(eventPayload);
      console.log(`[BACKEND] SUCCESS: Event created. ID = ${eventRecord.id}`);

      // C. Création de l'entrée agenda
      const agendaPayload = {
        group_id: groupId,
        event_id: eventRecord.id,
        source: 'group',
        auto_created: true
      };
      
      console.log('[BACKEND] Creating agenda entry with payload:', agendaPayload);
      const agendaRecord = await pb.collection('agenda').create(agendaPayload);
      console.log(`[BACKEND] SUCCESS: Agenda entry created. ID = ${agendaRecord.id}`);

      // D. Mise à jour du groupe avec les relations
      console.log(`[BACKEND] Updating group ${groupId} with relations (event_id: ${eventRecord.id}, agenda_id: ${agendaRecord.id})`);
      const updatedGroup = await pb.collection('groups').update(groupId, {
        event_id: eventRecord.id,
        agenda_id: agendaRecord.id,
      });
      console.log('[BACKEND] SUCCESS: Group relations updated.');

      return res.json({ 
        success: true, 
        group: updatedGroup, 
        event: eventRecord, 
        agenda: agendaRecord 
      });

    } else if (action === 'update') {
      console.log(`[BACKEND] Action: UPDATE for group ${groupId}`);
      const group = await pb.collection('groups').getOne(groupId);

      if (group.event_id) {
        console.log(`[BACKEND] Updating related event ${group.event_id}`);
        await pb.collection('events').update(group.event_id, {
          title: `Réunion: ${group.name}`,
          description: group.description || `Événement généré automatiquement pour le groupe ${group.name}`,
        });
        console.log('[BACKEND] SUCCESS: Related event updated.');
      } else {
        console.log('[BACKEND] Warning: No event_id found on group to update.');
      }

      return res.json({ success: true, action: 'update', groupId });

    } else if (action === 'delete') {
      console.log(`[BACKEND] Action: DELETE for group ${groupId}`);
      const group = await pb.collection('groups').getOne(groupId);

      if (group.event_id) {
        console.log(`[BACKEND] Deleting related event ${group.event_id}`);
        await pb.collection('events').delete(group.event_id);
      }
      if (group.agenda_id) {
        console.log(`[BACKEND] Deleting related agenda ${group.agenda_id}`);
        await pb.collection('agenda').delete(group.agenda_id);
      }

      // We don't need to update the group if it's being deleted from frontend,
      // but if the frontend calls this BEFORE deleting the group, we detach:
      await pb.collection('groups').update(groupId, { event_id: null, agenda_id: null });
      console.log('[BACKEND] SUCCESS: Related entities deleted & detached.');

      return res.json({ success: true, action: 'delete', groupId });
    }
  } catch (error) {
    console.error('!!! [BACKEND] CRITICAL SYNC ERROR !!!');
    console.error(error);
    if (error.response) console.error('PocketBase Response:', error.response);
    
    return res.status(500).json({ 
      error: error.message || 'Internal server error during sync',
      details: error.response || null
    });
  }
});

export default router;