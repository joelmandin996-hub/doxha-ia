/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const usersCollection = app.findCollectionByNameOrId("users");
  const inventoryCollection = app.findCollectionByNameOrId("inventory");

  let collection;
  try {
    collection = app.findCollectionByNameOrId("inventory_movements");
  } catch (_) {
    collection = new Collection({
      type: "base",
      name: "inventory_movements",
      listRule: "inventory_id.created_by = @request.auth.id",
      viewRule: "inventory_id.created_by = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "inventory_id.created_by = @request.auth.id",
      deleteRule: "inventory_id.created_by = @request.auth.id",
      fields: [
        {
          autogeneratePattern: "[a-z0-9]{15}",
          id: "text3300000001",
          max: 15,
          min: 15,
          name: "id",
          pattern: "^[a-z0-9]+$",
          primaryKey: true,
          required: true,
          system: true,
          type: "text",
        },
        {
          id: "relation3300000002",
          name: "inventory_id",
          required: true,
          type: "relation",
          maxSelect: 1,
          minSelect: 0,
          cascadeDelete: true,
          collectionId: inventoryCollection.id,
        },
        {
          id: "select3300000003",
          name: "type",
          required: true,
          type: "select",
          maxSelect: 1,
          values: ["entree", "sortie"],
        },
        { id: "number3300000004", name: "quantity", required: true, type: "number", min: 0.01, onlyInt: false },
        { id: "text3300000005", name: "reason", type: "text", max: 200 },
        { id: "date3300000006", name: "date", required: true, type: "date" },
        { id: "text3300000007", name: "notes", type: "text", max: 1000 },
        {
          id: "relation3300000008",
          name: "created_by",
          required: true,
          type: "relation",
          maxSelect: 1,
          minSelect: 0,
          cascadeDelete: false,
          collectionId: usersCollection.id,
        },
        { id: "autodate3300000009", name: "created", onCreate: true, onUpdate: false, type: "autodate" },
        { id: "autodate3300000010", name: "updated", onCreate: true, onUpdate: true, type: "autodate" },
      ],
      indexes: [
        "CREATE INDEX idx_inventory_movements_inventory_id ON inventory_movements (inventory_id)",
        "CREATE INDEX idx_inventory_movements_date ON inventory_movements (date)",
      ],
    });
    app.save(collection);
  }
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("inventory_movements");
    app.delete(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
