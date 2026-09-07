/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("suivis");
  collection.fields.removeByName("priorite");
  return app.save(collection);
}, (app) => {
  try {

  const collection = app.findCollectionByNameOrId("suivis");
  collection.fields.add(new SelectField({
    name: "priorite",
    required: true,
    values: ["urgent", "important", "normal", "faible"],
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