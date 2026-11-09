import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

type SourceIcon = {
	name: string;
	viewBox: string;
	fill: string | undefined;
	inner: string;
	painted: boolean;
};

class IconBuild {
	private readonly svgDir: string;
	private readonly generatedDir: string;

	constructor(root: string) {
		this.svgDir = join(root, 'src', 'svg');
		this.generatedDir = join(root, 'src', 'generated');
	}

	outputs(): Map<string, string> {
		const icons = this.readIcons();
		const names = icons.map((icon) => icon.name);
		const painted = icons.filter((icon) => icon.painted);
		const sprite = this.sprite(icons.filter((icon) => !icon.painted));
		const outputs = new Map<string, string>();

		outputs.set(join(this.generatedDir, 'sprite.svg'), sprite);
		outputs.set(join(this.generatedDir, 'sprite.ts'), this.spriteModule(sprite));
		outputs.set(join(this.generatedDir, 'names.ts'), this.namesModule(names));
		outputs.set(join(this.generatedDir, 'painted.ts'), this.paintedModule(painted));

		return outputs;
	}

	write(): void {
		for (const [file, contents] of this.outputs()) {
			writeFileSync(file, contents);
		}
	}

	stale(): string[] {
		const stale: string[] = [];

		for (const [file, contents] of this.outputs()) {
			if (!existsSync(file) || readFileSync(file, 'utf8') !== contents) {
				stale.push(file);
			}
		}

		return stale;
	}

	private readIcons(): SourceIcon[] {
		return readdirSync(this.svgDir)
			.filter((file) => file.endsWith('.svg'))
			.map((file) => this.parse(file.slice(0, -4), readFileSync(join(this.svgDir, file), 'utf8')))
			.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
	}

	private parse(name: string, source: string): SourceIcon {
		const root = /<svg\b([^>]*)>/.exec(source);
		const end = source.lastIndexOf('</svg>');

		if (!root || end === -1) {
			throw new Error(`${name}.svg is not an svg document`);
		}

		const attributes = root[1] ?? '';
		const viewBox = /\bviewBox="([^"]*)"/.exec(attributes)?.[1];

		if (!viewBox) {
			throw new Error(`${name}.svg has no viewBox`);
		}

		const inner = source
			.slice(root.index + root[0].length, end)
			.split('\n')
			.map((line) => line.trim())
			.join('');

		return {
			name,
			viewBox,
			fill: /\bfill="([^"]*)"/.exec(attributes)?.[1],
			inner,
			painted: /\bdata-paint="gradient"/.test(attributes)
		};
	}

	private sprite(icons: SourceIcon[]): string {
		const symbols = icons.map((icon) => {
			const fill = icon.fill ? ` fill="${icon.fill}"` : '';

			return `<symbol id="hx-icon-${icon.name}" viewBox="${icon.viewBox}"${fill}>${icon.inner}</symbol>`;
		});

		return [
			'<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">',
			...symbols,
			'</svg>',
			''
		].join('\n');
	}

	private spriteModule(sprite: string): string {
		const escaped = sprite
			.trimEnd()
			.replace(/\\/g, '\\\\')
			.replace(/`/g, '\\`')
			.replace(/\$\{/g, '\\${');

		return `export const spriteMarkup = \`${escaped}\`;\n`;
	}

	private namesModule(names: string[]): string {
		const entries = names.map((name) => `\t'${name}'`).join(',\n');

		return [
			`export const iconNames = [\n${entries}\n] as const;`,
			'',
			'export type IconName = (typeof iconNames)[number];',
			''
		].join('\n');
	}

	private paintedModule(painted: SourceIcon[]): string {
		const names = painted.map((icon) => `'${icon.name}'`).join(', ');
		const spark = painted.find((icon) => icon.name === 'spark');

		if (!spark) {
			throw new Error('spark.svg is missing');
		}

		const star = /\bd="([^"]*)"/.exec(spark.inner)?.[1];

		if (!star) {
			throw new Error('spark.svg has no path');
		}

		return [
			`export const paintedIconNames = [${names}] as const;`,
			'',
			'export type PaintedIconName = (typeof paintedIconNames)[number];',
			'',
			'export function isPaintedIcon(name: string): name is PaintedIconName {',
			'\treturn (paintedIconNames as readonly string[]).includes(name);',
			'}',
			'',
			'export function paintedMarkup(name: PaintedIconName, id: string): string {',
			"\tif (name !== 'spark') {",
			'\t\tthrow new Error(`Unknown painted icon: ${String(name)}`);',
			'\t}',
			'',
			'\treturn (',
			'\t\t`<defs><linearGradient id="${id}" x1="2" y1="2" x2="14" y2="14" gradientUnits="userSpaceOnUse">` +',
			'\t\t\'<stop offset="0" style="stop-color:var(--color-brand-400)"/>\' +',
			'\t\t\'<stop offset="1" style="stop-color:var(--color-insight-400)"/>\' +',
			"\t\t'</linearGradient></defs>' +",
			`\t\t\`<path fill="url(#\${id})" d="${star}"/>\``,
			'\t);',
			'}',
			''
		].join('\n');
	}
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const build = new IconBuild(root);

if (process.argv.includes('--check')) {
	const stale = build.stale();

	if (stale.length > 0) {
		console.error(`Out of date:\n${stale.join('\n')}`);
		process.exit(1);
	}

	console.log('Icons are up to date');
} else {
	build.write();
	console.log('Icons built');
}
