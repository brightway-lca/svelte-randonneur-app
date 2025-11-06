<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Switch, TextInput, NumberInput, NativeSelect, ActionIcon, colorScheme } from '@svelteuidev/core';
  import { Copy } from 'radix-icons-svelte';
  import classNames from 'classnames';

  import { TEditableFieldSpec, TEditableFieldData } from '@/src/core/types/editable';
  import { DateInput } from '@/src/components/forms/DateInput';
  import { addToast } from '@/src/components/ui/Toasts';
  import cssVariables from '@/src/core/assets/scss/variables.module.scss';

  import styles from './EditableField.module.scss';

  $: isDark = $colorScheme === 'dark';

  /* // Old approach (unused): Store self refernece in the local registry to avoild cyrcular dependencies (NOTE: The component should be REALLY used)
   * import EditableField from './EditableField.svelte';
   * import { TComponent, registryStore } from '../registry';
   * registryStore.update((registry) => {
   *   return { ...registry, EditableField };
   * });
   */

  type TOnChangeCallback = (value: TEditableFieldData, spec: TEditableFieldSpec) => void;

  // External parameters...
  export let className: string | undefined = undefined;
  export let spec: TEditableFieldSpec;
  export let value: TEditableFieldData = undefined;
  export let onChange: TOnChangeCallback | undefined = undefined;
  export let readonly: boolean = false;

  const { id, type } = spec;

  /* $: console.log('[EditableField]', type, id, {
   *   value,
   *   type,
   *   id,
   * });
   */

  const dispatch = createEventDispatcher();

  // TODO: Store local value copy?

  function handleChange(ev: CustomEvent<number> | Event) {
    const target = ev.target as HTMLInputElement;
    let value: TEditableFieldData;
    if (type === 'boolean') {
      value = !!target.checked;
    } else if (type === 'string') {
      value = target.value;
    } else if (type === 'number' || type === 'date') {
      if ('detail' in ev) {
        value = ev.detail;
      }
      // TODO: Check for error otherwise?
    } else if (type === 'select') {
      value = target.value;
    }
    if (onChange) {
      onChange(value, spec);
    }
    dispatch('change', {
      value,
      spec,
    });
  }

  // Format value for display
  function formatValueForDisplay(val: TEditableFieldData): string {
    if (val === null || val === undefined) {
      return '';
    }
    if (type === 'boolean') {
      return val ? 'Yes' : 'No';
    }
    if (type === 'date' && val) {
      return String(val);
    }
    return String(val);
  }

  // Copy value to clipboard
  async function copyValue() {
    const valueToCopy = formatValueForDisplay(value);
    if (!valueToCopy) {
      addToast({ message: 'No value to copy', type: 'error' });
      return;
    }

    try {
      await navigator.clipboard.writeText(valueToCopy);
      addToast({ message: 'Value copied to clipboard', type: 'success' });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = valueToCopy;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        addToast({ message: 'Value copied to clipboard', type: 'success' });
      } catch (err) {
        addToast({ message: 'Failed to copy value', type: 'error' });
      }
      document.body.removeChild(textArea);
    }
  }
</script>

<div
  class={classNames(className, styles.EditableField, readonly && styles.EditableFieldReadonly, isDark && styles.dark)}
  data-id={id}
  data-type={spec.type}
  title={spec.title}
>
  {#if readonly}
    <!-- Read-only display with inline label and copy button -->
    <div class={styles.ReadonlyContainer}>
      <div class={styles.ReadonlyLabel}>{spec.label}:</div>
      <div class={styles.ReadonlyValueContainer}>
        <span class={styles.ReadonlyValue}>{formatValueForDisplay(value)}</span>
        <ActionIcon
          variant="light"
          size={parseInt(cssVariables.defaultInputHeightPx)}
          title="Copy value to clipboard"
          on:click={copyValue}
          class={styles.CopyButton}
        >
          <Copy />
        </ActionIcon>
      </div>
    </div>
  {:else}
    <!-- Editable inputs with inline label -->
    <div class={styles.EditableContainer}>
      <div class={styles.EditableLabel}>{spec.label}:</div>
      <div class={styles.EditableInput}>
        {#if type === 'boolean'}
          <Switch class={styles.Switch} checked={!!value} disabled={readonly} on:change={readonly ? undefined : handleChange} />
        {:else if type === 'string'}
          <TextInput {value} placeholder={spec.title} disabled={readonly} on:change={readonly ? undefined : handleChange} />
        {:else if type === 'date'}
          <DateInput
            placeholder={spec.title}
            value={value ? String(value) : ''}
            disabled={readonly}
            on:change={readonly ? undefined : handleChange}
          />
        {:else if type === 'number'}
          <NumberInput
            value={value != null ? Number(value) : undefined}
            placeholder={spec.title}
            disabled={readonly}
            on:change={readonly ? undefined : handleChange}
            hideControls
          />
        {:else if type === 'select'}
          <NativeSelect
            data={spec.selectData}
            value={value || ''}
            placeholder={spec.title}
            disabled={readonly}
            on:change={readonly ? undefined : handleChange}
          />
        {/if}
      </div>
    </div>
  {/if}
</div>
