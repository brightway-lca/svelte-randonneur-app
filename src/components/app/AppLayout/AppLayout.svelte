<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import {
    // Aside,
    // Divider,
    // Title,
    // fns,
    Footer,
    AppShell,
    Header,
    Navbar,
    ShellSection,
    SvelteUIProvider,
    colorScheme,
    Anchor,
  } from '@svelteuidev/core';
  import classNames from 'classnames';

  import Toasts from '@/src/components/ui/Toasts';
  import HeadContent from './HeadContent.svelte';
  import NavContent from './NavContent.svelte';
  import { isDev, version, demoPageUrl, browserPageUrl, footerCustomHtml } from '@/src/core/constants/app';
  import { getApproxSize } from '@/src/core/helpers/basic/numbers';
  import { randoFileInfoStore } from '@/src/store/stores/randoFileInfoStore';

  import './global-styles.scss';
  import styles from './AppLayout.module.scss';

  const appInfo = /* `${appTitle} */ `Version: ${version}`;

  $: isDark = $colorScheme === 'dark';

  $: pageUrl = $page.url.pathname;
  $: isRootPage = !pageUrl || pageUrl === '/';
  $: pageId =
    pageUrl
      .replace(/[^A-Za-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, '-') || 'root';
  $: pageClass = ['page', pageId].filter(Boolean).join('-');

  let menuOpened = false;

  function toggleTheme() {
    colorScheme.update((v) => (v === 'light' ? 'dark' : 'light'));
  }

  function toggleMenu() {
    menuOpened = !menuOpened;
  }

  function handleMenuClose() {
    menuOpened = false;
  }

  // Initialize color scheme from browser preference and react to changes
  onMount(() => {
    if (!browser) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    colorScheme.set(mql.matches ? 'dark' : 'light');
    const handler = (ev: MediaQueryListEvent) => {
      colorScheme.set(ev.matches ? 'dark' : 'light');
    };
    // Support older browsers
    // @ts-expect-error - addEventListener may not exist on older Safari
    (mql.addEventListener ? mql.addEventListener('change', handler) : mql.addListener(handler));
    return () => {
      // @ts-expect-error - removeEventListener may not exist on older Safari
      mql.removeEventListener ? mql.removeEventListener('change', handler) : mql.removeListener(handler);
    };
  });
</script>

<SvelteUIProvider withNormalizeCSS withGlobalStyles themeObserver={$colorScheme}>
  <AppShell
    class={classNames(
      styles.AppLayout,
      pageClass,
      isRootPage && styles.rootPage,
      isDark && styles.dark,
    )}
  >
    <ShellSection className={styles.AppLayout_MainContent} grow>
      <slot>This is the main content</slot>
    </ShellSection>

    <Navbar class={styles.AppLayout_Navbar} slot="navbar" hidden={!menuOpened}>
      <NavContent {handleMenuClose} />
    </Navbar>

    <!-- // TODO: Probably will be used in the future...
    -->
    <Footer class={styles.AppLayout_Footer} height={30} slot="footer">
      <div class={styles.AppLayout_Footer_Left} id="DataInfo">
        {#if $randoFileInfoStore}
          Data file: <strong>{$randoFileInfoStore.name}</strong>
          {getApproxSize($randoFileInfoStore.size, { normalize: true }).join('')}
          ({$randoFileInfoStore.type})
        {:else if isDev}
          <Anchor href={demoPageUrl}>Demo page</Anchor>
        {/if}
      </div>
      <div class={styles.AppLayout_Footer_Right} id="AppInfo">
        {#if footerCustomHtml}
          <span class={styles.AppLayout_Footer_CustomHtml}>{@html footerCustomHtml}</span>
        {/if}
        {appInfo}
      </div>
    </Footer>

    <Header class={styles.AppLayout_Header} slot="header" height={60}>
      <HeadContent {isDark} {toggleTheme} {toggleMenu} closeMenu={handleMenuClose} {menuOpened} />
    </Header>
  </AppShell>
  <Toasts />
</SvelteUIProvider>
