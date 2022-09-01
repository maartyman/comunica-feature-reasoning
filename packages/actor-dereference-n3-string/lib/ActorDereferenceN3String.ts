import type { IActionDereference, IActorDereferenceOutput, IActorDereferenceArgs } from '@comunica/bus-dereference';
import { ActorDereference } from '@comunica/bus-dereference';
import type { IActorTest } from '@comunica/core';
import { KeysRdfDereferenceConstantHylar } from '@comunica/reasoning-context-entries';

const Streamify = require('streamify-string');

/**
 * A comunica n3 from string Dereference Actor.
 */
export class ActorDereferenceN3String extends ActorDereference {
  public constructor(args: IActorDereferenceArgs) {
    super(args);
  }

  public async test(action: IActionDereference): Promise<IActorTest> {
    // eslint-disable-next-line no-console
    console.log(`maarten N3: ${action.url}`);
    // eslint-disable-next-line require-unicode-regexp,max-len
    if (/(?:{\n*(?:\s*(?:(?:(?:\?\w+)|(?:<https?:\/\/\S*>)|(?:\w+:\w+)|a)\s*){3}\.\s*\n*)+\n*}\s*\n*\s*=>\s*\n*\s*{\n*(?:\s*(?:(?:(?:\?\w+)|(?:<https?:\/\/\S*>)|(?:\w+:\w+)|a)\s*){3}\.\s*\n*)+\n*}\s*\.)/.test(action.url)) {
      // eslint-disable-next-line no-console
      console.log(`maarten: true`);
      return true;
    }
    throw new Error(`This actor requires the url to be set to a N3 string`);
  }

  public async run(action: IActionDereference): Promise<IActorDereferenceOutput> {
    return {
      data: Streamify(action.url),
      url: 'custom.n3',
      requestTime: 0,
      exists: true,
    };
  }
}

const data = `
{?s a <http://xmlns.com/foaf/0.1/Person> . } => {?s a <https://schema.org/Person> . } . 
`;
