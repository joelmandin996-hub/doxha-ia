/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("evenements");
  collection.indexes.push("CREATE INDEX idx_evenements_created_by ON evenements (created_by)");
  collection.indexes.push("CREATE INDEX idx_evenements_statut ON evenements (statut)");
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("evenements");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_evenements_created_by"));
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_evenements_statut"));
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})