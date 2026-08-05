/* ==========================================================================
   Send Moi — Client JavaScript (Landing & Phone Interactive Demo)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initPhoneDemo();
  initFaqAccordion();
  initSmoothScroll();
  initAgentFormHandler();
});

/**
 * Interactive Phone Demo Simulator
 */
function initPhoneDemo() {
  const tabSupervision = document.getElementById('tab-btn-supervision');
  const tabCourses = document.getElementById('tab-btn-courses');
  const cardTag = document.getElementById('demo-card-tag');
  const cardTitle = document.getElementById('demo-card-title');
  const cardDesc = document.getElementById('demo-card-desc');
  const cardPrice = document.getElementById('demo-card-price');
  const proofImg = document.getElementById('demo-proof-img');
  const gpsInfo = document.getElementById('demo-gps-info');
  const simBtn = document.getElementById('btn-sim-action');
  const simFeedback = document.getElementById('sim-feedback');
  const cityBadge = document.getElementById('phone-current-city');

  if (!tabSupervision || !tabCourses) return;

  const mockData = {
    supervision: {
      tag: 'Supervision Chantier',
      tagClass: 'tag-supervision',
      title: 'Inspection Dalle Béton R+1',
      desc: 'Contrôle de l\'avancement des poteaux et vérification de la livraison de ciment à Makepe.',
      price: '25 000 FCFA',
      city: 'Douala — Akwa',
      img: 'assets/chantier_supervision_proof.png',
      gps: '📍 4.0511° N, 9.7679° E | ⏱️ Aujourd\'hui 14:32'
    },
    courses: {
      tag: 'Courses & Achats',
      tagClass: 'tag-courses',
      title: 'Achat Vivres & Remise Pharmacie',
      desc: 'Achat sac de riz, huile et médicaments de tension livrés à Bastos.',
      price: '15 000 FCFA',
      city: 'Yaoundé — Bastos',
      img: 'assets/chantier_supervision_proof.png', // Fallback or distinct mock image
      gps: '📍 3.8480° N, 11.5021° E | ⏱️ Aujourd\'hui 11:15'
    }
  };

  function updatePhoneView(category) {
    const data = mockData[category];
    if (!data) return;

    if (category === 'supervision') {
      tabSupervision.classList.add('active');
      tabCourses.classList.remove('active');
      cardTag.className = 'mission-card-header ' + data.tagClass;
    } else {
      tabCourses.classList.add('active');
      tabSupervision.classList.remove('active');
      cardTag.className = 'mission-card-header ' + data.tagClass;
    }

    cardTag.innerText = data.tag;
    cardTitle.innerText = data.title;
    cardDesc.innerText = data.desc;
    cardPrice.innerText = data.price;
    cityBadge.innerText = data.city;
    if (proofImg) proofImg.src = data.img;
    if (gpsInfo) gpsInfo.innerHTML = data.gps;

    // Reset simulator button
    simBtn.disabled = false;
    simBtn.innerHTML = '<span>Valider la mission & Libérer les fonds</span>';
    simBtn.className = 'btn btn-success btn-sm';
    simFeedback.innerText = 'Paiement actuellement sous séquestre sécurisé';
    simFeedback.style.color = '#9CA3AF';
  }

  tabSupervision.addEventListener('click', () => updatePhoneView('supervision'));
  tabCourses.addEventListener('click', () => updatePhoneView('courses'));

  // Simulator Action Button
  if (simBtn) {
    simBtn.addEventListener('click', () => {
      simBtn.disabled = true;
      simBtn.innerHTML = '<span>⏳ Traitement du virement...</span>';
      
      setTimeout(() => {
        simBtn.innerHTML = '<span>✓ Mission Clôturée & Agent Payé</span>';
        simBtn.className = 'btn btn-secondary btn-sm';
        simFeedback.innerText = '🎉 Rémunération de l\'agent versée via MTN MoMo avec succès !';
        simFeedback.style.color = '#4ADE80';
      }, 1500);
    });
  }
}

/**
 * FAQ Accordion Handler
 */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        faqItems.forEach(i => i.classList.remove('open'));
        if (!isOpen) {
          item.classList.add('open');
        }
      });
    }
  });
}

/**
 * Smooth Scroll for Navigation Anchors
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

/**
 * Agent Candidature Form Handler
 */
function initAgentFormHandler() {
  const form = document.getElementById('form-candidature-agent');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');

    btn.disabled = true;
    btn.innerHTML = '<span>⏳ Enregistrement du dossier KYC...</span>';

    setTimeout(() => {
      btn.innerHTML = '<span>✓ Candidature soumise avec succès !</span>';
      btn.style.background = 'linear-gradient(135deg, #16A34A, #22C55E)';
      alert('🎉 Votre candidature d\'agent indépendant a bien été reçue. Notre équipe vous recontactera sous 48h pour la vérification KYC.');
      form.reset();
    }, 1500);
  });
}
