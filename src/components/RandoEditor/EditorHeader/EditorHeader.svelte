<script lang="ts">
  import classNames from 'classnames';

  import { TRandoSectionId } from '@/src/core/types/rando';
  import { sectionTitles } from '@/src/core/constants/rando';

  import styles from './EditorHeader.module.scss';

  export let sectionId: TRandoSectionId;
  export let className: string = '';

  $: title = sectionTitles[sectionId];
  
  // Check if this section displays diffs
  $: showLegend = sectionId === 'replace' || sectionId === 'update' || sectionId === 'disaggregate';
</script>

<div class={classNames(className, styles.EditorHeader)} data-section-id={sectionId}>
  <div class={styles.Title}>
    {title}
  </div>
  {#if showLegend}
    <div class={styles.Help}>
      <span>Legend: </span>
      <span class={styles.DiffMatch}>unchanged</span>
      <span> = </span>
      <span class={styles.DiffMatch}>green italic</span>
      <span>; </span>
      <span class={styles.DiffRemoved}>removed</span>
      <span> = </span>
      <span class={styles.DiffRemoved}>red strikethrough</span>
      <span>; </span>
      <span class={styles.DiffAdded}>added</span>
      <span> = </span>
      <span class={styles.DiffAdded}>teal bold</span>
    </div>
  {/if}
</div>
