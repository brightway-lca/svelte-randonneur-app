/** Basic randonneur data properties
 * @see https://specs.frictionlessdata.io/data-package/#metadata
 */
export interface TRandoProperties {
  // Properties...
  name: string; // 'ecoinvent-3.8-to-3.9-biosphere-example'
  version: string; // '1.0.0'
  description: string; // 'Small example file showing the randoneeur data format. Extracted from the ecoinvent 3.8 to 3.9 migration.'
  homepage: string; // 'https://github.com/Depart-de-Sentier/happy_family'
  licenses: unknown[]; // (4) [{…}, {…}, {…}, {…}]
  contributors: unknown[]; // (8) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
  created: string; // '2023-03-11T09:53:59.74Z'
  mapping?: unknown; // Mapping configuration (metadata, not a data section)
  source_id?: string; // Source database identifier
  target_id?: string; // Target database identifier
  graph_context?: unknown[]; // Graph context types
}
export type TRandoPropertiesSlot = TRandoProperties | undefined;

// Specific set types...

/* Expected datasets:
 *
 * @see https://github.com/brightway-lca/randonneur#migrating-exchanges
 * @see https://randonneur.readthedocs.io/en/latest/#data-format
 *
 * // (key, varaiable, type)
 *
 * create-datasets	createDatasetsSet	TCreateDatasetsSet
 * delete	deleteSet	TDeleteSet
 * disaggregate	disaggregateSet	TDisaggregateSet
 * mapping	mappingSet	TMappingSet
 * replace	replaceSet	TReplaceSet
 * update	updateSet	TUpdateSet
 *
 * Unused sets:
 *
 * create-exchanges	createExchangesSet	TCreateExchangesSet
 *
 * // Parse regexp: ^ \* \(\S\+\)\t\(\w\+\)\t\(\w\+\)
 */

export const randoDataSetKeys = [
  'create-datasets',
  'delete',
  'disaggregate',
  'mapping',
  'replace',
  'update',
] as const;
export type TRandoDataSetKey = (typeof randoDataSetKeys)[number];

// Define basic low-level data node...
type TDataSetDictKey = string | number | symbol;
type TDataSetDictItemScalar = string | number | boolean | undefined;
type TDataSetDictItemAny = TDataSetDictItemScalar | Record<TDataSetDictKey, TDataSetDictItemScalar>;
// interface TDataSetDictItemAnyArray extends Array<TDataSetDictItemAny> {}
// type TDataSetDictItemValue = TDataSetDictItemAny | TDataSetDictItemAnyArray;
export type TDataSetDictItemValue = TDataSetDictItemAny | TDataSetDictItemAny[] | undefined;
// type TDataSetDictItemDict = Record<TDataSetDictKey, TDataSetDictItemValue>;
// interface TDataSetDictItemDict extends Record<TDataSetDictKey, TDataSetDictItemValue> {}
// interface TDataSetDictItemDict {
//   [key: TDataSetDictKey]: TDataSetDictItemValue;
// }
export type TDataSetDict = Record<TDataSetDictKey, TDataSetDictItemValue>;
// export type TDataSetDict = unknown;
export type TDataSetDictSlot = TDataSetDict | undefined;

/* // TODO: Unused detailed data set typings...
 * // Exchange data set types...
 * export type TCreateDatasetsSetItem = TDataSetDict;
 * export type TCreateExchangesSetItem = TDataSetDict; // UNUSED
 * export type TDeleteSetItem = TDataSetDict;
 * export type TMappingSetItem = TDataSetDict;
 * export type TReplaceSetItem = TDataSetDict;
 * export type TDisaggregateSetItem = TDataSetDict;
 * export type TUpdateSetItem = TDataSetDict;
 * [> // TODO: Detailed type definitions: to use only as a data structure references?
 *  * export interface TMappingSetItem {
 *  *   conversion_factor: number; // 1;
 *  *   comment: string; // 'Identical names'
 *  *   source: TDataSetDict;
 *  *   target: TDataSetDict;
 *  * }
 *  * export interface TReplaceSetItem {
 *  *   source: TDataSetDict;
 *  *   target: TDataSetDict;
 *  *   dataset?: TDataSetDict;
 *  * }
 *  * export interface TDisaggregateSetItem {
 *  *   source: TDataSetDict;
 *  *   target: TDataSetDict[];
 *  *   dataset?: TDataSetDict;
 *  * }
 *  * export interface TUpdateSetItem {
 *  *   source: TDataSetDict;
 *  *   target: TDataSetDict;
 *  *   dataset?: TDataSetDict;
 *  * }
 *  <]
 *
 * export type TCreateDatasetsSet = TCreateDatasetsSetItem[];
 * export type TCreateExchangesSet = TCreateExchangesSetItem[];
 * export type TDeleteSet = TDeleteSetItem[];
 * export type TDisaggregateSet = TDisaggregateSetItem[];
 * export type TMappingSet = TMappingSetItem[];
 * export type TReplaceSet = TReplaceSetItem[];
 * export type TUpdateSet = TUpdateSetItem[];
 *
 * export type TCreateDatasetsSlot = TCreateDatasetsSet | undefined;
 * export type TCreateExchangesSlot = TCreateExchangesSet | undefined;
 * export type TDeleteSlot = TDeleteSet | undefined;
 * export type TDisaggregateSlot = TDisaggregateSet | undefined;
 * export type TMappingSlot = TMappingSet | undefined;
 * export type TReplaceSlot = TReplaceSet | undefined;
 * export type TUpdateSlot = TUpdateSet | undefined;
 *
 * export interface TRandoDataSets {
 *   [>
 *    * Data sets regexp: \<\(create-datasets\|create-exchanges\|replace\|update\|delete\|disaggregate\|mapping\)\>
 *    <]
 *   'create-datasets': TCreateDatasetsSlot;
 *   'create-exchanges': TCreateExchangesSlot;
 *   delete: TDeleteSlot;
 *   disaggregate: TDisaggregateSlot;
 *   mapping: TMappingSlot;
 *   replace: TReplaceSlot;
 *   update: TUpdateSlot;
 * }
 */

/** Generic randonneur data sets */
export type TRandoDataSets = Record<TRandoDataSetKey, TDataSetDictSlot>;

/** Full randoneeur data */
export type TRandoData = TRandoProperties & TRandoDataSets;
export type TRandoDataSlot = TRandoData | undefined;

/* // Sample data object
 * const testData: TRandoData = {
 *   // Properties...
 *   name: '', // 'ecoinvent-3.8-to-3.9-biosphere-example'
 *   version: '', // '1.0.0'
 *   description: '', // 'Small example file showing the randoneeur data format. Extracted from the ecoinvent 3.8 to 3.9 migration.'
 *   homepage: '', // 'https://github.com/Depart-de-Sentier/happy_family'
 *   licenses: [], // (4) [{…}, {…}, {…}, {…}]
 *   contributors: [], // (8) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
 *   created: '', // '2023-03-11T09:53:59.74Z'
 *   // Data sets...
 *   'create-datasets': [], // (1) [{…}]
 *   'create-exchanges': [], // (1) [{…}]
 *   disaggregate: [],
 *   delete: [], // (1) [{…}]
 *   mapping: [], // (4800) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, …]
 *   replace: [], // (854) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, …]
 *   update: [], // (2) [{…}, {…}]
 * };
 */
