// schemas/IndividualInventorySchema.js

import mongoose from "mongoose";

// Este esquema NO es un modelo, sino la estructura para un subdocumento.
const IndividualInventorySchema = new mongoose.Schema(
  {
    // Referencia al ítem en el catálogo de inventario maestro
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },

    // Cantidad del ítem que posee el instalador
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0, // La cantidad no puede ser negativa
    },

    // Fecha de la última actualización de este ítem para este instalador
    lastUpdate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false, // No se necesita un ID único para cada entrada de inventario personal
  }
);

export default IndividualInventorySchema;
