/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("follow_ups");
  collection.fields.removeByName("pipeline_status");
  return app.save(collection);
}, (app) => {
  try {

  const collection = app.findCollectionByNameOrId("follow_ups");
  collection.fields.add(new SelectField({
    name: "pipeline_status",
    required: true,
    values: ["\u00c0 faire", "En cours", "Fait", "Annul\u00e9"],
    maxSelect: 1
  }));
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})