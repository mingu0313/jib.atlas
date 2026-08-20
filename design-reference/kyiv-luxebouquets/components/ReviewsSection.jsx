import React from 'react';
import styles from './ReviewsSection.module.css';

const ReviewsSection = () => {
  return (
    <section className={styles.reviews}>
      <p className="section-label">Reviews</p>
      <h2 className="section-title">Our Clients say</h2>
      <blockquote className={styles.quote}>
        "Ordered flowers online and they were the best bouquet! Impressed
        everyone around. Highly recommend this flower shop!"
      </blockquote>
      <p className={styles.author}>– Ronald Richards</p>
      <a href="/reviews" className="text-link">Read reviews</a>
    </section>
  );
};

export default ReviewsSection;
