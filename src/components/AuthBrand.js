import BrandAnimation from './BrandAnimation';
import styles from '@/app/login/auth.module.css';

export default function AuthBrand({ light = false }) {
  return <div className={`${styles.loginBrand} ${light ? styles.loginBrandLight : ''}`}>
    <BrandAnimation className={styles.brandIcon} />
    <div><strong>Scrum Tracker</strong><span>by Systems Edge Solutions</span></div>
  </div>;
}
