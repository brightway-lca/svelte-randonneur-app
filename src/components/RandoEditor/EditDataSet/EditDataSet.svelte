<script context="module" lang="ts">
  export interface TEditDataSetApi {
    // Empty API for compatibility, but no actions needed
  }
</script>

<script lang="ts">
  import { TRandoDataSetKey } from '@/src/core/types/rando';
  import { TRandoDataSetSpecSlot, randoDataSetSpecsStores, randoDataSetsStores } from '@/src/store';
  import {
    TEditableListData,
    TEditableListSpec,
    TGenericEditableSpec,
  } from '@/src/core/types/editable';
  import { SimpleTable } from '@/src/components/data';
  import { extendDataSetSpec } from '@/src/core/helpers/rando';

  export let dataSetId: TRandoDataSetKey;

  $: dataSetSpecStore = randoDataSetSpecsStores[dataSetId];
  $: dataSetDataStore = randoDataSetsStores[dataSetId];

  function makeSpec(srcSpec: TRandoDataSetSpecSlot): TGenericEditableSpec {
    const spec = { ...srcSpec } as TGenericEditableSpec;
    extendDataSetSpec(spec);
    return spec;
  }

  // NOTE: Assuming that dataset top level data is always a table...
  $: spec = makeSpec($dataSetSpecStore) as TEditableListSpec;
  $: data = $dataSetDataStore as unknown as TEditableListData;

  export const api: TEditDataSetApi = {};
</script>

<div class="EditDataSet" data-set-id={dataSetId}>
      {#if $dataSetSpecStore}
        <!-- NOTE: Force update of subcomponent depending on changed dataSetId -->
        {#key dataSetId}
          <SimpleTable {spec} {data} sectionId={dataSetId} />
        {/key}
      {/if}
</div>

<style src="./EditDataSet.scss" lang="scss"></style>
