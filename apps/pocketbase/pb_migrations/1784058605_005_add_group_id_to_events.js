/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const groupsCollection = app.findCollectionByNameOrId("groups");
  const collection = app.findCollectionByNameOrId("events");

  const existing = collection.fields.getByName("group_id");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("group_id"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "group_id",
    required: false,
    collectionId: groupsCollection.id,
    maxSelect: 1
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("events");
    collection.fields.removeByName("group_id");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})