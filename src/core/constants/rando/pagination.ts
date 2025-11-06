import { isDev } from '@/src/core/constants/app';

const showDemoPageSize = true;
export const defaultPageSize = 25;
export const minPageSize = isDev && showDemoPageSize ? 2 : 5;
