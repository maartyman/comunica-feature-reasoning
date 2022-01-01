import { IActionRdfReason, IActorRdfReasonOutput, IActorRdfReasonMediatedArgs, KeysRdfReason, ActorRdfReason } from '@comunica/bus-rdf-reason';
import { ActorRdfReasonMediated } from '@comunica/bus-rdf-reason';
import { IActorTest } from '@comunica/core';
import { MediatorRuleDereference } from '@comunica/bus-rule-dereference'
import { Store } from 'n3'
import { evaluateRuleSet, RestrictableRule } from './reasoner';
import streamifyArray = require('streamify-array');
import arrayifyStream = require('arrayify-stream');
import { defaultGraph, quad } from '@rdfjs/data-model';

/**
 * A comunica actor that 
 */
export class ActorRdfReasonRuleRestriction extends ActorRdfReasonMediated {
  public readonly mediatorRuleDereference: MediatorRuleDereference;
  public constructor(args: IActorRdfReasonRuleRestrictionArgs) {
    super(args);
  }

  public async test(action: IActionRdfReason): Promise<IActorTest> {
    if (!action.context?.has(KeysRdfReason.dataset) || !action.context?.has(KeysRdfReason.dataset)) {
      throw new Error('Missing dataset or rule context')
    }
    return true; // TODO implement
  }

  public async run(action: IActionRdfReason): Promise<IActorRdfReasonOutput> {
    const { context } = action;

    if (!context) {
      throw new Error('Context required for reasoning')
    }

    const store = new Store();
    let size = 0;
    // console.log('rule dereference', this.mediatorRuleDereference)
    const d = await this.mediatorRuleDereference.mediate({ url: context.get(KeysRdfReason.rules) })
    // console.log('---', d, '---')
    const r = await arrayifyStream(d.rules);
    // console.log(r)
    // console.log(r[0].premise)
    // console.log(r[0].conclusion)
    // const rules: RestrictableRule[] = context.get(KeysRdfReason.rules) ?? [];

    do {
      size = store.size;
      let reset = true
      const quadStreamInsert = evaluateRuleSet(r, this.unionQuadSource(context).match)
        .map(data => {
          // WORKAROUND For triple only sources
          const q = quad(data.subject, data.predicate, data.object, defaultGraph())
          
          if (!store.has(q) && reset){
            console.log(JSON.stringify(q, null, 2));
            reset = false;
          }
          store.addQuad(q);
          return q;
        });
      await this.runImplicitUpdate({ quadStreamInsert }, context);
      console.log('implicit size', store.size)
      // console.log(JSON.stringify(store.getQuads(null, null, null, null)))
    } while (store.size > size);

    return {
      reasoned: Promise.resolve(),
    }
  }
}

interface IActorRdfReasonRuleRestrictionArgs extends IActorRdfReasonMediatedArgs {
  mediatorRuleDereference: MediatorRuleDereference;
}