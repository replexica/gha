import dotenv from 'dotenv';

dotenv.config();

import { ReplexicaEngine } from '@replexica/sdk';

const engine = new ReplexicaEngine({
  apiKey: process.env.REPLEXICA_API_KEY,
});

const text = 'HELLO';

const localizedTexts = await engine.batchLocalizeText(
  'Hello, world!',
  { 
    sourceLocale: 'en',
    targetLocales: ['es', 'fr', 'de'],
    fast: true // optional
  }
);
// Returns an array of translations in the requested order:
// ['¡Hola Mundo!', 'Bonjour le monde!', 'Hallo Welt!']

console.log(localizedTexts);

