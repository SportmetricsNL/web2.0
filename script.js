const menuToggle = document.querySelector('[data-menu-toggle]');
const mainNav = document.querySelector('[data-main-nav]');

if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const goalButtons = document.querySelectorAll('[data-goal-button]');
const testCards = document.querySelectorAll('[data-test-card]');
const goalFeedback = document.querySelector('[data-goal-feedback]');

const goalMessages = {
  conditie:
    'Aanrader: Step-test. Je krijgt precieze zones voor duurtraining zonder direct maximaal te gaan.',
  tijdrit:
    'Aanrader: Ramp-test + Critical Power. Gericht op wedstrijdspecifiek vermogen en pacing.',
  herstel:
    'Aanrader: Submaximale Step-test. Veilig opbouwen met betrouwbare feedback op VT1/VT2.',
  default:
    'Kies je doel en je ziet direct welke test het beste past bij je situatie.',
};

if (goalButtons.length && testCards.length && goalFeedback) {
  const applyGoal = (goal) => {
    testCards.forEach((card) => {
      const goals = card.dataset.goals ? card.dataset.goals.split(',') : [];
      card.classList.toggle('recommended', goals.includes(goal));
    });

    goalButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.goalButton === goal);
    });

    goalFeedback.textContent = goalMessages[goal] || goalMessages.default;
  };

  goalButtons.forEach((button) => {
    button.addEventListener('click', () => {
      applyGoal(button.dataset.goalButton || 'default');
    });
  });

  applyGoal('conditie');
}

const yearNode = document.querySelector('[data-year]');
if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

const bookingForm = document.querySelector('[data-booking-form]');
if (bookingForm) {
  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = bookingForm.querySelector('[data-form-status]');
    if (status) {
      status.textContent = 'Dank! Je aanvraag is ontvangen. We nemen binnen 24 uur contact met je op.';
    }
    bookingForm.reset();
  });
}
