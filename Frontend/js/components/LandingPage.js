export default {
    template: `
    <div class="landing-shell">
        <section class="landing-hero">
            <div class="landing-overlay"></div>
            <div class="container landing-container position-relative">
                <div class="row align-items-center g-4 landing-row">
                    <div class="col-xl-6 col-lg-7">
                        <div class="brand-mark mb-4">
                            <img
                                v-if="logoUrl"
                                :src="logoUrl"
                                alt="EduITalent Global Services"
                                class="landing-logo"
                                @error="logoMissing = true"
                            >
                            <div v-else class="brand-fallback">EduITalent</div>
                        </div>
                        <span class="eyebrow">EduITalent Global Services</span>
                        <h1 class="hero-title mt-3">The CRM front desk for recruitment, sales, and people operations.</h1>
                        <p class="hero-copy mt-3">
                            Leading International Recruitment and Consultancy Firm.
                            Revolutionizing the hiring process by matching elite skills with global requirements.
                        </p>
                        <div class="d-flex flex-wrap gap-3 mt-4">
                            <router-link to="/login" class="btn btn-lg hero-btn-primary">
                                Login to CRM
                            </router-link>
                            <router-link to="/register" class="btn btn-lg hero-btn-secondary">
                                Register Account
                            </router-link>
                        </div>
                        <div class="hero-meta mt-4">
                            <span><i class="bi bi-geo-alt"></i> Noida and Dubai offices</span>
                            <span><i class="bi bi-clock"></i> Mon-Fri, 09:30 - 17:30</span>
                        </div>
                    </div>

                    <div class="col-xl-5 col-lg-5">
                        <div class="hero-panel">
                            <div class="panel-header d-flex justify-content-between align-items-start">
                                <div>
                                    <p class="panel-kicker mb-1">Welcome to the CRM</p>
                                    <h2 class="panel-title mb-0">Team access portal</h2>
                                </div>
                                <span class="status-pill">
                                    <span class="status-dot"></span>
                                    Secure Access
                                </span>
                            </div>

                            <div class="stats-grid mt-4">
                                <div class="metric-card">
                                    <span class="metric-value">1000+</span>
                                    <span class="metric-label">Offers Made</span>
                                </div>
                                <div class="metric-card">
                                    <span class="metric-value">500+</span>
                                    <span class="metric-label">Happy Clients</span>
                                </div>
                                <div class="metric-card">
                                    <span class="metric-value">9+</span>
                                    <span class="metric-label">Service Years</span>
                                </div>
                                <div class="metric-card">
                                    <span class="metric-value">20+</span>
                                    <span class="metric-label">Industry Domains</span>
                                </div>
                            </div>

                            <div class="message-card mt-4">
                                <p class="message-label">About Us</p>
                                <p class="message-text mb-0">
                                    EduITalent is a leading International Recruitment firm. We specialize in matching skills with client requirements, providing resources from Entry to Top Management level.
                                </p>
                            </div>

                            <div class="support-card mt-4">
                                <div class="support-item">
                                    <i class="bi bi-envelope"></i>
                                    <a href="mailto:info@eduitalent.com">info@eduitalent.com</a>
                                </div>
                                <div class="support-item">
                                    <i class="bi bi-telephone"></i>
                                    <a href="tel:+918376913569">+91-8376913569 / 7838305432</a>
                                </div>
                                <div class="support-item">
                                    <i class="bi bi-globe2"></i>
                                    <a href="tel:+971505382297">+971-505382297</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="landing-strip">
            <div class="container">
                <div class="row g-3">
                    <div class="col-md-4">
                        <div class="info-tile">
                            <p class="tile-label">Entity</p>
                            <p class="tile-value mb-0">Edutalent Sgi Pvt Ltd.</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="info-tile">
                            <p class="tile-label">Noida Office</p>
                            <p class="tile-value mb-0">S6, 2nd Floor, A1/B, Sec-16, Noida-201301</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="info-tile">
                            <p class="tile-label">Dubai Office</p>
                            <p class="tile-value mb-0">Al Basma Business Centre, Kazim Building - Office No.101 - Garhoud - Dubai</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <footer class="landing-footer">
            <div class="container">
                    <div class="footer-top">
                        <div>
                            <p class="footer-heading">EduITalent Global Services</p>
                            <p class="footer-copy mb-0">
                                Unauthorized access to this CRM is strictly prohibited. All activities are monitored for security purposes.
                            </p>
                        </div>
                        <div class="footer-socials">
                        <a href="https://x.com/EduITalent1" target="_blank" rel="noopener noreferrer" aria-label="X"><span class="social-x-mark">X</span></a>
                        <a href="https://www.facebook.com/people/Eduitalent/100057256517650/?rdid=Plo1en8DHj2BIHey&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F185LVnxEEF%2F" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i class="bi bi-facebook"></i></a>
                        <a href="https://www.instagram.com/eduitalent?igsh=d3JpOHpxdmZ2dnpk" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="bi bi-instagram"></i></a>
                        <a href="https://www.linkedin.com/company/eduitalent-company/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i class="bi bi-linkedin"></i></a>
                        <a href="https://www.youtube.com/channel/UCowFqkK3zmbUbvIuz1aUMgw" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><i class="bi bi-youtube"></i></a>
                        </div>
                    </div>
                <div class="footer-bottom">
                    <p class="mb-0">India: +91-8376913569 / 7838305432</p>
                    <p class="mb-0">UAE: +971-505382297</p>
                    <p class="mb-0 text-lg-end">Copyright {{ currentYear }} EduITalent Global Services</p>
                </div>
            </div>
        </footer>
    </div>
    `,
    data() {
        return {
            logoMissing: false,
            currentYear: new Date().getFullYear()
        };
    },
    computed: {
        logoUrl() {
            if (this.logoMissing) return '';
            return '/uploads/Logo/EduITalent%20Logo.png';
        }
    }
};
