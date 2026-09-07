/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pipeline_stages");
  collection.indexes.push("CREATE UNIQUE INDEX idx_pipeline_stages_name_created_by ON pipeline_stages (name, created_by)");
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("pipeline_stages");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_pipeline_stages_name_created_by"));
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})