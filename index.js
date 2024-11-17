import dotenv from 'dotenv';

dotenv.config();

import { ReplexicaEngine } from '@replexica/sdk';

const engine = new ReplexicaEngine({
  apiKey: process.env.REPLEXICA_API_KEY,
});

const text = 'HELLO';

const result = await engine.localizeText(text, {
  sourceLocale: 'en',
  targetLocale: 'es',
});

console.log(result);
