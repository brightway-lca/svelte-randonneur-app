<script lang="ts">
  import classNames from 'classnames';
  import { get } from 'svelte/store';

  import { TRandoSectionId } from '@/src/core/types/rando';
  import { randoDataSetsStores } from '@/src/store';
  import { EditProperties } from '@/src/components/RandoEditor/EditProperties';
  import { EditDataSet, TEditDataSetApi } from '@/src/components/RandoEditor/EditDataSet';
  import { EditorHeader } from '@/src/components/RandoEditor/EditorHeader';

  import styles from './DataEditorWrapper.module.scss';

  export let sectionId: TRandoSectionId;

  let editDataSetApi: TEditDataSetApi;
</script>

<div class={styles.DataEditorWrapper}>
  <!-- // TODO: Reserved slot for common header -->
  <EditorHeader className={styles.header} {sectionId} />
  <div class={classNames(styles.container, styles.scrollable)}>
    <div class={styles.content}>
      {#if sectionId === 'properties'}
        <EditProperties />
      {:else if sectionId && get(randoDataSetsStores[sectionId])}
        <EditDataSet dataSetId={sectionId} bind:api={editDataSetApi} />
      {/if}
      <!--
      <p>Placeholder for data set (check scrolling): <b>{sectionId}</b></p>
      <DemoTable />
      {#each Array(25) as _, idx}
        <p>{idx + 1}</p>
      {/each}
      -->
    </div>
  </div>
</div>
