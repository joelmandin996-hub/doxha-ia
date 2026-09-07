/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("evenements");
  const field = collection.fields.getByName("categorie");
  field.values = ["R\u00e9union de pri\u00e8re", "Cellule de maison", "Pr\u00e9dication sp\u00e9ciale", "Louange & Adoration", "Vie d'\u00c9glise", "Formation biblique", "\u00c9tude biblique", "Jeunesse", "Enfants", "Mariage", "Pr\u00e9sentation d'enfant", "Bapt\u00eame", "Visite pastorale", "Accompagnement", "Visite malade", "Mission & \u00c9vang\u00e9lisation", "Retraite spirituelle", "\u00c9v\u00e9nement sp\u00e9cial", "Repas fraternel", "R\u00e9union de responsables", "Conseil d'administration", "Collecte & Offrandes", "F\u00eate chr\u00e9tienne", "Conf\u00e9rence", "S\u00e9minaire", "Projet d'\u00c9glise", "B\u00e9n\u00e9volat & Service"];
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("evenements");
  const field = collection.fields.getByName("categorie");
  if (!field) { console.log("Field not found, skipping revert"); return; }
  field.values = ["culte", "cellule", "jeunesse", "formation", "special"];
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection or field not found, skipping revert");
      return;
    }
    throw e;
  }
})