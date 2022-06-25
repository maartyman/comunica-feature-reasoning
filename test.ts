import { Parser } from 'n3';
import * as fs from 'fs';

const rules = fs.readFileSync('./rdfs-rules.n3').toString();

const parser = new Parser({ format: 'n3' });

console.log(parser.parse(rules))
