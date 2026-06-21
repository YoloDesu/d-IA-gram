/**
 * Reads a user-picked File as UTF-8 text. Wraps the callback-based FileReader in a promise so
 * the import flows can `await` a dropped/selected file instead of pasting its contents.
 *
 * @example
 *   const text = await readTextFile(input.files[0]);
 */
export function readTextFile(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error(`Falha ao ler o arquivo "${file.name}".`));
    reader.readAsText(file);
  });
}
