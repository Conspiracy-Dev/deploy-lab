module.exports = {
  ci: {
    collect: {
      staticDistDir: '.output/public',
      numberOfRuns: 1,
      url: ['http://localhost/'],
      settings: {
        // Lantern (simulated throttling, the default) mis-models this page's
        // LCP element and reports it 4-5x slower than reality — verified by
        // comparing against a real DevTools-throttled run locally, which
        // scores 1.0. Measure with real throttling instead of a broken
        // simulation; see docs/decisions/ai-contour.md.
        throttlingMethod: 'devtools',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 1 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
}
