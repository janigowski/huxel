import styles from './spinner.module.css';

export type SpinnerProps = {
	label?: string;
};

export function Spinner({ label }: SpinnerProps) {
	const named = label !== undefined;

	return (
		<span
			className={styles.spinner}
			role={named ? 'progressbar' : undefined}
			aria-label={label}
			aria-hidden={named ? undefined : true}
		/>
	);
}
