import { getErrorText } from '@/src/core/helpers/basic';
import { safeParseJson } from '@/src/core/helpers/data';
import { decompressGzip, isGzipFile } from '@/src/core/helpers/data/decompressGzip';

export interface TLoadDataFileProgressParams {
  /** Percents of loaded data amount */
  progress: number | undefined;
  loaded: number;
  total: number;
  fileReader: FileReader;
}

export interface TLoadDataFileOptions<T> {
  onProgress?: (params: TLoadDataFileProgressParams) => void;
  onLoaded?: (p: { data: T | unknown; fileReader: FileReader }) => void;
  onError?: (p: { error: Error; fileReader: FileReader }) => void;
  /** Async load waiting timeout (ms) */
  timeout?: number;
}

// TODO: Add possibility to cancel the loading for user?

interface TLoadedDataWithSize<T> {
  data: T;
  size: number;
}

export function loadDataFile<T = unknown>(
  file: File,
  opts: TLoadDataFileOptions<T> = {},
): Promise<TLoadedDataWithSize<T>> {
  const {
    name: fileName,
    // type: fileType,
    size: fileSize,
  } = file;
  const { onProgress, onLoaded, onError, timeout } = opts;
  const isCompressed = isGzipFile(fileName);
  return new Promise<TLoadedDataWithSize<T>>(function loadDataFile_promise(resolve, reject) {
    const fileReader = new FileReader();
    /* console.log('[loadDataFile:onloadend] start', {
     *   fileReader,
     *   // file,
     *   fileName,
     *   // fileType,
     *   // fileSize,
     * });
     */
    // Set load timeout (if specified)...
    let timeoutHandler: NodeJS.Timeout | undefined = timeout
      ? setTimeout(function loadDataFile_timeout() {
          // TODO: Ensure that abort processing correct in all the standard handlers below?
          fileReader.abort();
          const errMsg =
            'Timeout of ' + timeout + 'ms exceeded during upload of file "' + fileName + '"';
          const timeoutError = new Error(errMsg);
          // eslint-disable-next-line no-console
          console.error('[loadDataFile] timeout error', {
            timeoutError,
            timeout,
            fileName,
            fileReader,
          });
          debugger; // eslint-disable-line no-debugger
          if (onError) {
            onError({ error: timeoutError, fileReader });
          }
          return reject(timeoutError);
        }, timeout)
      : undefined;
    function finishLoading() {
      if (timeoutHandler) {
        clearTimeout(timeoutHandler);
        timeoutHandler = undefined;
      }
    }
    /* // TODO: Other events? @see: https://developer.mozilla.org/en-US/docs/Web/API/FileReader
     * - abort
     * - error
     * - load
     * - loadend
     * - loadstart
     * - progress
     */
    if (onProgress) {
      // Optional progress handler...
      fileReader.onprogress = function loadDataFile_onProgress(ev: ProgressEvent<FileReader>) {
        const {
          // isTrusted, // true
          // bubbles, // false
          // cancelBubble, // false
          // cancelable, // false
          // composed, // false
          // currentTarget, // FileReader {readyState: 2, result: '[\n  {\n    "producer_graph_id": 0,\n    "consumer_gr…_id": 53,\n    "amount": 0.07788214412864229\n  }\n]', error: null, onloadstart: null, onprogress: null, …}
          // defaultPrevented, // false
          // eventPhase, // 2
          lengthComputable, // true
          loaded, // 5878
          // returnValue, // true
          // srcElement, // FileReader {readyState: 2, result: '[\n  {\n    "producer_graph_id": 0,\n    "consumer_gr…_id": 53,\n    "amount": 0.07788214412864229\n  }\n]', error: null, onloadstart: null, onprogress: null, …}
          // target, // FileReader {readyState: 2, result: '[\n  {\n    "producer_graph_id": 0,\n    "consumer_gr…_id": 53,\n    "amount": 0.07788214412864229\n  }\n]', error: null, onloadstart: null, onprogress: null, …}
          // timeStamp, // 25930.29999998212
          total, // 5878
        } = ev;
        const progress = lengthComputable && total ? Math.round((loaded * 100) / total) : undefined;
        /* console.log('[loadDataFile] progress', {
         *   progress,
         *   fileName,
         *   lengthComputable, // true
         *   loaded, // 5878
         *   // target, // FileReader {readyState: 2, result: '[\n  {\n    "producer_graph_id": 0,\n    "consumer_gr…_id": 53,\n    "amount": 0.07788214412864229\n  }\n]', error: null, onloadstart: null, onprogress: null, …}
         *   total, // 5878
         *   ev,
         *   fileReader,
         * });
         */
        onProgress({ progress, loaded, total, fileReader });
      };
    }
    // Successfully data loaded handler...
    fileReader.onloadend = async function loadDataFile_onLoaded(ev: ProgressEvent<FileReader>) {
      const {
        // isTrusted, // true
        // bubbles, // false
        // cancelBubble, // false
        // cancelable, // false
        // composed, // false
        // currentTarget, // FileReader {readyState: 2, result: '[\n  {\n    "producer_graph_id": 0,\n    "consumer_gr…_id": 53,\n    "amount": 0.07788214412864229\n  }\n]', error: null, onloadstart: null, onprogress: null, …}
        // defaultPrevented, // false
        // eventPhase, // 2
        // lengthComputable, // true
        // loaded, // 5878
        // returnValue, // true
        // srcElement, // FileReader {readyState: 2, result: '[\n  {\n    "producer_graph_id": 0,\n    "consumer_gr…_id": 53,\n    "amount": 0.07788214412864229\n  }\n]', error: null, onloadstart: null, onprogress: null, …}
        target, // FileReader {readyState: 2, result: '[\n  {\n    "producer_graph_id": 0,\n    "consumer_gr…_id": 53,\n    "amount": 0.07788214412864229\n  }\n]', error: null, onloadstart: null, onprogress: null, …}
        // timeStamp, // 25930.29999998212
        // total, // 5878
      } = ev;
      try {
        let jsonText: string;
        
        if (isCompressed) {
          // For compressed files, result is ArrayBuffer
          const compressedData = target?.result as ArrayBuffer;
          if (!compressedData) {
            throw 'Received empty compressed data';
          }
          jsonText = await decompressGzip(compressedData);
        } else {
          // For regular files, result is string
          jsonText = target?.result as string;
        }
        
        // TODO: Catch parse errors...
        const data = jsonText && safeParseJson<T>(jsonText);
        if (!data) {
          throw 'Received empty data';
        }
        /* console.log('[loadDataFile] onloadend', {
         *   data,
         *   jsonText,
         *   // loaded, // 5878
         *   target, // FileReader {readyState: 2, result: '[\n  {\n    "producer_graph_id": 0,\n    "consumer_gr…_id": 53,\n    "amount": 0.07788214412864229\n  }\n]', error: null, onloadstart: null, onprogress: null, …}
         *   // total, // 5878
         *   ev,
         *   fileReader,
         *   fileName,
         * });
         */
        // TODO: Get and return file info also?
        if (onLoaded) {
          onLoaded({ data, fileReader });
        }
        return resolve({ data, size: jsonText.length });
      } catch (error) {
        const errMsg = [
          'Data processing error for file "' + fileName + '"',
          getErrorText(error as Error),
        ]
          .filter(Boolean)
          .join(': ');
        const dataError = new Error(errMsg);
        // eslint-disable-next-line no-console
        console.error('[loadDataFile] onloadend: get data error', {
          dataError,
          error,
        });
        debugger; // eslint-disable-line no-debugger
        if (onError) {
          onError({ error: dataError, fileReader });
        }
        return reject(dataError);
      } finally {
        finishLoading();
      }
    };
    // Error handler...
    fileReader.onerror = function loadDataFile_onError(ev: ProgressEvent<FileReader>) {
      const {
        // isTrusted, // true
        // bubbles, // false
        // cancelBubble, // false
        // cancelable, // false
        // composed, // false
        // currentTarget, // FileReader {readyState: 2, result: null, error: DOMException: A requested file or directory could not be found at the time an operation was process…, onloadstart: null, onprogress: null, …}
        // defaultPrevented, // false
        // eventPhase, // 2
        // lengthComputable, // false
        loaded, // 0
        // returnValue, // true
        // srcElement, // FileReader {readyState: 2, result: null, error: DOMException: A requested file or directory could not be found at the time an operation was process…, onloadstart: null, onprogress: null, …}
        target, // FileReader {readyState: 2, result: null, error: DOMException: A requested file or directory could not be found at the time an operation was process…, onloadstart: null, onprogress: null, …}
        // timeStamp, // 17715.90000000596
        // total, // 0
        type: errorType, // "error"
      } = ev;
      // eslint-disable-next-line no-console
      console.error('[loadDataFile] onerror', {
        fileName,
        loaded, // 0
        target, // FileReader {readyState: 2, result: null, error: DOMException: A requested file or directory could not be found at the time an operation was process…, onloadstart: null, onprogress: null, …}
        errorType, // "error"
        ev,
      });
      let resultError: Error;
      if (!target) {
        // Unknown (empty?) error
        const errMsg = 'Unknown data loading error for file "' + fileName + '"';
        resultError = new Error(errMsg);
      } else {
        // Error from event...
        const error = target.error;
        const errMsg = [
          'Data loading error for file "' + fileName + '"',
          getErrorText(error as Error),
        ]
          .filter(Boolean)
          .join(': ');
        resultError = new Error(errMsg);
      }
      // eslint-disable-next-line no-console
      console.error('[loadDataFile] onerror: event error', {
        // error,
        resultError,
      });
      debugger; // eslint-disable-line no-debugger
      if (onError) {
        onError({ error: resultError, fileReader });
      }
      finishLoading();
      return reject(resultError);
    };
    // Start loading...
    // For compressed files, read as array buffer; otherwise read as text
    if (isCompressed) {
      fileReader.readAsArrayBuffer(file);
    } else {
      fileReader.readAsText(file);
    }
  });
}
