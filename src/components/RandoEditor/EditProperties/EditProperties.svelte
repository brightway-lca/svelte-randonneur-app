<script lang="ts">
  import { propertiesDataSpec } from '@/src/core/constants/rando';
  import { randoPropertiesStore } from '@/src/store';
  import { TGenericEditableData, TGenericEditableSpec } from '@/src/core/types/editable';
  import { GenericEditable } from '@/src/components/data';
  import { extendDataSetWithFilters, extendPropertiesSpec } from '@/src/core/helpers/rando';
  import { TRandoPropertiesSlot } from '@/src/core/types/rando';

  const propertiesSpec = { ...propertiesDataSpec };

  extendPropertiesSpec(propertiesSpec);
  extendDataSetWithFilters(propertiesSpec);

  function onChange(data: TGenericEditableData, _spec: TGenericEditableSpec) {
    randoPropertiesStore.set(data as TRandoPropertiesSlot);
  }
</script>

<div class="EditProperties">
  <GenericEditable spec={propertiesSpec} data={$randoPropertiesStore} readonly={true} />
</div>

<style src="./EditProperties.scss" lang="scss"></style>
