import { get } from 'svelte/store';

import {
  TRandoDataSets,
  randoDataSetKeys,
  TRandoData,
  TRandoDataSetKey,
  TRandoSectionId,
} from '@/src/core/types/rando';

import { randoDataStore } from '../stores/randoDataStore';

import { clearAllRandoDataSetSpecs, createRandoDataSetSpec } from './randoDataSetSpecsActions';

import {
  allSectionsStore,
  randoDataSetsStores,
  currentSectionIdStore,
} from '../stores/randoDataSetsStore';

/** Extract randoneeur data sets from common data store */
export function extractRandoDataSets() {
  const randoData = get(randoDataStore);
  randoDataSetKeys.forEach((id: TRandoDataSetKey) => {
    const setStore = randoDataSetsStores[id];
    const data = randoData?.[id];
    // Set data into sets store...
    setStore.set(data);
    // Create data set specification (in dedicated store)...
    createRandoDataSetSpec(id, data);
  });

  // Set available sections list...
  const availableRandoDataSetKeys = getAvailableRandoDataSetKeys();
  const allSections: TRandoSectionId[] = [
    // prettier-ignore
    'properties',
    ...availableRandoDataSetKeys,
  ];
  allSectionsStore.set(allSections);

  // Set default current section id...
  const currentSectionId = get(currentSectionIdStore);
  if (
    currentSectionId !== allSections[0] &&
    (!currentSectionId || !allSections.includes(currentSectionId))
  ) {
    currentSectionIdStore.set(allSections[0]);
  }
}

export function clearRandoDataSets() {
  randoDataSetKeys.forEach((id: TRandoDataSetKey) => {
    const setStore = randoDataSetsStores[id];
    setStore.set(undefined);
  });
  clearAllRandoDataSetSpecs();
  allSectionsStore.set(undefined);
}

/** Save randoneeur data sets back to common data store */
export function saveRandoDataSets() {
  const updateSets = randoDataSetKeys.reduce((updateSets, id: TRandoDataSetKey) => {
    const setStore = randoDataSetsStores[id];
    const data = get(setStore);
    updateSets[id] = data;
    return updateSets;
  }, {} as TRandoDataSets);
  randoDataStore.update((randoData) => {
    return {
      ...randoData,
      ...updateSets,
    } as TRandoData;
  });
}

export function getAvailableRandoDataSetKeys(): TRandoDataSetKey[] {
  return randoDataSetKeys
    .map((id: TRandoDataSetKey) => {
      const setStore = randoDataSetsStores[id];
      const data = get(setStore);
      return data && id;
    })
    .filter(Boolean)
    .filter((id) => id !== 'mapping') as TRandoDataSetKey[]; // Exclude mapping from sidebar (it's metadata only)
}

export function getAllRandoDataSets() {
  return randoDataSetKeys.map((id: TRandoDataSetKey) => {
    const setStore = randoDataSetsStores[id];
    return get(setStore);
  });
}
