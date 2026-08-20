import React from 'react';
import styles from './BenefitsSection.module.css';

const benefits = [
  {
    title: 'Stylish bouquets by florists',
    description: 'At our floral studio, our professional florists craft the most elegant and stylish bouquets using only the freshest and highest quality materials available to ensure your complete satisfaction.',
  },
  {
    title: 'On-time delivery',
    description: 'Never miss a moment with our on-time flower delivery service. Our couriers will deliver your bouquet personally, without boxes, to ensure it arrives in perfect condition.',
  },
  {
    title: 'Safe payment',
    description: 'You can feel secure when placing an order with us, as we use industry-standard security measures to protect your payment information. Your transactions are always safe and encrypted.',
  },
  {
    title: 'Subscription by your needs',
    description: 'With our subscription service tailored to your specific needs, you can enjoy the convenience of having beautiful bouquets delivered straight to your doorstep on a regular basis.',
  },
];

const BenefitsSection = () => {
  return (
    <section className={styles.benefits}>
      <h2 className="section-title">Why choose us?</h2>
      <div className={styles.grid}>
        {benefits.map((item, index) => (
          <div key={index} className={styles.item}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BenefitsSection;
