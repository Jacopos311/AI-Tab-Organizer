// popup.js — AI Tab Organizer
'use strict';

const apiKeyInput = document.getElementById('apiKeyInput');
const saveKeyBtn  = document.getElementById('saveKeyBtn');
const keyStatus   = document.getElementById('keyStatus');
const organizeBtn = document.getElementById('organizeBtn');
const statusBox   = document.getElementById('statusBox');

const STORAGE_KEY = 'gemini_api_key';

function setStatus(message, type = '') {
  statusBox.textContent = message;
  statusBox.className = type ? `status-box is-${type}` : 'status-box';
}

function setKeyStatus(message, saved = false) {
  keyStatus.textContent = message;
  keyStatus.className = saved ? 'key-status is-saved' : 'key-status';
}

// 1. Carica la chiave all'apertura del popup
chrome.storage.local.get(STORAGE_KEY, (result) => {
  const savedKey = result[STORAGE_KEY];
  if (savedKey) {
    apiKeyInput.value = savedKey;
    setKeyStatus('✓ Token HF caricato', true);
  } else {
    setKeyStatus('Nessun token salvato');
  }
});

// 2. Salva la chiave in memoria
saveKeyBtn.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();

  if (!key) {
    setKeyStatus('⚠ Inserisci un token prima di salvare.');
    return;
  }

  chrome.storage.local.set({ [STORAGE_KEY]: key }, () => {
    if (chrome.runtime.lastError) {
      setKeyStatus(`Errore: ${chrome.runtime.lastError.message}`);
      return;
    }
    setKeyStatus('✓ Token HF salvato', true);
  });
});

// 3. Avvia la riorganizzazione delle tab
organizeBtn.addEventListener('click', () => {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const key = result[STORAGE_KEY];

    if (!key) {
      setStatus('⚠ Token non trovato. Inserisci il token Hugging Face in alto e premi "Salva".', 'error');
      return;
    }

    organizeBtn.disabled = true;
    setStatus('Riorganizzazione in corso…', 'running');

    chrome.runtime.sendMessage({ action: 'organizeTabs' }, (response) => {
      organizeBtn.disabled = false;

      if (chrome.runtime.lastError) {
        setStatus(`Errore di comunicazione: ${chrome.runtime.lastError.message}`, 'error');
        return;
      }

      if (response?.success) {
        setStatus(`✓ ${response.message ?? 'Tab riorganizzate!'}`, 'success');
      } else {
        setStatus(`✗ ${response?.error ?? 'Errore sconosciuto.'}`, 'error');
      }
    });
  });
});