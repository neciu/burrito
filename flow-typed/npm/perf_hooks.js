// @flow

declare module 'perf_hooks' {
	declare export var performance: {
		now: () => number,
	}
}
