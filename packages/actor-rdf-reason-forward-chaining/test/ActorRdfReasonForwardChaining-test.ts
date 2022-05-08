import { getContextSource } from '@comunica/bus-rdf-resolve-quad-pattern';
import { IActionRdfUpdateQuadsInfo, IActorRdfUpdateQuadsInfoOutput, MediatorRdfUpdateQuadsInfo } from '@comunica/bus-rdf-update-quads-info';
import { IActionRuleEvaluate, IActorRuleEvaluateOutput, MediatorRuleEvaluate } from '@comunica/bus-rule-evaluate';
import { KeysRdfResolveQuadPattern, KeysRdfUpdateQuads } from '@comunica/context-entries';
import { ActionContext, Bus } from '@comunica/core';
import { KeysRdfReason } from '@comunica/reasoning-context-entries';
import { IReasonGroup } from '@comunica/reasoning-types';
import { IActionContext } from '@comunica/types';
import * as RDF from '@rdfjs/types';
import { UnionIterator, single, AsyncIterator, wrap } from 'asynciterator';
import { Store, DataFactory } from 'n3';
import { forEachTerms, mapTerms } from 'rdf-terms';
import { Algebra } from 'sparqlalgebrajs';
import { ActorRdfReasonForwardChaining } from '../lib/ActorRdfReasonForwardChaining';
import { hasContextSingleSource, getContextSources } from '@comunica/bus-rdf-resolve-quad-pattern';
import { mediatorRuleResolve, mediatorOptimizeRule } from '@comunica/reasoning-mocks';
const { quad, namedNode } = DataFactory

describe('ActorRdfReasonForwardChaining', () => {
  let bus: any;
  let store: Store;
  let implicitDestination: Store;
  let reasoningGroup: IReasonGroup;
  let context: IActionContext;
  let mediatorRuleEvaluate: MediatorRuleEvaluate;
  let mediatorRdfUpdateQuadsInfo: MediatorRdfUpdateQuadsInfo;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('An ActorRdfReasonForwardChaining instance', () => {
    let actor: ActorRdfReasonForwardChaining;

    beforeEach(() => {
      implicitDestination = new Store();

      reasoningGroup = {
        status: { type: 'full', reasoned: false },
        dataset: implicitDestination,
        context: new ActionContext()
      }

      // @ts-ignore
      mediatorRuleEvaluate = {
        async mediate(action: IActionRuleEvaluate): Promise<IActorRuleEvaluateOutput> {
          function substituteQuad(term: RDF.Quad, mapping: Record<string, RDF.Term>): RDF.Quad {
            return mapTerms(term, elem => elem.termType === 'Variable' && elem.value in mapping ? mapping[elem.value] : elem);
          }

          const unvar = (term: RDF.Term) => term.termType !== 'Variable' ? term : null;

          function match(cause: RDF.Quad): AsyncIterator<RDF.Quad> {
            if (hasContextSingleSource(action.context)) {
              const source = getContextSource(action.context) as Store<any, any, any>;
              // @ts-ignore
              return source.match(unvar(cause.subject) as any, unvar(cause.predicate) as any, unvar(cause.object) as any, unvar(cause.graph) as any);
            } else {
              const res = getContextSources(action.context)!.map((source: any) => source.match(unvar(cause.subject) as any, unvar(cause.predicate) as any, unvar(cause.object) as any, unvar(cause.graph) as any));
              return new UnionIterator(res);
            }
          }

          const mappings = action.rule.premise.reduce(
            (iterator, premise) => new UnionIterator(iterator.map(
              mapping => {
                const cause = substituteQuad(premise, mapping);
                return wrap<RDF.Quad>(match(cause)).map((quad: RDF.Quad) => {
                  let localMapping: Record<string, RDF.Term> | undefined = {};

                  forEachTerms(cause, (term, key) => {
                    if (term.termType === 'Variable' && localMapping) {
                      if (term.value in localMapping && !localMapping[term.value].equals(quad[key])) {
                        localMapping = undefined;
                      } else {
                        localMapping[term.value] = quad[key];
                      }
                    }
                  });

                  return localMapping && Object.assign(localMapping, mapping);
                }).filter<Record<string, RDF.Term>>((_mapping): _mapping is Record<string, RDF.Term> => _mapping !== undefined);
              },
            ), { autoStart: false }),
            single<Record<string, RDF.Term>>({}) as AsyncIterator<Record<string, RDF.Term>>,
          )

          const { conclusion } = action.rule;

          if (!conclusion) {
            throw new Error('unexpected false conclusion');
          }

          const result = new UnionIterator(
            conclusion.map(
              quad => (conclusion.length > 1 ? mappings.clone() : mappings).map(mapping => substituteQuad(quad, mapping)),
            ),
            { autoStart: false },
          );

          return {
            results: result,
          }
        }
      }

      // @ts-ignore
      mediatorRdfUpdateQuadsInfo = {
        async mediate(action: IActionRdfUpdateQuadsInfo): Promise<IActorRdfUpdateQuadsInfoOutput> {
          return {
            execute: async () => {
              const dest: Store = action.context.getSafe<Store>(KeysRdfUpdateQuads.destination);
              console.log(dest.size)

              // TODO: Remove type casting once https://github.com/rdfjs/N3.js/issues/286 is merged
              let quadStreamInsert = action.quadStreamInsert?.filter(quad => dest.addQuad(quad) as unknown as boolean);

              hasContextSingleSource(action.context)

              if (action.filterSource) {
                if (hasContextSingleSource(action.context)) {
                  const source: Store = getContextSource(action.context) as Store;
                  quadStreamInsert = quadStreamInsert?.filter(quad => !source.has(quad));
                } else {
                  const sources = getContextSources(action.context) as Store[];
                  quadStreamInsert = quadStreamInsert?.filter(quad => sources.every(store => !store.has(quad)));
                }
                
              }

              return { quadStreamInsert };
            }
          }
        }
      }

      actor = new ActorRdfReasonForwardChaining({
        name: 'actor',
        bus,
        mediatorRuleEvaluate,
        mediatorRdfUpdateQuadsInfo,
        mediatorRuleResolve,
        mediatorOptimizeRule
        // TODO: Remove this once we do not require unecessary mediators
      } as any);
      store = new Store();
      context = new ActionContext({
        [KeysRdfResolveQuadPattern.source.name]: store,
        [KeysRdfReason.data.name]: reasoningGroup,
        [KeysRdfReason.rules.name]: 'my-unnested-rules'
      })
    });

    // it('should test', () => {
    //   // return expect(actor.test({ todo: true })).resolves.toEqual({ todo: true }); // TODO
    // });

    // it('should run with empty data', async () => {
    //   const { execute } = await actor.run({ context });
    //   await execute();
    //   expect(store.size).toEqual(0);
    //   expect(implicitDestination.size).toEqual(0);
    // });

    it('should run with data', async () => {
      store.add(quad(namedNode('s'), namedNode('http://example.org#a'), namedNode('o')));
      store.add(quad(namedNode('o'), namedNode('http://example.org#subsetOf'), namedNode('o2')));
      const { execute } = await actor.run({ context });
      await execute();
      expect(store.size).toEqual(2);
      // TODO: Fix this - it should not be zero
      expect(implicitDestination.size).toEqual(2);
    });
  });
});
