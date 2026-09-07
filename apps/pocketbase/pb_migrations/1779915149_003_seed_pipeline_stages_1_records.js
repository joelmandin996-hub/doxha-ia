/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pipeline_stages");

  const record0 = new Record(collection);
    record0.set("name", "Test Stage");
    record0.set("color", "#3b82f6");
    record0.set("order", 0);
    const record0_created_byLookup = app.findFirstRecordByFilter("users", "id != ''");
    if (!record0_created_byLookup) { throw new Error("Lookup failed for created_by: no record in 'users' matching \"id != ''\""); }
    record0.set("created_by", record0_created_byLookup.id);
  try {
    app.save(record0);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }
}, (app) => {
  // Rollback: record IDs not known, manual cleanup needed
})