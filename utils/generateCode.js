import { customAlphabet } from "nanoid";

// No ambiguous chars (0/O, 1/I) to keep codes easy to read aloud/type at a noisy station.
const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const nano = customAlphabet(alphabet, 6);

export function generateSessionCode() {
  return `TRK-${nano()}`;
}
