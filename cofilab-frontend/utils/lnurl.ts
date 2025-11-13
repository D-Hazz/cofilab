// src/utils/lnurl.ts

import { bech32 } from 'bech32';

/**
 * Encode une URL HTTPS complète en une chaîne LNURL (Bech32).
 * @param url L'URL HTTPS complète.
 * @returns La chaîne LNURL encodée (e.g., 'lnurl1dp68...').
 */
export function encodeLnurl(url: string): string {
    // 1. Convertir l'URL en minuscules pour la conformité Bech32.
    const lowerUrl = url.toLowerCase();
    
    // 2. Convertir la chaîne en un Buffer/Array de bytes.
    // L'encodage UTF-8 est la norme pour la conversion de chaîne vers Buffer.
    const buffer = Buffer.from(lowerUrl, 'utf8');

    // 3. Convertir les bytes (8 bits) en "words" pour Bech32 (5 bits).
    const words = bech32.toWords(buffer);

    // 4. Encoder en Bech32 avec le HRP 'lnurl'.
    const lnurlString = bech32.encode('lnurl', words, 1023); 
    
    return lnurlString;
}