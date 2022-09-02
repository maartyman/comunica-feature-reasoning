import type { IActionDereference, IActorDereferenceOutput, IActorDereferenceArgs } from '@comunica/bus-dereference';
import { ActorDereference } from '@comunica/bus-dereference';
import type { IActorTest } from '@comunica/core';

const Streamify = require('streamify-string');

/**
 * A comunica n3 from string Dereference Actor.
 */
export class ActorDereferenceN3String extends ActorDereference {
  public constructor(args: IActorDereferenceArgs) {
    super(args);
  }

  public async test(action: IActionDereference): Promise<IActorTest> {
    const regEx = new RegExp(`(?:\\{(?:\\n*)(?:\\s*` +
      `(?:(?:(?:\\?\\w+)|(?:(?:<https?:\\/\\/)\\S*>)|(?:\\w+:\\w+)|a)\\s*){3}` +
      `\\.\\s*\\n*)+(?:\\n*)\\}\\s*\\n*\\s*=>\\s*\\n*\\s*\\{(?:\\n*)(?:\\s*` +
      `(?:(?:(?:\\?\\w+)|(?:(?:<https?:\\/\\/)\\S*>)|(?:\\w+:\\w+)|a)\\s*){3}` +
      `\\.\\s*\\n*)+(?:\\n*)\\}\\s*\\.)`, `gmu`);
    if (regEx.test(action.url)) {
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
