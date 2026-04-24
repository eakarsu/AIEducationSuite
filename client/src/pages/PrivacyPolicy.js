import React from 'react';
import './LegalPage.css';

function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <div className="container">
          <h1>Privacy Policy</h1>
          <p>Last updated: February 2026</p>
        </div>
      </div>
      <div className="container legal-content">
        <section>
          <h2>1. Information We Collect</h2>
          <p>We collect information you provide directly to us, including your name, email address, and content you create using our AI-powered tools such as essays, quizzes, reading analyses, music lessons, and learning paths.</p>
        </section>
        <section>
          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, including personalizing your learning experience through AI analysis. Your content is processed by AI models to generate feedback, grades, and recommendations.</p>
        </section>
        <section>
          <h2>3. Data Storage and Security</h2>
          <p>Your data is stored securely in encrypted databases. We implement industry-standard security measures including HTTPS encryption, password hashing, and access controls to protect your information.</p>
        </section>
        <section>
          <h2>4. Data Sharing</h2>
          <p>We do not sell, trade, or otherwise transfer your personal information to third parties. Content may be processed by AI service providers solely for the purpose of generating educational feedback.</p>
        </section>
        <section>
          <h2>5. Your Rights (GDPR)</h2>
          <p>You have the right to access, export, and delete your data at any time through the Settings page. You can download all your data in JSON format or permanently delete your account and all associated data.</p>
        </section>
        <section>
          <h2>6. Cookies</h2>
          <p>We use authentication tokens stored in your browser's local storage to maintain your login session. We do not use tracking cookies.</p>
        </section>
        <section>
          <h2>7. Children's Privacy</h2>
          <p>Our service is designed for educational purposes. Users under 13 should use the platform under parental or guardian supervision.</p>
        </section>
        <section>
          <h2>8. Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. We will notify users of any material changes through the platform notifications.</p>
        </section>
        <section>
          <h2>9. Contact Us</h2>
          <p>If you have questions about this privacy policy, please contact us through the Contact page or email privacy@aieducation.com.</p>
        </section>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
