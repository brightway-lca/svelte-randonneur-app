<!--
  TODO:
  - 2024.01.18, 14:19: Add loading spinner to load data buttons while the data is loading.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { writable } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { colorScheme, NativeSelect, Button } from '@svelteuidev/core';
  import { Loader } from '@svelteuidev/core';
  import { Paper } from '@svelteuidev/core';
  import classNames from 'classnames';

  import { addToast } from '@/src/components/ui/Toasts';
  import { getApproxSize, getErrorText } from '@/src/core/helpers/basic';
  import { defaultDataFileIdx, demoDataFiles } from '@/src/core/constants/demoData';
  import { TRandoData } from '@/src/core/types/rando';
  import { hasDataStore } from '@/src/store';
  import { setRandData } from '@/src/store/actions/randoDataActions';
  import { appTitle, browserPageUrl } from '@/src/core/constants/app';
  import { randoFileInfoStore } from '@/src/store/stores/randoFileInfoStore';

  import { loadDemoDataByIdx, getDemoDataFileId, getDemoDataName } from './loadDemoData';
  import { loadDataFile } from './loadLocalData';
  import { isGzipFile } from '@/src/core/helpers/data/decompressGzip';

  import styles from './LoadDataPage.module.scss';

  const GITHUB_REPO_URL = 'https://github.com/brightway-lca/svelte-randonneur-app';
  const RANDONNEUR_REPO_URL = 'https://github.com/brightway-lca/randonneur';

  $: isDark = $colorScheme === 'dark';

  let demoDataFileIdx: string = String(defaultDataFileIdx);
  let previousDemoDataFileIdx: string | undefined = undefined;
  let loadingDemoData = false;

  let localDataFile: File | undefined = undefined;
  let loadingLocalData = false;

  const demoDataFilesSelectData = demoDataFiles.map(({ id }, idx) => {
    return { label: id, value: String(idx) };
  });

  $: loading = loadingDemoData || loadingLocalData;

  let buttonLabel = 'Upload Randonneur file';

  // Automatically load when demo data selection changes
  $: {
    if (previousDemoDataFileIdx !== undefined && demoDataFileIdx !== previousDemoDataFileIdx) {
      previousDemoDataFileIdx = demoDataFileIdx;
      if (demoDataFileIdx) {
        loadDemoData();
      }
    } else if (previousDemoDataFileIdx === undefined) {
      previousDemoDataFileIdx = demoDataFileIdx;
    }
  }

  function loadDemoData() {
    const idx = parseInt(demoDataFileIdx, 10);
    const dataId = getDemoDataFileId(idx);
    const fileName = getDemoDataName(idx);
    loadingDemoData = true;
    loadDemoDataByIdx<TRandoData>(idx)
      .then(({ data, size }) => {
        setRandData(data);
        randoFileInfoStore.set({
          name: fileName,
          type: 'demo',
          size,
        });
        // Ensure left sidebar starts expanded on first entry
        if (browser) {
          localStorage.setItem('rando-left-panel-collapsed', 'false');
        }
        goToMainAppPage();
      })
      .catch((error) => {
        const errorMsg = getErrorText(error);
        console.error('[LoadDataPage:loadDemoData] error', errorMsg, {
          error,
          dataId,
        });
        addToast({ message: errorMsg, type: 'error' });
      })
      .finally(() => {
        loadingDemoData = false;
      });
  }

  function handleLocalFile(ev: Event) {
    const target = ev.target as HTMLInputElement;
    const files = target.files;
    const file = files && files[0];
    if (!file) {
      const error = new Error('No file selected!');
      console.warn('[LoadDataPage:handleLocalFile] error', {
        error,
      });
      return;
    }
    const {
      name: fileName,
      type: fileType,
      size: fileSize,
    } = file;

    // Check if file is a gzip file
    const isCompressed = isGzipFile(fileName);

    // Accept both .json files and .gz files
    const isJsonFile = /\.json$/.test(fileName) && (fileType === 'application/json' || fileType === '');
    if (!isJsonFile && !isCompressed) {
      const error = new Error('Expected json or .gz data file!');
      console.warn('[LoadDataPage:handleLocalFile] error', {
        error,
      });
      return;
    }
    localDataFile = file;
    const size = getApproxSize(fileSize, { normalize: true }).join('');
    buttonLabel = `${fileName} (${size})`;
    loadLocalData();
  }

  function loadLocalData() {
    if (!localDataFile) {
      const error = new Error('No local file defined');
      console.warn('[LoadDataPage:loadLocalData] error', {
        error,
      });
      return;
    }
    loadingLocalData = true;
    loadDataFile<TRandoData>(localDataFile, {
      timeout: 5000,
    })
      .then(({ data }) => {
        setRandData(data);
        if (localDataFile) {
          randoFileInfoStore.set({
            name: localDataFile.name,
            type: 'uploaded',
            size: localDataFile.size,
          });
        }
        // Ensure left sidebar starts expanded on first entry
        if (browser) {
          localStorage.setItem('rando-left-panel-collapsed', 'false');
        }
        goToMainAppPage();
      })
      .catch((error) => {
        const errorMsg = getErrorText(error);
        console.error('[LoadDataPage:loadLocalData] error', errorMsg, {
          error,
          localDataFile,
        });
        addToast({ message: errorMsg, type: 'error' });
        goToMainAppPage();
      })
      .finally(() => {
        loadingLocalData = false;
      });
  }

  const initedStore = writable(false);
  let goingOutStore = writable(false);

  onMount(() => {
    initedStore.set(true);
  });

  /** Go to the data browser */
  function goToMainAppPage() {
    if ($hasDataStore) {
      goingOutStore.set(true);
      goto(browserPageUrl);
    }
  }
</script>

<svelte:head>
  <title>Load data — {appTitle}</title>
</svelte:head>

<div
  class={classNames(
    styles.LoadDataPage,
    loading && styles.loading,
    goingOutStore && styles.goingOut && $initedStore && styles.inited,
    isDark && styles.dark,
  )}
>
  <!-- Header with Logo -->
  <header class={styles.Header}>
    <div class={styles.LogoContainer}>
      <div class={styles.LogoWrapper}>
        <img src="/logo.png" alt={appTitle} class={styles.Logo} />
        <h1 class={styles.LogoText}>Data Browser</h1>
      </div>
      <div class={styles.Description}>
        <p>
          Randonneur is a <a href={RANDONNEUR_REPO_URL} target="_blank" rel="noopener noreferrer" class={styles.GithubLink}>open format for specifying sustainability assessment data transformations</a>.
        </p>
        <p>
          This <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" class={styles.GithubLink}>open source app</a> allow people to browse Randonneur files.
        </p>
        <p>
          Uploading data will send it to the server, but no data is saved.
        </p>
      </div>
    </div>
  </header>

  <!-- Action Sections -->
  <div class={styles.ActionSection}>
    <!-- Upload your data -->
    <div class={styles.ActionBox}>
      <div class={styles.BoxHeader}>Browse your data</div>
      <Button
        class={styles.FileUploadButton}
        id="localDataFile"
        name="localDataFile"
        title={buttonLabel}
      >
        <span>{buttonLabel}</span>
        <input
          type="file"
          id="localDataFileInput"
          name="localDataFile"
          accept="application/json,.json,.gz,application/gzip"
          on:change={handleLocalFile}
        />
      </Button>
    </div>

    <!-- Browse example data -->
    <div class={styles.ActionBox}>
      <div class={styles.BoxHeader}>Browse example file</div>
      <NativeSelect
        data={demoDataFilesSelectData}
        id="demoDataFile"
        bind:value={demoDataFileIdx}
        placeholder="Select example file"
        class={styles.ExampleDataSelect}
      />
    </div>
  </div>


  <!-- Loading Overlay -->
  <Paper class={styles.WaiterPanel} radius={0} shadow={undefined}>
    <Loader />
  </Paper>
</div>

<style src="./LoadDataPage.module.scss" lang="scss"></style>
