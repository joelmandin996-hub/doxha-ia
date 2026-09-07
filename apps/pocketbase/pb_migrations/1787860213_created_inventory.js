/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const usersCollection = app.findCollectionByNameOrId("users");
  const categoriesCollection = app.findCollectionByNameOrId("inventory_categories");

  // transactions_depenses acts as the "facture" (invoice/receipt) source from Budget.
  let depensesCollection;
  try {
    depensesCollection = app.findCollectionByNameOrId("transactions_depenses");
  } catch (_) {
    throw new Error("transactions_depenses collection not found — inventory invoice link requires it");
  }

  let collection;
  try {
    collection = app.findCollectionByNameOrId("inventory");
  } catch (_) {
    collection = new Collection({
      type: "base",
      name: "inventory",
      listRule: "created_by = @request.auth.id",
      viewRule: "created_by = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "created_by = @request.auth.id",
      deleteRule: "created_by = @request.auth.id",
      fields: [
        {
          autogeneratePattern: "[a-z0-9]{15}",
          id: "text2200000001",
          max: 15,
          min: 15,
          name: "id",
          pattern: "^[a-z0-9]+$",
          primaryKey: true,
          required: true,
          system: true,
          type: "text",
        },
        { id: "text2200000002", name: "name", required: true, type: "text", max: 200 },
        {
          id: "relation2200000003",
          name: "category_id",
          required: true,
          type: "relation",
          maxSelect: 1,
          minSelect: 0,
          cascadeDelete: false,
          collectionId: categoriesCollection.id,
        },
        { id: "number2200000004", name: "quantity", required: true, type: "number", min: 0, onlyInt: false },
        { id: "text2200000005", name: "unit", type: "text", max: 30 },
        { id: "number2200000006", name: "min_quantity", type: "number", min: 0, onlyInt: false },
        { id: "text2200000007", name: "location", type: "text", max: 120 },
        { id: "date2200000008", name: "purchase_date", type: "date" },
        { id: "number2200000009", name: "purchase_price", type: "number", min: 0, onlyInt: false },
        { id: "text2200000010", name: "supplier", type: "text", max: 200 },
        {
          id: "relation2200000011",
          name: "invoice_id",
          type: "relation",
          maxSelect: 1,
          minSelect: 0,
          cascadeDelete: false,
          collectionId: depensesCollection.id,
        },
        { id: "text2200000012", name: "notes", type: "text", max: 1000 },
        {
          id: "relation2200000013",
          name: "created_by",
          required: true,
          type: "relation",
          maxSelect: 1,
          minSelect: 0,
          cascadeDelete: false,
          collectionId: usersCollection.id,
        },
        { id: "autodate2200000014", name: "created", onCreate: true, onUpdate: false, type: "autodate" },
        { id: "autodate2200000015", name: "updated", onCreate: true, onUpdate: true, type: "autodate" },
      ],
      indexes: [
        "CREATE INDEX idx_inventory_category_id ON inventory (category_id)",
        "CREATE INDEX idx_inventory_invoice_id ON inventory (invoice_id)",
        "CREATE INDEX idx_inventory_created_by ON inventory (created_by)",
      ],
    });
    app.save(collection);
  }
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("inventory");
    app.delete(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
