import { dev } from '$app/environment';

import { getHasData } from '@/src/store';

export const rootPageUrl = '/';
export const browserPageUrl = '/data';
export const demoPageUrl = '/demo';

export interface TMainMenu {
  text: string;
  url: string;
  compare?: 'exact';
  conditions?: string;
}

export const mainMenu: TMainMenu[] = [
  {
    text: 'Load new data',
    url: rootPageUrl,
    compare: 'exact',
  },
  {
    text: 'Browse current data',
    url: browserPageUrl,
    conditions: 'hasData', // TODO: Make it conditional: show (enable) only if data has already loaded
  },
];

// TODO: Implement as a store and update actual items by subcriptions (on `hasData`, for example

export function isMainMenuItemVisible(item: TMainMenu) {
  const { conditions } = item;
  if (conditions === 'hasData') {
    if (!getHasData()) {
      return false;
    }
  }
  return true;
}

export function getMainMenu() {
  return mainMenu;
}
