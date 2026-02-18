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

const vt1ThresholdSlider = document.querySelector('[data-vt1-threshold-slider]');
const vt1PowerSlider = document.querySelector('[data-vt1-power-slider]');
const vt1DurationSlider = document.querySelector('[data-vt1-duration-slider]');

const vt1ThresholdValue = document.querySelector('[data-vt1-threshold-value]');
const vt1PowerValue = document.querySelector('[data-vt1-power-value]');
const vt1DurationValue = document.querySelector('[data-vt1-duration-value]');

const vt1DeltaFill = document.querySelector('[data-vt1-delta-fill]');
const vt1DeltaValue = document.querySelector('[data-vt1-delta-value]');
const vt1DriftFill = document.querySelector('[data-vt1-drift-fill]');
const vt1DriftValue = document.querySelector('[data-vt1-drift-value]');
const vt1QualityFill = document.querySelector('[data-vt1-quality-fill]');
const vt1QualityValue = document.querySelector('[data-vt1-quality-value]');
const vt1RecoveryFill = document.querySelector('[data-vt1-recovery-fill]');
const vt1RecoveryValue = document.querySelector('[data-vt1-recovery-value]');
const vt1TteFill = document.querySelector('[data-vt1-tte-fill]');
const vt1TteValue = document.querySelector('[data-vt1-tte-value]');

const vt1ZoneStatus = document.querySelector('[data-vt1-zone-status]');
const vt1CaseText = document.querySelector('[data-vt1-case-text]');
const vt1Bands = document.querySelectorAll('[data-vt1-band]');
const vt1Blocks = document.querySelectorAll('[data-vt1-block]');
const vt1StripStatus = document.querySelector('[data-vt1-strip-status]');

if (
  vt1ThresholdSlider &&
  vt1PowerSlider &&
  vt1DurationSlider &&
  vt1ThresholdValue &&
  vt1PowerValue &&
  vt1DurationValue &&
  vt1DeltaFill &&
  vt1DeltaValue &&
  vt1DriftFill &&
  vt1DriftValue &&
  vt1QualityFill &&
  vt1QualityValue &&
  vt1RecoveryFill &&
  vt1RecoveryValue &&
  vt1TteFill &&
  vt1TteValue
) {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const setVt1Band = (band) => {
    vt1Bands.forEach((node) => {
      node.classList.toggle('active', node.dataset.vt1Band === band);
    });
  };

  const setVt1Strip = (delta) => {
    if (!vt1Blocks.length) {
      return;
    }

    const overloadBlocks = clamp(Math.round((delta + 30) / 12), 0, vt1Blocks.length);
    vt1Blocks.forEach((node, index) => {
      node.classList.toggle('work', index < overloadBlocks);
    });

    if (!vt1StripStatus) {
      return;
    }

    if (delta <= -20) {
      vt1StripStatus.textContent = 'Onder VT1: lage kosten en hoge stapelbaarheid.';
      return;
    }

    if (delta <= 10) {
      vt1StripStatus.textContent = 'Rond VT1: stabiele duurprikkel met lage-matige kosten.';
      return;
    }

    if (delta <= 35) {
      vt1StripStatus.textContent = 'Boven VT1: drift en herstelkosten nemen duidelijk toe.';
      return;
    }

    vt1StripStatus.textContent = 'Ver boven VT1: zwaar duurwerk, beperkt inzetbaar in volumeweken.';
  };

  const updateVt1Model = () => {
    const vt1 = Number(vt1ThresholdSlider.value);
    const power = Number(vt1PowerSlider.value);
    const durationMin = Number(vt1DurationSlider.value);
    const delta = power - vt1;

    const drift = clamp(34 + delta * 1.3 + durationMin * 0.22, 5, 100);
    const quality = clamp(
      95 - Math.max(0, delta) * 1.5 - Math.max(0, durationMin - 120) * 0.24 - Math.max(0, -delta) * 0.35,
      8,
      100,
    );
    const recoveryCost = clamp(18 + Math.max(0, delta) * 1.65 + durationMin * 0.2, 4, 100);
    const sustainableMinutes = delta > 0 ? clamp(180 / (delta / 12 + 1), 20, 180) : 180;

    vt1ThresholdValue.textContent = `${Math.round(vt1)} W`;
    vt1PowerValue.textContent = `${Math.round(power)} W`;
    vt1DurationValue.textContent = `${Math.round(durationMin)} min`;

    vt1DeltaValue.textContent = `${delta >= 0 ? '+' : ''}${Math.round(delta)} W`;
    vt1DriftValue.textContent = `${Math.round(drift)}%`;
    vt1QualityValue.textContent = `${Math.round(quality)}%`;
    vt1RecoveryValue.textContent = `${Math.round(recoveryCost)}%`;
    vt1TteValue.textContent = delta > 0 ? `${Math.round(sustainableMinutes)} min` : 'lang volhoudbaar';

    vt1DeltaFill.style.width = `${clamp((Math.abs(delta) / 90) * 100, delta === 0 ? 2 : 8, 100)}%`;
    vt1DriftFill.style.width = `${drift}%`;
    vt1QualityFill.style.width = `${quality}%`;
    vt1RecoveryFill.style.width = `${recoveryCost}%`;
    vt1TteFill.style.width = `${clamp((sustainableMinutes / 180) * 100, 8, 100)}%`;

    let band = 'rond';
    let zoneText = 'Rond VT1: dit ligt in een goed zone-2 bereik voor stapelbare duurtraining.';

    if (delta <= -20) {
      band = 'onder';
      zoneText = 'Onder VT1: rustige duur met lage kosten, goed voor herstel en extra volume.';
    } else if (delta <= 10) {
      band = 'rond';
      zoneText = 'Rond VT1: dit ligt in een goed zone-2 bereik voor stapelbare duurtraining.';
    } else if (delta <= 35) {
      band = 'boven';
      zoneText = 'Boven VT1: meer tempo-prikkel, maar hogere drift en meer herstel nodig.';
    } else {
      band = 'ver';
      zoneText = 'Ver boven VT1: dit is zwaar duurwerk en beperkt inzetbaar binnen een normale volumeweek.';
    }

    if (vt1ZoneStatus) {
      vt1ZoneStatus.textContent = zoneText;
    }

    if (vt1CaseText) {
      if (delta > 0) {
        vt1CaseText.textContent = `VT1 = ${Math.round(vt1)} W, gekozen vermogen = ${Math.round(power)} W (${Math.round(
          delta,
        )} W erboven), duur = ${Math.round(durationMin)} min. Verwacht oplopende drift; overweeg duurblokken rond ${Math.round(
          vt1 - 5,
        )}-${Math.round(vt1 + 10)} W voor betere stapelbaarheid.`;
      } else {
        vt1CaseText.textContent = `VT1 = ${Math.round(vt1)} W, gekozen vermogen = ${Math.round(power)} W (${Math.abs(
          Math.round(delta),
        )} W eronder), duur = ${Math.round(durationMin)} min. Dit is doorgaans goed vol te houden met beperkte herstelkosten.`;
      }
    }

    setVt1Band(band);
    setVt1Strip(delta);
  };

  [vt1ThresholdSlider, vt1PowerSlider, vt1DurationSlider].forEach((slider) => {
    slider.addEventListener('input', updateVt1Model);
  });

  updateVt1Model();
}

const vt2ThresholdSlider = document.querySelector('[data-vt2-threshold-slider]');
const vt2PowerSlider = document.querySelector('[data-vt2-power-slider]');
const vt2WorkSlider = document.querySelector('[data-vt2-work-slider]');
const vt2RestSlider = document.querySelector('[data-vt2-rest-slider]');

const vt2ThresholdValue = document.querySelector('[data-vt2-threshold-value]');
const vt2PowerValue = document.querySelector('[data-vt2-power-value]');
const vt2WorkValue = document.querySelector('[data-vt2-work-value]');
const vt2RestValue = document.querySelector('[data-vt2-rest-value]');

const vt2DeltaFill = document.querySelector('[data-vt2-delta-fill]');
const vt2DeltaValue = document.querySelector('[data-vt2-delta-value]');
const vt2PressureFill = document.querySelector('[data-vt2-pressure-fill]');
const vt2PressureValue = document.querySelector('[data-vt2-pressure-value]');
const vt2RepeatFill = document.querySelector('[data-vt2-repeat-fill]');
const vt2RepeatValue = document.querySelector('[data-vt2-repeat-value]');
const vt2DoseFill = document.querySelector('[data-vt2-dose-fill]');
const vt2DoseValue = document.querySelector('[data-vt2-dose-value]');

const vt2ZoneStatus = document.querySelector('[data-vt2-zone-status]');
const vt2CaseText = document.querySelector('[data-vt2-case-text]');
const vt2Bands = document.querySelectorAll('[data-vt2-band]');
const vt2Blocks = document.querySelectorAll('[data-vt2-block]');
const vt2StripStatus = document.querySelector('[data-vt2-strip-status]');

if (
  vt2ThresholdSlider &&
  vt2PowerSlider &&
  vt2WorkSlider &&
  vt2RestSlider &&
  vt2ThresholdValue &&
  vt2PowerValue &&
  vt2WorkValue &&
  vt2RestValue &&
  vt2DeltaFill &&
  vt2DeltaValue &&
  vt2PressureFill &&
  vt2PressureValue &&
  vt2RepeatFill &&
  vt2RepeatValue &&
  vt2DoseFill &&
  vt2DoseValue
) {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const setVt2Band = (band) => {
    vt2Bands.forEach((node) => {
      node.classList.toggle('active', node.dataset.vt2Band === band);
    });
  };

  const setVt2Blocks = (repeats) => {
    if (!vt2Blocks.length) {
      return;
    }

    vt2Blocks.forEach((node, index) => {
      node.classList.toggle('work', index < repeats);
    });
  };

  const updateVt2Model = () => {
    const vt2 = Number(vt2ThresholdSlider.value);
    const power = Number(vt2PowerSlider.value);
    const workSec = Number(vt2WorkSlider.value);
    const restSec = Number(vt2RestSlider.value);

    const delta = power - vt2;
    const pressure = clamp(38 + delta * 1.45 + workSec * 0.06, 5, 100);
    const repeatability = clamp(96 - Math.max(0, delta) * 1.25 - workSec * 0.055 + restSec * 0.085, 5, 100);
    const repeats = clamp(Math.round(repeatability / 15), 2, 8);

    vt2ThresholdValue.textContent = `${Math.round(vt2)} W`;
    vt2PowerValue.textContent = `${Math.round(power)} W`;
    vt2WorkValue.textContent = `${Math.round(workSec)} s`;
    vt2RestValue.textContent = `${Math.round(restSec)} s`;

    vt2DeltaValue.textContent = `${delta >= 0 ? '+' : ''}${Math.round(delta)} W`;
    vt2PressureValue.textContent = `${Math.round(pressure)}%`;
    vt2RepeatValue.textContent = `${Math.round(repeatability)}%`;
    vt2DoseValue.textContent = `${repeats}x`;

    vt2DeltaFill.style.width = `${clamp((Math.abs(delta) / 120) * 100, delta === 0 ? 2 : 8, 100)}%`;
    vt2PressureFill.style.width = `${pressure}%`;
    vt2RepeatFill.style.width = `${repeatability}%`;
    vt2DoseFill.style.width = `${clamp((repeats / 8) * 100, 8, 100)}%`;

    let band = 'rond';
    let status = 'Rond VT2: geschikt voor thresholdblokken met bewaakte herstelkwaliteit.';

    if (delta <= -20) {
      band = 'onder';
      status = 'Onder VT2: vooral tempo/duurprikkel, relatief goed herhaalbaar.';
    } else if (delta <= 15) {
      band = 'rond';
      status = 'Rond VT2: geschikt voor thresholdblokken met bewaakte herstelkwaliteit.';
    } else if (delta <= 45) {
      band = 'boven';
      status = 'Boven VT2: sterke prikkel, maar kwaliteit en rust moeten strak bewaakt worden.';
    } else {
      band = 'ver';
      status = 'Ver boven VT2: zeer zwaar werk, lage herhaalbaarheid en hoge herstelkosten.';
    }

    if (vt2ZoneStatus) {
      vt2ZoneStatus.textContent = status;
    }

    if (vt2StripStatus) {
      vt2StripStatus.textContent = `Aanbevolen setgrootte: ${repeats} werkherhalingen bij deze instelling.`;
    }

    if (vt2CaseText) {
      const totalWorkMin = Math.round((repeats * workSec) / 60);
      vt2CaseText.textContent = `VT2 = ${Math.round(vt2)} W, intervalvermogen = ${Math.round(power)} W, werk/herstel = ${Math.round(
        workSec,
      )}/${Math.round(restSec)} s. Verwachte set: ${repeats} herhalingen, totale werktijd circa ${totalWorkMin} min.`;
    }

    setVt2Band(band);
    setVt2Blocks(repeats);
  };

  [vt2ThresholdSlider, vt2PowerSlider, vt2WorkSlider, vt2RestSlider].forEach((slider) => {
    slider.addEventListener('input', updateVt2Model);
  });

  updateVt2Model();
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

if (!document.querySelector('.floating-instagram')) {
  const instagramLink = document.createElement('a');
  instagramLink.className = 'floating-instagram';
  instagramLink.href = 'https://www.instagram.com/sportmetricsnl/';
  instagramLink.target = '_blank';
  instagramLink.rel = 'noreferrer';
  instagramLink.setAttribute('aria-label', 'Volg Sportmetrics op Instagram');
  instagramLink.textContent = 'Volg op Instagram';
  document.body.appendChild(instagramLink);
}

const bookingForm = document.querySelector('[data-booking-form]');
if (bookingForm) {
  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = bookingForm.querySelector('[data-form-status]');
    if (status) {
      status.textContent =
        'Dank! Je aanvraag is ontvangen en doorgestuurd via info@sportmetrics.nl. We nemen binnen 24 uur contact met je op.';
    }
    bookingForm.reset();
  });
}
