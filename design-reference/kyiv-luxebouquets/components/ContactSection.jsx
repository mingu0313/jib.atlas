import React, { useState } from 'react';
import styles from './ContactSection.module.css';

const ContactSection = () => {
  const [phone, setPhone] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Book a call:', phone);
  };

  return (
    <section id="contact" className={styles.contact}>
      <div className={styles.left}>
        <h2 className="section-title">To Contact Us</h2>
        <p className={styles.subtitle}>We will call you back</p>
        <form onSubmit={handleSubmit}>
          <input
            type="tel"
            className={styles.input}
            placeholder="+380 XX XXX XX XX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button type="submit" className="btn-primary">book a call</button>
        </form>
      </div>

      <div className={styles.right}>
        <div className={styles.infoBlock}>
          <h3>Phone</h3>
          <p className={styles.value}>+380980099777</p>
          <p className={styles.value}>+380980099111</p>
        </div>
        <div className={styles.infoBlock}>
          <h3>Address</h3>
          <p className={styles.subText}>opening hours: 8 to 11 p.m.</p>
          <p className={styles.value}>15/4 Khreshchatyk Street, Kyiv</p>
        </div>
        <div className={styles.infoBlock}>
          <h3>Follow us</h3>
          <div className={styles.socialLinks}>
            <a href="#" aria-label="Instagram">IG</a>
            <a href="#" aria-label="Facebook">FB</a>
            <a href="#" aria-label="Twitter">TW</a>
            <a href="#" aria-label="Telegram">TG</a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
