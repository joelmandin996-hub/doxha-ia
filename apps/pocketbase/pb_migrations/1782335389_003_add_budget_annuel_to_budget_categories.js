/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("budget_categories");

  const existing = collection.fields.getByName("budget_annuel");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("budget_annuel"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "budget_annuel",
    required: true,
    min: 0.01
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("budget_categories");
    collection.fields.removeByName("budget_annuel");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})