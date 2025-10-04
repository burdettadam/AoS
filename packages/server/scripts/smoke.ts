import { GamePhase } from "@ashes-of-salem/shared";
import { GameEngine } from "../src/game/engine";

const uuid = () =>
  `00000000-0000-4000-8000-00000000000${Math.floor(Math.random() * 10)}`;

async function main() {
  const engine = new GameEngine();
  const gameId = await engine.createGame("trouble-brewing");

  const st = await engine.addPlayer(gameId, uuid(), false);
  if (!st) throw new Error("failed to add storyteller");
  const s1 = await engine.addPlayer(gameId, uuid(), false);
  const s2 = await engine.addPlayer(gameId, uuid(), false);
  const _s3 = await engine.addPlayer(gameId, uuid(), false);
  const _s4 = await engine.addPlayer(gameId, uuid(), false);
  const _s5 = await engine.addPlayer(gameId, uuid(), false);
  const _s6 = await engine.addPlayer(gameId, uuid(), false);
  const g0 = engine.getGame(gameId)!;
  const storytellerSeatId = g0.storytellerSeatId!;

  const enter = await engine.enterSetup(gameId, storytellerSeatId);
  if (!enter.ok) throw new Error("enter setup failed");
  if (engine.getGame(gameId)!.phase !== GamePhase.SETUP)
    throw new Error("not in setup");

  const v = await engine.validateSetup(gameId, storytellerSeatId);
  if (!v.ok) throw new Error("validate failed");

  const done = await engine.completeSetup(gameId, storytellerSeatId);
  if (!done.ok) throw new Error("complete setup failed");
  const g1 = engine.getGame(gameId)!;
  if (g1.phase !== GamePhase.NIGHT || g1.day !== 1)
    throw new Error("bad phase after setup");

  const adv1 = await engine.advancePhase(gameId, storytellerSeatId);
  if (!adv1.ok || engine.getGame(gameId)!.phase !== GamePhase.DAY)
    throw new Error("advance to day failed");

  const adv2 = await engine.advancePhase(gameId, storytellerSeatId);
  if (!adv2.ok || engine.getGame(gameId)!.phase !== GamePhase.NOMINATION)
    throw new Error("advance to nomination failed");

  const nom = engine.nominate(gameId, s1!, s2!);
  if (!nom.ok) throw new Error("nomination failed");

  const adv3 = await engine.advancePhase(gameId, storytellerSeatId);
  if (!adv3.ok || engine.getGame(gameId)!.phase !== GamePhase.VOTE)
    throw new Error("advance to vote failed");

  const start = engine.startVote(gameId, storytellerSeatId);
  if (!start.ok) throw new Error("start vote failed");

  const seats = engine.getGame(gameId)!.seats.filter((s) => s.isAlive);
  for (const seat of seats) {
    if (seat.id === storytellerSeatId) continue;
    const r = engine.castVote(gameId, seat.id, true);
    if (!r.ok) throw new Error("cast vote failed");
  }

  const fin = engine.finishVote(gameId, storytellerSeatId);
  if (!fin.ok) throw new Error("finish vote failed");
  if (!("executed" in fin) || !fin.executed)
    throw new Error("execution did not occur");

  const adv4 = await engine.advancePhase(gameId, storytellerSeatId);
  if (!adv4.ok || engine.getGame(gameId)!.phase !== GamePhase.EXECUTION)
    throw new Error("advance to execution failed");
  const adv5 = await engine.advancePhase(gameId, storytellerSeatId);
  if (
    !adv5.ok ||
    engine.getGame(gameId)!.phase !== GamePhase.NIGHT ||
    engine.getGame(gameId)!.day !== 2
  )
    throw new Error("advance to night failed");

  // Success
  console.log("SMOKE PASS");
}

main().catch((e) => {
  console.error("SMOKE FAIL", e?.message || e);
  process.exit(1);
});
