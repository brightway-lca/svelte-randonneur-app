<script lang="ts">
  import { colorScheme, ActionIcon, NumberInput } from '@svelteuidev/core';
  import { writable } from 'svelte/store';
  import { ArrowLeft, PinLeft, ArrowRight, PinRight } from 'radix-icons-svelte';
  import { TEditableListData, TEditableListSpec, TEditableObjectData, TGenericEditableSpec, TEditableObjectSpec } from '@/src/core/types/editable';
  import { getPlainTableColSpecs, makeFlatFromFullData } from '@/src/components/data/EditableTable/EditableTableHelpers';
  import { makeTitleFromPropertyId } from '@/src/core/helpers/data';
  import { ensureArray } from '@/src/core/helpers/basic';
  import { defaultPageSize, minPageSize } from '@/src/core/constants/rando';
  import classNames from 'classnames';
  import { diffWordsWithSpace } from 'diff';

  import styles from './SimpleTable.module.scss';
  import cssVariables from '@/src/core/assets/scss/variables.module.scss';

  $: isDark = $colorScheme === 'dark';

  export let className: string | undefined = undefined;
  export let spec: TEditableListSpec;
  export let data: TEditableListData = [];
  export let sectionId: string | undefined = undefined;

  // Check if this is disaggregate section
  $: isDisaggregate = sectionId === 'disaggregate';
  
  // Check if this is replace section (for diff highlighting)
  $: isReplace = sectionId === 'replace';

  // Expand disaggregate data and flatten for display
  // For disaggregate: each source row with targets array becomes multiple rows (one per target)
  $: flatData = (() => {
    if (!data || data.length === 0) {
      return [];
    }
    
    let dataToFlatten: TEditableListData;
    
    if (isDisaggregate) {
      const expanded: TEditableListData = [];
      for (const rowData of data) {
        const row = rowData as TEditableObjectData;
        // Check if this row has a targets array
        if (row.targets && Array.isArray(row.targets) && row.targets.length > 0) {
          // Create one row per target
          for (const target of row.targets) {
            const expandedRow: TEditableObjectData = { ...row };
            // Flatten the target object into the row as "target.*" (singular) to match expected schema
            if (target && typeof target === 'object' && !Array.isArray(target)) {
              Object.keys(target).forEach(key => {
                expandedRow[`target.${key}`] = (target as TEditableObjectData)[key];
              });
            }
            // Remove the original targets array as it's now flattened
            delete expandedRow.targets;
            expanded.push(expandedRow);
          }
        } else {
          // No targets array, keep as is
          expanded.push(row);
        }
      }
      dataToFlatten = expanded;
    } else {
      dataToFlatten = data;
    }
    
    // Flatten all rows for table display
    return (dataToFlatten as TEditableObjectData[]).map((rowData) =>
      makeFlatFromFullData(rowData),
    );
  })();

  // Pagination state
  const pageIndex = writable(0);
  const pageSize = writable(defaultPageSize);

  // Calculate pagination values
  $: totalCount = flatData.length;
  $: currentPageSize = $pageSize;
  $: pageCount = Math.ceil(totalCount / currentPageSize);
  $: currentPageIndex = $pageIndex;
  $: startIndex = currentPageIndex * currentPageSize;
  $: endIndex = Math.min(startIndex + currentPageSize, totalCount);
  // Skip pagination for contributors table - show all data
  $: paginatedData = spec.id === 'contributors' ? flatData : flatData.slice(startIndex, endIndex);
  $: hasPreviousPage = currentPageIndex > 0;
  $: hasNextPage = currentPageIndex < pageCount - 1;
  // Skip pagination for contributors table in properties
  $: allowPagination = totalCount >= minPageSize && spec.id !== 'contributors';

  // Navigation functions
  function goToPage(no: number) {
    if (no >= 0 && no < pageCount) {
      pageIndex.set(no);
    }
  }

  function goToFirst() {
    goToPage(0);
  }

  function goToLast() {
    goToPage(pageCount - 1);
  }

  function goToPrevious() {
    if (hasPreviousPage) {
      pageIndex.update(n => n - 1);
    }
  }

  function goToNext() {
    if (hasNextPage) {
      pageIndex.update(n => n + 1);
    }
  }

  // Reset to first page when page size changes
  let lastPageSize = $pageSize;
  $: {
    if ($pageSize !== lastPageSize) {
      lastPageSize = $pageSize;
      pageIndex.set(0);
    }
  }

  // Reset to first page if current page is out of bounds
  $: {
    if (pageCount > 0 && currentPageIndex >= pageCount) {
      pageIndex.set(Math.max(0, pageCount - 1));
    }
  }

  // Reset to first page when data changes
  let lastDataLength = 0;
  $: {
    const currentLength = flatData?.length || 0;
    if (currentLength !== lastDataLength) {
      lastDataLength = currentLength;
      pageIndex.set(0);
    }
  }

  const { defaultInputHeightPx } = cssVariables;
  const inputHeight = parseInt(defaultInputHeightPx);

  // Pagination display helpers
  $: lastPage = Math.max(0, pageCount - 1);
  const showDiam = 2;
  $: showStart = Math.max(0, currentPageIndex - showDiam);
  $: showEnd = Math.min(lastPage, currentPageIndex + showDiam);
  $: showCount = showEnd - showStart + 1;

  // Get column specifications (flat)
  // For disaggregate, scan flattened data to find any target.* fields not in the spec and add them
  $: colSpecs = (() => {
    const baseColSpecs = getPlainTableColSpecs(spec, spec.showFlatFields);
    // getPlainTableColSpecs should always return an array, but ensure it
    if (!Array.isArray(baseColSpecs)) {
      return [];
    }
    if (!isDisaggregate || !flatData || flatData.length === 0) {
      return baseColSpecs;
    }
    
    // Find all unique keys in the flattened data
    const allKeys = new Set<string>();
    for (const row of flatData) {
      Object.keys(row).forEach(key => allKeys.add(key));
    }
    
    // Find target.* fields that aren't already in the specs
    const existingSpecIds = new Set(baseColSpecs.map(s => s._flatId || s.id));
    const targetKeys = Array.from(allKeys).filter(key => 
      key.startsWith('target.') && !existingSpecIds.has(key)
    );
    
    if (targetKeys.length === 0) {
      return baseColSpecs;
    }
    
    // Extract the target field names (e.g., "target.name" -> "name")
    const targetFieldNames = new Set(targetKeys.map(key => key.substring(7))); // Remove "target." prefix
    
    // Create specs for the missing target fields
    const newSpecs: TGenericEditableSpec[] = [];
    for (const fieldName of targetFieldNames) {
      // Check what type of value it is from the first row that has it
      let fieldType: 'string' | 'number' | 'boolean' | 'date' | 'unknown' = 'string';
      for (const row of flatData) {
        const key = `target.${fieldName}`;
        const value = row[key];
        if (value !== undefined && value !== null) {
          if (typeof value === 'string') {
            fieldType = 'string';
          } else if (typeof value === 'number') {
            fieldType = 'number';
          } else if (typeof value === 'boolean') {
            fieldType = 'boolean';
          } else if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
            fieldType = 'date';
          }
          break;
        }
      }
      
      const flatId = `target.${fieldName}`;
      const hdrIds = ['target', fieldName];
      const newSpec: TGenericEditableSpec = {
        id: fieldName,
        type: fieldType as 'string' | 'number' | 'boolean' | 'date',
        _flatId: flatId,
      };
      // @ts-expect-error: Store hidden values for local usage
      newSpec._hdrIds = hdrIds;
      // @ts-expect-error: Store hidden values for local usage
      newSpec._hdrTitles = hdrIds.map(makeTitleFromPropertyId);
      newSpecs.push(newSpec);
    }
    
    // Combine base specs with new target specs, placing target specs after source specs
    // For disaggregate, exclude "targets" (plural) since we've expanded it into target.* fields
    const sourceSpecs = baseColSpecs.filter(s => {
      const flatId = s._flatId || s.id;
      const id = s.id.toLowerCase();
      // Exclude target.* fields and "targets" (plural) field for disaggregate
      if (flatId.startsWith('target.')) {
        return false;
      }
      if (isDisaggregate && (id === 'targets' || flatId === 'targets')) {
        return false;
      }
      return true;
    });
    const existingTargetSpecs = baseColSpecs.filter(s => {
      const flatId = s._flatId || s.id;
      return flatId.startsWith('target.');
    });
    
    return [...sourceSpecs, ...existingTargetSpecs, ...newSpecs];
  })();

  // Build multilevel header structure from flat specs
  interface HeaderCell {
    text: string;
    colspan: number;
    rowspan: number;
    isTopLevel?: boolean; // True for level 0 headers (Source, Target, Other)
  }

  interface HeaderRow {
    cells: HeaderCell[];
    level: number; // Track the level of this row (0 = top level)
  }

  function buildMultilevelHeadersFromFlat(specs: TGenericEditableSpec[]): {
    headerRows: HeaderRow[];
    leafPaths: string[];
  } {
    if (!specs || !Array.isArray(specs) || specs.length === 0) {
      return { headerRows: [], leafPaths: [] };
    }
    
    // Find max depth
    let maxDepth = 0;
    for (const spec of specs) {
      // @ts-expect-error: _hdrIds is a custom property
      const depth = (spec._hdrIds || [spec.id]).length;
      maxDepth = Math.max(maxDepth, depth);
    }

    const headerRows: HeaderRow[] = [];
    const leafPaths: string[] = specs.map(s => s._flatId || s.id);

    // Known top-level group names (typically "source", "target", "targets")
    // For disaggregate, recognize both "target" (singular, from flattened data) and "targets" (plural, from original spec)
    const knownTopLevelGroups = isDisaggregate 
      ? ['source', 'target', 'targets'] 
      : ['source', 'target'];
    
    // For disaggregate sections, use "Targets" instead of "Other"
    const otherGroupName = isDisaggregate ? 'Targets' : 'Other';

    // Build rows from top to bottom
    for (let level = 0; level < maxDepth; level++) {
      const row: HeaderRow = { cells: [], level };
      
      if (level === maxDepth - 1) {
        // Last row - leaf columns (one per spec)
        for (const spec of specs) {
          const title = spec.title || spec.label || makeTitleFromPropertyId(spec.id);
          row.cells.push({ text: title, colspan: 1, rowspan: 1 });
        }
      } else {
        // Parent rows - group consecutive specs by their prefix at this level
        let i = 0;
        
        // Special handling for level 0: group unknown prefixes into "Other"
        if (level === 0) {
          while (i < specs.length) {
            const spec = specs[i];
            // @ts-expect-error: _hdrIds is a custom property
            const hdrIds = spec._hdrIds || [spec.id];
            
            if (level >= hdrIds.length - 1) {
              // This spec doesn't have a parent at level 0
              // For disaggregate, skip target.* columns and "targets" (plural) here (they'll be grouped separately or excluded)
              const firstId = hdrIds[0]?.toLowerCase();
              if (isDisaggregate && (firstId === 'target' || firstId === 'targets')) {
                // Skip this spec - target.* will be handled in the normal grouping logic below
                // "targets" (plural) should be excluded entirely for disaggregate
                i++;
                continue;
              }
              
              // Collect all consecutive specs without a level 0 parent (excluding target.* and targets for disaggregate)
              let colspan = 0;
              let j = i;
              while (j < specs.length) {
                const s = specs[j];
                // @ts-expect-error: _hdrIds is a custom property
                const sHdrIds = s._hdrIds || [s.id];
                if (level >= sHdrIds.length - 1) {
                  const sFirstId = sHdrIds[0]?.toLowerCase();
                  // Skip target.* columns and "targets" in disaggregate - they'll be grouped separately or excluded
                  if (isDisaggregate && (sFirstId === 'target' || sFirstId === 'targets')) {
                    break;
                  }
                  colspan++;
                  j++;
                } else {
                  break;
                }
              }
              
              if (colspan > 0) {
                row.cells.push({ text: otherGroupName, colspan, rowspan: 1, isTopLevel: true });
                i = j;
              } else {
                i++;
              }
              continue;
            }
            
            const prefix = hdrIds.slice(0, level + 1).join('.');
            const firstId = hdrIds[0].toLowerCase();
            
            // For disaggregate sections at level 0, use "Targets" for "target" prefix
            let groupTitle = hdrIds.map(makeTitleFromPropertyId)[level];
            if (isDisaggregate && level === 0 && firstId === 'target') {
              groupTitle = 'Targets';
            }
            
            // Count consecutive specs that share the same prefix at this level
            let colspan = 0;
            let j = i;
            while (j < specs.length) {
              const s = specs[j];
              // @ts-expect-error: _hdrIds is a custom property
              const sHdrIds = s._hdrIds || [s.id];
              
              // Check if this spec belongs to the same group at this level
              if (level >= sHdrIds.length - 1) {
                // This spec doesn't have a parent at this level, it's not part of any group
                break;
              }
              
              const sPrefix = sHdrIds.slice(0, level + 1).join('.');
              if (sPrefix === prefix) {
                colspan++;
                j++;
              } else {
                // Different group, stop counting
                break;
              }
            }
            
            if (colspan > 0) {
              const isTopLevel = level === 0 && knownTopLevelGroups.includes(firstId);
              row.cells.push({ text: groupTitle, colspan, rowspan: 1, isTopLevel });
              i = j; // Move to the next group
            } else {
              i++;
            }
          }
        } else {
          // For non-top-level rows, use the original logic
          while (i < specs.length) {
            const spec = specs[i];
            // @ts-expect-error: _hdrIds is a custom property
            const hdrIds = spec._hdrIds || [spec.id];
            
            if (level >= hdrIds.length - 1) {
              // This spec doesn't have a parent at this level, skip it
              i++;
              continue;
            }
            
            const prefix = hdrIds.slice(0, level + 1).join('.');
            const groupTitle = hdrIds.map(makeTitleFromPropertyId)[level];
            
            // Count consecutive specs that share the same prefix at this level
            let colspan = 0;
            let j = i;
            while (j < specs.length) {
              const s = specs[j];
              // @ts-expect-error: _hdrIds is a custom property
              const sHdrIds = s._hdrIds || [s.id];
              
              // Check if this spec belongs to the same group at this level
              if (level >= sHdrIds.length - 1) {
                // This spec doesn't have a parent at this level, it's not part of any group
                break;
              }
              
              const sPrefix = sHdrIds.slice(0, level + 1).join('.');
              if (sPrefix === prefix) {
                colspan++;
                j++;
              } else {
                // Different group, stop counting
                break;
              }
            }
            
            if (colspan > 0) {
              row.cells.push({ text: groupTitle, colspan, rowspan: 1 });
              i = j; // Move to the next group
            } else {
              i++;
            }
          }
        }
      }
      
      if (row.cells.length > 0) {
        headerRows.push(row);
      }
    }

    return { headerRows, leafPaths };
  }

  // Build header structure (reactive, depends on colSpecs)
  $: headerStructure = buildMultilevelHeadersFromFlat(colSpecs || []);
  $: headerRows = headerStructure?.headerRows || [];
  $: leafPaths = headerStructure?.leafPaths || [];

  // Helper function to get nested value from flat data
  function getValue(obj: TEditableObjectData, path: string | undefined): unknown {
    if (!path) return undefined;
    // For flat data, the path is already the key in the object
    return obj[path];
  }
  
  // Check if a row starts a new source group (for disaggregate visual segmentation)
  function isNewSourceGroup(currentRow: TEditableObjectData, previousRow: TEditableObjectData | undefined, rowIndex: number): boolean {
    if (!isDisaggregate || rowIndex === 0 || !previousRow) {
      return rowIndex === 0;
    }
    
    // Compare source fields - if any source field differs, it's a new group
    // Find all source.* paths
    const sourcePaths = leafPaths.filter(path => path.startsWith('source.'));
    
    for (const path of sourcePaths) {
      const currentValue = getValue(currentRow, path);
      const previousValue = getValue(previousRow, path);
      if (currentValue !== previousValue) {
        return true;
      }
    }
    
    return false;
  }

  // Format value for display
  function formatValue(value: unknown, path?: string): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    // Special formatting for Allocation field in Targets section
    if (path && typeof value === 'number') {
      const pathLower = path.toLowerCase();
      if (pathLower.includes('allocation') && pathLower.startsWith('target.')) {
        return formatAllocationNumber(value);
      }
    }
    
    return String(value);
  }
  
  // Format allocation number nicely (round and use scientific notation when needed)
  function formatAllocationNumber(num: number): string {
    if (num === 0) {
      return '0';
    }
    
    const absNum = Math.abs(num);
    
    // Use scientific notation for very small numbers (< 0.001) or very large numbers (> 1000000)
    if (absNum < 0.001 || absNum > 1000000) {
      // Use toExponential with 3 significant digits
      const expStr = num.toExponential(3);
      // Remove + sign from exponent if present (for consistency)
      return expStr.replace(/e\+/, 'e');
    }
    
    // For numbers in normal range, round to appropriate decimal places
    if (absNum >= 1) {
      // For numbers >= 1, use up to 3 decimal places
      return num.toFixed(3).replace(/\.?0+$/, '');
    } else if (absNum >= 0.01) {
      // For 0.01 to 0.999, use 4 decimal places
      return num.toFixed(4).replace(/\.?0+$/, '');
    } else {
      // For 0.001 to 0.009, use 5 decimal places
      return num.toFixed(5).replace(/\.?0+$/, '');
    }
  }

  // Simple text diff: find text that was removed from source and added to target
  // Returns segments with removed and added flags for styling
  function computeTextDiff(sourceText: string, targetText: string): Array<{ text: string; removed: boolean; added: boolean }> {
    if (!sourceText || !targetText) {
      return [{ text: targetText || sourceText || '', removed: false, added: false }];
    }
    
    if (sourceText === targetText) {
      return [{ text: targetText, removed: false, added: false }];
    }
    
    // If both values are UUID-like, only compare equality and avoid diffing
    // Accept UUIDs with optional surrounding whitespace
    const uuidRegex = /^\s*[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}\s*$/;
    const isSourceUuid = uuidRegex.test(sourceText);
    const isTargetUuid = uuidRegex.test(targetText);
    if (isSourceUuid && isTargetUuid) {
      // Treat as exact match or no diff highlight at all when different
      return sourceText.trim() === targetText.trim()
        ? [{ text: targetText, removed: false, added: false }]
        : [];
    }
    
    // Use diff library's diffWordsWithSpace which preserves whitespace
    const diff = diffWordsWithSpace(sourceText, targetText);
    
    // Map diff library format to our expected format
    return diff.map(part => ({
      text: part.value,
      removed: part.removed === true,
      added: part.added === true
    }));
  }


  // Get corresponding path (source <-> target)
  function getCorrespondingPath(path: string): string | null {
    if (path.startsWith('target.')) {
      const subPath = path.substring(7); // Remove "target." prefix
      return `source.${subPath}`;
    } else if (path.startsWith('source.')) {
      const subPath = path.substring(7); // Remove "source." prefix
      return `target.${subPath}`;
    }
    return null;
  }

  // Get diff data for a cell (returns null if no diff, or diff segments if diff needed)
  // Returns 'match' if values are exactly the same
  function getCellDiff(row: TEditableObjectData, path: string): Array<{ text: string; removed: boolean; added: boolean }> | 'match' | null {
    // Apply diff formatting to both Replace and Disaggregate sections
    if (!isReplace && !isDisaggregate) {
      return null;
    }
    
    // Check if this is a source or target column
    const isTarget = path.startsWith('target.');
    const isSource = path.startsWith('source.');
    
    if (!isTarget && !isSource) {
      return null;
    }
    
    const correspondingPath = getCorrespondingPath(path);
    if (!correspondingPath) {
      return null;
    }
    
    const value = getValue(row, path);
    const formatted = formatValue(value, path);
    const correspondingValue = getValue(row, correspondingPath);
    const correspondingFormatted = formatValue(correspondingValue, correspondingPath);
    
    if (typeof correspondingFormatted === 'string' && typeof formatted === 'string' && correspondingFormatted && formatted) {
      if (correspondingFormatted === formatted) {
        // Values are exactly the same - show green italic for both source and target
        return 'match';
      } else if (isTarget) {
        // Manual check: if the only difference is a trailing comma at the end of a grapheme/word
        const sourceNoTrailingComma = correspondingFormatted.replace(/,\s*$/, '');
        const targetNoTrailingComma = formatted.replace(/,\s*$/, '');
        
        if (sourceNoTrailingComma === targetNoTrailingComma && sourceNoTrailingComma.length > 0) {
          // Check if one has trailing comma and the other doesn't
          const sourceHasComma = /,\s*$/.test(correspondingFormatted);
          const targetHasComma = /,\s*$/.test(formatted);
          
          if (sourceHasComma && !targetHasComma) {
            // Comma was removed - show only the comma as removed
            return [
              { text: targetNoTrailingComma, removed: false, added: false },
              { text: ',', removed: true, added: false },
            ];
          } else if (!sourceHasComma && targetHasComma) {
            // Comma was added - show only the comma as added
            return [
              { text: sourceNoTrailingComma, removed: false, added: false },
              { text: ',', removed: false, added: true },
            ];
          }
        }
        
        // Compute diff for target columns (showing removed and added text)
        const diff = computeTextDiff(correspondingFormatted, formatted);
        // Only apply diff formatting if there's some commonality (unremoved segments)
        const hasCommonality = diff.some(segment => !segment.removed && !segment.added);
        return hasCommonality ? diff : null;
      }
      // Source columns only get match highlighting (return null for differences)
    }
    
    return null;
  }
</script>

<div class={classNames(className, styles.SimpleTable, 'SimpleTable', isDark && styles.dark)}>
  {#if spec.label}
    <div class={styles.Label}>{spec.label}</div>
  {/if}
  <div class={styles.TableWrapper}>
    <table class={styles.Table}>
      <thead>
        {#each headerRows as headerRow, rowIdx}
          <tr>
        {#each headerRow.cells as cell}
          <th
            class={classNames(
              styles.HeaderCell,
              cell.isTopLevel && styles.HeaderCellTopLevel
            )}
            colspan={cell.colspan}
            rowspan={cell.rowspan}
          >
            {cell.text}
          </th>
        {/each}
          </tr>
        {/each}
      </thead>
      <tbody>
        {#each paginatedData as row, rowIndex (rowIndex)}
          {@const prevRow = rowIndex > 0 ? paginatedData[rowIndex - 1] : undefined}
          {@const isNewGroup = isNewSourceGroup(row, prevRow, rowIndex)}
          <tr class={classNames(isNewGroup && styles.NewSourceGroup)}>
            {#each leafPaths as path}
              {@const value = getValue(row, path)}
              {@const formatted = formatValue(value, path)}
              {@const diff = getCellDiff(row, path)}
              <td class={styles.Cell}>
                {#if diff === 'match'}
                  <span class={styles.DiffMatch}>{formatted}</span>
                {:else if diff && Array.isArray(diff) && diff.length > 0}
                  {#each diff as segment, segmentIdx (segmentIdx)}
                    {#if segment.removed === true}
                      <span class={styles.DiffRemoved}>{segment.text}</span>
                    {:else if segment.added === true}
                      <span class={styles.DiffAdded}>{segment.text}</span>
                    {:else}
                      {segment.text}
                    {/if}
                  {/each}
                {:else}
                  {formatted}
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  {#if flatData.length === 0}
    <div class={styles.EmptyMessage}>No data available</div>
  {/if}

  <!-- Pagination and stats -->
  {#if allowPagination}
    <div class={classNames(styles.PaginationAndStats)}>
      <div class={classNames(styles.Pagination)}>
        <div class={classNames(styles.Icons, (hasPreviousPage || hasNextPage) && styles.hasPagination)}>
          <ActionIcon
            class={classNames(styles.Icon, styles.IconGoTo)}
            size={inputHeight}
            variant="light"
            title="First page"
            disabled={currentPageIndex === 0}
            on:click={goToFirst}
          >
            <PinLeft />
          </ActionIcon>
          <ActionIcon
            class={classNames(styles.Icon, styles.IconGoTo)}
            size={inputHeight}
            variant="light"
            title="Previous page"
            disabled={!hasPreviousPage}
            on:click={goToPrevious}
          >
            <ArrowLeft />
          </ActionIcon>

          {#if showStart > 0}
            <div class={styles.Info}>...</div>
          {/if}

          {#each { length: showCount } as _, n}
            <ActionIcon
              class={classNames(
                styles.Icon,
                styles.IconPage,
                showStart + n === currentPageIndex && styles.IconCurrent,
              )}
              size={inputHeight}
              variant={showStart + n === currentPageIndex ? 'filled' : 'default'}
              title={'Page ' + (showStart + n + 1)}
              on:click={() => goToPage(showStart + n)}
            >
              {showStart + n + 1}
            </ActionIcon>
          {/each}

          {#if showEnd < lastPage}
            <div class={styles.Info}>...</div>
          {/if}

          <ActionIcon
            class={classNames(styles.Icon, styles.IconGoTo)}
            size={inputHeight}
            variant="light"
            title="Next page"
            disabled={!hasNextPage}
            on:click={goToNext}
          >
            <ArrowRight />
          </ActionIcon>
          <ActionIcon
            class={classNames(styles.Icon, styles.IconGoTo)}
            size={inputHeight}
            variant="light"
            title="Last page"
            disabled={currentPageIndex === lastPage}
            on:click={goToLast}
          >
            <PinRight />
          </ActionIcon>
        </div>
        <div class={styles.Controls}>
          <label for="pageSize">Page size:</label>
          <NumberInput
            class={styles.pageSize}
            id="pageSize"
            min={minPageSize}
            bind:value={$pageSize}
            placeholder="Page size"
          />
        </div>
      </div>
      <div class={styles.Info}>
        <div class={styles.PaginationInfo}>
          {#if pageCount}
            Displayed page <strong>{currentPageIndex + 1}</strong> out of <strong>{pageCount}</strong>, records:
            <strong>{paginatedData.length}</strong>
          {:else}
            Nothing to display
          {/if}
          {#if totalCount > 0}
            (total records: <strong>{totalCount}</strong>)
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style src="./SimpleTable.module.scss" lang="scss"></style>

