import React from 'react';
import styles from './Hero.module.css';

const categories = [
  { name: 'Fresh Flowers', image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=400&q=80', link: '/category/fresh-flowers' },
  { name: 'Dried Flowers', image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&q=80', link: '/category/dried-flowers' },
  { name: 'Live Plants', image: 'https://images.unsplash.com/photo-1463320898484-cdee8141c787?w=400&q=80', link: '/category/live-plants' },
  { name: 'Aroma Candles', image: 'https://images.unsplash.com/photo-1602874806219-59ecf1d21b50?w=400&q=80', link: '/category/aroma-candles' },
  { name: 'Fresheners', image: 'https://images.unsplash.com/photo-1585412459212-4e63e1b1b7a5?w=400&q=80', link: '/category/fresheners' },
];

const Hero = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.heroLeft}>
        <img
          src="https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800&q=80"
          alt="Kyiv LuxeBouquets"
          className={styles.heroImage}
        />
        <div className={styles.brandOverlay}>
          <h1>
            Kyiv<br />LuxeBouquets<sup className={styles.registered}>®</sup>
          </h1>
        </div>
      </div>

      <div className={styles.heroRight}>
        {categories.map((cat) => (
          <a href={cat.link} key={cat.name} className={styles.categoryCard}>
            <img src={cat.image} alt={cat.name} />
            <div className={styles.categoryInfo}>
              <span className={styles.categoryName}>{cat.name}</span>
              <span className={styles.categoryCta}>Shop now</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};

export default Hero;
