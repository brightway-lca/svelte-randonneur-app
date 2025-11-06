<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { DatePicker } from 'date-picker-svelte';
  import { ActionIcon, Popper, TextInput } from '@svelteuidev/core';
  import { Calendar } from 'radix-icons-svelte';
  import classNames from 'classnames';

  import { isValidDate } from '@/src/core/helpers/basic/dates';

  import styles from './DateInput.module.scss';

  export let className: string | undefined = undefined;

  /** Expected text date representation in ISO format, eg: '2023-12-22T01:23:45.67Z' */
  export let value: string | undefined = undefined;

  export let label: string | undefined = undefined;
  export let placeholder: string | undefined = undefined;
  export let disabled: boolean = false;

  // TODO: Pass over all props from `TextInputProps`...
  // @see `node_modules/@svelteuidev/core/dist/components/TextInput/TextInput.svelte.d.ts`

  $: textValue = value; // NOTE: Allows empty values!
  $: dateValue = textValue ? getValidOrCurrentDate(new Date(textValue)) : new Date();

  let inputReference: HTMLInputElement;
  let popupReference: HTMLDivElement;
  let calendarOpened = false;

  $: handleOpenedStatus(calendarOpened);

  const dispatch = createEventDispatcher();

  function getValidOrCurrentDate(date: Date): Date {
    return isValidDate(date) ? date : new Date();
  }

  function toggleCalendarPopup() {
    // TODO: On open set handlers for esc key press and outside click
    calendarOpened = !calendarOpened;
  }

  function closeCalendarPopup() {
    calendarOpened = false;
  }

  function dispatchChangeEvent() {
    dispatch('change', textValue);
  }

  function selectDate(ev: CustomEvent<Date>) {
    const date = ev.detail;
    dateValue = date;
    const text = date.toISOString();
    if (text !== textValue) {
      textValue = text;
      /* console.log('[DateInput:selectDate]', {
       *   dateValue,
       *   textValue,
       *   date,
       *   ev,
       * });
       */
      dispatchChangeEvent();
    }
  }

  function handleTextDate(ev: CustomEvent<string>) {
    const input = ev.currentTarget as HTMLInputElement;
    const text = input?.value;
    if (text !== textValue) {
      // const text = ev.detail;
      textValue = text;
      const newDate = new Date(text);
      if (isValidDate(newDate)) {
        dateValue = newDate;
      } else {
        // NOTE: To set date to current value otherwise?
        dateValue = new Date();
      }
      /* console.log('[DateInput:handleTextDate]', {
       *   dateValue,
       *   textValue,
       *   text,
       *   ev,
       * });
       */
      dispatchChangeEvent();
    }
  }

  function checkEscPress(ev: KeyboardEvent) {
    const { key } = ev;
    const isEscape = key === 'Escape';
    /* console.log('[DateInput:checkEscPress]', {
     *   isEscape,
     *   key,
     *   ev,
     * });
     */
    if (isEscape) {
      ev.preventDefault();
      ev.stopPropagation();
      closeCalendarPopup();
    }
  }

  function checkOuterClick(ev: MouseEvent) {
    if (!popupReference) {
      return;
    }
    const rect = popupReference.getBoundingClientRect();
    const { left, right, top, bottom } = rect;
    const { clientX, clientY } = ev;
    const isInside = clientX >= left && clientX <= right && clientY >= top && clientY <= bottom;
    /* console.log('[DateInput:checkOuterClick]', {
     *   isInside,
     *   rect,
     *   left,
     *   right,
     *   top,
     *   bottom,
     *   clientX,
     *   clientY,
     *   ev,
     *   popupReference,
     * });
     */
    if (!isInside) {
      closeCalendarPopup();
    }
  }

  function handleOpenedStatus(isOpen: boolean) {
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      if (isOpen) {
        document.addEventListener('keydown', checkEscPress);
        document.addEventListener('mousedown', checkOuterClick);
      } else {
        document.removeEventListener('keydown', checkEscPress);
        document.removeEventListener('mousedown', checkOuterClick);
      }
    }
  }
</script>

<div class={classNames(className, styles.DateInput)}>
  <TextInput
    bind:element={inputReference}
    value={textValue || ''}
    on:change={disabled ? undefined : handleTextDate}
    {label}
    {placeholder}
    {disabled}
  >
    <svelte:fragment slot="rightSection">
      {#if !disabled}
        <ActionIcon on:click={toggleCalendarPopup} title="Toggle date selector">
          <Calendar />
        </ActionIcon>
      {/if}
    </svelte:fragment>
  </TextInput>
  <Popper
    bind:element={popupReference}
    title="Select date"
    mounted={calendarOpened}
    reference={inputReference}
    position="bottom"
    placement="start"
    gutter={4}
  >
    <DatePicker value={dateValue} timePrecision="second" on:select={selectDate} />
  </Popper>
</div>
