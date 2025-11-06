import { get, writable } from 'svelte/store';

import { safeParseJson } from '@/src/core/helpers/data';
import { decompressGzip, isGzipFile } from '@/src/core/helpers/data/decompressGzip';
import { defaultDataFileIdx, demoDataFiles, demoDataPath } from '@/src/core/constants/demoData';

export const currentDemoDataFileIdx = writable<number>(defaultDataFileIdx);

export function getCurrentDemoDataFileIdx() {
  return get(currentDemoDataFileIdx);
}
export function getDemoDataName(idx: number) {
  return demoDataFiles[idx].filename;
}
export function getDemoDataFileUrl(idx: number) {
  const filename = getDemoDataName(idx);
  return demoDataPath + filename;
}
export function getDemoDataFileId(idx: number) {
  // const idx = getCurrentDemoDataFileIdx();
  return demoDataFiles[idx].id;
}

interface TLoadedDataWithSize<T> {
  data: T;
  size: number;
}

export function loadDemoDataByIdx<T = unknown>(idx: number): Promise<TLoadedDataWithSize<T>> {
  const dataUrl = getDemoDataFileUrl(idx);
  const filename = getDemoDataName(idx);
  const isCompressed = isGzipFile(filename);
  // const dataId = getDemoDataFileId(idx);
  /* console.log('[loadDemoData:loadDemoDataByIdx:start]', {
   *   dataUrl,
   * });
   */
  return fetch(dataUrl)
    .then(async (res) => {
      const { ok, status, statusText } = res;
      if (!ok) {
        // Something went wrong?
        const reason =
          [statusText, status && 'status: ' + status].filter(Boolean).join(', ') || 'Unknown error';
        const error = new Error('Data loading error: ' + reason);
        // eslint-disable-next-line no-console
        console.error('[loadDemoData:loadDemoDataByIdx]: error (on then)', {
          reason,
          res,
          dataUrl,
        });
        // eslint-disable-next-line no-debugger
        debugger;
        throw error;
      }
      /* console.log('[loadDemoData:loadDemoDataByIdx:start] success', {
       *   dataUrl,
       *   res,
       * });
       */
      // For compressed files, get array buffer and decompress; otherwise get text
      let jsonText: string;
      
      if (isCompressed) {
        const compressedData = await res.arrayBuffer();
        jsonText = await decompressGzip(compressedData);
      } else {
        // NOTE: `res.json()` could fail due to NaN in the data
        jsonText = await res.text();
      }
      
      const parsedData = jsonText && safeParseJson<T>(jsonText);
      if (!parsedData) {
        throw 'Received empty data';
      }
      const size = jsonText.length;
      return { data: parsedData, size };
    });
}
