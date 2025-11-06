/**
 * Decompress GZIP data using the browser's Compression Streams API
 * @param compressedData - ArrayBuffer containing GZIP compressed data
 * @returns Promise that resolves to the decompressed text
 */
export async function decompressGzip(compressedData: ArrayBuffer): Promise<string> {
  try {
    // Check if DecompressionStream is available (modern browsers)
    if (typeof DecompressionStream !== 'undefined') {
      const stream = new DecompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      // Write the compressed data
      writer.write(compressedData);
      writer.close();
      
      // Read the decompressed data
      const chunks: Uint8Array[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          chunks.push(value);
        }
      }
      
      // Combine chunks into a single Uint8Array
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      // Convert to text
      const decoder = new TextDecoder();
      return decoder.decode(result);
    } else {
      throw new Error('DecompressionStream is not supported in this browser. Please use a modern browser or install a polyfill.');
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown decompression error';
    throw new Error(`Failed to decompress GZIP data: ${errMsg}`);
  }
}

/**
 * Check if a filename indicates a GZIP compressed file
 * @param filename - The filename to check
 * @returns true if the file appears to be GZIP compressed
 */
export function isGzipFile(filename: string): boolean {
  return filename.endsWith('.gz') || filename.endsWith('.gzip');
}

