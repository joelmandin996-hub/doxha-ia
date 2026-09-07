/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("social_tokens");

  const existing = collection.fields.getByName("token_status");
  if (existing) {
    if (existing.type === "select") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("token_status"); // exists with wrong type, remove first
  }

  collection.fields.add(new SelectField({
    name: "token_status",
    required: false,
    values: ["active", "expired", "revoked"]
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("social_tokens");
    collection.fields.removeByName("token_status");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})