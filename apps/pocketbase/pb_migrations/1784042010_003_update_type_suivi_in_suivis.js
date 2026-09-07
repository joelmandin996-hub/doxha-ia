/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("suivis");
  const field = collection.fields.getByName("type_suivi");
  field.values = ["Nouveau membre", "Suivi pastoral", "Demande de pri\u00e8re", "Membre absent", "B\u00e9n\u00e9vole", "Formation", "Donateur", "Famille", "Jeunesse", "Enfant", "Visite", "Appel", "Rencontre", "Autre"];
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("suivis");
  const field = collection.fields.getByName("type_suivi");
  if (!field) { console.log("Field not found, skipping revert"); return; }
  field.values = ["pastoral", "visite_domicile", "appel", "email", "priere", "accompagnement", "soutien", "nouveau_membre", "nouveau_visiteur", "etude_biblique", "formation", "urgence"];
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection or field not found, skipping revert");
      return;
    }
    throw e;
  }
})