/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("agenda");
  collection.indexes.push("CREATE INDEX idx_agenda_group_id ON agenda (group_id)");
  collection.indexes.push("CREATE INDEX idx_agenda_event_id ON agenda (event_id)");
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("agenda");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_agenda_group_id"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_agenda_event_id"));
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})