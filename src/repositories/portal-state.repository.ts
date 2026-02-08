/**
 * Repositório para collection tvo-portal-state
 */

import { TvoPortalStateModel } from "../models/tvo-portal-state.model.js";

export interface PortalState {
  lastRun?: Date;
  seen: Record<string, string[]>;
}

const GLOBAL_KEY = "global";

export class PortalStateRepository {
  async findState(): Promise<PortalState | null> {
    const doc = await TvoPortalStateModel.findOne({ key: GLOBAL_KEY })
      .lean()
      .exec();
    if (!doc) return null;
    return {
      lastRun: doc.lastRun ? new Date(doc.lastRun) : undefined,
      seen: (doc.seen as Record<string, string[]>) || {},
    };
  }

  async upsertState(state: PortalState): Promise<void> {
    await TvoPortalStateModel.findOneAndUpdate(
      { key: GLOBAL_KEY },
      { $set: { lastRun: state.lastRun ?? new Date(), seen: state.seen } },
      { upsert: true }
    ).exec();
  }
}
