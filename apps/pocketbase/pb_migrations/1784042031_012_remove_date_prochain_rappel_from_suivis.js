/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("suivis");
  collection.fields.removeByName("date_prochain_rappel");
  return app.save(collection);
}, (app) => {
  try {

  const collection = app.findCollectionByNameOrId("suivis");
  collection.fields.add(new DateField({
    name: "date_prochain_rappel",
    required: false
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