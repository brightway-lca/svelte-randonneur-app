<script context="module" lang="ts">
  type TCallback = () => void;
  export interface TEditableTableApi {
    resetFilters: TCallback;
    addDataRow: TCallback;
  }
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Modal } from '@svelteuidev/core';
  import { writable } from 'svelte/store';
  import {
    Render,
    Subscribe,
    createTable,
    createRender,
    DataLabel,
    HeaderLabel,
  } from 'svelte-headless-table';
  import {
    addPagination,
    addColumnFilters,
    // addColumnOrder,
    // addHiddenColumns,
    // addSortBy,
    // addTableFilter,
    // addExpandedRows,
    // matchFilter,
    // numberRangeFilter,
    // textPrefixFilter,
    // addSubRows,
    // addGroupBy,
    // addSelectedRows,
    // addResizedColumns,
  } from 'svelte-headless-table/plugins';
  import { PaginationState } from 'svelte-headless-table/lib/plugins/addPagination';
  import classNames from 'classnames';

  import { addToast } from '@/src/components/ui/Toasts';
  import {
    TEditableListSpec,
    TEditableListData,
    TGenericEditableData,
    TGenericEditableSpec,
    TEditableObjectData,
    TEditableObjectSpec,
  } from '@/src/core/types/editable';
  import {
    TCreateMultiLevelTableHeadersOpts,
    createMultiLevelTableColumns,
  } from '@/src/core/helpers/data';
  import { minPageSize, defaultPageSize } from '@/src/core/constants/rando';
  import { GenericEditable } from '@/src/components/data';
  import { ensureArray } from '@/src/core/helpers/basic';
  import { TFilterParams, TFilterValues } from '@/src/core/types/editable/TFilterParams';
  import { GenericFilterDialog } from '@/src/components/data/GenericFilterDialog';

  import {
    getFlatItemId,
    isScalarSpec,
    makeFlatFromFullData,
    restoreFullFromFlatData,
  } from './EditableTableHelpers';
  import { RowActions } from './RowActions';
  import { HeaderActions } from './HeaderActions';
  import { EditRowForm } from './EditRowForm';
  import { PaginationBlock } from './PaginationBlock';
  import { PaginationInfo } from './PaginationInfo';

  import styles from './EditableTable.module.scss';
  import { disappearTimeMs } from '@/src/core/assets/scss/parsedCssVariables';

  type TOnChangeCallback = (data: TEditableListData, spec: TEditableListSpec) => void;

  // External parameters...
  export let className: string | undefined = undefined;
  export let spec: TEditableListSpec;
  export let data: TEditableListData = [];
  export let onChange: TOnChangeCallback | undefined = undefined;
  export let setHasFilters: ((hasFilters: boolean) => void) | undefined = undefined;
  export let readonly: boolean = false;

  /** The table dom node */
  let tableElement: HTMLTableElement;

  const flatData: TEditableObjectData[] = data.map((rowData) =>
    makeFlatFromFullData(rowData as TEditableObjectData),
  );

  /** Local table data store */
  let tableFlatDataStore = writable<TEditableObjectData[]>(flatData);
  let tableFullDataStore = writable<TEditableObjectData[]>([...(data as TEditableObjectData[])]);

  $: allowPagination = $tableFullDataStore.length >= minPageSize;

  const colFilter = addColumnFilters<TEditableObjectData>();
  const tablePlugins = {
    colFilter,
    page: addPagination<TEditableObjectData>({
      initialPageSize: defaultPageSize,
    }),
  };
  /** Table object */
  const table = createTable(tableFlatDataStore, tablePlugins); // XXX

  // Get specification params...
  const {
    id,
    layout,
    // flatObjects, // Unused here
    showFlatFields, // TODO: It's possible to get `showFlatFields` list as an attrubute
    editInPlace,
    useActionsColumn,
    activeRows,
  } = spec;

  /** Flat hash of column header specs. Will be created in `createMultiLevelTableColumns`. */
  const multiLevelColSpecsHash: Record<string, TGenericEditableSpec> = {};

  /** Cell elements constructor */
  const EditableCell: DataLabel<TEditableObjectData> = ({ column, row, value }) => {
    const { id } = row; // as BodyRow<unknown>;
    const { accessorKey: colId } = column;
    if (!colId) {
      const errorMsg = 'Undefined column specification id';
      const error = new Error(errorMsg);
      // eslint-disable-next-line no-console
      console.error('[EditableTable:EditableCell]', errorMsg, {
        error,
        column,
        row,
        value,
      });
      // eslint-disable-next-line no-debugger
      debugger;
      throw error;
    }
    const colSpec = multiLevelColSpecsHash[colId];
    const rowIdx = parseInt(id);
    if (!editInPlace) {
      if (colSpec.type === 'list') {
        return value && Array.isArray(value) ? value.join(', ') : '';
      } else if (isScalarSpec(colSpec)) {
        return value != null ? value : '';
      }
    }
    return createRender(GenericEditable, {
      spec: colSpec,
      data: value,
      onChange: onUpdateItem.bind(null, rowIdx),
    });
  };

  const HeaderActionsCell: HeaderLabel<TEditableObjectData> = () => {
    return createRender(HeaderActions, {
      onAddRow: addDataRow,
    });
  };

  const RowActionCell: DataLabel<TEditableObjectData> = ({
    row,
    // column,
    // value,
  }) => {
    const { id } = row; // as BodyRow<unknown>;
    const rowIdx = parseInt(id);
    return createRender(RowActions, {
      spec: spec,
      onRemoveRow: onRemoveRow.bind(null, rowIdx),
    });
  };

  let activeFilterParams = writable<TFilterParams | undefined>(undefined);

  function openFilterDialog(filterParams: TFilterParams) {
    $activeFilterParams = filterParams;
  }
  function closeFilterDialog() {
    $activeFilterParams = undefined;
  }
  function resetFilter(filterParams: TFilterParams) {
    const { id } = filterParams;
    $filterValues[id] = undefined;
  }

  /** Row specification */
  const rowObjSpec = spec.spec as TEditableObjectSpec;
  /** Row item specifications */
  const createMultiLevelTableHeadersOpts: TCreateMultiLevelTableHeadersOpts = {
    showFlatFields,
    colSpecsHash: multiLevelColSpecsHash,
    EditableCell,
    // HeaderCell, // UNUSED
    table,
    listSpec: spec,
    onOpenFilter: openFilterDialog,
  };
  const multiLevelTableColumns = createMultiLevelTableColumns(
    ensureArray(rowObjSpec.spec),
    createMultiLevelTableHeadersOpts,
  );

  if (useActionsColumn) {
    const actionsColumn = table.column({
      accessor: '__actions',
      header: HeaderActionsCell,
      cell: RowActionCell,
    });
    multiLevelTableColumns.push(actionsColumn);
  }

  /** Table columns
   * @see https://svelte-headless-table.bryanmylee.com/docs/api/create-columns
   */
  const tableColumns = table.createColumns(multiLevelTableColumns);

  // Get render parameters...
  const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates } =
    table.createViewModel(tableColumns);

  const { filterValues } = pluginStates.colFilter;

  const hasFiltersStore = writable<boolean>(false);
  $: $hasFiltersStore = Object.values($filterValues).reduce<boolean>(
    (value, result) => !!(value || result),
    false,
  );
  $: setHasFilters && setHasFilters($hasFiltersStore);

  // Get pagination state (see `PaginationBlock` and `PaginationInfo`)...
  const paginationState: PaginationState = pluginStates.page;
  const {
    pageIndex,
    pageCount,
    // pageSize,
    // hasPreviousPage,
    // hasNextPage,
  } = paginationState;

  /** Local click tracker */
  let activeClickTimerHandler: ReturnType<typeof setTimeout> | undefined = undefined;
  const clickDelay = 200;
  function clearActiveClickTimer() {
    if (activeClickTimerHandler) {
      clearTimeout(activeClickTimerHandler);
      activeClickTimerHandler = undefined;
    }
  }
  function setActiveClickTimer() {
    clearActiveClickTimer();
    activeClickTimerHandler = setTimeout(clearActiveClickTimer, clickDelay);
  }
  function hasActiveClickTimer() {
    return !!activeClickTimerHandler;
  }

  // Data edit modal...

  let selectedRow = writable<number | undefined>(undefined);
  $: modalOpened = $selectedRow != null;

  function closeModal() {
    $selectedRow = undefined;
  }

  function stopEditRowData() {
    selectedRow.set(undefined);
  }
  function startEditRowData(rowIdx: number | undefined) {
    selectedRow.set(rowIdx);
  }

  // Handlers...

  const dispatch = createEventDispatcher();

  function triggerChange() {
    const data = $tableFullDataStore;
    if (onChange) {
      onChange(data, spec);
    }
    dispatch('change', { data, spec });
  }

  function onUpdateItem(rowIdx: number, data: TGenericEditableData, spec: TGenericEditableSpec) {
    // const { id } = spec;
    const flatId = getFlatItemId(spec);
    const currentFlatItem = $tableFlatDataStore[rowIdx];
    const newFlatItem = { ...currentFlatItem, [flatId]: data } as TEditableObjectData;
    const newFullItem = restoreFullFromFlatData(newFlatItem);
    // Update flat store...
    $tableFlatDataStore[rowIdx] = newFlatItem;
    $tableFlatDataStore = $tableFlatDataStore;
    // Update full store...
    $tableFullDataStore[rowIdx] = newFullItem;
    $tableFullDataStore = $tableFullDataStore;
    // Handle any server-synchronization.
    triggerChange();
  }

  function addDataRow() {
    setActiveClickTimer();
    // Update flat store...
    const newFlatItem: TEditableObjectData = {};
    const newFullItem = restoreFullFromFlatData(newFlatItem);
    $tableFlatDataStore = $tableFlatDataStore.concat(newFlatItem);
    // Update full store...
    $tableFullDataStore = $tableFullDataStore.concat(newFullItem);
    // Handle any server-synchronization.
    triggerChange();
    // Go to the last page...
    $pageIndex = $pageCount - 1;
    // Start animation effect for the row...
    setTimeout(() => {
      requestAnimationFrame(() => {
        // Found and highlight just added row...
        const itemNo = $tableFlatDataStore.length - 1;
        const itemNode = tableElement?.querySelector('tr[id="' + itemNo + '"]');
        if (itemNode) {
          itemNode.classList.toggle(styles.animation, true);
          setTimeout(() => {
            requestAnimationFrame(() => {
              itemNode.classList.toggle(styles.animation, false);
            });
          }, disappearTimeMs);
        } else {
          // TODO: Show warning toast...
          addToast({
            message:
              "The row has been already created but couldn't be found, possibly due to the current filter settings. Try to clear or change filters.",
            type: 'info',
          });
        }
      });
      // Start with a delay to let time to update dom...
    }, 50);
  }

  function onRemoveRow(rowIdx: number) {
    setActiveClickTimer();
    // Update flat store...
    $tableFlatDataStore.splice(rowIdx, 1);
    $tableFlatDataStore = $tableFlatDataStore;
    // Update full store...
    $tableFullDataStore.splice(rowIdx, 1);
    $tableFullDataStore = $tableFullDataStore;
  }

  function onRowClick(ev: Event) {
    if (activeRows && !hasActiveClickTimer()) {
      const rowNode = ev.currentTarget as HTMLTableRowElement;
      const id = rowNode?.id;
      const rowIdx = Number(id);
      ev.preventDefault();
      ev.stopPropagation();
      // Start edit node...
      startEditRowData(rowIdx);
    }
  }

  function resetFilters() {
    filterValues.update((filterValues: TFilterValues) => {
      const keys = Object.keys(filterValues);
      keys.forEach((key) => (filterValues[key] = undefined));
      return filterValues;
    });
  }

  function handleRowDataChange(data: TGenericEditableData, _spec: TGenericEditableSpec) {
    const rowIdx = $selectedRow;
    if (rowIdx != null) {
      const fullItem = data as TEditableObjectData;
      const flatItem = makeFlatFromFullData(fullItem);
      // Update flat store...
      $tableFlatDataStore[rowIdx] = flatItem;
      $tableFlatDataStore = $tableFlatDataStore;
      // Update full store...
      $tableFullDataStore[rowIdx] = fullItem;
      $tableFullDataStore = $tableFullDataStore;
      // Handle any server-synchronization.
      triggerChange();
    }
  }

  export const api: TEditableTableApi = {
    resetFilters,
    addDataRow,
  };
</script>

<div
  class={classNames(className, styles.EditableTable)}
  data-layout={layout}
  data-id={id}
  title={spec.title}
>
  <!-- Header (?) -->
  {#if spec.label}
    <div class={styles.EditableTable_Label}>
      {spec.label}
    </div>
  {/if}

  <!-- Data table -->
  <table
    {...$tableAttrs}
    class={classNames(styles.EditableTable_Table, activeRows && styles.activeRows)}
    bind:this={tableElement}
  >
    <thead>
      {#each $headerRows as headerRow (headerRow.id)}
        <Subscribe attrs={headerRow.attrs()} let:attrs>
          <tr {...attrs}>
            {#each headerRow.cells as cell (cell.id)}
              <Subscribe attrs={cell.attrs()} let:attrs props={cell.props()} let:props>
                <th
                  {...attrs}
                  id={cell.id}
                  data-with-filter={Object.prototype.hasOwnProperty.call($filterValues, cell.id)
                    ? true
                    : undefined}
                  data-has-active-filter={$filterValues[cell.id] ? true : undefined}
                >
                  <div class={styles.thWrapper}>
                    <Render of={cell.render()} />
                    {#if props.colFilter?.render}
                      <Render of={props.colFilter.render} />
                    {/if}
                  </div>
                </th>
              </Subscribe>
            {/each}
          </tr>
        </Subscribe>
      {/each}
    </thead>
    <tbody {...$tableBodyAttrs}>
      {#each $pageRows as row (row.id)}
        <Subscribe attrs={row.attrs()} let:attrs>
          <tr {...attrs} id={row.id} on:click={onRowClick}>
            {#each row.cells as cell (cell.id)}
              <Subscribe attrs={cell.attrs()} let:attrs>
                <td
                  {...attrs}
                  id={cell.id}
                  data-with-filter={Object.prototype.hasOwnProperty.call($filterValues, cell.id)
                    ? true
                    : undefined}
                  data-has-active-filter={$filterValues[cell.id] ? true : undefined}
                >
                  <div class={styles.tdWrapper}>
                    <Render of={cell.render()} />
                  </div>
                </td>
              </Subscribe>
            {/each}
          </tr>
        </Subscribe>
      {/each}
    </tbody>
  </table>

  <!-- Pagination and stats -->
  {#if allowPagination}
    <div class={classNames(styles.PaginationAndStats, allowPagination && styles.allowPagination)}>
      <div class={classNames(styles.Pagination)}>
        <PaginationBlock {paginationState} />
      </div>
      <div class={styles.Info}>
        <PaginationInfo {paginationState} totalCount={$tableFlatDataStore.length} />
      </div>
    </div>
  {/if}

  <!-- Edit filter conditions modal -->
  <Modal
    id="GenericFilterDialog-Modal"
    class={styles.GenericFilterDialogModal}
    opened={!!$activeFilterParams}
    on:close={closeFilterDialog}
    title={`Edit filter conditions for column '${$activeFilterParams?.id}'`}
    size="lg"
    overflow="inside"
  >
    {#if $activeFilterParams}
      <GenericFilterDialog
        filterParams={$activeFilterParams}
        onClose={closeFilterDialog}
        onReset={resetFilter}
      />
    {/if}
  </Modal>

  <!-- Edit data modal -->
  <Modal
    id="EditRowForm-Modal"
    class={styles.EditableTableModal}
    opened={modalOpened}
    on:close={stopEditRowData}
    title="Edit data row"
    size="xl"
    overflow="inside"
  >
    {#if activeRows && modalOpened && $selectedRow != null}
      <EditRowForm
        rowIdx={$selectedRow}
        data={$tableFullDataStore[$selectedRow]}
        spec={spec.spec}
        onChange={handleRowDataChange}
        onClose={closeModal}
        onRemove={onRemoveRow}
      />
    {/if}
  </Modal>
</div>
