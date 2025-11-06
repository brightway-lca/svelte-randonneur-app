import { TRandoSectionId } from '@/src/core/types/rando';

export const sectionTitles: Record<TRandoSectionId, string> = {
  properties: 'Properties',
  // Plus basic data sets, based on `randoDataSetKeys`
  // Note: 'mapping' is excluded from sidebar (it's metadata, shown in Properties)
  'create-datasets': 'Create datasets',
  delete: 'Delete',
  disaggregate: 'Disaggregate',
  mapping: 'Mapping', // Keep for type completeness, but not shown in sidebar
  replace: 'Replace',
  update: 'Update',
};
