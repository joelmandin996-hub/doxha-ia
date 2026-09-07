/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("suivis");
  const field = collection.fields.getByName("type_suivi");
  field.name = "type";
  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("suivis");
    const field = collection.fields.getByName("type");
    if (!field) { console.log("Field not found, skipping revert"); return; }
    field.name = "type_suivi";
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection or field not found, skipping revert");
      return;
    }
    throw e;
  }
})