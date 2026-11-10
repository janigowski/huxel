import { cloneElement, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-aria-components';

import { cx } from '../lib/cx';
import { externalAnchorProps } from '../lib/external-href';
import styles from './card.module.css';

export type CardTone =
	| 'neutral'
	| 'emphasis'
	| 'featured'
	| 'critical'
	| 'warning'
	| 'success'
	| 'neutral-inverted';

export type CardProps = {
	children: ReactNode;
	tone?: CardTone;
	className?: string;
	asChild?: boolean;
};

function Header({ children }: { children: ReactNode }) {
	return <div className={styles.header}>{children}</div>;
}

function Body({ children }: { children: ReactNode }) {
	return <div className={styles.body}>{children}</div>;
}

function CardRoot({ children, tone = 'neutral', className, asChild = false }: CardProps) {
	const paint = cx(styles.card, className);

	if (asChild && isValidElement(children)) {
		const child = children as ReactElement<{
			className?: string;
			children?: ReactNode;
			href?: string;
		}>;
		const href = child.props.href;

		if (typeof href === 'string') {
			return (
				<Link
					href={href}
					className={paint}
					data-tone={tone}
					{...externalAnchorProps(href)}
					render={(domProps) =>
						cloneElement(child, {
							...domProps,
							className: cx(
								typeof domProps.className === 'string' ? domProps.className : undefined,
								child.props.className
							)
						})
					}
				>
					{child.props.children}
				</Link>
			);
		}

		return cloneElement(
			child as ReactElement<{ className?: string; 'data-tone'?: CardProps['tone'] }>,
			{
				className: cx(paint, child.props.className),
				'data-tone': tone
			}
		);
	}

	return (
		<section className={paint} data-tone={tone}>
			{children}
		</section>
	);
}

export const Card = Object.assign(CardRoot, { Header, Body });
