/// <reference path="../pb_data/types.d.ts" />
onRecordEnrich((e) => {
  // This hook runs when follow_ups records are serialized
  // It helps identify records that still have old status values
  // The actual migration should be done via a one-time script or manual process
  e.next();
}, "follow_ups");

// Note: To complete the migration from old select values to stage IDs:
// 1. Create pipeline stages for each old status value:
//    - "À faire" → stage with name "À faire"
//    - "En cours" → stage with name "En cours"
//    - "Fait" → stage with name "Fait"
//    - "Annulé" → stage with name "Annulé"
// 2. Run a script to update follow_ups records:
//    - Query all follow_ups records
//    - For each record, find the matching stage by old status name
//    - Update pipeline_status field with the stage ID
// 3. This hook serves as a placeholder for the migration process