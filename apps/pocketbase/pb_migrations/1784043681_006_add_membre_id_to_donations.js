/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const membersCollection = app.findCollectionByNameOrId("members");
  const collection = app.findCollectionByNameOrId("donations");

  const existing = collection.fields.getByName("membre_id");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("membre_id"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "membre_id",
    required: true,
    collectionId: membersCollection.id,
    maxSelect: 1
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("donations");
    collection.fields.removeByName("membre_id");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})