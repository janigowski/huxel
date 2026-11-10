import type { IconName } from '@huxel/icons';
import { spriteMarkup } from '@huxel/icons/sprite';
import { isPaintedIcon, paintedMarkup } from '@huxel/icons/painted';
import { useId } from 'react';

import { cx } from '../lib/cx';
import styles from './icon.module.css';

export type IconProps = {
	name: IconName;
	label?: string;
	className?: string;
};

export function Icon({ name, label, className }: IconProps) {
	const rawId = useId();
	const painted = isPaintedIcon(name);
	const classes = cx(styles.base, className ?? styles.icon);
	const viewBox = name === 'mark' ? '0 0 32 32' : '0 0 16 16';
	const labelled = label !== undefined;

	if (painted) {
		const gradientId = `spark${rawId.replaceAll(':', '')}`;

		return (
			<svg
				className={classes}
				viewBox={viewBox}
				role={labelled ? 'img' : undefined}
				aria-label={label}
				aria-hidden={labelled ? undefined : true}
				focusable="false"
				dangerouslySetInnerHTML={{ __html: paintedMarkup(name, gradientId) }}
			/>
		);
	}

	return (
		<svg
			className={classes}
			viewBox={viewBox}
			role={labelled ? 'img' : undefined}
			aria-label={label}
			aria-hidden={labelled ? undefined : true}
			focusable="false"
		>
			<use href={`#hx-icon-${name}`} />
		</svg>
	);
}

export function IconSprite() {
	return <div dangerouslySetInnerHTML={{ __html: spriteMarkup }} />;
}
