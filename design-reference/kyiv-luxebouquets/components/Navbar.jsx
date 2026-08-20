import React, { useState } from 'react';
import styles from './Navbar.module.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="container">
      <nav className={styles.navbar}>
        <div className={styles.navGroup}>
          <a href="#shop" className={styles.navLink}>Shop</a>
          <a href="#contact" className={styles.navLink}>Contact</a>
        </div>

        <button
          className={styles.menuToggle}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <div className={`${styles.navGroup} ${menuOpen ? styles.mobileOpen : ''}`}>
          <a href="#signin" className={styles.navLink}>Sign in</a>
          <a href="#cart" className={styles.navLink}>Cart</a>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
