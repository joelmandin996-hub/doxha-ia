/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("suivis");
  const field = collection.fields.getByName("lien_membre");
  field.name = "membre_id";
  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("suivis");
    const field = collection.fields.getByName("membre_id");
    if (!field) { console.log("Field not found, skipping revert"); return; }
    field.name = "lien_membre";
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection or field not found, skipping revert");
      return;
    }
    throw e;
  }
})