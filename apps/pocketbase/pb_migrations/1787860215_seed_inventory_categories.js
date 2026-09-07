/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("inventory_categories");

  const ownerLookup = app.findFirstRecordByFilter("users", "id != ''");
  if (!ownerLookup) {
    throw new Error("No user found to own seeded inventory categories");
  }

  const categories = [
    { id: "invcatlumiere01", name: "Lumière", emoji: "🔦", color: "amber", description: "Projecteurs, LED, ampoules, câbles lumière" },
    { id: "invcatson000001", name: "Son", emoji: "🔊", color: "sky", description: "Microphones, enceintes, amplificateurs, câbles son" },
    { id: "invcattech00001", name: "Technique", emoji: "🎛️", color: "violet", description: "Contrôleurs, mixeurs, accessoires techniques" },
    { id: "invcatelec00001", name: "Électrique", emoji: "🔌", color: "rose", description: "Câbles, prises, adaptateurs, rallonges" },
    { id: "invcatoutils001", name: "Outils", emoji: "🛠️", color: "emerald", description: "Tournevis, clés, outillage de maintenance" },
  ];

  for (const cat of categories) {
    const record = new Record(collection);
    record.id = cat.id;
    record.set("name", cat.name);
    record.set("emoji", cat.emoji);
    record.set("color", cat.color);
    record.set("description", cat.description);
    record.set("created_by", ownerLookup.id);
    try {
      app.save(record);
    } catch (e) {
      if (e.message.includes("Value must be unique")) {
        console.log("Category already exists, skipping: " + cat.name);
      } else {
        throw e;
      }
    }
  }
}, (app) => {
  const seededIds = ["invcatlumiere01", "invcatson000001", "invcattech00001", "invcatelec00001", "invcatoutils001"];
  for (const id of seededIds) {
    try {
      app.delete(app.findRecordById("inventory_categories", id));
    } catch (e) {
      if (e.message.includes("no rows in result set")) {
        continue;
      }
      throw e;
    }
  }
})
