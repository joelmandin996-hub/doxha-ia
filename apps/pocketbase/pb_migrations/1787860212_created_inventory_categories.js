/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const usersCollection = app.findCollectionByNameOrId("users");

  let collection;
  try {
    collection = app.findCollectionByNameOrId("inventory_categories");
  } catch (_) {
    collection = new Collection({
      type: "base",
      name: "inventory_categories",
      // Shared reference data: any authed user can read; owner can modify.
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "created_by = @request.auth.id",
      deleteRule: "created_by = @request.auth.id",
      fields: [
        {
          autogeneratePattern: "[a-z0-9]{15}",
          id: "text1100000001",
          max: 15,
          min: 15,
          name: "id",
          pattern: "^[a-z0-9]+$",
          primaryKey: true,
          required: true,
          system: true,
          type: "text",
        },
        { id: "text1100000002", name: "name", required: true, type: "text", max: 80 },
        { id: "text1100000003", name: "emoji", type: "text", max: 10 },
        { id: "text1100000004", name: "color", type: "text", max: 30 },
        { id: "text1100000005", name: "description", type: "text", max: 300 },
        {
          id: "relation1100000006",
          name: "created_by",
          required: true,
          type: "relation",
          maxSelect: 1,
          minSelect: 0,
          cascadeDelete: false,
          collectionId: usersCollection.id,
        },
        { id: "autodate1100000007", name: "created", onCreate: true, onUpdate: false, type: "autodate" },
        { id: "autodate1100000008", name: "updated", onCreate: true, onUpdate: true, type: "autodate" },
      ],
      indexes: [],
    });
    app.save(collection);
  }
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("inventory_categories");
    app.delete(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
