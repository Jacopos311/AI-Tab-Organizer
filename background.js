// background.js — AI Tab Organizer con GROQ API
'use strict';

const STORAGE_KEY = 'gemini_api_key'; // Manteniamo la stessa chiave di storage per non rompere il popup
const GROQ_URL    = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL  = 'llama-3.1-8b-instant'; // Modello ultra-veloce e gratuito

const SYSTEM_PROMPT = `Sei un assistente che organizza le tab del browser.
Analizza la lista di titoli e URL fornita e raggruppali in categorie logiche (es. Lavoro, Social, Shopping, News).
Restituisci RIGIDAMENTE solo un oggetto JSON valido con questa struttura:
{ "Nome Categoria": [id_tab1, id_tab2] }
Non aggiungere testo introduttivo, markdown, spiegazioni o commenti. Solo JSON puro. riordina in inglese rigorosamente`;

const GROUP_COLORS = ['blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange', 'grey'];

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action !== 'organizeTabs') return false;

  organizeTabs()
    .then((result) => sendResponse(result))
    .catch((err)   => sendResponse({ success: false, error: err.message }));

  return true;
});

async function organizeTabs() {
  const apiKey = await getStoredApiKey();
  if (!apiKey) {
    throw new Error('Chiave API Groq non trovata. Inseriscila nel popup e premi "Salva".');
  }

  const tabs = await getTabsInCurrentWindow();
  if (tabs.length === 0) {
    throw new Error('Nessuna tab valida aperta nella finestra corrente.');
  }

  const categories = await callGroqApi(apiKey, tabs);
  const { created, skipped, log } = await applyTabGroups(tabs, categories);

  const summary = `${created} grupp${created === 1 ? 'o creato' : 'i creati'} su ${tabs.length} tab.`;
  return { success: true, message: summary, log };
}

function getStoredApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      resolve(result[STORAGE_KEY] ?? null);
    });
  });
}

function getTabsInCurrentWindow() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      const userTabs = tabs.filter(t => t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('about:'));
      resolve(userTabs);
    });
  });
}

async function callGroqApi(apiKey, tabs) {
  const cleanApiKey = apiKey.trim();
  const tabList = tabs.map(t => `- ID: ${t.id} | Titolo: "${t.title ?? ''}" | URL: ${t.url}`).join('\n');

  let response;
  try {
    response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanApiKey}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Ecco le tab aperte:\n${tabList}\n\nRaggruppale ora.` }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" } // Forza Groq a rispondere ESCLUSIVAMENTE in JSON valido
      }),
    });
  } catch (networkErr) {
    throw new Error(`Errore di rete: ${networkErr.message}`);
  }

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`API Error ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content || '';

  try {
    return JSON.parse(rawText.trim());
  } catch {
    throw new Error('L\'AI non ha risposto con un JSON valido. Riprova.');
  }
}

async function applyTabGroups(tabs, categories) {
  const tabMap = new Map(tabs.map(t => [t.id, t]));
  const normalizedCategories = Object.fromEntries(
    Object.entries(categories).map(([name, ids]) => [
      name,
      ids.map(id => Number(id)).filter(id => !isNaN(id) && tabMap.has(id))
    ])
  );

  const allInvolvedIds = [...new Set(Object.values(normalizedCategories).flat())];
  if (allInvolvedIds.length > 0) {
    const alreadyGrouped = allInvolvedIds.filter(id => {
      const tab = tabMap.get(id);
      return tab && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE;
    });
    if (alreadyGrouped.length > 0) {
      await chrome.tabs.ungroup(alreadyGrouped).catch(() => {});
    }
  }

  let created = 0, skipped = 0, colorIndex = 0;
  const log = [];

  for (const [categoryName, tabIds] of Object.entries(normalizedCategories)) {
    if (tabIds.length === 0) { skipped++; continue; }
    try {
      const groupId = await chrome.tabs.group({ tabIds });
      await chrome.tabGroups.update(groupId, {
        title: categoryName,
        color: GROUP_COLORS[colorIndex % GROUP_COLORS.length],
        collapsed: false
      });
      colorIndex++;
      created++;
    } catch (e) {
      skipped++;
    }
  }
  return { created, skipped, log };
}