<script context="module" lang="ts">
  export type TGenericEditableOnChangeCallback = (
    data: TGenericEditableData,
    spec: TGenericEditableSpec,
  ) => void;
</script>

<script lang="ts">
  import {
    TGenericEditableSpec,
    TGenericEditableData,
    TEditableObjectData,
    TEditableListData,
    TEditableListSpec,
  } from '@/src/core/types/editable';
  import { EditableField } from '../EditableField';
  import { EditableList } from '../EditableList';
  import { EditableObject } from '../EditableObject';
  import { EditableTable } from '../EditableTable';
  import { SimpleTable } from '../SimpleTable';
  import classNames from 'classnames';
  import styles from './GenericEditable.module.scss';

  export let className: string | undefined = undefined;
  export let spec: TGenericEditableSpec;
  export let data: TGenericEditableData | undefined = undefined;
  export let onChange: TGenericEditableOnChangeCallback | undefined = undefined;
  export let readonly: boolean = false;

  const nextClassName = classNames(className, styles.GenericEditable);

  const objectData = data as TEditableObjectData;
  const listData = data as TEditableListData;

  // Helper to safely cast spec for SimpleTable
  function getListSpec(s: TGenericEditableSpec): TEditableListSpec {
    return s as TEditableListSpec;
  }
</script>

{#if spec.type === 'object'}
  <EditableObject className={nextClassName} {spec} data={objectData} {onChange} {readonly} />
{:else if spec.type === 'list'}
  {#if spec.layout === 'table'}
    {#if readonly}
      <SimpleTable className={nextClassName} spec={getListSpec(spec)} data={listData} />
    {:else}
      <EditableTable className={nextClassName} {spec} data={listData} {onChange} readonly={readonly} />
    {/if}
  {:else}
    <EditableList className={nextClassName} {spec} data={listData} {onChange} readonly={readonly} />
  {/if}
{:else}
  <EditableField className={nextClassName} {spec} value={data} {onChange} {readonly} />
{/if}

