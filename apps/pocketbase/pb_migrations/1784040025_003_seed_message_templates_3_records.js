/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("message_templates");

  const record0 = new Record(collection);
    record0.id = "m28a8txusgpglgt";
    record0.set("name", "Bienvenue nouveau membre");
    record0.set("category", "Bienvenue");
    record0.set("content", "Bienvenue {{prenom}} ! Nous sommes heureux de vous accueillir dans notre communaut\u00e9 {{groupe}}. Votre date d'adh\u00e9sion : {{date_adhesion}}");
    record0.set("variables", ["prenom", "groupe", "date_adhesion"]);
    record0.set("message_types", ["SMS", "Email", "WhatsApp"]);
    const record0_created_byLookup = app.findFirstRecordByFilter("users", "id != ''");
    if (!record0_created_byLookup) { throw new Error("Lookup failed for created_by: no record in 'users' matching \"id != ''\""); }
    record0.set("created_by", record0_created_byLookup.id);
  try {
    app.save(record0);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record1 = new Record(collection);
    record1.id = "upamq9g8ce35kei";
    record1.set("name", "Joyeux Anniversaire");
    record1.set("category", "Anniversaire");
    record1.set("content", "Joyeux anniversaire {{prenom}} ! Que cette ann\u00e9e soit remplie de b\u00e9n\u00e9dictions. Vous avez {{age}} ans aujourd'hui !");
    record1.set("variables", ["prenom", "age", "date_anniversaire"]);
    record1.set("message_types", ["SMS", "Email", "WhatsApp"]);
    const record1_created_byLookup = app.findFirstRecordByFilter("users", "id != ''");
    if (!record1_created_byLookup) { throw new Error("Lookup failed for created_by: no record in 'users' matching \"id != ''\""); }
    record1.set("created_by", record1_created_byLookup.id);
  try {
    app.save(record1);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record2 = new Record(collection);
    record2.id = "5q8lmbee79p2708";
    record2.set("name", "Rappel Service Dimanche");
    record2.set("category", "Rappel culte");
    record2.set("content", "Rappel : Service de dimanche \u00e0 {{heure}} \u00e0 {{lieu}}. Nous vous attendons ! Type : {{type_service}}");
    record2.set("variables", ["date", "heure", "lieu", "type_service"]);
    record2.set("message_types", ["SMS", "Email", "WhatsApp"]);
    const record2_created_byLookup = app.findFirstRecordByFilter("users", "id != ''");
    if (!record2_created_byLookup) { throw new Error("Lookup failed for created_by: no record in 'users' matching \"id != ''\""); }
    record2.set("created_by", record2_created_byLookup.id);
  try {
    app.save(record2);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }
}, (app) => {
  const seededRecordIds = ["5q8lmbee79p2708", "upamq9g8ce35kei", "m28a8txusgpglgt"];
  for (const seededRecordId of seededRecordIds) {
    try {
      app.delete(app.findRecordById("message_templates", seededRecordId));
    } catch (error) {
      if (error.message.includes("no rows in result set")) {
        continue;
      }
      throw error;
    }
  }
})