/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("suivis");
  collection.fields.removeByName("responsable_assigne");
  return app.save(collection);
}, (app) => {
  try {

  const _pb_users_auth_Collection = app.findCollectionByNameOrId("_pb_users_auth_");
  const collection = app.findCollectionByNameOrId("suivis");
  collection.fields.add(new RelationField({
    name: "responsable_assigne",
    required: false,
    collectionId: _pb_users_auth_Collection.id,
    maxSelect: 1,
    cascadeDelete: false
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