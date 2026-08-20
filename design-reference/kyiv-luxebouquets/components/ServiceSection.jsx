import React from 'react';
import styles from './ServiceSection.module.css';

const ServiceSection = () => {
  return (
    <>
      <section className={styles.heading}>
        <h2 className="section-title">Our Service</h2>
      </section>

      <section className={styles.serviceCard}>
        <div className={styles.imageWrap}>
          <img
            src="https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=800&q=80"
            alt="Flower Subscription"
          />
        </div>
        <div className={styles.content}>
          <p className="section-label">service</p>
          <h2 className="section-title">Flower Subscriptions</h2>
          <p className={styles.description}>
            Experience the convenience and savings of regular flower deliveries
            with our flexible subscription service — up to 30% more profitable
            than one-time purchases.
          </p>
          <a href="/subscription" className="text-link">Subscribe Now</a>
        </div>
      </section>

      <section className={styles.banner}>
        <div className={styles.bannerBg}>
          <img
            src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=80"
            alt="Wedding Decor"
          />
        </div>
        <div className={styles.bannerContent}>
          <p className="section-label" style={{ color: '#fff' }}>service</p>
          <h2 className="section-title" style={{ color: '#fff' }}>
            Wedding &amp; Event Decor
          </h2>
          <p>
            Let our team of expert florists and designers create stunning,
            on-trend floral décor for your special day. Trust us to bring your
            vision to life.
          </p>
          <button className="btn-outline-light">Inquire Now</button>
        </div>
      </section>
    </>
  );
};

export default ServiceSection;
