import React from 'react';
import { MessageCircle, Heart, Shield, Globe, Zap, Users, Baby, CheckCircle, Lock, Clock } from 'lucide-react';
import {images} from '../assets/assets'

const LandingPage = ({ onStartChat }) => {
  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="nav-content">
          <div className="logo">
            <img 
              src={images.logo} 
              alt="Tena.ai Logo"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <span>Tena AI</span>
          </div>
          <button className="cta-button" onClick={onStartChat}>
            Start Your Journey
          </button>
        </div>
      </nav>

      {/* Hero Section - SpeakUp Style */}
      <section className="hero-main">
        <div className="hero-main-content">
          <div className="hero-text">
            <h1 className="hero-main-title">
              Your Safe Space for<br />
              <span className="gradient-text">Mental Wellness</span>
            </h1>
            <p className="hero-main-subtitle">
              Specialized emotional support for women and children across Africa. 
              Available 24/7, right from your phone.
            </p>
            <div className="hero-actions">
              <button className="hero-cta-primary" onClick={onStartChat}>
                <MessageCircle size={20} />
                Start Chatting Now
              </button>
              <p className="hero-note">Free • Private • Judgment-Free</p>
            </div>
          </div>
          <div className="hero-image">
            <img 
              src={images.mental}
              alt="Mental Wellness Support"
            />
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="trust-section">
        <p className="trust-title">Trusted by families across Africa</p>
        <div className="trust-logos">
          <div className="trust-logo">
            <img src="https://via.placeholder.com/120x60/d6cbb3/333333?text=Partner+1" alt="Partner 1" />
          </div>
          <div className="trust-logo">
            <img src="https://via.placeholder.com/120x60/d6cbb3/333333?text=Partner+2" alt="Partner 2" />
          </div>
          <div className="trust-logo">
            <img src="https://via.placeholder.com/120x60/d6cbb3/333333?text=Partner+3" alt="Partner 3" />
          </div>
          <div className="trust-logo">
            <img src="https://via.placeholder.com/120x60/d6cbb3/333333?text=Partner+4" alt="Partner 4" />
          </div>
        </div>
      </section>

      {/* Main Platform Overview */}
      <section className="platform-overview">
        <div className="platform-header">
          <h2 className="section-title">Complete Mental Wellness Platform</h2>
          <p className="section-subtitle">
            Everything you need to support mental health for women and children
          </p>
        </div>
        <div className="platform-grid">
          <div className="platform-card">
            <div className="platform-card-icon">
              <MessageCircle size={32} />
            </div>
            <h3>Multi-channel Support</h3>
            <p>Chat, voice, and text support available on any device</p>
          </div>
          <div className="platform-card">
            <div className="platform-card-icon">
              <Shield size={32} />
            </div>
            <h3>Safe & Confidential</h3>
            <p>Your conversations are private and secure</p>
          </div>
          <div className="platform-card">
            <div className="platform-card-icon">
              <Zap size={32} />
            </div>
            <h3>AI-Powered Care</h3>
            <p>Intelligent responses tailored to your needs</p>
          </div>
          <div className="platform-card">
            <div className="platform-card-icon">
              <Globe size={32} />
            </div>
            <h3>Culturally Aware</h3>
            <p>Built for African families and values</p>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="impact-section">
        <h2 className="section-title">The Impact of Mental Wellness</h2>
        <p className="section-subtitle">
          Empowering women and children across Africa with accessible mental health support
        </p>
        <div className="impact-grid">
          <div className="impact-card">
            <div className="impact-image">
              <img src={images.confidential} alt="Confidential Support" />
            </div>
            <div className="impact-content">
              <h3>Confidential and Trusted</h3>
              <p>Your emotional wellbeing matters. Share freely in a judgment-free space designed for women and children.</p>
            </div>
          </div>
          <div className="impact-card">
            <div className="impact-image">
              <img src={images.available} alt="24/7 Available" />
            </div>
            <div className="impact-content">
              <h3>Always Available</h3>
              <p>Mental health doesn't wait. Access support whenever you or your child needs it, day or night.</p>
            </div>
          </div>
          <div className="impact-card">
            <div className="impact-image">
              <img src={images.culturally} alt="Culturally Relevant" />
            </div>
            <div className="impact-content">
              <h3>Culturally Relevant Care</h3>
              <p>Built with African families in mind, respecting traditions while providing modern support.</p>
            </div>
          </div>
          <div className="impact-card last-card">
            <div className="impact-image">
              <img src={images.better} alt="Better Outcomes"/>
            </div>
            <div className="impact-content">
              <h3>Better Mental Health Outcomes</h3>
              <p>Evidence-based support that helps families thrive emotionally and mentally.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Specialized Care Section */}
      <section className="features" id="features">
        <h2 className="section-title">Specialized Care for Every Need</h2>
        <p className="section-subtitle">
          Tailored mental health support designed specifically for women and children
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
              <Clock size={28} />
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

      {/* Security & Privacy Section */}
      <section className="security-section">
        <div className="security-content">
          <div className="security-text">
            <h2 className="section-title">Your Privacy is Our Priority</h2>
            <p className="security-description">
              Tena.ai is built with enterprise-grade security and privacy measures. 
              We ensure that your conversations remain confidential and secure, so you can 
              speak freely without worry.
            </p>
            <div className="security-features">
              <div className="security-feature">
                <CheckCircle size={24} />
                <div>
                  <h4>End-to-End Encryption</h4>
                  <p>All conversations are encrypted and secure</p>
                </div>
              </div>
              <div className="security-feature">
                <CheckCircle size={24} />
                <div>
                  <h4>GDPR Compliant</h4>
                  <p>We follow international privacy standards</p>
                </div>
              </div>
              <div className="security-feature">
                <CheckCircle size={24} />
                <div>
                  <h4>No Data Sharing</h4>
                  <p>Your information is never sold or shared</p>
                </div>
              </div>
            </div>
          </div>
          <div className="security-image">
            <img src={images.security} alt="Security" />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <h2 className="section-title">Hear from Our Community</h2>
        <p className="section-subtitle">Real stories from women and families using Tena.ai</p>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-icon">
              <Heart size={24} />
            </div>
            <p className="testimonial-text">
              "Tena helped me navigate motherhood anxiety when I felt completely alone. 
              Having support available at 3am made all the difference."
            </p>
            <div className="testimonial-author">
              <strong>Amara K.</strong>
              <span>New Mother, Lagos</span>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-icon">
              <Shield size={24} />
            </div>
            <p className="testimonial-text">
              "A safe space for my daughter to express herself. She's more confident 
              and emotionally aware since we started using Tena."
            </p>
            <div className="testimonial-author">
              <strong>Grace M.</strong>
              <span>Parent, Nairobi</span>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-icon">
              <MessageCircle size={24} />
            </div>
            <p className="testimonial-text">
              "The postpartum support was exactly what I needed. Culturally sensitive 
              and available whenever I needed to talk."
            </p>
            <div className="testimonial-author">
              <strong>Fatima S.</strong>
              <span>Mother of Two, Accra</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>Is Tena.ai really free?</h3>
            <p>Yes! Our basic mental wellness support is completely free for all women and children across Africa.</p>
          </div>
          <div className="faq-item">
            <h3>How is my privacy protected?</h3>
            <p>All conversations are encrypted and confidential. We never share your information with third parties.</p>
          </div>
          <div className="faq-item">
            <h3>Can children use Tena.ai safely?</h3>
            <p>Yes! We have age-appropriate support designed specifically for children with parental guidance features.</p>
          </div>
          <div className="faq-item">
            <h3>What languages do you support?</h3>
            <p>We currently support English with more African languages coming soon including Swahili, Yoruba, and Hausa.</p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
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