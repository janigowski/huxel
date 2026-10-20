import { plugin } from 'bun';
import { basename, dirname } from 'node:path';

const reactDir = dirname(Bun.resolveSync('react', import.meta.dir));
const escapedReactDir = reactDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

plugin({
	name: 'dedupe-react',
	setup(build) {
		build.onLoad(
			{ filter: new RegExp(`^(?!${escapedReactDir}/).*/node_modules/react/[^/]+\\.js$`) },
			(args) => {
				const target = JSON.stringify(`${reactDir}/${basename(args.path)}`);
				return {
					contents: `export * from ${target};\nexport { default } from ${target};\n`,
					loader: 'js'
				};
			}
		);
	}
});
