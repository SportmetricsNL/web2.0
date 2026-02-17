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

const setActiveState = (buttons, key, value) => {
  buttons.forEach((button) => {
    button.classList.toggle('active', button.dataset[key] === value);
  });
};

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

    setActiveState(goalButtons, 'goalButton', goal);
    goalFeedback.textContent = goalMessages[goal] || goalMessages.default;
  };

  goalButtons.forEach((button) => {
    button.addEventListener('click', () => {
      applyGoal(button.dataset.goalButton || 'default');
    });
  });

  applyGoal('conditie');
}

const chainButtons = document.querySelectorAll('[data-chain-button]');
const chainTitle = document.querySelector('[data-chain-title]');
const chainText = document.querySelector('[data-chain-text]');

const chainData = {
  longen: {
    title: 'Ventilatie en gaswisseling',
    text: 'De longen leveren de O2 aan die het systeem in kan. Goede ventilatie en gaswisseling zijn de start van de keten.',
  },
  hart: {
    title: 'Transport via hart en bloed',
    text: 'Het hart en de bloedbaan bepalen hoeveel O2 per minuut naar de werkende spieren wordt getransporteerd.',
  },
  spieren: {
    title: 'Spieropname en mitochondrien',
    text: 'In de spiervezel wordt O2 gebruikt voor ATP-productie. Lokale capillairen en mitochondrien bepalen de benutting.',
  },
};

if (chainButtons.length && chainTitle && chainText) {
  const applyChain = (key) => {
    const value = chainData[key] || chainData.longen;
    setActiveState(chainButtons, 'chainButton', key);
    chainTitle.textContent = value.title;
    chainText.textContent = value.text;
  };

  chainButtons.forEach((button) => {
    button.addEventListener('click', () => {
      applyChain(button.dataset.chainButton || 'longen');
    });
  });

  applyChain('longen');
}

const bottleneckSlider = document.querySelector('[data-bottleneck-slider]');
const supplyFill = document.querySelector('[data-supply-fill]');
const useFill = document.querySelector('[data-use-fill]');
const supplyValue = document.querySelector('[data-supply-value]');
const useValue = document.querySelector('[data-use-value]');

if (bottleneckSlider && supplyFill && useFill && supplyValue && useValue) {
  const applyBottleneck = () => {
    const usePercent = Number(bottleneckSlider.value);
    const supplyPercent = 100 - usePercent;

    supplyFill.style.width = `${supplyPercent}%`;
    useFill.style.width = `${usePercent}%`;
    supplyValue.textContent = `${supplyPercent}%`;
    useValue.textContent = `${usePercent}%`;
  };

  bottleneckSlider.addEventListener('input', applyBottleneck);
  applyBottleneck();
}

const fatigueButtons = document.querySelectorAll('[data-fatigue-button]');
const fatigueTitle = document.querySelector('[data-fatigue-title]');
const fatigueText = document.querySelector('[data-fatigue-text]');
const fatigueNote = document.querySelector('[data-fatigue-note]');
const stageNodes = document.querySelectorAll('[data-stage-node]');

const fatigueData = {
  longen: {
    title: 'Longen',
    text: 'Maximale ademarbeid en gaswisseling kunnen limiteren. De aanleg is deels genetisch, training kan efficiency verbeteren.',
    note: 'Genetisch profiel bepaalt startpunt en plafond.',
    stage: 'longen',
  },
  hart: {
    title: 'Hart & bloed',
    text: 'Cardiale output en O2-transport via bloed kunnen de beperkende factor zijn. Gerichte intervalprikkel verbetert dit systeem.',
    note: 'Centrale aanvoer bepaalt vaak hoe lang je hoog kunt blijven.',
    stage: 'hart',
  },
  spieren: {
    title: 'Spieren',
    text: 'Spieruithouding, capillaire dichtheid en mitochondriale capaciteit bepalen hoe goed O2 lokaal wordt benut.',
    note: 'Perifere benutting bepaalt hoe efficiënt je het aangevoerde zuurstof gebruikt.',
    stage: 'spieren',
  },
  genetisch: {
    title: 'Genetisch profiel',
    text: 'Je genetische aanleg beïnvloedt startpunt en plafond. Training blijft bepalend voor hoeveel van dat potentieel je benut.',
    note: 'Genetisch profiel bepaalt startpunt en plafond.',
    stage: '',
  },
};

if (fatigueButtons.length && fatigueTitle && fatigueText && fatigueNote && stageNodes.length) {
  const applyFatigue = (key) => {
    const value = fatigueData[key] || fatigueData.longen;

    setActiveState(fatigueButtons, 'fatigueButton', key);
    fatigueTitle.textContent = value.title;
    fatigueText.textContent = value.text;
    fatigueNote.textContent = value.note;

    stageNodes.forEach((node) => {
      node.classList.toggle('active', node.dataset.stageNode === value.stage);
    });
  };

  fatigueButtons.forEach((button) => {
    button.addEventListener('click', () => {
      applyFatigue(button.dataset.fatigueButton || 'longen');
    });
  });

  applyFatigue('longen');
}

const modelButtons = document.querySelectorAll('[data-model-button]');
const modelTitle = document.querySelector('[data-model-title]');
const modelText = document.querySelector('[data-model-text]');

const modelData = {
  schattingen: {
    title: 'Model',
    text: 'Percentages van HRmax, 220-leeftijd, FTP-only en horloge-schattingen zijn generieke aannames.',
  },
  meting: {
    title: 'Meting',
    text: 'Ademgasanalyse in combinatie met vermogen laat je echte fysiologische respons zien en verkleint individuele foutmarges.',
  },
};

if (modelButtons.length && modelTitle && modelText) {
  const applyModel = (key) => {
    const value = modelData[key] || modelData.schattingen;
    setActiveState(modelButtons, 'modelButton', key);
    modelTitle.textContent = value.title;
    modelText.textContent = value.text;
  };

  modelButtons.forEach((button) => {
    button.addEventListener('click', () => {
      applyModel(button.dataset.modelButton || 'schattingen');
    });
  });

  applyModel('schattingen');
}

const energyIntensity = document.querySelector('[data-energy-intensity]');
const energyPcrFill = document.querySelector('[data-energy-pcr-fill]');
const energyAnaerFill = document.querySelector('[data-energy-anaer-fill]');
const energyAeroFill = document.querySelector('[data-energy-aero-fill]');
const energyPcrValue = document.querySelector('[data-energy-pcr-value]');
const energyAnaerValue = document.querySelector('[data-energy-anaer-value]');
const energyAeroValue = document.querySelector('[data-energy-aero-value]');

if (
  energyIntensity &&
  energyPcrFill &&
  energyAnaerFill &&
  energyAeroFill &&
  energyPcrValue &&
  energyAnaerValue &&
  energyAeroValue
) {
  const normalize = (values) => {
    const sum = values.reduce((acc, val) => acc + val, 0) || 1;
    return values.map((val) => val / sum);
  };

  const systemMix = (value) => {
    const pcr = Math.max(0, (value - 70) / 30);
    const anaer = Math.max(0, 1 - Math.abs(value - 60) / 30);
    const aero = Math.max(0, (70 - value) / 70);
    const [p, a, e] = normalize([pcr, anaer, aero]);
    return { p, a, e };
  };

  const updateEnergyMix = () => {
    const value = Number(energyIntensity.value);
    const { p, a, e } = systemMix(value);

    const pPercent = Math.round(p * 100);
    const aPercent = Math.round(a * 100);
    const ePercent = Math.round(e * 100);

    energyPcrFill.style.width = `${pPercent}%`;
    energyAnaerFill.style.width = `${aPercent}%`;
    energyAeroFill.style.width = `${ePercent}%`;
    energyPcrValue.textContent = `${pPercent}%`;
    energyAnaerValue.textContent = `${aPercent}%`;
    energyAeroValue.textContent = `${ePercent}%`;
  };

  energyIntensity.addEventListener('input', updateEnergyMix);
  updateEnergyMix();
}

const energyFuelSlider = document.querySelector('[data-energy-fuel-slider]');
const energyCarbFill = document.querySelector('[data-energy-carb-fill]');
const energyFatFill = document.querySelector('[data-energy-fat-fill]');
const energyCarbValue = document.querySelector('[data-energy-carb-value]');
const energyFatValue = document.querySelector('[data-energy-fat-value]');

if (energyFuelSlider && energyCarbFill && energyFatFill && energyCarbValue && energyFatValue) {
  const updateFuelMix = () => {
    const value = Number(energyFuelSlider.value);
    const carb = Math.max(0, Math.min(100, value));
    const fat = 100 - carb;

    energyCarbFill.style.width = `${carb}%`;
    energyFatFill.style.width = `${fat}%`;
    energyCarbValue.textContent = `${carb}%`;
    energyFatValue.textContent = `${fat}%`;
  };

  energyFuelSlider.addEventListener('input', updateFuelMix);
  updateFuelMix();
}

const energyZoneButtons = document.querySelectorAll('[data-energy-zone-button]');
const energyZonePanels = document.querySelectorAll('[data-energy-zone-panel]');

if (energyZoneButtons.length && energyZonePanels.length) {
  const applyEnergyZone = (zone) => {
    setActiveState(energyZoneButtons, 'energyZoneButton', zone);
    energyZonePanels.forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.energyZonePanel === zone);
    });
  };

  energyZoneButtons.forEach((button) => {
    button.addEventListener('click', () => {
      applyEnergyZone(button.dataset.energyZoneButton || 'vt1');
    });
  });

  applyEnergyZone('vt1');
}

const zoneModelButtons = document.querySelectorAll('[data-zone-model-button]');
const zoneModelPanels = document.querySelectorAll('[data-zone-model-panel]');

if (zoneModelButtons.length && zoneModelPanels.length) {
  const applyZoneModel = (zone) => {
    setActiveState(zoneModelButtons, 'zoneModelButton', zone);
    zoneModelPanels.forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.zoneModelPanel === zone);
    });
  };

  zoneModelButtons.forEach((button) => {
    button.addEventListener('click', () => {
      applyZoneModel(button.dataset.zoneModelButton || 'z1');
    });
  });

  applyZoneModel('z1');
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
