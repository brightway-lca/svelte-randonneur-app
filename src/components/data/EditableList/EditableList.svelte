<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import classNames from 'classnames';
  import { ActionIcon } from '@svelteuidev/core';
  import { Plus, Trash } from 'radix-icons-svelte';

  import cssVariables from '@/src/core/assets/scss/variables.module.scss';

  import {
    TEditableListSpec,
    TEditableListData,
    defaultDisplayLayout,
    TGenericEditableData,
    TGenericEditableSpec,
  } from '@/src/core/types/editable';

  import { GenericEditable } from '../GenericEditable';

  import styles from './EditableList.module.scss';

  type TOnChangeCallback = (data: TEditableListData, spec: TEditableListSpec) => void;

  // External parameters...
  export let className: string | undefined = undefined;
  export let spec: TEditableListSpec;
  export let data: TEditableListData = [];
  export let onChange: TOnChangeCallback | undefined = undefined;
  export let readonly: boolean = false;

  const { id, spec: itemSpec, layout } = spec;

  /** Local data storage */
  $: localList = [...data];
  /** Local unique indices counter */
  let lastUniqueIdx = 0;
  /** Unique indices correspodning data items */
  const uniqueIndices = data.map(() => lastUniqueIdx++);

  const dispatch = createEventDispatcher();

  function triggerChange() {
    if (onChange) {
      onChange(localList, spec);
    }
    dispatch('change', { data: localList, spec });
  }

  function handleItemChange(
    idx: number,
    value: TGenericEditableData,
    _itemSpec: TGenericEditableSpec,
  ) {
    localList[idx] = value;
    triggerChange();
  }

  function handleAddItem() {
    localList = localList.concat(undefined);
    uniqueIndices.push(lastUniqueIdx++);
    triggerChange();
  }

  function handleRemoveItem(ev: Event) {
    const target = ev.currentTarget as HTMLButtonElement;
    const itemNode = target.closest('.' + styles.Item);
    if (!itemNode) {
      const error = new Error('Not found item node for remove button');
      // eslint-disable-next-line no-console
      console.error('[EditableList:handleRemoveItem]', error.message, {
        error,
        ev,
        target,
      });
      // eslint-disable-next-line no-debugger
      debugger;
      return;
    }
    const idx = Number(itemNode.getAttribute('data-idx'));
    localList.splice(idx, 1);
    localList = [...localList];
    uniqueIndices.splice(idx, 1);
    triggerChange();
  }
</script>

<div
  class={classNames(className, styles.EditableList)}
  data-layout={layout || defaultDisplayLayout}
  data-id={id}
  title={spec.title}
>
  {#if spec.label}
    <div class={styles.Label}>
      {spec.label}
    </div>
  {/if}
  <div class={styles.Wrapper}>
    <div class={styles.ItemsWrapper}>
      {#each localList as itemValue, idx (uniqueIndices[idx])}
        {@const itemLabel = itemSpec.label || itemSpec.title || (itemSpec.type !== 'object' ? `Element ${idx + 1}` : undefined)}
        {@const itemSpecWithLabel = itemLabel ? { ...itemSpec, label: itemLabel } : itemSpec}
        <div class={styles.Item} id={[spec.id, uniqueIndices[idx]].join('-')} data-idx={idx}>
          <GenericEditable
            className={styles.ItemElement}
            spec={itemSpecWithLabel}
            data={itemValue}
            onChange={readonly ? undefined : handleItemChange.bind(null, idx)}
            {readonly}
          />
          <!-- Actions -->
          {#if !readonly}
            <ActionIcon
              class={styles.removeRowIcon}
              variant="light"
              on:click={handleRemoveItem}
              size={parseInt(cssVariables.defaultInputHeightPx)}
              title="Remove item"
            >
              <Trash />
            </ActionIcon>
          {/if}
        </div>
      {/each}
    </div>
    <!-- Actions -->
    {#if !readonly}
      <ActionIcon
        class={styles.addRowIcon}
        variant="light"
        on:click={handleAddItem}
        size={parseInt(cssVariables.defaultInputHeightPx)}
        title="Add new item"
      >
        <Plus />
      </ActionIcon>
    {/if}
  </div>
</div>

<!--
<style lang="scss" src="./EditableList.scss"></style>
-->
