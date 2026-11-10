import { useVirtualizer } from '@tanstack/react-virtual';
import { createContext, memo, useContext, useMemo, useRef, useState } from 'react';
import type { DragEvent, KeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react';

import { Checkbox } from '../checkbox/checkbox';
import { readPx } from '../lib/css-length';
import { cx } from '../lib/cx';
import scrollStyles from '../scroll-area/scroll-area.module.css';
import { Text } from '../text/text';
import styles from './table.module.css';

export type TableColumn<Row> = {
	id: string;
	header: string;
	cell: (row: Row) => ReactNode;
	width: number;
	minWidth?: number;
	sortable?: boolean;
	pinnable?: boolean;
	sortValue?: (row: Row) => string | number;
};

export type TableTranslations = {
	selectAll: string;
	selectRow: string;
	sortAscending: string;
	sortDescending: string;
	loading: string;
	empty: string;
	pin: string;
	unpin: string;
	resize: string;
};

export type TableProps<Row> = {
	label: string;
	rows: readonly Row[];
	columns: readonly TableColumn<Row>[];
	getRowId: (row: Row) => string;
	loading?: 'page' | 'more' | false;
	empty?: ReactNode;
	translations: TableTranslations;
	className?: string;
};

type Sort = {
	id: string;
	direction: 'ascending' | 'descending';
};

type HeaderColumn = {
	id: string;
	header: string;
	width: number;
	minWidth: number;
	sortable: boolean;
	pinnable: boolean;
	pinned: boolean;
	offset: number;
};

type HeaderModel = {
	columns: readonly HeaderColumn[];
	sort: Sort | null;
	translations: TableTranslations;
	allSelected: boolean;
	someSelected: boolean;
	onSort: (id: string) => void;
	onPin: (id: string) => void;
	onResize: (id: string, next: number) => void;
	onReorder: (sourceId: string, targetId: string) => void;
	onToggleAll: () => void;
};

const HeaderContext = createContext<HeaderModel | null>(null);

function useHeaderModel(): HeaderModel {
	const model = useContext(HeaderContext);

	if (model === null) {
		throw new Error('Table header is outside Table');
	}

	return model;
}

function compareValues(left: string | number, right: string | number): number {
	if (typeof left === 'number' && typeof right === 'number') {
		return left - right;
	}

	return String(left).localeCompare(String(right));
}

export function Table<Row>({
	label,
	rows,
	columns,
	getRowId,
	loading = false,
	empty,
	translations,
	className
}: TableProps<Row>) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [order, setOrder] = useState(() => columns.map((column) => column.id));
	const [pinned, setPinned] = useState<ReadonlySet<string>>(() => new Set());
	const [widths, setWidths] = useState<Readonly<Record<string, number>>>({});
	const [sort, setSort] = useState<Sort | null>(null);
	const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());

	const columnById = useMemo(() => {
		const map = new Map<string, TableColumn<Row>>();

		for (const column of columns) {
			map.set(column.id, column);
		}

		return map;
	}, [columns]);

	const ordered = useMemo(() => {
		const known = order.flatMap((id) => {
			const column = columnById.get(id);

			return column ? [column] : [];
		});
		const missing = columns.filter((column) => !order.includes(column.id));

		return [...known, ...missing];
	}, [columnById, columns, order]);

	const sortedRows = useMemo(() => {
		if (sort === null) {
			return rows;
		}

		const column = columnById.get(sort.id);

		if (!column?.sortValue) {
			return rows;
		}

		const next = [...rows];
		const direction = sort.direction === 'ascending' ? 1 : -1;
		next.sort(
			(left, right) => compareValues(column.sortValue!(left), column.sortValue!(right)) * direction
		);

		return next;
	}, [columnById, rows, sort]);

	const headerColumns = useMemo(() => {
		const selectWidth = readPx('--size-large');
		let offset = selectWidth === 0 ? 1 : selectWidth;
		const pinnedColumns = ordered.filter((column) => pinned.has(column.id));
		const looseColumns = ordered.filter((column) => !pinned.has(column.id));

		function toHeader(column: TableColumn<Row>, isPinned: boolean): HeaderColumn {
			const width = widths[column.id] ?? column.width;
			const item: HeaderColumn = {
				id: column.id,
				header: column.header,
				width,
				minWidth: column.minWidth ?? column.width,
				sortable: column.sortable === true,
				pinnable: column.pinnable !== false,
				pinned: isPinned,
				offset
			};

			if (isPinned) {
				offset += width;
			}

			return item;
		}

		return [
			...pinnedColumns.map((column) => toHeader(column, true)),
			...looseColumns.map((column) => toHeader(column, false))
		];
	}, [ordered, pinned, widths]);

	const allSelected =
		sortedRows.length > 0 && sortedRows.every((row) => selected.has(getRowId(row)));
	const someSelected = sortedRows.some((row) => selected.has(getRowId(row)));

	const header = useMemo<HeaderModel>(
		() => ({
			columns: headerColumns,
			sort,
			translations,
			allSelected,
			someSelected,
			onSort: (id) => {
				setSort((current) => {
					if (current?.id !== id) {
						return { id, direction: 'ascending' };
					}

					if (current.direction === 'ascending') {
						return { id, direction: 'descending' };
					}

					return null;
				});
			},
			onPin: (id) => {
				setPinned((current) => {
					const next = new Set(current);

					if (next.has(id)) {
						next.delete(id);
					} else {
						next.add(id);
					}

					return next;
				});
			},
			onResize: (id, next) => {
				setWidths((current) => ({ ...current, [id]: next }));
			},
			onReorder: (sourceId, targetId) => {
				setOrder((current) => {
					const base = current.length > 0 ? [...current] : columns.map((column) => column.id);
					const from = base.indexOf(sourceId);
					const to = base.indexOf(targetId);

					if (from < 0 || to < 0 || from === to) {
						return base;
					}

					const [moved] = base.splice(from, 1);

					if (moved === undefined) {
						return base;
					}

					base.splice(to, 0, moved);

					return base;
				});
			},
			onToggleAll: () => {
				setSelected((current) => {
					if (sortedRows.every((row) => current.has(getRowId(row)))) {
						return new Set();
					}

					return new Set(sortedRows.map((row) => getRowId(row)));
				});
			}
		}),
		[allSelected, columns, getRowId, headerColumns, someSelected, sort, sortedRows, translations]
	);

	const virtualizer = useVirtualizer({
		count: loading === 'page' ? 0 : sortedRows.length,
		getScrollElement: () => scrollRef.current,
		estimateSize: () => {
			const size = readPx('--size-medium');

			return size === 0 ? 1 : size;
		},
		overscan: 8
	});

	const showEmpty = loading !== 'page' && sortedRows.length === 0;

	return (
		<div className={cx(styles.frame, className)}>
			<div ref={scrollRef} className={cx(scrollStyles.scroll, styles.scroller)}>
				<div role="table" aria-label={label} className={styles.table}>
					<HeaderContext.Provider value={header}>
						<TableHeader />
					</HeaderContext.Provider>
					<div role="rowgroup">
						{loading === 'page' ? (
							<div role="row" className={styles.row}>
								<div role="cell" className={styles.note}>
									<Text.Body2>{translations.loading}</Text.Body2>
								</div>
							</div>
						) : null}
						{showEmpty ? (
							<div role="row" className={styles.row}>
								<div role="cell" className={styles.note}>
									{empty ?? <Text.Body2>{translations.empty}</Text.Body2>}
								</div>
							</div>
						) : null}
						{loading !== 'page' && sortedRows.length > 0 ? (
							<div className={styles.canvas} style={{ height: virtualizer.getTotalSize() }}>
								{virtualizer.getVirtualItems().map((item) => {
									const row = sortedRows[item.index];

									if (row === undefined) {
										return null;
									}

									const id = getRowId(row);

									return (
										<div
											key={id}
											role="row"
											data-index={item.index}
											ref={virtualizer.measureElement}
											className={cx(styles.row, styles.virtual)}
											style={{ transform: `translateY(${item.start}px)` }}
										>
											<div role="cell" className={styles.select}>
												<Checkbox
													aria-label={`${translations.selectRow} ${id}`}
													isSelected={selected.has(id)}
													onChange={(checked) => {
														setSelected((current) => {
															const next = new Set(current);

															if (checked) {
																next.add(id);
															} else {
																next.delete(id);
															}

															return next;
														});
													}}
												/>
											</div>
											{headerColumns.map((column) => {
												const source = columnById.get(column.id);

												return (
													<div
														key={column.id}
														role="cell"
														className={styles.cell}
														data-pinned={column.pinned ? 'true' : undefined}
														style={{
															width: column.width,
															insetInlineStart: column.pinned ? column.offset : undefined
														}}
													>
														{source ? source.cell(row) : null}
													</div>
												);
											})}
										</div>
									);
								})}
							</div>
						) : null}
						{loading === 'more' ? (
							<div role="row" className={styles.row}>
								<div role="cell" className={styles.note}>
									<Text.Body2>{translations.loading}</Text.Body2>
								</div>
							</div>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
}

const TableHeader = memo(function TableHeader() {
	const model = useHeaderModel();

	return (
		<div role="rowgroup">
			<div role="row" className={styles.header}>
				<div role="columnheader" className={cx(styles.heading, styles.select)}>
					<Checkbox
						aria-label={model.translations.selectAll}
						isSelected={model.allSelected}
						onChange={model.onToggleAll}
					/>
				</div>
				{model.columns.map((column) => (
					<HeaderCell key={column.id} column={column} />
				))}
			</div>
		</div>
	);
});

function HeaderCell({ column }: { column: HeaderColumn }) {
	const model = useHeaderModel();
	const sorted = model.sort?.id === column.id ? model.sort.direction : undefined;
	const nextLabel =
		sorted === 'ascending' ? model.translations.sortDescending : model.translations.sortAscending;

	function onDragStart(event: DragEvent<HTMLDivElement>) {
		event.dataTransfer.setData('text/plain', column.id);
		event.dataTransfer.effectAllowed = 'move';
	}

	function onDrop(event: DragEvent<HTMLDivElement>) {
		event.preventDefault();
		const sourceId = event.dataTransfer.getData('text/plain');

		if (!sourceId || sourceId === column.id) {
			return;
		}

		model.onReorder(sourceId, column.id);
	}

	function onResizeKey(event: KeyboardEvent<HTMLButtonElement>) {
		const step = readPx('--space-2') || 1;

		if (event.key === 'ArrowRight') {
			model.onResize(column.id, column.width + step);
		}

		if (event.key === 'ArrowLeft') {
			model.onResize(column.id, Math.max(column.minWidth, column.width - step));
		}
	}

	function onResizePointer(event: ReactPointerEvent<HTMLButtonElement>) {
		const startX = event.clientX;
		const startWidth = column.width;
		const target = event.currentTarget;
		target.setPointerCapture(event.pointerId);

		function onMove(move: PointerEvent) {
			model.onResize(column.id, Math.max(column.minWidth, startWidth + move.clientX - startX));
		}

		function onUp(up: PointerEvent) {
			if (target.hasPointerCapture(up.pointerId)) {
				target.releasePointerCapture(up.pointerId);
			}

			target.removeEventListener('pointermove', onMove);
			target.removeEventListener('pointerup', onUp);
		}

		target.addEventListener('pointermove', onMove);
		target.addEventListener('pointerup', onUp);
	}

	return (
		<div
			role="columnheader"
			className={styles.heading}
			aria-sort={sorted ?? 'none'}
			data-pinned={column.pinned ? 'true' : undefined}
			draggable
			onDragStart={onDragStart}
			onDragOver={(event) => {
				event.preventDefault();
			}}
			onDrop={onDrop}
			style={{ width: column.width, insetInlineStart: column.pinned ? column.offset : undefined }}
		>
			{column.sortable ? (
				<button
					type="button"
					aria-label={`${nextLabel} ${column.header}`}
					onClick={() => model.onSort(column.id)}
				>
					{column.header}
				</button>
			) : (
				column.header
			)}
			{column.pinnable ? (
				<button
					type="button"
					aria-label={column.pinned ? model.translations.unpin : model.translations.pin}
					onClick={() => model.onPin(column.id)}
				>
					{column.pinned ? model.translations.unpin : model.translations.pin}
				</button>
			) : null}
			<button
				type="button"
				className={styles.resizer}
				aria-label={model.translations.resize}
				onKeyDown={onResizeKey}
				onPointerDown={onResizePointer}
			/>
		</div>
	);
}
