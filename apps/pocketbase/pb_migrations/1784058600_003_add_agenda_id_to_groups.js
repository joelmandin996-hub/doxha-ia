/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const agendaCollection = app.findCollectionByNameOrId("agenda");
  const collection = app.findCollectionByNameOrId("groups");

  const existing = collection.fields.getByName("agenda_id");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("agenda_id"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "agenda_id",
    required: false,
    collectionId: agendaCollection.id,
    maxSelect: 1
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("groups");
    collection.fields.removeByName("agenda_id");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})