/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("suivis");
  collection.fields.removeByName("telephone");
  return app.save(collection);
}, (app) => {
  try {

  const collection = app.findCollectionByNameOrId("suivis");
  collection.fields.add(new TextField({
    name: "telephone",
    required: false,
    min: 0,
    max: 0
  }));
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})