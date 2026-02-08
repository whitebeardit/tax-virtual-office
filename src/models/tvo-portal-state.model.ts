/**
 * Model Mongoose para collection tvo-portal-state
 *
 * Substitui agents/.cache/portal-state.json
 * Documento singleton com estado de deduplicação dos portais.
 */

import mongoose, { Schema, type InferSchemaType } from "mongoose";

const TvoPortalStateSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    lastRun: { type: Date },
    seen: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: "tvo-portal-state" }
);

export const TvoPortalStateModel = mongoose.model(
  "TvoPortalState",
  TvoPortalStateSchema
);
export type TvoPortalStateDoc = InferSchemaType<typeof TvoPortalStateSchema>;
