/**
 * Testes do PortalStateRepository com mongodb-memory-server
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import {
  connectTestDb,
  teardownTestDb,
  clearCollections,
} from "../../../tests/helpers/test-db.js";
import { PortalStateRepository } from "../../repositories/portal-state.repository.js";

describe("PortalStateRepository", () => {
  const repo = new PortalStateRepository();

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  it("deve retornar null quando estado não existe", async () => {
    const state = await repo.findState();
    expect(state).toBeNull();
  });

  it("deve fazer upsert e findState", async () => {
    const state = {
      seen: { "portal-1": ["hash1", "hash2"], "portal-2": ["hash3"] },
      lastRun: new Date("2025-02-07T12:00:00Z"),
    };
    await repo.upsertState(state);

    const found = await repo.findState();
    expect(found).toBeDefined();
    expect(found?.seen).toEqual(state.seen);
    expect(found?.lastRun).toBeDefined();
    expect(found?.lastRun?.toISOString()).toBe("2025-02-07T12:00:00.000Z");
  });

  it("deve atualizar estado existente", async () => {
    await repo.upsertState({
      seen: { portal: ["hash1"] },
      lastRun: new Date("2025-02-07T10:00:00Z"),
    });

    await repo.upsertState({
      seen: { portal: ["hash1", "hash2"] },
      lastRun: new Date("2025-02-07T12:00:00Z"),
    });

    const found = await repo.findState();
    expect(found?.seen.portal).toEqual(["hash1", "hash2"]);
  });

  it("deve persistir estado vazio", async () => {
    await repo.upsertState({ seen: {}, lastRun: undefined });

    const found = await repo.findState();
    expect(found).toBeDefined();
    expect(found?.seen).toEqual({});
    expect(found?.lastRun).toBeDefined();
  });
});
