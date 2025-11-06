import { TGenericEditableSpec } from '@/src/core/types/editable';

/** Type definition (generated via `deriveDataSetSpec` from real randonneur data) */
export const propertiesDataSpec: TGenericEditableSpec = {
  id: 'properties',
  type: 'object',
  spec: [
    { id: 'name', type: 'string' },
    {
      id: 'licenses',
      type: 'list',
      spec: {
        id: 'licenses-item',
        type: 'object',
        spec: [
          { id: 'name', type: 'string' },
          { id: 'path', type: 'string' },
          { id: 'title', type: 'string' },
        ],
      },
    },
    { id: 'version', type: 'string' },
    { id: 'description', type: 'string' },
    { id: 'homepage', type: 'string' },
    { id: 'created', type: 'date' },
    {
      id: 'contributors',
      type: 'list',
      spec: {
        id: 'contributors-item',
        type: 'object',
        spec: [
          { id: 'title', type: 'string' },
          { id: 'path', type: 'string' },
          { id: 'role', type: 'string' },
        ],
      },
    },
    // Metadata fields
    { id: 'source_id', type: 'string' },
    { id: 'target_id', type: 'string' },
    {
      id: 'graph_context',
      type: 'list',
      layout: 'horizontal', // Display as horizontal list (not table, so no pagination)
      spec: { id: 'graph_context-item', type: 'string' },
    },
    // Mapping configuration (object, not a list - will display inline without pagination)
    {
      id: 'mapping',
      type: 'object',
      spec: [
        {
          id: 'source',
          type: 'object',
          spec: [
            { id: 'expression language', type: 'string' },
            {
              id: 'labels',
              type: 'object',
              spec: [
                { id: 'name', type: 'string' },
                { id: 'unit', type: 'string' },
                { id: 'uuid', type: 'string' },
                {
                  id: 'context',
                  type: 'list',
                  layout: 'horizontal', // Display as horizontal list (not table)
                  spec: { id: 'context-item', type: 'string' },
                },
              ],
            },
          ],
        },
        {
          id: 'target',
          type: 'object',
          spec: [
            { id: 'expression language', type: 'string' },
            {
              id: 'labels',
              type: 'object',
              spec: [
                { id: 'name', type: 'string' },
                { id: 'unit', type: 'string' },
                { id: 'uuid', type: 'string' },
                {
                  id: 'context',
                  type: 'list',
                  layout: 'horizontal', // Display as horizontal list (not table)
                  spec: { id: 'context-item', type: 'string' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// TODO: Create extended spec with user-friendly entries titles
