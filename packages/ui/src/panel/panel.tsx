import type { ReactNode } from 'react';

import cardStyles from '../card/card.module.css';
import { cx } from '../lib/cx';
import type { CardTone } from '../card/card';

export type PanelProps = {
	children: ReactNode;
	tone?: CardTone;
	className?: string;
};

function Header({ children }: { children: ReactNode }) {
	return <div className={cardStyles.header}>{children}</div>;
}

function Body({ children }: { children: ReactNode }) {
	return <div className={cardStyles.body}>{children}</div>;
}

function PanelRoot({ children, tone = 'neutral', className }: PanelProps) {
	return (
		<section className={cx(cardStyles.card, className)} data-tone={tone}>
			{children}
		</section>
	);
}

export const Panel = Object.assign(PanelRoot, { Header, Body });
