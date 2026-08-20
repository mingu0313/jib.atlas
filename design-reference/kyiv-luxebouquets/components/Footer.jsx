import React, { useState } from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleRemind = (e) => {
    e.preventDefault();
    console.log('Remind email:', email);
  };

  return (
    <footer className={`container ${styles.footer}`}>
      <div className={styles.newsletter}>
        <div className={styles.newsletterText}>
          <p>
            Remember to offer beautiful flowers from Kyiv LuxeBouquets on
            Valentine's Day, Mother's Day, Christmas… We remind you 7 days
            before. No spam or sharing your address.
          </p>
        </div>
        <form className={styles.newsletterForm} onSubmit={handleRemind}>
          <input
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="btn-primary">Remind</button>
        </form>
      </div>

      <div className={styles.footerTop}>
        <div className={styles.footerContact}>
          <h4>Contact Us</h4>
          <div className={styles.contactItem}>
            <span className={styles.label}>Address</span>
            <span className={styles.value}>15/4 Khreshchatyk Street, Kyiv</span>
          </div>
          <div className={styles.contactItem}>
            <span className={styles.label}>Phone</span>
            <span className={styles.value}>+380980099777</span>
          </div>
          <div className={styles.contactItem}>
            <span className={styles.label}>General Enquiry:</span>
            <span className={styles.value}>Kiev.Florist.Studio@gmail.com</span>
          </div>
          <div className={styles.socialLinks}>
            <a href="#" aria-label="Instagram">IG</a>
            <a href="#" aria-label="Facebook">FB</a>
            <a href="#" aria-label="Twitter">TW</a>
            <a href="#" aria-label="Telegram">TG</a>
          </div>
        </div>

        <div className={styles.footerColumns}>
          <div className={styles.column}>
            <h4>Shop</h4>
            <ul>
              <li><a href="#">All Products</a></li>
              <li><a href="#">Fresh Flowers</a></li>
              <li><a href="#">Dried Flowers</a></li>
              <li><a href="#">Live Plants</a></li>
              <li><a href="#">Designer Vases</a></li>
              <li><a href="#">Aroma Candles</a></li>
              <li><a href="#">Freshener Diffuser</a></li>
            </ul>
          </div>
          <div className={styles.column}>
            <h4>Service</h4>
            <ul>
              <li><a href="#">Flower Subscription</a></li>
              <li><a href="#">Wedding & Event Decor</a></li>
            </ul>
          </div>
          <div className={styles.column}>
            <h4>About Us</h4>
            <ul>
              <li><a href="#">Our Story</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Shipping & returns</a></li>
              <li><a href="#">Terms & conditions</a></li>
              <li><a href="#">Privacy policy</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
