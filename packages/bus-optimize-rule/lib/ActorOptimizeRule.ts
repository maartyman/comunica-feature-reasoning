import { Rule } from '@comunica/bus-rule-parse';
import { Actor, IAction, IActorArgs, IActorOutput, IActorTest, Mediator } from '@comunica/core';
import { Algebra } from 'sparqlalgebrajs';
import { ActionContext } from '@comunica/types';

/**
 * A comunica actor for optimizing reasoning rules
 *
 * Actor types:
 * * Input:  IActionOptimizeRule:      TODO: fill in.
 * * Test:   <none>
 * * Output: IActorOptimizeRuleOutput: TODO: fill in.
 *
 * @see IActionOptimizeRule
 * @see IActorOptimizeRuleOutput
 */
export abstract class ActorOptimizeRule extends Actor<IActionOptimizeRule, IActorTest, IActorOptimizeRuleOutput> {
  public constructor(args: IActorArgs<IActionOptimizeRule, IActorTest, IActorOptimizeRuleOutput>) {
    super(args);
  }
}

export interface IActionOptimizeRule extends IAction {
  rules: Rule[];
  /**
   * An optional pattern to to restrict the rules to infer for
   */
  pattern?: Algebra.Pattern;
}

export interface IActorOptimizeRuleOutput extends IActorOutput {
  rules: Rule[];
  pattern?: Algebra.Pattern;
  context?: ActionContext;
}

export type MediatorOptimizeRule = Mediator<Actor<IActionOptimizeRule, IActorTest, IActorOptimizeRuleOutput>, IActionOptimizeRule, IActorTest, IActorOptimizeRuleOutput>;
