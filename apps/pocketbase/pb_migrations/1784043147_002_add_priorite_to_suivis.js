/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("suivis");

  const existing = collection.fields.getByName("priorite");
  if (existing) {
    if (existing.type === "select") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("priorite"); // exists with wrong type, remove first
  }

  collection.fields.add(new SelectField({
    name: "priorite",
    required: true,
    values: ["urgent", "normal", "basse"]
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("suivis");
    collection.fields.removeByName("priorite");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})