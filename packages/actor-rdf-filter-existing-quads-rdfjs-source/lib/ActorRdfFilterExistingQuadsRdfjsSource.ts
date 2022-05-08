import {
  ActorRdfFilterExistingQuads,
  IActionRdfFilterExistingQuads,
  IActorRdfFilterExistingQuadsOutput,
} from '@comunica/bus-rdf-filter-existing-quads';
import { IActorArgs, IActorTest } from '@comunica/core';
import { Store } from 'n3';
import { hasContextSingleSourceOfType, getContextSource } from '@comunica/bus-rdf-resolve-quad-pattern';

/**
 * A comunica RDFjs Source RDF Filter Existing Quads Actor.
 */
export class ActorRdfFilterExistingQuadsRdfjsSource extends ActorRdfFilterExistingQuads {
  public constructor(args: IActorArgs<IActionRdfFilterExistingQuads, IActorTest, IActorRdfFilterExistingQuadsOutput>) {
    super(args);
  }

  public async test(action: IActionRdfFilterExistingQuads): Promise<IActorTest> {
    if (action.filterDestination)
      throw new Error(`${this.name} does not handle filtering destinations`);

    if (!action.filterSource)
      throw new Error(`${this.name} expects filterSource to be true`);

    if (!hasContextSingleSourceOfType('rdfjsSource', action.context))
      throw new Error(`${this.name} expects a single source of type rdfjsSource`);

    return true;
  }

  public async run(action: IActionRdfFilterExistingQuads): Promise<IActorRdfFilterExistingQuadsOutput> {
    return {
      async execute() {
        const store: Store = getContextSource(action.context) as Store;
        return {
          quadStream: action.quadStream.filter(quad => !store.has(quad))
        }
      }
    }
  }
}