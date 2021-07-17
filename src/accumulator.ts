import { execute, MCFunction, MCFunctionOptions, MultipleEntitiesArgument, ObjectiveArgument, say, Score, scoreboard, SingleEntityArgument } from "sandstone";
import { BASIC_CONFLICT_STRATEGIES } from "sandstone/generalTypes";


const bymax = (name: string, objective: ObjectiveArgument, entity: SingleEntityArgument, executor: (value: number) => void, max: number, factor: number, conflict?: BASIC_CONFLICT_STRATEGIES) => {
  return MCFunction(`${name}/root`, () => {
    for (let i = max; max >= 0 ? i >= 1 : i <= -1; i = Math.trunc(i / factor)) {
      const loop = MCFunction(`${name}/${i}`, () => {
        executor(i);
        (max <= 0 ? scoreboard.players.add : scoreboard.players.remove)(entity, objective, Math.abs(i));
        if(i === max) {
          execute.if.score(entity, objective, 'matches', max >= 0 ? [i,] : [,i]).run(loop);
        }
      })
      execute.if.score(entity, objective, 'matches', max >= 0 ? [i,] : [,i]).run(loop);
    }
  }, { onConflict: conflict });
};

export type Polarity = '+' | '-' | '+-' | '-+' | 1 | -1 | 0;
export interface AccumulatorOptions {
  onConflict: BASIC_CONFLICT_STRATEGIES;
  polarity: Polarity;
  max: number;
  factor: number;
}

export const Accumulator = (name: string, objective: ObjectiveArgument, entity: SingleEntityArgument, executor: (value: number) => void, options?: Partial<AccumulatorOptions>) => {
  const pol = options?.polarity ?? 0;
  const numlarity = typeof pol === 'string' ? pol.length === 2 ? 0 : pol === '+' ? 1 : -1 : pol;
  
  const negative = numlarity !== 1;
  const single = numlarity !== 0;

  const macks = Math.trunc(options?.max ?? 256);

  if (single) {
    return bymax(name, objective, entity, executor, macks * (negative ? -1 : 1), options?.factor ?? 2, options?.onConflict);
  }

  return MCFunction(`${name}/root`, () => {
    execute.if.score(entity, objective, 'matches', [,-1]).run(bymax(`${name}/negative`, objective, entity, executor, macks * -1, options?.factor ?? 2, options?.onConflict));
    execute.if.score(entity, objective, 'matches', [1,]).run(bymax(`${name}/positive`, objective, entity, executor, macks, options?.factor ?? 2, options?.onConflict));
  }, { onConflict: options?.onConflict });
};