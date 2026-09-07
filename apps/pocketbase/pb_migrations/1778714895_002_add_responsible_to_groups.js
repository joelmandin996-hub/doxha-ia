/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const membersCollection = app.findCollectionByNameOrId("members");
  const collection = app.findCollectionByNameOrId("groups");

  const existing = collection.fields.getByName("responsible");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("responsible"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "responsible",
    required: false,
    collectionId: membersCollection.id,
    maxSelect: 1
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("groups");
    collection.fields.removeByName("responsible");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})