#!/bin/sh
set -u

builtins='assert|async_hooks|buffer|child_process|cluster|console|constants|crypto|dgram|diagnostics_channel|dns|domain|events|fs|http|http2|https|inspector|module|net|os|path|perf_hooks|process|punycode|querystring|readline|repl|stream|string_decoder|sys|timers|tls|trace_events|tty|url|util|v8|vm|wasi|worker_threads|zlib'
pattern="(from|import|require)[[:space:]]*\\(?[[:space:]]*['\"](node:|($builtins)(/[^'\"]*)?['\"])"

root=$(dirname "$0")/..
matches=$(grep -rnE --include='*.ts' --include='*.js' --include='*.mjs' --include='*.cjs' "$pattern" "$root/src")
status=$?

if [ "$status" -eq 0 ]; then
	echo "Node.js modules are not allowed in src/:" >&2
	echo "$matches" >&2
	exit 1
fi

if [ "$status" -ne 1 ]; then
	echo "check:universal failed to scan src/" >&2
	exit 2
fi

echo "src/ is free of Node.js imports"
