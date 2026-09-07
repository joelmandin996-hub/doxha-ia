/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const membersCollection = app.findCollectionByNameOrId("members");
  const collection = app.findCollectionByNameOrId("members");

  const existing = collection.fields.getByName("family_links");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("family_links"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "family_links",
    required: false,
    collectionId: membersCollection.id,
    maxSelect: 999
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("members");
    collection.fields.removeByName("family_links");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})