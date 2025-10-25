import React from 'react';
import { MessageCircle, Heart, Shield, Globe, Zap, Users, Baby } from 'lucide-react';

const LandingPage = ({ onStartChat }) => {
  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="nav-content">
          <div className="logo">
            <img 
              src="https://i.imgur.com/your-tena-logo.png" 
              alt="Tena.ai Logo"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <Heart className="logo-icon" />
            <span>Tena.ai</span>
          </div>
          <button className="cta-button" onClick={onStartChat}>
            Start Your Journey
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Your Safe Space for<br />
            <span className="gradient-text">Mental Wellness</span>
          </h1>
          <p className="hero-subtitle">
            Specialized emotional support for women and children across Africa. 
            Available 24/7, right from your phone.
          </p>
          <button className="hero-cta" onClick={onStartChat}>
            <MessageCircle size={20} />
            Start Chatting Now
          </button>
          <p className="hero-note">Free • Private • Judgment-Free</p>
        </div>
        <div className="hero-visual">
          <div className="floating-card card-1">
            <Heart size={20} />
            <p>"Tena helped me navigate motherhood anxiety"</p>
          </div>
          <div className="floating-card card-2">
            <Shield size={20} />
            <p>"A safe space for my daughter to express herself"</p>
          </div>
          <div className="floating-card card-3">
            <MessageCircle size={20} />
            <p>"Supporting women through postpartum challenges"</p>
          </div>
          <div className="floating-card card-4">
            <Heart size={20} />
            <p>"Empowering children to understand their emotions"</p>
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <h2 className="section-title">Why Choose Tena AI?</h2>
        <p className="section-subtitle">
          Specialized mental health care for women and children through culturally-relevant support
        </p>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <Users size={28} />
            </div>
            <h3>Women-Centered Care</h3>
            <p>Specialized support for maternal mental health, work-life balance, and women's unique emotional needs</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Baby size={28} />
            </div>
            <h3>Child-Friendly Support</h3>
            <p>Age-appropriate emotional guidance to help children understand and express their feelings safely</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Heart size={28} />
            </div>
            <h3>24/7 Accessibility</h3>
            <p>Mental health support whenever you or your child needs it, right from your smartphone</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Globe size={28} />
            </div>
            <h3>Culturally Relevant</h3>
            <p>Built for African women and families, respecting cultural values and experiences</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Start Your Wellness Journey?</h2>
        <p>Join thousands of African women and families taking charge of their mental health</p>
        <button className="cta-button-large" onClick={onStartChat}>
          Begin Conversation
        </button>
      </section>

      <footer className="footer">
        <p>© 2024 Tena AI. Empowering women and children's mental wellness across Africa.</p>
      </footer>
    </div>
  );
};

export default LandingPage;