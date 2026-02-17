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

const cpSlider = document.querySelector('[data-cp-slider]');
const cpWprimeSlider = document.querySelector('[data-cp-wprime-slider]');
const cpPowerSlider = document.querySelector('[data-cp-power-slider]');
const cpTargetSlider = document.querySelector('[data-cp-target-slider]');

const cpValue = document.querySelector('[data-cp-value]');
const cpWprimeValue = document.querySelector('[data-cp-wprime-value]');
const cpPowerValue = document.querySelector('[data-cp-power-value]');
const cpTargetValue = document.querySelector('[data-cp-target-value]');

const cpDeltaFill = document.querySelector('[data-cp-delta-fill]');
const cpDeltaValue = document.querySelector('[data-cp-delta-value]');
const cpTimeFill = document.querySelector('[data-cp-time-fill]');
const cpTimeValue = document.querySelector('[data-cp-time-value]');
const cpWuseFill = document.querySelector('[data-cp-wuse-fill]');
const cpWuseValue = document.querySelector('[data-cp-wuse-value]');
const cpMaxPowerFill = document.querySelector('[data-cp-maxpower-fill]');
const cpMaxPowerValue = document.querySelector('[data-cp-maxpower-value]');

const cpBands = document.querySelectorAll('[data-cp-band]');
const cpBlocks = document.querySelectorAll('[data-cp-block]');
const cpStripStatus = document.querySelector('[data-cp-strip-status]');
const cpCaseText = document.querySelector('[data-cp-case-text]');

if (
  cpSlider &&
  cpWprimeSlider &&
  cpPowerSlider &&
  cpTargetSlider &&
  cpValue &&
  cpWprimeValue &&
  cpPowerValue &&
  cpTargetValue &&
  cpDeltaFill &&
  cpDeltaValue &&
  cpTimeFill &&
  cpTimeValue &&
  cpWuseFill &&
  cpWuseValue &&
  cpMaxPowerFill &&
  cpMaxPowerValue
) {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const formatClock = (seconds) => {
    if (!Number.isFinite(seconds)) {
      return 'steady-state';
    }
    const safe = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  const getBand = (cp) => {
    if (cp < 200) {
      return 'recreatief';
    }
    if (cp < 260) {
      return 'getraind';
    }
    if (cp <= 320) {
      return 'competitief';
    }
    return 'hoog';
  };

  const setBand = (band) => {
    cpBands.forEach((node) => {
      node.classList.toggle('active', node.dataset.cpBand === band);
    });
  };

  const setStrip = (delta) => {
    if (!cpBlocks.length) {
      return;
    }

    const workRatio = clamp((delta + 40) / 180, 0, 1);
    const workBlocks = Math.round(workRatio * cpBlocks.length);

    cpBlocks.forEach((node, index) => {
      node.classList.toggle('work', index < workBlocks);
    });

    if (!cpStripStatus) {
      return;
    }

    if (delta <= 0) {
      cpStripStatus.textContent = '≤ CP: steady-state, W′ kan herstellen';
      return;
    }

    if (delta < 25) {
      cpStripStatus.textContent = '> CP: lichte boven-CP belasting, W′ verbruik';
      return;
    }

    if (delta < 60) {
      cpStripStatus.textContent = '> CP: matig-zware boven-CP belasting, W′ verbruik';
      return;
    }

    cpStripStatus.textContent = '> CP: zware boven-CP belasting, snelle W′ leegloop';
  };

  const updateCpModel = () => {
    const cp = Number(cpSlider.value);
    const wprimeKj = Number(cpWprimeSlider.value);
    const power = Number(cpPowerSlider.value);
    const targetSeconds = Number(cpTargetSlider.value);

    const delta = power - cp;
    const timeSeconds = delta > 0 ? (wprimeKj * 1000) / delta : Number.POSITIVE_INFINITY;
    const wUseKj = delta > 0 ? wprimeKj : 0;
    const maxSustainablePower = cp + (wprimeKj * 1000) / Math.max(1, targetSeconds);

    cpValue.textContent = `${Math.round(cp)} W`;
    cpWprimeValue.textContent = `${wprimeKj.toFixed(1)} kJ`;
    cpPowerValue.textContent = `${Math.round(power)} W`;
    cpTargetValue.textContent = `${Math.round(targetSeconds)} s`;

    cpDeltaValue.textContent = `${delta >= 0 ? '+' : ''}${Math.round(delta)} W`;
    cpTimeValue.textContent = formatClock(timeSeconds);
    cpWuseValue.textContent = `${wUseKj.toFixed(1)} kJ`;
    cpMaxPowerValue.textContent = `${Math.round(maxSustainablePower)} W`;

    cpDeltaFill.style.width = `${clamp((Math.abs(delta) / 140) * 100, delta === 0 ? 2 : 8, 100)}%`;
    cpTimeFill.style.width = `${Number.isFinite(timeSeconds) ? clamp((timeSeconds / 900) * 100, 8, 100) : 100}%`;
    cpWuseFill.style.width = `${clamp((wUseKj / 35) * 100, 2, 100)}%`;
    cpMaxPowerFill.style.width = `${clamp(((maxSustainablePower - 150) / 350) * 100, 4, 100)}%`;

    setBand(getBand(cp));
    setStrip(delta);

    if (!cpCaseText) {
      return;
    }

    if (delta > 0) {
      cpCaseText.textContent = `CP = ${Math.round(cp)} W, W′ = ${wprimeKj.toFixed(1)} kJ. Bij ${Math.round(power)} W is (P−CP)=${Math.round(delta)} W → theoretische volhoudtijd ${formatClock(timeSeconds)}.`;
      return;
    }

    cpCaseText.textContent = `CP = ${Math.round(cp)} W, W′ = ${wprimeKj.toFixed(1)} kJ. Bij ${Math.round(power)} W zit je op of onder CP: steady-state is mogelijk en W′ kan (gedeeltelijk) herstellen.`;
  };

  [cpSlider, cpWprimeSlider, cpPowerSlider, cpTargetSlider].forEach((slider) => {
    slider.addEventListener('input', updateCpModel);
  });

  updateCpModel();
}

const aiForm = document.querySelector('[data-ai-form]');
const aiInput = document.querySelector('[data-ai-input]');
const aiMessages = document.querySelector('[data-ai-messages]');
const aiQuickButtons = document.querySelectorAll('[data-ai-quick]');
const aiUpload = document.querySelector('[data-ai-upload]');
const aiUploadStatus = document.querySelector('[data-ai-upload-status]');

if (aiForm && aiInput && aiMessages) {
  const aiHistory = [];
  let uploadedReportName = '';

  const appendMessage = (role, text) => {
    const node = document.createElement('div');
    node.className = `ai-msg ${role}`;
    node.textContent = text;
    aiMessages.appendChild(node);
    aiMessages.scrollTop = aiMessages.scrollHeight;
    return node;
  };

  const getDemoAnswer = (question) => {
    const q = question.toLowerCase();

    if (q.includes('vo2')) {
      return 'VO2max is je aerobe plafond. Gebruik het samen met VT1/VT2, want alleen VO2max zegt niet hoe goed je het plafond benut in training.';
    }

    if (q.includes('vt1')) {
      return 'VT1 is meestal je anker voor duurzame zone-2 training. Richt je op veel volume net onder/rond VT1 voor stabiele opbouw met lage herstelkosten.';
    }

    if (q.includes('vt2') || q.includes('drempel')) {
      return 'VT2 markeert de overgang naar zwaar werk. Plan hier beperkte blokken met voldoende herstel, zodat je kwaliteit behoudt en niet te veel in het grijze gebied traint.';
    }

    if (q.includes('week') || q.includes('schema')) {
      return 'Voor een basisweek: 2-3 rustige zone-2 sessies, 1 kwaliteitssessie rond VT2/VO2, en 1 rustdag. Pas dit aan op je beschikbare uren en herstel.';
    }

    return 'Goede vraag. De live AI-koppeling lijkt tijdelijk niet bereikbaar; dit is een fallback-antwoord.';
  };

  const callBackendAi = async (question) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        reportName: uploadedReportName,
        history: aiHistory.slice(-6),
      }),
    });

    if (!response.ok) {
      throw new Error(`AI backend fout (${response.status})`);
    }

    const data = await response.json();
    return data?.answer ? String(data.answer).trim() : '';
  };

  aiForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const question = aiInput.value.trim();
    if (!question) {
      return;
    }

    appendMessage('user', question);
    aiInput.value = '';

    const pendingNode = appendMessage('assistant', 'Even denken...');

    const run = async () => {
      let answer = '';

      try {
        answer = await callBackendAi(question);
      } catch (error) {
        console.error(error);
      }

      if (!answer) {
        answer = getDemoAnswer(question);
      }

      pendingNode.textContent = answer;
      aiHistory.push({ role: 'user', text: question });
      aiHistory.push({ role: 'assistant', text: answer });
    };

    run();
  });

  aiQuickButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const prompt = button.dataset.aiQuick || '';
      aiInput.value = prompt;
      aiInput.focus();
    });
  });

  if (aiUpload && aiUploadStatus) {
    aiUpload.addEventListener('change', () => {
      const fileName = aiUpload.files && aiUpload.files[0] ? aiUpload.files[0].name : '';
      uploadedReportName = fileName;
      aiUploadStatus.textContent = fileName
        ? `Rapport geselecteerd: ${fileName}`
        : 'Nog geen rapport geüpload.';
    });
  }
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
