import styles from "../../style/noise.module.css";

export default function NoiseOverlay() {
  // 不再需要 children 屬性
  return <div className={styles.noise_overlay}></div>;
}
