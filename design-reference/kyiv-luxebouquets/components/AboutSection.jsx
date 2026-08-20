import React from 'react';
import styles from './AboutSection.module.css';

const AboutSection = () => {
  return (
    <section className={styles.about}>
      <div className={styles.left}>
        <p className="section-label">our story</p>
        <h2 className="section-title">About us</h2>
      </div>
      <div className={styles.right}>
        <h3>Kyiv LuxeBouquets</h3>
        <p>
          We are a modern local floral studio, which specializes in the design
          and delivery of unique bouquets. We have the best florists who
          carefully select each flower and create stunning arrangements that
          will take your breath away. Whether you need a bouquet for a special
          occasion or just want to brighten up your day, we have you covered.
        </p>
        <a href="/about" className="text-link">Learn more</a>
      </div>
    </section>
  );
};

export default AboutSection;
