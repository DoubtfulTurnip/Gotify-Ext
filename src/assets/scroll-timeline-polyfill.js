// Intentionally empty local stub.
//
// ngx-scrollbar tries to fetch a ScrollTimeline polyfill from a remote CDN
// at runtime when the browser lacks native support. That's a CSP violation
// under this extension's script-src 'self' policy, and loading remote code
// at runtime isn't something a signed extension should be doing anyway.
// Pointing ngx-scrollbar at this local, same-origin, empty file lets its
// load attempt succeed harmlessly instead of erroring; native scrollbar
// behaviour (the only thing available without the polyfill regardless)
// is unaffected.
