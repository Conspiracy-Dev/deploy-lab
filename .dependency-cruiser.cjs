/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment: 'Cycles hide dependency direction and make module initialization fragile.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'app-must-not-import-server',
      comment: 'Browser-facing app code may use this application endpoints, never Nitro internals.',
      severity: 'error',
      from: { path: '^app' },
      to: { path: '^server' },
    },
    {
      name: 'server-must-not-import-app',
      comment: 'Nitro code must not depend on Vue application code.',
      severity: 'error',
      from: { path: '^server' },
      to: { path: '^app' },
    },
    {
      name: 'shared-must-stay-runtime-neutral',
      comment: 'Shared modules may be used by app and Nitro, but must not import either runtime.',
      severity: 'error',
      from: { path: '^shared' },
      to: { path: '^(app|server)' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
  },
}
