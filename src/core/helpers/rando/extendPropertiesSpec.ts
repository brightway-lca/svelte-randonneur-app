import { ensureArray, ucFirst } from '@/src/core/helpers/basic';
import {
  TEditableObjectSpec,
  // TEditableListSpec,
  // TGenericEditableData,
  TGenericEditableSpec,
} from '@/src/core/types/editable';

interface TExtendPropertiesSpecOpts {
  /** Don't add labels on this level */
  dontAddLabels?: boolean;
  /** Don't add titles on this level */
  dontAddTitles?: boolean;
  // makeHorizontalList?: boolean;
}

export function extendPropertiesSpec(
  spec: TGenericEditableSpec,
  level: number = 0,
  parentId: string = '',
  opts: TExtendPropertiesSpecOpts = {},
) {
  const { id, type } = spec;
  const thisId = [parentId, id].filter(Boolean).join('.');
  if (level && !spec.label && !opts.dontAddLabels) {
    spec.label = spec.title || ucFirst(id);
  }
  if (!spec.title && !opts.dontAddTitles) {
    spec.title = spec.label || ucFirst(id);
  }
  spec._fullId = thisId;
  // --@ts-expect-error: Using debug field
  spec._level = level;
  if (type === 'object' && spec.spec) {
    const subSpec = ensureArray(spec.spec);
    subSpec.forEach((itemSpec) => {
      extendPropertiesSpec(itemSpec, level + 1, thisId);
    });
  }
  if (type === 'list' && spec.spec) {
    const itemSpec = spec.spec;
    // Preserve existing layout if set, otherwise default to 'table' for object lists
    if (!spec.layout) {
      if (itemSpec.type === 'object') {
        spec.layout = 'table';
        spec.flatObjects = true;
        spec.editInPlace = false;
        spec.useActionsColumn = true;
        spec.activeRows = true;
        // Recursively extend object list items
        extendPropertiesSpec(itemSpec as TEditableObjectSpec, level + 1, thisId, {
          dontAddLabels: true,
        });
      } else {
        // Scalar items default to horizontal (no pagination)
        spec.layout = 'horizontal';
      }
    } else {
      // If layout is already set, still need to recursively extend if it's an object
      if (itemSpec.type === 'object') {
        extendPropertiesSpec(itemSpec as TEditableObjectSpec, level + 1, thisId, {
          dontAddLabels: true,
        });
      }
    }
  }
}
