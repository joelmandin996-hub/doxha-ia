/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const budget_configCollection = app.findCollectionByNameOrId("budget_config");
  const collection = app.findCollectionByNameOrId("budget_categories");

  const existing = collection.fields.getByName("budget_config_id");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("budget_config_id"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "budget_config_id",
    required: true,
    collectionId: budget_configCollection.id,
    maxSelect: 1
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("budget_categories");
    collection.fields.removeByName("budget_config_id");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})