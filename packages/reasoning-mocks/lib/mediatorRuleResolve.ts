import { KeysRdfReason } from '@comunica/bus-rdf-reason';
import type { IActionRuleResolve, IActorRuleResolveOutput, MediatorRuleResolve } from '@comunica/bus-rule-resolve';
import type { Rule } from '@comunica/reasoning-types';
import { quad, variable, namedNode } from '@rdfjs/data-model';
import { fromArray } from 'asynciterator';

export const mediatorRuleResolve = <MediatorRuleResolve> {
  async mediate(action: IActionRuleResolve): Promise<IActorRuleResolveOutput> {
    const ruleString: string = action.context.get(KeysRdfReason.rules)!;
    return {
      data: fromArray<Rule>(RULES[ruleString]),
    };
  },
};

const RULES: Record<string, Rule[]> = {
  'my-unnested-rules': [
    {
      ruleType: 'premise-conclusion',
      premise: [
        quad(
          variable('?s'),
          namedNode('http://example.org#a'),
          variable('?o'),
          variable('?g'),
        ),
        quad(
          variable('?o'),
          namedNode('http://example.org#subsetOf'),
          variable('?o2'),
          variable('?g'),
        ),
      ],
      conclusion: [
        quad(
          variable('?s'),
          namedNode('http://example.org#a'),
          variable('?o2'),
          variable('?g'),
        ),
      ],
    },
    {
      ruleType: 'premise-conclusion',
      premise: [
        quad(
          variable('?s'),
          namedNode('http://example.org#a'),
          variable('?o'),
          variable('?g'),
        ),
      ],
      conclusion: [
        quad(
          variable('?o'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Class'),
          variable('?g'),
        ),
      ],
    },
  ],
  'my-nested-rules': [
    {
      ruleType: 'nested-premise-conclusion',
      premise: [
        quad(
          variable('?s'),
          namedNode('http://example.org#a'),
          variable('?o'),
          variable('?g'),
        ),
      ],
      conclusion: [
        quad(
          variable('?o'),
          namedNode('http://example.org#a'),
          namedNode('http://example.org#Class'),
          variable('?g'),
        ),
      ],
      next: {
        premise: [
          quad(
            variable('?o'),
            namedNode('http://example.org#subsetOf'),
            variable('?o2'),
            variable('?g'),
          ),
        ],
        conclusion: [
          quad(
            variable('?s'),
            namedNode('http://example.org#a'),
            variable('?o2'),
            variable('?g'),
          ),
        ],
      },
    },
  ],
};