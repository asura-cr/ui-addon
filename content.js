'use strict';

  // Global variables (pruned unused)
  var userDataUpdateInterval = null;
  // Reuse a single DOMParser instance to avoid repeated allocations
  const DOM_PARSER = new DOMParser();
  const parseHTML = (html) => DOM_PARSER.parseFromString(html, 'text/html');
  
  // Monster loot cache for performance optimization
  const lootCache = new Map(); // Cache loot data by monster name  // Enhanced settings management
  const damageCache = new Map(); // Cache player damage per monster
  var extensionSettings = {
    sidebarColor: '#1e1e1e',
    backgroundColor: '#000000',
    statAllocationCollapsed: true,
    sidebarCollapsed: false,
    statsExpanded: false,
    petsExpanded: false,
    blacksmithExpanded: false,
    continueBattlesExpanded: true,
    lootExpanded: true,
    merchantExpanded: false,
    inventoryExpanded: false,
    battlePassExpanded: false,
    guildExpanded: false,
    worldMapExpanded: false,
    pinnedMerchantItems: [],
    pinnedInventoryItems: [],
    multiplePotsEnabled: false,
    multiplePotsCount: 3,
    
    petNames: {
      enabled: true,
      names: {} // Will store pet ID -> custom name mappings
    },
    lootPanelColors: {
      enabled: false,
      unlockedColor: '#4ecdc4', // Color when damage requirement is met
      lockedColor: '#666666' // Color when locked
    },
      lootHighlighting: {
        enabled: true, // Always enabled by default
        backgroundColor: 'rgb(0 255 30 / 20%)', // Green background for unlocked loot
        glowColor: 'rgba(255, 215, 0, 0.6)' // Golden glow effect
      },
      customBackgrounds: {
        enabled: true,
        backgrounds: {
          '/pets.php': 'https://raw.githubusercontent.com/asura-cr/ui-addon/refs/heads/main/images/pets.png',
          '/inventory.php': 'https://raw.githubusercontent.com/asura-cr/ui-addon/refs/heads/main/images/inventory.png',
          '/merchant.php': 'https://raw.githubusercontent.com/asura-cr/ui-addon/refs/heads/main/images/merchant.png',
          '/blacksmith.php': 'https://raw.githubusercontent.com/asura-cr/ui-addon/refs/heads/main/images/blacksmith.png'
        }
    },
    pvpBattlePrediction: {
      enabled: true, // Show battle win/loss prediction
      analyzeAfterAttacks: 2 // Start analysis after this many attacks
    },
    gateGraktharWave: 3, // Default wave for Gate Grakthar (wave 3 = gate=3&wave=3)
    equipSets: {
      enabled: true, // Enable equip sets functionality
      storageKey: 'demonGameEquipSets',
      applyDelay: 350, // Delay between equipment applications (ms)
      showInSidebar: true // Show equip sets in sidebar
    },
    questWidget: {
      enabled: true // Enable quest widget in sidebar
    },
    petTeams: {
      enabled: true, // Enable pet teams functionality
      storageKey: 'demonGamePetTeams',
      applyDelay: 350, // Delay between pet applications (ms)
      showInSidebar: true // Show pet teams in sidebar
    },
    semiTransparent: {
      enabled: false, // Enable semi-transparent effect
      opacity: 0.85 // Opacity level
    },
    // Selected gate/wave to open from sidebar Gate entry
    waveSelection: {
      gate: 3,
      wave: 3
    },
    updates: {
      autoCheck: true,
      lastChecked: 0,
      latestKnownVersion: '',
      latestUrl: ''
    },
    battleModal: {
      enabled: false, // Enable battle modal system
      autoClose: true, // Auto-close modal after battle
      showLootModal: true, // Show loot modal
      showAttackLogs: true, // Show attack logs
      showLeaderboard: true, // Show leaderboard
      compact: false,        // Compact mode
      zoomScale: 1.0,        // Zoom scale
      showSlash: true,       // Show slash button
      showPowerSlash: true,  // Show power slash button
      showHeroicSlash: true, // Show heroic slash button
      showUltimateSlash: true, // Show ultimate slash button
      showLegendarySlash: true // Show legendary slash button
    },
    hotkeys: {
      enabled: true,            // Master toggle
      monsterSelection: true,   // Number keys select first 9 joinable monsters
      showOverlays: true,       // Show number bubbles on monster cards / letters on attack buttons
      battleAttacks: true,      // Letter keys trigger attacks inside battle modal
      monsterSelectionKeys: ['1','2','3','4','5','6','7','8','9'], // Customizable
      battleAttackKeys: ['s','p','h','u','l'] // Slash, Power, Heroic, Ultimate, Legendary
    },
    dungeonWave: {
      enabled: true, // Enable dungeon wave features
      showDamagePills: true, // Show damage pills
      showZeroJoined: true, // Show monsters with 0 joined
      compactModal: false, // Compact modal view
      waveFilters: {
        enabled: true, // Enable wave filters
        hpOptions: ['20-50%', '50-80%', '80-100%', '100%'], // HP filter options
        showCompactToggle: true // Show compact toggle
  }
    },
    waveFilters: {
      enabled: true, // Enable wave filters
      hpOptions: ['20-50%', '50-80%', '80-100%', '100%'], // HP filter options
      showCompactToggle: true, // Show compact toggle
      hideImages: false // Hide monster images
    },
    menuItems: [
      { id: 'halloween_event', name: 'Halloween Event', visible: true, order: 1 },
      { id: 'event_battlefield', name: 'Event Battlefield', visible: true, order: 2 },
      { id: 'battle_pass', name: 'Battle Pass', visible: true, order: 3 },
      { id: 'pvp', name: 'PvP Arena', visible: true, order: 4 },
      { id: 'gate_grakthar', name: 'Gate Grakthar', visible: true, order: 5 },
      { id: 'inventory', name: 'Inventory & Equipment', visible: true, order: 6 },
      { id: 'pets', name: 'Pets & Eggs', visible: true, order: 7 },
      { id: 'guild', name: 'Guild', visible: true, order: 8 },
      { id: 'stats', name: 'Stats', visible: true, order: 9 },
      { id: 'blacksmith', name: 'Blacksmith', visible: true, order: 10 },
      { id: 'legendary_forge', name: 'Legendary Forge', visible: true, order: 11 },
      { id: 'merchant', name: 'Merchant', visible: true, order: 12 },
      { id: 'inventory_quick', name: 'Inventory Quick Access', visible: true, order: 13 },
      { id: 'achievements', name: 'Achievements', visible: true, order: 14 },
      { id: 'collections', name: 'Collections', visible: true, order: 15 },
      { id: 'guide', name: 'How To Play', visible: true, order: 16 },
      { id: 'leaderboard', name: 'Weekly Leaderboard', visible: true, order: 17 },
      { id: 'chat', name: 'Global Chat', visible: true, order: 18 },
    ]
  };

  // Preserve a deep-clone of the default settings so we can fully restore later
  const DEFAULT_EXTENSION_SETTINGS = JSON.parse(JSON.stringify(extensionSettings));

  // Page-specific functionality mapping
  const extensionPageHandlers = {
    '/active_wave.php': initWaveMods,
    '/game_dash.php': initDashboardTools,
    '/battle.php': initBattleMods,
    '/dungeon_battle.php': initBattleMods,
    '/chat.php': initChatMods,
    '/inventory.php': initInventoryMods,
    '/pets.php': initPetMods,
    '/stats.php': initStatMods,
    '/pvp.php': initPvPMods,
    '/pvp_battle.php': [initPvPBattleMods, initPvPMods], // Run both handlers for PvP battle
    '/blacksmith.php': initBlacksmithMods,
    '/merchant.php': initMerchantMods,
    '/collections.php': initCollectionsMods,
    '/achievements.php': initAchievementsMods,
    '/weekly.php': initLeaderboardMods,
    '/battle_pass.php': initBattlePassMods,
    '/guild_dungeon.php': initDungeonLocationMods, // New dungeon handler
    '/guild_dungeon_location.php': initDungeonLocationMods, // New dungeon location handler
  };

  // Automatic retrieval of userId from cookie
  function getCookieExtension(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  const userId = getCookieExtension('demon');

  function initDraggableFalse(){
    document.querySelectorAll('a').forEach(x => x.draggable = false);
    document.querySelectorAll('button').forEach(x => x.draggable = false);
  }

  // Settings management
  function loadSettings() {
    const saved = localStorage.getItem('demonGameExtensionSettings');
    if (saved) {
      try {
        const savedSettings = JSON.parse(saved);
        console.log('Loading settings from localStorage:', {
          monsterBackgrounds: savedSettings.monsterBackgrounds
        });
        
        // Deep merge settings
        extensionSettings = {
          ...extensionSettings,
          ...savedSettings,
          monsterBackgrounds: {
            ...extensionSettings.monsterBackgrounds,
            ...savedSettings.monsterBackgrounds,
            monsters: {
              ...extensionSettings.monsterBackgrounds?.monsters,
              ...savedSettings.monsterBackgrounds?.monsters,
            }
          },
        petNames: {
          ...extensionSettings.petNames,
          ...savedSettings.petNames,
          names: {
            ...extensionSettings.petNames?.names,
            ...savedSettings.petNames?.names,
          }
        },
          lootPanelColors: {
            ...extensionSettings.lootPanelColors,
            ...savedSettings.lootPanelColors,
          },
          lootHighlighting: {
            ...extensionSettings.lootHighlighting,
            ...savedSettings.lootHighlighting,
          },
          pvpBattlePrediction: {
            ...extensionSettings.pvpBattlePrediction,
            ...savedSettings.pvpBattlePrediction,
          },
          pvpAutoSurrender: {
            ...extensionSettings.pvpAutoSurrender,
            ...savedSettings.pvpAutoSurrender,
          },
          customBackgrounds: {
            ...extensionSettings.customBackgrounds,
            ...savedSettings.customBackgrounds,
            backgrounds: {
              ...extensionSettings.customBackgrounds?.backgrounds,
              ...savedSettings.customBackgrounds?.backgrounds,
          }
        },
          questWidget: {
            ...extensionSettings.questWidget,
            ...savedSettings.questWidget,
          },
          lootHelper: {
            ...extensionSettings.lootHelper,
            ...savedSettings.lootHelper,
          },
          petTeams: {
            ...extensionSettings.petTeams,
            ...savedSettings.petTeams,
          },
          semiTransparent: {
            ...extensionSettings.semiTransparent,
            ...savedSettings.semiTransparent,
          },
          equipSets: {
            ...extensionSettings.equipSets,
            ...savedSettings.equipSets,
          },
          battleModal: {
            ...extensionSettings.battleModal,
            ...savedSettings.battleModal,
          },
          hotkeys: {
            ...extensionSettings.hotkeys,
            ...savedSettings.hotkeys,
          },
      };
      
      console.log('Settings loaded successfully:', {
        monsterCount: Object.keys(extensionSettings.monsterBackgrounds?.monsters || {}).length
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    }
    
    // Ensure menu customization settings exist
    if (!extensionSettings.menuCustomizationExpanded) {
      extensionSettings.menuCustomizationExpanded = false;
    }
    if (!extensionSettings.menuItems || !Array.isArray(extensionSettings.menuItems)) {
      // Prefer restoring menu names from localStorage if available (JSON array).
      try {
        const storedVal = localStorage.getItem('uiaddon_side_names');
        if (storedVal) {
          try {
            const names = JSON.parse(storedVal);
            if (Array.isArray(names) && names.length) {
              const seen = new Set();
              extensionSettings.menuItems = names.map((nm, idx) => {
                const raw = String(nm || '').trim();
                let baseId = raw.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
                if (!baseId) baseId = `item_${idx}`;
                let id = baseId;
                let suffix = 1;
                while (seen.has(id)) {
                  id = `${baseId}_${suffix++}`;
                }
                seen.add(id);
                return { id, name: raw || `Item ${idx + 1}`, visible: true, order: idx };
              });
            } else {
              extensionSettings.menuItems = JSON.parse(JSON.stringify(DEFAULT_EXTENSION_SETTINGS.menuItems || []));
            }
          } catch (e) {
            console.error('Failed to parse uiaddon_side_names from storage, using defaults', e);
            extensionSettings.menuItems = JSON.parse(JSON.stringify(DEFAULT_EXTENSION_SETTINGS.menuItems || []));
          }
        } else {
          extensionSettings.menuItems = JSON.parse(JSON.stringify(DEFAULT_EXTENSION_SETTINGS.menuItems || []));
        }
      } catch (err) {
        console.error('Error reading uiaddon_side_names from storage, using defaults', err);
        extensionSettings.menuItems = JSON.parse(JSON.stringify(DEFAULT_EXTENSION_SETTINGS.menuItems || []));
      }
    } else {
      // Add new menu items to existing users if they don't exist
      const newMenuItems = [
        { id: 'battle_pass', name: 'Battle Pass', afterId: 'gate_grakthar', defaultOrder: 4 },
        { id: 'guild', name: 'Guild', afterId: 'battle_pass', defaultOrder: 5 },
        { id: 'legendary_forge', name: 'Legendary Forge', afterId: 'guild', defaultOrder: 6 }
      ];

      newMenuItems.forEach(newItem => {
        const exists = extensionSettings.menuItems.some(item => item.id === newItem.id);
        if (!exists) {
          // Find the insertion point
          const afterIndex = extensionSettings.menuItems.findIndex(item => item.id === newItem.afterId);
          const insertOrder = afterIndex >= 0 ? extensionSettings.menuItems[afterIndex].order + 1 : newItem.defaultOrder;
          
          // Add the new item
          extensionSettings.menuItems.push({
            id: newItem.id,
            name: newItem.name,
            visible: true,
            order: insertOrder
          });
          
          // Reorder subsequent items if needed
          extensionSettings.menuItems.forEach(item => {
            if (item.order >= insertOrder && item.id !== newItem.id) {
              item.order += 1;
            }
          });
          
          console.log(`Added new menu item: ${newItem.name}`);
        }
      });

      // Save the updated settings if any changes were made
      if (newMenuItems.some(newItem => !extensionSettings.menuItems.some(item => item.id === newItem.id))) {
        saveSettings();
      }
    }

    // Ensure background image settings exist
    if (!extensionSettings.backgroundImages) {
      extensionSettings.backgroundImages = {
        enabled: true,
        pets: {
          url: 'https://i.ibb.co/23tNJmW6/image.png',
          effect: 'normal'
        },
        inventory: {
          url: 'https://i.ibb.co/mr5x6Ln8/image.png',
          effect: 'normal'
        },
        merchant: {
          url: 'https://i.ibb.co/WNLDCLGg/image.png',
          effect: 'normal'
        },
        blacksmith: {
          url: 'https://i.ibb.co/3ygpXwHW/image.png',
          effect: 'normal'
        }
      };
    }
    
    // Ensure monster background settings exist
    if (!extensionSettings.monsterBackgrounds) {
      extensionSettings.monsterBackgrounds = {
        enabled: true,
        effect: 'normal',
        overlay: true,
        overlayOpacity: 0.5,
        monsters: {}
      };
    } else {
      // Backward compatibility defaults
      if (typeof extensionSettings.monsterBackgrounds.enabled !== 'boolean') {
        extensionSettings.monsterBackgrounds.enabled = true;
      }
      if (typeof extensionSettings.monsterBackgrounds.effect !== 'string') {
        extensionSettings.monsterBackgrounds.effect = 'normal';
      }
      if (typeof extensionSettings.monsterBackgrounds.overlay !== 'boolean') {
        extensionSettings.monsterBackgrounds.overlay = true;
      }
      if (typeof extensionSettings.monsterBackgrounds.overlayOpacity !== 'number') {
        extensionSettings.monsterBackgrounds.overlayOpacity = 0.5;
      }
      if (!extensionSettings.monsterBackgrounds.monsters) {
        extensionSettings.monsterBackgrounds.monsters = {};
      }
    }

    // Ensure hotkeys settings exist & have required arrays
    if (!extensionSettings.hotkeys) {
      extensionSettings.hotkeys = {
        enabled: true,
        monsterSelection: true,
        showOverlays: true,
        battleAttacks: true,
        monsterSelectionKeys: ['1','2','3','4','5','6','7','8','9'],
        battleAttackKeys: ['s','p','h','u','l']
      };
    } else {
      if (extensionSettings.hotkeys.showOverlays === undefined) extensionSettings.hotkeys.showOverlays = true;
      if (!Array.isArray(extensionSettings.hotkeys.monsterSelectionKeys) || !extensionSettings.hotkeys.monsterSelectionKeys.length) {
        extensionSettings.hotkeys.monsterSelectionKeys = ['1','2','3','4','5','6','7','8','9'];
      }
      if (!Array.isArray(extensionSettings.hotkeys.battleAttackKeys) || extensionSettings.hotkeys.battleAttackKeys.length < 5) {
        extensionSettings.hotkeys.battleAttackKeys = ['s','p','h','u','l'];
      }
    }

    // Ensure updates settings exist
    if (!extensionSettings.updates) {
      extensionSettings.updates = { autoCheck: true, lastChecked: 0, latestKnownVersion: '', latestUrl: '' };
    } else {
      if (typeof extensionSettings.updates.autoCheck !== 'boolean') extensionSettings.updates.autoCheck = true;
      if (!extensionSettings.updates.lastChecked) extensionSettings.updates.lastChecked = 0;
      if (typeof extensionSettings.updates.latestKnownVersion !== 'string') extensionSettings.updates.latestKnownVersion = '';
      if (typeof extensionSettings.updates.latestUrl !== 'string') extensionSettings.updates.latestUrl = '';
    }
    
    applySettings();
      applyCustomBackgrounds();
    applyMonsterBackgrounds();
  }

  // ===== BATTLE MODAL UTILITY FUNCTIONS =====

  // Global variables for battle modal system
  let isModalOpen = false;
  let userData = {
    userID: null,
    currentStamina: 0,
    currentExp: 0,
    gold: 0,
    guildId: 0
  };

  function setModalOpen(value) {
    isModalOpen = value;
  }

  function showNotification(msg, bgColor = '#2ecc71') {
    let container = document.getElementById('uiaddon-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'uiaddon-toast-container';
      container.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 10000; display: flex; flex-direction: column; gap: 8px;`;
      document.body.appendChild(container);
    }
    const notification = document.createElement('div');
    notification.style.cssText = `
      background: ${bgColor}; color: white; padding: 12px 14px;
      border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-size: 13px; max-width: 320px; opacity: 1; transition: opacity 0.3s ease;
    `;
    notification.textContent = msg;
    container.appendChild(notification);
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Number formatting helper: 1,000,000.00
  function formatNumber2Decimals(value) {
    const num = Number(value);
    if (!isFinite(num)) return value ?? '?';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  // Fetch battle page HTML
  async function fetchBattlePageHtml(monsterId) {
    const response = await fetch(`battle.php?id=${monsterId}`);
    return await response.text();
  }

  // Fetch wave page HTML
  async function fetchWavePageHtml(wave = 1) {
    const response = await fetch(`active_wave.php?wave=${wave}`);
    return await response.text();
  }

  // Utility function to make POST requests
  async function postAction(url, data) {
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => formData.append(key, data[key]));
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: false, message: 'Invalid response format', rawResponse: text };
      }
    } catch (error) {
      console.error('Error in postAction:', error);
      return { success: false, message: error.message };
    }
  }

  // Parse battle page HTML to extract relevant data
// Utility: Extract leaderboard from battle HTML
function parseLeaderboardFromHtml(html) {
  const doc = parseHTML(html);
  const rows = doc.querySelectorAll('.lb-list .lb-row');
  const leaderboard = [];
  for (const row of rows) {
    const rank = row.querySelector('.lb-rank')?.textContent.trim() || '';
    const nameEl = row.querySelector('.lb-name a');
    const USERNAME = nameEl?.textContent.trim() || '';
    const dmg = row.querySelector('.lb-dmg')?.textContent.replace(/[^\d]/g, '') || '0';
    leaderboard.push({
      rank,
      USERNAME,
      damage: parseInt(dmg, 10)
    });
  }
  return leaderboard;
}
  function parseBattleHtml(html) {
    const doc = parseHTML(html);
    
    console.log('Parsing battle HTML...');
    
    // Extract monster info - try multiple selectors, prioritize larger headings
    let monsterName = 'Unknown Monster';
    const cardTitle = doc.querySelector('.card-title');
    if (cardTitle) {
      // Remove emoji from the start of the title
      let titleText = cardTitle.textContent.trim();
      titleText = titleText.replace(/^[^\w\d]+\s*/, '');
      const status = cardTitle.querySelector('.chip')?.textContent.trim() || '';
      monsterName = `${titleText}`;
    }
    
    // Extract HP - look for HP bar or text patterns with LARGE numbers
    let currentHp = 0;
    let maxHp = 1;
    
    // Try to find HP in various formats - prioritize numbers > 1000
    const allText = doc.body.textContent;
    const hpMatches = allText.matchAll(/(\d[\d,]*)\s*\/\s*(\d[\d,]*)\s*HP/gi);
    
    let bestMatch = null;
    let bestMaxHp = 0;
    
    for (const match of hpMatches) {
      const curr = parseInt(match[1].replace(/,/g, ''));
      const max = parseInt(match[2].replace(/,/g, ''));
      
      // Take the match with the highest max HP (monster HP is usually the biggest)
      if (max > bestMaxHp) {
        bestMaxHp = max;
        bestMatch = { curr, max };
      }
    }
    
    if (bestMatch) {
      currentHp = bestMatch.curr;
      maxHp = bestMatch.max;
    } else {
      // Fallback: look for HP patterns without "HP" text
      const hpElements = doc.querySelectorAll('div, span, p');
      for (const elem of hpElements) {
        const text = elem.textContent;
        const hpMatch = text.match(/(\d[\d,]+)\s*\/\s*(\d[\d,]+)/);
        if (hpMatch) {
          const curr = parseInt(hpMatch[1].replace(/,/g, ''));
          const max = parseInt(hpMatch[2].replace(/,/g, ''));
          if (max > bestMaxHp && max > 1000) { // Monster HP should be > 1000
            currentHp = curr;
            maxHp = max;
            bestMaxHp = max;
          }
        }
      }
    }
    
    // Extract player count
    let playerCount = 0;
    const playerMatch = allText.match(/Players?\s*(?:Joined)?[:\s]*(\d+)\s*\/\s*(\d+)/i);
    if (playerMatch) {
      playerCount = parseInt(playerMatch[1]);
    }
    
    // Extract damage done
    let damageDone = 0;
    const parseDamageValue = (text) => {
      if (!text) return null;
      const match = text.match(/([\d,.]+)/);
      if (!match) return null;
      const cleaned = match[1].replace(/,/g, '');
      const num = parseInt(cleaned, 10);
      return Number.isFinite(num) ? num : null;
    };

    const damageSources = [
      () => doc.querySelector('#yourDamageValue'),
      () => doc.querySelector('.stats-stack span:nth-of-type(1) strong#yourDamageValue'),
      () => doc.querySelector('.stats-stack span span#yourDamageValue'),
      () => {
        const chipText = doc.querySelector('#yourDamageValue')?.parentElement?.textContent;
        if (chipText) return { textContent: chipText };
        return null;
      },
      () => {
        const spans = Array.from(doc.querySelectorAll('.stats-stack span, .chip'));
        return spans.find(span => /your\s+damage[:]?/i.test(span.textContent));
      }
    ];

    for (const sourceFn of damageSources) {
      const node = sourceFn();
      if (node && typeof node.textContent === 'string') {
        const parsed = parseDamageValue(node.textContent);
        if (parsed !== null) {
          damageDone = parsed;
          break;
        }
      }
    }

    if (!damageDone) {
      const textMatch = allText.match(/your\s+damage[:\s]+([\d,.]+)/i);
      if (textMatch) {
        const fallback = parseDamageValue(textMatch[1]);
        if (fallback !== null) damageDone = fallback;
      }
    }
    
    // Extract skill buttons - look for attack buttons
    const skillButtons = [];
    const buttons = doc.querySelectorAll('button, a');
        for (const btn of buttons) {
          const onclick = btn.getAttribute('onclick') || '';
          const href = btn.getAttribute('href') || '';
          const nameText = btn.textContent.trim();
          const text = nameText.toLowerCase();
          // Look for attack/slash buttons
          if ((text.includes('slash') || text.includes('attack')) && nameText !== '⚡ Attack FX: ON') {
            let skillId = null;
            // Try to extract skillId from onclick/href
            const skillMatch = (onclick + ' ' + href).match(/attack[^\d]*(\-?\d+)/i);
            if (skillMatch) {
              skillId = skillMatch[1];
            } else {
              // Fallback: try data-skill-id attribute
              skillId = btn.getAttribute('data-skill-id');
            }
            // If still not found, fallback to 0 for Slash, -1 for Power Slash
            if (!skillId) {
              if (text.includes('power')) skillId = '-1';
              else skillId = '0';
            }
            skillButtons.push({
              id: skillId,
              name: nameText,
              element: btn.outerHTML
            });
          }
        }
    
    // Extract battle log
    const battleLog = parseAttackLogs(html);

    // Extract skill buttons - look for attack buttons
    // (already declared above, so just use existing skillButtons and buttons)

    // Extract leaderboard
    const leaderboard = [];
    let leaderboardRows = [];
    try {
      leaderboardRows = doc.querySelectorAll('.lb-row, .leaderboard-row, .player-row, table tr');
    } catch (e) {
      console.warn('Could not query leaderboard rows:', e);
    }
    for (const row of leaderboardRows) {
      // Try to extract ID, USERNAME, DAMAGE_DEALT from modal leaderboard
      const rankEl = row.querySelector('.lb-rank');
      const nameEl = row.querySelector('.lb-name a');
      const dmgEl = row.querySelector('.lb-dmg');
      const picEl = row.querySelector('.lb-avatar');
      if (nameEl && dmgEl) {
        // Modal leaderboard format
        const pid = nameEl.getAttribute('href')?.match(/pid=(\d+)/)?.[1] || '';
        leaderboard.push({
          ID: pid,
          USERNAME: nameEl.textContent.trim(),
          DAMAGE_DEALT: parseInt(dmgEl.textContent.replace(/[^0-9]/g, '')) || 0
        });
      } else {
        // Fallback: table/tr format
        const cells = row.querySelectorAll('td, .username, .damage');
        if (cells.length >= 2) {
          leaderboard.push({
            USERNAME: cells[0].textContent.trim(),
            DAMAGE_DEALT: parseInt(cells[1].textContent.replace(/[^0-9]/g, '')) || 0
          });
        }
      }
    }
    return {
      monsterName,
      currentHp,
      maxHp,
      playerCount,
      damageDone,
      skillButtons,
      loot: [],
      battleLog,
      leaderboard
    };
  }

  // Update user data UI elements
  function updateUserDataUI() {
    const staminaElem = document.querySelector('.sidebar-stamina, .stamina-value');
    if (staminaElem && userData.currentStamina !== undefined) {
      staminaElem.textContent = userData.currentStamina || 0;
    }
    
    const expElem = document.querySelector('.sidebar-exp, .exp-value');
    if (expElem && userData.currentExp !== undefined) {
      expElem.textContent = userData.currentExp || 0;
    }
    
    const goldElem = document.querySelector('.sidebar-gold, .gold-value');
    if (goldElem && userData.gold !== undefined) {
      goldElem.textContent = userData.gold || 0;
    }
      // Update other UI elements if needed
      updateCapNotice(userData.currentStamina);
  }

  // Update user data from wave page
  async function updateUserDataFromWavePage() {
    try {
      const html = await fetchWavePageHtml();
      const extractedData = extractUserData(html);
      
      if (extractedData) {
        userData.currentStamina = extractedData.stamina || userData.currentStamina;
        userData.currentExp = extractedData.exp || userData.currentExp;
        userData.gold = extractedData.gold || userData.gold;
        updateUserDataUI();
      }
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  }

  // Update cap notice for damage requirements
  function updateCapNotice(damageDone) {
    const capNotice = document.querySelector('.cap-notice');
    if (capNotice) {
      capNotice.textContent = `Damage: ${damageDone}`;
    }
  }

  // Initialize user data from page or cookies
  function initUserData() {
    // Try to get user ID from cookie
    const userId = getCookieExtension('demon');
    if (userId) {
      userData.userID = userId;
    }
    
    // Try to extract from page
    const staminaElem = document.querySelector('.sidebar-stamina, .stamina-value');
    if (staminaElem) {
      const staminaText = staminaElem.textContent.trim();
      const staminaMatch = staminaText.match(/(\d+)/);
      if (staminaMatch) {
        userData.currentStamina = parseInt(staminaMatch[1]);
      }
    }
    
    const expElem = document.querySelector('.sidebar-exp, .exp-value');
    if (expElem) {
      const expText = expElem.textContent.trim();
      const expMatch = expText.match(/(\d+)/);
      if (expMatch) {
        userData.currentExp = parseInt(expMatch[1]);
      }
    }
    
    const goldElem = document.querySelector('.sidebar-gold, .gold-value');
    if (goldElem) {
      const goldText = goldElem.textContent.trim();
      const goldMatch = goldText.match(/(\d+)/);
      if (goldMatch) {
        userData.gold = parseInt(goldMatch[1]);
      }
    }
  }

  // ===== END BATTLE MODAL UTILITY FUNCTIONS =====

  const PET_STORAGE_KEY = "pet_teams_v1";
  const PET_APPLY_DELAY = 150;

  // ===== END PET TEAM CONSTANTS =====

  // ===== ADVANCED EQUIPMENT SETS SYSTEM =====

  const EQUIP_STORAGE_KEY = "equip_sets_v1";
  const EQUIP_APPLY_DELAY = 150;

  // Equipment sets utility functions
  function equipSetsSelector(sel, root = document) {
    return root.querySelector(sel);
  }

  function equipSetsSelectAll(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function parseOnclickAdvanced(onclick) {
    if (!onclick) return null;
    const m = onclick.match(/showEquipModal\(([^)]*)\)/);
    if (!m) return null;
    const parts = m[1].split(",").map((p) => p.trim());
    const itemId = parts[0] ? parts[0].replace(/[^0-9\-]/g, "") : null;
    const type = parts[1] ? parts[1].replace(/^['"]|['"]$/g, "").trim() : null;
    const invId = parts[2] ? parts[2].replace(/^['"]|['"]$/g, "").trim() : null;
    return invId && type ? { itemId, type, invId } : null;
  }

  function getEquipStorageSets() {
    try {
      const raw = localStorage.getItem(EQUIP_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.error('Error loading equip sets:', error);
      return {};
    }
  }

  function saveEquipStorageSets(obj) {
    try {
      localStorage.setItem(EQUIP_STORAGE_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error('Error saving equip sets:', error);
    }
  }

  // Equipment sets integrated UI builder
  function addEquipSetsToInventory() {
    if (document.getElementById('integrated-equip-sets')) return;
    
    const container = document.querySelector('.section');
    if (!container) return;
    
    // Check saved collapse state before creating HTML
    const savedCollapseState = localStorage.getItem('equipSetsCollapsed');
    const isCollapsed = savedCollapseState === null ? true : savedCollapseState === 'true';
    
    // Set initial styles based on saved state
    const contentStyles = isCollapsed 
      ? 'transition: opacity 0.15s ease, max-height 0.15s ease, margin-top 0.15s ease; overflow: hidden; max-height: 0px; opacity: 0; margin-top: 0px;'
      : 'transition: opacity 0.15s ease, max-height 0.15s ease, margin-top 0.15s ease; overflow: hidden; max-height: 1000px; opacity: 1; margin-top: 15px;';
    
    const toggleStyles = isCollapsed
      ? 'font-size: 16px; color: #89b4fa; transition: transform 0.3s ease; transform: rotate(-90deg);'
      : 'font-size: 16px; color: #89b4fa; transition: transform 0.3s ease;';
    
    const toggleIcon = isCollapsed ? '▶' : '▼';
    
    const equipSetsPanel = document.createElement('div');
    equipSetsPanel.id = 'integrated-equip-sets';
    equipSetsPanel.innerHTML = `
      <div style="background: rgba(30, 30, 46, 0.9); border: 1px solid rgba(43, 46, 73, 0.6); border-radius: 10px; padding: 20px; margin: 20px 0;">
        <div style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;" id="equip-sets-header">
          <div style="font-size: 18px; font-weight: 800; color: #f9e2af;">⚡ Equipment Sets</div>
          <div id="equip-sets-toggle" style="${toggleStyles}">${toggleIcon}</div>
        </div>
        
        <div id="equip-sets-content" style="${contentStyles}">
          <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <input id="new-set-name" placeholder="Enter set name..." style="flex: 1; padding: 8px 12px; background: rgba(20, 20, 26, 0.7); border: 1px solid rgba(51, 51, 51, 0.5); border-radius: 6px; color: #fff; font-size: 14px;" />
            <button id="record-equipment-btn" class="equip-btn record-btn">⤴ Select Equipment</button>
          </div>
          
          <div id="equipment-preview" style="min-height: 60px; padding: 10px; background: rgba(20, 20, 26, 0.3); border: 1px solid rgba(51, 51, 51, 0.4); border-radius: 6px; margin-bottom: 15px;">
            <div style="color: #9aa0b8; text-align: center; font-size: 12px;">No items selected. Click "Select Equipment" then click on equipped items.</div>
          </div>
          
          <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <button id="save-equipment-set" class="equip-btn save-set">💾 Save Equipment Set</button>
          </div>
          
          <div id="integrated-sets-list" style="max-height: 200px; overflow-y: auto;">
            <!-- Sets will be loaded here -->
          </div>
        </div>
      </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      .equip-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 12px;
        transition: background-color 0.15s ease, transform 0.1s ease;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      
      .equip-btn.record-btn {
        background: linear-gradient(135deg, #89b4fa 0%, #74c7ec 100%);
        color: #1e1e2e;
      }
      
      .equip-btn.save-set {
        background: linear-gradient(135deg, #a6e3a1 0%, #94e2d5 100%);
        color: #1e1e2e;
      }
      
      #equip-sets-header {
        border-radius: 6px;
        padding: 8px;
        margin: -8px;
        transition: background-color 0.15s ease;
        user-select: none;
      }
      
      #equip-sets-header:hover {
        background: rgba(137, 180, 250, 0.1) !important;
      }
      
      #equip-sets-content {
        transition: opacity 0.15s ease, max-height 0.15s ease, margin-top 0.15s ease;
      }
      
      .equip-btn.apply-set {
        background: linear-gradient(135deg, #89b4fa 0%, #74c7ec 100%);
        color: #1e1e2e;
        font-size: 11px;
        padding: 6px 12px;
      }
      
      .equip-btn.delete-set {
        background: linear-gradient(135deg, #f38ba8 0%, #eba0ac 100%);
        color: #1e1e2e;
        font-size: 11px;
        padding: 6px 12px;
      }
      
      .equip-btn:hover {
        transform: translateY(-1px);
        filter: brightness(1.05);
      }
      
      .equip-set-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: rgba(30, 30, 46, 0.4);
        border: 1px solid rgba(69, 71, 90, 0.5);
        border-radius: 8px;
        margin-bottom: 8px;
        backdrop-filter: blur(3px);
      }
      
      .equip-set-name {
        font-weight: 600;
        color: #f9e2af;
        flex: 1;
      }
      
      .equip-set-preview {
        display: flex;
        gap: 3px;
        margin: 5px 0;
      }
      
      .equip-set-preview img {
        width: 24px;
        height: 24px;
        border-radius: 3px;
        border: 1px solid #45475a;
      }
      
      .equip-set-actions {
        display: flex;
        gap: 8px;
      }
      
      .preview-item {
        display: inline-block;
        margin: 4px;
        padding: 4px;
        background: rgba(49, 50, 68, 0.6);
        border: 1px solid rgba(69, 71, 90, 0.4);
        border-radius: 4px;
        position: relative;
        backdrop-filter: blur(2px);
      }
      
      .preview-item img {
        width: 32px;
        height: 32px;
        border-radius: 2px;
      }
      
      .preview-item .remove-btn {
        position: absolute;
        top: -6px;
        right: -6px;
        background: #f38ba8;
        color: #1e1e2e;
        border: none;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        font-size: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `;
    
    document.head.appendChild(style);
    container.insertBefore(equipSetsPanel, container.firstChild);
    
    // Add event listeners after the panel is added to DOM
    setTimeout(() => {
      const recordBtn = document.getElementById('record-equipment-btn');
      const saveBtn = document.getElementById('save-equipment-set');
      const header = document.getElementById('equip-sets-header');
      const content = document.getElementById('equip-sets-content');
      const toggle = document.getElementById('equip-sets-toggle');
      
      if (recordBtn) {
        recordBtn.addEventListener('click', window.startEquipRecordingSelection);
      }
      
      if (saveBtn) {
        saveBtn.addEventListener('click', window.saveCurrentEquipmentSet);
      }
      
      // Toggle collapse/expand functionality
      if (header && content && toggle) {
        // Get saved collapse state
        const savedCollapseState = localStorage.getItem('equipSetsCollapsed');
        let isCollapsed = savedCollapseState === null ? true : savedCollapseState === 'true';
        
        // State is already applied in HTML, just set up the click handler
        header.addEventListener('click', () => {
          isCollapsed = !isCollapsed;
          
          // Save the new state
          localStorage.setItem('equipSetsCollapsed', isCollapsed.toString());
          
          if (isCollapsed) {
            content.style.maxHeight = '0px';
            content.style.opacity = '0';
            content.style.marginTop = '0px';
            toggle.style.transform = 'rotate(-90deg)';
            toggle.textContent = '▶';
          } else {
            content.style.maxHeight = '1000px';
            content.style.opacity = '1';
            content.style.marginTop = '15px';
            toggle.style.transform = 'rotate(0deg)';
            toggle.textContent = '▼';
          }
        });
        
        // Add hover effect to header
        header.addEventListener('mouseenter', () => {
          header.style.backgroundColor = 'rgba(137, 180, 250, 0.1)';
        });
        
        header.addEventListener('mouseleave', () => {
          header.style.backgroundColor = 'transparent';
        });
      }
    }, 100);
  }



  // Apply equipment set with advanced logic
  async function applyAdvancedEquipSet(setObj) {
    showNotification("Applying equipment set...", 'info');
    
    const urlSet = new URLSearchParams(location.search).get("set") || "attack";
    
    for (const [slot, data] of Object.entries(setObj)) {
      const invId = typeof data === "string" ? data : data.invId;
      const slot_id = typeof data === "object" && data.slot_id != null ? data.slot_id : 0;
      
      try {
        const res = await fetch("inventory_ajax.php", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `action=equip_item&inv_id=${encodeURIComponent(
            invId
          )}&slot_id=${slot_id}&set=${encodeURIComponent(urlSet)}`,
        });
        const txt = await res.text();
        if (txt.trim() !== "OK") {
          console.warn("[EquipSets] non-OK response:", txt);
        }
      } catch (e) {
        console.error("Equipment set error:", e);
      }
      
      await new Promise((resolve) => setTimeout(resolve, EQUIP_APPLY_DELAY));
    }
    
    showNotification("Equipment set applied successfully! Reloading...", 'success');
    setTimeout(() => location.reload(), 250);
  }

  // Initialize equipment sets on inventory page
  function initializeEquipmentSets() {
    if (location.pathname.includes("inventory.php")) {
      setTimeout(() => {
        addEquipSetsToInventory();
        loadIntegratedSets();
        try {
          const pending = localStorage.getItem('equipSetEdit');
          if (pending) {
            setTimeout(() => { try { window.editEquipSet(pending); } catch(e) {} localStorage.removeItem('equipSetEdit'); }, 200);
          }
        } catch {}
      }, 250);
    }
  }

  // Equipment sets recording and management for integrated UI
  let currentEquipRecord = {};
  let isRecording = false;

  // Start recording equipment selection
  window.startEquipRecordingSelection = function() {
    if (isRecording) {
      stopEquipRecordingSelection();
      return;
    }
    
    isRecording = true;
    currentEquipRecord = {};
    
    document.querySelectorAll(".slot-box").forEach(box => {
      const equipBtn = box.querySelector('button[onclick^="showEquipModal"]');
      if (!equipBtn) return;
      
      box.style.outline = "2px dashed #5cd65c";
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const parsed = parseOnclickAdvanced(equipBtn.getAttribute("onclick") || "");
        if (!parsed) return;
        
        const img = box.querySelector("img")?.src || "";
        const name = box.querySelector("img")?.alt || "";
        
        let targetSlot = parsed.type;
        let slot_id = 0;
        
        if (parsed.type === "ring") {
          const choice = prompt(
            "Is this ring RING 1 (slot_id=6) or RING 2 (slot_id=9)? Enter 1 or 2:",
            "1"
          );
          if (choice === "2") {
            targetSlot = "ring2";
            slot_id = 9;
          } else {
            targetSlot = "ring1";
            slot_id = 6;
          }
        }
        
        currentEquipRecord[targetSlot] = {
          invId: parsed.invId,
          img,
          name,
          slot_id,
        };
        
        updateEquipmentPreview();
        showNotification(`Added ${name} to equipment set`, 'success');
      };
      
      box.__equipHandler = handler;
      box.addEventListener("click", handler, true);
    });
    
    const recordBtn = document.getElementById('record-equipment-btn');
    if (recordBtn) {
      recordBtn.textContent = "⤵ Stop Selection";
      recordBtn.style.background = "#f38ba8";
    }
    
    showNotification('Selection mode active: Click on equipped items to add to set', 'info');
  };

  function stopEquipRecordingSelection() {
    isRecording = false;
    
    document.querySelectorAll(".slot-box").forEach(box => {
      box.style.outline = "";
      if (box.__equipHandler) {
        box.removeEventListener("click", box.__equipHandler, true);
        delete box.__equipHandler;
      }
    });
    
    const recordBtn = document.getElementById('record-equipment-btn');
    if (recordBtn) {
      recordBtn.textContent = "⤴ Select Equipment";
      recordBtn.style.background = "";
    }
    
    showNotification('Selection stopped', 'info');
  }

  function updateEquipmentPreview() {
    const preview = document.getElementById('equipment-preview');
    if (!preview) return;
    
    const items = Object.entries(currentEquipRecord);
    
    if (items.length === 0) {
      preview.innerHTML = '<div style="color: #9aa0b8; text-align: center; font-size: 12px;">No items selected. Click "Select Equipment" then click on equipped items.</div>';
      return;
    }
    
    // Clear existing content
    preview.innerHTML = '';
    
    // Create elements with proper event listeners
    items.forEach(([slot, data]) => {
      const itemElement = document.createElement('div');
      itemElement.className = 'preview-item';
      itemElement.innerHTML = `
        <img src="${data.img}" alt="${data.name}" title="${data.name}" />
        <button class="remove-btn">×</button>
        <div style="font-size: 10px; color: #cdd6f4; text-align: center; margin-top: 2px;">${slot}</div>
      `;
      
      // Add event listener for remove button
      const removeBtn = itemElement.querySelector('.remove-btn');
      removeBtn.addEventListener('click', () => removeFromPreview(slot));
      
      preview.appendChild(itemElement);
    });
  }

  function removeFromPreview(slot) {
    delete currentEquipRecord[slot];
    updateEquipmentPreview();
    showNotification(`Removed ${slot} from selection`, 'info');
  }

  window.saveCurrentEquipmentSet = function() {
    const setName = document.getElementById('new-set-name')?.value?.trim();
    if (!setName) {
      showNotification('Please enter a set name', 'error');
      return;
    }
    
    if (Object.keys(currentEquipRecord).length === 0) {
      showNotification('No equipment selected. Please select items first.', 'error');
      return;
    }
    
    const sets = getEquipStorageSets();
    sets[setName] = { ...currentEquipRecord };
    saveEquipStorageSets(sets);
    
    // Clear selection
    currentEquipRecord = {};
    updateEquipmentPreview();
    const nameInput = document.getElementById('new-set-name');
    if (nameInput) nameInput.value = '';
    
    loadIntegratedSets();
    showNotification(`Equipment set "${setName}" saved successfully!`, 'success');
  };

  window.applyEquipSet = function(setName) {
    const sets = getEquipStorageSets();
    const setData = sets[setName];
    if (!setData) {
      showNotification('Equipment set not found', 'error');
      return;
    }
    
    applyAdvancedEquipSet(setData);
  };

  window.deleteEquipSet = function(setName) {
    if (!confirm(`Are you sure you want to delete the equipment set "${setName}"?`)) return;
    
    const sets = getEquipStorageSets();
    delete sets[setName];
    saveEquipStorageSets(sets);
    
    loadIntegratedSets();
    showNotification(`Equipment set "${setName}" deleted`, 'success');
  };

  window.editEquipSet = function(setName) {
    const sets = getEquipStorageSets();
    const setData = sets[setName];
    if (!setData) {
      showNotification(`Equipment set "${setName}" not found`, 'error');
      return;
    }
    
    // Start recording mode with existing set data
    isRecording = true;
    currentEquipRecord = { ...setData };
    
    // Update UI to show we're editing
    const recordBtn = document.getElementById('start-equip-record');
    if (recordBtn) {
      recordBtn.textContent = `Editing: ${setName}`;
      recordBtn.style.background = '#f9e2af';
    }
    
    updateEquipmentPreview();
    showNotification(`Editing equipment set "${setName}"`, 'info');
  };

  function loadIntegratedSets() {
    const listContainer = document.getElementById('integrated-sets-list');
    if (!listContainer) return;
    
    const sets = getEquipStorageSets();
    const setNames = Object.keys(sets);
    
    if (setNames.length === 0) {
      listContainer.innerHTML = '<div style="text-align: center; color: #6c7086; padding: 20px;">No equipment sets saved yet</div>';
      return;
    }
    
    // Clear existing content
    listContainer.innerHTML = '';
    
    // Create elements for each set with proper event listeners
    setNames.forEach(setName => {
      const setData = sets[setName];
      const equipmentList = Object.values(setData);
      
      const setElement = document.createElement('div');
      setElement.className = 'equip-set-item';
      setElement.innerHTML = `
        <div>
          <div class="equip-set-name">${setName}</div>
          <div class="equip-set-preview">
            ${equipmentList.slice(0, 8).map(item => `<img src="${item.img}" title="${item.name}" />`).join('')}
            ${equipmentList.length > 8 ? `<span style="color: #6c7086; font-size: 12px;">+${equipmentList.length - 8} more</span>` : ''}
          </div>
          <div style="font-size: 12px; color: #6c7086;">${Object.keys(setData).length} items</div>
        </div>
        <div class="equip-set-actions">
          <button class="equip-btn apply-set">⚡ Apply</button>
          <button class="equip-btn delete-set">🗑️ Delete</button>
        </div>
      `;
      
      // Add event listeners
      const applyBtn = setElement.querySelector('.apply-set');
      const deleteBtn = setElement.querySelector('.delete-set');
      
      applyBtn.addEventListener('click', () => window.applyEquipSet(setName));
      deleteBtn.addEventListener('click', () => window.deleteEquipSet(setName));
      
      listContainer.appendChild(setElement);
    });
  }

  // ===== END ADVANCED EQUIPMENT SETS SYSTEM =====

  // ===== BATTLE MODAL SYSTEM =====

  // Helper: ensure monster overlay shows player count (returns true on success)
  function updateOverlayPlayerCount(card, currentPlayers, maxPlayers) {
    if (!card) return false;
    const overlay = card.querySelector('.monster-overlay');
    if (!overlay) return false;
    let playersSpan = overlay.querySelector('.players');
    if (!playersSpan) {
      playersSpan = document.createElement('span');
      playersSpan.className = 'players';
      overlay.appendChild(playersSpan);
    }
    playersSpan.textContent = `${currentPlayers}/${maxPlayers}`;
    return true;
  }

  function setContinueButtonLabel(btn) {
    if (!btn) return;
    const desired = 'Continue';
    if ((btn.textContent || '').trim() !== desired) {
      btn.textContent = desired;
    }
  }

  function applyDamageToCard(card, damageValue) {
    if (!card) return;
    let overlay = card.querySelector('.monster-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'monster-overlay';
      const img = card.querySelector('.monster-img');
      if (img && img.parentNode === card) {
        card.insertBefore(overlay, img);
      } else {
        card.insertBefore(overlay, card.firstChild);
      }
    }
    let damageSpan = overlay.querySelector('.damage');
    if (!damageSpan) {
      damageSpan = document.createElement('span');
      damageSpan.className = 'damage';
      overlay.appendChild(damageSpan);
    }
    const numeric = Number(damageValue);
    const safeValue = Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
    damageSpan.textContent = safeValue.toLocaleString('en-US');
    card.dataset.yourDamage = String(safeValue);
  }

  function updateMonsterDamageUI(monsterId, damageValue) {
    if (!monsterId) return;
    const normalizedId = String(monsterId);
    const numeric = Number(damageValue);
    const safeValue = Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
    damageCache.set(normalizedId, safeValue);
    const card = findMonsterById(normalizedId);
    if (card) {
      applyDamageToCard(card, safeValue);
    }
  }

  async function fetchCardDamage(card) {
    if (!card) return;
    const monsterId = card.getAttribute('data-monster-id');
    if (!monsterId) return;
    if (card.dataset.yourDamage) {
      applyDamageToCard(card, Number(card.dataset.yourDamage));
      damageCache.set(monsterId, Number(card.dataset.yourDamage));
      return;
    }
    if (damageCache.has(monsterId)) {
      applyDamageToCard(card, damageCache.get(monsterId));
      return;
    }
    if (card.dataset.damageFetching === 'true') return;
    card.dataset.damageFetching = 'true';
    try {
      const html = await fetchBattlePageHtml(monsterId);
      const parsed = parseBattleHtml(html);
      const damage = parsed.damageDone || 0;
      damageCache.set(monsterId, damage);
      applyDamageToCard(card, damage);
    } catch (error) {
      console.error('Failed to load player damage for monster', monsterId, error);
    } finally {
      delete card.dataset.damageFetching;
    }
  }

  function initContinueDamageTracking() {
    const processCard = (card) => {
      if (!card) return;
      const hasContinueBtn = card.querySelector('.continue-btn');
      if (!hasContinueBtn) return;
      fetchCardDamage(card);
    };

    document.querySelectorAll('.monster-card').forEach(processCard);
    const root = document.querySelector('.monster-container') || document.body;
    if (!root) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (!(node instanceof HTMLElement)) return;
          if (node.classList.contains('monster-card')) {
            processCard(node);
          } else {
            node.querySelectorAll?.('.monster-card').forEach(processCard);
          }
        });
      });
    });

    observer.observe(root, { childList: true, subtree: true });
  }

  // Helper: update a join button to show overlay-based player count
  function enhanceJoinButtonWithPlayers(btn, monsterCard) {
    try {
      if (!btn) return;

      // 1) Prefer the structured monster-stats block when present (avoids picking HP)
      if (monsterCard) {
        const stats = monsterCard.querySelector('.monster-stats');
        if (stats) {
          // Find the stat-row that represents joined players (icon.grp or label 'Players Joined')
          const rows = Array.from(stats.querySelectorAll('.stat-row'));
          for (const row of rows) {
            const label = (row.querySelector('.stat-label')?.textContent || '').trim();
            const iconClass = (row.querySelector('.stat-icon')?.className || '').toLowerCase();
            if (/players\s*joined/i.test(label) || /\bgrp\b/.test(iconClass) || /👥/.test(row.textContent)) {
              // Look for party-chip or a mini-chip inside stat-value
              const chip = row.querySelector('.party-chip, .mini-chip.party-chip, .stat-value .mini-chip') || row.querySelector('.stat-value');
              const text = (chip?.textContent || row.textContent || '').trim();
              const m = text.match(/(\d[\d,]*)\s*\/\s*(\d[\d,]*)/);
              if (m2) {
                btn.innerHTML = '⚔️ Join';
                btn.dataset.enhanced = 'true';
                return;
              }
            }
          }
        }
      }

      // 2) If no structured stats, search for explicit elements mentioning Players/Joined or the 👥 emoji
      if (monsterCard) {
        const explicit = Array.from(monsterCard.querySelectorAll('div, span, p, small, label, li'))
          .find(el => /\bPlayers\b|\bJoined\b|👥|party-chip/i.test(el.textContent));
        if (explicit) {
          const m2 = explicit.textContent.match(/(\d[\d,]*)\s*\/\s*(\d[\d,]*)/);
          if (m2) {
            btn.innerHTML = '⚔️ Join';
            btn.dataset.enhanced = 'true';
            return;
          }
        }
      }
    } catch (e) {
      try { btn.textContent = 'Join'; } catch (e2) {}
    }
  }

  // Handle joining a battle with modal option
  async function handleJoin(monsterId, btn) {
    if (!extensionSettings.battleModal.enabled) {
      // If battle modal is disabled, use normal join
      window.location.href = `battle.php?id=${monsterId}`;
      return;
    }
    try {
      btn.disabled = true;
      btn.textContent = 'Joining...';
      // Try to get monster name from the current page first (as fallback)
      let monsterNameFallback = null;
      const monsterCard = btn.closest('.monster-card, .wave-monster, .battle-card');
      if (monsterCard) {
        const nameElem = monsterCard.querySelector('h3, h2, h1, .monster-name');
        if (nameElem) {
          monsterNameFallback = nameElem.textContent.trim();
        }
      }
      // First, submit the join action to the server
      const joinPayload = 'monster_id=' + monsterId + '&user_id=' + userId;
      const joinResponse = await fetch('user_join_battle.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: joinPayload,
        referrer: 'https://demonicscans.org/battle.php?id=' + monsterId
      });
      const joinData = await joinResponse.text();
      const joinMsg = (joinData || '').trim();
      const joinSuccess = joinMsg.toLowerCase().startsWith('you have successfully');
      if (!joinSuccess) {
        if (joinMsg.toLowerCase().includes('you can only join 5 monsters at a time in this wave')) {
          showNotification('You have reached the maximum of 5 active battles in this wave.', 'error');
          enhanceJoinButtonWithPlayers(btn, monsterCard);
          btn.disabled = false;
        } else if (joinMsg.toLowerCase().includes('invalid monster')) {
          showNotification('Monster already died', 'error');
          enhanceJoinButtonWithPlayers(btn, monsterCard);
        } else {
          throw new Error(joinMsg || 'Failed to join battle');
        }
      } else {
        // Clean up any old "Continue" duplicates appended previously
        try {
          monsterCard?.querySelectorAll('a .join-btn, a .continue-btn')?.forEach(b => {
            if (/continue/i.test(b.textContent||'')) {
              const wrap = b.closest('a');
              if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
            }
          });
        } catch(e) { /* no-op */ }

        // Hide the clicked Join button and any sibling Join buttons
        try {
          btn.style.display = 'none';
          monsterCard?.querySelectorAll('.join-btn')?.forEach(jb => {
            if (jb !== btn && /join/i.test(jb.textContent||'')) {
              jb.style.display = 'none';
            }
          });
        } catch(e) { /* no-op */ }

        // Move monster card to Continue Battle section
        let continueSection = document.getElementById('continue-battle-content');
        if (!continueSection) {
          // Create the section and container if missing
          const section = document.createElement('div');
          section.className = 'monster-section';
          section.innerHTML = `
            <div class="monster-section-header">
              <h3 style="color: #f38ba8; margin: 0; flex: 1;">⚔️ Continue Battle</h3>
              <button class="section-toggle-btn" id="continue-battle-toggle">–</button>
            </div>
            <div class="monster-section-content" id="continue-battle-content" style="display: block;">
              <div class="monster-container" style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 18px;"></div>
            </div>
          `;
          // Insert at top of .content-area (or body)
          const contentArea = document.querySelector('.monster-container') || document.body;
          contentArea.insertBefore(section, contentArea.firstChild);
          continueSection = section.querySelector('#continue-battle-content');
        }
        // Remove from current parent and append to continueContainer
        if (monsterCard.parentNode) {
          monsterCard.parentNode.removeChild(monsterCard);
        }
        // Append monster card to the monster-container inside continueSection
        const continueContainer = continueSection.querySelector('.monster-container');
        continueContainer.appendChild(monsterCard);

        // Now fetch the battle page to show in modal
        const html = await fetchBattlePageHtml(monsterId);
        const parsed = parseBattleHtml(html);
        const monster = {
          id: monsterId,
          skillButtons: parsed.skillButtons || [],
          currentHp: parsed.currentHp || 0,
          maxHp: parsed.maxHp || 0,
          battleLog: parsed.battleLog || [],
          damageDone: parsed.damageDone || 0,
          leaderboard: parsed.leaderboard || [],
          playerCount: parsed.playerCount || 0,
          monsterName: parsed.monsterName || 'Unknown Monster'
        };
        updateMonsterDamageUI(monsterId, monster.damageDone || 0);
        const ensureContinueButton = (target) => {
          if (!target) return false;
          let continueBtn = target.querySelector('.continue-btn');
          if (!continueBtn) {
            continueBtn = document.createElement('button');
            continueBtn.className = 'continue-btn';
            continueBtn.setAttribute('draggable', 'false');
            continueBtn.style.cssText = 'flex: 1 1 0%; font-size: 12px; background: rgb(230, 126, 34);';
            setContinueButtonLabel(continueBtn);
          } else {
            continueBtn.style.display = '';
            continueBtn.disabled = false;
          }
          setContinueButtonLabel(continueBtn);
          continueBtn.onclick = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            showBattleModal(monster);
          };
          if (!continueBtn.parentNode) {
            const viewBtn = target.querySelector('#view-battle-btn');
            if (viewBtn) {
              target.insertBefore(continueBtn, viewBtn);
            } else {
              target.appendChild(continueBtn);
            }
          }
          return true;
        };

        if (!ensureContinueButton(monsterCard.querySelector('.uiaddon-action-bar'))) {
          try {
            const anchor = document.createElement('a');
            anchor.setAttribute('draggable','false');
            anchor.setAttribute('data-monster-id', monsterId);
            anchor.style.cursor = 'pointer';

            const fallbackBtn = document.createElement('button');
            fallbackBtn.className = 'continue-btn';
            fallbackBtn.setAttribute('draggable','false');
            fallbackBtn.style.background = 'rgb(230, 126, 34)';
            setContinueButtonLabel(fallbackBtn);
            fallbackBtn.addEventListener('click', (ev) => {
              ev.preventDefault(); ev.stopPropagation();
              showBattleModal(monster);
            });

            anchor.appendChild(fallbackBtn);
            monsterCard.appendChild(anchor);
          } catch (e) { /* no-op */ }
        }

        await showBattleModal(monster);
      }
    } catch (error) {
      if (error.message.includes('Invalid monster')) {
        showNotification('Monster already died', 'error');
        enhanceJoinButtonWithPlayers(btn, monsterCard);
      } else {
        console.error('Error joining battle:', error);
        showNotification('Error joining battle', 'error');
        enhanceJoinButtonWithPlayers(btn, monsterCard);
        btn.disabled = false;
      }
    }
  }

  
function parseAttackLogs(html) {
  // Create a temporary DOM element to parse the HTML
  const container = document.createElement('div');
  container.innerHTML = html;

  const logs = [];
  const logPanel = container.querySelector('.panel.log-panel');

  if (!logPanel) return logs;

  // Match each log line
  const logLines = logPanel.innerHTML.split('<br>').filter(line => line.includes('used'));

  logLines.forEach(line => {
    const match = line.match(/<a[^>]*>(.*?)<\/a>\s*used\s*(.*?)\s*for\s*([\d,]+)\s*DMG!/);
    if (match) {
      const [, player, skill, damage] = match;
      logs.push(
        {USERNAME: player.trim(), 
          SKILL: skill.trim(), 
          DAMAGE: parseInt(damage.replace(/,/g, ''))}
      );
      }
    }
  );

  return logs;
}

  // Attack monster in modal
  async function attackMonster(monsterId, skillId, btn, skillButtons) {
    try {
      btn.disabled = true;
      const originalText = btn.textContent;
      let loadPromises = [];
      btn.style.backgroundColor = 'rgba(70, 140, 252, 1)';
      // Capture previous stamina to detect if any was used
      let prevStamina = null;
      try {
        const staminaSpan = document.getElementById('stamina_span');
        if (staminaSpan) {
          const txt = String(staminaSpan.textContent || '').replace(/[^\d]/g, '');
          if (txt) prevStamina = parseInt(txt, 10);
        }
        if (prevStamina == null && typeof userData?.currentStamina === 'number') {
          prevStamina = userData.currentStamina;
        }
      } catch {}
      const staminaCost = skillId === "-1" ? 10 : skillId === "-2" ? 50 : skillId === "-3" ? 100 : skillId === "-4" ? 200 : 1;
      const body = `monster_id=${encodeURIComponent(monsterId)}&skill_id=${encodeURIComponent(skillId)}&stamina_cost=${encodeURIComponent(staminaCost)}`;
      const response = await fetch('damage.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body,
        credentials: 'include',
        referrer: 'https://demonicscans.org/battle.php?id=' + monsterId
      });
      let result;
      let rawText;
      try {
        rawText = await response.text();
        if (rawText.trim().startsWith('<')) {
          console.error('[BattleModal] Attack failed: server returned HTML:', rawText);
          showNotification('Attack failed: server returned HTML', 'error');
          btn.style.backgroundColor = 'rgb(137, 180, 250)';
          btn.disabled = false;
          return;
        }
        result = JSON.parse(rawText);
      } catch (e) {
        console.error('[BattleModal] Attack failed: invalid server response:', rawText);
        showNotification('Attack failed: invalid server response', 'error');
        btn.style.backgroundColor = 'rgb(137, 180, 250)';
        btn.disabled = false;
        return;
      }
      if (!result || result.status !== 'success') {
        showNotification('Attack failed: ' + (result?.message || 'Unknown error'), 'error');
        btn.style.backgroundColor = 'rgb(137, 180, 250)';
        btn.disabled = false;
        return;
      }
      // Build updatedMonster from JSON
      let updatedMonster = {
        id: monsterId,
        monsterName: result.message?.match(/to <strong>(.*?)<\/strong>/)?.[1] || 'Unknown Monster',
        currentHp: result.hp?.value || result.global_hp?.value || 0,
        maxHp: result.hp?.max || result.global_hp?.max || 0,
        battleLog: [],
        damageDone: 0,
        leaderboard: result.leaderboard || [],
        playerCount: result.leaderboard ? result.leaderboard.length : 0,
        skillButtons: skillButtons || [],
      };
      // Define monsterName for later use
      const monsterName = updatedMonster.monsterName;
      if (monsterId && monsterName) {
          loadPromises.push(
            fetch(`battle.php?id=${monsterId}`)
              .then(response => response.text())
              .then(html => {
                const yourDamageMatch = html.match(/<span\s+id=["']yourDamageValue["']>([\d,]+)<\/span>/i);
                const yourDamage = yourDamageMatch ? parseInt(yourDamageMatch[1].replace(/,/g, '')) : 0;
                updatedMonster.damageDone = yourDamage;
                const leaderboard = parseLeaderboardFromHtml(html);
                updatedMonster.leaderboard = leaderboard;
                updatedMonster.playerCount = leaderboard.length;
                const logs = parseAttackLogs(html);
                updatedMonster.battleLog = logs;
              })
              .catch(error => console.error('Error loading loot for filter:', error))
          );
        };
      await Promise.all(loadPromises);
      // update stamina display
      const staminaElem = document.getElementById('stamina_span');
      const newStamina = result.stamina || 0;
      if (staminaElem) {
        staminaElem.textContent = newStamina;
      }
      // Keep userData in sync
      if (typeof userData === 'object') {
        userData.currentStamina = newStamina;
      }
      // Attention note: if stamina used equals 0 (dragons saved it)
      try {
        if (prevStamina != null) {
          const used = Number(prevStamina) - Number(newStamina);
          if (Number.isFinite(used) && used === 0 && staminaCost > 0) {
            // Show a non-error attention note in warning/yellow
            showNotification('Your dragons saved your stamina', 'info');
          }
        }
      } catch {}

        console.log('[BattleModal] Updating monster card for:', updatedMonster);
      // Update modal with new monster data
      showBattleModal(updatedMonster);
        updateMonsterDamageUI(monsterId, updatedMonster.damageDone || 0);
  // Ensure hotkey overlays are re-applied after modal rerender
  try { setTimeout(addBattleAttackHotkeyOverlays, 150); } catch {}
      // Update monster card UI with new data
      // Update monsterList with the latest monster
      let found = false;
      for (let i = 0; i < monsterList.length; i++) {
        if (monsterList[i].id == updatedMonster.id) {
          monsterList[i] = updatedMonster;
          found = true;
          break;
        }
      }
      if (!found) {
        monsterList.push(updatedMonster);
      }
      return result;
    } catch (error) {
      const originalText = btn.textContent;
      console.error('[BattleModal] Error attacking:', error);
      showNotification('Error attacking monster', 'error');
      btn.textContent = originalText || 'Attack';
      btn.disabled = false;
    }
  }

  // Heals the current user with a potion via site endpoint
  async function healPlayerWithPotion(uid) {
    try {
      const body = `user_id=${encodeURIComponent(String(uid))}`;
      const res = await fetch('user_heal_potion.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body,
        credentials: 'include'
      });
      const text = await res.text();
      let success = res.ok;
      let message = '';
      try {
        const j = JSON.parse(text);
        success = !!(j.success ?? j.status === 'success' ?? success);
        message = j.message || '';
      } catch (_) {
        // Non-JSON, infer success from keywords
        const lower = text.toLowerCase();
        if (/success|healed|potion used|you have used/.test(lower)) success = true;
        message = text.replace(/<[^>]*>/g, '').trim();
      }
      return { success, message: message || (success ? 'Healed with potion.' : 'Failed to heal'), raw: text };
      // Heals the current user via the timed heal endpoint
    } catch (e) {
      console.error('[Potion] healPlayerWithPotion failed:', e);
      return { success: false, message: e?.message || 'Network error' };
    }
  }
  async function healPlayerTimed(uid) {
    try {
      const body = `user_id=${encodeURIComponent(String(uid))}`;
      const res = await fetch('user_heal.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body,
        credentials: 'include'
      });
      const text = await res.text();
      let success = res.ok;
      let message = '';
      try {
        const asJson = JSON.parse(text);
        if (asJson && (asJson.message || asJson.status)) {
          message = asJson.message || asJson.status;
        }
        // Consider typical success cues
        if (!success && (String(asJson?.status).toLowerCase() === 'success')) success = true;
      } catch (_) {
        // Fallback: look for success keywords in plain text
        if (/success|healed|hp restored/i.test(text)) {
          success = true;
          message = 'Healed successfully';
        }
      }
      return { success, message: message || (success ? 'Healed.' : 'Failed to heal'), raw: text };
    } catch (e) {
      console.error('[TimedHeal] healPlayerTimed failed:', e);
      return { success: false, message: e?.message || 'Network error' };
    }
  }

  // Refresh only the player's HP bar/details inside the modal
  async function refreshModalPlayerHp(monsterId) {
    try {
      const res = await fetch(`battle.php?id=${monsterId}`, { credentials: 'include' });
      const html = await res.text();
      const doc = parseHTML(html);
      const pCard = doc.querySelector('.battle-card.player-card');
      if (!pCard) return;

      // Extract current/max HP from the server-rendered player card
      let curr = 0, max = 0;
      // Prefer explicit hp text near bar
      const hpText = pCard.querySelector('.hp-text')?.textContent || pCard.textContent || '';
      const m = hpText.match(/(\d[\d,]*)\s*\/\s*(\d[\d,]*)/);
      if (m) {
        curr = parseInt(m[1].replace(/,/g, ''), 10);
        max = parseInt(m[2].replace(/,/g, ''), 10);
      }
      if (!max) return; // Can't update without max

      const modalInfo = document.getElementById('modal-player-info');
      if (!modalInfo) return;
      // Update numbers overlay
      const numEl = modalInfo.querySelector('.hp-numbers-player');
      if (numEl) numEl.textContent = `${curr.toLocaleString()}/${max.toLocaleString()}`;
      // Update fill width
      const fillEl = modalInfo.querySelector('#pHpFill') || modalInfo.querySelector('.hp-fill.hp-fill--player') || modalInfo.querySelector('.hp-fill');
      if (fillEl) {
        const pct = Math.max(0, Math.min(100, Math.round((curr / max) * 100)));
        fillEl.style.width = pct + '%';
      }
    } catch (e) {
      console.error('[Potion] Failed to refresh modal HP:', e);
    }
  }

  // ===== EXP POTION INTEGRATION (BATTLE DRAWER) =====

  // Helper to build a generic potion card element
  function createBattleDrawerPotionCard(options) {
    const {
      idSuffix,
      imgSrc,
      imgAlt,
      name,
      description,
      maxQty,
      readonly,
      onUse
    } = options;

    const card = document.createElement('div');
    card.className = 'potion-card';
    card.dataset.invId = idSuffix;

    card.innerHTML = `
      <img src="${imgSrc}" alt="${imgAlt}">
      <div class="potion-main">
        <div class="potion-name">
          <span>${name}</span>
          <span class="qtyleft">
            x<span class="potion-qty-left" id="pqty_${idSuffix}">${maxQty}</span>
          </span>
        </div>
        <div class="potion-desc">${description}</div>
        <div class="potion-actions">
          <button class="potion-use-btn" data-custom="exp" data-id="${idSuffix}" type="button" draggable="false">Use</button>
        </div>
      </div>
    `;

    const qtySpan = card.querySelector(`#pqty_${idSuffix}`);
    const input = card.querySelector(`#puse_${idSuffix}`);
    const btn = card.querySelector('.potion-use-btn');

    if (btn) {
      btn.addEventListener('click', async (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }

        const qty = 1;
        if (qty <= 0) return;

        const confirmed = window.confirm(`Use ${qty}x ${name}? This will consume the item(s).`);
        if (!confirmed) return;

        // Call provided hook; it should handle server interaction.
        const ok = await onUse(qty, {
          card,
          qtySpan,
          input,
          btn
        });

        if (!ok) return;

        const current = parseInt(qtySpan.textContent.replace(/[^0-9]/g, ''), 10) || 0;
        const next = current - qty;
        qtySpan.textContent = next > 0 ? String(next) : '0';
        if (input) {
          input.max = String(Math.max(next, 0));
        }
        if (next <= 0) {
          btn.disabled = true;
          btn.textContent = 'None left';
        }
      });
    }

    return card;
  }

  async function fetchExpPotionSlot() {
    // 1. Fetch the inventory page
    const res = await fetch('/inventory.php', {
      credentials: 'include'
    });
    const html = await res.text();

    // 2. Parse the HTML in a detached DOM
    const doc = parseHTML(html);

    // 3. Find the slot-box with the matching image
    const targetSrc = 'images/items/1758633119_10_exp_potion.webp';
    const slot = Array.from(doc.querySelectorAll('.slot-box')).find(box => {
      const img = box.querySelector('img');
      return img && img.getAttribute('src') === targetSrc;
    });

    if (!slot) {
      console.warn('[ExpPotion] No matching slot-box found for', targetSrc);
      return null;
    }

    // 4. Extract the data you need
    const img = slot.querySelector('img');
    const infoBtn = slot.querySelector('.info-btn');
    const useBtn = slot.querySelector('.btn[onclick*="useItem"]');
    const qtyEl = slot.querySelector('.label div');

    const src = img?.getAttribute('src') || '';
    const name = infoBtn?.dataset.name || '';
    const desc = infoBtn?.dataset.desc || '';
    const quantityText = qtyEl?.textContent.trim() || 'x0';
    const quantity = parseInt(quantityText.replace(/[^0-9]/g, ''), 10) || 0;

    // Parse the useItem(...) call from the onclick
    let useItemArgs = null;
    if (useBtn && useBtn.getAttribute('onclick')) {
      const onclick = useBtn.getAttribute('onclick');
      const match = onclick.match(/useItem\s*\(([^)]*)\)/);
      if (match) {
        useItemArgs = match[1]
          .split(',')
          .map(s => s.trim().replace(/^'|'$/g, ''));
      }
    }

    return {
      src,
      name,
      desc,
      quantity,
      useItemArgs
    };
  }

  // Inject EXP potion card into battle drawer when available
  async function injectExpPotionIntoBattleDrawer() {
    try {
      const drawer = document.getElementById('battleDrawer');
      if (!drawer) return;

      const potionSlot = await fetchExpPotionSlot();
      if (!potionSlot || potionSlot.quantity <= 0) return;

      // Use potionSlot.name, potionSlot.desc, potionSlot.useItemArgs, etc.
      console.log('Fetched Exp Potion slot:', potionSlot);
      const potionCard = createBattleDrawerPotionCard({
        idSuffix: potionSlot.name.replace(/\s+/g, '_').toLowerCase(),
        imgSrc: potionSlot.src,
        imgAlt: potionSlot.name,
        name: potionSlot.name,
        description: potionSlot.desc,
        maxQty: potionSlot.quantity,
        readonly: false,
        onUse: async (qty) => {
          if (!Array.isArray(potionSlot.useItemArgs)) return false;

          // Parsed from inventory onclick: [itemId, slotId, itemName, totalQty]
          const [itemId] = potionSlot.useItemArgs;

          try {
            const response = await fetch('https://demonicscans.org/use_item.php', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
              },
              credentials: 'include',
              body: `inv_id=${encodeURIComponent(itemId)}`
            });

            if (!response.ok) {
              console.error('[ExpPotion] use_item.php request failed:', response.status);
              showNotification('Failed to use item (network error)', 'error');
              return false;
            }

            const text = await response.text();
            const trimmed = (text || '').trim();

            if (trimmed === 'Item not found or not usable.') {
              showNotification('Item could not be used', 'error');
              return false;
            } else {
              showNotification(`${potionSlot.name} used successfully!`, 'success');
              return true;
            }
          } catch (err) {
            console.error('[ExpPotion] Failed to call use_item.php from battle drawer:', err);
            showNotification('Error calling use_item.php', 'error');
            return false;
          }
        }
      });

      drawer.appendChild(potionCard);
    } catch (e) {
      console.error('[ExpPotion] Failed to inject EXP potion into battle drawer:', e);
    }
  }

  // Show battle modal
  async function showBattleModal(monster) {
    // Remove existing modal/backdrop if present
    const existingBackdrop = document.getElementById('battle-modal-backdrop');
    if (existingBackdrop) existingBackdrop.remove();
    const existingModal = document.getElementById('battle-modal');
    if (existingModal) existingModal.remove();

    setModalOpen(true);
    let html = "";

    // Create backdrop that blocks the page and holds the modal
    const backdrop = document.createElement('div');
    backdrop.id = 'battle-modal-backdrop';
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100%';
    backdrop.style.height = '100%';
    backdrop.style.background = 'rgba(0, 0, 0, 0.65)';
    // Backdrop sits above the page, modal sits above the backdrop
    backdrop.style.zIndex = '9998';
    backdrop.style.display = 'flex';
    backdrop.style.alignItems = 'center';
    backdrop.style.justifyContent = 'center';
    backdrop.style.padding = '10px';

    // Create the modal card itself
    let modal = document.createElement('div');
    let content = document.createElement('div');
    // Center the card within the flex backdrop
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.zIndex = '10005';
    modal.style.background = '#1e1e2e';
    modal.style.color = '#cdd6f4';
    modal.style.borderRadius = '12px';
    modal.style.boxShadow = '0 8px 32px rgba(0,0,0,0.35)';
    modal.style.padding = '24px';
    modal.style.minWidth = '320px';
    modal.style.maxWidth = '90vw';
    modal.style.maxHeight = '90vh';
    modal.style.overflowY = 'auto';
    modal.style.border = '2px solid #89b4fa';
    modal.id = 'battle-modal';
    content.id = 'battle-modal-content';
    modal.appendChild(content);

    // Close when clicking/tapping the dimmed background (but not the modal itself)
    backdrop.addEventListener('click', (e) => {
      // Only react if the click actually landed on the backdrop, not the modal
      if (e.target !== backdrop) return;

      // Prefer the central close helper so all related cleanup runs
      if (typeof closeBattleModal === 'function') {
        closeBattleModal();
      } else {
        setModalOpen(false);
        backdrop.remove();
      }
    });

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Fix ReferenceError: compact is not defined
    let compact = false;  
    // Check if monster is dead
    if (monster.hp && Number(monster.hp.value) <= 0) {
      html += `<div style="color:#f38ba8; font-size:16px; font-weight:bold; margin:12px 0;">🪦 Monster is dead</div>`;
      html += `</div>`;
      return renderModal(html);
    }
    // Add close button
    html += `<button id="close-battle-modal" style="position: absolute; top: 12px; right: 16px; background: #f38ba8; color: #1e1e2e; border: 2px solid #cdd6f4; border-radius: 50%; width: 32px; height: 32px; font-size: 18px; font-weight: bold; cursor: pointer; z-index: 10001;">&times;</button>`;
        
    // Calculate player count and your damage from leaderboard (always use latest data)
    let playerCount = Array.isArray(monster.leaderboard) ? monster.leaderboard.length : (monster.playerCount || 0);
    let yourDamage = (monster.damageDone || 0);
    yourDamage = formatNumber2Decimals(yourDamage);
    let userId = String(userData.userID || monster.userId || window.userId || (typeof getCurrentUserId === 'function' ? getCurrentUserId() : ''));
    let entry = null;
    if (Array.isArray(monster.leaderboard) && userId) {
      // Try both string and number comparison for ID
      entry = monster.leaderboard.find(e => {
        const entryId = String(e.ID ?? e.id);
        return entryId === String(userId) || Number(entryId) === Number(userId);
      });
      if (!entry && userData.username) {
        entry = monster.leaderboard.find(e => String(e.USERNAME ?? e.username) === String(userData.username ?? window.username));
      }
    }
    // Render monster info (format large numbers as 1,000,000.00 and preserve 0 values)
    const currHpVal = (monster.currentHp ?? (monster.hp?.value));
    const maxHpVal = (monster.maxHp ?? (monster.hp?.max));
    const currHpText = (currHpVal === null || typeof currHpVal === 'undefined') ? '?' : formatNumber2Decimals(currHpVal);
    const maxHpText = (maxHpVal === null || typeof maxHpVal === 'undefined') ? '?' : formatNumber2Decimals(maxHpVal);
    html += `<div style="margin-bottom: 12px;">
      <div style="font-size: 18px; font-weight: bold; color: #89b4fa;">${monster.monsterName || 'Monster'}</div>
      <div style="font-size: 15px; margin-top: 4px;">HP: <span style="color: #a6e3a1; font-weight: bold;">${currHpText}</span> / <span style="color: #fab387;">${maxHpText}</span></div>
  <div style="font-size: 13px; margin-top: 2px;">Players: <span id="modal-player-count">${playerCount}</span></div>
  <div style="font-size: 13px; margin-top: 2px;">Your Damage: <span id="modal-your-damage">${yourDamage}</span></div>
    </div>`;
    // Monster is alive, render attack skills or fallback message
    if (monster.skillButtons && monster.skillButtons.length > 0) {
      html += '<div style="margin-bottom: 12px; display: flex; gap: 12px; flex-wrap: wrap;">';
      monster.skillButtons
        .filter(skill => skill && skill.name && skill.name.trim() !== '⚡ Attack FX: ON')
        .forEach(skill => {
          html += `<button class="modal-skill-btn" data-skill-id="${typeof skill.id !== 'undefined' ? skill.id : ''}" style="background: #89b4fa; color: #1e1e2e; border: 2px solid #cdd6f4; padding: ${(typeof compact !== 'undefined' && compact) ? '8px' : '12px'}; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: ${(typeof compact !== 'undefined' && compact) ? '12px' : '14px'}; transition: background-color 0.15s ease, transform 0.1s ease; margin-bottom: 6px;">${skill.name}${skill.stamina ? ` (${skill.stamina} STAMINA)` : ''}</button>`;
        });
      html += '</div>';
      // Add event listeners to skill buttons to refresh modal after attack
      setTimeout(() => {
        document.querySelectorAll('.modal-skill-btn').forEach(btn => {
          btn.addEventListener('click', async function() {
            const skillId = this.getAttribute('data-skill-id');
            // Only disable the clicked button; others remain usable if the attack fails
            const attackResult = await attackMonster(monster.id, skillId, this, monster.skillButtons);
            // Update player HP bar in modal if response contains user_hp_after
            if (attackResult && typeof attackResult.user_hp_after !== 'undefined') {
              const hpFill = document.getElementById('pHpFill');
              const hpNumbers = document.querySelector('#modal-player-info .hp-numbers-player');
              // Try to get max HP from the modal
              let maxHp = 0;
              const statsDiv = document.querySelector('#modal-player-info #yourStats');
              if (statsDiv && statsDiv.dataset.maxhp) {
                maxHp = parseInt(statsDiv.dataset.maxhp, 10);
              }
              if (hpFill && maxHp) {
                const percent = Math.round((attackResult.user_hp_after / maxHp) * 100);
                hpFill.style.width = percent + '%';
              }
              if (hpNumbers && maxHp) {
                hpNumbers.textContent = `${attackResult.user_hp_after}/${maxHp}`;
              }
            }
          });
        });
      }, 100);
    } else {
      html += `<div style="color:#f38ba8; font-size:15px; font-weight:bold; margin:12px 0;">No attack skills available.<br><span style="font-size:13px; color:#fab387;">You may need to unlock skills, wait for the battle to start, or check your status.</span></div>`;
    }
    // Add player health info
    if (extensionSettings.battleModal.showPlayerInfo) {
      html += `<div id="modal-player-info" style="background: #181825; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
        <div class="battle-card player-card">
          <h3 style="margin: 0 0 8px 0; color: #89b4fa; font-size: 14px;">Your Info</h3>
          <div style="font-size: 13px;">HP: <span id="modal-player-hp" style="color: #a6e3a1; font-weight: bold;">Loading...</span> / <span id="modal-player-max-hp" style="color: #fab387;">Loading...</span></div>
        </div>
      </div>`;
      setTimeout(async () => {
        try {
          const response = await fetch(`battle.php?id=${monster.id}`);
          const htmlText = await response.text();
          // Inject player info section as a separate part
          const doc = parseHTML(htmlText);
          const playerCard = doc.querySelector('.battle-card.player-card');
          if (playerCard) {
            // Transform the player card to match requested structure
            // Remove eyebrow and headline
            // Remove any eyebrow with 'Retaliation Preview' or 'You' text
            const eyebrows = playerCard.querySelectorAll('.eyebrow');
            eyebrows.forEach(el => {
              const txt = el.textContent.trim();
              if (txt === 'Retaliation Preview' || txt === 'You') el.remove();
            });
            const headline = playerCard.querySelector('.card-headline');
            if (headline) {
              // Remove card-title and card-sub from headline
              const cardTitle = headline.querySelector('.card-title');
              if (cardTitle) cardTitle.remove();
              const cardSub = headline.querySelector('.card-sub');
              if (cardSub) cardSub.remove();
            }
            // Move HP numbers into HP bar as .hp-numbers-player
            const hpBar = playerCard.querySelector('.hp-bar');
            const hpText = playerCard.querySelector('.hp-text');
            if (hpBar && hpText) {
              // Extract HP numbers from hpText
              const hpNumbers = hpText.textContent.replace(/[^\d,\/]/g, '').trim();
              const hpNumbersDiv = document.createElement('div');
              hpNumbersDiv.className = 'hp-numbers-player card-sub';
              hpNumbersDiv.textContent = hpNumbers;
              hpBar.insertBefore(hpNumbersDiv, hpBar.firstChild);
              hpText.remove();
            }
            // Remove any remaining headline/eyebrow elements
            if (headline) headline.innerHTML = '';

            // Move the 'Ready in' timer after the heal buttons
            const healChips = playerCard.querySelectorAll('.inline-chips');
            let timerSpan = null;
            healChips.forEach(chip => {
              const timer = chip.querySelector('.muted');
              if (timer) {
                timerSpan = timer;
                timer.remove();
              }
            });
            // Find the heal buttons container (the .inline-chips with the heal buttons)
            let healBtnChips = null;
            healChips.forEach(chip => {
              if (chip.querySelector('#usePotionBtn') || chip.querySelector('#timedHealBtn')) {
                healBtnChips = chip;
              }
            });
            if (healBtnChips && timerSpan) {
              const healBtn = healBtnChips.querySelector('#timedHealBtn');
              if (healBtn) {
                healBtn.insertAdjacentElement('afterend', timerSpan);
              } else {
                healBtnChips.appendChild(timerSpan);
              }
              // Remove display:flex from timer style if present
              if (timerSpan.hasAttribute('style')) {
                timerSpan.setAttribute('style', timerSpan.getAttribute('style').replace(/display\s*:\s*flex;?/i, ''));
              }
            }

            // Inject transformed card
            const modalContent = document.getElementById('battle-modal-content');
            if (modalContent) {
              let playerInfoDiv = document.getElementById('modal-player-info');
              if (!playerInfoDiv) {
                playerInfoDiv = document.createElement('div');
                playerInfoDiv.id = 'modal-player-info';
                playerInfoDiv.style = 'background: #181825; padding: 12px; border-radius: 8px; margin-bottom: 12px;';
                // Always insert after monster header (first child), before loot preview
                if (modalContent.children.length > 1) {
                  modalContent.insertBefore(playerInfoDiv, modalContent.children[1]);
                } else {
                  modalContent.appendChild(playerInfoDiv);
                }
              }
              playerInfoDiv.innerHTML = playerCard.outerHTML;

              // === Attach potion heal handler ===
              const potionBtn = playerInfoDiv.querySelector('#usePotionBtn');
              if (potionBtn) {
                // Avoid duplicate listeners
                if (!potionBtn.dataset.uiAddonPotionBound) {
                  potionBtn.dataset.uiAddonPotionBound = '1';
                  potionBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const uid = userData.userID || getCookieExtension('demon');
                    if (!uid) {
                      showNotification('User ID not found for healing.', '#e74c3c');
                      return;
                    }
                    potionBtn.disabled = true;
                    try {
                      const healResult = await healPlayerWithPotion(uid);
                      // Refresh only the HP bar part
                      await refreshModalPlayerHp(monster.id);
                      if (healResult.success) {
                        showNotification(healResult.message || 'Potion used!', 'success');
                      } else {
                        showNotification(healResult.message || 'Potion use failed', 'error');
                      }
                    } catch (err) {
                      console.error('[Battle Modal] Healing error:', err);
                      showNotification('Error using potion', 'error');
                    } finally {
                      potionBtn.disabled = false;
                    }
                  });
                }
              }
              // === Attach timed heal handler ===
              const timedHealBtn = playerInfoDiv.querySelector('#timedHealBtn');
              if (timedHealBtn && !timedHealBtn.dataset.uiAddonTimedHealBound) {
                timedHealBtn.dataset.uiAddonTimedHealBound = '1';
                timedHealBtn.addEventListener('click', async (e) => {
                  e.preventDefault();
                  const uid = userData.userID || getCookieExtension('demon');
                  if (!uid) {
                    showNotification('User ID not found for healing.', 'error');
                    return;
                  }
                  // Don't proceed if the button is disabled
                  if (timedHealBtn.disabled) return;
                  timedHealBtn.disabled = true;
                  try {
                    const healResult = await healPlayerTimed(uid);
                    await refreshModalPlayerHp(monster.id);
                    if (healResult.success) {
                      showNotification(healResult.message || 'Healed!', 'success');
                    } else {
                      showNotification(healResult.message || 'Heal failed', 'error');
                    }
                  } catch (err) {
                    console.error('[Battle Modal] Timed heal error:', err);
                    showNotification('Error using heal', 'error');
                  } finally {
                    // Re-enable; the server timer may disable it again on next refresh
                    timedHealBtn.disabled = false;
                  }
                });
              }
            }
          }
        } catch (error) {
          console.error('[Battle Modal] Failed to load player info:', error);
        }
      }, 100);
    }


    // Add loot preview if enabled
    if (extensionSettings.battleModal.showLootPreview) {
      html += `<div class="loot-preview-container" style="background: #181825; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
        <div class="loot-preview-grid forModal" id="loot-grid-modal-${monster.id}">
          <div class="loot-loading">Loading loot...</div>
        </div>
      </div>`;
      setTimeout(async () => {
        try {
          const response = await fetch(`battle.php?id=${monster.id}`);
          const htmlText = await response.text();
          const lootData = parseLootFromBattlePage(htmlText);
          displayLootPreview(`modal-${monster.id}`, lootData, { damageDone: monster.damageDone });
        } catch (error) {
          console.error('[Battle Modal] Failed to load loot preview:', error);
          const grid = document.getElementById(`loot-grid-modal-${monster.id}`);
          if (grid) grid.innerHTML = '<div class="loot-error">Failed to load loot</div>';
        }
      }, 100);
    }

    // Add leaderboard if present
    if (extensionSettings.battleModal.showLeaderboard && monster.leaderboard && monster.leaderboard.length > 0) {
      html += `<div style="background: #181825; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
        <h3 style="margin: 0 0 10px 0; color: #89b4fa; font-size: 14px;">Leaderboard</h3>
        <div style="max-height: 120px; overflow-y: auto;">
          ${monster.leaderboard.slice(0, 10).map((entry, i) => `
            <div style="display: flex; justify-content: space-between; padding: 6px; background: ${i % 2 === 0 ? '#11111b' : 'transparent'}; border-radius: 4px; font-size: 11px;">
              <span>${i + 1}. ${entry.USERNAME || entry.username || 'Player'}</span>
              <span style="color: #a6e3a1;">${entry.DAMAGE_DEALT || entry.damage || 0}</span>
            </div>
          `).join('')}
        </div>
      </div>`;
    }
    html += `</div>`;
    
    // Add attack logs if enabled
    if (extensionSettings.battleModal.showAttackLogs && monster.battleLog && monster.battleLog.length > 0) {
      html += `
        <div style="background: #181825; padding: ${compact ? '10px' : '15px'}; border-radius: 8px; margin-bottom: ${compact ? '10px' : '15px'}; max-height: ${compact ? '120px' : '200px'}; overflow-y: auto;">
          <div style="max-height: 120px; overflow-y: auto;">
          ${monster.battleLog.slice(0, 10).map((entry, i) => `
            <div style="display: flex; justify-content: space-between; padding: 6px; background: ${i % 2 === 0 ? '#11111b' : 'transparent'}; border-radius: 4px; font-size: 11px;">
              <span>${entry.USERNAME || entry.username || 'Player'}  --  ${entry.SKILL || entry.skill || 'Unknown Skill'}</span>
              <span style="color: #a6e3a1;">${entry.DAMAGE || entry.damage || 0}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    content.innerHTML = html;
    // Prevent clicks inside modal content from bubbling to modal background
    content.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    modal.appendChild(content);
    document.body.appendChild(modal);
    // Inject CSS for overlapping HP numbers in modal player info
    const styleId = 'modal-player-hp-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* Container for HP / MP bars inside modal */
        #modal-player-info .hp-bar { 
          position: relative; 
          height: 28px; 
          border-radius: 6px; 
          overflow: hidden;
          background: rgba(255,255,255,0.02);
        }

        /* Numeric HP overlay centered on the HP bar */
        #modal-player-info .hp-numbers-player.card-sub {
          position: absolute;
          left: 0; top: 0; width: 100%;
          text-align: center;
          z-index: 2;
          pointer-events: none;
          font-size: 14px;
          line-height: 28px;
          color: white;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        }

        /* HP fill (keeps existing appearance) */
        #modal-player-info .hp-fill.hp-fill--player {
          position: relative;
          z-index: 1;
          height: 28px;
        }

        /* Mana fill: blue gradient */
        #modal-player-info .hp-fill.mana-fill--player {
          position: relative;
          z-index: 1;
          height: 20px;
          background: linear-gradient(90deg, #4ea8ff 0%, #2b6df6 100%);
          border-radius: 6px;
        }

        /* Place the mana text visually on top of the mana bar by pulling it up
           (keeps DOM changes minimal). This targets the common modal mana text id. */
        #modal-player-info #pManaText {
          margin-top: -32px;
          position: relative;
          z-index: 2;
          text-align: center;
          color: #ffffff;
          pointer-events: none;
          font-size: 13px;
          line-height: 20px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
        }
      `;
      document.head.appendChild(style);
    }

    // Event listeners
    const closeBtn = modal.querySelector('#close-battle-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        modal.remove();
        setModalOpen(false);
        // Remove battle iframe when closing modal
        const iframe = document.getElementById('battle-session-iframe');
        if (iframe) iframe.remove();
        const backdrop = document.getElementById('battle-modal-backdrop');
        if (backdrop) backdrop.remove();
        updateWaveData(true);
      });
    }

    // Close on background click only if clicking the modal background
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
        setModalOpen(false);
        // Remove battle iframe when closing modal
        const iframe = document.getElementById('battle-session-iframe');
        if (iframe) iframe.remove();
        updateWaveData(true);
      }
    });
  }

  // Update join button text based on modal state
  function updateJoinButtonText(monsterId, newText) {
    const buttons = document.querySelectorAll(`button[data-monster-id="${monsterId}"]`);
    buttons.forEach(btn => {
      btn.textContent = newText;
    });
  }

  // Handle loot action
  async function handleLoot(monsterId, monsterName, btn) {
    try {
      btn.disabled = true;
      btn.textContent = 'Looting...';
      
      const result = await postAction('active_wave.php', {
        loot: monsterId
      });
      
      if (result.success) {
        showNotification(result.message || 'Loot collected!', 'success');
        
        if (extensionSettings.battleModal.showLootModal && result.loot) {
          showLootModal(result.loot, monsterName);
        }
        
        // Update user data
        if (result.gold !== undefined) userData.gold = result.gold;
        updateUserDataUI();
        
        // Refresh wave data
        updateWaveData(true);
      } else {
        showNotification(result.message || 'Failed to loot', 'error');
      }
      
      btn.textContent = 'Loot';
      btn.disabled = false;
    } catch (error) {
      console.error('Error looting:', error);
      showNotification('Error collecting loot', 'error');
      btn.textContent = 'Loot';
      btn.disabled = false;
    }
  }

  // Show loot modal
  function showLootModal(lootData, monsterName) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.8); z-index: 10000; display: flex;
      align-items: center; justify-content: center; backdrop-filter: blur(5px);
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: #1e1e2e; border-radius: 12px; padding: 30px;
      max-width: 500px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      color: #cdd6f4;
    `;
    
    content.innerHTML = `
      <h2 style="margin: 0 0 20px 0; color: #cba6f7;">Loot from ${monsterName}</h2>
      <div style="display: grid; gap: 12px;">
        ${lootData.map(item => `
          <div style="background: #181825; padding: 15px; border-radius: 8px; display: flex; align-items: center; gap: 12px;">
            ${item.img ? `<img src="${item.img}" style="width: 40px; height: 40px; border-radius: 4px;">` : ''}
            <div style="flex: 1;">
              <div style="font-weight: bold; color: #a6e3a1;">${item.name}</div>
              ${item.quantity ? `<div style="font-size: 12px; color: #a6adc8;">Quantity: ${item.quantity}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      <button id="close-loot-modal" style="
        background: #89b4fa; color: #1e1e2e; border: none;
        padding: 12px 24px; border-radius: 6px; cursor: pointer;
        font-weight: bold; margin-top: 20px; width: 100%;
      ">Close</button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    document.getElementById('close-loot-modal').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  // Wave data update function
  async function updateWaveData(manual = false) {
    // Defensive defaults: saved settings may be missing nested objects
    if (typeof extensionSettings === 'undefined' || !extensionSettings) extensionSettings = {};

    if (!manual) return;
    
    try {
      const html = await fetchWavePageHtml();
      const monsters = await extractMonsters(html);
      const userDataExtracted = extractUserData(html);
      // Update monster list
      if (monsters && monsters.length > 0) {
        monsterList = monsters;
      }
      // Update user data
      if (userDataExtracted) {
        updateUserDataUI();
      }
    } catch (error) {
      console.error('Error updating wave data:', error);
    }
  }

  // Find monster by ID from current page data
  function findMonsterById(monsterId) {
    // First, try to find a card with data-monster-id attribute
    let card = document.querySelector(`[data-monster-id='${monsterId}']`);
    if (card) {
      // If the element is a button or link, get its parent card
      if (card.classList.contains('join-btn') || card.tagName === 'A') {
        // Traverse up to find the card container
        let parent = card.closest('.monster-card, .wave-monster, .battle-card');
        if (parent) return parent;
      } else {
        // If it's already a card
        return card;
      }
    }
    // Fallback to previous logic
    const monsterCards = document.querySelectorAll('.monster-card, .wave-monster, .battle-card');
    for (const card of monsterCards) {
      const joinBtn = card.querySelector('a[href*="battle.php"], button[onclick*="battle"]');
      if (joinBtn) {
        const href = joinBtn.getAttribute('href') || joinBtn.getAttribute('onclick') || '';
        const idMatch = href.match(/id=(\d+)/);
        if (idMatch && idMatch[1] === String(monsterId)) {
          return card;
        }
      }
    }
    return null;
  }

  // ===== Monster list + parsing/rendering helpers =====
  // Global in-memory monster list used by updateData and UI rendering
  var monsterList = [];

  // Parse monsters from a provided Document (or current document)
  async function extractMonsters(htmlOrDoc = document) {
    const doc = typeof htmlOrDoc === 'string' 
      ? parseHTML(htmlOrDoc)
      : htmlOrDoc;
    
    const monsters = [];
    const monsterCards = doc.querySelectorAll('.monster-card, .wave-monster, .battle-card');
    
    monsterCards.forEach(card => {
      const nameElem = card.querySelector('.monster-name, h3, h2');
      const name = nameElem ? nameElem.textContent.trim() : 'Unknown';
      
      const hpElem = card.querySelector('.monster-hp, .hp-bar, .hp-text');
      const hpText = hpElem ? hpElem.textContent : '';
      const hpMatch = hpText.match(/(\d+)\s*\/\s*(\d+)/);
      const currentHp = hpMatch ? parseInt(hpMatch[1]) : 0;
      const maxHp = hpMatch ? parseInt(hpMatch[2]) : 0;
      
      const joinBtn = card.querySelector('a[href*="battle.php"], button[onclick*="battle"]');
      const href = joinBtn ? (joinBtn.getAttribute('href') || joinBtn.getAttribute('onclick') || '') : '';
      const idMatch = href.match(/id=(\d+)/);
      const id = idMatch ? idMatch[1] : null;
      
      if (id) {
        monsters.push({
          id,
          name,
          currentHp,
          maxHp,
          element: card
        });
      }
    });
    
    return monsters;
  }

  // Extract basic user data (stamina/exp/gold) from a Document
  function extractUserData(htmlOrDoc = document) {
    const doc = typeof htmlOrDoc === 'string'
      ? parseHTML(htmlOrDoc)
      : htmlOrDoc;
    
    const data = {};
    
    const staminaElem = doc.querySelector('.sidebar-stamina, .stamina-value, [class*="stamina"]');
    if (staminaElem) {
      const staminaMatch = staminaElem.textContent.match(/(\d+)/);
      if (staminaMatch) data.stamina = parseInt (staminaMatch[1]);
    }
    
    const expElem = doc.querySelector('.sidebar-exp, .exp-value, [class*="exp"]');
    if (expElem) {
      const expMatch = expElem.textContent.match(/(\d+)/);
      if (expMatch) data.exp = parseInt(expMatch[1]);
    }
    
    const goldElem = doc.querySelector('.sidebar-gold, .gold-value, [class*="gold"]');
    if (goldElem) {
      const goldMatch = goldElem.textContent.match(/(\d+)/);
      if (goldMatch) data.gold = parseInt(goldMatch[1]);
    }
    
    return data;
  }

  // ===== Update Data ====
  // Periodically update all monster cards and detect new cards
  const updateData = async (manual = false) => {
    await updateWaveData(manual);
    // Extract monsters from the current DOM
    const monsters = await extractMonsters(document);
    let updated = false;
    monsters.forEach(monster => {
      const existing = monsterList.find(m => m.id == monster.id);
      if (!existing) {
        monsterList.push(monster);
        updated = true;
      } else {
        // Update HP and other info if changed
        if (existing.currentHp !== monster.currentHp || existing.maxHp !== monster.maxHp) {
          existing.currentHp = monster.currentHp;
          existing.maxHp = monster.maxHp;
          updated = true;
          console.log(`[updateData] Monster card updated: ${monster.id} (${monster.monsterName}) HP: ${monster.currentHp} / ${monster.maxHp}`);
        }
      }
    });
  };

  // Set up periodic refresh every 5 seconds, pausing when tab is hidden
  let updateDataRunning = false;
  const tickUpdate = async () => {
    if (updateDataRunning) return;
    if (document.hidden) return;
    updateDataRunning = true;
    try { await updateData(); } finally { updateDataRunning = false; }
  };
  const updateTimer = setInterval(tickUpdate, 5000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // Kick an immediate refresh on return to tab
      tickUpdate();
    }
  });

  // ===== END BATTLE MODAL SYSTEM =====

  // Initialize battle modal on battle.php page
  function initBattlePageModal() {
    // Prevent modal on actual battle.php page
    if (window.location.pathname.includes('battle.php')) {
      return;
    }
    // ...existing code...
  }

  function saveSettings() {
    try {
      // Ensure required objects exist before saving
      if (!extensionSettings.monsterBackgrounds) {
        extensionSettings.monsterBackgrounds = {
          enabled: false,
          effect: 'normal',
          overlay: true,
          overlayOpacity: 0.4,
          monsters: {}
        };
      }
      if (!extensionSettings.monsterBackgrounds.monsters) {
        extensionSettings.monsterBackgrounds.monsters = {};
      }
        
        // Ensure customBackgrounds object exists
        if (!extensionSettings.customBackgrounds) {
          extensionSettings.customBackgrounds = {
            enabled: true,
            backgrounds: {}
          };
        }
        if (!extensionSettings.customBackgrounds.backgrounds) {
          extensionSettings.customBackgrounds.backgrounds = {};
      }

      // Deep clone settings to ensure all nested objects are properly saved
      const settingsToSave = JSON.parse(JSON.stringify({
        ...extensionSettings,
        monsterBackgrounds: {
          ...extensionSettings.monsterBackgrounds,
          monsters: { ...extensionSettings.monsterBackgrounds.monsters }
          },
          customBackgrounds: {
            ...extensionSettings.customBackgrounds,
            backgrounds: { ...extensionSettings.customBackgrounds.backgrounds }
        }
      }));
      
      localStorage.setItem('demonGameExtensionSettings', JSON.stringify(settingsToSave));
      console.log('Settings saved successfully:', {
        monsterCount: Object.keys(extensionSettings.monsterBackgrounds.monsters).length,
        monsters: extensionSettings.monsterBackgrounds.monsters
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification('Error saving settings: ' + error.message, 'error');
    }
  }


    function applyBackgroundToPanels(panels, bgConfig) {
      panels.forEach(panel => {
        // Skip if background already applied
        if (panel.getAttribute('data-bg-applied') === 'true') {
      return;
    }

        // Make sure panel has relative positioning
        panel.style.position = 'relative';
        panel.style.overflow = 'hidden';
        
        // Apply background directly
        panel.style.backgroundImage = `url(${bgConfig.url})`;
        panel.style.backgroundSize = 'cover';
        panel.style.backgroundPosition = 'center';
        panel.style.backgroundRepeat = 'no-repeat';

        // Remove any existing overlay
        const existingOverlay = panel.querySelector('.bg-overlay');
        if (existingOverlay) existingOverlay.remove();

        // Create new overlay
        const overlay = document.createElement('div');
        overlay.className = 'bg-overlay';
        
        // Apply effect-specific styles
        switch (bgConfig.effect) {
          case 'blur':
            overlay.style.cssText = `
              position: absolute;
              top: -10px;
              left: -10px;
              right: -10px;
              bottom: -10px;
              background-image: inherit;
              background-size: inherit;
              background-position: inherit;
              filter: blur(3px);
              z-index: 0;
            `;
            break;
            
          case 'gradient':
            overlay.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.3));
              z-index: 0;
            `;
            break;
            
          case 'pattern':
            overlay.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-image: repeating-linear-gradient(
                45deg,
                rgba(0, 0, 0, 0.1),
                rgba(0, 0, 0, 0.1) 10px,
                rgba(0, 0, 0, 0.2) 10px,
                rgba(0, 0, 0, 0.2) 20px
              );
              z-index: 0;
            `;
            break;
            
          default: // normal
            overlay.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.4);
              z-index: 0;
            `;
        }

        // Add overlay to panel
        panel.appendChild(overlay);

        // Ensure panel content is above overlay
        Array.from(panel.children).forEach(child => {
          if (!child.classList.contains('bg-overlay')) {
            child.style.position = 'relative';
            child.style.zIndex = '1';
          }
        });
        
        // Mark panel as having background applied
        panel.setAttribute('data-bg-applied', 'true');
        });
    }

    function applyCustomBackgrounds() {
      if (!extensionSettings.customBackgrounds?.enabled) {
        document.documentElement.style.setProperty('--page-bg-image', 'none');
        // Remove any existing background from body
        document.body.style.backgroundImage = '';
        document.body.style.backgroundSize = '';
        document.body.style.backgroundPosition = '';
        document.body.style.backgroundRepeat = '';
        document.body.style.backgroundAttachment = '';
        document.body.style.filter = '';
        return;
      }

      const currentPage = window.location.pathname;
      const customBg = extensionSettings.customBackgrounds.backgrounds[currentPage];
      
      if (customBg) {
        // Handle both old format (string) and new format (object with url and effect)
        const url = typeof customBg === 'string' ? customBg : customBg.url;
        const effect = typeof customBg === 'string' ? 'normal' : customBg.effect;
        
        let filterCSS = '';
        let backgroundImage = `url('${url}')`;
        
        // Apply effects
        switch (effect) {
          case 'gradient':
            backgroundImage = `linear-gradient(rgba(74, 0, 224, 0.3), rgba(142, 45, 226, 0.3)), url('${url}')`;
            break;
          case 'blur':
            filterCSS = 'blur(2px)';
            break;
          case 'pattern':
            backgroundImage = `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 2px,
                rgba(74, 0, 224, 0.1) 2px,
                rgba(74, 0, 224, 0.1) 4px
              ),
              url('${url}')
            `;
            break;
          default: // normal
            // No additional effects
            break;
        }
        
        document.documentElement.style.setProperty('--page-bg-image', backgroundImage);
        // Also apply directly to body to override inline styles
        document.body.style.backgroundImage = backgroundImage;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.filter = filterCSS;
      } else {
        document.documentElement.style.setProperty('--page-bg-image', 'none');
        // Remove any existing background from body
        document.body.style.backgroundImage = '';
        document.body.style.backgroundSize = '';
        document.body.style.backgroundPosition = '';
        document.body.style.backgroundRepeat = '';
        document.body.style.backgroundAttachment = '';
        document.body.style.filter = '';
      }
    }

  function applySettings() {
    const sidebar = document.querySelector('.side-drawer-inner')
    if (sidebar) {
      // Use CSSOM setProperty with priority so we can apply !important from JS
      try {
        sidebar.style.setProperty('background', extensionSettings.sidebarColor, 'important');
      } catch (e) {
        // Fallback to direct assignment if setProperty isn't available
        sidebar.style.background = extensionSettings.sidebarColor;
      }
    }
    try {
      document.body.style.setProperty('background-color', extensionSettings.backgroundColor, '');
    } catch (e) {
      document.body.style.backgroundColor = extensionSettings.backgroundColor;
    }
    
    // Apply color settings to CSS variables
    document.documentElement.style.setProperty('--monster-image-outline-color', extensionSettings.monsterImageOutlineColor);
    document.documentElement.style.setProperty('--loot-card-border-color', extensionSettings.lootCardBorderColor);
      
      // Apply background images
      // Apply menu customization (hide/reorder side drawer items)
      try { applyMenuCustomization(); } catch (e) { console.error('applyMenuCustomization error', e); }
      applyCustomBackgrounds();
  }

  // Function to update sidebar stats
  function updateSidebarStats(userStats) {
    // Update stats in the menu item
    const sidebarAttack = document.getElementById('sidebar-attack');
    const sidebarDefense = document.getElementById('sidebar-defense');
    const sidebarStamina = document.getElementById('sidebar-stamina');
    const sidebarPoints = document.getElementById('sidebar-points');

    // Allocation section elements
    const sidebarAttackAlloc = document.getElementById('sidebar-attack-alloc');
    const sidebarDefenseAlloc = document.getElementById('sidebar-defense-alloc');
    const sidebarStaminaAlloc = document.getElementById('sidebar-stamina-alloc');
    const sidebarPointsAlloc = document.getElementById('sidebar-points-alloc');

    // Update menu item stats
    if (sidebarAttack) sidebarAttack.textContent = userStats.ATTACK;
    if (sidebarDefense) sidebarDefense.textContent = userStats.DEFENSE;
    if (sidebarStamina) sidebarStamina.textContent = userStats.STAMINA;
    if (sidebarPoints) sidebarPoints.textContent = userStats.STAT_POINTS;

    // Update allocation section
    if (sidebarAttackAlloc) sidebarAttackAlloc.textContent = userStats.ATTACK;
    if (sidebarDefenseAlloc) sidebarDefenseAlloc.textContent = userStats.DEFENSE;
    if (sidebarStaminaAlloc) sidebarStaminaAlloc.textContent = userStats.STAMINA;
    if (sidebarPointsAlloc) sidebarPointsAlloc.textContent = userStats.STAT_POINTS;
  }

  // Function to fetch current stats and update sidebar
  async function fetchAndUpdateSidebarStats() {
    try {
      // Try to get stats from topbar first, then page elements, then make AJAX call
      let attack = '-', defense = '-', stamina = '-', points = '-';

      // Method 1: Try stats page elements (v-attack, etc.)
      attack = document.getElementById('v-attack')?.textContent || 
              document.querySelector('[data-stat="attack"]')?.textContent;
      defense = document.getElementById('v-defense')?.textContent || 
               document.querySelector('[data-stat="defense"]')?.textContent;
      stamina = document.getElementById('v-stamina')?.textContent || 
               document.querySelector('[data-stat="stamina"]')?.textContent;
      points = document.getElementById('v-points')?.textContent || 
              document.querySelector('[data-stat="points"]')?.textContent;

      // Method 2: Try topbar stamina (but we'll need AJAX for attack/defense/points)
      if (!stamina || stamina === '-') {
        const staminaSpan = document.getElementById('stamina_span');
        if (staminaSpan) {
          const staminaText = staminaSpan.textContent;
          const staminaMatch = staminaText.match(/(\d+)/);
          if (staminaMatch) {
            stamina = staminaMatch[1];
          }
        }
      }

      // Method 3: If we don't have attack/defense/points, try AJAX call with different approaches
      if ((!attack || attack === '-') || (!defense || defense === '-') || (!points || points === '-')) {
        try {
          // Try the allocate action first (it returns current stats)
          let response = await fetch('stats_ajax.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=get_stats'
          });
          
          if (!response.ok) {
            // Try alternative approach - allocate 0 points to get current stats
            response = await fetch('stats_ajax.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: 'action=allocate&stat=attack&amount=0'
            });
          }
          
          if (response.ok) {
            const text = await response.text();
            
            try {
              const data = JSON.parse(text);
              if (data && data.user) {
                attack = data.user.ATTACK || data.user.attack || attack || '-';
                defense = data.user.DEFENSE || data.user.defense || defense || '-';
                stamina = data.user.STAMINA || data.user.MAX_STAMINA || data.user.stamina || stamina || '-';
                points = data.user.STAT_POINTS || data.user.stat_points || points || '-';
              }
            } catch (parseError) {
              // Silent error handling
            }
          }
        } catch (ajaxError) {
          // Silent error handling
        }
      }

      updateSidebarStats({
        ATTACK: attack || '-',
        DEFENSE: defense || '-',
        STAMINA: stamina || '-',
        STAT_POINTS: points || '-'
      });
      
      // The mutation observer will handle stamina updates automatically
    } catch (error) {
      updateSidebarStats({
        ATTACK: '-',
        DEFENSE: '-',
        STAMINA: '-',
        STAT_POINTS: '-'
      });
    }
  }

  async function getProfileLink() {
    const profileHeader = document.querySelector('.small-user');
    if (!profileHeader) {
      return;
    }
    const pid = userId || getCookieExtension('demon');
    if (!pid) {
      return;
    }
    // Prevent duplicate listeners
    if (profileHeader.getAttribute('data-profile-link') === 'true') {
      return;
    }
    profileHeader.setAttribute('data-profile-link', 'true');
    profileHeader.style.cursor = 'pointer';
    profileHeader.addEventListener('mouseenter', () => {
      profileHeader.style.transform = 'scale(1.04)';
      profileHeader.style.background = 'rgba(137,180,250,0.08)';
    });
    profileHeader.addEventListener('mouseleave', () => {
      profileHeader.style.transform = 'scale(1)';
      profileHeader.style.background = '';
    });
    profileHeader.addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.href = `player.php?pid=${pid}`;
    });
  }


  // Apply menu customization to the actual side drawer DOM: hide or reorder items
  function applyMenuCustomization() {
    try {
      const sideNav = document.querySelector('.side-nav') || document.querySelector('#sideDrawer .side-nav');
      if (!sideNav) return;

      // Helper mapping from menu id to a href snippet we can match against existing anchors
      const idToHref = {
        home: 'game_dash.php',
        halloween_event: 'event_goblin_feast_of_shadows.php',
        pvp: 'pvp.php',
        inventory: 'inventory.php',
        pets: 'pets.php',
        stats: 'stats.php',
        guild: 'guild_dash.php',
        merchant: 'merchant.php',
        blacksmith: 'blacksmith.php',
        collections: 'collections.php',
        achievements: 'achievements.php',
        battle_pass: 'battle_pass.php',
        legendary_forge: 'legendary_forge.php',
        weekly_leaderboard: 'weekly.php',
        guide: 'guide.php',
        chat: 'chat.php'
      };

      // Collect existing anchors (wraps and direct anchors)
      const anchors = Array.from(sideNav.querySelectorAll('a.side-nav-item, .side-nav a, li.side-nav-item-wrap a'));

      // Build a map from id -> element (if we can match), and also collect unmatched anchors
      const matched = new Map();
      const unmatched = new Set(anchors);

      anchors.forEach(a => {
        const href = a.getAttribute('href') || '';
        const pathname = (() => {
          try { return new URL(href, location.origin).pathname.replace(/^\//, ''); } catch (e) { return href; }
        })();

        // Try to match by known hrefs
        for (const [id, snippet] of Object.entries(idToHref)) {
          if (pathname.includes(snippet) || href.includes(snippet)) {
            if (!matched.has(id)) {
              matched.set(id, a);
              unmatched.delete(a);
            }
            return;
          }
        }

        // Also try to match by visible label text -> lowercased
        const label = (a.querySelector('.side-label')?.textContent || a.textContent || '').trim().toLowerCase();
        for (const mi of extensionSettings.menuItems || []) {
          if (!matched.has(mi.id) && mi.name && label.includes(mi.name.toLowerCase())) {
            matched.set(mi.id, a);
            unmatched.delete(a);
            return;
          }
        }
      });

      // Reorder: iterate extensionSettings.menuItems sorted by order
      const sorted = [...(extensionSettings.menuItems || [])].sort((a,b) => (a.order||0)-(b.order||0));

      // We'll insert anchors inside sideNav in the desired order.
      // To avoid breaking existing structure, we operate on the sideNav element directly.
      sorted.forEach(item => {
        const el = matched.get(item.id);
        if (el) {
          if (!item.visible) {
            // hide element but preserve it in DOM
            el.style.display = 'none';
            // also hide follow-up expandable panel if present
            const next = el.parentElement && el.parentElement.nextElementSibling;
            if (next && (next.classList.contains('stats-expand-panel') || next.classList.contains('battlepass-expand-panel') || next.classList.contains('battle-pass-section') || next.className.includes('expand-panel') || next.classList.contains('sidebar-submenu') || next.classList.contains('stats-expand-panel'))) {
              next.style.display = 'none';
            }
          } else {
            // ensure visible
            el.style.display = '';
            // move into correct position - append to container in order
            // We prefer placing inside a wrapper <li> if present
            const li = el.closest('.side-nav-item-wrap') || el.closest('li') || el;
            // Append or move the item (and its following panel if any)
            if (li && li.parentNode === sideNav) {
              sideNav.appendChild(li);
              // move panel if present (next sibling)
              const panel = li.nextElementSibling;
              if (panel && (panel.classList.contains('stats-expand-panel') || panel.classList.contains('battlepass-expand-panel') || panel.classList.contains('battlepass-expand-panel') || panel.classList.contains('sidebar-submenu') || panel.className.includes('expand-panel'))) {
                sideNav.appendChild(panel);
              }
            } else if (el.parentNode === sideNav) {
              sideNav.appendChild(el);
              const panel = el.nextElementSibling;
              if (panel && (panel.classList.contains('stats-expand-panel') || panel.classList.contains('battlepass-expand-panel') || panel.classList.contains('sidebar-submenu') || panel.className.includes('expand-panel'))) {
                sideNav.appendChild(panel);
              }
            } else {
              // If the anchor is nested inside LI, move the LI; otherwise append the anchor itself
              if (li) sideNav.appendChild(li);
              else sideNav.appendChild(el);
            }
          }
        } else {
          // Not found in DOM. If visible and known href, create a simple anchor element and append.
          if (item.visible && idToHref[item.id]) {
            try {
              const wrap = document.createElement('li');
              wrap.className = 'side-nav-item-wrap';
              const a = document.createElement('a');
              a.className = 'side-nav-item';
              a.setAttribute('href', idToHref[item.id]);
              a.setAttribute('draggable', 'false');
              const icon = document.createElement('span'); icon.className = 'side-icon'; icon.textContent = '•';
              const lbl = document.createElement('span'); lbl.className = 'side-label'; lbl.textContent = item.name || item.id;
              a.appendChild(icon); a.appendChild(lbl); wrap.appendChild(a); sideNav.appendChild(wrap);
            } catch (e) { /* ignore creation errors */ }
          }
        }
      });
    } catch (err) {
      console.error('applyMenuCustomization failed', err);
    }
  }

  // Fetch open gates from the dashboard (either from current DOM if on game_dash.php,
  // or by fetching the dashboard HTML). Returns array of { href, name }.
  async function fetchOpenGatesFromDash() {
    try {
      let doc = null;
      if (window.location.pathname && window.location.pathname.includes('gates.php')) {
        doc = document;
      } else {
        const res = await fetch('gates.php');
        const text = await res.text();
        const parser = new DOMParser();
        doc = parser.parseFromString(text, 'text/html');
      }

      if (!doc) return [];
      // New gate card structure: <a class="gate-card" ...>
      const gateCards = Array.from(doc.querySelectorAll('a.gate-card'));
      const gates = gateCards.map(card => {
        const href = card.getAttribute('href') || '';
        // Try to get gate name from .title inside .body
        let name = '';
        const titleElem = card.querySelector('.body .title');
        if (titleElem) {
          name = titleElem.textContent.trim();
        } else {
          // Fallback to aria-label or alt attribute
          name = card.getAttribute('aria-label') || '';
          if (!name) {
            const img = card.querySelector('img');
            name = img ? img.getAttribute('alt') || '' : '';
          }
        }
        // Optionally extract status (ACTIVE, etc.)
        let status = '';
        const badge = card.querySelector('.badge');
        if (badge) status = badge.textContent.trim();
        return { href, name, status };
      });
      return gates;
    } catch (err) {
      console.error('Error fetching open gates from dashboard:', err);
      return [];
    }
  }

  // Fetch and parse the list of waves available for a specific gate page URL
  async function fetchGateWavesFromUrl(href) {
    try {
      const url = href.startsWith('http') ? href : (href.startsWith('/') ? href : `/${href}`);
      const res = await fetch(url);
      const text = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');

      const chips = Array.from(doc.querySelectorAll('.waves-nav a.wave-chip'));
      if (!chips.length) return null;

      const waves = chips.map((a, idx) => {
        const href = a.getAttribute('href') || '';
        const params = new URLSearchParams(href.split('?')[1] || '');
        const waveParam = Number(params.get('wave')) || null;
        const gateParam = Number(params.get('gate')) || null;
        const label = (a.textContent || '').trim() || `Wave ${idx + 1}`;
        return { gate: gateParam, wave: waveParam, label };
      }).filter(w => w.wave);

      const gateId = waves.find(w => w.gate)?.gate || null;
      return { gateId, waves };
    } catch (e) {
      console.warn('fetchGateWavesFromUrl failed for', href, e);
      return null;
    }
  }

  // Fetch open gates and for each, fetch its available waves
  async function fetchGatesWithWaves() {
    const gates = await fetchOpenGatesFromDash();
    const results = await Promise.all(gates.map(async g => {
      const data = await fetchGateWavesFromUrl(g.href);
      if (data && data.gateId && data.waves?.length) {
        return { name: g.name || `Gate ${data.gateId}`, gateId: data.gateId, waves: data.waves };
      }
      return null;
    }));
    return results.filter(Boolean);
  }

  // Update all native side drawer Gate links to use their selected waves
  function updateSideNavWaveLinks() {
    try {
      // Ensure map exists
      extensionSettings.waveSelections = extensionSettings.waveSelections || {};
      const sidebarContent = document.querySelector('#sideDrawer .side-nav') || document.querySelector('.side-nav');
      if (!sidebarContent) return;

      const anchors = Array.from(sidebarContent.querySelectorAll('a.side-nav-item, .side-nav a'));
      anchors.forEach(a => {
        const href = a.getAttribute('href') || '';
        // Only adjust links that go to active_wave with a gate param
        const gateMatch = href.match(/[?&]gate=(\d+)/);
        if (!/active_wave\.php/i.test(href) || !gateMatch) return;
        const gId = Number(gateMatch[1]);
        const waveMap = extensionSettings.waveSelections || {};
        const selectedWave = Number(waveMap[gId]) || null;
        if (!selectedWave) return; // no customized wave for this gate
        const newHref = href.replace(/([?&]wave=)(\d+)/, `$1${selectedWave}`);
        a.setAttribute('href', newHref);
      });
    } catch (e) {
      console.warn('updateSideNavWaveLinks failed:', e);
    }
  }

  function updateGameSideDrawer() {
    const sidebar = document.getElementById('sideDrawer');
    if (!sidebar) return;

    // Ensure the side drawer is opened by default
    try { sidebar.setAttribute('data-open', 'true'); } catch (e) { /* ignore if not possible */ }

    sidebar.style.marginTop = '66px';
    sidebar.style.maxHeight = 'calc(100% - 66px)';
    sidebar.style.width = '250px';
    

    // Wire the floating nav FAB to toggle the side drawer data-open attribute
    try {
      const navFab = document.getElementById('nav_fab');
      const sideDrawer = document.getElementById('sideDrawer');
      if (navFab && sideDrawer) {
        // Initialize aria-pressed to reflect current state
        const initialOpen = sideDrawer.getAttribute('data-open') === 'true';
        navFab.setAttribute('aria-pressed', initialOpen ? 'true' : 'false');

        (function(){
          try {
            const overlay = document.createElement('div');
            overlay.className = 'uiaddon-navfab-overlay';
            overlay.style.position = 'fixed';
            overlay.style.background = 'transparent';
            overlay.style.zIndex = '2147483647';
            overlay.style.pointerEvents = 'none';
            overlay.style.transition = 'none';
            overlay.style.border = '0';
            overlay.style.padding = '0';
            overlay.style.margin = '0';
            document.body.appendChild(overlay);

            const update = () => {
              try {
                const rect = navFab.getBoundingClientRect();
                overlay.style.left = rect.left + 'px';
                overlay.style.top = rect.top + 'px';
                overlay.style.width = rect.width + 'px';
                overlay.style.height = rect.height + 'px';
                // Only capture pointer events when the drawer is open.
                const isOpen = sideDrawer.getAttribute('data-open') === 'true';
                overlay.style.pointerEvents = isOpen ? 'auto' : 'none';
                overlay.style.cursor = window.getComputedStyle(navFab).cursor || 'pointer';
              } catch(e) { /* ignore */ }
            };

            // Keep overlay positioned on scroll/resize
            window.addEventListener('resize', update);
            window.addEventListener('scroll', update, true);

            // Also observe changes to sideDrawer attributes (data-open)
            try {
              const mo = new MutationObserver((mutations) => update());
              mo.observe(sideDrawer, { attributes: true, attributeFilter: ['data-open'] });
            } catch(e) { /* ignore */ }

            // When overlay is clicked (i.e., drawer is open), prevent the
            // page's earlier handlers from executing and perform the close
            // action locally by toggling the data-open attribute.
            overlay.addEventListener('click', (ev) => {
              try {
                ev.stopPropagation();
                ev.preventDefault();
                const isOpen = sideDrawer.getAttribute('data-open') === 'true';
                if (isOpen) {
                  // Close the drawer. We update the attribute and aria state.
                  sideDrawer.setAttribute('data-open', 'false');
                  navFab.setAttribute('aria-pressed', 'false');
                  // Notify any listeners on the drawer of a change (best-effort).
                  try { sideDrawer.dispatchEvent(new Event('uiaddon:drawerClosed')); } catch(e){}
                }
              } catch(err) {
                console.error('Error handling nav_fab overlay click:', err);
              }
            });

            // Initial placement
            update();

            // If navFab moves in the DOM or is re-rendered, try to reattach/update
            const bodyMo = new MutationObserver(() => {
              if (!document.body.contains(navFab)) return;
              update();
            });
            bodyMo.observe(document.body, { childList: true, subtree: true });
          } catch(e) { console.error('Failed to create nav_fab overlay:', e); }
        })();
      }
    } catch (err) {
      console.error('Error wiring nav_fab toggle:', err);
    }

    

    // Safely find and remove the side overlay if present. Avoid calling
    // getElementById on the element (not a function) and use removeChild/remove.
    const sideOverlay = sidebar.querySelector('#sideOverlay') || document.getElementById('sideOverlay');
    if (sideOverlay) {
      try {
        if (sideOverlay.parentNode) sideOverlay.parentNode.removeChild(sideOverlay);
        else if (typeof sideOverlay.remove === 'function') sideOverlay.remove();
      } catch (e) {
        // Non-fatal — log for debugging
        console.warn('Failed to remove sideOverlay:', e);
      }
    }

    const sidebarInner = document.querySelector('.side-drawer-inner');
    if (sidebarInner) {
      sidebarInner.style.width = '250px';
      sidebarInner.style.backgroundColor = extensionSettings.sidebarColor;
    }

    const sideHeader = document.querySelector('.side-head');
    if (sideHeader) {
      const sideHeaderTitle = sideHeader.querySelector('.side-title');
      if (sideHeaderTitle) {
        sideHeaderTitle.parentNode.removeChild(sideHeaderTitle);
      }
    }

    // Inject EXP potion into battle drawer (if both exist)
    injectExpPotionIntoBattleDrawer();
    console.log('Battle drawer updated');

    if (sidebar) {
      const sidebarContent = sidebar.querySelector('.side-nav');
      if (sidebarContent) {
        try {
          // Dynamically inject Open Gates (each as its own button) into the side-nav
          try {
            fetchGatesWithWaves().then(gates => {
              if (!gates || !gates.length) return;
              const nav = sidebarContent;
              const urlParams = new URLSearchParams(window.location.search);
              const currentGate = urlParams.get('gate');
              // Ensure per-gate selection map exists
              extensionSettings.waveSelections = extensionSettings.waveSelections || {};

              gates.forEach(g => {
                try {
                  // Determine selected wave for this gate
                  const selWave = Number(extensionSettings.waveSelections[g.gateId] || (g.waves?.[0]?.wave) || 1);
                  const href = `active_wave.php?gate=${g.gateId}&wave=${selWave}`;
                  // Avoid duplicates by gate id in href
                  if (nav.querySelector(`a.side-nav-item[href*="gate=${g.gateId}"]`)) return;

                  const li = document.createElement('li');
                  li.className = 'side-nav-item-wrap';
                  const ael = document.createElement('a');
                  if (currentGate && String(g.gateId) === String(currentGate)) {
                    ael.className = 'side-nav-item active';
                  } else {
                    ael.className = 'side-nav-item';
                  }
                  ael.setAttribute('href', href);
                  const icon = document.createElement('span');
                  icon.textContent = '🌊';
                  icon.classList.add('side-icon');
                  const navName = document.createElement('span');
                  navName.classList.add('side-label');
                  navName.textContent = g.name || `Gate ${g.gateId}`;
                  ael.appendChild(icon);
                  ael.appendChild(navName);
                  li.appendChild(ael);
                  nav.appendChild(li);
                } catch (e) {
                  console.error('Error inserting gate into sidebar:', e);
                }
              });
            }).catch(err => console.error('Error fetching open gates for sidebar:', err));
          } catch (err) {
            console.error('Error scheduling open gates injection:', err);
          }
          // Add leaderboard link
          if (!sidebarContent.querySelector('a.side-nav-item[href="weekly.php"]')) {
            const li = document.createElement('li');
            li.className = 'side-nav-item-wrap';
            const ael = document.createElement('a');
            const current = window.location.pathname;
            if (current.endsWith('/weekly.php' ) || current === '/weekly.php') {
              ael.className = 'side-nav-item active';
            } else {
              ael.className = 'side-nav-item';
            }
            ael.setAttribute('href', 'weekly.php');
            const icon = document.createElement('span');
            icon.textContent = '📋';
            icon.classList.add('side-icon');
            const navName = document.createElement('span');
            navName.classList.add('side-label');
            navName.textContent = 'Weekly Leaderboard';
            ael.appendChild(icon);
            ael.appendChild(navName);
            li.appendChild(ael);
            sidebarContent.appendChild(li);
          }
          // Loop over every side-nav-item link and inspect its href
          const items = Array.from(sidebarContent.querySelectorAll('a.side-nav-item, .side-nav a'));
          items.forEach(a => {
            const rawHref = a.getAttribute('href') || '';
            let pathname = rawHref;
            try {
              // Normalize to pathname (handles absolute or relative URLs)
              pathname = new URL(rawHref, location.origin).pathname;
            } catch (e) {
              // keep rawHref if URL parsing fails
              pathname = rawHref;
            }

            if (pathname.endsWith('/pets.php') || pathname === 'pets.php') {
              try {
                // Don't add multiple toggles
                if (a.dataset.petsEnhanced) return;
                a.dataset.petsEnhanced = 'true';
                // Create toggle button (will sit to the right of the anchor)
                const toggle = document.createElement('button');
                toggle.className = 'pets-toggle-btn';
                toggle.type = 'button';
                toggle.setAttribute('aria-expanded', extensionSettings.petsExpanded ? 'true' : 'false');
                toggle.textContent = extensionSettings.petsExpanded ? '−' : '+';
                toggle.style.cssText = 'margin-left:8px; background:transparent; border:1px solid rgba(255,255,255,0.06); color:#89b4fa; padding:2px 6px; border-radius:4px; cursor:pointer; font-weight:700;';

                // Create expand panel (hidden by default) that will be inserted right after the anchor wrapper
                const panel = document.createElement('div');
                panel.className = 'pets-expand-panel';
                panel.style.cssText = 'display:' + (extensionSettings.petsExpanded ? 'block' : 'none') + '; padding:8px; margin-top:8px; margin-bottom:8px; background:rgba(20,20,26,0.6); border-radius:6px; border:1px solid rgba(69,71,90,0.4);';
                // Place the toggle inside the <a> so it appears on the right-hand side of the pets item
                try {
                  // Make the anchor a flex container so the label stays left and the toggle sits right
                  a.classList.add('sidebar-menu-expandable');
                  a.style.display = a.style.display || 'flex';
                  a.style.alignItems = a.style.alignItems || 'center';
                  a.style.justifyContent = a.style.justifyContent || 'space-between';
                  // Create a non-navigable control area inside the anchor and put the toggle there
                  const controlArea = document.createElement('div');
                  controlArea.className = 'side-control';
                  controlArea.style.cssText = 'margin-left:8px; display:flex; align-items:center; gap:6px;';
                  // Prevent clicks in the control area from triggering anchor navigation
                  controlArea.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); });
                  controlArea.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') { ev.preventDefault(); ev.stopPropagation(); } });
                  controlArea.appendChild(toggle);
                  a.appendChild(controlArea);
                  // Insert the panel directly after the anchor so it expands downward under the pets item
                  const parent = a.parentNode;
                  if (parent) parent.insertBefore(panel, a.nextSibling);
                } catch (e) {
                  // Fallback: append toggle after anchor
                  a.parentNode.insertBefore(toggle, a.nextSibling);
                  a.parentNode.insertBefore(panel, toggle.nextSibling);
                }
                // Helper to fill the Pets expandable panel with Pet Teams controls
                const populatePetsPanel = () => {
                  if (panel.dataset.inited === '1') return;
                  panel.dataset.inited = '1';
                  const teams = (function(){
                    try { return JSON.parse(localStorage.getItem(PET_STORAGE_KEY) || '{}'); } catch { return {}; }
                  })();
                  const names = Object.keys(teams);
                  if (!names.length) {
                    panel.innerHTML = '<div style="color:#a6adc8; padding:8px;">No pet teams saved yet. Open Pets to create one.</div>';
                    return;
                  }
                  const list = names.map(n => {
                    const team = teams[n] || {};
                    const entries = Object.values(team).sort((a,b) => (a.slot||0) - (b.slot||0));
                    const count = entries.length;
                    const thumbs = entries.slice(0,6).map(p => `<img src="${p.image||''}" title="${p.name||''}" style="width:22px;height:22px;border-radius:3px;border:1px solid #45475a;margin-right:3px;object-fit:cover;"/>`).join('');
                    return `
                      <div style="background:#181825; border-radius:8px; padding:12px; border:1px solid #313244; margin-bottom:8px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                          <div>
                            <div style="font-weight:700; color:#b2cdee;">${n}</div>
                            <div class="pet-team-preview" style="margin:6px 0;">${thumbs}${count>6?`<span style=\"color:#6c7086;font-size:12px;\">+${count-6} more</span>`:''}</div>
                            <div style="font-size:12px; color:#a6adc8;">${count} pet(s)</div>
                          </div>
                          <div style="display:flex; gap:6px;">
                            <button data-pt-action="apply" data-team="${n}" style="background:#a6e3a1;color:#1e1e2e;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;font-weight:700;font-size:12px;">Apply</button>
                          </div>
                        </div>
                      </div>`;
                  }).join('');
                  panel.innerHTML = list;
                  panel.querySelectorAll('button[data-pt-action]').forEach(btn => {
                    btn.addEventListener('click', (ev) => {
                      ev.preventDefault(); ev.stopPropagation();
                      const action = btn.getAttribute('data-pt-action');
                      const team = btn.getAttribute('data-team');
                      if (!team) return;
                      if (action === 'apply') {
                        try { applyPetTeam(team); } catch (e) { console.error('Apply pet team failed:', e); }
                      }
                    });
                  });
                };
                // Toggle interaction
                toggle.addEventListener('click', (ev) => {
                  ev.preventDefault(); ev.stopPropagation();
                  const isOpen = panel.style.display !== 'none';
                  if (isOpen) {
                    panel.style.display = 'none';
                    toggle.textContent = '+';
                    toggle.setAttribute('aria-expanded', 'false');
                    try { extensionSettings.petsExpanded = false; saveSettings(); } catch {}
                  } else {
                    panel.style.display = 'block';
                    toggle.textContent = '−';
                    toggle.setAttribute('aria-expanded', 'true');
                    populatePetsPanel();
                    try { extensionSettings.petsExpanded = true; saveSettings(); } catch {}
                  }
                });
                // If initially expanded, populate immediately
                if (extensionSettings.petsExpanded) {
                  populatePetsPanel();
                }
                
              } catch (e) { /* pets expand outer try */ }
            } else if (pathname.endsWith('/inventory.php') || pathname === 'inventory.php') {
              try {
                if (!extensionSettings.equipSets?.showInSidebar) return;
                if (a.dataset.invEnhanced) return;
                a.dataset.invEnhanced = 'true';
                const toggle = document.createElement('button');
                toggle.className = 'inv-toggle-btn';
                toggle.type = 'button';
                toggle.setAttribute('aria-expanded', extensionSettings.inventoryExpanded ? 'true' : 'false');
                toggle.textContent = extensionSettings.inventoryExpanded ? '−' : '+';
                toggle.style.cssText = 'margin-left:8px; background:transparent; border:1px solid rgba(255,255,255,0.06); color:#89b4fa; padding:2px 6px; border-radius:4px; cursor:pointer; font-weight:700;';

                const panel = document.createElement('div');
                panel.className = 'inventory-expand-panel';
                panel.style.cssText = 'display:' + (extensionSettings.inventoryExpanded ? 'block' : 'none') + '; padding:8px; margin-top:8px; margin-bottom:8px; background:rgba(20,20,26,0.6); border-radius:6px; border:1px solid rgba(69,71,90,0.4);';
                try {
                  a.classList.add('sidebar-menu-expandable');
                  a.style.display = a.style.display || 'flex';
                  a.style.alignItems = a.style.alignItems || 'center';
                  a.style.justifyContent = a.style.justifyContent || 'space-between';
                  const controlArea = document.createElement('div');
                  controlArea.className = 'side-control';
                  controlArea.style.cssText = 'margin-left:8px; display:flex; align-items:center; gap:6px;';
                  controlArea.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); });
                  controlArea.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') { ev.preventDefault(); ev.stopPropagation(); } });
                  controlArea.appendChild(toggle);
                  a.appendChild(controlArea);
                  const parent = a.parentNode; if (parent) parent.insertBefore(panel, a.nextSibling);
                } catch (e) {
                  a.parentNode.insertBefore(toggle, a.nextSibling);
                  a.parentNode.insertBefore(panel, toggle.nextSibling);
                }

                const populateInvPanel = () => {
                  if (panel.dataset.inited === '1') return;
                  panel.dataset.inited = '1';
                  let sets = {};
                  try { sets = getEquipStorageSets(); } catch { try { sets = JSON.parse(localStorage.getItem(EQUIP_STORAGE_KEY)||'{}'); } catch { sets = {}; } }
                  const names = Object.keys(sets);
                  if (!names.length) {
                    panel.innerHTML = '<div style="color:#a6adc8; padding:8px;">No equipment sets yet. Open Inventory to create one.</div>';
                    return;
                  }
                  panel.innerHTML = names.map(n => {
                    const items = Object.values(sets[n]||{});
                    const count = items.length;
                    const thumbs = items.slice(0,8).map(it => `<img src="${it.img||''}" title="${it.name||''}" style="width:22px;height:22px;border-radius:3px;border:1px solid #45475a;margin-right:3px;"/>`).join('');
                    return `
                      <div style="background:#181825; border-radius:8px; padding:12px; border:1px solid #313244; margin-bottom:8px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                          <div>
                            <div style="font-weight:700; color:#b2cdee;">${n}</div>
                            <div class="equip-set-preview" style="display:flex; flex-wrap:wrap; margin:6px 0;">${thumbs}${count>8?`<span style=\"color:#6c7086;font-size:12px;\">+${count-8} more</span>`:''}</div>
                            <div style="font-size:12px; color:#6c7086;">${count} items</div>
                          </div>
                          <div style="display:flex; gap:6px;">
                            <button data-es-action="apply" data-set="${n}" style="background:#a6e3a1;color:#1e1e2e;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;font-weight:700;font-size:12px;">Apply</button>
                          </div>
                        </div>
                      </div>`;
                  }).join('');

                  panel.querySelectorAll('button[data-es-action]').forEach(btn => {
                    btn.addEventListener('click', (ev) => {
                      ev.preventDefault(); ev.stopPropagation();
                      const action = btn.getAttribute('data-es-action');
                      const name = btn.getAttribute('data-set');
                      if (!name) return;
                      if (action === 'apply') {
                        try { window.applyEquipSet(name); } catch (e) { console.error('Apply equip set failed:', e); }
                      }
                    });
                  });
                };

                toggle.addEventListener('click', (ev) => {
                  ev.preventDefault(); ev.stopPropagation();
                  const isOpen = panel.style.display !== 'none';
                  if (isOpen) {
                    panel.style.display = 'none';
                    toggle.textContent = '+';
                    toggle.setAttribute('aria-expanded', 'false');
                    try { extensionSettings.inventoryExpanded = false; saveSettings(); } catch {}
                  } else {
                    panel.style.display = 'block';
                    toggle.textContent = '−';
                    toggle.setAttribute('aria-expanded', 'true');
                    populateInvPanel();
                    try { extensionSettings.inventoryExpanded = true; saveSettings(); } catch {}
                  }
                });

                if (extensionSettings.inventoryExpanded) {
                  populateInvPanel();
                }

              } catch (e) { /* inventory expand outer try */ }
            } else if (pathname.endsWith('/stats.php') || pathname === 'stats.php') {
              try {
                // Don't add multiple toggles
                if (a.dataset.statsEnhanced) return;
                a.dataset.statsEnhanced = 'true';

                // Create toggle button (will sit to the right of the anchor)
                const toggle = document.createElement('button');
                toggle.className = 'stats-toggle-btn';
                toggle.type = 'button';
                toggle.setAttribute('aria-expanded', extensionSettings.statsExpanded ? 'true' : 'false');
                toggle.textContent = extensionSettings.statsExpanded ? '−' : '+';
                toggle.style.cssText = 'margin-left:8px; background:transparent; border:1px solid rgba(255,255,255,0.06); color:#89b4fa; padding:2px 6px; border-radius:4px; cursor:pointer; font-weight:700;';

                // Create expand panel (hidden by default) that will be inserted right after the anchor wrapper
                const panel = document.createElement('div');
                panel.className = 'stats-expand-panel';
                panel.style.cssText = 'display:' + (extensionSettings.statsExpanded ? 'block' : 'none') + '; padding:8px; margin-top:8px; margin-bottom:8px; background:rgba(20,20,26,0.6); border-radius:6px; border:1px solid rgba(69,71,90,0.4);';

                // Place the toggle inside the <a> so it appears on the right-hand side of the stats item
                try {
                  // Make the anchor a flex container so the label stays left and the toggle sits right
                  a.classList.add('sidebar-menu-expandable');
                  a.style.display = a.style.display || 'flex';
                  a.style.alignItems = a.style.alignItems || 'center';
                  a.style.justifyContent = a.style.justifyContent || 'space-between';

                  // Create a non-navigable control area inside the anchor and put the toggle there
                  const controlArea = document.createElement('div');
                  controlArea.className = 'side-control';
                  controlArea.style.cssText = 'margin-left:8px; display:flex; align-items:center; gap:6px;';
                  // Prevent clicks in the control area from triggering anchor navigation
                  controlArea.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); });
                  controlArea.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') { ev.preventDefault(); ev.stopPropagation(); } });
                  controlArea.appendChild(toggle);
                  a.appendChild(controlArea);

                  // Insert the panel directly after the anchor so it expands downward under the stats item
                  const parent = a.parentNode;
                  if (parent) parent.insertBefore(panel, a.nextSibling);
                } catch (e) {
                  // Fallback: append toggle after anchor
                  a.parentNode.insertBefore(toggle, a.nextSibling);
                  a.parentNode.insertBefore(panel, toggle.nextSibling);
                }

                // Track whether the panel content has been initialized for this DOM element
                let iframeLoaded = false;

                const populateStatsPanel = () => {
                  if (panel.dataset.inited) return;
                  panel.dataset.inited = '1';
                  panel.innerHTML = `
                          <div class="stats-allocation-section">
                            <div class="upgrade-section">
                              <div class="stat-upgrade-row" data-stat="attack">
                                <div class="stat-info">
                                  <span>⚔️</span>
                                  <span id="sidebar-attack-alloc">-</span>
                                </div>
                                <div class="upgrade-controls">
                                  <button class="upgrade-btn" data-amount="1" draggable="false">+1</button>
                                  <button class="upgrade-btn" data-amount="5" draggable="false">+5</button>
                                </div>
                              </div>
                              <div class="stat-upgrade-row" data-stat="defense">
                                <div class="stat-info">
                                  <span>🛡️</span>
                                  <span id="sidebar-defense-alloc">-</span>
                                </div>
                                <div class="upgrade-controls">
                                  <button class="upgrade-btn" data-amount="1" draggable="false">+1</button>
                                  <button class="upgrade-btn" data-amount="5" draggable="false">+5</button>
                                </div>
                              </div>
                              <div class="stat-upgrade-row" data-stat="stamina">
                                <div class="stat-info">
                                  <span>⚡</span>
                                  <span id="sidebar-stamina-alloc">-</span>
                                </div>
                                <div class="upgrade-controls">
                                  <button class="upgrade-btn" data-amount="1" draggable="false">+1</button>
                                  <button class="upgrade-btn" data-amount="5" draggable="false">+5</button>
                                </div>
                              </div>
                            </div>
                            <div style="text-align: center; margin-top: 8px; color: rgb(136, 136, 136);">
                              Points Available: <span id="sidebar-points-alloc">-</span>
                            </div>
                          </div>
                      `;

                  setTimeout(() => {
                    try {
                      fetchAndUpdateSidebarStats();
                      panel.querySelectorAll('.stat-upgrade-row').forEach(row => {
                        const stat = row.dataset.stat;
                        row.querySelectorAll('.upgrade-btn').forEach(btn => {
                          btn.addEventListener('click', async (ev) => {
                            ev.preventDefault(); ev.stopPropagation();
                            const amount = parseInt(btn.getAttribute('data-amount') || btn.textContent.replace(/[^0-9\-]/g, ''), 10) || 0;
                            if (!stat || !amount) return;
                            btn.disabled = true;
                            const res = await postAction('stats_ajax.php', { action: 'allocate', stat: stat, amount: amount });
                            if (res && res.success) {
                              showNotification(res.message || 'Allocated points', 'success');
                            } else {
                              showNotification(res.message || 'Allocation failed', 'error');
                            }
                            await fetchAndUpdateSidebarStats();
                            btn.disabled = false;
                          });
                        });
                      });
                    } catch (err) {
                      console.error('Error initializing stats panel:', err);
                    }
                  }, 50);

                  iframeLoaded = true;
                };
                // If the panel should be open on load, populate it now so the content isn't empty after reload
                if (extensionSettings.statsExpanded) {
                  try { populateStatsPanel(); } catch (e) { console.error('Error auto-populating stats panel on load', e); }
                }

                // Toggle handler (prevents anchor navigation when interacting with the toggle)
                const handleToggle = (e) => {
                  if (e) { e.preventDefault(); e.stopPropagation(); }
                  const expanded = toggle.getAttribute('aria-expanded') === 'true';
                  if (expanded) {
                    // collapse
                    panel.style.display = 'none';
                    toggle.setAttribute('aria-expanded', 'false');
                    toggle.textContent = '+';
                    extensionSettings.statsExpanded = false;
                    try { localStorage.setItem('demonGameExtensionSettings', JSON.stringify(extensionSettings)); } catch (err) {}
                  } else {
                    // expand
                    panel.style.display = 'block';
                    toggle.setAttribute('aria-expanded', 'true');
                    toggle.textContent = '−';
                    extensionSettings.statsExpanded = true;
                    try { localStorage.setItem('demonGameExtensionSettings', JSON.stringify(extensionSettings)); } catch (err) {}
                    if (!iframeLoaded) {
                      populateStatsPanel();
                    }
                  }
                };

                toggle.addEventListener('click', handleToggle);
                // Prevent Enter/Space from triggering the parent link navigation — handle keyboard activation
                toggle.addEventListener('keydown', (e) => {
                  if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggle(e);
                  }
                });
              } catch (e) {
                console.error('Error adding stats expand toggle:', e);
              }
            } else if (pathname.endsWith('/battle_pass.php') || pathname === 'battle_pass.php') {
              try {
                // Add expandable panel for Battle Pass (mirrors Stats expandable behavior)
                if (a.dataset.battlePassEnhanced) return;
                a.dataset.battlePassEnhanced = 'true';

                const toggle = document.createElement('button');
                toggle.className = 'battlepass-toggle-btn';
                toggle.type = 'button';
                toggle.setAttribute('aria-expanded', extensionSettings.battlePassExpanded ? 'true' : 'false');
                toggle.textContent = extensionSettings.battlePassExpanded ? '−' : '+';
                toggle.style.cssText = 'margin-left:8px; background:transparent; border:1px solid rgba(255,255,255,0.06); color:#89b4fa; padding:2px 6px; border-radius:4px; cursor:pointer; font-weight:700;';

                const panel = document.createElement('div');
                panel.className = 'battlepass-expand-panel';
                panel.style.cssText = 'display:' + (extensionSettings.battlePassExpanded ? 'block' : 'none') + '; padding:8px; margin-top:8px; margin-bottom:8px; background:rgba(20,20,26,0.6); border-radius:6px; border:1px solid rgba(69,71,90,0.4);';

                try {
                  a.classList.add('sidebar-menu-expandable');
                  a.style.display = a.style.display || 'flex';
                  a.style.alignItems = a.style.alignItems || 'center';
                  a.style.justifyContent = a.style.justifyContent || 'space-between';

                  const controlArea = document.createElement('div');
                  controlArea.className = 'side-control';
                  controlArea.style.cssText = 'margin-left:8px; display:flex; align-items:center; gap:6px;';
                  controlArea.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); });
                  controlArea.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') { ev.preventDefault(); ev.stopPropagation(); } });
                  controlArea.appendChild(toggle);
                  a.appendChild(controlArea);

                  const parent = a.parentNode;
                  if (parent) parent.insertBefore(panel, a.nextSibling);
                } catch (e) {
                  a.parentNode.insertBefore(toggle, a.nextSibling);
                  a.parentNode.insertBefore(panel, toggle.nextSibling);
                }

                let panelLoaded = false;
                const populateBattlePassPanel = async (force = false) => {
                  if (panel.dataset.inited && !force) return;
                  panel.dataset.inited = '1';
                  panel.innerHTML = `
                    <div class="battle-pass-section">
                      <div class="battle-pass-header">
                        <span>Daily Quests</span>
                        <button class="refresh-btn" id="battle-pass-refresh-btn" title="Refresh Daily Quests" draggable="false">🔄</button>
                      </div>
                      <div id="battle-pass-quests" class="battle-pass-quests-container">
                        <div class="loading-text">Loading quests...</div>
                      </div>
                    </div>
                  `;

                  try {
                    // Delegate fetching/parsing/rendering to existing loader which scrapes
                    // `battle_pass.php` and populates the #battle-pass-quests container.
                    await loadBattlePassQuests();

                    // Wire refresh button to re-run the loader
                    const refreshBtn = panel.querySelector('#battle-pass-refresh-btn');
                    const container = panel.querySelector('#battle-pass-quests');
                    if (refreshBtn) {
                      refreshBtn.addEventListener('click', async (ev) => {
                        ev.preventDefault(); ev.stopPropagation();
                        try {
                          if (container) container.innerHTML = '<div class="loading-text">Refreshing quests...</div>';
                          await loadBattlePassQuests();
                          showNotification('Battle Pass refreshed', 'info');
                        } catch (err) {
                          if (container) container.innerHTML = '<div class="quest-error">Error loading battle pass data</div>';
                          console.error('Error refreshing battle pass panel:', err);
                          showNotification('Failed to refresh', 'error');
                        }
                      });
                    }
                  } catch (err) {
                    const container = panel.querySelector('#battle-pass-quests');
                    if (container) container.innerHTML = '<div class="quest-error">Error loading battle pass data</div>';
                    console.error('Error populating battle pass panel:', err);
                  }

                  panelLoaded = true;
                };

                if (extensionSettings.battlePassExpanded) {
                  try { populateBattlePassPanel(); } catch (e) { console.error('Error auto-populating battle pass panel on load', e); }
                }

                const handleToggle = (e) => {
                  if (e) { e.preventDefault(); e.stopPropagation(); }
                  const expanded = toggle.getAttribute('aria-expanded') === 'true';
                  if (expanded) {
                    panel.style.display = 'none';
                    toggle.setAttribute('aria-expanded', 'false');
                    toggle.textContent = '+';
                    extensionSettings.battlePassExpanded = false;
                    try { localStorage.setItem('demonGameExtensionSettings', JSON.stringify(extensionSettings)); } catch (err) {}
                  } else {
                    panel.style.display = 'block';
                    toggle.setAttribute('aria-expanded', 'true');
                    toggle.textContent = '−';
                    extensionSettings.battlePassExpanded = true;
                    try { localStorage.setItem('demonGameExtensionSettings', JSON.stringify(extensionSettings)); } catch (err) {}
                    if (!panelLoaded) {
                      populateBattlePassPanel();
                    }
                  }
                };

                toggle.addEventListener('click', handleToggle);
                toggle.addEventListener('keydown', (e) => {
                  if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggle(e);
                  }
                });
              } catch (e) {
                console.error('Error adding battle pass expand toggle:', e);
              }
            } else if (pathname.endsWith('/merchant.php') || pathname === 'merchant.php') {
              try {
                // Add expandable panel for Merchant like Stats
                if (a.dataset.merchantEnhanced) return;
                // If our generated menu already has its own expand button/panel, skip enhancing this anchor
                const hasOwnExpand = !!(a.querySelector('#merchant-expand-btn') || sidebarContent.querySelector('#merchant-expanded'));
                if (hasOwnExpand) { a.dataset.merchantEnhanced = 'true'; return; }
                a.dataset.merchantEnhanced = 'true';

                const toggle = document.createElement('button');
                toggle.className = 'merchant-toggle-btn';
                toggle.type = 'button';
                toggle.setAttribute('aria-expanded', extensionSettings.merchantExpanded ? 'true' : 'false');
                toggle.textContent = extensionSettings.merchantExpanded ? '−' : '+';
                toggle.style.cssText = 'margin-left:8px; background:transparent; border:1px solid rgba(255,255,255,0.06); color:#89b4fa; padding:2px 6px; border-radius:4px; cursor:pointer; font-weight:700;';

                // Prefer reusing an existing merchant panel if present
                let panel = document.getElementById('merchant-expanded');
                if (!panel) {
                  panel = document.createElement('div');
                  panel.id = 'merchant-expanded';
                }
                panel.className = (panel.className || '').split(' ').concat(['merchant-expand-panel']).join(' ').trim();
                panel.style.cssText = 'display:' + (extensionSettings.merchantExpanded ? 'block' : 'none') + '; padding:8px; margin-top:8px; margin-bottom:8px; background:rgba(20,20,26,0.6); border-radius:6px; border:1px solid rgba(69,71,90,0.4);';

                try {
                  // Make the anchor a flex container so the label stays left and the toggle sits right
                  a.classList.add('sidebar-menu-expandable');
                  a.style.display = a.style.display || 'flex';
                  a.style.alignItems = a.style.alignItems || 'center';
                  a.style.justifyContent = a.style.justifyContent || 'space-between';

                  // Create a non-navigable control area inside the anchor and put the toggle there
                  const controlArea = document.createElement('div');
                  controlArea.className = 'side-control';
                  controlArea.style.cssText = 'margin-left:8px; display:flex; align-items:center; gap:6px;';
                  controlArea.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); });
                  controlArea.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') { ev.preventDefault(); ev.stopPropagation(); } });
                  controlArea.appendChild(toggle);
                  a.appendChild(controlArea);

                  // Insert the panel directly after the anchor so it expands downward under the merchant item
                  const parent = a.parentNode;
                  if (parent && parent.nextSibling !== panel) parent.insertBefore(panel, a.nextSibling);
                } catch (e) {
                  // Fallback: append toggle after anchor
                  a.parentNode.insertBefore(toggle, a.nextSibling);
                  a.parentNode.insertBefore(panel, toggle.nextSibling);
                }

                // Populate or refresh the merchant section contents (dropdown + pinned items)
                try { updateSidebarMerchantSection(); } catch (e) { console.error('Error populating merchant panel:', e); }

                const handleToggle = (e) => {
                  if (e) { e.preventDefault(); e.stopPropagation(); }
                  const expanded = toggle.getAttribute('aria-expanded') === 'true';
                  if (expanded) {
                    panel.style.display = 'none';
                    toggle.setAttribute('aria-expanded', 'false');
                    toggle.textContent = '+';
                    extensionSettings.merchantExpanded = false;
                  } else {
                    panel.style.display = 'block';
                    toggle.setAttribute('aria-expanded', 'true');
                    toggle.textContent = '−';
                    extensionSettings.merchantExpanded = true;
                    try { updateSidebarMerchantSection(); } catch (e) { /* ignore */ }
                  }
                  try { localStorage.setItem('demonGameExtensionSettings', JSON.stringify(extensionSettings)); } catch (err) {}
                };

                toggle.addEventListener('click', handleToggle);
                toggle.addEventListener('keydown', (e) => {
                  if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggle(e);
                  }
                });
              } catch (e) {
                console.error('Error adding merchant expand toggle:', e);
              }
            }

          });
        } catch (err) {
          console.error('Error processing sidebar nav items:', err);
        }
      }
    }

    // Save side drawer item names into localStorage so the settings UI can
    // later read and present them. This writes a JSON array to
    // `uiaddon_side_names` in localStorage.
    function saveSideDrawerNamesToCookie(days = 365) {
      // NOTE: despite the name, this now merges sidebar names into extensionSettings.menuItems
      try {
  // Try multiple selectors so the function works with different page layouts.
  // Prefer the explicit `.side-nav` element if present (it may be the nav itself),
  // otherwise try known wrappers `#sideDrawer` and `#game-sidebar`.
  const sideNavEl = document.querySelector('.side-nav');
  const sidebarWrapper = document.getElementById('sideDrawer') || document.getElementById('game-sidebar');
  if (!sideNavEl && !sidebarWrapper) return false;
  const sidebarContent = sideNavEl || (sidebarWrapper && (sidebarWrapper.querySelector('.side-nav') || sidebarWrapper));
  if (!sidebarContent) return false;
        const anchors = Array.from(sidebarContent.querySelectorAll('a.side-nav-item, .side-nav a'));
        const names = anchors.map(a => {
          try {
            const labelEl = a.querySelector('.side-label');
            const txt = (labelEl && labelEl.textContent && labelEl.textContent.trim()) || (a.textContent && a.textContent.trim()) || '';
            return txt;
          } catch (e) { return null; }
        }).filter(Boolean);

        // Merge into extensionSettings.menuItems
        try {
          if (!window.extensionSettings) window.extensionSettings = {};
          if (!Array.isArray(window.extensionSettings.menuItems)) window.extensionSettings.menuItems = [];

          const normalize = s => String(s || '').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

          const existing = window.extensionSettings.menuItems.slice();
          const existingByName = new Map();
          const existingIds = new Set();
          existing.forEach(item => {
            try {
              existingByName.set(normalize(item.name), item);
              existingIds.add(item.id);
            } catch (e) { /* ignore */ }
          });

          const newMenu = [];
          const usedNames = new Set();

          names.forEach((nm, idx) => {
            const raw = String(nm || '').trim();
            const key = normalize(raw);
            if (usedNames.has(key)) return; // dedupe duplicates in sidebar capture
            usedNames.add(key);

            const existingItem = existingByName.get(key);
            if (existingItem) {
              // update order and visibility
              existingItem.name = raw;
              existingItem.visible = true;
              existingItem.order = idx;
              newMenu.push(existingItem);
            } else {
              // create a new id based on name
              let baseId = raw.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
              if (!baseId) baseId = `item_${idx}`;
              let id = baseId;
              let suffix = 1;
              while (existingIds.has(id) || newMenu.some(mi => mi.id === id)) {
                id = `${baseId}_${suffix++}`;
              }
              existingIds.add(id);
              const item = { id, name: raw, visible: true, order: idx };
              newMenu.push(item);
            }
          });

          // Save the merged menu (items not in `names` are removed per request)
          window.extensionSettings.menuItems = newMenu;
          // Persist full settings
          try { saveSettings(); } catch (e) { console.error('Failed to save settings after merging menuItems', e); }

          // Refresh the sidebar DOM and re-apply ordering/hiding
          try { applySideDrawerNamesFromStorage(); } catch (e) { console.error('Failed to apply side drawer names after merging', e); }

          return true;
        } catch (e) {
          console.error('Failed to merge uiaddon side names into extensionSettings.menuItems', e);
          return false;
        }
      } catch (e) { console.error('saveSideDrawerNamesToCookie error', e); return false; }
    }
    getProfileLink();

    // Read the saved side drawer names from localStorage and reorder/hide elements
    function applySideDrawerNamesFromStorage() {
      try {
        if (!window.extensionSettings || !Array.isArray(window.extensionSettings.menuItems)) return false;
        const menu = window.extensionSettings.menuItems;
        if (!menu || !menu.length) return false;

        const sidebar = document.getElementById('sideDrawer');
        if (!sidebar) return false;
        const sidebarContent = sidebar.querySelector('.side-nav') || sidebar;

        const normalize = s => String(s || '').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

        // Map current anchors by normalized label
        const anchors = Array.from(sidebarContent.querySelectorAll('a.side-nav-item, .side-nav a'));
        const labelMap = new Map();
        anchors.forEach(a => {
          try {
            const labelEl = a.querySelector('.side-label');
            const txt = (labelEl && labelEl.textContent) || a.textContent || '';
            const key = normalize(txt);
            if (!labelMap.has(key)) labelMap.set(key, a);
          } catch (e) { /* ignore */ }
        });

        // Build fragment in order of menu items and also move any adjacent expand panels
        const frag = document.createDocumentFragment();
        const matched = new Set();
        menu.forEach((mi) => {
          try {
            const key = normalize(mi.name);
            const a = labelMap.get(key);
            if (a) {
              const node = a.closest('li') || a;
              // Move the anchor (or its li) into the fragment
              frag.appendChild(node);
              // If there's an expand panel immediately after this node, move it too
              try {
                const next = node.nextElementSibling;
                if (next && /expand-panel/.test(next.className || '')) {
                  frag.appendChild(next);
                }
              } catch (e) { /* ignore */ }

              try { node.style.display = ''; a.style.display = ''; } catch (e) {}
              matched.add(key);
            }
          } catch (e) { /* ignore individual item */ }
        });

        // Append the ordered fragment (moves nodes to the end in the correct order)
        if (frag.childNodes && frag.childNodes.length) sidebarContent.appendChild(frag);

        // Hide anchors and their panels not present in the menu list
        anchors.forEach(a => {
          try {
            const labelEl = a.querySelector('.side-label');
            const txt = (labelEl && labelEl.textContent) || a.textContent || '';
            const key = normalize(txt);
            const node = a.closest('li') || a;
            const next = node.nextElementSibling;
            if (!matched.has(key)) {
              node.style.display = 'none';
              if (next && /expand-panel/.test(next.className || '')) next.style.display = 'none';
            } else {
              node.style.display = '';
              if (next && /expand-panel/.test(next.className || '')) next.style.display = '';
            }
          } catch (e) { /* ignore */ }
        });

        // Expose function globally so other init paths can call it directly
        try { if (!window.applySideDrawerNamesFromStorage) window.applySideDrawerNamesFromStorage = applySideDrawerNamesFromStorage; } catch(e){}

        return true;
      } catch (err) {
        console.error('applySideDrawerNamesFromStorage error', err);
        return false;
      }
    }
  try {
    if (!window._uiaddon_initing) {
      saveSideDrawerNamesToCookie();
    }
  } catch (e) { /* ignore */ }

  // --- UI Addon: Disable Escape key from closing the side drawer ---
  // Some underlying site scripts close the drawer when ESC is pressed.
  // We intercept the keydown event in the capture phase and suppress it
  // ONLY when: (1) the side drawer is open AND (2) no battle modal is open.
  // This preserves normal ESC behavior for modals or other dialogs.
  (function installUiAddonEscBlocker(){
    try {
      if (window._uiaddonEscBlockerInstalled) return;
      window._uiaddonEscBlockerInstalled = true;
      document.addEventListener('keydown', function uiAddonEscBlocker(e){
        // Normalize key detection across browsers
        const isEsc = e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27;
        if (!isEsc) return;
        const sideDrawer = document.getElementById('sideDrawer');
        if (!sideDrawer) return; // nothing to do
        const isOpen = sideDrawer.getAttribute('data-open') === 'true';
        const battleModal = document.getElementById('battle-modal');
        // If focus is inside a text input/textarea, let native ESC (like canceling edits) through.
        const tag = (e.target && e.target.tagName || '').toLowerCase();
        const isEditable = tag === 'input' || tag === 'textarea' || e.target?.isContentEditable;
        if (isEditable) return; // don't interfere with typing contexts

        // Always keep the drawer open when ESC is pressed; suppress any site-level close logic.
        if (isOpen) {
          // Reassert open state defensively.
          sideDrawer.setAttribute('data-open', 'true');
          e.stopImmediatePropagation();
          e.stopPropagation();
          e.preventDefault();
        }

        // If a battle modal is open, treat ESC as a request to close ONLY the modal (not the drawer).
        if (battleModal) {
          try {
            battleModal.remove();
            if (typeof setModalOpen === 'function') setModalOpen(false);
            // Dispatch an event so other parts can react if needed.
            document.dispatchEvent(new CustomEvent('uiaddon:battleModalClosedByEsc'));
          } catch (err) {
            console.warn('[UI Addon] Failed to close battle modal via ESC:', err);
          }
          // Ensure drawer stays open after closing modal.
          sideDrawer.setAttribute('data-open', 'true');
        }
      }, true); // capture phase so we beat site listeners
      console.info('[UI Addon] Installed ESC blocker to prevent side drawer from closing.');
    } catch (err) {
      console.warn('[UI Addon] Failed to install ESC blocker:', err);
    }
  })();

  }

  function initSideBar(){
    const noContainerPage = !document.querySelector('.container') && !document.querySelector('.wrap');
    const mainWrapper = document.createElement('div');
    mainWrapper.className = 'main-wrapper';



    const contentArea = document.createElement('div');
    contentArea.className = 'content-area';
    if(noContainerPage){
      const topbar = document.querySelector('.game-topbar');
      const allElements = Array.from(document.body.children);
      const topbarIndex = allElements.indexOf(topbar);

      for (let i = topbarIndex + 1; i < allElements.length; i++) {
        if (!allElements[i].classList.contains('main-wrapper') &&
            !allElements[i].id !== 'sidebarToggle') {
          contentArea.appendChild(allElements[i]);
        }
      }
    } else {
      const existingContainer = document.querySelector('.container') || document.querySelector('.wrap');
      if (existingContainer) {
        contentArea.appendChild(existingContainer);
      }
    }

    // Append sidebar to main wrapper
    mainWrapper.appendChild(contentArea);
    document.body.appendChild(mainWrapper);

    document.body.style.paddingTop = "55px";
    document.body.style.paddingLeft = "0px";
    document.body.style.margin = "0px";

    const style = document.createElement('style');
    style.textContent = `
      /* Neo Toggle Switch Styles */
      .neo-toggle-container {
        --toggle-width: 50px;
        --toggle-height: 24px;
        --toggle-bg: #181c20;
        --toggle-off-color: #475057;
        --toggle-on-color: #36f9c7;
        --toggle-transition: 0.4s cubic-bezier(0.25, 1, 0.5, 1);

        position: relative;
        display: inline-flex;
        flex-direction: column;
        font-family: "Segoe UI", Tahoma, sans-serif;
        user-select: none;
        margin: 0 0 0 10px;
        vertical-align: middle;
      }

      .neo-toggle-input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }

      .side-footer {
        margin-bottom: 20px;
      }

      .neo-toggle {
        position: relative;
        width: var(--toggle-width);
        height: var(--toggle-height);
        display: block;
        cursor: pointer;
        transform: translateZ(0);
        perspective: 500px;
      }

      .neo-track {
        position: absolute;
        inset: 0;
        border-radius: calc(var(--toggle-height) / 2);
        overflow: hidden;
        transform-style: preserve-3d;
        transform: translateZ(-1px);
        transition: transform var(--toggle-transition);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1);
      }

      .neo-background-layer {
        position: absolute;
        inset: 0;
        background: var(--toggle-bg);
        background-image: linear-gradient(-45deg, rgba(20, 20, 20, 0.8) 0%, rgba(30, 30, 30, 0.3) 50%, rgba(20, 20, 20, 0.8) 100%);
        opacity: 1;
        transition: all var(--toggle-transition);
      }

      .neo-grid-layer {
        position: absolute;
        inset: 0;
        background-image: linear-gradient(to right, rgba(71, 80, 87, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(71, 80, 87, 0.05) 1px, transparent 1px);
        background-size: 5px 5px;
        opacity: 0;
        transition: opacity var(--toggle-transition);
      }

      .neo-track-highlight {
        position: absolute;
        inset: 1px;
        border-radius: calc(var(--toggle-height) / 2);
        background: linear-gradient(90deg, transparent, rgba(54, 249, 199, 0));
        opacity: 0;
        transition: all var(--toggle-transition);
      }

      .neo-spectrum-analyzer {
        position: absolute;
        bottom: 6px;
        right: 10px;
        height: 10px;
        display: flex;
        align-items: flex-end;
        gap: 2px;
        opacity: 0;
        transition: opacity var(--toggle-transition);
      }

      .neo-spectrum-bar {
        width: 2px;
        height: 3px;
        background-color: var(--toggle-on-color);
        opacity: 0.8;
      }

      .neo-thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        transform-style: preserve-3d;
        transition: transform var(--toggle-transition);
        z-index: 1;
      }

      .neo-thumb-ring {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: var(--toggle-off-color);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        transition: all var(--toggle-transition);
      }

      .neo-thumb-core {
        position: absolute;
        inset: 5px;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
        transition: all var(--toggle-transition);
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .neo-thumb-icon {
        position: relative;
        width: 10px;
        height: 10px;
        transition: all var(--toggle-transition);
      }

      .neo-thumb-wave {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 10px;
        height: 2px;
        background: var(--toggle-off-color);
        transform: translate(-50%, -50%);
        transition: all var(--toggle-transition);
      }

      .neo-thumb-pulse {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 1px solid var(--toggle-off-color);
        transform: scale(0);
        opacity: 0;
        transition: all var(--toggle-transition);
      }

      .neo-status {
        position: absolute;
        bottom: -20px;
        left: 0;
        width: 100%;
        display: flex;
        justify-content: center;
      }

      .neo-status-indicator {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .neo-status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: var(--toggle-off-color);
        transition: all var(--toggle-transition);
      }

      .neo-status-text {
        font-size: 9px;
        font-weight: 600;
        color: var(--toggle-off-color);
        letter-spacing: 1px;
        transition: all var(--toggle-transition);
      }

      .neo-status-text::before {
        content: "STANDBY";
      }

      /* Active states */
      .neo-toggle-input:checked + .neo-toggle .neo-thumb {
        transform: translateX(calc(var(--toggle-width) - 24px));
      }

      .neo-toggle-input:checked + .neo-toggle .neo-thumb-ring {
        background-color: var(--toggle-on-color);
        border-color: rgba(54, 249, 199, 0.3);
        box-shadow: 0 0 15px rgba(54, 249, 199, 0.5);
      }

      .neo-toggle-input:checked + .neo-toggle .neo-thumb-wave {
        height: 8px;
        width: 8px;
        border-radius: 50%;
        background: transparent;
        border: 1px solid #fff;
      }

      .neo-toggle-input:checked + .neo-toggle .neo-thumb-pulse {
        transform: scale(1.2);
        opacity: 0.3;
        animation: neo-pulse 1.5s infinite;
      }

      .neo-toggle-input:checked + .neo-toggle .neo-track-highlight {
        background: linear-gradient(90deg, transparent, rgba(54, 249, 199, 0.2));
        opacity: 1;
      }

      .neo-toggle-input:checked + .neo-toggle .neo-grid-layer {
        opacity: 1;
      }

      .neo-toggle-input:checked + .neo-toggle .neo-spectrum-analyzer {
        opacity: 1;
      }

      .neo-toggle-input:checked + .neo-toggle .neo-spectrum-bar:nth-child(1) {
        animation: neo-spectrum 0.9s infinite;
      }

      .neo-toggle-input:checked + .neo-toggle .neo-spectrum-bar:nth-child(2) {
        animation: neo-spectrum 0.8s 0.1s infinite;
      }

      .neo-toggle-input:checked + .neo-toggle .neo-spectrum-bar:nth-child(3) {
        animation: neo-spectrum 1.1s 0.2s infinite;
      }

      .neo-toggle-input:checked + .neo-toggle .neo-spectrum-bar:nth-child(4) {
        animation: neo-spectrum 0.7s 0.1s infinite;
      }

      .neo-toggle-input:checked + .neo-toggle .neo-spectrum-bar:nth-child(5) {
        animation: neo-spectrum 0.9s 0.15s infinite;
      }

      .neo-toggle-input:checked + .neo-toggle .neo-status-dot {
        background-color: var(--toggle-on-color);
        box-shadow: 0 0 8px var(--toggle-on-color);
      }

      .neo-toggle-input:checked + .neo-toggle .neo-status-text {
        color: var(--toggle-on-color);
      }

      .neo-toggle-input:checked + .neo-toggle .neo-status-text::before {
        content: "ACTIVE";
      }

      .neo-toggle:hover .neo-thumb-ring {
        transform: scale(1.05);
      }

      @keyframes neo-pulse {
        0% { transform: scale(1); opacity: 0.5; }
        50% { transform: scale(1.5); opacity: 0.2; }
        100% { transform: scale(1); opacity: 0.5; }
      }

      @keyframes neo-spectrum {
        0% { height: 3px; }
        50% { height: 8px; }
        100% { height: 3px; }
      }
      /* End Neo Toggle Styles */

      .main-wrapper {
        display: flex;
        min-height: calc(100vh - 74px);
      }

      #game-sidebar {
        width: 250px;
        background: ${extensionSettings.sidebarColor};
        border-right: 1px solid rgba(255, 255, 255, 0.06);
        flex-shrink: 0;
        overflow-y: auto;
        position: fixed;
        top: 66px;
        left: 0;
        height: calc(100vh - 66px);
        z-index: 1000;
      }

      .sidebar-header {
        padding: 15px 0 20px 15px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        margin-bottom: 15px;
      }

      .sidebar-header h2 {
        color: #FFD369;
        margin: 0;
        font-size: 1.4rem;
      }

      .sidebar-section {
        margin: 0 20px 20px 20px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        overflow: hidden;
      }

      .stats-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 15px;
        cursor: pointer;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      }

      .stats-header:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      .stats-basic {
        flex: 1;
      }

      .stats-title {
        display: block;
        color: #FFD369;
        font-weight: bold;
        margin-bottom: 8px;
        font-size: 14px;
      }

      .stats-inline {
        display: flex;
        gap: 10px;
        font-size: 10px; /* Stats text size */
        color: #e0e0e0;
      }

      .stats-inline .points {
        color: #74c0fc;
        font-weight: bold;
      }

      .expand-btn {
        background: none;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #e0e0e0;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        min-width: 24px;
      }

      .expand-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .stats-expanded {
        padding: 15px;
        background: rgba(0, 0, 0, 0.2);
      }

      .stats-expanded.collapsed {
        display: none;
      }

      .upgrade-section {
        color: #e0e0e0;
      }

      .stat-upgrade-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding: 8px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 6px;
      }

      .upgrade-controls {
        display: flex;
        gap: 6px;
      }

      .upgrade-btn {
        background: #a6e3a1;
        color: #1e1e2e;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: bold;
      }

      .upgrade-btn:hover {
        background: #94d3a2;
      }

      .upgrade-btn:disabled {
        background: #6c7086;
        cursor: not-allowed;
      }

      .upgrade-note {
        font-size: 11px;
        color: #a6adc8;
        text-align: center;
        margin-top: 10px;
        font-style: italic;
      }

      /* Battle Pass Styles */
      .battle-pass-section {
        color: #e0e0e0;
      }

      .battle-pass-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        font-weight: bold;
        font-size: 13px;
      }

      .battle-pass-quests-container {
        max-height: 400px;
        overflow-y: auto;
      }

      .sidebar-quest {
        background: rgba(255, 255, 255, 0.05);
        border-left: 3px solid #89b4fa;
        padding: 10px;
        margin-bottom: 10px;
        border-radius: 4px;
        transition: all 0.2s;
      }

      .sidebar-quest.completed {
        border-left-color: #a6e3a1;
        background: rgba(166, 227, 161, 0.1);
      }

      .sidebar-quest:hover {
        background: rgba(255, 255, 255, 0.08);
      }

      .side-footer {
        height: 50px;
        max-height: 50px;
      }

      .side-stats-row {
        display: none !important;
      }

      .side-exp-row {
        display: none !important;
      }

      .quest-title {
        font-size: 11px;
        font-weight: bold;
        color: #cdd6f4;
        margin-bottom: 4px;
      }

      .quest-details {
        font-size: 10px;
        color: #a6adc8;
        margin-bottom: 6px;
      }

      .quest-progress-bar {
        background: rgba(0, 0, 0, 0.3);
        height: 6px;
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 4px;
      }

      .quest-progress-fill {
        background: linear-gradient(90deg, #89b4fa, #74c7ec);
        height: 100%;
        transition: width 0.3s ease;
      }

      .sidebar-quest.completed .quest-progress-fill {
        background: linear-gradient(90deg, #a6e3a1, #94e2d5);
      }

      .quest-status {
        font-size: 10px;
        color: #a6adc8;
      }

      .sidebar-quest.completed .quest-status {
        color: #a6e3a1;
      }

      .quest-empty,
      .quest-error,
      .loading-text {
        color: #a6adc8;
        font-size: 11px;
        text-align: center;
        padding: 15px;
        font-style: italic;
      }

      .quest-error {
        color: #f38ba8;
      }

      .refresh-btn {
        background: transparent;
        border: none;
        color: #89b4fa;
        cursor: pointer;
        font-size: 14px;
        padding: 2px 6px;
        border-radius: 4px;
        transition: all 0.2s;
      }

      .refresh-btn:hover {
        background: rgba(137, 180, 250, 0.2);
        transform: rotate(90deg);
      }

      .sidebar-menu {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .sidebar-menu li:last-child {
        border-bottom: none;
      }

      .sidebar-menu a {
        display: flex;
        align-items: center;
        padding: 12px 20px;
        color: #e0e0e0;
        text-decoration: none;
        transition: all 0.2s ease;
        font-size: 14px; /* You can change this value */
      }

      .sidebar-menu a:hover {
        background-color: #252525;
        color: #FFD369;
      }

      .sidebar-menu img {
        width: 24px;
        height: 24px;
        margin-right: 12px;
        object-fit: cover;
        border-radius: 4px;
      }

      .sidebar-menu-expandable {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-right: 20px;
      }

      .sidebar-menu-expandable a {
        flex: 1;
        margin: 0;
        padding: 12px 20px;
      }

      .sidebar-menu-expandable .expand-btn {
        margin-left: 10px;
      }

      .sidebar-submenu {
        background: rgba(0, 0, 0, 0.3);
        padding: 15px 20px;
        margin: 0;
      }

      .sidebar-submenu.collapsed {
        display: none;
      }

      .coming-soon-text {
        color: #f38ba8;
        font-size: 12px;
        text-align: center;
        font-style: italic;
      }

      .content-area {
        flex: 1;
        padding: 20px;
        margin-left: 250px;
        max-width: calc(100% - 250px);
      }

      .settings-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .settings-content {
        background: #1e1e2e;
        border: 2px solid #cba6f7;
        border-radius: 15px;
        padding: 30px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        color: #cdd6f4;
      }

      .settings-content::-webkit-scrollbar {
        width: 8px;
      }

      .settings-content::-webkit-scrollbar-track {
        background: #2a2a2e;
        border-radius: 4px;
      }

      .settings-content::-webkit-scrollbar-thumb {
        background: #45475a;
        border-radius: 4px;
      }

      .settings-content::-webkit-scrollbar-thumb:hover {
        background: #6c7086;
      }
        
        /* Cyberpunk Checkbox Styles */
        .cyberpunk-checkbox {
          appearance: none;
          width: 20px;
          height: 20px;
          border: 2px solid #cba6f7;
          border-radius: 5px;
          background-color: transparent;
          display: inline-block;
          position: relative;
          margin-right: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .cyberpunk-checkbox:hover {
          border-color: #f9e2af;
          box-shadow: 0 0 10px rgba(203, 166, 247, 0.3);
        }
        
        .cyberpunk-checkbox:before {
          content: "";
          background-color: #cba6f7;
          display: block;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0);
          width: 10px;
          height: 10px;
          border-radius: 3px;
          transition: all 0.3s ease-in-out;
        }
        
        .cyberpunk-checkbox:checked:before {
          transform: translate(-50%, -50%) scale(1);
        }
        
        .cyberpunk-checkbox:checked {
          border-color: #f9e2af;
          box-shadow: 0 0 15px rgba(249, 226, 175, 0.4);
        }
        
        .cyberpunk-checkbox-label {
          font-size: 14px;
          color: #cdd6f4;
          cursor: pointer;
          user-select: none;
          display: flex;
          align-items: center;
      }

      .settings-section {
        margin: 20px 0;
        padding: 15px;
        background: #181825;
        border-radius: 8px;
        border: 1px solid #45475a;
      }

      .settings-section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        margin-bottom: 15px;
      }

      .settings-section-header h3 {
        margin: 0;
        color: #cba6f7;
      }

      .settings-section-content {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease-out;
      }

      .settings-section-content.expanded {
        max-height: 2000px;
        transition: max-height 0.3s ease-in;
      }

      .expand-icon {
        color: #cba6f7;
        font-weight: bold;
        font-size: 20px;
        transition: transform 0.3s ease;
        width: 24px;
        height: 24px;
        line-height: 24px;
        text-align: center;
      }

      .expand-icon.expanded {
        transform: rotate(180deg);
      }

      p1 {
        font-size: 12px;
        color: #a6adc8;
        margin-top: 10px;
      }

      .global-announcement-bar {
        margin-left: 250px;
        margin-top: 2px;
      }

      /* Background Image Effects */
      .page-bg-normal {
        background-image: var(--page-bg-image) !important;
        background-size: cover !important;
        background-position: center !important;
        background-repeat: no-repeat !important;
        background-attachment: fixed !important;
      }

      .page-bg-gradient {
        background: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8)), var(--page-bg-image) !important;
        background-size: cover !important;
        background-position: center !important;
        background-repeat: no-repeat !important;
        background-attachment: fixed !important;
      }

      .page-bg-pattern {
        background-image: 
          radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 107, 107, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(255, 159, 67, 0.3) 0%, transparent 50%),
          var(--page-bg-image) !important;
        background-size: cover, cover, cover, cover !important;
        background-position: center !important;
        background-repeat: no-repeat !important;
        background-attachment: fixed !important;
      }

      .page-bg-blur {
        background-image: var(--page-bg-image) !important;
        background-size: cover !important;
        background-position: center !important;
        background-repeat: no-repeat !important;
        background-attachment: fixed !important;
        filter: blur(2px) !important;
      }

      .page-bg-blur * {
        filter: blur(0) !important;
      }

      /* Fix blur effect - only blur background, not content */
      .blur-background {
        position: relative;
      }

      .blur-background::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: inherit;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        background-attachment: fixed;
        filter: blur(2px);
        z-index: -1;
      }

      .blur-background {
        background-image: none !important;
        filter: none !important;
      }

      /* Pattern effect using pseudo-element */
      .pattern-background {
        position: relative;
      }

      .pattern-background::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: 
          radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 107, 107, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(255, 159, 67, 0.3) 0%, transparent 50%);
        z-index: 1;
        pointer-events: none;
      }

      /* Monster Background Effects */
      .monster-bg-normal {
        position: relative;
      }

      .monster-bg-normal::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, var(--monster-overlay-opacity, 0.4));
        z-index: 0;
        pointer-events: none;
      }

      .monster-bg-normal > * {
        position: relative;
        z-index: 1;
      }

      .monster-bg-gradient {
        position: relative;
      }

      .monster-bg-gradient::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.3));
        z-index: 0;
        pointer-events: none;
      }

      .monster-bg-gradient > * {
        position: relative;
        z-index: 1;
      }

      .monster-bg-blur {
        position: relative;
      }

      .monster-bg-blur::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: inherit;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        background-attachment: fixed;
        filter: blur(3px);
        z-index: 0;
        pointer-events: none;
      }

      .monster-bg-blur {
        background-image: none !important;
        filter: none !important;
      }

      .monster-bg-blur > * {
        position: relative;
        z-index: 1;
      }

      .monster-bg-pattern {
        position: relative;
      }

      .monster-bg-pattern::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: 
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(0, 0, 0, 0.1) 10px,
            rgba(0, 0, 0, 0.1) 20px
          );
        z-index: 0;
        pointer-events: none;
      }

      .monster-bg-pattern > * {
        position: relative;
        z-index: 1;
      }

      /* Back to Dashboard button styling */
      .back-to-dashboard-btn {
        background: linear-gradient(135deg, #2a2a2e 0%, #1e1e1e 100%);
        border: 1px solid #cba6f7;
        border-radius: 4px;
        color: #cdd6f4;
        text-decoration: none;
        padding: 2px;
        font-size: 9px;
        font-weight: 500;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-left: 4px;
        width: 20px;
        height: 20px;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .back-to-dashboard-btn:hover {
        background: linear-gradient(135deg, #3a3a3e 0%, #2e2e2e 100%);
        border-color: #f9e2af;
        color: #f9e2af;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(203, 166, 247, 0.3);
      }

      /* Semi-transparent pet slot boxes */
      .slot-box {
        background: rgba(30, 30, 46, 0.7) !important;
        border: 1px solid rgba(203, 166, 247, 0.3) !important;
        border-radius: 8px !important;
        backdrop-filter: blur(5px) !important;
        transition: all 0.3s ease !important;
      }

      .slot-box:hover {
        background: rgba(30, 30, 46, 0.85) !important;
        border-color: rgba(203, 166, 247, 0.6) !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 12px rgba(203, 166, 247, 0.2) !important;
      }

      /* Full width topbar for pets page */
      .game-topbar {
        width: 100vw !important;
        left: 0 !important;
        margin-left: 0 !important;
        position: fixed !important;
        top: 0 !important;
        z-index: 10000 !important;
      }

      .settings-section {
        margin-bottom: 25px;
      }

      .settings-section h3 {
        color: #f38ba8;
        margin-bottom: 15px;
        border-bottom: 1px solid #585b70;
        padding-bottom: 8px;
      }

      .color-palette {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 10px;
        margin-top: 10px;
      }

      /* Menu customization styles */
      .settings-section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        padding: 10px 0;
        border-bottom: 1px solid #45475a;
        margin-bottom: 15px;
      }

      .settings-section-header:hover {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
      }

      .expand-icon {
        font-size: 18px;
        color: #cdd6f4;
        font-weight: bold;
        transition: transform 0.3s ease;
      }

      .menu-customization-container {
        background: #1e1e2e;
        border: 1px solid #45475a;
        border-radius: 8px;
        padding: 15px;
      }

      .menu-items-list {
        max-height: 400px;
        overflow-y: auto;
        margin-bottom: 15px;
      }

      .menu-item-row {
        display: flex;
        align-items: center;
        padding: 10px;
        margin: 5px 0;
        background: #2a2a2e;
        border: 1px solid #45475a;
        border-radius: 6px;
        transition: all 0.3s ease;
      }

      .menu-item-row:hover {
        background: #3a3a3e;
        border-color: #6c7086;
      }

      .menu-item-row.dragging {
        opacity: 0.5;
        transform: rotate(2deg);
      }

      .menu-item-row.drag-over {
        border-color: #a6e3a1;
        background: rgba(166, 227, 161, 0.1);
      }

      .drag-handle {
        cursor: grab;
        color: #6c7086;
        font-size: 16px;
        margin-right: 10px;
        padding: 5px;
        border-radius: 4px;
        transition: all 0.3s ease;
      }

      .drag-handle:hover {
        color: #cdd6f4;
        background: rgba(255, 255, 255, 0.1);
      }

      .drag-handle:active {
        cursor: grabbing;
      }

      .menu-item-name {
        flex: 1;
        color: #cdd6f4;
        font-size: 14px;
        margin-left: 10px;
      }

      .menu-item-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .menu-item-toggle {
        position: relative;
        width: 40px;
        height: 20px;
        background: #45475a;
        border-radius: 10px;
        cursor: pointer;
        transition: background 0.3s ease;
      }

      .menu-item-toggle.active {
        background: #a6e3a1;
      }

      .menu-item-toggle::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        background: white;
        border-radius: 50%;
        transition: transform 0.3s ease;
      }

      .menu-item-toggle.active::after {
        transform: translateX(20px);
      }

      .menu-item-arrows {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .arrow-btn {
        background: #45475a;
        border: none;
        color: #cdd6f4;
        width: 24px;
        height: 16px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 10px;
        transition: all 0.3s ease;
      }

      .arrow-btn:hover {
        background: #6c7086;
        color: white;
      }

      .arrow-btn:disabled {
        background: #2a2a2e;
        color: #6c7086;
        cursor: not-allowed;
      }

      .color-option {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        border: 2px solid transparent;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .color-option:hover {
        transform: scale(1.1);
      }

      .color-option.selected {
        border-color: #cba6f7;
        box-shadow: 0 0 10px rgba(203, 166, 247, 0.5);
      }

      .settings-button {
        background: #cba6f7;
        color: #1e1e2e;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        margin-right: 10px;
        margin-top: 10px;
      }

      .settings-button:hover {
        background: #a281d4;
      }

      .sidebar-quick-access {
        max-height: 300px;
        overflow-y: auto;
        /* Match sidebar scrollbar styling */
        scrollbar-width: thin;              /* Firefox */
        scrollbar-color: #2a2a2a #1a1a1a;  /* Firefox */
      }

      /* Match side-nav scrollbar look for quick-access container */
      .sidebar-quick-access::-webkit-scrollbar {
        width: 8px;
      }

      .sidebar-quick-access::-webkit-scrollbar-track {
        background: linear-gradient(135deg, #1a1a1a 0%, #0e0e0e 100%);
        border-radius: 4px;
      }

      .sidebar-quick-access::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
        border-radius: 4px;
        border: 1px solid #333;
      }

      .sidebar-quick-access::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, #3a3a3a 0%, #2e2e2e 100%);
      }

      .quick-access-empty {
        color: #888;
        font-size: 12px;
        text-align: center;
        padding: 10px;
        font-style: italic;
      }

      .quick-access-item {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        padding: 8px;
        margin-bottom: 8px;
      }

      .qa-item-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
      }

      .qa-item-info {
        flex: 1;
        min-width: 0;
      }

      .qa-item-name {
        font-size: 11px;
        font-weight: bold;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .qa-item-price, .qa-item-stats {
        font-size: 10px;
        color: #888;
      }

      .qa-remove-btn {
        background: #f38ba8;
        color: white;
        border: none;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .qa-item-actions {
        display: flex;
        gap: 4px;
      }

      .qa-buy-btn, .qa-use-btn, .qa-equip-btn {
        background: #a6e3a1;
        color: #1e1e2e;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 10px;
        font-weight: bold;
      }

      .qa-buy-btn:hover, .qa-use-btn:hover, .qa-equip-btn:hover {
        background: #94d3a2;
      }

      .qa-buy-btn:disabled {
        background: #6c7086;
        cursor: not-allowed;
      }

      .qa-use-btn {
        background: #74c0fc;
      }

      .qa-use-btn:hover {
        background: #5aa3e0;
      }

      .qa-use-multiple-btn {
        background: #f9e2af;
        color: #1e1e2e;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 10px;
        font-weight: bold;
        margin-left: 4px;
      }

      .qa-use-multiple-btn:hover {
        background: #e6d196;
      }

      .qa-equip-btn {
        background: #f9e2af;
      }

      .qa-equip-btn:hover {
        background: #e6d196;
      }

      /* Stats menu item text sizing */
      #stats-menu-text {
        font-size: 13px; /* Change this to make stats text bigger/smaller */
      }

      #stats-menu-text span {
        font-weight: bold;
        margin: 0 2px;
      }

      /* Event table styling for side-by-side display */
      .event-table {
        table-layout: auto;
        width: 100%;
        border-collapse: collapse;
        background: rgba(30, 30, 46, 0.8);
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 10px;
      }

      .event-table th,
      .event-table td {
        padding: 1px 5px;
        text-align: left;
        border-bottom: 1px solid rgba(88, 91, 112, 0.3);
      }

      .event-table th {
        background: rgba(203, 166, 247, 0.2);
        color: #cba6f7;
        font-weight: bold;
      }

      .event-table tr:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      /* Shrink the Player column to fit content only */
      .event-table td:nth-child(2) {
        width: 1%;
        white-space: nowrap;
      }

      /* Tighten damage column spacing */
      .event-table td.right {
        padding-left: 5px;
        text-align: right;
      }

      /* Battle images hiding - only hide images within the extension enemy loot container */
      .battle-images-hidden #extension-enemy-loot-container img {
        display: none !important;
      }

      /* Hide loot card images specifically */
      .battle-images-hidden .loot-img-wrap {
        display: none !important;
      }

      /* Add red border to loot cards when images are hidden */
      .battle-images-hidden .loot-card {
        border: 2px solid #f38ba8 !important;
        border-radius: 8px !important;
      }

      /* Make HP bar smaller */
      .hp-bar {
        height: 24px !important;
        border-radius: 6px !important;
      }

      /* Fixed width HP bar only when images are hidden */
      .battle-images-hidden .hp-bar {
        width: 500px !important;
      }

      /* Left align battle panel content when images are hidden */
      .battle-images-hidden #monster-display {
        text-align: left !important;
        align-items: flex-start !important;
      }

      .battle-images-hidden .panel .hp-bar {
        justify-self: start !important;
      }

      /* Fix loot container layout when images are hidden - reference from HTML example */
      .battle-images-hidden #extension-enemy-loot-container {
        display: flex !important;
        gap: 30px !important;
        justify-content: space-between !important;
        align-items: flex-start !important;
        width: 100% !important;
        margin-bottom: 20px !important;
      }

      /* Create monster display area when images are hidden */
      .battle-images-hidden #monster-display {
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 10px !important;
        min-width: 250px !important;
        max-width: 50% !important;
      }

      .log-battle-card {
        max-height:400px;
        overflow-y: scroll;
        height:400px;
      }

      .battle-images-hidden #extension-loot-container {
        display: flex !important;
        flex-wrap: wrap !important;
        max-width: 50% !important;
        margin-left: auto !important;
      }

      .hp-fill {
        border-radius: 5px !important; 
      }

      /* Modern Sidebar Styling */
      #game-sidebar {
        background: ${extensionSettings.sidebarColor} !important;
        border-right: 2px solid #333 !important;
        box-shadow: 2px 0 20px rgba(0, 0, 0, 0.3) !important;
      }

      /* Add gap between loot and image even when images are shown */
      #extension-enemy-loot-container {
        display: flex !important;
        gap: 30px !important;
        justify-content: space-between !important;
        align-items: flex-start !important;
        width: 100% !important;
      }
      
      /* Update loot container positioning */
      #extension-loot-container {
        display: flex !important;
        flex-wrap: wrap !important;
        max-width: 50% !important;
        margin-left: auto !important;
      }
      
      /* Add dynamic border to loot cards */
      .loot-card {
        border: 2px solid var(--loot-card-border-color, #f38ba8) !important;
        border-radius: 8px !important;
      }
      
      /* Monster image wrapper with border and glow */
      .monster-image-wrapper {
        border: 3px solid var(--monster-image-outline-color, #ff6b6b) !important;
        border-radius: 8px !important;
        box-shadow: 
          0 0 0 1px var(--monster-image-outline-color, #ff6b6b),
          0 0 10px var(--monster-image-outline-color, #ff6b6b),
          0 0 20px var(--monster-image-outline-color, #ff6b6b),
          0 0 30px var(--monster-image-outline-color, #ff6b6b) !important;
        transition: box-shadow 0.3s ease !important;
        display: inline-block !important;
        position: relative !important;
      }
      
      /* Monster image inside wrapper */
      .monster_image {
        border: none !important;
        box-shadow: none !important;
        border-radius: 5px !important;
        display: block !important;
      }
      
      /* When monster is dead, apply grayscale to image only, not wrapper */
      .monster_image.grayscale {
        filter: grayscale(100%) !important;
        -webkit-filter: grayscale(100%) !important;
      }
      

      /* Make leaderboard and attack log side by side */
      .leaderboard-panel, .log-panel .main-panel {
        display: inline-block !important;
        vertical-align: top !important;
        width: 48% !important;
        box-sizing: border-box !important;
      }
      .log-panel, .main-panel {
        margin-top: 1% !important;
        margin-bottom: 16px !important;
      }
      .leaderboard-panel {
        max-height: 400px !important;
        height: 400px !important;
      }

      .monster-card {
        border: none !important;
        box-shadow: none !important;
        z-index: 0 !important;
      }
      
      /* Ensure leaderboard spacing is preserved */
      .lb-row {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        margin-bottom: 4px !important;
      }
      
      .lb-avatar {
        width: 24px !important;
        height: 24px !important;
        border-radius: 50% !important;
        flex-shrink: 0 !important;
      }
      
      .lb-name {
        flex: 1 !important;
        min-width: 0 !important;
      }
      
      .lb-dmg {
        flex-shrink: 0 !important;
        font-weight: bold !important;
      }

      /* Sidebar Collapse/Expand */
      #game-sidebar.collapsed {
        width: 60px !important;
        transition: width 0.3s ease;
      }

      #game-sidebar.collapsed .sidebar-header h2 {
        display: none !important;
      }

      #game-sidebar.collapsed .sidebar-header {
        padding: 15px 10px !important;
        text-align: center;
        position: relative;
      }

      #game-sidebar.collapsed .sidebar-header::after {
        content: "☰";
        font-size: 20px;
        color: #cdd6f4;
        display: block;
        margin-top: 5px;
      }

      #game-sidebar.collapsed .sidebar-menu li a span,
      #game-sidebar.collapsed .sidebar-menu li a:not([href]) {
        display: none !important;
      }

      /* Hide all text content in collapsed sidebar links */
      #game-sidebar.collapsed .sidebar-menu li a {
        font-size: 0 !important;
        line-height: 0 !important;
      }

      #game-sidebar.collapsed .sidebar-menu li a * {
        font-size: 0 !important;
      }

      #game-sidebar.collapsed .sidebar-menu li a {
        padding: 12px 10px !important;
        justify-content: center !important;
        display: flex !important;
        align-items: center !important;
      }

      #game-sidebar.collapsed .sidebar-menu li a img {
        margin-right: 0 !important;
        width: 24px !important;
        height: 24px !important;
      }

      #game-sidebar.collapsed .expand-btn {
        display: none !important;
      }

      #game-sidebar.collapsed .sidebar-submenu {
        display: none !important;
      }

      /* Adjust main content when sidebar is collapsed */
      .main-wrapper.sidebar-collapsed .main-content {
        margin-left: 60px !important;
        transition: margin-left 0.3s ease;
      }

      /* Modern Sidebar Toggle Button */
      .sidebar-toggle-btn {
        position: absolute;
        top: 15px;
        right: 10px;
        background: linear-gradient(135deg, #45475a 0%, #3a3a3a 100%);
        border: 1px solid #555;
        color: #cdd6f4;
        width: 30px;
        height: 30px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .sidebar-toggle-btn:hover {
        background: linear-gradient(135deg, #585b70 0%, #4a4a4a 100%);
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      #game-sidebar.collapsed .sidebar-toggle-btn {
        right: 15px;
      }

      /* Modern Sidebar Header */
      .sidebar-header {
        border-bottom: 1px solid #333 !important;
        background: linear-gradient(135deg, #1a1a1a 0%, #0e0e0e 100%) !important;
      }

      .sidebar-header h2 {
        color: #fff !important;
        font-weight: 600 !important;
      }

      /* Custom Scrollbar for Sidebar */
      #game-sidebar::-webkit-scrollbar {
        width: 8px;
      }

      #game-sidebar::-webkit-scrollbar-track {
        background: linear-gradient(135deg, #1a1a1a 0%, #0e0e0e 100%);
        border-radius: 4px;
      }

      #game-sidebar::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
        border-radius: 4px;
        border: 1px solid #333;
      }

      #game-sidebar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, #3a3a3a 0%, #2e2e2e 100%);
      }

      /* Firefox scrollbar */
      #game-sidebar {
        scrollbar-width: thin;
        scrollbar-color: #2a2a2a #1a1a1a;
      }


      /* Topbar Settings Button */
      .topbar-settings-btn { 
        font-family: inherit; 
        font-size: 14px; 
        background: #212121; 
        color: white; 
        fill: rgb(155, 153, 153); 
        padding: 4px 8px; 
        display: flex; 
        align-items: center; 
        cursor: pointer; 
        border: none; 
        border-radius: 6px; 
        font-weight: 500;
        margin-left: 8px;
        transition: all 0.3s ease-in-out;
        height: 32px;
        flex-shrink: 0; /* Prevent compression */
        white-space: nowrap; /* Prevent text wrapping */
      }

      .topbar-settings-btn span { 
        display: block; 
        margin-left: 6px; 
        transition: all 0.3s ease-in-out;
        font-size: 12px;
      }

      .topbar-settings-btn svg { 
        display: block; 
        width: 16px;
        height: 16px;
        transform-origin: center center; 
        transition: transform 0.3s ease-in-out;
      }

      .topbar-settings-btn:hover { 
        background: #000;
      }

      .topbar-settings-btn:hover svg { 
        transform: scale(1.1); 
        fill: #fff;
      }

      .topbar-settings-btn:active { 
        transform: scale(0.95);
      }

      /* Fix topbar right section layout */
      .gtb-right {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        flex-wrap: nowrap !important;
      }

      .gtb-exp {
        flex-shrink: 1 !important;
        min-width: 100px !important;
      }

      /* Team selection buttons in sidebar */
      .pets-team-selection {
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
      }

      .pets-team-btn {
          padding: 8px 12px !important;
          border-radius: 4px !important;
          text-align: center !important;
          color: white !important;
          font-size: 12px !important;
          text-decoration: none !important;
          transition: opacity 0.2s ease !important;
      }

      .pets-team-btn:hover {
          opacity: 0.8 !important;
      }

      /* Pet naming styles */
      .pet-custom-name {
          font-size: 14px;
          font-weight: bold;
          color: #cba6f7;
          text-align: center;
          margin: 8px 0 4px 0;
          padding: 4px 8px;
          background: rgba(203, 166, 247, 0.1);
          border-radius: 6px;
          border: 1px solid rgba(203, 166, 247, 0.3);
          cursor: pointer;
          transition: all 0.3s ease;
          min-height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
      }

      .pet-custom-name:hover {
          background: rgba(203, 166, 247, 0.2);
          border-color: rgba(203, 166, 247, 0.5);
          transform: translateY(-1px);
      }

      .pet-custom-name.editing {
          background: rgba(30, 30, 46, 0.9);
          border-color: #cba6f7;
          cursor: text;
      }

      .pet-name-input {
          background: transparent;
          border: none;
          color: #cba6f7;
          font-size: 14px;
          font-weight: bold;
          text-align: center;
          width: 100%;
          outline: none;
          padding: 0;
      }

      .pet-name-input::placeholder {
          color: rgba(203, 166, 247, 0.5);
          font-style: italic;
      }

      .pet-name-actions {
          display: flex;
          gap: 4px;
          margin-top: 4px;
          justify-content: center;
      }

      .pet-name-btn {
          padding: 2px 6px;
          font-size: 10px;
          border-radius: 3px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
      }

      .pet-name-save {
          background: #a6e3a1;
          color: #1e1e2e;
      }

      .pet-name-save:hover {
          background: #94d3a2;
      }

      .pet-name-cancel {
          background: #f38ba8;
          color: white;
      }

      .pet-name-cancel:hover {
          background: #e85a7a;
      }

      .pet-name-edit-btn {
          position: absolute;
          top: 2px;
          right: 2px;
          background: rgba(203, 166, 247, 0.8);
          color: white;
          border: none;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          font-size: 10px;
          cursor: pointer;
          display: none;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
      }

      .pet-custom-name:hover .pet-name-edit-btn {
          display: flex;
      }

      .pet-name-edit-btn:hover {
          background: #cba6f7;
          transform: scale(1.1);
      }
    `;
    document.head.appendChild(style);

    initSidebarExpandables();
    initSettingsModal();
    createTopbarSettingsButton();
    fetchAndUpdateSidebarStats();
    
    // Refresh stats every 30 seconds
    setInterval(fetchAndUpdateSidebarStats, 30000);
  }

  function initSidebarExpandables() {
    // Initialize sidebar toggle functionality
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebar = document.getElementById('game-sidebar');
    const mainWrapper = document.querySelector('.main-wrapper');
    
    if (sidebarToggleBtn && sidebar && mainWrapper) {
      // Apply initial state
      if (extensionSettings.sidebarCollapsed) {
        sidebar.classList.add('collapsed');
        mainWrapper.classList.add('sidebar-collapsed');
        sidebarToggleBtn.textContent = '☰';
      }
      
      // Toggle function
      function toggleSidebar() {
        const isCollapsed = sidebar.classList.contains('collapsed');
        
        if (isCollapsed) {
          // Expand sidebar
          sidebar.classList.remove('collapsed');
          mainWrapper.classList.remove('sidebar-collapsed');
          sidebarToggleBtn.textContent = '☰';
          extensionSettings.sidebarCollapsed = false;
        } else {
          // Collapse sidebar
          sidebar.classList.add('collapsed');
          mainWrapper.classList.add('sidebar-collapsed');
          sidebarToggleBtn.textContent = '☰';
          extensionSettings.sidebarCollapsed = true;
        }
        
        saveSettings();
      }

      // Event listeners
      sidebarToggleBtn.addEventListener('click', toggleSidebar);
      
      // Header click functionality removed - use toggle button instead
    }

    const statsExpandBtn = document.getElementById('stats-expand-btn');
    const statsExpanded = document.getElementById('stats-expanded');

    if (statsExpandBtn && statsExpanded) {
      statsExpandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCollapsed = statsExpanded.classList.contains('collapsed');

        if (isCollapsed) {
          statsExpanded.classList.remove('collapsed');
          statsExpandBtn.textContent = '–';
          extensionSettings.statsExpanded = true;
        } else {
          statsExpanded.classList.add('collapsed');
          statsExpandBtn.textContent = '+';
          extensionSettings.statsExpanded = false;
        }

        saveSettings();
      });

      if (extensionSettings.statsExpanded) {
        statsExpanded.classList.remove('collapsed');
        statsExpandBtn.textContent = '–';
      } else {
        statsExpanded.classList.add('collapsed');
        statsExpandBtn.textContent = '+';
      }
    }

    // Add programmatic event listeners for stat upgrade buttons
    const upgradeControls = document.querySelectorAll('.upgrade-controls');
    upgradeControls.forEach(controls => {
      const plus1Btn = controls.querySelector('button:first-child');
      const plus5Btn = controls.querySelector('button:last-child');
      
      if (plus1Btn) {
        plus1Btn.addEventListener('click', () => {
          const statRow = controls.closest('.stat-upgrade-row');
          const stat = statRow?.dataset.stat || 'attack';
          sidebarAlloc(stat, 1);
        });
      }
      
      if (plus5Btn) {
        plus5Btn.addEventListener('click', () => {
          const statRow = controls.closest('.stat-upgrade-row');
          const stat = statRow?.dataset.stat || 'attack';
          sidebarAlloc(stat, 5);
        });
      }
    });

    const petsExpandBtn = document.getElementById('pets-expand-btn');
    const petsExpanded = document.getElementById('pets-expanded');

    if (petsExpandBtn && petsExpanded) {
      petsExpandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCollapsed = petsExpanded.classList.contains('collapsed');

        if (isCollapsed) {
          petsExpanded.classList.remove('collapsed');
          petsExpandBtn.textContent = '–';
          extensionSettings.petsExpanded = true;
        } else {
          petsExpanded.classList.add('collapsed');
          petsExpandBtn.textContent = '+';
          extensionSettings.petsExpanded = false;
        }

        saveSettings();
      });

      if (extensionSettings.petsExpanded) {
        petsExpanded.classList.remove('collapsed');
        petsExpandBtn.textContent = '–';
      }
    }

    const blacksmithExpandBtn = document.getElementById('blacksmith-expand-btn');
    const blacksmithExpanded = document.getElementById('blacksmith-expanded');

    if (blacksmithExpandBtn && blacksmithExpanded) {
      blacksmithExpandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCollapsed = blacksmithExpanded.classList.contains('collapsed');

        if (isCollapsed) {
          blacksmithExpanded.classList.remove('collapsed');
          blacksmithExpandBtn.textContent = '–';
          extensionSettings.blacksmithExpanded = true;
        } else {
          blacksmithExpanded.classList.add('collapsed');
          blacksmithExpandBtn.textContent = '+';
          extensionSettings.blacksmithExpanded = false;
        }

        saveSettings();
      });

      if (extensionSettings.blacksmithExpanded) {
        blacksmithExpanded.classList.remove('collapsed');
        blacksmithExpandBtn.textContent = '–';
      }
    }

    const merchantExpandBtn = document.getElementById('merchant-expand-btn');
    const merchantExpanded = document.getElementById('merchant-expanded');

    if (merchantExpandBtn && merchantExpanded) {
      merchantExpandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCollapsed = merchantExpanded.classList.contains('collapsed');

        if (isCollapsed) {
          merchantExpanded.classList.remove('collapsed');
          merchantExpandBtn.textContent = '–';
          extensionSettings.merchantExpanded = true;
        } else {
          merchantExpanded.classList.add('collapsed');
          merchantExpandBtn.textContent = '+';
          extensionSettings.merchantExpanded = false;
        }

        saveSettings();
        updateSidebarMerchantSection();
      });

      if (extensionSettings.merchantExpanded) {
        merchantExpanded.classList.remove('collapsed');
        merchantExpandBtn.textContent = '–';
      }
      updateSidebarMerchantSection();
    }

    const inventoryExpandBtn = document.getElementById('inventory-expand-btn');
    const inventoryExpanded = document.getElementById('inventory-expanded');

    if (inventoryExpandBtn && inventoryExpanded) {
      inventoryExpandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCollapsed = inventoryExpanded.classList.contains('collapsed');

        if (isCollapsed) {
          inventoryExpanded.classList.remove('collapsed');
          inventoryExpandBtn.textContent = '–';
          extensionSettings.inventoryExpanded = true;
        } else {
          inventoryExpanded.classList.add('collapsed');
          inventoryExpandBtn.textContent = '+';
          extensionSettings.inventoryExpanded = false;
        }

        saveSettings();
        updateSidebarInventorySection();
      });

      // Refresh inventory button
      const refreshBtn = document.getElementById('refresh-inventory-btn');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
          showNotification('Refreshing inventory quantities...', 'info');
          refreshPinnedItemQuantities();
        });
      }

      if (extensionSettings.inventoryExpanded) {
        inventoryExpanded.classList.remove('collapsed');
        inventoryExpandBtn.textContent = '–';
      }
      updateSidebarInventorySection();
    }

    // Battle Pass expand/collapse handler
    const battlePassExpandBtn = document.getElementById('battle-pass-expand-btn');
    const battlePassExpanded = document.getElementById('battle-pass-expanded');

    if (battlePassExpandBtn && battlePassExpanded) {
      battlePassExpandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCollapsed = battlePassExpanded.classList.contains('collapsed');

        if (isCollapsed) {
          battlePassExpanded.classList.remove('collapsed');
          battlePassExpandBtn.textContent = '–';
          extensionSettings.battlePassExpanded = true;
          // Load quests when expanded
          loadBattlePassQuests();
        } else {
          battlePassExpanded.classList.add('collapsed');
          battlePassExpandBtn.textContent = '+';
          extensionSettings.battlePassExpanded = false;
        }

        saveSettings();
      });

      // Refresh battle pass button
      const refreshBtn = document.getElementById('battle-pass-refresh-btn');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
          showNotification('Refreshing daily quests...', 'info');
          loadBattlePassQuests();
        });
      }

      // Load quests if already expanded
      if (extensionSettings.battlePassExpanded) {
        loadBattlePassQuests();
      }
    }
  }

  // Quest Widget Functions
  async function fetchQuestData() {
    const response = await fetch('battle_pass.php');
    const html = await response.text();
    return parseQuestData(html);
  }

  function parseQuestData(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const quests = [];
    const questElements = doc.querySelectorAll('.quest-item, .daily-quest');
    
    questElements.forEach(elem => {
      const title = elem.querySelector('.quest-title')?.textContent.trim() || 'Unknown Quest';
      const progress = elem.querySelector('.quest-progress')?.textContent.trim() || '';
      const reward = elem.querySelector('.quest-reward')?.textContent.trim() || '';
      const isComplete = elem.classList.contains('complete') || elem.querySelector('.complete');
      
      quests.push({ title, progress, reward, isComplete });
    });
    
    return quests;
  }

  // Sidebar Quest Widget Functions
  function initSidebarQuestWidget() {
    if (!extensionSettings.questWidget.enabled) return;
    
    const sidebar = document.querySelector('.sidebar, .game-sidebar');
    if (!sidebar) return;
    
    // Add quest widget section to sidebar
    const questSection = document.createElement('div');
    questSection.id = 'sidebar-quest-widget';
    questSection.style.cssText = 'background: #181825; border-radius: 8px; padding: 15px; margin-top: 15px;';
    
    questSection.innerHTML = `
      <h3 style="margin: 0 0 10px 0; color: #cba6f7; font-size: 16px;">Daily Quests</h3>
      <div id="sidebar-quests-list" style="display: grid; gap: 8px;">
        <div style="text-align: center; color: #6c7086;">Loading...</div>
      </div>
    `;
    
    sidebar.appendChild(questSection);
    updateSidebarQuestPanel();
  }

  async function updateSidebarQuestPanel() {
    const listContainer = document.getElementById('sidebar-quests-list');
    if (!listContainer) return;
    
    try {
      const quests = await fetchQuestData();
      
      if (quests.length === 0) {
        listContainer.innerHTML = '<div style="text-align: center; color: #6c7086;">No quests available</div>';
        return;
      }
      
      listContainer.innerHTML = quests.map(quest => `
        <div style="background: #11111b; padding: 10px; border-radius: 6px; ${quest.isComplete ? 'opacity: 0.6;' : ''}">
          <div style="font-size: 13px; color: ${quest.isComplete ? '#a6e3a1' : '#cdd6f4'}; font-weight: bold;">${quest.title}</div>
          <div style="font-size: 11px; color: #a6adc8; margin-top: 4px;">${quest.progress}</div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error updating quest panel:', error);
      listContainer.innerHTML = '<div style="text-align: center; color: #f38ba8;">Error loading quests</div>';
    }
  }

  // Loot Helper Functions
  function performLootAction(type, amount) {
    if (window.location.pathname.includes('active_wave.php')) {
      performCurrentPageLoot(type, amount);
    } else {
      // Default to wave 1 if not specified
      const wave = extensionSettings.gateGraktharWave || 1;
  performWaveLoot(type, amount, wave);
    }
  }

  function performCurrentPageLoot(type, amount) {
    const lootButtons = document.querySelectorAll('button[onclick*="loot"], a[href*="loot"]');
    let looted = 0;
    
    for (const btn of lootButtons) {
      if (type === 'unlocked' && !isLootUnlocked(btn)) continue;
      if (looted >= amount) break;
      
      btn.click();
      looted++;
    }
    
    showNotification(`Looted ${looted} monster(s)`, 'success');
  }

  async function performWaveLoot(type, amount, wave) {
    try {
      const html = await fetchWavePageHtml(wave);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      const lootButtons = doc.querySelectorAll('button[onclick*="loot"], a[href*="loot"]');
      let looted = 0;
      
      for (const btn of lootButtons) {
        if (type === 'unlocked' && !isLootUnlockedFromHTML(btn)) continue;
        if (looted >= amount) break;
        
        const onclick = btn.getAttribute('onclick') || btn.getAttribute('href') || '';
        const monsterIdMatch = onclick.match(/loot[=(](\d+)/);
        if (monsterIdMatch) {
          const result = await postAction('active_wave.php', { loot: monsterIdMatch[1] });
          if (result.success) looted++;
        }
      }
      
      showNotification(`Looted ${looted} monster(s) from wave ${wave}`, 'success');
      updateWaveData(true);
    } catch (error) {
      console.error('Error looting wave:', error);
      showNotification('Error looting monsters', '#e74c3c');
    }
  }

  function isLootUnlockedFromHTML(button) {
    const card = button.closest('.monster-card, .loot-card');
    if (!card) return false;
    
    // Check for locked indicators
    const isLocked = card.classList.contains('locked') || 
                     card.querySelector('.locked') ||
                     button.classList.contains('disabled') ||
                     button.disabled;
    
    return !isLocked;
  }

  function isLootUnlocked(button) {
    const card = button.closest('.monster-card, .loot-card');
    if (!card) return false;
    
    // Check damage requirement
    const damageElem = card.querySelector('.your-damage, .damage-done');
    if (damageElem) {
      const damageText = damageElem.textContent;
      const damageMatch = damageText.match(/(\d+)/);
      const damage = damageMatch ? parseInt(damageMatch[1]) : 0;
      
      // Check if damage meets requirement (usually > 0 or > certain threshold)
      return damage > 0;
    }
    
    return isLootUnlockedFromHTML(button);
  }

  function initFloatingLootHelper() {
    if (!extensionSettings.dungeonWave.enabled) return;
    
    // This would create a floating loot helper UI if needed
    // Implementation similar to potion helper
  }

  function createLootBox() {
    // Create floating loot helper box
    // Implementation would go here
  }

  // Function to load and display battle pass daily quests
  async function loadBattlePassQuests() {
    const questsContainer = document.getElementById('battle-pass-quests');
    if (!questsContainer) return;

    try {
      questsContainer.innerHTML = '<div class="loading-text">Loading quests...</div>';
      
      const response = await fetch('battle_pass.php');
      const html = await response.text();
      
      // Parse the HTML to extract quest information
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Find the daily quests card
      const questCards = doc.querySelectorAll('.card');
      let dailyQuestsCard = null;
      
      for (const card of questCards) {
        const title = card.querySelector('.title');
        if (title && title.textContent.includes('Daily Quests')) {
          dailyQuestsCard = card;
          break;
        }
      }
      
      if (!dailyQuestsCard) {
        questsContainer.innerHTML = '<div class="quest-empty">No daily quests found</div>';
        return;
      }
      
      // Extract all quests
      const quests = dailyQuestsCard.querySelectorAll('.quest');
      
      if (quests.length === 0) {
        questsContainer.innerHTML = '<div class="quest-empty">No active quests</div>';
        return;
      }
      
      let questsHTML = '';
      
      quests.forEach(quest => {
        const titleElement = quest.querySelector('strong');
        const mutedElements = quest.querySelectorAll('.muted');
        const progressBar = quest.querySelector('.progress > div');
        
        const questTitle = titleElement ? titleElement.textContent : 'Unknown Quest';
        const questDetails = mutedElements[0] ? mutedElements[0].textContent.trim() : '';
        const questProgress = mutedElements[1] ? mutedElements[1].textContent.trim() : '';
        const progressWidth = progressBar ? progressBar.style.width : '0%';
        const isCompleted = questProgress.includes('✅');
        
        questsHTML += `
          <div class="sidebar-quest ${isCompleted ? 'completed' : ''}">
            <div class="quest-title">${questTitle}</div>
            <div class="quest-details">${questDetails}</div>
            <div class="quest-progress-bar">
              <div class="quest-progress-fill" style="width: ${progressWidth}"></div>
            </div>
            <div class="quest-status">${questProgress}</div>
          </div>
        `;
      });
      
      questsContainer.innerHTML = questsHTML;
      
    } catch (error) {
      console.error('Error loading battle pass quests:', error);
      questsContainer.innerHTML = '<div class="quest-error">Failed to load quests</div>';
    }
  }

  function initSettingsModal() {
    // Settings modal is now handled by the topbar settings button
    // No sidebar settings link needed
  }

  function showSettingsModal() {
    let modal = document.getElementById('settings-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'settings-modal';
      modal.className = 'settings-modal';

      modal.innerHTML = `
          <div class="settings-container" style="box-sizing: content-box;">
            <div class="settings-header" style="box-sizing: inherit;">
              <h1>⚙️ Settings</h1>
            </div>

            <div class="settings-content" style="box-sizing: inherit;">
              <div class="settings-grid" style="box-sizing: inherit;">
                <!-- Updates Section -->
                <div style="display:flex; flex-direction:column; gap:8px;">
                  <div style="display:flex; align-items:center; gap:10px;">
                    <strong style="min-width:140px; color:#cdd6f4;">Current version:</strong>
                    <span id="current-version" style="color:#f9e2af;">—</span>
                  </div>
                  <div style="display:flex; align-items:center; gap:10px;">
                    <strong style="min-width:140px; color:#cdd6f4;">Latest release:</strong>
                    <span id="latest-version" style="color:#cdd6f4;">Not checked</span>
                  </div>
                  <div id="update-status" style="color:#a6adc8; font-size:12px;"></div>
                  <div style="display:flex; gap:10px; margin-top:6px;">
                    <button type="button" id="check-updates-btn" class="settings-button" style="background:#89b4fa;">🔎 Check now</button>
                    <button type="button" id="open-release-btn" class="settings-button" style="background:#a6e3a1;">⬇️ Open latest</button>
                  </div>
                  <div style="color:#6c7086; font-size:11px;" id="updates-last-checked"></div>
                </div>

                <!-- Customisation Wrapper -->
                <div class="settings-section">
                  <div class="settings-section-header" onclick="toggleSection(this)">
                    <h3>🛠️ Customisation</h3>
                    <span class="expand-icon">−</span>
                  </div>
                  <div class="settings-section-content">
                    <div class="color-input-group">
                      <input type="color" id="sidebar-custom-color" value="rgb(18,18,18)">
                      <label>Sidebar Color</label>
                    </div>
                    <p1 class="section-description">Set the main background color the sidebar.</p1>
                    <br>
                    <br>
                    <div class="color-input-group">
                      <input type="color" id="background-custom-color" value="#000000">
                      <label>Background Color</label>
                    </div>
                    <p1 class="section-description">Set the main background color for the application.</p1>
                    <br>
                    <hr style="border: 1px solid #45475a; margin: 20px 0;">
                    <div class="color-input-group">
                      <div id="monster-urls-container" style="margin-top: 20px;">
                        <h4 style="color: #cdd6f4; margin-bottom: 15px;">Monster Background URLs</h4>
                        <div id="monster-url-inputs">
                          <!-- Monster URL inputs will be populated here -->
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 10px;">
                          <button type="button" id="add-monster-url" class="settings-button" style="background: #89b4fa;">
                            ➕ Add Monster Background
                          </button>
                        </div>
                      </div>
                    </div>
                    <br>
                    <hr style="border: 1px solid #45475a; margin: 20px 0;">
                    <div class="color-input-group">
                      <div style="margin: 15px 0;">
                        <div id="custom-backgrounds-container" style="margin-top: 20px;">
                          <h4 style="color: #cdd6f4; margin-bottom: 15px;">Custom Background URLs</h4>
                          <div id="custom-bg-inputs">
                            <!-- Custom background inputs will be populated here -->
                          </div>
                          <button type="button" id="add-custom-bg" class="settings-button" style="background: #89b4fa; margin-top: 10px;">
                            ➕ Add Custom Background
                          </button>
                        </div>
                      </div>
                    </div>
                    <hr style="border: 1px solid #45475a; margin: 20px 0;">
                    <div class="color-input-group">
                      <!-- Border Color Section -->
                      <h4 style="color: #cdd6f4; margin-bottom: 15px;">Loot Card Customization</h4>
                      <div style="margin: 15px 0;">
                        <div class="color-input-group">
                          <input type="color" id="loot-card-custom-color" value="#f38ba8" 
                                style="width: 50px; height: 30px; border: none; border-radius: 4px; cursor: pointer;">
                          <label style="color: #cdd6f4; margin-left: 10px;">Custom Border Color</label>
                        </div>
                        <div>
                          <div style="margin-top: 10px;">
                            <input type="color" id="loot-highlighting-bg-color" value="#00ff1e" 
                                  style="width: 50px; height: 30px; border: none; border-radius: 4px; cursor: pointer;">
                            <span style="color: #cdd6f4; margin-left: 10px;">Highlight Background Color</span>
                          </div>
                        </div>
                        <div>
                          <div style="margin-top: 10px;">
                            <input type="color" id="loot-highlighting-glow-color" value="#ffd700" 
                                  style="width: 50px; height: 30px; border: none; border-radius: 4px; cursor: pointer;">
                            <span style="color: #cdd6f4; margin-left: 10px;">Highlight Glow Effect Color</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- PvP Battle Features Section -->
                <div class="settings-section">
                  <div class="settings-section-header">
                    <h3>⚔️ PvP Battle Features</h3>
                    <span class="expand-icon">–</span>
                  </div>
                  <div class="settings-section-content expanded">
                    <p style="color: #a6adc8; font-size: 12px; margin-bottom: 20px;">
                      Configure battle prediction and auto-surrender features for PvP battles.
                    </p>
                    
                    <!-- Battle Prediction Settings -->
                    <div style="margin-bottom: 25px; padding: 15px; background: rgba(49, 50, 68, 0.3); border-radius: 8px; border-left: 3px solid #89b4fa;">
                      <h4 style="color: #89b4fa; margin: 0 0 15px 0; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                        📊 Battle Prediction
                      </h4>
                      <p style="color: #a6adc8; font-size: 11px; margin-bottom: 15px;">
                        Show win/loss probability predictions during PvP battles.
                      </p>
                      <label style="display: flex; align-items: center; gap: 10px; color: #cdd6f4; margin-bottom: 15px;">
                        <input type="checkbox" id="pvp-prediction-enabled" class="cyberpunk-checkbox">
                        <span>Enable battle prediction</span>
                      </label>
                      
                      <div style="margin: 15px 0;">
                        <label style="color: #f9e2af; margin-bottom: 10px; display: block;">Analysis Start:</label>
                        <select id="pvp-analyze-after" style="width: 200px; padding: 8px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px;">
                          <option value="1">After 1st attack</option>
                          <option value="2" selected>After 2nd attack</option>
                          <option value="3">After 3rd attack</option>
                          <option value="4">After 4th attack</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="settings-section">
                  <div class="settings-section-header" id="menu-customization-header">
                    <h3>🎛️ Menu Customization</h3>
                    <span class="expand-icon" id="menu-customization-icon">${extensionSettings.menuCustomizationExpanded ? '–' : '+'}</span>
                  </div>
                  <div class="settings-section-content" id="menu-customization-content" style="display: ${extensionSettings.menuCustomizationExpanded ? 'block' : 'none'};">
                    <p style="color: #a6adc8; font-size: 12px; margin-bottom: 15px;">
                      Customize your sidebar menu by reordering items and hiding/showing them.
                    </p>
                    <div class="menu-customization-container">
                      <div class="menu-items-list" id="menu-items-list">
                        <!-- Menu items will be populated here -->
                      </div>
                      <div class="menu-customization-actions" style="margin-top: 15px; text-align: center;">
                        <button class="settings-button" id="reset-menu-customization" style="background: #f38ba8; margin-right: 10px;">
                          🔄 Reset to Default
                        </button>
                        <button class="settings-button" id="apply-menu-customization" style="background: #a6e3a1;">
                          ✅ Apply Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Gate Grakthar Wave Selection Section -->
                <div class="settings-section">
                  <div class="settings-section-header">
                    <h3>🚪 Wave Configuration</h3>
                    <span class="expand-icon">–</span>
                  </div>
                  <div class="settings-section-content expanded">
                    <p style="color: #a6adc8; font-size: 12px; margin-bottom: 15px;">
                      Choose which wave the sidebar button redirects to.
                    </p>
                    <div style="margin: 15px 0;">
                      <label style="color: #f9e2af; margin-bottom: 10px; display: block;">Wave:</label>
                      <select id="wave-selection" style="width: 250px; padding: 8px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px;">
                        <option value="3">Wave 1  - gate=3&wave=3</option>
                        <option value="5">Wave 2  - gate=3&wave=5</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Equipment Sets Configuration Section -->
                <div class="settings-section">
                  <div class="settings-section-header">
                    <h3>⚡ Equipment Sets</h3>
                    <span class="expand-icon">–</span>
                  </div>
                  <div class="settings-section-content expanded">
                    <p style="color: #a6adc8; font-size: 12px; margin-bottom: 15px;">
                      Equipment Sets are always enabled. Configure application delay between equipment changes.
                    </p>
                    <div style="margin: 15px 0;">
                      <label style="color: #f9e2af; margin-bottom: 10px; display: block;">Apply Delay (ms):</label>
                      <input type="number" id="equip-sets-delay" min="100" max="2000" step="50" value="350" 
                            style="width: 120px; padding: 8px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px;">
                      <small style="color: #6c7086; margin-left: 10px;">Delay between equipment changes</small>
                    </div>
                  </div>
                </div>

                <!-- Battle Modal Settings Section -->
                <div class="settings-section">
                  <div class="settings-section-header">
                    <h3>⚔️ Battle Modal System</h3>
                    <span class="expand-icon">+</span>
                  </div>
                  <div class="settings-section-content">
                    <p style="color: #a6adc8; font-size: 12px; margin-bottom: 20px;">
                      Enable modal-based battles instead of full page navigation. Opens battles in a popup overlay.
                    </p>
                    
                    <div style="margin-bottom: 25px; padding: 15px; background: rgba(49, 50, 68, 0.3); border-radius: 8px; border-left: 3px solid #89b4fa;">
                      <label style="display: flex; align-items: center; gap: 10px; color: #cdd6f4; margin-bottom: 15px;">
                        <input type="checkbox" id="battle-modal-enabled" class="cyberpunk-checkbox" style="appearance: none; width: 20px; height: 20px; border: 2px solid #89b4fa; border-radius: 5px; background-color: transparent; display: inline-block; position: relative; margin-right: 10px; cursor: pointer; transition: 0.3s; box-shadow: rgba(137, 180, 250, 0.4) 0px 0px 15px;">
                        <span style="font-weight: 600;">Enable Battle Modal System</span>
                      </label>
                      
                      <div style="margin: 15px 0;">
                        <label style="color: #f9e2af; margin-bottom: 10px; display: block;">Display Options:</label>
                        <div style="display: flex; flex-direction: column; gap: 10px; margin-left: 20px;">
                          <label style="display: flex; align-items: center; gap: 10px; color: #cdd6f4;">
                            <input type="checkbox" id="battle-modal-auto-close" class="cyberpunk-checkbox" style="appearance: none; width: 18px; height: 18px; border: 2px solid #a6e3a1; border-radius: 4px; background-color: transparent;">
                            <span>Auto-close when monster defeated</span>
                          </label>
                          <label style="display: flex; align-items: center; gap: 10px; color: #cdd6f4;">
                            <input type="checkbox" id="battle-modal-show-loot" class="cyberpunk-checkbox" style="appearance: none; width: 18px; height: 18px; border: 2px solid #a6e3a1; border-radius: 4px; background-color: transparent;">
                            <span>Show loot modal after looting</span>
                          </label>
                          <label style="display: flex; align-items: center; gap: 10px; color: #cdd6f4;">
                            <input type="checkbox" id="battle-modal-show-loot-preview" class="cyberpunk-checkbox" style="appearance: none; width: 18px; height: 18px; border: 2px solid #a6e3a1; border-radius: 4px; background-color: transparent;">
                            <span>Show loot preview in modal</span>
                          </label>
                          <label style="display: flex; align-items: center; gap: 10px; color: #cdd6f4;">
                            <input type="checkbox" id="battle-modal-show-logs" class="cyberpunk-checkbox" style="appearance: none; width: 18px; height: 18px; border: 2px solid #a6e3a1; border-radius: 4px; background-color: transparent;">
                            <span>Show attack logs</span>
                          </label>
                          <label style="display: flex; align-items: center; gap: 10px; color: #cdd6f4;">
                            <input type="checkbox" id="battle-modal-show-leaderboard" class="cyberpunk-checkbox" style="appearance: none; width: 18px; height: 18px; border: 2px solid #a6e3a1; border-radius: 4px; background-color: transparent;">
                            <span>Show leaderboard</span>
                          </label>
                          <label style="display: flex; align-items: center; gap: 10px; color: #cdd6f4;">
                            <input type="checkbox" id="battle-modal-show-player-info" class="cyberpunk-checkbox" style="appearance: none; width: 18px; height: 18px; border: 2px solid #a6e3a1; border-radius: 4px; background-color: transparent;">
                            <span>Show player info</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Hotkeys Section -->
                <div class="settings-section">
                  <div class="settings-section-header" onclick="toggleSection(this)">
                    <h3>⌨️ Hotkeys</h3>
                    <span class="expand-icon">+</span>
                  </div>
                  <div class="settings-section-content">
                    <p style="color:#a6adc8; font-size:12px; margin-bottom:12px;">
                      Configure keyboard shortcuts for faster navigation and combat. Changes apply instantly.
                    </p>

                    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:10px;">
                      <label style="display:flex; align-items:center; gap:10px; color:#cdd6f4;">
                        <input type="checkbox" id="hotkeys-enabled" class="cyberpunk-checkbox">
                        <span>Enable hotkeys</span>
                      </label>
                      <label style="display:flex; align-items:center; gap:10px; color:#cdd6f4;">
                        <input type="checkbox" id="hotkeys-monster-selection" class="cyberpunk-checkbox">
                        <span>Enable monster selection on wave pages</span>
                      </label>
                      <label style="display:flex; align-items:center; gap:10px; color:#cdd6f4;">
                        <input type="checkbox" id="hotkeys-show-overlays" class="cyberpunk-checkbox">
                        <span>Show key overlays on cards and buttons</span>
                      </label>
                      <label style="display:flex; align-items:center; gap:10px; color:#cdd6f4;">
                        <input type="checkbox" id="hotkeys-battle-attacks" class="cyberpunk-checkbox">
                        <span>Enable battle attack hotkeys in modal</span>
                      </label>
                    </div>

                    <div style="margin-top:10px; padding:12px; background:rgba(49,50,68,.3); border-radius:8px; border-left:3px solid #89b4fa;">
                      <h4 style="color:#89b4fa; margin:0 0 10px 0; font-size:14px;">Monster selection keys (wave pages)</h4>
                      <div style="display:grid; grid-template-rows: repeat(9, 1fr); gap:8px;">
                        ${[1,2,3,4,5,6,7,8,9].map(i => `
                          <input id="hotkey-monster-${i}" maxlength="1" placeholder="${i}" style="text-transform:uppercase; padding:6px; background:#1e1e2e; color:#cdd6f4; border:1px solid #45475a; border-radius:4px; text-align:center;">`
                        ).join('')}
                      </div>
                      <div style="margin-top:8px; text-align:right;">
                        <button id="hotkeys-reset-monster-keys" class="settings-button" style="background:#a6e3a1;">Reset 1-9</button>
                      </div>
                    </div>

                    <div style="margin-top:12px; padding:12px; background:rgba(49,50,68,.3); border-radius:8px; border-left:3px solid #89b4fa;">
                      <h4 style="color:#89b4fa; margin:0 0 10px 0; font-size:14px;">Battle attack keys (modal)</h4>
                      <div style="display:grid; grid-template-columns: auto 70%; row-gap:8px; column-gap:12px; align-items:center;">
                        ${['Slash','Power','Heroic','Ultimate','Legendary'].map((label,i) => `
                          <label for="hotkey-attack-${i+1}" style="color:#cdd6f4; text-align:left; padding-right:6px;">${label}</label>
                          <input id="hotkey-attack-${i+1}" maxlength="1" placeholder="${['S','P','H','U','L'][i]}" style="text-transform:uppercase; padding:6px; background:#1e1e2e; color:#cdd6f4; border:1px solid #45475a; border-radius:4px; text-align:center;">`
                        ).join('')}
                      </div>
                      <div style="margin-top:8px; text-align:right;">
                        <button id="hotkeys-reset-attack-keys" class="settings-button" style="background:#a6e3a1;">Reset SPHUL</button>
                      </div>
                    </div>
                  </div>
                </div>



                <div style="text-align: center; margin-top: 30px;">
                  <button class="settings-button" data-action="close">Close</button>
                  <button class="settings-button" data-action="reset">Reset to Default</button>
                  <button class="settings-button" data-action="clear" style="background: #f38ba8;">Clear All Data</button>
                </div>
              </div>
            </div>
          </div>
      `;


      document.body.appendChild(modal);
      setupColorSelectors();
      updateColorSelections();
      setupMonsterBackgroundControls();
      setupLootHighlightingSettings();
      setupCustomBackgroundSettings();
  setupPvPAutoSurrenderSettings();
  setupWaveSelectionSettings();
      setupEquipSetsSettings();
      setupBattleModalSettings();
      setupHotkeySettings();
  setupUpdateCheckerSettings();
      setupMenuCustomizationListeners();
      // Initialize all cyberpunk checkboxes
      initializeAllCheckboxes();
      setupSettingsModalListeners();

      // Add expand/collapse listeners to all settings-section-header elements
      const sectionHeaders = modal.querySelectorAll('.settings-section-header');
      sectionHeaders.forEach(header => {
        header.addEventListener('click', function() {
          window.toggleSection(header);
        });
      });
    }

// Make toggleSection globally available for all pages
window.toggleSection = function(header) {
  const sectionContent = header.parentElement.querySelector('.settings-section-content');
  const icon = header.querySelector('.expand-icon');
  if (sectionContent) {
    sectionContent.classList.toggle('expanded');
    if (sectionContent.classList.contains('expanded')) {
      icon.textContent = '−';
      icon.style.transform = 'rotate(0deg)';
    } else {
      icon.textContent = '+';
      icon.style.transform = 'rotate(0deg)';
    }
  }
};

    modal.style.display = 'flex';

      // Add event listener for the Close button
      const closeBtn = modal.querySelector('button[data-action="close"]');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          closeSettingsModal();
        });
      }

      // Add event listener for the Reset button
      const resetBtn = modal.querySelector('button[data-action="reset"]');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          // Reset settings to defaults and update UI
          resetSettings();
          try { updateColorSelections(); } catch (e) {}
        });
      }

      // Add event listener for the Clear All Data button
      const clearBtn = modal.querySelector('button[data-action="clear"]');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          clearAllData();
        });
      }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeSettingsModal();
      }
    });
  }

  // ===== Update Checker =====
  function normalizeVersion(v) {
    if (!v) return '0.0.0';
    const s = String(v).trim().replace(/^v/i, '');
    const parts = s.split('.').map(p => parseInt(p, 10)).filter(n => !Number.isNaN(n));
    while (parts.length < 3) parts.push(0);
    return parts.slice(0,3).join('.');
  }

  function compareVersions(a, b) {
    const ax = normalizeVersion(a).split('.').map(Number);
    const bx = normalizeVersion(b).split('.').map(Number);
    for (let i=0;i<3;i++) {
      if (ax[i] < bx[i]) return -1;
      if (ax[i] > bx[i]) return 1;
    }
    return 0;
  }

  async function fetchLatestReleaseInfo() {
    const url = 'https://api.github.com/repos/DBerkey/ui-addon/releases/latest';
    const res = await fetch(url, { headers: { 'Accept': 'application/vnd.github+json' } });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const data = await res.json();
    const tag = data.tag_name || data.name || '';
    return {
      version: normalizeVersion(tag || data.name || ''),
      url: data.html_url || 'https://github.com/DBerkey/ui-addon/releases/latest',
      name: data.name || tag || 'Latest release',
      publishedAt: data.published_at || ''
    };
  }

  async function checkForUpdates(options = {}) {
    const { force = false, updateUI = true } = options;
    try {
      if (!extensionSettings.updates) extensionSettings.updates = { autoCheck: true, lastChecked: 0, latestKnownVersion: '', latestUrl: '' };

      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      if (!force && extensionSettings.updates.lastChecked && (now - extensionSettings.updates.lastChecked) < dayMs) {
        if (updateUI) updateUpdateSectionUI();
        return { skipped: true };
      }

      // Indicate checking
      if (updateUI) {
        const statusEl = document.getElementById('update-status');
        if (statusEl) statusEl.textContent = 'Checking for updates…';
      }

      const info = await fetchLatestReleaseInfo();
      extensionSettings.updates.latestKnownVersion = info.version;
      extensionSettings.updates.latestUrl = info.url;
      extensionSettings.updates.lastChecked = now;
      saveSettings();

      if (updateUI) updateUpdateSectionUI();
      return info;
    } catch (e) {
      console.error('Update check failed:', e);
      if (updateUI) {
        const statusEl = document.getElementById('update-status');
        if (statusEl) statusEl.textContent = `Update check failed: ${e.message}`;
      }
      return { error: e };
    }
  }

  function updateUpdateSectionUI() {
    try {
      const manifestVersion = (typeof chrome !== 'undefined' && chrome?.runtime?.getManifest) ? (chrome.runtime.getManifest().version || '0.0.0') : '0.0.0';
      const currentEl = document.getElementById('current-version');
      if (currentEl) currentEl.textContent = manifestVersion;

      const lastEl = document.getElementById('updates-last-checked');
      if (lastEl && extensionSettings.updates?.lastChecked) {
        const d = new Date(extensionSettings.updates.lastChecked);
        lastEl.textContent = `Last checked: ${d.toLocaleString()}`;
      } else if (lastEl) {
        lastEl.textContent = '';
      }

      const latestVer = extensionSettings.updates?.latestKnownVersion || '';
      const latestEl = document.getElementById('latest-version');
      if (latestEl) latestEl.textContent = latestVer || 'Not checked';

      const statusEl = document.getElementById('update-status');
      if (statusEl && latestVer) {
        const cmp = compareVersions(manifestVersion, latestVer);
        if (cmp < 0) {
          statusEl.textContent = `A new version is available: v${latestVer}`;
          statusEl.style.color = '#a6e3a1';
        } else if (cmp === 0) {
          statusEl.textContent = 'You are up to date.';
          statusEl.style.color = '#89b4fa';
        } else {
          statusEl.textContent = 'You are ahead of the latest release.';
          statusEl.style.color = '#f9e2af';
        }
      }

      const openBtn = document.getElementById('open-release-btn');
      if (openBtn) openBtn.disabled = !extensionSettings.updates?.latestUrl;
      const autoChk = document.getElementById('updates-auto-check');
      if (autoChk) autoChk.checked = !!extensionSettings.updates?.autoCheck;
    } catch (e) {
      console.error('Failed to update Updates section UI:', e);
    }
  }

  function setupUpdateCheckerSettings() {
    try {
      updateUpdateSectionUI();
      const checkBtn = document.getElementById('check-updates-btn');
      const openBtn = document.getElementById('open-release-btn');
      const autoChk = document.getElementById('updates-auto-check');

      checkBtn?.addEventListener('click', () => {
        checkForUpdates({ force: true, updateUI: true });
      });
      openBtn?.addEventListener('click', () => {
        const url = extensionSettings.updates?.latestUrl || 'https://github.com/DBerkey/ui-addon/releases/latest';
        window.open(url, '_blank');
      });
      autoChk?.addEventListener('change', () => {
        if (!extensionSettings.updates) extensionSettings.updates = { autoCheck: true, lastChecked: 0, latestKnownVersion: '', latestUrl: '' };
        extensionSettings.updates.autoCheck = !!autoChk.checked;
        saveSettings();
      });
    } catch (e) {
      console.error('setupUpdateCheckerSettings error', e);
    }
  }

  function setupColorSelectors() {
      // Sidebar color picker
      const sidebarColorInput = document.getElementById('sidebar-custom-color');
      if (sidebarColorInput) {
        sidebarColorInput.addEventListener('change', () => {
          extensionSettings.sidebarColor = sidebarColorInput.value;
        saveSettings();
        applySettings();
        });
      }

      // Background color picker
      const backgroundColorInput = document.getElementById('background-custom-color');
      if (backgroundColorInput) {
        backgroundColorInput.addEventListener('change', () => {
          extensionSettings.backgroundColor = backgroundColorInput.value;
        saveSettings();
        applySettings();
      });
      }

    // Monster image outline color picker
      const monsterImageColorInput = document.getElementById('monster-image-custom-color');
      if (monsterImageColorInput) {
        monsterImageColorInput.addEventListener('change', () => {
          extensionSettings.monsterImageOutlineColor = monsterImageColorInput.value;
        saveSettings();
        applySettings();
      });
      }

    // Loot card border color picker - removed duplicate, handled below

    // Custom color pickers
    const monsterImageCustomColor = document.getElementById('monster-image-custom-color');
    if (monsterImageCustomColor) {
      monsterImageCustomColor.value = extensionSettings.monsterImageOutlineColor;
      monsterImageCustomColor.addEventListener('change', (e) => {
        extensionSettings.monsterImageOutlineColor = e.target.value;
        saveSettings();
        applySettings();
      });
    }

    const lootCardCustomColor = document.getElementById('loot-card-custom-color');
    if (lootCardCustomColor) {
      lootCardCustomColor.value = extensionSettings.lootCardBorderColor;
      lootCardCustomColor.addEventListener('change', (e) => {
        extensionSettings.lootCardBorderColor = e.target.value;
        saveSettings();
        applySettings();
      });
    }
  }

  function setupMenuCustomizationListeners() {
    // Menu customization header click
    const header = document.getElementById('menu-customization-header');
    if (header) {
      header.addEventListener('click', function(e) {
        // Prevent the global header click listener from also toggling this section
        if (e && typeof e.stopImmediatePropagation === 'function') {
          e.stopImmediatePropagation();
        }

        extensionSettings.menuCustomizationExpanded = !extensionSettings.menuCustomizationExpanded;
        const content = document.getElementById('menu-customization-content');
        const icon = document.getElementById('menu-customization-icon');

        if (content && icon) {
          // Use the same "expanded" class the global toggle uses to avoid conflicting display logic
          content.classList.toggle('expanded', extensionSettings.menuCustomizationExpanded);
          icon.textContent = extensionSettings.menuCustomizationExpanded ? '–' : '+';

          if (extensionSettings.menuCustomizationExpanded) {
            populateMenuItemsList();
          }
        }

        saveSettings();
      });
    }

    // Reset button
    const resetBtn = document.getElementById('reset-menu-customization');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        // Try to restore menu items from localStorage 'uiaddon_side_names' first.
        try {
          const stored = localStorage.getItem('uiaddon_side_names');
          if (stored) {
            try {
              const names = JSON.parse(stored);
              if (Array.isArray(names) && names.length) {
                const seen = new Set();
                extensionSettings.menuItems = names.map((nm, idx) => {
                  const raw = String(nm || '').trim();
                  let baseId = raw.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
                  if (!baseId) baseId = `item_${idx}`;
                  let id = baseId;
                  let suffix = 1;
                  while (seen.has(id)) {
                    id = `${baseId}_${suffix++}`;
                  }
                  seen.add(id);
                  return { id, name: raw || `Item ${idx + 1}`, visible: true, order: idx };
                });
              } else {
                extensionSettings.menuItems = JSON.parse(JSON.stringify(DEFAULT_EXTENSION_SETTINGS.menuItems || []));
              }
            } catch (e) {
              console.error('Failed to parse uiaddon_side_names from storage, falling back to defaults', e);
              extensionSettings.menuItems = JSON.parse(JSON.stringify(DEFAULT_EXTENSION_SETTINGS.menuItems || []));
            }
          } else {
            // No stored value — restore default menu
            extensionSettings.menuItems = JSON.parse(JSON.stringify(DEFAULT_EXTENSION_SETTINGS.menuItems || []));
          }
        } catch (err) {
          console.error('Error resetting menu customization from storage, using defaults', err);
          extensionSettings.menuItems = JSON.parse(JSON.stringify(DEFAULT_EXTENSION_SETTINGS.menuItems || []));
        }

        saveSettings();
        populateMenuItemsList();
        showNotification('Menu customization reset', 'success');
      });
    }

    // Apply button
    const applyBtn = document.getElementById('apply-menu-customization');
    if (applyBtn) {
      applyBtn.addEventListener('click', function() {
        saveSettings();
        // Reorder and hide side drawer items according to saved names in storage
        try { applySideDrawerNamesFromStorage(); } catch (e) { console.error('applySideDrawerNamesFromStorage failed on apply', e); }
      });
    }
  }

  function setupMultiplePotionSettings() {
    const enabledCheckbox = document.getElementById('multiple-pots-enabled');
    const countInput = document.getElementById('multiple-pots-count');
    
    if (enabledCheckbox) {
      enabledCheckbox.checked = extensionSettings.multiplePotsEnabled;
      enabledCheckbox.addEventListener('change', (e) => {
        extensionSettings.multiplePotsEnabled = e.target.checked;
        saveSettings();
        updateSidebarInventorySection();
      });
    }
    
    if (countInput) {
      countInput.value = extensionSettings.multiplePotsCount;
      countInput.addEventListener('change', (e) => {
        const value = Math.max(2, Math.min(10, parseInt(e.target.value) || 3));
        extensionSettings.multiplePotsCount = value;
        e.target.value = value;
        saveSettings();
        updateSidebarInventorySection();
      });
    }
  }


  function setupMonsterBackgroundControls() {
    const effectSelect = document.getElementById('monster-bg-effect');
    const overlayToggle = document.getElementById('monster-bg-overlay');
    const overlayOpacitySlider = document.getElementById('monster-bg-overlay-opacity');
    const opacityValueSpan = document.getElementById('monster-bg-opacity-value');
    

    
    if (effectSelect) {
      effectSelect.value = extensionSettings.monsterBackgrounds.effect;
      effectSelect.addEventListener('change', (e) => {
        extensionSettings.monsterBackgrounds.effect = e.target.value;
        saveSettings();
        applyMonsterBackgrounds();
      });
    }
    
    // Update overlay toggle to show current state and handle changes
    if (overlayToggle) {
      overlayToggle.checked = extensionSettings.monsterBackgrounds.overlay;
      overlayToggle.addEventListener('change', (e) => {
        const newState = e.target.checked;
        extensionSettings.monsterBackgrounds.overlay = newState;
        saveSettings();
        applyMonsterBackgrounds();

      });
    }
    
    if (overlayOpacitySlider && opacityValueSpan) {
      overlayOpacitySlider.value = extensionSettings.monsterBackgrounds.overlayOpacity;
      opacityValueSpan.textContent = Math.round(extensionSettings.monsterBackgrounds.overlayOpacity * 100) + '%';
      
      overlayOpacitySlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        extensionSettings.monsterBackgrounds.overlayOpacity = value;
        opacityValueSpan.textContent = Math.round(value * 100) + '%';
        saveSettings();
        applyMonsterBackgrounds();
      });
    }
      
    
    // Populate existing monster URLs
    populateMonsterUrlInputs();
    
    // Use event delegation for the add button, save button, and remove buttons
    document.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'add-monster-url') {
        e.preventDefault();
        addMonsterUrlInput();
      } else if (e.target && e.target.id === 'save-monster-backgrounds') {
        e.preventDefault();
        updateMonsterUrlMapping();
        showNotification('Monster backgrounds saved successfully!', 'success');
      } else if (e.target && e.target.getAttribute('data-action') === 'remove-monster-url') {
        e.preventDefault();
        removeMonsterUrlInput(e.target);
      }
    });
  }


    function setupLootHighlightingSettings() {
      const backgroundColorInput = document.getElementById('loot-highlighting-bg-color');
      const glowColorInput = document.getElementById('loot-highlighting-glow-color');
      
      if (backgroundColorInput) {
        // Convert RGB to hex for the color input
        const bgColor = extensionSettings.lootHighlighting.backgroundColor;
        const hexColor = rgbToHex(bgColor);
        backgroundColorInput.value = hexColor;
        backgroundColorInput.addEventListener('change', (e) => {
          const rgbColor = hexToRgb(e.target.value);
          extensionSettings.lootHighlighting.backgroundColor = `rgb(${rgbColor.r} ${rgbColor.g} ${rgbColor.b} / 20%)`;
        saveSettings();
          highlightLootCards(); // Re-apply highlighting with new colors
        });
      }
      
      if (glowColorInput) {
        // Convert RGBA to hex for the color input
        const glowColor = extensionSettings.lootHighlighting.glowColor;
        const hexColor = rgbaToHex(glowColor);
        glowColorInput.value = hexColor;
        glowColorInput.addEventListener('change', (e) => {
          const rgbaColor = hexToRgba(e.target.value, 0.6);
          extensionSettings.lootHighlighting.glowColor = rgbaColor;
        saveSettings();
          highlightLootCards(); // Re-apply highlighting with new colors
        });
      }
    }

    // Helper functions for color conversion
    function rgbToHex(rgb) {
      const match = rgb.match(/rgb\((\d+)\s+(\d+)\s+(\d+)/);
      if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      }
      return "#00ff1e"; // Default green
    }

    function rgbaToHex(rgba) {
      const match = rgba.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
      if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      }
      return "#ffd700"; // Default gold
    }

    function hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 255, b: 30 };
    }

    function hexToRgba(hex, alpha) {
      const rgb = hexToRgb(hex);
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    }

    function updateCheckboxVisualState(checkbox) {
      if (checkbox.checked) {
        checkbox.style.borderColor = '#f9e2af';
        checkbox.style.boxShadow = '0 0 15px rgba(249, 226, 175, 0.4)';
        // Add a visual checkmark
        if (!checkbox.dataset.checkmarkAdded) {
          const checkmark = document.createElement('div');
          checkmark.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 8px;
            height: 8px;
            background-color: #f9e2af;
            border-radius: 2px;
            z-index: 1;
          `;
          checkbox.appendChild(checkmark);
          checkbox.dataset.checkmarkAdded = 'true';
        }
      } else {
        checkbox.style.borderColor = '#cba6f7';
        checkbox.style.boxShadow = 'none';
        // Remove visual checkmark
        const checkmark = checkbox.querySelector('div');
        if (checkmark) {
          checkmark.remove();
          delete checkbox.dataset.checkmarkAdded;
        }
      }
    }

    function initializeAllCheckboxes() {
      // Initialize all cyberpunk checkboxes
      const checkboxes = document.querySelectorAll('.cyberpunk-checkbox');
      
      checkboxes.forEach((checkbox, index) => {
        // Ensure the checkbox has the proper styling
        checkbox.style.appearance = 'none';
        checkbox.style.width = '20px';
        checkbox.style.height = '20px';
        checkbox.style.border = '2px solid #cba6f7';
        checkbox.style.borderRadius = '5px';
        checkbox.style.backgroundColor = 'transparent';
        checkbox.style.display = 'inline-block';
        checkbox.style.position = 'relative';
        checkbox.style.marginRight = '10px';
        checkbox.style.cursor = 'pointer';
        checkbox.style.transition = 'all 0.3s ease';
        
        // Add click handler for visual updates
        checkbox.addEventListener('click', (e) => {
          setTimeout(() => {
            updateCheckboxVisualState(e.target);
          }, 10);
        });
        
        // Force the visual state to match the checked property
        updateCheckboxVisualState(checkbox);
      });
    }

    function setupCustomBackgroundSettings() {
      const enabledCheckbox = document.getElementById('custom-backgrounds-enabled');
      
      if (enabledCheckbox) {
        // Force the checkbox to the correct state
        enabledCheckbox.checked = extensionSettings.customBackgrounds.enabled;
        
        // Update visual state
        updateCheckboxVisualState(enabledCheckbox);
        
        // Remove any existing listeners first
        enabledCheckbox.removeEventListener('change', handleCustomBackgroundToggle);
        
        // Add the event listener
        enabledCheckbox.addEventListener('change', handleCustomBackgroundToggle);
        
        // Also add click listener as backup
        enabledCheckbox.addEventListener('click', (e) => {
          setTimeout(() => {
            updateCheckboxVisualState(e.target);
            handleCustomBackgroundToggle(e);
          }, 10);
        });
      }
      
      function handleCustomBackgroundToggle(e) {
        extensionSettings.customBackgrounds.enabled = e.target.checked;
        saveSettings();
        applyCustomBackgrounds();
      }

      // Populate existing custom backgrounds
      populateCustomBgInputs();
      
      // Use event delegation for the add button and remove buttons
      document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'add-custom-bg') {
          e.preventDefault();
          addCustomBgInput();
        } else if (e.target && e.target.getAttribute('data-action') === 'remove-custom-bg') {
          e.preventDefault();
          removeCustomBgInput(e.target);
        }
      });
    }

    function populateCustomBgInputs() {
      const container = document.getElementById('custom-bg-inputs');
      if (!container) return;
      
      container.innerHTML = '';
      
      // Ensure backgrounds object exists
      if (!extensionSettings.customBackgrounds.backgrounds) {
        extensionSettings.customBackgrounds.backgrounds = {};
      }
      
      Object.entries(extensionSettings.customBackgrounds.backgrounds).forEach(([page, bgData], index) => {
        // Handle both old format (string URL) and new format (object with url and effect)
        const url = typeof bgData === 'string' ? bgData : bgData.url;
        const effect = typeof bgData === 'string' ? 'normal' : bgData.effect;
        addCustomBgInput(page, url, index, effect);
      });
    }

    function addCustomBgInput(page = '', url = '', index = null, effect = 'normal') {
      const container = document.getElementById('custom-bg-inputs');
      if (!container) {
        return;
      }
      
      const inputIndex = index !== null ? index : Object.keys(extensionSettings.customBackgrounds.backgrounds).length;
      
      const inputDiv = document.createElement('div');
      inputDiv.style.cssText = 'display: flex; gap: 8px; margin-bottom: 10px; align-items: center;';
      inputDiv.innerHTML = `
        <input type="text" placeholder="Page Path (e.g., /battle.php)" 
               value="${page}" 
               style="width: 150px; padding: 6px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;"
               class="custom-bg-page-input">
        <input type="url" placeholder="Image URL" 
               value="${url}" 
               style="width: 200px; padding: 6px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;"
               class="custom-bg-url-input">
        <select class="custom-bg-effect-select" style="width: 100px; padding: 6px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;">
          <option value="normal" ${effect === 'normal' ? 'selected' : ''}>Normal</option>
          <option value="gradient" ${effect === 'gradient' ? 'selected' : ''}>Gradient</option>
          <option value="blur" ${effect === 'blur' ? 'selected' : ''}>Blur</option>
          <option value="pattern" ${effect === 'pattern' ? 'selected' : ''}>Pattern</option>
        </select>
        <button class="settings-button" style="margin-top: 0px; background: #f38ba8; padding: 6px 10px; font-size: 12px; min-width: 40px;" data-action="remove-custom-bg">
          🗑️
        </button>
      `;
      
      container.appendChild(inputDiv);
      
      // Add input event listeners for real-time updates
      const pageInput = inputDiv.querySelector('.custom-bg-page-input');
      const urlInput = inputDiv.querySelector('.custom-bg-url-input');
      const effectSelect = inputDiv.querySelector('.custom-bg-effect-select');
      
      function updateCustomBackground() {
        const oldPage = page;
        const newPage = pageInput.value.trim();
        const newUrl = urlInput.value.trim();
        const newEffect = effectSelect.value;
        
        if (oldPage && oldPage !== newPage) {
          delete extensionSettings.customBackgrounds.backgrounds[oldPage];
        }
        
        if (newPage && newUrl) {
          extensionSettings.customBackgrounds.backgrounds[newPage] = {
            url: newUrl,
            effect: newEffect
          };
          page = newPage;
        }
        
        saveSettings();
        applyCustomBackgrounds();
      }
      
      pageInput.addEventListener('blur', updateCustomBackground);
      urlInput.addEventListener('blur', updateCustomBackground);
      effectSelect.addEventListener('change', updateCustomBackground);
    }

    function removeCustomBgInput(button) {
      const inputDiv = button.closest('div');
      const pageInput = inputDiv.querySelector('.custom-bg-page-input');
      const page = pageInput.value.trim();
      
      if (page && extensionSettings.customBackgrounds.backgrounds[page]) {
        delete extensionSettings.customBackgrounds.backgrounds[page];
        saveSettings();
        applyCustomBackgrounds();
      }
      
      inputDiv.remove();
    }

    function setupLootColorSelectors() {
    // Unlocked colors
    document.querySelectorAll('#loot-unlocked-colors .color-option').forEach(option => {
      option.addEventListener('click', () => {
        const color = option.getAttribute('data-color');
        extensionSettings.lootPanelColors.unlockedColor = color;
        document.getElementById('loot-unlocked-custom-color').value = color;
        saveSettings();
        applyLootPanelColors();
        updateLootColorSelections();
      });
    });
    
    // Locked colors
    document.querySelectorAll('#loot-locked-colors .color-option').forEach(option => {
      option.addEventListener('click', () => {
        const color = option.getAttribute('data-color');
        extensionSettings.lootPanelColors.lockedColor = color;
        document.getElementById('loot-locked-custom-color').value = color;
        saveSettings();
        applyLootPanelColors();
        updateLootColorSelections();
      });
    });
  }

  function updateLootColorSelections() {
    // Update unlocked color selections
    document.querySelectorAll('#loot-unlocked-colors .color-option').forEach(option => {
      option.classList.remove('selected');
      if (option.getAttribute('data-color') === extensionSettings.lootPanelColors.unlockedColor) {
        option.classList.add('selected');
      }
    });
    
    // Update locked color selections
    document.querySelectorAll('#loot-locked-colors .color-option').forEach(option => {
      option.classList.remove('selected');
      if (option.getAttribute('data-color') === extensionSettings.lootPanelColors.lockedColor) {
        option.classList.add('selected');
      }
    });
  }



  function setupPvPAutoSurrenderSettings() {
    // Battle Prediction Settings
    const predictionEnabledCheckbox = document.getElementById('pvp-prediction-enabled');
    const analyzeAfterSelect = document.getElementById('pvp-analyze-after');
    
    // Auto-Surrender Settings
    const surrenderEnabledCheckbox = document.getElementById('pvp-auto-surrender-enabled');
    const thresholdSelect = document.getElementById('pvp-surrender-threshold');
    
    if (predictionEnabledCheckbox) {
      predictionEnabledCheckbox.checked = extensionSettings.pvpBattlePrediction.enabled;
      predictionEnabledCheckbox.addEventListener('change', (e) => {
        extensionSettings.pvpBattlePrediction.enabled = e.target.checked;
        saveSettings();
        
        if (e.target.checked) {
          initPvPAutoSurrender();
        }
      });
    }
    
    if (analyzeAfterSelect) {
      analyzeAfterSelect.value = extensionSettings.pvpBattlePrediction.analyzeAfterAttacks;
      
      // Remove existing listeners
      analyzeAfterSelect.removeEventListener('change', handleAnalyzeAfterChange);
      
      // Add new listener
      analyzeAfterSelect.addEventListener('change', handleAnalyzeAfterChange);
    }
    
    function handleAnalyzeAfterChange(e) {
      const newValue = parseInt(e.target.value);
      extensionSettings.pvpBattlePrediction.analyzeAfterAttacks = newValue;
      saveSettings();
      console.log('PvP analyze after attacks changed to:', newValue);
    }
    
    if (surrenderEnabledCheckbox) {
      surrenderEnabledCheckbox.checked = extensionSettings.pvpAutoSurrender.enabled;
      surrenderEnabledCheckbox.addEventListener('change', (e) => {
        extensionSettings.pvpAutoSurrender.enabled = e.target.checked;
        saveSettings();
      });
    }
    
    if (thresholdSelect) {
      thresholdSelect.value = extensionSettings.pvpAutoSurrender.surrenderThreshold;
      
      // Remove existing listeners
      thresholdSelect.removeEventListener('change', handleThresholdChange);
      
      // Add new listener  
      thresholdSelect.addEventListener('change', handleThresholdChange);
    }
    
    function handleThresholdChange(e) {
      const newThreshold = parseFloat(e.target.value);
      extensionSettings.pvpAutoSurrender.surrenderThreshold = newThreshold;
      saveSettings();
      console.log('PvP surrender threshold changed to:', newThreshold);
    }
  }

  async function setupWaveSelectionSettings() {
    // Find the existing section content and legacy select (if present)
    const legacySelect = document.getElementById('wave-selection');
    const sectionContent = legacySelect ? legacySelect.closest('.settings-section-content') : null;
    if (!sectionContent) return;

    // Ensure a container to render per-gate dropdowns
    let container = sectionContent.querySelector('#wave-selection-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'wave-selection-container';
      // Insert after the descriptive paragraph if present
      const p = sectionContent.querySelector('p');
      if (p && p.nextSibling) sectionContent.insertBefore(container, p.nextSibling.nextSibling || p.nextSibling);
      else sectionContent.appendChild(container);
    }

  // Ensure map exists for per-gate selections
  extensionSettings.waveSelections = extensionSettings.waveSelections || {};

  // Remove legacy single dropdown block if present
    try { if (legacySelect && legacySelect.parentElement) legacySelect.parentElement.remove(); } catch {}

    // Loading state
    container.innerHTML = '<div style="margin: 15px 0; color:#a6adc8;">Loading gates…</div>';

    const gates = await fetchGatesWithWaves();

    // If nothing found, build a minimal fallback UI
    if (!gates || !gates.length) {
      container.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.style.margin = '15px 0';
      const label = document.createElement('label');
      label.style.cssText = 'color:#f9e2af; margin-bottom:10px; display:block;';
      label.textContent = 'Gate 3:';
      const sel = document.createElement('select');
      sel.id = 'wave-selection-3';
      sel.style.cssText = 'width:250px; padding:8px; background:#1e1e2e; color:#cdd6f4; border:1px solid #45475a; border-radius:4px;';
      sel.innerHTML = '<option value="3:3">Wave 1</option><option value="3:5">Wave 2</option>';
      wrap.appendChild(label); wrap.appendChild(sel); container.appendChild(wrap);
      sel.addEventListener('change', (e) => {
        const [gStr, wStr] = String(e.target.value).split(':');
        const g = Number(gStr)||3; const w = Number(wStr)||3;
        extensionSettings.waveSelections[g] = w; // per-gate
        // Maintain legacy fields for compatibility
        extensionSettings.waveSelection = { gate: g, wave: w };
        extensionSettings.waveSelectionLabel = 'Gate 3';
        saveSettings();
        try { updateSideNavWaveLinks(); } catch {}
        showNotification('Wave selection updated!', 'success');
      });
      try { updateSideNavWaveLinks(); } catch {}
      return;
    }

    // Build per-gate dropdowns
    const curGate = Number(extensionSettings?.waveSelection?.gate ?? 3);
    const curWave = Number(extensionSettings?.waveSelection?.wave ?? 3);
    container.innerHTML = '';
    gates.forEach(gate => {
      const wrap = document.createElement('div');
      wrap.style.margin = '15px 0';

      const label = document.createElement('label');
      label.style.cssText = 'color:#f9e2af; margin-bottom:10px; display:block;';
      label.textContent = `${gate.name || 'Gate'}:`;

      const sel = document.createElement('select');
      sel.className = 'wave-selection-per-gate';
      sel.id = `wave-selection-${gate.gateId}`;
      sel.dataset.gate = String(gate.gateId);
      sel.style.cssText = 'width:250px; padding:8px; background:#1e1e2e; color:#cdd6f4; border:1px solid #45475a; border-radius:4px;';

      for (const w of gate.waves) {
        const opt = document.createElement('option');
        opt.value = `${gate.gateId}:${w.wave}`;
        opt.textContent = w.label; // Wave label only per request
        sel.appendChild(opt);
      }

      // Determine selected value for this gate: per-gate map > legacy saved > first
      const mapWave = Number(extensionSettings.waveSelections[gate.gateId] || 0);
      const targetVal = mapWave ? `${gate.gateId}:${mapWave}` : `${curGate}:${curWave}`;
      const exists = Array.from(sel.options).some(o => o.value === targetVal);
      sel.value = exists ? targetVal : (sel.options[0]?.value || '');

      sel.addEventListener('change', (e) => {
        const value = String(e.target.value || '');
        const [gStr, wStr] = value.split(':');
        const g = Number(gStr) || gate.gateId || 3;
        const w = Number(wStr) || gate.waves?.[0]?.wave || 3;
        extensionSettings.waveSelections[g] = w; // per-gate
        // Maintain legacy fields for compatibility with any single-link usage
        extensionSettings.waveSelection = { gate: g, wave: w };
        extensionSettings.waveSelectionLabel = gate.name || `Gate ${g}`;
        saveSettings();
        try { updateSideNavWaveLinks(); } catch {}
        showNotification(`Wave set to ${gate.name || `Gate ${g}`} — ${sel.options[sel.selectedIndex]?.textContent || ''}`, 'success');
      });

      wrap.appendChild(label);
      wrap.appendChild(sel);
      container.appendChild(wrap);
    });

    // Sync native side drawer link once after rendering
    try { updateSideNavWaveLinks(); } catch {}
  }

  

  function setupEquipSetsSettings() {
    const enabledCheckbox = document.getElementById('equip-sets-enabled');
    const delayInput = document.getElementById('equip-sets-delay');
    const sidebarCheckbox = document.getElementById('equip-sets-sidebar');
    
    if (enabledCheckbox) {
      enabledCheckbox.checked = extensionSettings.equipSets.enabled;
      enabledCheckbox.addEventListener('change', (e) => {
        extensionSettings.equipSets.enabled = e.target.checked;
        saveSettings();
        showNotification(`Equipment Sets ${e.target.checked ? 'enabled' : 'disabled'}!`, 'success');
      });
    }
    
    if (delayInput) {
      delayInput.value = extensionSettings.equipSets.applyDelay;
      delayInput.addEventListener('change', (e) => {
        const value = parseInt(e.target.value);
        if (value >= 100 && value <= 2000) {
          extensionSettings.equipSets.applyDelay = value;
          saveSettings();
          showNotification('Equipment apply delay updated!', 'success');
        }
      });
    }
    
    if (sidebarCheckbox) {
      sidebarCheckbox.checked = extensionSettings.equipSets.showInSidebar;
      sidebarCheckbox.addEventListener('change', (e) => {
        extensionSettings.equipSets.showInSidebar = e.target.checked;
        saveSettings();
        // Regenerate sidebar to show/hide equip sets
        generateSideBar();
        showNotification(`Equipment Sets ${e.target.checked ? 'added to' : 'removed from'} sidebar!`, 'success');
      });
    }
  }

  function setupEquipSetsSettings() {
    const delayInput = document.getElementById('equip-sets-delay');
    
    if (delayInput) {
      delayInput.value = extensionSettings.equipSets.applyDelay;
      delayInput.addEventListener('change', (e) => {
        const delay = parseInt(e.target.value);
        if (delay >= 100 && delay <= 2000) {
          extensionSettings.equipSets.applyDelay = delay;
          saveSettings();
          showNotification('Equipment sets delay updated!', 'success');
        }
      });
    }
  }

  function setupBattleModalSettings() {
    const enabledCheckbox = document.getElementById('battle-modal-enabled');
    const autoCloseCheckbox = document.getElementById('battle-modal-auto-close');
    const showLootCheckbox = document.getElementById('battle-modal-show-loot');
    const showLootPreviewCheckbox = document.getElementById('battle-modal-show-loot-preview');
    const showLogsCheckbox = document.getElementById('battle-modal-show-logs');
    const showLeaderboardCheckbox = document.getElementById('battle-modal-show-leaderboard');
    const compactCheckbox = document.getElementById('battle-modal-compact');
    const showPlayerInfoCheckbox = document.getElementById('battle-modal-show-player-info');

    if (showPlayerInfoCheckbox) {
      showPlayerInfoCheckbox.checked = extensionSettings.battleModal.showPlayerInfo;
      showPlayerInfoCheckbox.addEventListener('change', (e) => {
        extensionSettings.battleModal.showPlayerInfo = e.target.checked;
        saveSettings();
      });
    }

    if (enabledCheckbox) {
      enabledCheckbox.checked = extensionSettings.battleModal.enabled;
      enabledCheckbox.addEventListener('change', (e) => {
        extensionSettings.battleModal.enabled = e.target.checked;
        saveSettings();
        showNotification(`Battle Modal ${e.target.checked ? 'enabled' : 'disabled'}!`, 'success');
      });
    }
    
    if (autoCloseCheckbox) {
      autoCloseCheckbox.checked = extensionSettings.battleModal.autoClose;
      autoCloseCheckbox.addEventListener('change', (e) => {
        extensionSettings.battleModal.autoClose = e.target.checked;
        saveSettings();
      });
    }
    
    if (showLootCheckbox) {
      showLootCheckbox.checked = extensionSettings.battleModal.showLootModal;
      showLootCheckbox.addEventListener('change', (e) => {
        extensionSettings.battleModal.showLootModal = e.target.checked;
        saveSettings();
      });
    }
    
    if (showLogsCheckbox) {
      showLogsCheckbox.checked = extensionSettings.battleModal.showAttackLogs;
      showLogsCheckbox.addEventListener('change', (e) => {
        extensionSettings.battleModal.showAttackLogs = e.target.checked;
        saveSettings();
      });
    }
    
    if (showLeaderboardCheckbox) {
      showLeaderboardCheckbox.checked = extensionSettings.battleModal.showLeaderboard;
      showLeaderboardCheckbox.addEventListener('change', (e) => {
        extensionSettings.battleModal.showLeaderboard = e.target.checked;
        saveSettings();
      });
    }

    if (showLootPreviewCheckbox) {
      showLootPreviewCheckbox.checked = extensionSettings.battleModal.showLootPreview;
      showLootPreviewCheckbox.addEventListener('change', (e) => {
        extensionSettings.battleModal.showLootPreview = e.target.checked;
        saveSettings();
      });
    }
    
    if (compactCheckbox) {
      compactCheckbox.checked = extensionSettings.battleModal.compact;
      compactCheckbox.addEventListener('change', (e) => {
        extensionSettings.battleModal.compact = e.target.checked;
        saveSettings();
      });
    }
  }

  function setupPvPBattlePredictionSettings() {
    const enabledCheckbox = document.getElementById('pvp-prediction-enabled');
    const analyzeAfterInput = document.getElementById('pvp-analyze-after');
    
    if (enabledCheckbox) {
      enabledCheckbox.checked = extensionSettings.pvpBattlePrediction.enabled;
      enabledCheckbox.addEventListener('change', (e) => {
        extensionSettings.pvpBattlePrediction.enabled = e.target.checked;
        saveSettings();
      });
    }
    
    if (analyzeAfterInput) {
      analyzeAfterInput.value = extensionSettings.pvpBattlePrediction.analyzeAfterAttacks;
      analyzeAfterInput.addEventListener('change', (e) => {
        const value = parseInt(e.target.value);
        if (value >= 1 && value <= 10) {
          extensionSettings.pvpBattlePrediction.analyzeAfterAttacks = value;
          saveSettings();
        }
      });
    }
  }

  function setupSemiTransparentSettings() {
    const enabledCheckbox = document.getElementById('semi-transparent-enabled');
    const opacityInput = document.getElementById('semi-transparent-opacity');
    
    if (enabledCheckbox) {
      enabledCheckbox.checked = extensionSettings.semiTransparent.enabled;
      enabledCheckbox.addEventListener('change', (e) => {
        extensionSettings.semiTransparent.enabled = e.target.checked;
        saveSettings();
        if (e.target.checked) {
          applySemiTransparentEffect();
        } else {
          const style = document.getElementById('semi-transparent-style');
          if (style) style.remove();
        }
        showNotification(`Semi-transparent ${e.target.checked ? 'enabled' : 'disabled'}!`, 'success');
      });
    }
    
    if (opacityInput) {
      opacityInput.value = extensionSettings.semiTransparent.opacity;
      opacityInput.addEventListener('change', (e) => {
        const opacity = parseFloat(e.target.value);
        if (opacity >= 0.1 && opacity <= 1.0) {
          extensionSettings.semiTransparent.opacity = opacity;
          saveSettings();
          if (extensionSettings.semiTransparent.enabled) {
            applySemiTransparentEffect();
          }
        }
      });
    }
  }

  function setupPetTeamsSettings() {
    const enabledCheckbox = document.getElementById('pet-teams-enabled');
    const delayInput = document.getElementById('pet-teams-delay');
    const sidebarCheckbox = document.getElementById('pet-teams-sidebar');
    
    if (enabledCheckbox) {
      enabledCheckbox.checked = extensionSettings.petTeams.enabled;
      enabledCheckbox.addEventListener('change', (e) => {
        extensionSettings.petTeams.enabled = e.target.checked;
        saveSettings();
        showNotification(`Pet Teams ${e.target.checked ? 'enabled' : 'disabled'}!`, 'success');
      });
    }
    
    if (delayInput) {
      delayInput.value = extensionSettings.petTeams.applyDelay;
      delayInput.addEventListener('change', (e) => {
        const value = parseInt(e.target.value);
        if (value >= 100 && value <= 2000) {
          extensionSettings.petTeams.applyDelay = value;
          saveSettings();
          showNotification('Pet teams delay updated!', 'success');
        }
      });
    }
    
    if (sidebarCheckbox) {
      sidebarCheckbox.checked = extensionSettings.petTeams.showInSidebar;
      sidebarCheckbox.addEventListener('change', (e) => {
        extensionSettings.petTeams.showInSidebar = e.target.checked;
        saveSettings();
        showNotification(`Pet Teams ${e.target.checked ? 'added to' : 'removed from'} sidebar!`, 'success');
      });
    }
  }

  function setupQuestWidgetSettings() {
    const enabledCheckbox = document.getElementById('quest-widget-enabled');
    
    if (enabledCheckbox) {
      enabledCheckbox.checked = extensionSettings.questWidget.enabled;
      enabledCheckbox.addEventListener('change', (e) => {
        extensionSettings.questWidget.enabled = e.target.checked;
        saveSettings();
        if (e.target.checked) {
          initSidebarQuestWidget();
        } else {
          const widget = document.getElementById('sidebar-quest-widget');
          if (widget) widget.remove();
        }
        showNotification(`Quest Widget ${e.target.checked ? 'enabled' : 'disabled'}!`, 'success');
      });
    }
  }

  function populateMonsterUrlInputs() {
    const container = document.getElementById('monster-url-inputs');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Ensure monsters object exists
    if (!extensionSettings.monsterBackgrounds.monsters) {
      extensionSettings.monsterBackgrounds.monsters = {};
    }
    
      Object.entries(extensionSettings.monsterBackgrounds.monsters).forEach(([monsterName, monsterData], index) => {
        // Handle both old format (string URL) and new format (object with url and effect)
        const url = typeof monsterData === 'string' ? monsterData : monsterData.url;
        const effect = typeof monsterData === 'string' ? 'normal' : monsterData.effect;
        addMonsterUrlInput(monsterName, url, index, effect);
      });
    }

    function addMonsterUrlInput(monsterName = '', url = '', index = null, effect = 'normal') {
    const container = document.getElementById('monster-url-inputs');
    if (!container) {
      return;
    }
    
    const inputIndex = index !== null ? index : Object.keys(extensionSettings.monsterBackgrounds.monsters).length;
    
    const inputDiv = document.createElement('div');
      inputDiv.style.cssText = 'display: flex; gap: 8px; margin-bottom: 10px; align-items: center;';
    inputDiv.innerHTML = `
        <input type="text" placeholder="Monster Name" 
             value="${monsterName}" 
              style="width: 150px; padding: 6px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;"
             class="monster-name-input">
        <input type="url" placeholder="Image URL" 
             value="${url}" 
              style="width: 200px; padding: 6px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;"
             class="monster-url-input">
        <select class="monster-effect-select" style="width: 100px; padding: 6px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;">
          <option value="normal" ${effect === 'normal' ? 'selected' : ''}>Normal</option>
          <option value="gradient" ${effect === 'gradient' ? 'selected' : ''}>Gradient</option>
          <option value="blur" ${effect === 'blur' ? 'selected' : ''}>Blur</option>
          <option value="pattern" ${effect === 'pattern' ? 'selected' : ''}>Pattern</option>
        </select>
        <button class="settings-button" style="margin-top: 0px; background: #f38ba8; padding: 6px 10px; font-size: 12px; min-width: 40px;" data-action="remove-monster-url">
        🗑️
      </button>
    `;
    
    container.appendChild(inputDiv);
    
    // Add event listeners
    const nameInput = inputDiv.querySelector('.monster-name-input');
    const urlInput = inputDiv.querySelector('.monster-url-input');
      const effectSelect = inputDiv.querySelector('.monster-effect-select');
    const removeButton = inputDiv.querySelector('[data-action="remove-monster-url"]');
    
    nameInput.addEventListener('input', () => {
      updateMonsterUrlMapping();
    });
    
    urlInput.addEventListener('input', () => {
      updateMonsterUrlMapping();
    });
      
      effectSelect.addEventListener('change', () => {
      updateMonsterUrlMapping();
    });
    
    // Remove button will be handled by event delegation
  }

  function removeMonsterUrlInput(button) {
    const inputDiv = button.parentElement;
    inputDiv.remove();
    updateMonsterUrlMapping();
  }

  function updateMonsterUrlMapping() {
    const container = document.getElementById('monster-url-inputs');
    if (!container) {
      console.log('Monster URL container not found');
      return;
    }
    
    // Ensure monsterBackgrounds and monsters objects exist
    if (!extensionSettings.monsterBackgrounds) {
      extensionSettings.monsterBackgrounds = {
        enabled: true,
        effect: 'normal',
        overlay: true,
        overlayOpacity: 0.5,
        monsters: {}
      };
    }
    if (!extensionSettings.monsterBackgrounds.monsters) {
      extensionSettings.monsterBackgrounds.monsters = {};
    }
    
    const newMonsters = {};
    
    container.querySelectorAll('.monster-name-input').forEach((nameInput, index) => {
      const urlInput = container.querySelectorAll('.monster-url-input')[index];
        const effectSelect = container.querySelectorAll('.monster-effect-select')[index];
      const monsterName = nameInput.value.trim();
      const url = urlInput.value.trim();
        const effect = effectSelect ? effectSelect.value : 'normal';
      
      if (monsterName && url) {
          newMonsters[monsterName] = {
            url: url,
            effect: effect
          };
      }
    });
    
    console.log('Saving monster backgrounds:', newMonsters);
    extensionSettings.monsterBackgrounds.monsters = newMonsters;
    
    // Verify save was successful
    try {
      saveSettings();
      console.log('Monster backgrounds saved successfully');
    } catch (error) {
      console.error('Error saving monster backgrounds:', error);
    }
    
    applyMonsterBackgrounds();
  }


  function applyMonsterBackgrounds() {
    // Debug helpers (toggle with localStorage key 'mbg_debug' = '1')
    const MBG_DEBUG = (() => { try { return localStorage.getItem('mbg_debug') === '1'; } catch(_) { return false; } })();
    const dlog = (...args) => { if (MBG_DEBUG) console.log('[MBG]', ...args); };
    const derr = (...args) => { if (MBG_DEBUG) console.error('[MBG]', ...args); };

    const settings = extensionSettings.monsterBackgrounds || {};
    const overlayOpacity = typeof settings.overlayOpacity === 'number' ? settings.overlayOpacity : 0.5;
    document.documentElement.style.setProperty('--monster-overlay-opacity', overlayOpacity);
    dlog('start', { path: window.location.pathname, enabled: settings.enabled, effect: settings.effect, overlayOpacity });

    if (settings.enabled === false) { dlog('disabled'); return; }

    const normalizeName = (text) => {
      const t = (text || '').toString();
      const noEmoji = t
        .replace(/[🧟⚔️🛡️💀👹👻🎭]/g, '')
        .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
      return noEmoji.replace(/\s+/g, ' ').trim().toLowerCase();
    };

    const monstersConfig = settings.monsters || {};
    const normalizedMap = {};
    Object.entries(monstersConfig).forEach(([name, data]) => {
      normalizedMap[normalizeName(name)] = data;
    });
    dlog('configured keys', Object.keys(normalizedMap));

    const currentPage = window.location.pathname;

    // Merchant page uses page background
    if (currentPage.includes('merchant.php')) {
      dlog('merchant page -> delegating to applyMerchantBackground()');
      applyMerchantBackground();
      return;
    }

    const monstersFound = [];
    const scanPanel = (panel) => {
      const els = panel.querySelectorAll('h1, h2, h3, h4, strong, .card-title, .monster-name, [data-monster-name]');
      els.forEach((el) => {
        const raw = el.textContent;
        const key = normalizeName(raw);
        const has = !!normalizedMap[key];
        dlog('scan', { raw: raw?.trim(), key, match: has });
        if (has) {
          if (!monstersFound.some(m => m.nameKey === key && m.element === panel)) {
            monstersFound.push({ nameKey: key, element: panel });
          }
        }
      });
    };

    document.querySelectorAll('.panel').forEach(scanPanel);

    let selectedKey = '';
    let selectedData = null;
    if (monstersFound.length) {
      selectedKey = monstersFound[0].nameKey;
      selectedData = normalizedMap[selectedKey];
    }
    dlog('selection', { found: monstersFound.length, selectedKey, hasData: !!selectedData });

    if (selectedData) {
      const data = selectedData;
      const url = typeof data === 'string' ? data : data?.url;
      const effectToUse = (data && typeof data === 'object' && data.effect) ? data.effect : (settings.effect || 'normal');
      dlog('apply', { url, effectToUse });

      if (url && typeof url === 'string') {
        // Remove any existing monster background styles
        document.querySelectorAll('style[id^="monster-bg-"]').forEach(s => s.remove());

        const styleId = 'monster-bg-unified';
        const style = document.createElement('style');
        style.id = styleId;

        const selector = '.panel';
        let css = '';
        switch (effectToUse) {
          case 'blur':
            css = `
              ${selector} {
                background-image: url('${url}') !important;
                background-size: cover !important;
                background-position: center !important;
                background-repeat: no-repeat !important;
                background-attachment: fixed !important;
                position: relative !important;
              }
              ${selector}::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background-image: inherit;
                background-size: inherit;
                background-position: inherit;
                filter: blur(3px);
                z-index: 0;
              }
              ${selector} > * { position: relative; z-index: 1; }
            `;
            break;
          case 'gradient':
            css = `
              ${selector} {
                background-image:
                  linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.3)),
                  url('${url}') !important;
                background-size: cover !important;
                background-position: center !important;
                background-repeat: no-repeat !important;
                background-attachment: fixed !important;
              }
            `;
            break;
          case 'pattern':
            css = `
              ${selector} {
                background-image:
                  repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px),
                  url('${url}') !important;
                background-size: cover !important;
                background-position: center !important;
                background-repeat: no-repeat !important;
                background-attachment: fixed !important;
              }
            `;
            break;
          default:
            css = `
              ${selector} {
                background-image: url('${url}') !important;
                background-size: cover !important;
                background-position: center !important;
                background-repeat: no-repeat !important;
                background-attachment: fixed !important;
                position: relative !important;
              }
              ${selector}::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, ${overlayOpacity});
                z-index: 0;
              }
              ${selector} > * { position: relative; z-index: 1; }
            `;
        }

        const img = new Image();
        img.onload = () => dlog('image ok', url, img.naturalWidth + 'x' + img.naturalHeight);
        img.onerror = () => derr('image error', url);
        img.src = url;

        style.textContent = css;
        document.head.appendChild(style);
        dlog('style appended', styleId);
      }
      return;
    }

    // No monsters matched: clear existing styles
    document.querySelectorAll('style[id^="monster-bg-"]').forEach(s => s.remove());
    dlog('no match - cleared styles');
  }

  // Apply merchant page background to panels (same as page background)
  function applyMerchantBackground() {
    
    // Remove any existing monster/merchant background styles
    const existingStyles = document.querySelectorAll('style[id^="monster-bg-"], style[id="merchant-bg"]');
    existingStyles.forEach(style => style.remove());
    
    // Get the current page background from body or html
    const bodyStyle = window.getComputedStyle(document.body);
    const htmlStyle = window.getComputedStyle(document.documentElement);
    
    // Try to get background properties from body first, then html
    const backgroundImage = bodyStyle.backgroundImage !== 'none' ? bodyStyle.backgroundImage : htmlStyle.backgroundImage;
    const backgroundSize = bodyStyle.backgroundSize || htmlStyle.backgroundSize || 'cover';
    const backgroundPosition = bodyStyle.backgroundPosition || htmlStyle.backgroundPosition || 'center';
    const backgroundRepeat = bodyStyle.backgroundRepeat || htmlStyle.backgroundRepeat || 'no-repeat';
    const backgroundAttachment = bodyStyle.backgroundAttachment || htmlStyle.backgroundAttachment || 'fixed';
    
    console.log('Page background properties:', {
      image: backgroundImage,
      size: backgroundSize,
      position: backgroundPosition,
      repeat: backgroundRepeat,
      attachment: backgroundAttachment
    });
    
    if (backgroundImage && backgroundImage !== 'none') {
      // Create style to apply same background to panels
      const styleId = 'merchant-bg';
      const style = document.createElement('style');
      style.id = styleId;
      
      const css = `
        .panel {
          background-image: ${backgroundImage} !important;
          background-size: ${backgroundSize} !important;
          background-position: ${backgroundPosition} !important;
          background-repeat: ${backgroundRepeat} !important;
          background-attachment: ${backgroundAttachment} !important;
          position: relative !important;
        }
        
        .panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 0;
        }
        
        .panel > * {
          position: relative;
          z-index: 1;
        }
      `;
      

      style.textContent = css;
      document.head.appendChild(style);
      
      const allPanels = document.querySelectorAll('.panel');

    } else {

    }
  }

  // Initialize monster background observer to detect new panels
  function initMonsterBackgroundObserver() {
    if (!extensionSettings.monsterBackgrounds?.enabled) {
      return;
    }

    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach((mutation) => {
        // Check for added nodes that might be monster panels
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node is a panel or contains panels
            if (node.classList?.contains('panel') || node.querySelector?.('.panel')) {
              shouldUpdate = true;
            }
          }
        });
        
        // Check for modified text content that might be monster names
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const target = mutation.target;
          if (target.closest && target.closest('.panel')) {
            shouldUpdate = true;
          }
        }
      });

      if (shouldUpdate) {
        // Debounce the update to avoid excessive calls
        setTimeout(() => {
          applyMonsterBackgrounds();
        }, 100);
      }
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });


  }

  // Console function to manually enable monster backgrounds
  window.enableMonsterBackgrounds = function() {
    extensionSettings.monsterBackgrounds.enabled = true;
    saveSettings();
    
    // Update the UI toggle if it exists
    const enabledToggle = document.getElementById('monster-backgrounds-enabled');
    if (enabledToggle) {
      enabledToggle.checked = true;
    }
    
    applyMonsterBackgrounds();
  };

  // Console function to check current monster background status
  window.checkMonsterBackgroundStatus = function() {
    console.log('=== Monster Background Status ===');
    console.log('Enabled: Always enabled (no toggle)');
    console.log('Effect:', extensionSettings.monsterBackgrounds?.effect);
    console.log('Overlay:', extensionSettings.monsterBackgrounds?.overlay);
    console.log('Opacity:', extensionSettings.monsterBackgrounds?.overlayOpacity);
    console.log('Configured Monsters:', Object.keys(extensionSettings.monsterBackgrounds?.monsters || {}));
    console.log('Full settings:', extensionSettings.monsterBackgrounds);
    
    // Check UI state
    const enabledToggle = document.getElementById('monster-backgrounds-enabled');
    console.log('Toggle element found:', !!enabledToggle);
    if (enabledToggle) {
      console.log('Toggle checked state:', enabledToggle.checked);
      console.log('Toggle type:', enabledToggle.type);
      console.log('Toggle parent:', enabledToggle.parentElement);
      
      // Check for neo toggle structure
      const neoToggle = enabledToggle.nextElementSibling;
      console.log('Neo toggle label found:', !!neoToggle);
      if (neoToggle) {
        console.log('Neo toggle classes:', neoToggle.className);
      }
    }
  };

  // Test function to add direct click detection
  window.testMonsterToggleClicks = function() {
    console.log('🧪 Setting up test click detection...');
    const enabledToggle = document.getElementById('monster-backgrounds-enabled');
    if (enabledToggle) {
      const container = enabledToggle.closest('.neo-toggle-container');
      if (container) {
        container.addEventListener('click', (e) => {
          console.log('🎯 Click detected on neo toggle container!');
          console.log('Click target:', e.target);
          console.log('Current toggle state:', enabledToggle.checked);
        }, true);
        
        // Add click detection to all elements in the toggle
        container.querySelectorAll('*').forEach((element, index) => {
          element.addEventListener('click', (e) => {
            console.log(`🎯 Click on toggle element ${index}:`, element);
          }, true);
        });
      }
    }
  };

  // Test function to verify all functions are available
  window.testMonsterFunctions = function() {
    console.log('🧪 Testing monster background functions availability...');
    console.log('debugMonsterBackgrounds:', typeof window.debugMonsterBackgrounds);
    console.log('enableMonsterBackgrounds:', typeof window.enableMonsterBackgrounds);
    console.log('checkMonsterBackgroundStatus:', typeof window.checkMonsterBackgroundStatus);
    console.log('toggleMonsterBackgrounds:', typeof window.toggleMonsterBackgrounds);
    console.log('forceEnableMonsterBackgrounds:', typeof window.forceEnableMonsterBackgrounds);
    console.log('testMonsterToggleClicks:', typeof window.testMonsterToggleClicks);
    
    if (typeof window.forceEnableMonsterBackgrounds === 'function') {
      console.log('✅ All functions are available! Try: forceEnableMonsterBackgrounds()');
    } else {
      console.log('❌ Functions not available. Extension may not be fully loaded.');
    }
  };

  // Console function to force toggle monster backgrounds
  window.toggleMonsterBackgrounds = function() {
    console.log('🎛️ Forcing toggle of monster backgrounds...');
    const enabledToggle = document.getElementById('monster-backgrounds-enabled');
    if (enabledToggle) {
      console.log('Current toggle state:', enabledToggle.checked);
      enabledToggle.checked = !enabledToggle.checked;
      console.log('New toggle state:', enabledToggle.checked);
      
      // Try multiple event types to ensure it triggers
      enabledToggle.dispatchEvent(new Event('change', { bubbles: true }));
      enabledToggle.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Manual fallback
      const newState = enabledToggle.checked;
      extensionSettings.monsterBackgrounds.enabled = newState;
      saveSettings();
      applyMonsterBackgrounds();
      console.log('Manually set monster backgrounds to:', newState);
    } else {
      console.log('Toggle element not found, manually toggling...');
      extensionSettings.monsterBackgrounds.enabled = !extensionSettings.monsterBackgrounds.enabled;
      saveSettings();
      applyMonsterBackgrounds();
      console.log('Manually toggled to:', extensionSettings.monsterBackgrounds.enabled);
    }
  };

  // Simple function to just enable monster backgrounds
  window.forceEnableMonsterBackgrounds = function() {
    console.log('🎛️ Force enabling monster backgrounds...');
    extensionSettings.monsterBackgrounds.enabled = true;
    saveSettings();
    
    const enabledToggle = document.getElementById('monster-backgrounds-enabled');
    if (enabledToggle) {
      enabledToggle.checked = true;
    }
    
    applyMonsterBackgrounds();
    console.log('Monster backgrounds force enabled!');
  };



  function applyLootPanelColors() {
    if (!extensionSettings.lootPanelColors.enabled) {
      // Remove custom colors from all loot cards
      document.querySelectorAll('.loot-card').forEach(card => {
        card.style.borderColor = '';
        card.style.backgroundColor = '';
      });
      return;
    }

    // Find all loot cards
    const lootCards = document.querySelectorAll('.loot-card');
    
    lootCards.forEach(card => {
      // Check if the card is locked or unlocked
      const isLocked = card.classList.contains('locked') || 
                      card.querySelector('.lock-badge') || 
                      card.textContent.includes('Locked');
      
      if (isLocked) {
        // Apply locked color
        card.style.borderColor = extensionSettings.lootPanelColors.lockedColor;
        card.style.backgroundColor = extensionSettings.lootPanelColors.lockedColor + '20'; // Add transparency
      } else {
        // Apply unlocked color
        card.style.borderColor = extensionSettings.lootPanelColors.unlockedColor;
        card.style.backgroundColor = extensionSettings.lootPanelColors.unlockedColor + '20'; // Add transparency
      }
    });

    console.log(`Applied loot panel colors: ${lootCards.length} cards processed`);
  }

  function applySemiTransparentEffect() {
    if (!extensionSettings.semiTransparent.enabled) return;
    
    // Remove existing style if any
    const existingStyle = document.getElementById('semi-transparent-style');
    if (existingStyle) existingStyle.remove();
    
    const opacity = extensionSettings.semiTransparent.opacity || 0.85;
    
    const style = document.createElement('style');
    style.id = 'semi-transparent-style';
    style.textContent = `
      .panel, .card, .section, .sidebar, .game-sidebar {
        background-color: rgba(30, 30, 46, ${opacity}) !important;
        backdrop-filter: blur(4px) !important;
      }
      .modal-content, .modal-body {
        background-color: rgba(30, 30, 46, ${opacity}) !important;
        backdrop-filter: blur(4px) !important;
      }
    `;
    
    document.head.appendChild(style);
  }

  // Function to ensure semi-transparent persists
  function ensureSemiTransparentPersistence() {
    if (!extensionSettings.semiTransparent.enabled) return;
    
    const style = document.getElementById('semi-transparent-style');
    if (!style) {
      applySemiTransparentEffect();
    }
  }

  // Set up persistence observer for semi-transparent effect
  function initSemiTransparentPersistence() {
    if (!extensionSettings.semiTransparent.enabled) return;
    
    applySemiTransparentEffect();
    
    // Observe DOM changes to re-apply if needed
    const observer = new MutationObserver(() => {
      ensureSemiTransparentPersistence();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Also re-apply on page changes
    setInterval(() => {
      ensureSemiTransparentPersistence();
    }, 5000);
  }

  // PvP Auto-Surrender System
  let pvpBattleData = {
    myMaxHp: 0,
    enemyMaxHp: 0,
    myCurrentHp: 0,
    enemyCurrentHp: 0,
    myDamageDealt: 0,
    enemyDamageDealt: 0,
    attackCount: 0,
    predictionBox: null
  };

  function initPvPAutoSurrender() {
    // Check if we're on a PvP battle page
    const isPvPBattle = window.location.pathname.includes('pvp_battle.php') || 
                       document.querySelector('#enemyHero') !== null;
    
    if (!isPvPBattle) return;
    
    initializeBattleData();
    
    // Start monitoring battle log
    monitorBattleLog();
  }

  function initializeBattleData() {
    const myHpText = document.getElementById('myHpText');
    const enemyHpText = document.getElementById('enemyHpText');
    
    if (myHpText && enemyHpText) {
      // Parse HP from text like "❤️ 5,846 / 6,000 HP"
      const myHpMatch = myHpText.textContent.match(/(\d+(?:,\d+)*)\s*\/\s*(\d+(?:,\d+)*)/);
      const enemyHpMatch = enemyHpText.textContent.match(/(\d+(?:,\d+)*)\s*\/\s*(\d+(?:,\d+)*)/);
      
      if (myHpMatch && enemyHpMatch) {
        pvpBattleData.myCurrentHp = parseInt(myHpMatch[1].replace(/,/g, ''));
        pvpBattleData.myMaxHp = parseInt(myHpMatch[2].replace(/,/g, ''));
        pvpBattleData.enemyCurrentHp = parseInt(enemyHpMatch[1].replace(/,/g, ''));
        pvpBattleData.enemyMaxHp = parseInt(enemyHpMatch[2].replace(/,/g, ''));
      }
    }
  }

  function monitorBattleLog() {
    const logWrap = document.getElementById('logWrap');
    if (!logWrap) return;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          const endTitle = document.getElementById('endTitle');
          if (endTitle && endTitle.textContent.includes('Victory')) {
            observer.disconnect();
            return;
          }
          setTimeout(() => {
            analyzeBattleState();
          }, 500);
        }
      });
    });
    
    observer.observe(logWrap, { childList: true, subtree: true });
  }

  function createPredictionBox() {
    const isPvPBattle = window.location.pathname.includes('pvp_battle.php') || 
                       document.querySelector('#enemyHero') !== null;
    
    if (!isPvPBattle || !extensionSettings.pvpBattlePrediction.enabled) return;
    
    const existingBox = document.getElementById('pvp-prediction-box');
    if (existingBox) {
      existingBox.remove();
    }
    
    const surrenderBtn = document.getElementById('btnSurrender');
    if (!surrenderBtn) return;
    
    const predictionBox = document.createElement('div');
    predictionBox.id = 'pvp-prediction-box';
    predictionBox.style.marginTop = '10px';
    predictionBox.style.padding = '6px';
    predictionBox.style.border = '1px solid #666';
    predictionBox.style.borderRadius = '6px';
    predictionBox.style.background = '#111';
    predictionBox.style.color = '#fff';
    predictionBox.style.fontWeight = 'bold';
    predictionBox.textContent = '⚔️ Expected Result: calculating...';
    
    surrenderBtn.insertAdjacentElement('afterend', predictionBox);
    pvpBattleData.predictionBox = predictionBox;
  }


  function analyzeBattleState() {
    pvpBattleData.attackCount++;
    
    // Only start analysis if prediction is enabled and after specified number of attacks
    if (!extensionSettings.pvpBattlePrediction.enabled || 
        pvpBattleData.attackCount < extensionSettings.pvpBattlePrediction.analyzeAfterAttacks) {
      return;
    }
    
    updateCurrentHP();
    
    const logItems = document.querySelectorAll('#logWrap .log-item');
    if (logItems.length >= 2) {
      const lastTwo = Array.from(logItems).slice(-2);
      updateDamageData(lastTwo);
    }
    
    const winProbability = calculateWinProbability();
    updatePredictionBox(winProbability);
    
    if (winProbability < extensionSettings.pvpAutoSurrender.surrenderThreshold) {
      setTimeout(() => {
        performAutoSurrender();
      }, 2000);
    }
  }

  function updateCurrentHP() {
    const myHpText = document.getElementById('myHpText');
    const enemyHpText = document.getElementById('enemyHpText');
    
    if (myHpText && enemyHpText) {
      const myHpMatch = myHpText.textContent.match(/(\d+(?:,\d+)*)\s*\/\s*(\d+(?:,\d+)*)/);
      const enemyHpMatch = enemyHpText.textContent.match(/(\d+(?:,\d+)*)\s*\/\s*(\d+(?:,\d+)*)/);
      
      if (myHpMatch && enemyHpMatch) {
        pvpBattleData.myCurrentHp = parseInt(myHpMatch[1].replace(/,/g, ''));
        pvpBattleData.enemyCurrentHp = parseInt(enemyHpMatch[1].replace(/,/g, ''));
      }
    }
  }

  function updateDamageData(logItems) {
    logItems.forEach(item => {
      const text = item.textContent;
      const damageMatch = text.match(/\(<strong>(\d+(?:,\d+)*)<\/strong> dmg\)/);
      
      if (damageMatch) {
        const damage = parseInt(damageMatch[1].replace(/,/g, ''));
        
        if (text.includes('You')) {
          pvpBattleData.myDamageDealt += damage;
        } else {
          pvpBattleData.enemyDamageDealt += damage;
        }
      }
    });
  }



  function highlightPvpBattles() {
    const table = document.querySelector('.table');
    if (!table) return;
    
    const headers = table.querySelector('thead tr');
    if (headers && !headers.querySelector('th:last-child').textContent.includes('Points')) {
      const pointsHeader = document.createElement('th');
      pointsHeader.textContent = 'Points';
      headers.appendChild(pointsHeader);
    }

    table.querySelectorAll('tbody tr').forEach(row => {
      const resultCell = row.querySelector('td:nth-child(3) .rank-badge');
      if (resultCell) {
        const isWin = resultCell.textContent.trim() === 'Win';
        row.style.backgroundColor = isWin ? '#1c2d1c' : '#2d1c1c';
        row.style.transition = 'background-color 0.3s';
        
        const cells = Array.from(row.cells);
        let pointsCell;
        
        if (cells.length < 6) {
          pointsCell = document.createElement('td');
          row.appendChild(pointsCell);
        } else {
          pointsCell = cells[cells.length - 1];
        }
        
        let points;
        let isAttacker = false;
        
        const battleLink = row.querySelector('a[href*="pvp_battle.php"]');
        if (battleLink) {
          isAttacker = true;
        }
        
        const rowText = row.textContent.toLowerCase();
        if (rowText.includes('attack') || rowText.includes('challenge')) {
          isAttacker = true;
        }
        
        // Debug: Log the detection for troubleshooting
        if (!isAttacker && window.location.pathname.includes('pvp.php')) {
          isAttacker = true;
        }
        
        if (isWin) {
          // Winner gets +10 (attacker) or +5 (defender)
          points = isAttacker ? '+10' : '+5';
        } else {
          // Loser gets -15 (attacker) or -5 (defender)
          points = isAttacker ? '-15' : '-5';
        }
        
        // Update points cell content and styling
        pointsCell.textContent = points;
        pointsCell.style.color = isWin ? '#8ff0a4' : '#ff9a9a';
        pointsCell.style.fontWeight = 'bold';
      }
    });
  }

  function updatePredictionBox(winProbability) {
    const box = document.getElementById('pvp-prediction-box');
    if (!box) return;
    
    const percentage = (winProbability * 100).toFixed(1);
    let result = '';
    
    if (winProbability > 0.5) {
      result = 'WINNING';
    } else if (winProbability < 0.5) {
      result = 'LOSING';
    } else {
      result = 'EVEN';
    }
    
    box.textContent = `⚔️ Expected Result: ${result} (${percentage}%)`;
    
    // Handle auto-surrender if enabled and probability is low
    if (extensionSettings.pvpAutoSurrender.enabled && winProbability < extensionSettings.pvpAutoSurrender.surrenderThreshold) {
      box.textContent += ' ⚠️ Auto-surrender in 2s';
      box.style.borderColor = '#f38ba8'; // Red border
      setTimeout(() => performAutoSurrender(), 2000); // Auto-surrender after 2 seconds
    } else {
      box.style.borderColor = '#666';
    }
  }

  function performAutoSurrender() {
    const surrenderBtn = document.getElementById('btnSurrender');
    if (surrenderBtn && !surrenderBtn.disabled) {

      
      // Show notification
      if (typeof showNotification === 'function') {
        showNotification('Auto-surrendering due to low win probability', 'error');
      }
      
      // Override the confirm dialog to automatically return true
      const originalConfirm = window.confirm;
      window.confirm = function() { return true; };
      
      // Click surrender button
      surrenderBtn.click();
      
      // Restore original confirm function after a short delay
      setTimeout(() => {
        window.confirm = originalConfirm;
      }, 1000);
    }
  }

  // Enhanced Quick Access Pinning System - Universal Sidebar Shortcuts

  // INVENTORY QUICK ACCESS FUNCTIONS
  function addInventoryQuickAccessButtons() {
      // Only run on inventory page
      if (!window.location.pathname.includes('inventory.php')) return;
      
      let attempts = 0;
      const maxAttempts = 50;
    
    console.log(`📜 Found ${logItems.length} log items:`);
    
    // Reset test data
    const testData = { myDamage: 0, enemyDamage: 0 };
    
    logItems.forEach((item, index) => {
      const text = item.textContent || item.innerText;
      console.log(`${index + 1}: "${text}"`);
      
      const damageMatch = text.match(/\((\d+(?:,\d+)*) dmg\)/);
      if (damageMatch) {
        const damage = parseInt(damageMatch[1].replace(/,/g, ''));
        const attribution = attributeDamage(text, damage);
        
        console.log(`  💥 Damage: ${damage}, Attribution: ${attribution}`);
        
        if (attribution === 'player') {
          testData.myDamage += damage;
        } else if (attribution === 'enemy') {
          testData.enemyDamage += damage;
        }
      } else {
        console.log(`  ⚪ No damage found`);
      }
    });
    
    console.log('🎯 Test Results:', testData);
    return testData;
  }

  function calculateWinProbability() {
    if (!pvpBattleData.myMaxHp || !pvpBattleData.enemyMaxHp || 
        pvpBattleData.myCurrentHp === undefined || pvpBattleData.enemyCurrentHp === undefined) {
      return 0.5;
    }
    
    const myHpPercent = pvpBattleData.myCurrentHp / pvpBattleData.myMaxHp;
    const enemyHpPercent = pvpBattleData.enemyCurrentHp / pvpBattleData.enemyMaxHp;
    
    console.log('❤️ HP percentages:', { 
      my: (myHpPercent * 100).toFixed(1) + '%', 
      enemy: (enemyHpPercent * 100).toFixed(1) + '%'
    });
    
    // Calculate average damage per attack
    const myAvgDamage = pvpBattleData.myDamageDealt / Math.max(1, pvpBattleData.attackCount);
    const enemyAvgDamage = pvpBattleData.enemyDamageDealt / Math.max(1, pvpBattleData.attackCount);
    
    console.log('⚔️ Average damage per attack:', { 
      my: myAvgDamage.toFixed(1), 
      enemy: enemyAvgDamage.toFixed(1) 
    });
    
    // Start with base probability from HP ratio
    let winProbability = 0.5;
    
    // HP-based calculation (30% weight)
    const hpRatio = myHpPercent / Math.max(enemyHpPercent, 0.01); // Avoid division by zero
    const hpScore = Math.min(Math.max((hpRatio - 1) * 0.3 + 0.5, 0.1), 0.9);
    
    // If we have damage data, use it (70% weight)
    if (pvpBattleData.attackCount > 0 && (myAvgDamage > 0 || enemyAvgDamage > 0)) {
      
      // Damage efficiency calculation
      const damageRatio = myAvgDamage / Math.max(enemyAvgDamage, 1);
      const damageScore = Math.min(Math.max((damageRatio - 1) * 0.4 + 0.5, 0.05), 0.95);
      
      // Attacks needed calculation
      const myAttacksToWin = myAvgDamage > 0 ? Math.ceil(pvpBattleData.enemyCurrentHp / myAvgDamage) : 999;
      const enemyAttacksToWin = enemyAvgDamage > 0 ? Math.ceil(pvpBattleData.myCurrentHp / enemyAvgDamage) : 999;
      
      let attacksScore = 0.5;
      if (myAttacksToWin !== enemyAttacksToWin) {
        const attackDiff = enemyAttacksToWin - myAttacksToWin;
        attacksScore = Math.min(Math.max(0.5 + (attackDiff * 0.1), 0.1), 0.9);
      }
      
      // Combine damage-based factors (70% weight) with HP (30% weight)
      winProbability = (damageScore * 0.4 + attacksScore * 0.3) * 0.7 + hpScore * 0.3;
      
      console.log('📊 Detailed calculation:', {
        hpScore: (hpScore * 100).toFixed(1) + '%',
        damageScore: (damageScore * 100).toFixed(1) + '%', 
        attacksScore: (attacksScore * 100).toFixed(1) + '%',
        myAttacksToWin,
        enemyAttacksToWin
      });
    } else {
      // No damage data yet - use enhanced HP-based calculation
      const hpDifference = myHpPercent - enemyHpPercent;
      
      // More granular HP-based probability
      if (Math.abs(hpDifference) < 0.05) {
        // Very close HP - use 50% baseline
        winProbability = 0.5;
      } else {
        // Use HP difference with more sensitivity
        winProbability = 0.5 + (hpDifference * 0.8);
      }
      
      console.log('📊 HP-only calculation:', {
        hpDifference: (hpDifference * 100).toFixed(1) + '%',
        baseProbability: (winProbability * 100).toFixed(1) + '%'
      });
    }
    
    // Ensure result is between 5% and 95% for realistic ranges
    winProbability = Math.max(0.05, Math.min(0.95, winProbability));
    
    console.log('🎯 Final win probability:', (winProbability * 100).toFixed(1) + '%');
    return winProbability;
  }


  function highlightPvpBattles() {
    const table = document.querySelector('.table');
    if (!table) return;
    
    // Add points column if it doesn't exist
    const headers = table.querySelector('thead tr');
    if (headers && !headers.querySelector('th:last-child').textContent.includes('Points')) {
      const pointsHeader = document.createElement('th');
      pointsHeader.textContent = 'Points';
      headers.appendChild(pointsHeader);
    }

    // Process each battle row
    table.querySelectorAll('tbody tr').forEach(row => {
      // Add row highlighting based on result
      const resultCell = row.querySelector('td:nth-child(3) .rank-badge');
      if (resultCell) {
        const isWin = resultCell.textContent.trim() === 'Win';
        row.style.backgroundColor = isWin ? '#1c2d1c' : '#2d1c1c';
        row.style.transition = 'background-color 0.3s';
        
        // Get all cells in the row
        const cells = Array.from(row.cells);
        let pointsCell;
        
        // If there's no points cell yet, create one
        if (cells.length < 6) {  // If we don't have a points column yet
          pointsCell = document.createElement('td');
          row.appendChild(pointsCell);
        } else {
          pointsCell = cells[cells.length - 1];  // Use the last cell
        }
        
        // Calculate points based on attacker/defender role and win/loss
        let points;
        let isAttacker = false;
        
        // Read the actual Role column to determine attacker/defender
        const rowCells = row.querySelectorAll('td');
        let roleText = '';
        
        // Find the role column (usually contains "Attacker" or "Defender")
        for (let i = 0; i < rowCells.length; i++) {
          const cellText = rowCells[i].textContent.toLowerCase().trim();
          if (cellText === 'attacker' || cellText === 'defender') {
            roleText = cellText;
            break;
          }
        }
        
        // Determine if attacker based on role column
        isAttacker = (roleText === 'attacker');
        

        
        if (isWin) {
          // Winner gets +15 (attacker) or +5 (defender)
          points = isAttacker ? '+10' : '+5';
        } else {
          // Loser gets -15 (attacker) or -5 (defender)
          points = isAttacker ? '-15' : '-5';
        }
        
        // Update points cell content and styling
        pointsCell.textContent = points;
        pointsCell.style.color = isWin ? '#8ff0a4' : '#ff9a9a';
        pointsCell.style.fontWeight = 'bold';
      }
    });
  }

  function updatePredictionBox(winProbability) {
    const box = document.getElementById('pvp-prediction-box');
    if (!box) {
      return;
    }
    
    if (isNaN(winProbability) || winProbability < 0 || winProbability > 1) {
      box.textContent = '⚔️ Expected Result: Invalid data';
      return;
    }
    
    const percentage = (winProbability * 100).toFixed(1);
    let result = '';
    
    if (winProbability > 0.5) {
      result = 'WINNING';
    } else if (winProbability < 0.5) {
      result = 'LOSING';
    } else {
      result = 'EVEN';
    }
    
    const resultText = `⚔️ Expected Result: ${result} (${percentage}%)`;
    box.textContent = resultText;
    
    // Handle auto-surrender if enabled and probability is low
    if (extensionSettings.pvpAutoSurrender.enabled && winProbability < extensionSettings.pvpAutoSurrender.surrenderThreshold) {
      box.textContent += ' ⚠️ Auto-surrender in 2s';
      box.style.borderColor = '#f38ba8'; // Red border
      setTimeout(() => performAutoSurrender(), 2000); // Auto-surrender after 2 seconds
    } else {
      box.style.borderColor = '#666';
    }
  }



  function addBattleHideImagesToggle() {
    
    // Check if filter container already exists
    if (document.getElementById('battle-filter-container')) {
      return;
    }
    
    // Create the filter container
    const filterContainer = document.createElement('div');
    filterContainer.id = 'battle-filter-container';
    filterContainer.style.cssText = `
      padding: 10px;
      background: rgb(45, 45, 61);
      border-radius: 5px;
      margin-bottom: 15px;
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
    `;
    
    filterContainer.innerHTML = `
      <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-start; justify-content: center; width: 100%;">
        <label style="display: flex; align-items: center; gap: 5px; color: #cdd6f4;">
            <input type="checkbox" id="battle-hide-images-toggle" class="cyberpunk-checkbox" ${extensionSettings.battlePageHideImages ? 'checked' : ''}>
          🖼️ Hide all images
        </label>
        
        <button id="battle-clear-filters" style="padding: 5px 10px; background: #f38ba8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
          Reset
        </button>
      </div>
    `;
    
    // Find where to insert the filter container
    const contentArea = document.querySelector('.content-area, .main-content, .game-content');
    if (contentArea) {
      // Insert at the top of the content area
      contentArea.insertBefore(filterContainer, contentArea.firstChild);
    } else {
      // Fallback: insert after the back button
      const backButton = document.querySelector('a[href*="active_wave.php"]');
      if (backButton && backButton.parentElement) {
        backButton.parentElement.insertBefore(filterContainer, backButton.nextSibling);
      }
    }
    
    // Add event listeners
    const hideImagesCheckbox = document.getElementById('battle-hide-images-toggle');
    const clearButton = document.getElementById('battle-clear-filters');
    
    if (hideImagesCheckbox) {
      hideImagesCheckbox.addEventListener('change', function() {
        extensionSettings.battlePageHideImages = this.checked;
        saveSettings();
        applyBattleImageSettings();
        
        showNotification(extensionSettings.battlePageHideImages ? 'All images hidden' : 'All images shown', 'success');
      });
    }
    
    if (clearButton) {
      clearButton.addEventListener('click', function() {
        extensionSettings.battlePageHideImages = true;
        saveSettings();
        applyBattleImageSettings();
        
        if (hideImagesCheckbox) {
          hideImagesCheckbox.checked = false;
        }
        
        showNotification('Battle filters reset', 'success');
      });
    }
    
    // Apply initial state based on current setting
    applyBattleImageSettings();
    

  }


  function applyBattleImageSettings() {
    const isBattlePage = window.location.pathname.includes('battle.php');
    if (!isBattlePage) return;
    
    if (extensionSettings.battlePageHideImages) {
      document.body.classList.add('battle-images-hidden');
    } else {
      document.body.classList.remove('battle-images-hidden');
    }
  }

  function createTopbarSettingsButton() {
    const topbarRight = document.querySelector('.gtb-right');
    if (!topbarRight || document.querySelector('.topbar-settings-btn')) return;
    
    const settingsButton = document.createElement('button');
    settingsButton.className = 'topbar-settings-btn';
    settingsButton.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
      </svg>
      <span>Settings</span>
    `;
    
    settingsButton.addEventListener('click', function() {
      this.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.style.transform = 'scale(1)';
      }, 150);
      
      showSettingsModal();
    });
    
    // Position it at the very end of the topbar
    topbarRight.appendChild(settingsButton);
  }

  function makeSideDrawerProfileClickable() {
    const smallUser = document.querySelector('.side-drawer-inner .small-user');
    if (!smallUser) return;
    // Prevent duplicate listeners
    if (smallUser.getAttribute('data-profile-link') === 'true') return;
    const pid = userId || getCookieExtension('demon');
    if (!pid) return;
    smallUser.style.cursor = 'pointer';
    smallUser.setAttribute('data-profile-link', 'true');
    smallUser.addEventListener('click', () => {
      window.location.href = `player.php?pid=${pid}`;
    });
    // Optional: add hover effect
    smallUser.addEventListener('mouseenter', () => {
      smallUser.style.background = 'rgba(137,180,250,0.08)';
    });
    smallUser.addEventListener('mouseleave', () => {
      smallUser.style.background = '';
    });
  }

  function createBackToDashboardButton() {
    const topbarInner = document.querySelector('.gtb-inner');
    if (!topbarInner || document.querySelector('.back-to-dashboard-btn')) return;
    
    const backButton = document.createElement('a');
    backButton.className = 'back-to-dashboard-btn';
    backButton.href = 'game_dash.php';
    backButton.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" style="width: 12px; height: 12px;">
        <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
      </svg>
    `;
    backButton.title = 'Back to Dashboard';
    
    // Position it in the left section before stamina
    const gtbLeft = topbarInner.querySelector('.gtb-left');
    if (gtbLeft) {
      // Insert at the very beginning of gtb-left (before stamina)
      gtbLeft.insertBefore(backButton, gtbLeft.firstChild);
    } else {
      // Fallback: position at the beginning
      topbarInner.insertBefore(backButton, topbarInner.firstChild);
    }
    
    console.log('Back to Dashboard button added to topbar left');
  }

  function removeOriginalBackButton() {
    // Remove the specific back button from page content
    const backButton = document.querySelector('a[href="game_dash.php"][class="btn"]');
    if (backButton && backButton.textContent.includes('⬅ Back to Dashboard')) {
      backButton.remove();
      console.log('Original back to dashboard button removed from page content');
    }
  }

  function setupSettingsModalListeners() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    // Add collapsible functionality to all sections 
    modal.querySelectorAll('.settings-section').forEach(section => {
      if (!section.querySelector('.settings-section-header')) {
        // Add leaderboard if present (single rendering only)
        if (monster.leaderboard && monster.leaderboard.length > 0) {
          html += `<div style=\"background: #181825; padding: 10px; border-radius: 8px; margin-bottom: 10px;\">\n\
          contentDiv.className = 'settings-section-content expanded';
          contentDiv.innerHTML = content.replace(title.outerHTML, '');
          section.appendChild(contentDiv);`
        }
      }

      const header = section.querySelector('.settings-section-header');
      const content = section.querySelector('.settings-section-content');
      const icon = header?.querySelector('.expand-icon');

    });
  }

  // Hotkeys settings wiring
  function setupHotkeySettings() {
    try {
      // Ensure hotkeys object defaults exist
      if (!extensionSettings.hotkeys) {
        extensionSettings.hotkeys = {
          enabled: true,
          monsterSelection: true,
          showOverlays: true,
          battleAttacks: true,
          monsterSelectionKeys: ['1','2','3','4','5','6','7','8','9'],
          battleAttackKeys: ['s','p','h','u','l']
        };
      }

      const enabledEl = document.getElementById('hotkeys-enabled');
      const monsterSelEl = document.getElementById('hotkeys-monster-selection');
      const overlaysEl = document.getElementById('hotkeys-show-overlays');
      const battleAtkEl = document.getElementById('hotkeys-battle-attacks');

      if (enabledEl) enabledEl.checked = !!extensionSettings.hotkeys.enabled;
      if (monsterSelEl) monsterSelEl.checked = !!extensionSettings.hotkeys.monsterSelection;
      if (overlaysEl) overlaysEl.checked = !!extensionSettings.hotkeys.showOverlays;
      if (battleAtkEl) battleAtkEl.checked = !!extensionSettings.hotkeys.battleAttacks;

      const setKey = (listName, index, value) => {
        const v = (value || '').toString().trim();
        const key = v ? v[0] : '';
        if (!extensionSettings.hotkeys[listName]) extensionSettings.hotkeys[listName] = [];
        extensionSettings.hotkeys[listName][index] = key ? key.toLowerCase() : '';
      };

      // Initialize inputs for monster selection keys (1..9)
      const monsterDefaults = ['1','2','3','4','5','6','7','8','9'];
      for (let i = 1; i <= 9; i++) {
        const input = document.getElementById(`hotkey-monster-${i}`);
        if (!input) continue;
        const current = extensionSettings.hotkeys.monsterSelectionKeys?.[i-1] || monsterDefaults[i-1];
        input.value = current.toUpperCase();
        input.addEventListener('input', () => {
          const char = (input.value || '').replace(/\s+/g,'').slice(0,1);
          input.value = char.toUpperCase();
          setKey('monsterSelectionKeys', i-1, char);
          saveSettings();
          // Update overlays live on wave page
          try { addMonsterCardHotkeyOverlays(); } catch {}
        });
      }

      // Initialize inputs for battle attack keys (S,P,H,U,L)
      const attackDefaults = ['s','p','h','u','l'];
      for (let i = 1; i <= 5; i++) {
        const input = document.getElementById(`hotkey-attack-${i}`);
        if (!input) continue;
        const current = extensionSettings.hotkeys.battleAttackKeys?.[i-1] || attackDefaults[i-1];
        input.value = current.toUpperCase();
        input.addEventListener('input', () => {
          const char = (input.value || '').replace(/\s+/g,'').slice(0,1);
          input.value = char.toUpperCase();
          setKey('battleAttackKeys', i-1, char);
          saveSettings();
          // Update overlays live in modal
          try { addBattleAttackHotkeyOverlays(); } catch {}
        });
      }

      // Toggle listeners
      enabledEl?.addEventListener('change', () => {
        extensionSettings.hotkeys.enabled = !!enabledEl.checked; saveSettings();
      });
      monsterSelEl?.addEventListener('change', () => {
        extensionSettings.hotkeys.monsterSelection = !!monsterSelEl.checked; saveSettings();
        try { addMonsterCardHotkeyOverlays(); } catch {}
      });
      overlaysEl?.addEventListener('change', () => {
        extensionSettings.hotkeys.showOverlays = !!overlaysEl.checked; saveSettings();
        try { addMonsterCardHotkeyOverlays(); addBattleAttackHotkeyOverlays(); } catch {}
      });
      battleAtkEl?.addEventListener('change', () => {
        extensionSettings.hotkeys.battleAttacks = !!battleAtkEl.checked; saveSettings();
        try { addBattleAttackHotkeyOverlays(); } catch {}
      });

      // Reset buttons
      const resetMonsterBtn = document.getElementById('hotkeys-reset-monster-keys');
      resetMonsterBtn?.addEventListener('click', () => {
        extensionSettings.hotkeys.monsterSelectionKeys = [...monsterDefaults];
        for (let i = 1; i <= 9; i++) {
          const input = document.getElementById(`hotkey-monster-${i}`);
          if (input) input.value = monsterDefaults[i-1].toUpperCase();
        }
        saveSettings();
        try { addMonsterCardHotkeyOverlays(); } catch {}
      });

      const resetAttackBtn = document.getElementById('hotkeys-reset-attack-keys');
      resetAttackBtn?.addEventListener('click', () => {
        extensionSettings.hotkeys.battleAttackKeys = [...attackDefaults];
        for (let i = 1; i <= 5; i++) {
          const input = document.getElementById(`hotkey-attack-${i}`);
          if (input) input.value = attackDefaults[i-1].toUpperCase();
        }
        saveSettings();
        try { addBattleAttackHotkeyOverlays(); } catch {}
      });
    } catch (e) {
      console.error('setupHotkeySettings error', e);
    }
  }
  function updateColorSelections() {
      // Helper to normalize various color formats to #rrggbb for color inputs
      const normalizeToHex = (val, fallback = '#000000') => {
        if (!val) return fallback;
        // Already a hex (#rrggbb or #rgb)
        if (typeof val === 'string' && val.startsWith('#')) {
          // Expand shorthand #rgb
          if (val.length === 4) {
            return '#' + val[1] + val[1] + val[2] + val[2] + val[3] + val[3];
          }
          return val;
        }
        // rgb() or rgba()
        const rgbaMatch = String(val).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/i);
        if (rgbaMatch) {
          const r = parseInt(rgbaMatch[1], 10);
          const g = parseInt(rgbaMatch[2], 10);
          const b = parseInt(rgbaMatch[3], 10);
          const toHex = (n) => ('0' + Math.max(0, Math.min(255, n)).toString(16)).slice(-2);
          return '#' + toHex(r) + toHex(g) + toHex(b);
        }
        // As a last resort, try to compute using canvas (handles named colors)
        try {
          const ctx = document.createElement('canvas').getContext('2d');
          ctx.fillStyle = '#000';
          ctx.fillStyle = val;
          const computed = ctx.fillStyle; // will be rgb(...) or #rrggbb
          const m = String(computed).match(/#([0-9a-f]{6})/i);
          if (m) return '#' + m[1];
        } catch (e) { /* ignore */ }
        return fallback;
      };

      // Update sidebar color input
      const sidebarColorInput = document.getElementById('sidebar-custom-color');
      if (sidebarColorInput) {
        sidebarColorInput.value = normalizeToHex(extensionSettings.sidebarColor, '#1e1e1e');
      }

      // Update background color input
      const backgroundColorInput = document.getElementById('background-custom-color');
      if (backgroundColorInput) {
        backgroundColorInput.value = normalizeToHex(extensionSettings.backgroundColor, '#000000');
      }

      // Update monster image outline color input
      const monsterImageColorInput = document.getElementById('monster-image-custom-color');
      if (monsterImageColorInput) {
        monsterImageColorInput.value = normalizeToHex(extensionSettings.monsterImageOutlineColor, '#ff6b6b');
      }

      // Update loot card border color input
      const lootCardColorInput = document.getElementById('loot-card-custom-color');
      if (lootCardColorInput) {
        lootCardColorInput.value = normalizeToHex(extensionSettings.lootCardBorderColor, '#f38ba8');
      }
  }

  // Menu Customization Functions - Make them globally accessible
  window.toggleMenuCustomization = function() {
    extensionSettings.menuCustomizationExpanded = !extensionSettings.menuCustomizationExpanded;
    const content = document.getElementById('menu-customization-content');
    const icon = document.getElementById('menu-customization-icon');
    
    if (content && icon) {
      content.style.display = extensionSettings.menuCustomizationExpanded ? 'block' : 'none';
      icon.textContent = extensionSettings.menuCustomizationExpanded ? '–' : '+';
      
      if (extensionSettings.menuCustomizationExpanded) {
        populateMenuItemsList();
      }
    }
    
    saveSettings();
  };

  function populateMenuItemsList() {
    const container = document.getElementById('menu-items-list');
    if (!container) return;

    // Sort menu items by order
    const sortedItems = [...extensionSettings.menuItems].sort((a, b) => a.order - b.order);

    console.log('Sorted Menu Items:', sortedItems);

    container.innerHTML = '';
    
    sortedItems.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'menu-item-row';
      row.draggable = true;
      row.dataset.itemId = item.id;
      
      row.innerHTML = `
        <div class="drag-handle" title="Drag to reorder">⋮⋮</div>
        <div class="menu-item-name">${item.name}</div>
        <div class="menu-item-controls">
          <div class="menu-item-toggle ${item.visible ? 'active' : ''}" data-item-id="${item.id}"></div>
          <div class="menu-item-arrows">
            <button class="arrow-btn" data-item-id="${item.id}" data-direction="up" ${index === 0 ? 'disabled' : ''}>▲</button>
            <button class="arrow-btn" data-item-id="${item.id}" data-direction="down" ${index === sortedItems.length - 1 ? 'disabled' : ''}>▼</button>
          </div>
        </div>
      `;
      
      // Add drag and drop event listeners
      row.addEventListener('dragstart', handleDragStart);
      row.addEventListener('dragover', handleDragOver);
      row.addEventListener('drop', handleDrop);
      row.addEventListener('dragend', handleDragEnd);
      
      // Add toggle event listener
      const toggle = row.querySelector('.menu-item-toggle');
      toggle.addEventListener('click', function() {
        const itemId = this.dataset.itemId;
        toggleMenuItemVisibility(itemId);
      });
      
      // Add arrow button event listeners
      const arrowButtons = row.querySelectorAll('.arrow-btn');
      arrowButtons.forEach(button => {
        button.addEventListener('click', function() {
          const itemId = this.dataset.itemId;
          const direction = this.dataset.direction;
          moveMenuItem(itemId, direction);
        });
      });
      
      container.appendChild(row);
    });
  }

  window.toggleMenuItemVisibility = function(itemId) {
    const item = extensionSettings.menuItems.find(i => i.id === itemId);
    if (item) {
      item.visible = !item.visible;
      saveSettings();
      populateMenuItemsList(); // Refresh the list
    }
  };

  window.moveMenuItem = function(itemId, direction) {
    const sortedItems = [...extensionSettings.menuItems].sort((a, b) => a.order - b.order);
    const currentIndex = sortedItems.findIndex(item => item.id === itemId);
    
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= sortedItems.length) return;
    
    // Swap the items
    [sortedItems[currentIndex], sortedItems[newIndex]] = [sortedItems[newIndex], sortedItems[currentIndex]];
    
    // Update the order values
    sortedItems.forEach((item, index) => {
      item.order = index;
    });
    
    saveSettings();
    populateMenuItemsList(); // Refresh the list
  };

  // Drag and Drop Functions
  let draggedElement = null;

  function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (this !== draggedElement) {
      this.classList.add('drag-over');
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    if (this !== draggedElement) {
      const draggedId = draggedElement.dataset.itemId;
      const targetId = this.dataset.itemId;
      
      // Find the items in the settings
      const draggedItem = extensionSettings.menuItems.find(item => item.id === draggedId);
      const targetItem = extensionSettings.menuItems.find(item => item.id === targetId);
      
      if (draggedItem && targetItem) {
        // Swap the order values
        const tempOrder = draggedItem.order;
        draggedItem.order = targetItem.order;
        targetItem.order = tempOrder;
        
        saveSettings();
        populateMenuItemsList(); // Refresh the list
      }
    }
  }

  function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.menu-item-row').forEach(row => {
      row.classList.remove('drag-over');
    });
    draggedElement = null;
  }

  window.resetMenuCustomization = function() {
    // Try to build menu items from localStorage `uiaddon_side_names` (if present).
    // Stored value expected to contain JSON array of names.
    try {
      const stored = localStorage.getItem('uiaddon_side_names');
      if (stored) {
        try {
          const names = JSON.parse(stored);
          if (Array.isArray(names) && names.length) {
            const seen = new Set();
            extensionSettings.menuItems = names.map((nm, idx) => {
              const raw = String(nm || '').trim();
              let baseId = raw.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
              if (!baseId) baseId = `item_${idx}`;
              let id = baseId;
              let suffix = 1;
              while (seen.has(id)) {
                id = `${baseId}_${suffix++}`;
              }
              seen.add(id);
              return { id, name: raw || `Item ${idx + 1}`, visible: true, order: idx };
            });
          } else {
            // Fallback to defaults stored in DEFAULT_EXTENSION_SETTINGS
            extensionSettings.menuItems = JSON.parse(JSON.stringify(DEFAULT_EXTENSION_SETTINGS.menuItems || []));
          }
        } catch (e) {
          console.error('Failed to parse uiaddon_side_names from storage, falling back to defaults', e);
          extensionSettings.menuItems = JSON.parse(JSON.stringify(DEFAULT_EXTENSION_SETTINGS.menuItems || []));
        }
      } else {
        // No stored value present — restore default menu
        extensionSettings.menuItems = JSON.parse(JSON.stringify(DEFAULT_EXTENSION_SETTINGS.menuItems || []));
      }
    } catch (err) {
      console.error('Error resetting menu customization from storage, using defaults', err);
      extensionSettings.menuItems = JSON.parse(JSON.stringify(DEFAULT_EXTENSION_SETTINGS.menuItems || []));
    }

    saveSettings();
    populateMenuItemsList();
    showNotification('Menu customization reset', 'success');
  };

  window.applyMenuCustomization = function() {
    saveSettings();
  };

  function initSidebarFunctionality() {
    // Re-initialize all sidebar event listeners and functionality
    setupSidebarToggle();
    setupExpandButtons();
    setupSettingsLink();
    // Add other sidebar functionality as needed
  }

  function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  function resetSettings() {
    extensionSettings = {
      sidebarColor: 'rgb(18,18,18)',
      backgroundColor: '#000000',
      statAllocationCollapsed: true,
      statsExpanded: false,
      petsExpanded: false,
      blacksmithExpanded: false,
      continueBattlesExpanded: true,
      lootExpanded: true,
      merchantExpanded: false,
      inventoryExpanded: false,
      pinnedMerchantItems: [],
      pinnedInventoryItems: [],
      multiplePotsEnabled: false,
      multiplePotsCount: 3,
      pinnedItemsLimit: 10,
      gateGraktharWave: 3,
      equipSets: {
        enabled: true,
        storageKey: 'demonGameEquipSets',
        applyDelay: 350,
        showInSidebar: true
      }
    };
    saveSettings();
    applySettings();
    updateColorSelections();
    updateSidebarMerchantSection();
    updateSidebarInventorySection();
    showNotification('Settings reset to default!', 'success');
  }

  function clearAllData() {
    if (confirm('Are you sure you want to clear ALL extension data? This will remove all settings, pinned items, and preferences. This action cannot be undone.')) {
      // Clear all extension-related localStorage data
      localStorage.removeItem('demonGameExtensionSettings');
      localStorage.removeItem('demonGameFilterSettings');
      localStorage.removeItem('inventoryView');
      
      // Reset extension settings to default
      extensionSettings = {
        sidebarColor: '#1e1e1e',
        backgroundColor: '#000000',
        statAllocationCollapsed: true,
        statsExpanded: false,
        petsExpanded: false,
        blacksmithExpanded: false,
        continueBattlesExpanded: true,
        lootExpanded: true,
        merchantExpanded: false,
        inventoryExpanded: false,
        pinnedMerchantItems: [],
        pinnedInventoryItems: [],
        multiplePotsEnabled: false,
        multiplePotsCount: 3,
        pinnedItemsLimit: 10,
        gateGraktharWave: 3,
        equipSets: {
          enabled: true,
          storageKey: 'demonGameEquipSets',
          applyDelay: 350,
          showInSidebar: true
        }
      };
      
      // Apply default settings
      applySettings();
      updateSidebarMerchantSection();
      updateSidebarInventorySection();
      
      // Close settings modal
      closeSettingsModal();
      
      showNotification('All extension data has been cleared!', 'success');
      
      // Reload page to ensure clean state
      setTimeout(() => {
        if (confirm('Reload the page to complete the reset?')) {
          window.location.reload();
        }
      }, 2000);
    }
  }

  // Global function assignments will be moved to the end of the file

  // Debug function for troubleshooting
  function debugExtension() {
    console.log('Extension Debug Info:');
    console.log('User ID:', userId);
    console.log('Current Path:', window.location.pathname);
    console.log('Extension Settings:', extensionSettings);
    console.log('Pinned Merchant Items:', extensionSettings.pinnedMerchantItems);
    console.log('Pinned Inventory Items:', extensionSettings.pinnedInventoryItems);
    
    const sidebar = document.getElementById('game-sidebar');
    console.log('Sidebar Element:', sidebar ? 'Found' : 'Not Found');
    
    const merchantSection = document.getElementById('merchant-expanded');
    console.log('Merchant Section:', merchantSection ? 'Found' : 'Not Found');
    
    const inventorySection = document.getElementById('inventory-expanded');
    console.log('Inventory Section:', inventorySection ? 'Found' : 'Not Found');
    
    // Check for notification element
    const notification = document.getElementById('notification');
    console.log('Notification Element:', notification ? 'Found' : 'Not Found');
  }

  // Make debug function globally available
  window.debugExtension = debugExtension;

  // Error handling wrapper for all functions
  function safeExecute(func, context = 'Unknown') {
    try {
      return func();
    } catch (error) {
      console.error(`Error in ${context}:`, error);
      if (typeof showNotification === 'function') {
        showNotification(`Error in ${context}: ${error.message}`, 'error');
      }
    }
  }

  // MAIN INITIALIZATION

  if (document.querySelector('.game-topbar')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => safeExecute(initializeExtension, 'DOMContentLoaded'));
    } else {
      safeExecute(initializeExtension, 'Direct Initialization');
    }
  }

  // Also apply background images when window is fully loaded
  window.addEventListener('load', () => {
    setTimeout(() => {
        safeExecute(() => applyCustomBackgrounds(), 'Window Load Background Images');
    }, 300);
  });

  function initializeExtension() {
    const version = (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getManifest === 'function')
      ? chrome.runtime.getManifest().version
      : (typeof browser !== 'undefined' && browser.runtime && typeof browser.runtime.getManifest === 'function')
        ? browser.runtime.getManifest().version
        : 'dev';
    console.log(`Demon Game Enhancement v${version} - Initializing...`);
      window._uiaddon_initing = true;
      // Clean up any existing observers
      if (window.backgroundObserver) {
        window.backgroundObserver.disconnect();
        window.backgroundObserver = null;
      }
    
    // Load settings first
    safeExecute(() => loadSettings(), 'Load Settings');
    // Optionally check for updates silently on startup (at most daily)
    try {
      if (extensionSettings?.updates?.autoCheck) {
        checkForUpdates({ force: false, updateUI: false });
      }
    } catch (e) { console.warn('Startup update check skipped:', e); }
    
    // Initialize sidebar
    safeExecute(() => initSideBar(), 'Sidebar Initialization');

  safeExecute(() => updateGameSideDrawer(), 'Game Side Drawer Update');
  // Ensure the Gate links reflect current selections after drawer setup
  try { setTimeout(() => updateSideNavWaveLinks(), 200); } catch (e) {}

    safeExecute(() => {
      try { applySideDrawerNamesFromStorage(); } catch (e) { console.error('Failed to apply saved menuItems on init', e); }
    }, 'Apply saved sidebar menu ordering');
    
    // Disable dragging on interactive elements
    safeExecute(() => initDraggableFalse(), 'Disable Dragging');
    
    // Initialize page-specific functionality
    safeExecute(() => initPageSpecificFunctionality(), 'Page-Specific Functionality');
    
    // Initialize new systems
    safeExecute(() => initUserData(), 'User Data Initialization');
    safeExecute(() => initSidebarQuestWidget(), 'Quest Widget');
    safeExecute(() => initializePetTeams(), 'Pet Teams');
    safeExecute(() => initSemiTransparentPersistence(), 'Semi-Transparent Effect');
    
    // Update sidebar quantities on all pages
    setTimeout(() => {
      safeExecute(() => updateSidebarInventorySection(), 'Sidebar Quantities');
    }, 1000);
    
    // Apply background images after a short delay to ensure DOM is ready
    setTimeout(() => {
        safeExecute(() => applyCustomBackgrounds(), 'Background Images');
    }, 200);
    
    // Initialize stamina per hour calculation immediately (no delay needed)
    safeExecute(() => initStaminaPerHourCalculation(), 'Stamina Per Hour Calculation');
    
  console.log(`Demon Game Enhancement v${version} - Initialization Complete!`);
    console.log('Type debugExtension() in console for debug info');
    // Initialization finished — allow auto-save behavior on future updates
    window._uiaddon_initing = false;
  }


  function initPageSpecificFunctionality() {
    const currentPath = window.location.pathname;

    for (const [path, handlers] of Object.entries(extensionPageHandlers)) {
      if (currentPath.includes(path)) {
        console.log(`Initializing ${path} functionality`);
        if (Array.isArray(handlers)) {
          handlers.forEach(handler => handler());
        } else {
          handlers();
        }
      }
    }

      // Initialize universal loot card highlighting
      initUniversalLootHighlighting();

      // Apply custom backgrounds
      applyCustomBackgrounds();
      
      // Apply monster backgrounds
      applyMonsterBackgrounds();
      
      // Initialize monster background observer for dynamic updates
      initMonsterBackgroundObserver();

      // Apply background images for supported pages with better timing
    setTimeout(() => {
        applyCustomBackgrounds();
        applyMonsterBackgrounds();
      }, 200);
  }

  // Enhanced Quick Access Pinning System - Universal Sidebar Shortcuts

  // INVENTORY QUICK ACCESS FUNCTIONS
  function addInventoryQuickAccessButtons() {
      // Only run on inventory page
      if (!window.location.pathname.includes('inventory.php')) return;
      
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkAndAddButtons = () => {
          attempts++;
          
          // Look for inventory items (both equipped and unequipped sections)
          const inventoryItems = document.querySelectorAll('.slot-box:not(.empty):not([data-pin-added])');
          
          if (inventoryItems.length === 0) {
              if (attempts < maxAttempts) {
                  setTimeout(checkAndAddButtons, 100);
              }
          return;
          }
      };
      
      checkAndAddButtons();
  }

  function extractInventoryItemData(item) {
      try {
          // Get item image and name
          const img = item.querySelector('img');
          const itemName = img?.alt || 'Unknown Item';
          const imageSrc = img?.src || '';
          
          // Get label with stats/description
          const labelDiv = item.querySelector('.label');
          const labelText = labelDiv?.textContent || '';
          
          // Determine item type and extract relevant info
          let itemType = 'material'; // default
          let itemId = null;
          let equipSlot = null;
          let stats = '';
          
          // Check for buttons to determine type and extract IDs
          const useButton = item.querySelector('button[onclick*="useItem"]');
          const equipButton = item.querySelector('button[onclick*="showEquipModal"]');
          const unequipButton = item.querySelector('button[onclick*="unequipItem"]');
          
          if (useButton) {
              // Consumable item - we'll use name-based lookup instead of ID
              itemType = 'consumable';
              const onclickStr = useButton.getAttribute('onclick') || '';
              const match = onclickStr.match(/useItem\(([^)]+)\)/);
              itemId = match ? match[1] : null;
          } else if (equipButton) {
              // Equipment item
              itemType = 'equipment';
              const onclickStr = equipButton.getAttribute('onclick') || '';
              const match = onclickStr.match(/showEquipModal\(\s*(\d+)\s*,\s*['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\s*\)/);
              if (match) {
                  equipSlot = match[2];
                  itemId = match[3];
              }
          } else if (unequipButton) {
              itemType = 'equipped';
              const onclickStr = unequipButton.getAttribute('onclick') || '';
              const match = onclickStr.match(/unequipItem\(([^)]+)\)/);
              itemId = match ? match[1] : null;
          }
          
          // Extract stats from label
          if (labelText.includes('🔪') || labelText.includes('🛡️')) {
              const lines = labelText.split('\n').map(line => line.trim()).filter(Boolean);
              stats = lines.find(line => line.includes('🔪') || line.includes('🛡️')) || '';
          }
          
          // Get quantity if it exists
          let quantity = 1;
          const quantityMatch = labelText.match(/x(\d+)/);
          if (quantityMatch) {
              quantity = parseInt(quantityMatch[1], 10);
          }
          
          return {
              id: itemId || Date.now().toString(),
              name: itemName,
              image: imageSrc,
              type: itemType,
              equipSlot: equipSlot,
              stats: stats,
              quantity: quantity,
              rawLabel: labelText
          };
          
      } catch (error) {
          console.error('Error extracting inventory item data:', error);
          return null;
      }
  }

  async function addToInventoryQuickAccess(itemData, itemElement) {
    if (extensionSettings.pinnedInventoryItems.length >= extensionSettings.pinnedItemsLimit) {
      showNotification(`Maximum ${extensionSettings.pinnedItemsLimit} inventory items can be pinned!`, 'warning');
      return;
    }

      // For consumables, check by name instead of ID since IDs are unique per stack
      const checkKey = itemData.type === 'consumable' ? itemData.name : itemData.id;
      const alreadyPinned = extensionSettings.pinnedInventoryItems.some(item => {
          const pinnedKey = item.type === 'consumable' ? item.name : item.id;
          return pinnedKey === checkKey;
      });
      
      if (alreadyPinned) {
          showNotification(`"${itemData.name}" is already pinned!`, 'warning');
          return;
      }

    // For consumables, fetch fresh data to get current quantity
    if (itemData.type === 'consumable') {
      try {
        const freshItem = await findItemByName(itemData.name);
        if (freshItem) {
          itemData.quantity = freshItem.quantity;
          itemData.id = freshItem.itemId; // Update with current ID
          console.log(`Updated ${itemData.name} quantity to ${freshItem.quantity}`);
        }
      } catch (error) {
        console.error('Error fetching fresh item data:', error);
      }
      }

    extensionSettings.pinnedInventoryItems.push(itemData);
    saveSettings();
    updateSidebarInventorySection();
    showNotification(`Successfully pinned "${itemData.name}" to inventory quick access!`, 'success');
      
      // Update button text to show it's pinned
      const pinBtn = itemElement.querySelector('.extension-pin-btn');
      if (pinBtn) {
          pinBtn.textContent = '✓ Pinned';
          pinBtn.style.background = '#28a745';
          pinBtn.disabled = true;
      }
  }

  function removeFromInventoryQuickAccess(itemId, itemName) {
      // Use name for consumables, ID for others
      extensionSettings.pinnedInventoryItems = extensionSettings.pinnedInventoryItems.filter(item => {
          if (item.type === 'consumable') {
              return item.name !== itemName;
          }
          return item.id !== itemId;
      });
      
    saveSettings();
    updateSidebarInventorySection();
      showNotification(`Removed "${itemName || 'item'}" from inventory quick access`, 'info');
  }

  // Refresh quantities for pinned items
  async function refreshPinnedItemQuantities() {
    console.log('🔄 Refreshing pinned item quantities...');
    
    for (let item of extensionSettings.pinnedInventoryItems) {
      if (item.type === 'consumable') {
        try {
          const freshItem = await findItemByName(item.name);
          if (freshItem) {
            const oldQuantity = item.quantity;
            item.quantity = freshItem.quantity;
            item.id = freshItem.itemId;
            // Only log if quantity actually changed
            if (oldQuantity !== freshItem.quantity) {
              console.log(`✅ Refreshed ${item.name}: ${oldQuantity} → ${freshItem.quantity}`);
            }
          }
        } catch (error) {
          console.error(`Error refreshing ${item.name}:`, error);
        }
      }
    }
    saveSettings();
  }

  // Use website's native useItem function
  function useNativeItem(invId, itemId, itemName, availableQty, quantity = 1) {
      console.log(`🍯 Using ${quantity}x ${itemName} (ID: ${invId})`);
      
      // Call the website's native useItem function
      if (typeof useItem === 'function') {
          useItem(invId, itemId, itemName, availableQty);
          showNotification(`✅ Used ${quantity}x ${itemName}`, 'success');
      } else {
          console.error('Native useItem function not found');
          showNotification(`❌ Error: Native useItem function not available`, 'error');
      }
  }

  // Direct API call to use item (fallback when native function isn't available)
  async function useItemDirectly(invId, itemName, quantity = 1) {
      try {
          console.log(`🍯 Using ${quantity}x ${itemName} directly`);
          showNotification(`Using ${quantity}x ${itemName}...`, 'info');
          
          // Fetch fresh inventory to get current item ID
          const freshItem = await findItemByName(itemName);
          if (!freshItem) {
              showNotification(`❌ No ${itemName} found in inventory`, 'error');
                      return;
                  }
                  
          console.log(`🍯 Found fresh item: ${freshItem.name} (ID: ${freshItem.itemId})`);
                  
          const response = await fetch('use_item.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: `inv_id=${encodeURIComponent(freshItem.itemId)}${quantity > 1 ? `&qty=${quantity}` : ''}`
          });
          
          const result = await response.text();
          
          if (result.includes('successfully') || result.includes('Item consumed') || result.includes('success')) {
              showNotification(`✅ Used ${quantity}x ${itemName}`, 'success');
              
              // Update sidebar quantities - find the item element and update it
              const sidebarItems = document.querySelectorAll('.quick-access-item');
              const targetItem = Array.from(sidebarItems).find(item => 
                item.dataset.itemName === itemName
              );
              if (targetItem) {
                updateSidebarItemQuantity(targetItem, quantity);
              }
              setTimeout(() => {
                  updateSidebarInventorySection();
                  fetchAndUpdateSidebarStats();
              }, 500);
          } else {
              showNotification(`❌ Failed to use ${itemName}: ${result}`, 'error');
          }
      } catch (error) {
          console.error('Error using item:', error);
          showNotification(`❌ Error using ${itemName}: ${error.message}`, 'error');
      }
  }


  // UNIVERSAL INVENTORY ACTION - Works from any page
  async function executeInventoryAction(itemData, action) {
      try {
          if (action === 'use' && itemData.type === 'consumable') {
              // Use the website's native useItem function
              console.log(`Using native useItem for: ${itemData.name}`);
              
              if (typeof useItem === 'function') {
                  // Call native useItem with the stored data
                  useItem(itemData.id, itemData.itemId, itemData.name, itemData.quantity);
                  showNotification(`✅ Used ${itemData.name}`, 'success');
              } else {
                  // Use our own fetch-based approach when native function isn't available
                  await useItemDirectly(itemData.id, itemData.name, itemData.quantity);
              }
          } else if (action === 'buy' && itemData.type === 'merchant') {
              // Handle merchant item buying
              showNotification(`Visit merchant page to buy ${itemData.name}`, 'info');
              
          } else if (action === 'equip' && itemData.type === 'equipment') {
              showNotification(`Visit inventory page to equip ${itemData.name}`, 'info');
          } else {
              showNotification(`Action "${action}" not supported for this item type`, 'warning');
          }
    } catch (error) {
          showNotification(`${action} failed - script error`, 'error');
          console.error('Inventory action error:', error);
      }
  }

  // Function to update sidebar item quantity after use
  function updateSidebarItemQuantity(itemElement, usedQuantity) {
    if (!itemElement) return;
    
    const statsElement = itemElement.querySelector('.qa-item-stats');
    if (!statsElement) return;
    
    // Extract current quantity from "Available: X" text
    const currentText = statsElement.textContent;
    const match = currentText.match(/Available:\s*(\d+)/);
    
    if (match) {
      const currentQuantity = parseInt(match[1]);
      const newQuantity = Math.max(0, currentQuantity - usedQuantity);
      
      // Update the display
      statsElement.textContent = `Available: ${newQuantity}`;
      
      // If quantity reaches 0, disable use buttons
      if (newQuantity === 0) {
        const useButtons = itemElement.querySelectorAll('.qa-use-btn, .qa-use-multiple-btn');
        useButtons.forEach(btn => {
          btn.disabled = true;
          btn.style.opacity = '0.5';
        });
      }
      
      console.log(`Updated ${itemElement.dataset.itemName} quantity: ${currentQuantity} → ${newQuantity}`);
    }
  }

  // MERCHANT QUICK ACCESS FUNCTIONS
  function addMerchantQuickAccessButtons() {
      if (!window.location.pathname.includes('merchant.php')) return;
      
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkAndAddButtons = () => {
          attempts++;
          
          const merchantCards = document.querySelectorAll('.card[data-merch-id]:not([data-pin-added])');
          
          if (merchantCards.length === 0) {
              if (attempts < maxAttempts) {
                  setTimeout(checkAndAddButtons, 100);
              }
              return;
          }
          
          console.log(`Adding pin buttons to ${merchantCards.length} merchant cards`);
          
          merchantCards.forEach(card => {
              const itemData = extractMerchantItemData(card);
              if (!itemData) return;
              
              const pinBtn = document.createElement('button');
              pinBtn.className = 'btn extension-pin-btn';
              pinBtn.textContent = '📌 Pin';
              pinBtn.style.cssText = `
                  background: #8a2be2; 
                  color: white; 
                  margin-top: 5px; 
                  font-size: 11px; 
                  padding: 4px 8px; 
                  border: none; 
                  border-radius: 4px; 
                  cursor: pointer;
                  width: 100%;
              `;
              
              pinBtn.onclick = (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addToMerchantQuickAccess(itemData, card);
              };
              
              const actionsDiv = card.querySelector('.actions');
              if (actionsDiv) {
                  actionsDiv.appendChild(pinBtn);
              } else {
                  const infoDiv = card.querySelector('.info');
                  if (infoDiv) {
                      infoDiv.appendChild(pinBtn);
                  }
              }
              
              card.setAttribute('data-pin-added', 'true');
          });
      };
      
      checkAndAddButtons();
  }

  function extractMerchantItemData(card) {
      try {
          const merchId = card.getAttribute('data-merch-id');
          const currency = card.getAttribute('data-currency');
          const price = card.getAttribute('data-price');
          const maxQ = card.getAttribute('data-maxq');
          const bought = card.getAttribute('data-bought');
          
          const nameElement = card.querySelector('.name');
          const imgElement = card.querySelector('.thumb img');
          const priceElement = card.querySelector('.price');
          
          const itemName = nameElement?.textContent?.trim() || 'Unknown Item';
          const imageSrc = imgElement?.src || '';
          
          let priceDisplay = priceElement?.textContent?.trim() || `${price} ${currency}`;
          
          const buyButton = card.querySelector('.buy-btn');
          const canBuy = buyButton && !buyButton.disabled;
          
          const qtyInput = card.querySelector('.qty-input');
          const hasQuantityControl = !!qtyInput;
          
          return {
              id: merchId,
              name: itemName,
              image: imageSrc,
              currency: currency,
              price: parseInt(price, 10) || 0,
              priceDisplay: priceDisplay,
              maxQ: parseInt(maxQ, 10) || 0,
              bought: parseInt(bought, 10) || 0,
              canBuy: canBuy,
              hasQuantityControl: hasQuantityControl
          };
          
      } catch (error) {
          console.error('Error extracting merchant item data:', error);
          return null;
      }
  }

  function addToMerchantQuickAccess(itemData, cardElement) {
      if (extensionSettings.pinnedMerchantItems.length >= extensionSettings.pinnedItemsLimit) {
          showNotification(`Maximum ${extensionSettings.pinnedItemsLimit} merchant items can be pinned!`, 'warning');
          return;
      }
      
      const alreadyPinned = extensionSettings.pinnedMerchantItems.some(item => 
          item.id === itemData.id
      );
      
      if (alreadyPinned) {
          showNotification(`"${itemData.name}" is already pinned!`, 'warning');
          return;
      }
      
      extensionSettings.pinnedMerchantItems.push(itemData);
      saveSettings();
      updateSidebarMerchantSection();
      showNotification(`Successfully pinned "${itemData.name}" to merchant quick access!`, 'success');
      
      const pinBtn = cardElement.querySelector('.extension-pin-btn');
      if (pinBtn) {
          pinBtn.textContent = '✓ Pinned';
          pinBtn.style.background = '#28a745';
          pinBtn.disabled = true;
      }
  }

  function removeFromMerchantQuickAccess(itemId) {
      const removedItem = extensionSettings.pinnedMerchantItems.find(item => item.id === itemId);
      extensionSettings.pinnedMerchantItems = extensionSettings.pinnedMerchantItems.filter(item => item.id !== itemId);
      saveSettings();
      updateSidebarMerchantSection();
      showNotification(`Removed "${removedItem?.name || 'item'}" from merchant quick access`, 'info');
  }

  function addCollectionsDivider() {
      if (!window.location.pathname.includes('collections.php')) return;
      
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkAndAddDivider = () => {
          attempts++;
          
          // Find the collections grid
          const grid = document.querySelector('.panel .grid');
          
          if (!grid) {
              if (attempts < maxAttempts) {
                  setTimeout(checkAndAddDivider, 100);
              }
              return;
          }
          
          // Check if divider already exists
          if (grid.querySelector('.collection-divider')) {
              return;
          }
          
          // Get all collection cards
          const cards = Array.from(grid.querySelectorAll('.card[data-col-id]'));
          
          if (cards.length === 0) {
              if (attempts < maxAttempts) {
                  setTimeout(checkAndAddDivider, 100);
              }
              return;
          }
          
          // Separate completed and incomplete collections
          const completedCards = [];
          const incompleteCards = [];
          
          cards.forEach(card => {
              const claimButton = card.querySelector('button');
              const progressBar = card.querySelector('.bar');
              
              // Check button text
              const buttonText = claimButton ? claimButton.textContent.trim().toLowerCase() : '';
              
              // Check progress bar - the width is on .fill inside .bar
              let progressWidth = '0%';
              if (progressBar) {
                  const progressFill = progressBar.querySelector('.fill');
                  if (progressFill && progressFill.style.width) {
                      progressWidth = progressFill.style.width;
                  }
              }
              
              const isFullProgress = progressWidth === '100%';
              
              // A collection is completed and claimed if:
              // 1. Progress is 100% AND button says "claimed"
              // 2. Button is disabled AND says "claimed" (button is disabled after claiming)
              // 3. No button exists AND progress is 100% (already claimed in past)
              const isClaimed = buttonText === 'claimed';
              const isDisabled = claimButton ? claimButton.disabled : false;
              const hasNoButton = !claimButton;
              
              const isCompleted = (isFullProgress && isClaimed) || (hasNoButton && isFullProgress) || (isClaimed && isDisabled);
              
              if (isCompleted) {
                  completedCards.push(card);
              } else {
                  incompleteCards.push(card);
              }
          });
          
          // Only add divider if we have completed collections
          if (completedCards.length === 0) {
              return;
          }
          
          console.log(`Found ${incompleteCards.length} incomplete and ${completedCards.length} completed collections`);
          
          // Remove all cards from grid
          cards.forEach(card => card.remove());
          
          // Add incomplete collections first
          incompleteCards.forEach(card => grid.appendChild(card));
          
          // Create and add divider
          const divider = document.createElement('div');
          divider.className = 'collection-divider';
          divider.style.cssText = `
              grid-column: 1 / -1;
              margin: 20px 0;
              padding: 15px;
              background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
              border: 2px solid #444;
              border-radius: 8px;
              text-align: center;
              position: relative;
              overflow: hidden;
          `;
          
          divider.innerHTML = `
              <div style="
                  font-size: 18px;
                  font-weight: bold;
                  color: #4CAF50;
                  margin-bottom: 8px;
                  text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
              ">
                  COMPLETED COLLECTIONS
              </div>
              <div style="
                  font-size: 14px;
                  color: #888;
                  font-style: italic;
              ">
                  Collections below have been claimed and completed
              </div>
              <div style="
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: linear-gradient(45deg, transparent 45%, rgba(76, 175, 80, 0.1) 50%, transparent 55%);
                  pointer-events: none;
              "></div>
          `;
          
          grid.appendChild(divider);
          
          // Add completed collections after divider
          completedCards.forEach(card => {
              // Modify completed cards for simplified display
              const title = card.querySelector('.title');
              const rewardDiv = card.querySelector('.reward');
              const claimButton = card.querySelector('button');
              
              // Hide progress bar, requirements list, claim button, and other details
              const reqList = card.querySelector('.req-list');
              const progressRow = card.querySelector('.row');
              const progressBar = card.querySelector('.bar');
              
              if (reqList) reqList.style.display = 'none';
              if (progressRow && !progressRow.querySelector('.reward')) progressRow.style.display = 'none';
              if (progressBar) progressBar.style.display = 'none';
              if (claimButton) claimButton.style.display = 'none';
              
              // Style the card to look more subdued
              card.style.cssText += `
                  opacity: 0.8;
                  border: 2px solid #4CAF50;
                  background: linear-gradient(135deg, #1a4a1a 0%, #0d2a0d 100%);
              `;
              
              // Add completed indicator
              if (title && !title.querySelector('.completed-badge')) {
                  const badge = document.createElement('span');
                  badge.className = 'completed-badge';
                  badge.style.cssText = `
                      margin-left: 10px;
                      padding: 2px 8px;
                      background: #4CAF50;
                      color: white;
                      border-radius: 12px;
                      font-size: 10px;
                      font-weight: bold;
                      text-transform: uppercase;
                  `;
                  badge.textContent = 'CLAIMED';
                  title.appendChild(badge);
              }
              
              grid.appendChild(card);
          });
          
          console.log('Collections divider added successfully');
          
          // Set up mutation observer to watch for button text changes
          const observer = new MutationObserver((mutations) => {
              mutations.forEach((mutation) => {
                  if (mutation.type === 'childList' || mutation.type === 'characterData') {
                      const target = mutation.target;
                      // Check if a button's text changed to "Claimed"
                      if (target.tagName === 'BUTTON' || target.parentElement?.tagName === 'BUTTON') {
                          const button = target.tagName === 'BUTTON' ? target : target.parentElement;
                          if (button && button.textContent.trim().toLowerCase() === 'claimed') {
                              console.log('Button changed to "Claimed", reorganizing collections...');
                              // Wait a bit for any other changes, then reorganize
                              setTimeout(() => {
                                  // Remove existing divider first
                                  const existingDivider = grid.querySelector('.collection-divider');
                                  if (existingDivider) {
                                      existingDivider.remove();
                                  }
                                  // Re-run the divider function
                                  checkAndAddDivider();
                              }, 500);
                          }
                      }
                  }
              });
          });
          
          // Observe button changes in the grid
          if (grid) {
              observer.observe(grid, {
                  childList: true,
                  subtree: true,
                  characterData: true
              });
          }
      };
      
      checkAndAddDivider();
  }

  function addAchievementsDivider() {
      if (!window.location.pathname.includes('achievements.php')) return;
      
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkAndAddDivider = () => {
          attempts++;
          
          // Find the achievements grid
          const grid = document.querySelector('.panel .grid');
          
          if (!grid) {
              if (attempts < maxAttempts) {
                  setTimeout(checkAndAddDivider, 100);
              }
              return;
          }
          
          // Check if divider already exists
          if (grid.querySelector('.achievement-divider')) {
              return;
          }
          
          // Get all achievement cards
          const cards = Array.from(grid.querySelectorAll('.card[data-ach-id]'));
          
          if (cards.length === 0) {
              if (attempts < maxAttempts) {
                  setTimeout(checkAndAddDivider, 100);
              }
              return;
          }
          
          // Separate completed and incomplete achievements
          const completedCards = [];
          const incompleteCards = [];
          
          cards.forEach(card => {
              const claimButton = card.querySelector('button');
              const progressBar = card.querySelector('.bar');
              
              // Check button text
              const buttonText = claimButton ? claimButton.textContent.trim().toLowerCase() : '';
              
              // Check progress bar - the width is on .fill inside .bar
              let progressWidth = '0%';
              if (progressBar) {
                  const progressFill = progressBar.querySelector('.fill');
                  if (progressFill && progressFill.style.width) {
                      progressWidth = progressFill.style.width;
                  }
              }
              
              const isFullProgress = progressWidth === '100%';
              
              // An achievement is completed and claimed if:
              // 1. Progress is 100% AND button says "claimed"
              // 2. Button is disabled AND says "claimed" (button is disabled after claiming)
              // 3. No button exists AND progress is 100% (already claimed in past)
              const isClaimed = buttonText === 'claimed';
              const isDisabled = claimButton ? claimButton.disabled : false;
              const hasNoButton = !claimButton;
              
              const isCompleted = (isFullProgress && isClaimed) || (hasNoButton && isFullProgress) || (isClaimed && isDisabled);
              
              if (isCompleted) {
                  completedCards.push(card);
              } else {
                  incompleteCards.push(card);
              }
          });
          
          // Only add divider if we have completed achievements
          if (completedCards.length === 0) {
              return;
          }
          
          // Remove all cards from grid
          cards.forEach(card => card.remove());
          
          // Add incomplete achievements first
          incompleteCards.forEach(card => grid.appendChild(card));
          
          // Create and add divider
          const divider = document.createElement('div');
          divider.className = 'achievement-divider';
          divider.style.cssText = `
              grid-column: 1 / -1;
              margin: 20px 0;
              padding: 15px;
              background: linear-gradient(135deg, #2a2a1f 0%, #1a1a0f 100%);
              border: 2px solid #d4af37;
              border-radius: 8px;
              text-align: center;
              position: relative;
              overflow: hidden;
          `;
          
          divider.innerHTML = `
              <div style="
                  font-size: 18px;
                  font-weight: bold;
                  color: #FFD700;
                  margin-bottom: 8px;
                  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
              ">
                  COMPLETED ACHIEVEMENTS
              </div>
              <div style="
                  font-size: 14px;
                  color: #baa76a;
                  font-style: italic;
              ">
                  Achievements below have been claimed and completed
              </div>
              <div style="
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: linear-gradient(45deg, transparent 45%, rgba(255, 215, 0, 0.1) 50%, transparent 55%);
                  pointer-events: none;
              "></div>
          `;
          
          grid.appendChild(divider);
          
          // Add completed achievements after divider
          completedCards.forEach(card => {
              const title = card.querySelector('.title');
              const rewardDiv = card.querySelector('.desc');
              const claimButton = card.querySelector('button');
              
              // Hide description, progress bar, progress row details, and claim button for cleaner look
              const descriptionDiv = card.querySelector('.desc');
              const progressRows = card.querySelectorAll('.row');
              const progressBar = card.querySelector('.bar');
              
              // Hide the achievement description (first .desc element)
              if (descriptionDiv && !descriptionDiv.textContent.includes('Rewards:')) {
                  descriptionDiv.style.display = 'none';
              }
              
              // Hide progress rows except the one containing rewards
              progressRows.forEach(row => {
                  if (!row.querySelector('.desc')) {
                      row.style.display = 'none';
                  }
              });
              
              // Hide progress bar and claim button
              if (progressBar) {
                  progressBar.style.display = 'none';
              }
              if (claimButton) {
                  claimButton.style.display = 'none';
              }
              
              // Style the card to look more subdued with golden theme
              card.style.cssText += `
                  opacity: 0.8;
                  border: 2px solid #FFD700;
                  background: linear-gradient(135deg, #2a2a1f 0%, #1a1a0f 100%);
              `;
              
              // Add completed indicator
              if (title && !title.querySelector('.completed-badge')) {
                  const badge = document.createElement('span');
                  badge.className = 'completed-badge';
                  badge.style.cssText = `
                      margin-left: 10px;
                      padding: 2px 8px;
                      background: #FFD700;
                      color: #000;
                      border-radius: 12px;
                      font-size: 10px;
                      font-weight: bold;
                      text-transform: uppercase;
                      box-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
                  `;
                  badge.textContent = 'CLAIMED';
                  title.appendChild(badge);
              }
              
              grid.appendChild(card);
          });
          
          console.log('Achievements divider added successfully');
          
          // Set up mutation observer to watch for button text changes
          const observer = new MutationObserver((mutations) => {
              mutations.forEach((mutation) => {
                  if (mutation.type === 'childList' || mutation.type === 'characterData') {
                      const target = mutation.target;
                      // Check if a button's text changed to "Claimed"
                      if (target.tagName === 'BUTTON' || target.parentElement?.tagName === 'BUTTON') {
                          const button = target.tagName === 'BUTTON' ? target : target.parentElement;
                          if (button && button.textContent.trim().toLowerCase() === 'claimed') {
                              console.log('Button changed to "Claimed", reorganizing achievements...');
                              // Wait a bit for any other changes, then reorganize
                              setTimeout(() => {
                                  // Remove existing divider first
                                  const existingDivider = grid.querySelector('.achievement-divider');
                                  if (existingDivider) {
                                      existingDivider.remove();
                                  }
                                  // Re-run the divider function
                                  checkAndAddDivider();
                              }, 500);
                          }
                      }
                  }
              });
          });
          
          // Observe button changes in the grid
          if (grid) {
              observer.observe(grid, {
                  childList: true,
                  subtree: true,
                  characterData: true
              });
          }
      };
      
      checkAndAddDivider();
  }

  // UNIVERSAL MERCHANT BUY - Works from any page
  async function executeMerchantBuy(itemData, quantity = 1) {
      try {
          const qty = Math.max(1, Math.min(quantity || 1, 99));
          
          const response = await fetch('merchant_buy.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: `merch_id=${encodeURIComponent(itemData.id)}&qty=${encodeURIComponent(qty)}`
          });
          
          let data;
          try {
              data = await response.json();
          } catch {
              data = { status: 'error', message: 'Invalid response from server' };
          }
          
          if (data && data.status === 'success') {
              showNotification(`Bought ${qty}x ${itemData.name}!`, 'success');
              
              // Update pinned item data if server provides updated info
              if (typeof data.remaining === 'number') {
                  const pinnedItem = extensionSettings.pinnedMerchantItems.find(item => item.id === itemData.id);
                  if (pinnedItem) {
                      pinnedItem.bought = pinnedItem.maxQ - data.remaining;
                      pinnedItem.canBuy = data.remaining > 0;
                      saveSettings();
                  }
              }
              
              // Update displays
              setTimeout(() => {
                  updateSidebarMerchantSection();
                  fetchAndUpdateSidebarStats(); // Update currency display
              }, 500);
              
          } else {
              const message = data?.message || 'Purchase failed';
              const isInsufficientFunds = message.toLowerCase().includes('not enough');
              showNotification(message, isInsufficientFunds ? 'warning' : 'error');
          }
          
    } catch (error) {
          showNotification('Purchase failed - network error', 'error');
          console.error('Merchant buy error:', error);
    }
  }

  //#region Monster filters and existing functionality
  // Lightweight debounce to avoid rerunning filters on every keystroke
  function debounce(fn, delay = 120) {
    let t = null;
    return function(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  }
  async function loadFilterSettings() {
    return new Promise((resolve) => {
      try {
        const settings = JSON.parse(localStorage.getItem('demonGameFilterSettings') || '{}');
        resolve(settings);
      } catch {
        resolve({});
      }
    });
  }

  async function initMonsterFilter() {
    const observer = new MutationObserver(async (mutations, obs) => {
      const monsterList = document.querySelectorAll('.monster-card');
      if (monsterList.length > 0) {
        obs.disconnect();
        const settings = await loadFilterSettings();
        // Render immediately with live DOM for instant UI paint
        createFilterUI(monsterList, settings);
        // Optional: warm up in background (non-blocking) to enrich types later if needed
        // We intentionally skip updating the UI here to keep things snappy.
        // buildCombinedMonsterList().catch(() => {});
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Build a combined monster list using both hide_dead_monsters=0 and =1 pages
  async function buildCombinedMonsterList() {
    const combined = new Map(); // key: name text, value: dummy object with name

    const addFromDoc = (doc) => {
      if (!doc) return;
      const cards = doc.querySelectorAll('.monster-card');
      cards.forEach(card => {
        const name = (card.querySelector('.monster-name, h3, h2')?.textContent || '').trim();
        if (!name) return;
        if (!combined.has(name)) {
          // Store a minimal object that mimics the part of monsterList createFilterUI uses
          combined.set(name, { _uiaddon_name: name });
        }
      });
    };

    // Always include monsters from the current DOM
    const liveCards = document.querySelectorAll('.monster-card');
    liveCards.forEach(card => {
      const name = (card.querySelector('.monster-name, h3, h2')?.textContent || '').trim();
      if (name && !combined.has(name)) {
        combined.set(name, { _uiaddon_name: name });
      }
    });

    // Helper to safely fetch a document with a specific hide_dead_monsters value
    const fetchWithHideDead = async (value) => {
      const url = window.location.pathname + window.location.search;

      // If we want hide_dead_monsters = 0, use the robust override helpers
      if (String(value) === '0') {
        try {
          pushHideDeadOverride();
          const res = await fetch(url, { credentials: 'include' });
          const html = await res.text();
          const parser = new DOMParser();
          return parser.parseFromString(html, 'text/html');
        } catch {
          return null;
        } finally {
          popHideDeadOverride();
        }
      }

      // For hide_dead_monsters = 1 we want to reliably fetch the
      // "hide dead" variant without creating additional cookies.
      // If a cookie already exists, respect it and just fetch once.
      // If none exists, set it on the same path that the override
      // helper uses, then clean it up afterwards.
      const path = window.location.pathname || '/';
      const existing = getCookieValue('hide_dead_monsters');
      let touched = false;
      try {
        if (existing === null) {
          setCookie('hide_dead_monsters', '1', { path });
          touched = true;
        }

        const res = await fetch(url, { credentials: 'include' });
        const html = await res.text();
        const parser = new DOMParser();
        return parser.parseFromString(html, 'text/html');
      } catch {
        return null;
      } finally {
        // Only clean up if we created a new cookie on this path.
        if (touched) {
          setCookie('hide_dead_monsters', '', { path, 'max-age': -1 });
        }
      }
    };

    // Fetch both versions sequentially to avoid overlapping overrides
    const docShowDead = await fetchWithHideDead('0');
    addFromDoc(docShowDead);

    const docHideDead = await fetchWithHideDead('1');
    addFromDoc(docHideDead);

    // Return an array-like object compatible with existing createFilterUI logic
    // Each element needs a querySelector that returns the stored name
    return Array.from(combined.values()).map(entry => ({
      querySelector: (sel) => {
        if (sel.includes('.monster-name') || sel.includes('h3') || sel.includes('h2')) {
          return { textContent: entry._uiaddon_name };
        }
        return null;
      }
    }));
  }

  function createFilterUI(monsterList, settings) {
    const filterContainer = document.querySelector('.batch-loot-card');

    filterContainer.innerHTML = `
      <div class="filter-row" style="display: flex;gap: 15px;align-items: center;flex-wrap: wrap;margin-bottom: 15px;">
      <input type="text" id="monster-name-filter" placeholder="Search by monster name..."
               style="flex: 1;min-width: 200px;padding: 8px 12px;border: 1px solid rgba(88, 91, 112, 0.5);border-radius: 6px;background: rgba(17, 17, 27, 0.8);color: #cdd6f4;font-size: 14px;transition: all 0.2s ease;">        
        <div style="position: relative; display: inline-block;">
          <button id="monster-type-toggle" style="height: 33px;padding: 5px 10px;background: rgb(30, 30, 46);color: rgb(205, 214, 244);border: 1px solid rgb(69, 71, 90);border-radius: 4px;cursor: pointer;min-width: 120px;text-align: left;">
            Monster Types ▼
          </button>
          <div id="monster-type-dropdown" style="display: none; position: absolute; top: 100%; left: 0; background: #1e1e2e; border: 1px solid #45475a; border-radius: 4px; padding: 10px; z-index: 1000; min-width: 200px; max-height: 200px; overflow-y: auto;">
            <div style="margin-bottom: 8px; font-weight: bold; color: #cba6f7; border-bottom: 1px solid #45475a; padding-bottom: 5px;">Monsters</div>
            <div id="monster-types-list"></div>
            <div style="margin-top: 8px; padding-top: 5px; border-top: 1px solid #45475a;">
              <button id="select-all-monsters" style="padding: 3px 8px; background: #a6e3a1; color: #1e1e2e; border: none; border-radius: 3px; cursor: pointer; font-size: 11px; margin-right: 5px;">Select All</button>
              <button id="clear-monsters" style="padding: 3px 8px; background: #f38ba8; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">Clear</button>
            </div>
          </div>
        </div>
        
        <div style="position: relative; display: inline-block;">
          <button id="loot-filter-toggle" style="height: 33px;padding: 5px 10px;background: rgb(30, 30, 46);color: rgb(205, 214, 244);border: 1px solid rgb(69, 71, 90);border-radius: 4px;cursor: pointer;min-width: 120px;text-align: left;">
            Loot Filter ▼
          </button>
          <div id="loot-filter-dropdown" style="display: none; position: absolute; top: 100%; left: 0; background: #1e1e2e; border: 1px solid #45475a; border-radius: 4px; padding: 10px; z-index: 1000; min-width: 250px; max-height: 300px; overflow-y: auto;">
            <div style="margin-bottom: 8px; font-weight: bold; color: #cba6f7; border-bottom: 1px solid #45475a; padding-bottom: 5px;">Filter by Loot</div>
            <div id="loot-items-list">
              <div style="color: #89b4fa; font-size: 12px; text-align: center; padding: 10px;">
                Loading loot items...
              </div>
            </div>
            <div style="margin-top: 8px; padding-top: 5px; border-top: 1px solid #45475a;">
              <button id="select-all-loot" style="padding: 3px 8px; background: #a6e3a1; color: #1e1e2e; border: none; border-radius: 3px; cursor: pointer; font-size: 11px; margin-right: 5px;">Select All</button>
              <button id="clear-loot" style="padding: 3px 8px; background: #f38ba8; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">Clear</button>
            </div>
          </div>
        </div>
        
        <select id="hp-filter" style="height: 33px;padding: 5px 10px;background: rgb(30, 30, 46);color: rgb(205, 214, 244);border: 1px solid rgb(69, 71, 90);border-radius: 4px;cursor: pointer;min-width: 120px;text-align: left;">
          <option value="">All HP Levels</option>
          <option value="low">Low HP (&lt;50%)</option>
          <option value="medium">Medium HP (50-80%)</option>
          <option value="high">High HP (&gt;80%)</option>
          <option value="full">Full HP (100%)</option>
        </select>
        
        <select id="player-count-filter" style="height: 33px;padding: 5px 10px;background: rgb(30, 30, 46);color: rgb(205, 214, 244);border: 1px solid rgb(69, 71, 90);border-radius: 4px;cursor: pointer;min-width: 120px;text-align: left;">
          <option value="">All Players</option>
          <option value="empty">Empty (0 players)</option>
          <option value="few">Few (&lt;10 players)</option>
          <option value="many">Many (&gt;20 players)</option>
          <option value="full">Full (30 players)</option>
        </select>
        
        <button id="hide-img-monsters" style="display: flex;align-items: center;gap: 8px;padding: 6px 16px;background: rgba(137, 180, 250, 0.2);border: 1px solid rgba(137, 180, 250, 0.4);color: #89b4fa;border-radius: 6px;cursor: pointer;font-size: 14px;font-weight: 500;transition: background-color 0.15s ease, transform 0.1s ease;">
          <span>🖼️</span>
          <span>Hide Images</span>
        </button>
        <button id="loot-all-btn" style="background: rgba(255, 211, 105, 0.2); border-color: rgba(255, 211, 105, 0.4); color: #ffd369; display: flex; align-items: center; gap: 8px; padding: 8px 16px; border: 1px solid; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: background-color 0.15s ease, transform 0.1s ease; white-space: nowrap;">
          <span>💰</span>
          <span>Loot All (<span id="loot-count">0</span>)</span>
        </button>
        <button id="clear-filters" style="display: flex;align-items: center;gap: 8px;padding: 7px 16px;background: #f38ba8;border: 1px solid #f38ba8;color: white;border-radius: 6px;cursor: pointer;font-size: 14px;font-weight: 500;transition: background-color 0.15s ease, transform 0.1s ease;margin-left: auto;order: 999;flex-shrink: 0;">
          Clear All
        </button>
      </div>
    `;

    const contentArea = document.querySelector('.content-area');
    const monsterContainer = document.querySelector('.monster-container');
    if (contentArea && monsterContainer) {
      contentArea.insertBefore(filterContainer, monsterContainer);
    }

    // Debounced filters for snappier typing and less churn
    const applyMonsterFiltersDebounced = debounce(applyMonsterFilters, 120);
    // Add event listeners for all filter elements
    document.getElementById('monster-name-filter').addEventListener('input', applyMonsterFiltersDebounced);
    document.getElementById('hp-filter').addEventListener('change', applyMonsterFiltersDebounced);
    document.getElementById('player-count-filter').addEventListener('change', applyMonsterFiltersDebounced);

    // Hide images control now a button instead of checkbox
    const hideImagesBtn = document.getElementById('hide-img-monsters');
    if (hideImagesBtn) {
      // Initialize dataset flag if missing
      if (!hideImagesBtn.dataset.hidden) hideImagesBtn.dataset.hidden = 'false';
      const syncHideImagesBtn = () => {
        const active = hideImagesBtn.dataset.hidden === 'true';
        hideImagesBtn.classList.toggle('active', active);
        // Update label text second span if present
        const spans = hideImagesBtn.querySelectorAll('span');
        if (spans.length > 1) {
          spans[1].textContent = active ? 'Show Images' : 'Hide Images';
        }
      };
      hideImagesBtn.addEventListener('click', (e) => {
        e.preventDefault();
        hideImagesBtn.dataset.hidden = hideImagesBtn.dataset.hidden === 'true' ? 'false' : 'true';
        syncHideImagesBtn();
        applyMonsterFilters();
      });
      syncHideImagesBtn();
    }
    document.getElementById('clear-filters').addEventListener('click', clearAllFilters);
    
    // Monster type dropdown functionality
    const monsterTypeToggle = document.getElementById('monster-type-toggle');
    const monsterTypeDropdown = document.getElementById('monster-type-dropdown');
    
    monsterTypeToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      monsterTypeDropdown.style.display = monsterTypeDropdown.style.display === 'none' ? 'block' : 'none';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      monsterTypeDropdown.style.display = 'none';
      if (lootFilterDropdown) {
        lootFilterDropdown.style.display = 'none';
      }
    });
    
    // Dynamically populate monster types (from live DOM for instant paint)
    const monsterTypeList = document.getElementById('monster-types-list');
    if (monsterTypeList) {
      const uniqueMonsters = Array.from(new Set(Array.from(monsterList)
        .map(m => m.querySelector('.monster-name, h3, h2')?.textContent?.trim() || 'Unknown'))).sort();
      monsterTypeList.innerHTML = uniqueMonsters.map(monsterName => `
        <label style="display: block; margin: 3px 0; color: #cdd6f4; font-size: 12px;">
          <input type="checkbox" value="${monsterName}" class="monster-type-checkbox cyberpunk-checkbox"> ${monsterName}
        </label>
      `).join('');
      monsterTypeList.querySelectorAll('.monster-type-checkbox').forEach(checkbox => {
        if (!checkbox.dataset.listenerAttached) {
          checkbox.addEventListener('change', applyMonsterFiltersDebounced);
          checkbox.dataset.listenerAttached = 'true';
        }
      });
    }
    
    // Select all and clear buttons for monster types
    document.getElementById('select-all-monsters').addEventListener('click', () => {
      document.querySelectorAll('.monster-type-checkbox').forEach(checkbox => {
        checkbox.checked = true;
      });
      applyMonsterFiltersDebounced();
    });
    
    document.getElementById('clear-monsters').addEventListener('click', () => {
      document.querySelectorAll('.monster-type-checkbox').forEach(checkbox => {
        checkbox.checked = false;
      });
      applyMonsterFiltersDebounced();
    });

    // Loot filter dropdown functionality
    const lootFilterToggle = document.getElementById('loot-filter-toggle');
    const lootFilterDropdown = document.getElementById('loot-filter-dropdown');
    
    lootFilterToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = lootFilterDropdown.style.display === 'block';
      lootFilterDropdown.style.display = isVisible ? 'none' : 'block';
      
      // Load loot items if dropdown is being opened and not loaded yet
      if (!isVisible && !lootFilterDropdown.dataset.loaded) {
        populateLootFilterDropdown();
      }
    });
    
    // Close loot dropdown when clicking outside
    lootFilterDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Select all and clear buttons for loot
    document.getElementById('select-all-loot').addEventListener('click', () => {
      document.querySelectorAll('.loot-filter-checkbox').forEach(checkbox => {
        checkbox.checked = true;
      });
      applyMonsterFiltersDebounced();
    });
    
    document.getElementById('clear-loot').addEventListener('click', () => {
      document.querySelectorAll('.loot-filter-checkbox').forEach(checkbox => {
        checkbox.checked = false;
      });
      applyMonsterFiltersDebounced();
    });

    // Hook the Loot All button to existing lootAll() behavior
    const lootAllBtn = document.getElementById('loot-all-btn');
    if (lootAllBtn && !lootAllBtn.dataset.listenerAttached) {
      lootAllBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof lootAll === 'function') lootAll();
      });
      lootAllBtn.dataset.listenerAttached = 'true';
    }

    // Determine current gate/wave key
    const urlParams = new URLSearchParams(window.location.search || '');
    const waveParam = urlParams.get('wave') || 'default';
    const gateParam = urlParams.get('gate') || urlParams.get('gate_id') || 'default';
    const waveKey = `gate_${gateParam}_wave_${waveParam}`;

    // Normalize incoming settings to per-gate/wave schema
    let activeFilters = null;
    if (settings && typeof settings === 'object') {
      if (settings.waves && typeof settings.waves === 'object') {
        // New schema
        activeFilters = settings.waves[waveKey] || null;
      } else {
        // Legacy flat schema
        activeFilters = settings;
      }
    }

    // Initialize filter values from activeFilters
    if (activeFilters) {
      if (activeFilters.nameFilter) document.getElementById('monster-name-filter').value = activeFilters.nameFilter;
      if (activeFilters.hpFilter) document.getElementById('hp-filter').value = activeFilters.hpFilter;
      if (activeFilters.playerCountFilter) document.getElementById('player-count-filter').value = activeFilters.playerCountFilter;
      if (activeFilters.hideImg) {
        const btn = document.getElementById('hide-img-monsters');
        if (btn) {
          btn.dataset.hidden = 'true';
          const spans = btn.querySelectorAll('span');
          if (spans.length > 1) spans[1].textContent = 'Show Images';
        }
      }

      // Initialize monster type checkboxes
      if (activeFilters.monsterTypeFilter && Array.isArray(activeFilters.monsterTypeFilter)) {
        activeFilters.monsterTypeFilter.forEach(monsterType => {
          const checkbox = document.querySelector(`.monster-type-checkbox[value="${monsterType}"]`);
          if (checkbox) checkbox.checked = true;
        });
      }

      // Initialize loot filter by populating dropdown and restoring settings
      if (activeFilters.lootFilter && Array.isArray(activeFilters.lootFilter) && activeFilters.lootFilter.length > 0) {
        // Populate the loot filter dropdown immediately so we can restore the settings
        populateLootFilterDropdown().then(() => {
          // After dropdown is populated, apply the filters
          applyMonsterFilters();
        });
      }

      // Apply filters if any are set
      if (activeFilters.nameFilter || (activeFilters.monsterTypeFilter && activeFilters.monsterTypeFilter.length > 0) || activeFilters.hpFilter || activeFilters.playerCountFilter || activeFilters.hideImg) {
        applyMonsterFilters();
      }
    }
    
    // Special case: if we have loot filters but didn't populate the dropdown yet, 
    // we'll apply filters again after the dropdown is populated (see above)

    // After initial render, asynchronously enrich monster types with hide_dead_monsters=0 list (no initial delay)
    (async () => {
      try {
        const listEl = document.getElementById('monster-types-list');
        if (!listEl || listEl.dataset.enriched === 'true') return;
        const combinedList = await buildCombinedMonsterList();
        if (!combinedList || !combinedList.length) return;

        const existing = new Set(Array.from(listEl.querySelectorAll('input.monster-type-checkbox')).map(cb => cb.value));
        const combinedNames = Array.from(new Set(Array.from(combinedList)
          .map(m => m.querySelector('.monster-name, h3, h2')?.textContent?.trim() || 'Unknown')));

        const toAdd = combinedNames.filter(n => n && !existing.has(n)).sort();
        if (toAdd.length) {
          const frag = document.createDocumentFragment();
          toAdd.forEach(name => {
            const label = document.createElement('label');
            label.style.cssText = 'display: block; margin: 3px 0; color: #cdd6f4; font-size: 12px;';
            label.innerHTML = `<input type="checkbox" value="${name}" class="monster-type-checkbox cyberpunk-checkbox"> ${name}`;
            frag.appendChild(label);
          });
          listEl.appendChild(frag);
          listEl.querySelectorAll('.monster-type-checkbox').forEach(cb => {
            if (!cb.dataset.listenerAttached) {
              cb.addEventListener('change', applyMonsterFiltersDebounced);
              cb.dataset.listenerAttached = 'true';
            }
          });

          // Re-apply saved selections if they included types that were missing initially
          try {
            const raw = localStorage.getItem('demonGameFilterSettings');
            if (raw) {
              const savedSettings = JSON.parse(raw) || {};
              const urlParams = new URLSearchParams(window.location.search || '');
              const waveParam = urlParams.get('wave') || 'default';
              const gateParam = urlParams.get('gate') || urlParams.get('gate_id') || 'default';
              const waveKey = `gate_${gateParam}_wave_${waveParam}`;
              let types = null;
              if (savedSettings.waves && savedSettings.waves[waveKey]) {
                types = savedSettings.waves[waveKey].monsterTypeFilter;
              } else if (Array.isArray(savedSettings.monsterTypeFilter)) {
                // legacy flat
                types = savedSettings.monsterTypeFilter;
              }
              if (Array.isArray(types) && types.length) {
                types.forEach(t => {
                  const box = listEl.querySelector(`input.monster-type-checkbox[value="${t}"]`);
                  if (box) box.checked = true;
                });
                // Re-apply filters to include newly added selections
                applyMonsterFiltersDebounced();
              }
            }
          } catch {}
        }
        listEl.dataset.enriched = 'true';
      } catch {}
    })();

    // Always compute initial loot count from server once UI is ready
    if (typeof updateLootCountFromServer === 'function') {
      updateLootCountFromServer();
    }
  }

  async function populateLootFilterDropdown() {
    const lootItemsList = document.getElementById('loot-items-list');
    const dropdown = document.getElementById('loot-filter-dropdown');
    
    if (!lootItemsList || dropdown.dataset.loaded) return;
    
    // Show loading state
    lootItemsList.innerHTML = '<div style="color: #89b4fa; font-size: 12px; text-align: center; padding: 10px;">Loading loot items...</div>';
    
    // Collect all unique loot items from cached data
    const allLootItems = new Set();
    
    // If we have cached loot data, use it
    for (const [monsterName, lootData] of lootCache) {
      lootData.forEach(item => {
        allLootItems.add(item.name);
      });
    }
    
    // If no cached data yet, try to load from visible monsters
    if (allLootItems.size === 0) {
      const monsterCards = document.querySelectorAll('.monster-card');
      const loadPromises = [];
      
      // Load loot for a few monsters to get some items
      for (let i = 0; i < Math.min(3, monsterCards.length); i++) {
        const card = monsterCards[i];
        const monsterId = card.getAttribute('data-monster-id');
        const monsterName = getMonsterNameFromCard(card);
        
        if (monsterId && monsterName && !lootCache.has(monsterName)) {
          loadPromises.push(
            fetch(`battle.php?id=${monsterId}`)
              .then(response => response.text())
              .then(html => {
                const lootData = parseLootFromBattlePage(html);
                lootCache.set(monsterName, lootData);
                lootData.forEach(item => allLootItems.add(item.name));
              })
              .catch(error => console.error('Error loading loot for filter:', error))
          );
        }
      }
      
      if (loadPromises.length > 0) {
        await Promise.all(loadPromises);
      }
    }
    
    // Convert to sorted array
    const sortedLootItems = Array.from(allLootItems).sort();
    
    if (sortedLootItems.length === 0) {
      lootItemsList.innerHTML = '<div style="color: #f38ba8; font-size: 12px; text-align: center; padding: 10px;">No loot data available</div>';
      return;
    }
    
    // Generate checkboxes for each loot item
    const lootHTML = sortedLootItems.map(itemName => `
      <label style="display: block; margin: 3px 0; color: #cdd6f4; font-size: 12px; cursor: pointer;">
        <input type="checkbox" value="${itemName}" class="loot-filter-checkbox cyberpunk-checkbox" style="margin-right: 5px;">
        ${itemName}
      </label>
    `).join('');
    
    lootItemsList.innerHTML = lootHTML;
    
    // Add event listeners to new checkboxes
    document.querySelectorAll('.loot-filter-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        applyMonsterFilters();
        if (typeof renderJoinCards === 'function') {
          renderJoinCards();
        }
      });
    });
    
    // Restore saved filter state (per gate+wave if available)
    try {
      const raw = localStorage.getItem('demonGameFilterSettings');
      if (raw) {
        const savedSettings = JSON.parse(raw) || {};

        // Build current gate/wave key
        const urlParams = new URLSearchParams(window.location.search || '');
        const waveParam = urlParams.get('wave') || 'default';
        const gateParam = urlParams.get('gate') || urlParams.get('gate_id') || 'default';
        const waveKey = `gate_${gateParam}_wave_${waveParam}`;

        let lootFilterList = null;
        if (savedSettings.waves && typeof savedSettings.waves === 'object' && savedSettings.waves[waveKey]) {
          lootFilterList = savedSettings.waves[waveKey].lootFilter;
        } else if (Array.isArray(savedSettings.lootFilter)) {
          // Legacy flat format
          lootFilterList = savedSettings.lootFilter;
        }

        if (Array.isArray(lootFilterList)) {
          lootFilterList.forEach(lootName => {
            const checkbox = document.querySelector(`.loot-filter-checkbox[value="${lootName}"]`);
            if (checkbox) checkbox.checked = true;
          });
        }
      }
    } catch (e) {
      // Ignore malformed storage
    }
    
    dropdown.dataset.loaded = 'true';
  }

  // Track looted monsters to exclude from counts
  const lootedMonsters = new Set();

  function updateSectionHeaderCounts(continueCount, lootCount, joinCount) {
    // Find all monster sections and update their headers based on content
    const allSections = document.querySelectorAll('.monster-section');
    
    allSections.forEach(section => {
      const header = section.querySelector('h3');
      if (header) {
        const headerText = header.textContent;
        
        if (headerText.includes('Continue Battle')) {
          header.textContent = `⚔️ Continue Battle (${continueCount})`;
        } else if (headerText.includes('Available Loot')) {
          header.textContent = `💰 Available Loot (${lootCount})`;
        } else if (headerText.includes('Join a Battle')) {
          header.textContent = `🆕 Join a Battle (${joinCount})`;
        }
      }
    });
  }

  // Build or refresh lightweight indices on monster cards to speed filtering
  function ensureMonsterIndex(hpNeeded = false, playersNeeded = false) {
    const cards = document.querySelectorAll('.monster-card');
    cards.forEach(card => {
      // name/original
      if (!card.dataset.nameLower || !card.dataset.originalName) {
        const nameEl = card.querySelector('h3');
        const original = nameEl ? nameEl.textContent.trim() : '';
        card.dataset.originalName = original;
        card.dataset.nameLower = original.toLowerCase();
      }
      // category (continue/loot/join) – coarse but cheap
      if (!card.dataset.category) {
        const txt = card.textContent || '';
        card.dataset.category = txt.includes('Continue') ? 'continue' : (txt.includes('Loot') ? 'loot' : 'join');
      }
      // hp percent when needed
      if (hpNeeded && !card.dataset.hpPct) {
        const hpText = card.querySelector('.hp-bar')?.nextElementSibling?.textContent || '';
        const m = hpText.match(/❤️\s*([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
        const curr = m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
        const max = m ? parseInt(m[2].replace(/,/g, ''), 10) : 1;
        const pct = max > 0 ? (curr / max) * 100 : 0;
        card.dataset.hpPct = String(pct);
      }
      // players joined when needed
      if (playersNeeded && !card.dataset.players) {
        // Prefer structured stat rows first
        let players = null;
        const stats = card.querySelector('.monster-stats');
        if (stats) {
          const rows = Array.from(stats.querySelectorAll('.stat-row'));
          for (const row of rows) {
            const label = (row.querySelector('.stat-label')?.textContent || '').trim();
            const iconClass = (row.querySelector('.stat-icon')?.className || '').toLowerCase();
            if (/players\s*joined/i.test(label) || /\bgrp\b/.test(iconClass) || /👥/.test(row.textContent)) {
              const chip = row.querySelector('.party-chip, .mini-chip.party-chip, .stat-value .mini-chip') || row.querySelector('.stat-value');
              const text = (chip?.textContent || row.textContent || '').trim();
              const m = text.match(/(\d[\d,]*)\s*\/\s*(\d[\d,]*)/);
              if (m) {
                players = m[1].replace(/,/g, '');
                break;
              }
            }
          }
        }
        if (players == null) {
          const txt = card.textContent || '';
          const pm = txt.match(/👥\s*Players\s*Joined\s*(\d+)\/\d+/);
          players = pm ? pm[1] : '0';
        }
        card.dataset.players = String(players);
      }
    });
  }

  // Cache last filter state to skip redundant work
  let _lastFilterState = null;

  function applyMonsterFilters() {
    const nameFilter = document.getElementById('monster-name-filter').value.toLowerCase();
    const hpFilter = document.getElementById('hp-filter').value;
    const playerCountFilter = document.getElementById('player-count-filter').value;
  const hideImagesBtn2 = document.getElementById('hide-img-monsters');
  const hideImg = hideImagesBtn2 ? (hideImagesBtn2.dataset.hidden === 'true') : false;

    // Get selected monster types
    const selectedMonsterTypes = Array.from(document.querySelectorAll('.monster-type-checkbox:checked')).map(cb => cb.value);
    
    // Get selected loot items
    const selectedLootItems = Array.from(document.querySelectorAll('.loot-filter-checkbox:checked')).map(cb => cb.value);
    
    // Update monster type button text
    const monsterTypeToggle = document.getElementById('monster-type-toggle');
    if (selectedMonsterTypes.length === 0) {
      monsterTypeToggle.textContent = 'Monster Types ▼';
    } else if (selectedMonsterTypes.length === 1) {
      monsterTypeToggle.textContent = `${selectedMonsterTypes[0]} ▼`;
    } else {
      monsterTypeToggle.textContent = `${selectedMonsterTypes.length} Types ▼`;
    }
    
    // Update loot filter button text
    const lootFilterToggle = document.getElementById('loot-filter-toggle');
    if (lootFilterToggle) {
      if (selectedLootItems.length === 0) {
        lootFilterToggle.textContent = 'Loot Filter ▼';
      } else if (selectedLootItems.length === 1) {
        lootFilterToggle.textContent = `${selectedLootItems[0]} ▼`;
      } else {
        lootFilterToggle.textContent = `${selectedLootItems.length} Items ▼`;
      }
    }

    // Skip if state hasn't changed
    const stateNow = JSON.stringify({
      nameFilter,
      hpFilter,
      playerCountFilter,
      types: selectedMonsterTypes.slice().sort(),
      loot: selectedLootItems.slice().sort(),
      hideImg
    });
    if (_lastFilterState === stateNow) {
      return;
    }
    _lastFilterState = stateNow;

    // Ensure indices are present for fast filtering
    ensureMonsterIndex(!!hpFilter, !!playerCountFilter);

    const monsters = document.querySelectorAll('.monster-card');
    var limitBattleCount = 0;

    // Apply body class for image visibility instead of toggling per card
    document.body.classList.toggle('monster-images-hidden', hideImg);

    let visibleContinueCount = 0;
    let visibleLootCount = 0;
    let visibleJoinCount = 0;

    const selectedTypesLower = selectedMonsterTypes.map(t => t.toLowerCase());
    const selectedLootSet = new Set(selectedLootItems);

    // Process in chunks to keep UI responsive on large lists
    const cards = Array.from(monsters);
    let i = 0;
    const BATCH = 60;

    const processBatch = () => {
      const end = Math.min(i + BATCH, cards.length);
      for (; i < end; i++) {
        const monster = cards[i];
        const nameLower = monster.dataset.nameLower || '';
        const originalMonsterName = monster.dataset.originalName || '';
        const category = monster.dataset.category || 'join';

        let shouldShow = true;

        // Name filter
        if (nameFilter && !nameLower.includes(nameFilter)) {
          shouldShow = false;
        }

        // Monster type filter
        if (shouldShow && selectedTypesLower.length > 0) {
          const matchesType = selectedTypesLower.some(type => nameLower.includes(type));
          if (!matchesType) shouldShow = false;
        }

        // Loot filter (uses cache by original name)
        if (shouldShow && selectedLootSet.size > 0) {
          const monsterLoot = lootCache.get(originalMonsterName);
          if (monsterLoot && monsterLoot.length > 0) {
            const hasSelected = monsterLoot.some(lootItem => selectedLootSet.has(lootItem.name));
            if (!hasSelected) shouldShow = false;
          } else {
            shouldShow = false;
          }
        }

        // HP filter
        if (shouldShow && hpFilter) {
          let pct = monster.dataset.hpPct ? parseFloat(monster.dataset.hpPct) : NaN;
          if (!Number.isFinite(pct)) {
            // Lazily compute if missing
            const hpText = monster.querySelector('.hp-bar')?.nextElementSibling?.textContent || '';
            const m = hpText.match(/❤️\s*([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
            const curr = m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
            const max = m ? parseInt(m[2].replace(/,/g, ''), 10) : 1;
            pct = max > 0 ? (curr / max) * 100 : 0;
            monster.dataset.hpPct = String(pct);
          }
          if (hpFilter === 'low' && !(pct < 50)) shouldShow = false;
          else if (hpFilter === 'medium' && !(pct >= 50 && pct <= 80)) shouldShow = false;
          else if (hpFilter === 'high' && !(pct > 80)) shouldShow = false;
          else if (hpFilter === 'full' && !(pct >= 100)) shouldShow = false;
        }

        // Player count filter
        if (shouldShow && playerCountFilter) {
          let joined = monster.dataset.players ? parseInt(monster.dataset.players, 10) : NaN;
          if (!Number.isFinite(joined)) {
            const txt = monster.textContent || '';
            const pm = txt.match(/👥\s*Players\s*Joined\s*(\d+)\/\d+/);
            joined = pm ? parseInt(pm[1], 10) : 0;
            monster.dataset.players = String(joined);
          }
          if (playerCountFilter === 'empty' && !(joined === 0)) shouldShow = false;
          else if (playerCountFilter === 'few' && !(joined < 10)) shouldShow = false;
          else if (playerCountFilter === 'many' && !(joined > 20)) shouldShow = false;
          else if (playerCountFilter === 'full' && !(joined >= 30)) shouldShow = false;
        }

        // Apply visibility (single write)
        monster.style.display = shouldShow ? '' : 'none';

        if (shouldShow) {
          const monsterId = monster.getAttribute('data-monster-id');
          if (!lootedMonsters.has(monsterId)) {
            if (category === 'continue') visibleContinueCount++;
            else if (category === 'loot') visibleLootCount++;
            else visibleJoinCount++;
          }
        }

        // Count battles for alarm (cheap check)
        if (category === 'continue') {
          limitBattleCount++;
        }
      }
      if (i < cards.length) {
        requestAnimationFrame(processBatch);
      } else {
        // Finalize counts and persist state
        updateSectionHeaderCounts(visibleContinueCount, visibleLootCount, visibleJoinCount);

        // Save filter state
        const urlParams = new URLSearchParams(window.location.search || '');
        const waveParam = urlParams.get('wave') || 'default';
        const gateParam = urlParams.get('gate') || urlParams.get('gate_id') || 'default';
        const waveKey = `gate_${gateParam}_wave_${waveParam}`;

        let stored = {};
        try { const raw = localStorage.getItem('demonGameFilterSettings'); if (raw) stored = JSON.parse(raw) || {}; } catch (e) { stored = {}; }
        if (!stored || typeof stored !== 'object' || Array.isArray(stored)) stored = {};
        if (!stored.waves || typeof stored.waves !== 'object') stored = { activeKey: waveKey, waves: {} };
        if (!stored.waves[waveKey]) stored.waves[waveKey] = {};
        stored.waves[waveKey] = {
          nameFilter: document.getElementById('monster-name-filter').value,
          monsterTypeFilter: selectedMonsterTypes,
          lootFilter: selectedLootItems,
          hpFilter: document.getElementById('hp-filter').value,
          playerCountFilter: document.getElementById('player-count-filter').value,
          hideImg: (document.getElementById('hide-img-monsters')?.dataset.hidden === 'true'),
        };
        stored.activeKey = waveKey;
        localStorage.setItem('demonGameFilterSettings', JSON.stringify(stored));

        if (typeof updateLootCountFromServer === 'function') {
          updateLootCountFromServer();
        }
      }
    };
    processBatch();
    
  }

  // Helper: get cookie value by name
  function getCookieValue(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  // Helper: set cookie (path=/ to cover whole site)
  function setCookie(name, value, options = {}) {
    const opts = { path: '/', ...options };
    let updatedCookie = encodeURIComponent(name) + '=' + encodeURIComponent(value);
    for (const key in opts) {
      updatedCookie += '; ' + key;
      const optVal = opts[key];
      if (optVal !== true) updatedCookie += '=' + optVal;
    }
    document.cookie = updatedCookie;
  }

  // Helpers to set/clear a cookie across common path scopes to improve restore reliability
  function getPathScopes() {
    const scopes = ['/'];
    const parts = window.location.pathname.split('/').filter(Boolean);
    let accum = '';
    for (const p of parts) {
      accum += '/' + p;
      scopes.push(accum);
    }
    return Array.from(new Set(scopes));
  }

  function setCookieAcrossPaths(name, value, baseOptions = {}) {
    const paths = getPathScopes();
    paths.forEach(path => setCookie(name, value, { ...baseOptions, path }));
  }

  function clearCookieAcrossPaths(name) {
    const paths = getPathScopes();
    paths.forEach(path => setCookie(name, '', { path, 'max-age': -1 }));
  }

  // Guard to avoid overlapping overrides leaving cookie stuck at 0
  const _hideDeadOverride = {
    depth: 0,
    original: null,
    unloadHandler: null,
    pathUsed: null,
    cookieCountBefore: 0,
    createdNew: false
  };
  function pushHideDeadOverride() {
    if (_hideDeadOverride.depth === 0) {
      // Snapshot current cookie state
      const cookieStrBefore = document.cookie || '';
      _hideDeadOverride.cookieCountBefore = (cookieStrBefore.match(/(?:^|;\s*)hide_dead_monsters=/g) || []).length;
      _hideDeadOverride.original = getCookieValue('hide_dead_monsters');
      _hideDeadOverride.pathUsed = window.location.pathname || '/';

      // Attach a synchronous cleanup on page unload/refresh
      _hideDeadOverride.unloadHandler = () => {
        try {
          // Remove our temporary override cookie on the specific path we used
          if (_hideDeadOverride.pathUsed) {
            setCookie('hide_dead_monsters', '', { path: _hideDeadOverride.pathUsed, 'max-age': -1 });
          }
          // If we overwrote an existing cookie (not created a new one), restore its value on the same path
          if (!_hideDeadOverride.createdNew && _hideDeadOverride.original !== null && _hideDeadOverride.pathUsed) {
            setCookie('hide_dead_monsters', _hideDeadOverride.original, { path: _hideDeadOverride.pathUsed });
          }
        } catch {}
      };
      window.addEventListener('beforeunload', _hideDeadOverride.unloadHandler);
      window.addEventListener('pagehide', _hideDeadOverride.unloadHandler);
    }
    _hideDeadOverride.depth += 1;
    // Set to 0 on a specific path only to avoid creating root-path duplicates
    setCookie('hide_dead_monsters', '0', { path: _hideDeadOverride.pathUsed, 'max-age': 180 });
    // Detect if this write created an additional cookie (duplicate with different path)
    const cookieStrAfter = document.cookie || '';
    const countAfter = (cookieStrAfter.match(/(?:^|;\s*)hide_dead_monsters=/g) || []).length;
    _hideDeadOverride.createdNew = countAfter > _hideDeadOverride.cookieCountBefore;
  }

  function popHideDeadOverride() {
    if (_hideDeadOverride.depth > 0) {
      _hideDeadOverride.depth -= 1;
      if (_hideDeadOverride.depth === 0) {
        // Detach unload listeners now that we're restoring synchronously
        if (_hideDeadOverride.unloadHandler) {
          try { window.removeEventListener('beforeunload', _hideDeadOverride.unloadHandler); } catch {}
          try { window.removeEventListener('pagehide', _hideDeadOverride.unloadHandler); } catch {}
        }
        _hideDeadOverride.unloadHandler = null;

        // Remove our temporary cookie at the specific path
        if (_hideDeadOverride.pathUsed) {
          setCookie('hide_dead_monsters', '', { path: _hideDeadOverride.pathUsed, 'max-age': -1 });
        }

        // If we overwrote an existing cookie (same-path), restore that value on that path
        if (!_hideDeadOverride.createdNew && _hideDeadOverride.original !== null && _hideDeadOverride.pathUsed) {
          setCookie('hide_dead_monsters', _hideDeadOverride.original, { path: _hideDeadOverride.pathUsed });
        }

        // Reset state
        _hideDeadOverride.original = null;
        _hideDeadOverride.pathUsed = null;
        _hideDeadOverride.cookieCountBefore = 0;
        _hideDeadOverride.createdNew = false;
      }
    }
  }

  // Update the Loot All count by fetching the same page with hide_dead_monsters=0
  let _lootCountAbortController = null;
  let _lootCountDebounce = null;
  async function updateLootCountFromServer() {
    // Debounce rapid calls
    clearTimeout(_lootCountDebounce);
    _lootCountDebounce = setTimeout(_updateLootCountFromServerNow, 150);
  }

  async function _updateLootCountFromServerNow() {
    const lootCountEl = document.getElementById('loot-count');
    if (!lootCountEl) return;

    // Abort previous in-flight request
    if (_lootCountAbortController) _lootCountAbortController.abort();
    _lootCountAbortController = new AbortController();

    // Read current filter state from UI
    const nameFilter = (document.getElementById('monster-name-filter')?.value || '').trim().toLowerCase();
    const selectedMonsterTypes = Array.from(document.querySelectorAll('.monster-type-checkbox:checked')).map(cb => cb.value.toLowerCase());
    const selectedLootItems = Array.from(document.querySelectorAll('.loot-filter-checkbox:checked')).map(cb => cb.value.toLowerCase());
    const hpFilter = document.getElementById('hp-filter')?.value || '';
    const playerCountFilter = document.getElementById('player-count-filter')?.value || '';

    // Temporarily set cookie hide_dead_monsters=0, then restore
    try {
      pushHideDeadOverride();

      const url = window.location.pathname + window.location.search;
      const res = await fetch(url, { credentials: 'include', signal: _lootCountAbortController.signal });
      const html = await res.text();

      // Parse the HTML into a document
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Helper: compute HP percent from a card element
      const getHpPercent = (card) => {
        const fill = card.querySelector('.hp-fill');
        if (fill && fill.style && fill.style.width) {
          const m = String(fill.style.width).match(/([\d.]+)%/);
          if (m) return Math.max(0, Math.min(100, parseFloat(m[1])));
        }
        const val = card.querySelector('.stat-row .stat-main .stat-value');
        if (val) {
          const txt = val.textContent.replace(/[,\s]/g, ''); // remove commas/spaces
          const m = txt.match(/(\d+)\/(\d+)/);
          if (m) {
            const cur = parseFloat(m[1]);
            const tot = Math.max(1, parseFloat(m[2]));
            return (cur / tot) * 100;
          }
        }
        return NaN;
      };

      // Helper: parse players joined
      const getPlayersJoined = (card) => {
        const chip = card.querySelector('.mini-chip.party-chip');
        if (!chip) return { joined: NaN, cap: NaN };
        const m = chip.textContent.replace(/\s/g, '').match(/(\d+)\/(\d+)/);
        if (m) return { joined: parseInt(m[1], 10), cap: parseInt(m[2], 10) };
        return { joined: NaN, cap: NaN };
      };

      // Helper: HP filter predicate
      const hpMatches = (pct) => {
        if (isNaN(pct)) return true; // if unknown, don't filter it out
        const p = pct / 100;
        switch (hpFilter) {
          case 'low': return p < 0.5;
          case 'medium': return p >= 0.5 && p < 0.8;
          case 'high': return p >= 0.8 && p < 1.0;
          case 'full': return p === 1.0;
          default: return true;
        }
      };

      // Helper: player count filter predicate
      const playersMatch = ({ joined, cap }) => {
        if (!playerCountFilter) return true;
        if (isNaN(joined)) return true;
        switch (playerCountFilter) {
          case 'empty': return joined === 0;
          case 'few': return joined < 10;
          case 'many': return joined > 20;
          case 'full': return !isNaN(cap) ? joined >= cap : joined >= 30;
          default: return true;
        }
      };

      // Normalize a loot name to comparable form
      const normalizeLootName = (s) => String(s || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

      // Build set of selected loot items for quick checks (normalized)
      const selectedLootSet = new Set(selectedLootItems.map(normalizeLootName));

      // Use global lootCache if available. Be tolerant of shapes:
      // - Map<string, string[] | {loot:string[]} | {items: string[]} | Set<string> | Array<{name:string}>>
      const getMonsterLootSet = (monsterNameLower) => {
        const asSet = (entry) => {
          if (!entry) return null;
          // If already a Set of strings
          if (entry instanceof Set) return new Set(Array.from(entry, normalizeLootName));
          // Array of strings or objects
          if (Array.isArray(entry)) {
            return new Set(entry.map(x => normalizeLootName(typeof x === 'string' ? x : (x?.name || x?.itemName || ''))));
          }
          // Object with loot/items array
          if (entry.loot && Array.isArray(entry.loot)) {
            return new Set(entry.loot.map(x => normalizeLootName(typeof x === 'string' ? x : (x?.name || x?.itemName || ''))));
          }
          if (entry.items && Array.isArray(entry.items)) {
            return new Set(entry.items.map(x => normalizeLootName(typeof x === 'string' ? x : (x?.name || x?.itemName || ''))));
          }
          return null;
        };

        try {
          if (typeof lootCache !== 'undefined' && lootCache && typeof lootCache.forEach === 'function') {
            let found = null;
            // Find by case-insensitive key match
            lootCache.forEach((value, key) => {
              if (found) return;
              if (String(key).trim().toLowerCase() === monsterNameLower) {
                found = value;
              }
            });
            if (!found && typeof lootCache.get === 'function') {
              // Try direct get with original case (in case keys are already lower)
              found = lootCache.get(monsterNameLower) || lootCache.get(monsterNameLower.trim());
            }
            const set = asSet(found);
            if (set && set.size > 0) return set;
          }
        } catch {}

        // Attempt to read any loot hints directly from the card DOM (defensive)
        // e.g., chips like .loot-chip or elements with [data-loot]
        return null;
      };

      // Exclude monsters we already looted this session
      const lootedSet = (typeof lootedMonsters !== 'undefined' && lootedMonsters && typeof lootedMonsters.has === 'function') ? lootedMonsters : new Set();

      let count = 0;
      const cards = doc.querySelectorAll('.monster-container .monster-card');
      cards.forEach(card => {
        const id = card.getAttribute('data-monster-id') || card.querySelector('a[href*="battle.php?id="]')?.href?.match(/id=(\d+)/)?.[1];
        // Only consider dead (lootable) monsters
        const isDead = card.getAttribute('data-dead') === '1' || getHpPercent(card) === 0;
        if (!isDead) return;
        // If site signals eligibility, respect it
        const eligibleAttr = card.getAttribute('data-eligible');
        if (eligibleAttr && eligibleAttr !== '1') return;
        if (id && lootedSet.has(id)) return;

        // Name filters (also doubles as monster type selection)
        const name = (card.querySelector('.monster-name, h3, h2')?.textContent || '').trim();
        const nameLower = name.toLowerCase();
        if (nameFilter && !nameLower.includes(nameFilter)) return;
        if (selectedMonsterTypes.length > 0 && !selectedMonsterTypes.includes(nameLower)) return;

        // HP filter
        const hpPct = getHpPercent(card);
        if (!hpMatches(hpPct)) return;

        // Player count filter
        if (!playersMatch(getPlayersJoined(card))) return;

        // Loot filter (if configured) using lootCache mapping
        if (selectedLootSet.size > 0) {
          let lootSet = getMonsterLootSet(nameLower);

          // If cache has no entry, try to parse any hint from server HTML
          if (!lootSet) {
            const possibleChips = card.querySelectorAll('.loot-chip, .loot-item, [data-loot]');
            if (possibleChips && possibleChips.length) {
              lootSet = new Set(Array.from(possibleChips, el => normalizeLootName(el.getAttribute('data-loot') || el.textContent || '')));
            }
          }

          if (!lootSet || lootSet.size === 0) return; // unknown loot -> exclude when filtering by loot
          let anyMatch = false;
          for (const item of selectedLootSet) {
            if (lootSet.has(item)) { anyMatch = true; break; }
          }
          if (!anyMatch) return;
        }

        count += 1;
      });

      lootCountEl.textContent = String(count);
    } catch (e) {
      // On failure, fall back to visible DOM count
      try {
        const visibleLootable = document.querySelectorAll('.monster-card[data-dead="1"]').length;
        lootCountEl.textContent = String(visibleLootable);
      } catch {}
    } finally {
      popHideDeadOverride();
    }
  }

  // Removed unused battle-limit alarm sound function (no alarm.mp3 asset shipped)

  function getMonsterWave(monsterName) {
    // Wave 1 monsters
    const wave1Monsters = [
      'orc grunt', 'orc bonecrusher', 'hobgoblin spearman', 
      'goblin slinger', 'goblin skirmisher'
    ];
    
    // Wave 2 monsters
    const wave2Monsters = [
      'lizardman shadowclaw', 'troll brawler', 
      'lizardman flamecaster', 'troll ravager'
    ];                                                      
    
    if (wave1Monsters.some(monster => monsterName.includes(monster))) {
      return 1;
    } else if (wave2Monsters.some(monster => monsterName.includes(monster))) {
      return 2;
    }
    
    return 0; // Unknown wave
  }

  function clearAllFilters() {
    document.getElementById('monster-name-filter').value = '';
    document.getElementById('hp-filter').value = '';
    document.getElementById('player-count-filter').value = '';
    const hideImagesBtn3 = document.getElementById('hide-img-monsters');
    if (hideImagesBtn3) {
      hideImagesBtn3.dataset.hidden = 'false';
      const spans = hideImagesBtn3.querySelectorAll('span');
      if (spans.length > 1) spans[1].textContent = 'Hide Images';
      hideImagesBtn3.classList.remove('active');
    }
    
    // Clear all monster type checkboxes
    document.querySelectorAll('.monster-type-checkbox').forEach(checkbox => {
      checkbox.checked = false;
    });
    
    // Clear all loot filter checkboxes
    document.querySelectorAll('.loot-filter-checkbox').forEach(checkbox => {
      checkbox.checked = false;
    });
    
    applyMonsterFilters();
    showNotification('All filters cleared!', 'info');
  }

  function toggleMonsterView(viewMode) {
    // viewMode can be 'compact' or 'normal'
    const monsterCards = document.querySelectorAll('.monster-card, .wave-monster');
    
    if (viewMode === 'compact') {
      monsterCards.forEach(card => {
        card.style.cssText += `
          padding: 8px !important;
          margin: 4px !important;
        `;
        
        const img = card.querySelector('img');
        if (img) img.style.display = 'none';
        
        const details = card.querySelectorAll('.monster-details, .description');
        details.forEach(d => d.style.fontSize = '11px');
      });
    } else {
      monsterCards.forEach(card => {
        card.style.cssText = '';
        
        const img = card.querySelector('img');
        if (img) img.style.display = '';
        
        const details = card.querySelectorAll('.monster-details, .description');
        details.forEach(d => d.style.fontSize = '');
      });
    }
  }

  // Enhanced Continue Battle button handler for modal integration
  function initContinueBattleModal() {
    console.log('initContinueBattleModal called, enabled:', extensionSettings.battleModal.enabled);
    
    if (!extensionSettings.battleModal.enabled) {
      console.log('Battle modal disabled, skipping');
      return;
    }
    
    // Find all battle buttons (both links and buttons), but exclude loot buttons
    const continueButtons = document.querySelectorAll('a[href*="battle.php?id="], button[onclick*="battle"], .join-btn');
    
    continueButtons.forEach((btn, index) => {
      // Skip loot buttons
      const btnText = btn.textContent.trim().toLowerCase();
      if (btnText.includes('loot') || btnText.includes('💰')) {
        return;
      }
      // Try multiple ways to get the monster ID
      let monsterId = null;
      
      // Method 1: Check href attribute
      const href = btn.getAttribute('href') || '';
      let match = href.match(/battle\.php\?id=(\d+)/);
      if (match) {
        monsterId = match[1];
      }
      
      // Method 2: Check onclick attribute
      if (!monsterId) {
        const onclick = btn.getAttribute('onclick') || '';
        match = onclick.match(/battle\.php\?id=(\d+)|id[=:](\d+)/);
        if (match) {
          monsterId = match[1] || match[2];
        }
      }
      
      // Method 3: Check if button is inside a monster card and find the link there
      if (!monsterId) {
        const monsterCard = btn.closest('.monster-card, .wave-monster, .battle-card');
        if (monsterCard) {
          // Look for ALL links, including hidden ones
          const cardLinks = monsterCard.querySelectorAll('a[href*="battle.php?id="], a[data-monster-id]');
          for (const cardLink of cardLinks) {
            // Try href first
            if (cardLink.href) {
              match = cardLink.href.match(/battle\.php\?id=(\d+)/);
              if (match) {
                monsterId = match[1];
                break;
              }
            }
            // Try data-monster-id attribute
            if (!monsterId && cardLink.hasAttribute('data-monster-id')) {
              monsterId = cardLink.getAttribute('data-monster-id');
              break;
            }
          }
        }
      }
      
      // Method 4: Check data-monster-id attribute
      if (!monsterId) {
        monsterId = btn.getAttribute('data-monster-id');
      }
      
      if (monsterId) {
        
        // Store the monster ID on the button
        btn.setAttribute('data-monster-id', monsterId);
        
        // Remove any existing onclick handlers to prevent conflicts
        if (btn.hasAttribute('onclick')) {
          btn.removeAttribute('onclick');
        }
        
        // Remove href to prevent navigation
        if (btn.tagName === 'A') {
          btn.style.cursor = 'pointer';
          btn.removeAttribute('href');
        }
        
        // Remove any existing event listeners by cloning
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();

          if (!extensionSettings.battleModal.enabled) {
            window.location.href = `battle.php?id=${monsterId}`;
            return;
          } else if (newBtn.id === 'view-battle-btn') {
            window.location.href = `battle.php?id=${monsterId}`;
            return;
          }

          // Check if already joined (button text is 'Continue')
          if (newBtn.textContent.trim().toLowerCase() === 'continue') {
            // Fetch battle info and show modal
            try {
              const html = await fetchBattlePageHtml(monsterId);
              const monster = parseBattleHtml(html);
              monster.id = monsterId;
              showBattleModal(monster);
            } catch (err) {
              showNotification('Could not load battle info', 'error');
            }
            return;
          }

          await handleJoin(monsterId, newBtn);
        }, true); // Use capture phase to ensure we get the event first
      }
    });
  }

  //#endregion

  //#region Loot and battle functionality
  async function loadInstaLoot(){
    if (!document.getElementById('lootModal')) {
      var modal = document.createElement('div');
      modal.innerHTML = `<div id="lootModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; align-items:center; justify-content:center;">
      <div style="background:#2a2a3d; border-radius:12px; padding:15px; max-width:80%; width:300px; text-align:center; color:white; overflow-y:auto; max-height:70%;">
          <h2 style="margin-bottom:10px; font-size:18px;">🎁 Loot Gained</h2>
          <div id="lootItems" style="display:flex; flex-wrap:wrap; justify-content:center; gap:8px;"></div>
          <br>
          <button class="join-btn" onclick="document.getElementById('lootModal').style.display='none'" style="margin-top:8px; padding:8px 16px; font-size:14px;">Close</button>
      </div>
  </div>`;

      var notif = document.createElement('div');
      notif.style = `position: fixed; top: 50vh; right: 40vw;background: #2ecc71;color: white;padding: 12px 20px;border-radius: 10px;box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);font-size: 15px;display: none;z-index: 9999;`;
      notif.id = "notification";

      const contentArea = document.querySelector('.content-area');
      if (contentArea) {
        contentArea.appendChild(modal.firstElementChild);
        contentArea.appendChild(notif);
      }

      document.getElementById('lootModal').addEventListener('click', function(event) {
        this.style.display = 'none';
      });
    }

    document.querySelectorAll('.monster-card > a').forEach(x => {
      if (x.innerText.includes('Loot')) {
        var instaBtn = document.createElement('button');
        const monsterId = x.href.split("id=")[1];
        instaBtn.onclick = function() {
          lootWave(monsterId);
        };
        instaBtn.className = "join-btn";
        instaBtn.innerText = "💰 Loot Instantly";
        instaBtn.setAttribute('data-monster-id', monsterId); // Store monster ID for loot all
        x.parentNode.append(instaBtn);
      }
    });

    // Loot All button is now added directly in applyLootPanelColors() when loot header is created
  }

  function joinWaveInstant(monsterId, originalLink) {
    showNotification('Joining battle...', 'success');

    fetch('user_join_battle.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'monster_id=' + monsterId + '&user_id=' + userId,
      referrer: 'https://demonicscans.org/battle.php?id=' + monsterId
    })
    .then(res => res.text())
    .then(data => {
      const msg = (data || '').trim();
      const ok = msg.toLowerCase().startsWith('you have successfully');
      showNotification(msg || 'Unknown response', ok ? 'success' : 'error');
      if (ok) {
        setTimeout(() => {
          window.location.href = originalLink.href;
        }, 1000);
      }
    })
    .catch(() => showNotification('Server error. Please try again.', 'error'));
  }

  async function lootWave(monsterId) {
    try {
      const response = await fetch('loot.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'monster_id=' + monsterId + '&user_id=' + userId
      });
      
      // Try to parse as JSON first
      const text = await response.text();
      let data;
      
      try {
        data = JSON.parse(text);
      } catch (e) {
        // If not JSON, assume success if response is ok
        if (response.ok) {
          showNotification('Loot claimed successfully!', 'success');
          // Refresh the page to update loot status
          setTimeout(() => location.reload(), 1000);
          return;
        } else {
          throw new Error('Server returned non-JSON response');
        }
      }
      
      // Handle JSON response
      if (data.status === 'success') {
        const lootContainer = document.getElementById('lootItems');
        if (lootContainer) {
          lootContainer.innerHTML = '';

          if (data.items && data.items.length > 0) {
            data.items.forEach(item => {
              const div = document.createElement('div');
              div.style = 'background:#1e1e2f; border-radius:8px; padding:10px; text-align:center; width:80px;';
              div.innerHTML = `
                <img src="${item.IMAGE_URL}" alt="${item.NAME}" style="width:64px; height:64px;"><br>
                <small>${item.NAME}</small>
              `;
              lootContainer.appendChild(div);
            });

            const modal = document.getElementById('lootModal');
            if (modal) modal.style.display = 'flex';
          } else {
            showNotification('Loot claimed successfully!', 'success');
            setTimeout(() => location.reload(), 1000);
          }
        } else {
          showNotification('Loot claimed successfully!', 'success');
          setTimeout(() => location.reload(), 1000);
        }
      } else {
        showNotification(data.message || 'Failed to loot.', 'error');
      }
    } catch (error) {
      console.error('Loot error:', error);
      // Even if there's an error, the loot was likely claimed, so show success and reload
      showNotification('Loot claimed! Refreshing...', 'success');
      setTimeout(() => location.reload(), 1500);
    }
  }

  function addLootAllButtonToHeader(lootHeader, lootCount) {
    // Check if Loot All button already exists
    if (document.getElementById('loot-all-btn')) return;
    
    // Create the Loot All button
    const lootAllBtn = document.createElement('button');
    lootAllBtn.id = 'loot-all-btn';
    lootAllBtn.className = 'join-btn';
    lootAllBtn.innerText = `🎁 Loot  `;
    lootAllBtn.style.cssText = `
      background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
      color: white;
      border: none;
      padding: 2px 4px;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
      margin: 4px 0 4px 8px;
      display: inline-block;
      font-size: 11px;
      box-shadow: 0 2px 4px rgba(78, 205, 196, 0.3);
      transition: all 0.3s ease;
      vertical-align: middle;
    `;
    
    // Add hover effects
    lootAllBtn.addEventListener('mouseenter', () => {
      lootAllBtn.style.transform = 'translateY(-1px)';
      lootAllBtn.style.boxShadow = '0 4px 12px rgba(78, 205, 196, 0.4)';
    });
    
    lootAllBtn.addEventListener('mouseleave', () => {
      lootAllBtn.style.transform = 'translateY(0)';
      lootAllBtn.style.boxShadow = '0 3px 8px rgba(78, 205, 196, 0.3)';
    });
    
    // Add click handler
    lootAllBtn.addEventListener('click', lootAll);
    
    // Position the button right after the loot header
    lootHeader.parentNode.insertBefore(lootAllBtn, lootHeader.nextSibling);
  }

  function addLootAllButton() {
    // This function is now deprecated in favor of addLootAllButtonToHeader
    // but kept for backward compatibility
    console.log('addLootAllButton called - this should now be handled by addLootAllButtonToHeader');
  }

  async function lootAll() {
    const lootAllBtn = document.getElementById('loot-all-btn');
    if (!lootAllBtn) return;
    
    // Ensure current UI state is saved for filters
    applyMonsterFilters();
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Gather current filter state (same as server count logic)
    const nameFilter = (document.getElementById('monster-name-filter')?.value || '').trim().toLowerCase();
    const selectedMonsterTypes = Array.from(document.querySelectorAll('.monster-type-checkbox:checked')).map(cb => cb.value.toLowerCase());
    const selectedLootItems = Array.from(document.querySelectorAll('.loot-filter-checkbox:checked')).map(cb => cb.value.toLowerCase());
    const hpFilter = document.getElementById('hp-filter')?.value || '';
    const playerCountFilter = document.getElementById('player-count-filter')?.value || '';

    const normalizeLootName = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const selectedLootSet = new Set(selectedLootItems.map(normalizeLootName));

    const getHpPercent = (card) => {
      const fill = card.querySelector('.hp-fill');
      if (fill && fill.style && fill.style.width) {
        const m = String(fill.style.width).match(/([\d.]+)%/);
        if (m) return Math.max(0, Math.min(100, parseFloat(m[1])));
      }
      const val = card.querySelector('.stat-row .stat-main .stat-value');
      if (val) {
        const txt = val.textContent.replace(/[,\s]/g, '');
        const m = txt.match(/(\d+)\/(\d+)/);
        if (m) {
          const cur = parseFloat(m[1]);
          const tot = Math.max(1, parseFloat(m[2]));
          return (cur / tot) * 100;
        }
      }
      return NaN;
    };

    const getPlayersJoined = (card) => {
      const chip = card.querySelector('.mini-chip.party-chip');
      if (!chip) return { joined: NaN, cap: NaN };
      const m = chip.textContent.replace(/\s/g, '').match(/(\d+)\/(\d+)/);
      if (m) return { joined: parseInt(m[1], 10), cap: parseInt(m[2], 10) };
      return { joined: NaN, cap: NaN };
    };

    const hpMatches = (pct) => {
      if (isNaN(pct)) return true;
      const p = pct / 100;
      switch (hpFilter) {
        case 'low': return p < 0.5;
        case 'medium': return p >= 0.5 && p < 0.8;
        case 'high': return p >= 0.8 && p < 1.0;
        case 'full': return p === 1.0;
        default: return true;
      }
    };

    const playersMatch = ({ joined, cap }) => {
      if (!playerCountFilter) return true;
      if (isNaN(joined)) return true;
      switch (playerCountFilter) {
        case 'empty': return joined === 0;
        case 'few': return joined < 10;
        case 'many': return joined > 20;
        case 'full': return !isNaN(cap) ? joined >= cap : joined >= 30;
        default: return true;
      }
    };

    const getMonsterLootSet = (nameLower, card) => {
      const asSet = (entry) => {
        if (!entry) return null;
        if (entry instanceof Set) return new Set(Array.from(entry, normalizeLootName));
        if (Array.isArray(entry)) return new Set(entry.map(x => normalizeLootName(typeof x === 'string' ? x : (x?.name || x?.itemName || ''))));
        if (entry.loot && Array.isArray(entry.loot)) return new Set(entry.loot.map(x => normalizeLootName(typeof x === 'string' ? x : (x?.name || x?.itemName || ''))));
        if (entry.items && Array.isArray(entry.items)) return new Set(entry.items.map(x => normalizeLootName(typeof x === 'string' ? x : (x?.name || x?.itemName || ''))));
        return null;
      };
      try {
        if (typeof lootCache !== 'undefined' && lootCache && typeof lootCache.forEach === 'function') {
          let found = null;
          lootCache.forEach((value, key) => {
            if (found) return;
            if (String(key).trim().toLowerCase() === nameLower) found = value;
          });
          if (!found && typeof lootCache.get === 'function') {
            found = lootCache.get(nameLower) || lootCache.get(nameLower.trim());
          }
          const set = asSet(found);
          if (set && set.size > 0) return set;
        }
      } catch {}
      // Fallback: parse hints in card
      const possibleChips = card?.querySelectorAll?.('.loot-chip, .loot-item, [data-loot]');
      if (possibleChips && possibleChips.length) {
        return new Set(Array.from(possibleChips, el => normalizeLootName(el.getAttribute('data-loot') || el.textContent || '')));
      }
      return null;
    };

    // Temporarily force hide_dead_monsters=0 and fetch the page
    let monsterIdsToLoot = [];
    try {
      pushHideDeadOverride();
      const url = window.location.pathname + window.location.search;
      const res = await fetch(url, { credentials: 'include' });
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const cards = doc.querySelectorAll('.monster-container .monster-card');
      cards.forEach(card => {
        const id = card.getAttribute('data-monster-id') || card.querySelector('a[href*="battle.php?id="]')?.href?.match(/id=(\d+)/)?.[1];
        if (!id) return;
        // Must be dead to loot
        const isDead = card.getAttribute('data-dead') === '1' || getHpPercent(card) === 0;
        if (!isDead) return;
        const eligibleAttr = card.getAttribute('data-eligible');
        if (eligibleAttr && eligibleAttr !== '1') return;
        if (lootedMonsters && typeof lootedMonsters.has === 'function' && lootedMonsters.has(id)) return;

        const name = (card.querySelector('.monster-name, h3, h2')?.textContent || '').trim();
        const nameLower = name.toLowerCase();
        if (nameFilter && !nameLower.includes(nameFilter)) return;
        if (selectedMonsterTypes.length > 0 && !selectedMonsterTypes.includes(nameLower)) return;

        const hpPct = getHpPercent(card);
        if (!hpMatches(hpPct)) return;
        if (!playersMatch(getPlayersJoined(card))) return;

        if (selectedLootSet.size > 0) {
          const lootSet = getMonsterLootSet(nameLower, card);
          if (!lootSet || lootSet.size === 0) return;
          let any = false;
          for (const it of selectedLootSet) { if (lootSet.has(it)) { any = true; break; } }
          if (!any) return;
        }

        monsterIdsToLoot.push(id);
      });
    } catch (e) {
      showNotification('Failed to load monsters for Loot All.', 'error');
      return;
    } finally {
      popHideDeadOverride();
    }

    if (monsterIdsToLoot.length === 0) {
      showNotification('No loot available to claim from filtered monsters!', 'info');
      return;
    }
    
    // Show custom confirmation dialog with loot amount option
    const lootAmount = prompt(`How many monsters do you want to loot?\n\nAvailable: ${monsterIdsToLoot.length} monsters\n\nEnter a number (1-${monsterIdsToLoot.length}) or leave empty for all:`, monsterIdsToLoot.length.toString());
    
    if (lootAmount === null) {
      return; // User cancelled
    }
    
    let targetCount = monsterIdsToLoot.length; // Default to all
    
    if (lootAmount.trim() !== '') {
      const parsedAmount = parseInt(lootAmount);
      if (isNaN(parsedAmount) || parsedAmount < 1) {
        showNotification('Invalid amount! Please enter a number between 1 and ' + monsterIdsToLoot.length, 'error');
        return;
      }
      targetCount = Math.min(parsedAmount, monsterIdsToLoot.length);
    }
    
    // Final confirmation
    const confirmed = confirm(`Are you sure you want to claim loot from ${targetCount} monsters?\n\nThis will claim loot from the first ${targetCount} available monsters.`);
    if (!confirmed) {
      return; // User cancelled
    }
    
    // Disable button and show loading state
    lootAllBtn.disabled = true;
    lootAllBtn.style.opacity = '0.7';
    lootAllBtn.setAttribute('aria-busy', 'true');
    
    // Select targetCount monster IDs
    const monsterIds = monsterIdsToLoot.slice(0, targetCount);
    
    if (monsterIds.length === 0) {
      showNotification('No valid monster IDs found!', 'error');
      lootAllBtn.disabled = false;
      lootAllBtn.style.opacity = '1';
      lootAllBtn.removeAttribute('aria-busy');
      const countEl = document.getElementById('loot-count');
      if (countEl) countEl.textContent = '0';
      return;
    }
    
    showNotification(`Claiming loot from ${monsterIds.length} monsters...`, 'info');
    
    try {
      // Send multiple API requests in parallel for maximum speed
      const promises = monsterIds.map(monsterId => 
        fetch('loot.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'monster_id=' + monsterId + '&user_id=' + userId
        }).then(res => res.json())
      );
      
      // Wait for all requests to complete
      const results = await Promise.all(promises);
      
      // Collect all successful loot and manually update the UI
      let allLootItems = [];
      let successCount = 0;
      let errorCount = 0;
      
      results.forEach((data, index) => {
        if (data.status === 'success' && data.items) {
          successCount++;
          allLootItems = allLootItems.concat(data.items);
          
          // Track this monster as looted so it won't be counted anymore
          const monsterId = monsterIds[index];
          if (monsterId) lootedMonsters.add(monsterId);
        } else {
          errorCount++;
        }
      });
      
      if (allLootItems.length > 0) {
        // Group items by name and count quantities
        const itemGroups = {};
        allLootItems.forEach(item => {
          if (itemGroups[item.NAME]) {
            itemGroups[item.NAME].count++;
          } else {
            itemGroups[item.NAME] = {
              ...item,
              count: 1
            };
          }
        });
        
        // Show all collected loot in the modal
        const lootContainer = document.getElementById('lootItems');
        if (lootContainer) {
          lootContainer.innerHTML = '';
          
          Object.values(itemGroups).forEach(item => {
            const div = document.createElement('div');
            div.style = 'background:#1e1e2f; border-radius:8px; padding:10px; text-align:center; width:80px;';
            div.innerHTML = `
                <img src="${item.IMAGE_URL}" alt="${item.NAME}" style="width:64px; height:64px;"><br>
                <small>${item.NAME}</small>
                ${item.count > 1 ? `<br><small style="color: #4CAF50; font-weight: bold;">x${item.count}</small>` : ''}
            `;
            lootContainer.appendChild(div);
          });
          
          // Show the loot modal
          document.getElementById('lootModal').style.display = 'flex';
        }
        
        showNotification(`Successfully claimed loot from ${successCount} monsters! Got ${allLootItems.length} items!`, 'success');
        
        // Update section header counts after looting - give more time for page to update
        setTimeout(() => {
          console.log('Updating monster counts after looting...');
          applyMonsterFilters(); // This will recount and update all section headers
        }, 1500); // Increased delay to ensure page updates
        
        // Update server-based loot count after looting
        if (typeof updateLootCountFromServer === 'function') {
          setTimeout(() => updateLootCountFromServer(), 250);
        }
        
      } else {
        showNotification('No loot was claimed!', 'error');
        lootAllBtn.disabled = false;
        lootAllBtn.style.opacity = '1';
        lootAllBtn.removeAttribute('aria-busy');
        const countEl = document.getElementById('loot-count');
        if (countEl) countEl.textContent = '0';
      }
      
    } catch (error) {
      console.error('Error looting all monsters:', error);
      showNotification('Server error. Please try again.', 'error');
      lootAllBtn.disabled = false;
      lootAllBtn.style.opacity = '1';
      lootAllBtn.removeAttribute('aria-busy');
      const countEl = document.getElementById('loot-count');
      if (countEl) countEl.textContent = '0';
    }
  }

  function showNotification(msg, type = 'success') {
    const note = document.getElementById('notification');
    if (note) {
      // Add emojis to enhance messages
      let emoji = '';
      if (type === 'success') emoji = '✅ ';
      else if (type === 'error') emoji = '❌ ';
      else if (type === 'warning') emoji = '⚠️ ';
      else if (type === 'info') emoji = 'ℹ️ ';
      
      note.innerHTML = emoji + msg;
      
      // Enhanced styling
      if (type === 'error') {
        note.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
        note.style.borderLeft = '4px solid #c0392b';
      } else if (type === 'warning') {
        note.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
        note.style.borderLeft = '4px solid #e67e22';
      } else if (type === 'info') {
        note.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
        note.style.borderLeft = '4px solid #2980b9';
      } else {
        note.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
        note.style.borderLeft = '4px solid #27ae60';
      }
      
      note.style.display = 'block';
      note.style.borderRadius = '8px';
      note.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
      
      setTimeout(() => {
          note.style.display = 'none';
      }, 4000); // Slightly longer display time
    }
  }
  //#endregion

  function initGateCollapse() {
    const gateInfo = document.querySelector('.gate-info');
    if (!gateInfo) return;

    const header = gateInfo.querySelector('.gate-info-header');
    const scrollContent = gateInfo.querySelector('.gate-info-scroll');

    if (!header || !scrollContent) return;

    header.classList.add('collapsible-header');
    scrollContent.classList.add('collapsible-content');
    scrollContent.classList.toggle('collapsed');

    const style = document.createElement('style');
    style.textContent = `
      .collapsible-header {
        cursor: pointer;
        user-select: none;
      }
      .collapsible-header:hover {
        background: rgba(255, 255, 255, 0.05);
      }
      .collapsible-content.collapsed {
        display: none;
      }
    `;
    document.head.appendChild(style);

    header.addEventListener('click', function() {
      scrollContent.classList.toggle('collapsed');
    });
  }

  function initContinueBattleFirst(){
    const monsterContainer = document.querySelector('.monster-container');
    if (!monsterContainer) return;

    document.querySelectorAll('.monster-card').forEach(x => {
      if (x.innerText.includes('Continue')) {
        monsterContainer.prepend(x);
      }
    });
  }

  function initImprovedWaveButtons() {
    const extractMonsterId = (node) => {
      if (!node) return null;
      if (node.dataset && node.dataset.monsterId) return node.dataset.monsterId;
      const href = node.getAttribute && node.getAttribute('href');
      if (href) {
        const hrefMatch = href.match(/id=(\d+)/);
        if (hrefMatch) return hrefMatch[1];
      }
      const onclick = node.getAttribute && node.getAttribute('onclick');
      if (onclick) {
        const onMatch = onclick.match(/id(?:=|:)(\d+)/);
        if (onMatch) return onMatch[1];
      }
      if (node.closest) {
        const parentLink = node.closest('a[data-monster-id], a[href*="battle.php?id="]');
        if (parentLink && parentLink !== node) {
          return extractMonsterId(parentLink);
        }
      }
      return null;
    };

    document.querySelectorAll('.monster-card > a').forEach(battleLink => {
      if (!battleLink.innerText.includes('Join the Battle')) return;

      const monsterId = extractMonsterId(battleLink);
      if (!monsterId) return;

      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'uiaddon-action-bar';
      buttonContainer.dataset.monsterId = monsterId;
      buttonContainer.style.cssText = 'display: flex; gap: 8px; margin-top: 8px;';

      const joinBtn = document.createElement('button');
      joinBtn.className = 'join-btn';
      joinBtn.style.cssText = 'flex: 1; font-size: 12px;';
      joinBtn.innerText = '⚔️ Join Battle';
      joinBtn.setAttribute('data-monster-id', monsterId);
      joinBtn.addEventListener('click', function(e) {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          fetch('user_join_battle.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'monster_id=' + monsterId + '&user_id=' + userId,
            referrer: 'https://demonicscans.org/battle.php?id=' + monsterId
          })
          .then(res => res.text())
          .then(data => {
            const msg = (data || '').trim();
            const ok = msg.toLowerCase().startsWith('you have successfully');
            if (ok) {
              window.open(battleLink.href, '_blank');
              showNotification('Battle joined! Opening in new tab...', 'success');
            } else {
              showNotification(msg || 'Failed to join battle', 'error');
            }
          })
          .catch(() => {
            showNotification('Server error. Please try again.', 'error');
          });
        } else {
          joinWaveInstant(monsterId, battleLink);
        }
      });

      const viewBtn = document.createElement('button');
      viewBtn.className = 'join-btn';
      viewBtn.id = 'view-battle-btn';
      viewBtn.style.cssText = 'flex: 1; font-size: 12px; background: #6c7086;';
      viewBtn.innerText = '👁️ View';
      viewBtn.setAttribute('data-monster-id', monsterId);
      viewBtn.addEventListener('click', function(e) {
        if (e.ctrlKey || e.metaKey) {
          window.open(battleLink.href, '_blank');
        } else {
          window.location.href = battleLink.href;
        }
      });

      buttonContainer.appendChild(joinBtn);
      buttonContainer.appendChild(viewBtn);

      battleLink.style.display = 'none';
      battleLink.parentNode.appendChild(buttonContainer);
    });

    document.querySelectorAll('.monster-card').forEach(card => {
      if (card.querySelector('.uiaddon-action-bar')) {
        return;
      }

      const continueBtn = card.querySelector('button.continue-btn');
      if (!continueBtn) return;

      const monsterId = continueBtn.getAttribute('data-monster-id') || card.dataset.monsterId || extractMonsterId(card);
      if (!monsterId) return;

      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'uiaddon-action-bar';
      buttonContainer.dataset.monsterId = monsterId;
      buttonContainer.style.cssText = 'display: flex; gap: 8px; margin-top: 8px;';

      const clonedContinue = continueBtn.cloneNode(true);
      clonedContinue.classList.add('join-btn');
      clonedContinue.setAttribute('data-monster-id', monsterId);
      if (!clonedContinue.style.flex) {
        clonedContinue.style.flex = '1 1 0%';
        clonedContinue.style.fontSize = '12px';
      }
      setContinueButtonLabel(clonedContinue);

      const battleHref = `battle.php?id=${monsterId}`;
      let viewBtn = card.querySelector('#view-battle-btn');
      viewBtn = viewBtn ? viewBtn.cloneNode(true) : null;
      if (!viewBtn) {
        viewBtn = document.createElement('button');
        viewBtn.className = 'join-btn';
        viewBtn.id = 'view-battle-btn';
        viewBtn.style.cssText = 'flex: 1; font-size: 12px; background: #6c7086;';
        viewBtn.innerText = '👁️ View';
        viewBtn.addEventListener('click', (e) => {
          if (e.ctrlKey || e.metaKey) {
            window.open(battleHref, '_blank');
          } else {
            window.location.href = battleHref;
          }
        });
      }
      viewBtn.setAttribute('data-monster-id', monsterId);

      buttonContainer.appendChild(clonedContinue);
      buttonContainer.appendChild(viewBtn);

      const continueAnchor = continueBtn.closest('a');
      if (continueAnchor) {
        continueAnchor.style.display = 'none';
        continueAnchor.removeAttribute('id');
        continueAnchor.removeAttribute('class');
      } else {
        continueBtn.style.display = 'none';
      }

      const viewAnchor = card.querySelector('a[href*="battle.php?id="]');
      if (viewAnchor && !viewAnchor.contains(clonedContinue)) {
        if (/view/i.test(viewAnchor.textContent || '')) {
          viewAnchor.style.display = 'none';
        }
      }

      card.appendChild(buttonContainer);
      try { addPlayerCountToJoinButton(card); } catch (e) { /* ignore */ }
    });
  }

  // Enhanced Monster sorting functionality with collapsible sections
  function initMonsterSorting() {
    const monsterContainer = document.querySelector('.monster-container');
    if (!monsterContainer) return;

    const continueBattleSection = document.createElement('div');
    continueBattleSection.className = 'monster-section';
    continueBattleSection.innerHTML = `
      <div class="monster-section-header">
        <h3 style="color: #f38ba8; margin: 0; flex: 1;">⚔️ Continue Battle</h3>
        <button class="section-toggle-btn" id="continue-battle-toggle">${extensionSettings.continueBattlesExpanded ? '–' : '+'}</button>
      </div>
      <div class="monster-section-content" id="continue-battle-content" style="display: ${extensionSettings.continueBattlesExpanded ? 'block' : 'none'};">
        <div class="monster-container" style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 18px;"></div>
      </div>
    `;

    const lootSection = document.createElement('div');
    lootSection.className = 'monster-section';
    lootSection.innerHTML = `
      <div class="monster-section-header">
        <h3 style="color: #f9e2af; margin: 0; flex: 1;">💰 Available Loot</h3>
        <button class="section-toggle-btn" id="loot-toggle">${extensionSettings.lootExpanded ? '–' : '+'}</button>
      </div>
      <div class="monster-section-content" id="loot-content" style="display: ${extensionSettings.lootExpanded ? 'block' : 'none'};">
        <div class="monster-container" style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 20px;"></div>
      </div>
    `;

    // Add sorting controls for Join a Battle section
    const joinBattleSection = document.createElement('div');
    joinBattleSection.className = 'monster-section';
    joinBattleSection.innerHTML = `
      <div class="monster-section-header" style="flex-wrap: wrap;">
        <h3 style="color: #a6e3a1; margin: 0; flex: 1;">🆕 Join a Battle</h3>
        <div id="join-sort-controls" style="margin-left: 20px;">
          <label for="join-sort-select" style="color: #a6e3a1; font-size: 13px; margin-right: 6px;">Sort by:</label>
          <select id="join-sort-select" style="padding: 4px 8px; border-radius: 4px; background: #181825; color: #fff; border: 1px solid #444;">
            <option value="name-asc">Name (A-Z)</option>
            <option value="hp-desc">HP (High → Low)</option>
            <option value="hp-asc">HP (Low → High)</option>
          </select>
        </div>
      </div>
      <div class="monster-section-content">
        <div class="monster-container" style="display: flex; flex-wrap: wrap; gap: 15px;"></div>
      </div>
    `;

    const monsterCards = Array.from(document.querySelectorAll('.monster-card'));
    const continueCards = [];
    const lootCards = [];
    const joinCards = [];

    // Helper to extract HP and player count from card
    function getCardStats(card) {
      let hp = 0, maxHp = 0, players = 0;
      // Try to get HP from visible bar first
      const hpNumbers = card.querySelector('.hp-bar .hp-numbers');
      if (hpNumbers) {
        const match = hpNumbers.textContent.match(/([\d,]+)\s*\/\s*([\d,]+)/);
        if (match) {
          hp = parseInt(match[1].replace(/,/g, ''), 10);
          maxHp = parseInt(match[2].replace(/,/g, ''), 10);
        }
      }
      // Players
      const playerText = Array.from(card.querySelectorAll('div')).find(div => 
        div.textContent.includes('Players Joined') || div.textContent.includes('👥')
      );
      if (playerText) {
        const playerMatch = playerText.textContent.match(/(\d+)\s*\/\s*(\d+)/);
        if (playerMatch) {
          players = parseInt(playerMatch[1], 10);
        }
      }
      // Name
      const name = getMonsterNameFromCard(card) || '';
      return { hp, maxHp, players, name };
    }

    monsterCards.forEach(card => {
      if (card.innerText.includes('Continue')) {
        continueCards.push(card);
      } else if (card.innerText.includes('Loot')) {
        lootCards.push(card);
      } else {
        joinCards.push(card);
      }
    });

    // Default sort: name ascending (will be influenced by filter state)
    function sortJoinCards(cards, sortType) {
      return cards.slice().sort((a, b) => {
        const statsA = getCardStats(a);
        const statsB = getCardStats(b);
        switch (sortType) {
          case 'name-asc':
            return statsA.name.localeCompare(statsB.name);
          case 'hp-desc':
            if (statsB.hp !== statsA.hp) return statsB.hp - statsA.hp;
            return statsA.name.localeCompare(statsB.name);
          case 'hp-asc':
            if (statsA.hp !== statsB.hp) return statsA.hp - statsB.hp;
            return statsA.name.localeCompare(statsB.name);
          default:
            return statsA.name.localeCompare(statsB.name);
        }
      });
    }

    // Initial sort type: prefer any existing dropdown value (if page already
    // has one from previous render), then saved value, then default
    let currentSortType = 'name-asc';
    const existingSortSelect = document.getElementById('join-sort-select');
    if (existingSortSelect && existingSortSelect.value) {
      currentSortType = existingSortSelect.value;
    } else {
      const saved = localStorage.getItem('joinSortType');
      if (saved) {
        currentSortType = saved;
      }
    }

    // Render join cards with current sort
    function renderJoinCards() {
      const joinContainer = joinBattleSection.querySelector('.monster-container');
      joinContainer.innerHTML = '';
      const sorted = sortJoinCards(joinCards, currentSortType);
      sorted.forEach(card => joinContainer.appendChild(card));
    }

    // Listen for sort changes immediately
    const newSortSelect = joinBattleSection.querySelector('#join-sort-select');
    if (newSortSelect) {
      newSortSelect.value = currentSortType;
      newSortSelect.addEventListener('change', () => {
        currentSortType = newSortSelect.value;
        localStorage.setItem('joinSortType', currentSortType);
        renderJoinCards();
      });
    }

    monsterContainer.innerHTML = '';

    if (continueCards.length > 0) {
      const continueGrid = continueBattleSection.querySelector('.monster-container');
      continueCards.forEach(card => continueGrid.appendChild(card));
      monsterContainer.appendChild(continueBattleSection);
    }

    if (lootCards.length > 0) {
      // Update the loot section header with count
      const lootHeader = lootSection.querySelector('h3');
      lootHeader.textContent = `💰 Available Loot (${lootCards.length})`;
      
      // Add Loot All button right after the header
      addLootAllButtonToHeader(lootHeader, lootCards.length);
      
      const lootGrid = lootSection.querySelector('.monster-container');
      lootCards.forEach(card => lootGrid.appendChild(card));
      monsterContainer.appendChild(lootSection);
    }

    // Render join cards with sorting controls (respecting current filters immediately)
    if (joinCards.length > 0) {
      monsterContainer.appendChild(joinBattleSection);
      // Filters (monster name/types/loot/HP/players) are already wired and
      // applied via applyMonsterFilters(), so on first render we just sort
      // according to currentSortType and show the result.
      renderJoinCards();
    }

    const continueToggle = document.getElementById('continue-battle-toggle');
    const lootToggle = document.getElementById('loot-toggle');
    const continueContent = document.getElementById('continue-battle-content');
    const lootContent = document.getElementById('loot-content');

    if (continueToggle && continueContent) {
      continueToggle.addEventListener('click', () => {
        const isCollapsed = continueContent.style.display === 'none';
        continueContent.style.display = isCollapsed ? 'block' : 'none';
        continueToggle.textContent = isCollapsed ? '–' : '+';
        extensionSettings.continueBattlesExpanded = isCollapsed;
        saveSettings();
      });
    }

    if (lootToggle && lootContent) {
      lootToggle.addEventListener('click', () => {
        const isCollapsed = lootContent.style.display === 'none';
        lootContent.style.display = isCollapsed ? 'block' : 'none';
        lootToggle.textContent = isCollapsed ? '–' : '+';
        extensionSettings.lootExpanded = isCollapsed;
        saveSettings();
      });
    }

    // Defensive: always re-render join cards after all setup
    if (joinCards.length > 0) {
      renderJoinCards();
    }

    const sectionStyle = document.createElement('style');
    sectionStyle.textContent = `
      .monster-section {
        margin-bottom: 30px;
        background: rgba(30, 30, 46, 0.3);
        border-radius: 8px;
        overflow: hidden;
      }

      .monster-section-header {
        display: flex;
        align-items: center;
        padding: 15px 20px;
        background: rgba(203, 166, 247, 0.1);
        cursor: pointer;
        border-bottom: 1px solid rgba(88, 91, 112, 0.3);
      }

      .monster-section-header:hover {
        background: rgba(203, 166, 247, 0.15);
      }

      .section-toggle-btn {
        background: none;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #e0e0e0;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        min-width: 24px;
      }

      .section-toggle-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .monster-section-content {
        padding: 15px 20px;
      }
    `;
    document.head.appendChild(sectionStyle);
  }

  // Additional battle and other functionality...
  function initReducedImageSize(){
    const monsterImage = document.getElementById('monsterImage');
    const panel = document.querySelector('.content-area > .panel');
    const hpBar = document.querySelector('.hp-bar');

    if (monsterImage) {
      monsterImage.style.maxHeight = "400px";
    }
    if (panel) {
      panel.style.justifyItems = "center";
      panel.style.textAlign = "center";
    }
    if (hpBar) {
      hpBar.style.justifySelf = "normal";
    }
  }

  function initTotalOwnDamage(){
    colorMyself();
    const observer = new MutationObserver((mutations) => {
      const shouldUpdate = mutations.some(mutation =>
        mutation.type === 'childList' && mutation.addedNodes.length > 0
      );

      if (shouldUpdate) {
        setTimeout(colorMyself, 50);
      }
    });

    const config = {
      childList: true,
      subtree: true
    };

    const targetElement = document.querySelector('.attack-panel');
    if (targetElement) {
      observer.observe(targetElement, config);
    }
  }

    function highlightLootCards() {
      // Prioritize the updated "Your Damage" section first (most reliable when updated)
      var exDamageNumber = 0;
      var exDamageDone = "0";
      
      // Try to get from "Your Damage" section first
      const yourDamageElement = document.querySelector('#yourDamageValue');
      if (yourDamageElement) {
        exDamageDone = yourDamageElement.innerText;
        exDamageNumber = Number.parseInt(exDamageDone.replaceAll(',','').replaceAll('.',''));
      } else {
        // Fallback: try to get from stats-stack
        document.querySelectorAll("div.stats-stack > span").forEach(x => {
          if (x.innerText.includes('Your Damage: ')) {
            const damageMatch = x.innerText.match(/Your Damage: ([\d,]+)/);
            if (damageMatch) {
              exDamageDone = damageMatch[1];
              exDamageNumber = Number.parseInt(exDamageDone.replaceAll(',','').replaceAll('.',''));
            }
          }
        });
      }

      // Highlight loot cards based on damage requirements
      document.querySelectorAll('.loot-card').forEach(y => {
        y.style.margin = '5px';
        y.querySelectorAll('.loot-stats .chip').forEach(x => {
          if (x.parentElement) {
            x.parentElement.style.gap = '0px';
          }
          if (x.innerText.includes('DMG req')) {
            var lootReqNumber = Number.parseInt(x.innerText.substr(9).replaceAll(',','').replaceAll('.',''));
            if (lootReqNumber <= exDamageNumber) {
              y.style.background = extensionSettings.lootHighlighting.backgroundColor;
              y.style.boxShadow = `0 0 15px ${extensionSettings.lootHighlighting.glowColor}`;
              try {
                y.classList.remove('locked');
                const lockBadge = y.querySelector('.lock-badge');
                if (lockBadge) {
                  lockBadge.remove();
                }
              } catch {}
            }
          }
        });
      });
    }

    function initUniversalLootHighlighting() {
      // Initial highlighting
      highlightLootCards();
      
      // Set up observer to watch for new loot cards
      const observer = new MutationObserver((mutations) => {
        const shouldUpdate = mutations.some(mutation =>
          mutation.type === 'childList' && 
          mutation.addedNodes.length > 0 &&
          Array.from(mutation.addedNodes).some(node => 
            node.nodeType === Node.ELEMENT_NODE && 
            (node.classList?.contains('loot-card') || node.querySelector?.('.loot-card'))
          )
        );

        if (shouldUpdate) {
          setTimeout(highlightLootCards, 100);
        }
      });

      // Start observing
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Monitor slash button clicks
      setupSlashButtonMonitoring();
  }
  
  function setupSlashButtonMonitoring() {
    // Find all buttons that contain "slash" text (case insensitive)
    const slashButtons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
    
    slashButtons.forEach(button => {
      const buttonText = button.textContent || button.value || '';
      if (buttonText.toLowerCase().includes('slash')) {
        // Add click listener to slash buttons
        button.addEventListener('click', function(event) {
          // Wait a bit for the damage to update, then check loot highlighting
          setTimeout(() => {
            highlightLootCards();
          }, 750); // Wait 750ms for damage to update
        });
      }
    });
  }

  function colorMyself(){
    // Don't interfere with the website's natural damage updating
    // Just let the website update #yourDamageValue automatically

        // Only create containers if they don't already exist
        if (!document.getElementById('extension-enemy-loot-container')) {
          var lootContainer = document.createElement('div');
          lootContainer.id = 'extension-loot-container';
          lootContainer.style.display = 'ruby';
          lootContainer.style.maxWidth = '50%';

          document.querySelectorAll('.loot-card').forEach(x => lootContainer.append(x));

          var enemyAndLootContainer = document.createElement('div');
          enemyAndLootContainer.id = 'extension-enemy-loot-container';
          enemyAndLootContainer.style.display = 'inline-flex';

        // Create monster display container
        var monsterDisplay = document.createElement('div');
        monsterDisplay.id = 'monster-display';
        monsterDisplay.style.display = 'flex';
        monsterDisplay.style.flexDirection = 'column';
        monsterDisplay.style.alignItems = 'center';
        monsterDisplay.style.gap = '10px';
        monsterDisplay.style.flexBasis = '350px';
        monsterDisplay.style.minWidth = '250px';

        const monsterImage = document.querySelector('#monsterImage');
        if (monsterImage) {
          // Restore original image size
          monsterImage.style.maxHeight = '400px';
          monsterImage.style.width = '50%';
          monsterDisplay.append(monsterImage);
        }

        // Find and move ALL monster-related content into monster display
        const panel = document.querySelector("body > div.main-wrapper > div > .panel");
        if (panel) {
          // Find specific elements that should be in monster display (be more specific)
          const elementsToMove = [];
          
          // Add specific elements one by one
          const monsterName = panel.querySelector('h1, h2, h3, strong');
          if (monsterName) elementsToMove.push(monsterName);
          
          const hpBar = panel.querySelector('.hp-bar');
          if (hpBar) elementsToMove.push(hpBar);
          
          const hpText = panel.querySelector('.hp-text');
          if (hpText) elementsToMove.push(hpText);
          
          const statsStack = panel.querySelector('.stats-stack');
          if (statsStack) elementsToMove.push(statsStack);
          
          const yourStats = panel.querySelector('#yourStats');
          if (yourStats) elementsToMove.push(yourStats);
          
          const lootButton = panel.querySelector('#loot-button');
          if (lootButton) elementsToMove.push(lootButton);
          
          // Find "Monster has been slain!" text
          const slainText = Array.from(panel.querySelectorAll('*')).find(el =>
            el.textContent && el.textContent.includes('Monster has been slain!')
          );
          if (slainText) elementsToMove.push(slainText);
          
          // Add attack buttons to monster display (but not the text)
          const attackButtons = panel.querySelector('.attack-btn-wrap');
          if (attackButtons) elementsToMove.push(attackButtons);
          
          // Remove the "Choose a Skill to Attack" text completely
          const attackText = Array.from(panel.querySelectorAll('*')).find(el =>
            el.textContent && el.textContent.includes('💥 Choose a Skill to Attack')
          );
          if (attackText) {
            attackText.remove();
          }
          
          // Use the elements directly without additional filtering
          const filteredElements = elementsToMove;
          
          // Create a container for monster stats
          const monsterStatsContainer = document.createElement('div');
          
          // Move all elements to monster stats container
          filteredElements.forEach(element => {
            monsterStatsContainer.append(element);
          });
          
          // Remove zombie emoji completely (including br tags)
          const zombieEmoji = Array.from(panel.querySelectorAll('*')).find(el => 
            el.textContent && el.textContent.includes('🧟')
          );
          if (zombieEmoji) {
            zombieEmoji.remove();
          }
          
          // Also remove any br elements that contain only the zombie emoji
          const brElements = panel.querySelectorAll('br');
          brElements.forEach(br => {
            if (br.textContent && br.textContent.trim() === '🧟') {
              br.remove();
            }
          });
          
          // Remove any text nodes containing zombie emoji
          const walker = document.createTreeWalker(
            panel,
            NodeFilter.SHOW_TEXT,
            null,
            false
          );
          let textNode;
          while (textNode = walker.nextNode()) {
            if (textNode.textContent && textNode.textContent.includes('🧟')) {
              textNode.remove();
            }
          }
          
          monsterDisplay.append(monsterStatsContainer);
        }

        enemyAndLootContainer.append(monsterDisplay);
        enemyAndLootContainer.append(lootContainer);

          if (panel) {
            panel.prepend(enemyAndLootContainer);
          }
        }

      // Call the universal loot highlighting function
      highlightLootCards();
  }

  function initAnyClickClosesModal(){
    const lootModal = document.getElementById('lootModal');
    if (lootModal) {
      lootModal.addEventListener('click', function(event) {
        this.style.display = 'none';
      });
    }
  }

  // Stat allocation functions
  function allocateStatPoints(stat, amount) {
    const currentPoints = parseInt(document.getElementById('v-points')?.textContent || '0');
    if (currentPoints < amount) {
      showNotification('Not enough stat points!', 'error');
      return;
    }

    const body = `action=allocate&stat=${encodeURIComponent(stat)}&amount=${encodeURIComponent(amount)}`;
    fetch('stats_ajax.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })
    .then(async r => {
      const txt = await r.text();
      try {
        return { okHTTP: r.ok, json: JSON.parse(txt), raw: txt };
      } catch {
        throw new Error(`Bad JSON (${r.status}): ${txt}`);
      }
    })
    .then(pack => {
      if (!pack.okHTTP) {
        showNotification(`HTTP ${pack.raw}`, 'error');
        return;
      }
      const res = pack.json;
      if (!res.ok) {
        showNotification(res.msg || 'Error', 'error');
        return;
      }

      const u = res.user;
      document.getElementById('v-points').textContent = u.STAT_POINTS;
      document.getElementById('v-attack').textContent = u.ATTACK;
      document.getElementById('v-defense').textContent = u.DEFENSE;
      document.getElementById('v-stamina').textContent = u.STAMINA;

      updateSidebarStats(u);
      showNotification(`Allocated ${amount} points to ${stat}!`, 'success');

      setTimeout(() => {
        const statSection = document.querySelector('#stat-allocation-content');
        if (statSection) {
          initStatAllocation();
        }
      }, 500);
    })
    .catch(error => {
      showNotification('Failed to allocate stats', 'error');
      console.error('Error:', error);
    });
  }

  function sidebarAlloc(stat, amount) {
      const pointsElement = document.getElementById('sidebar-points');
      const currentPoints = parseInt(pointsElement?.textContent || '0');

      if (currentPoints < amount) {
          showNotification(`Not enough points! You need ${amount} points but only have ${currentPoints}.`, 'error');
          return;
      }

      // Map our stat names to what the server expects
      const statMapping = {
          'attack': 'attack',
          'defense': 'defense', 
          'stamina': 'stamina'
      };

      const serverStat = statMapping[stat] || stat;
      const body = `action=allocate&stat=${encodeURIComponent(serverStat)}&amount=${encodeURIComponent(amount)}`;

      // Disable all upgrade buttons temporarily
      document.querySelectorAll('.upgrade-btn').forEach(btn => btn.disabled = true);

      fetch('stats_ajax.php', {
          method: 'POST',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          body
      })
      .then(async r => {
          const txt = await r.text();
          try {
              const json = JSON.parse(txt);
              if (json.error) {
                  throw new Error(json.error);
              }
              return { okHTTP: r.ok, json, raw: txt };
          } catch (parseError) {
              // If not JSON or has error, try to parse as plain text
              if (r.ok && txt.includes('STAT_POINTS')) {
                  const stats = {};
                  const lines = txt.split('\n');
                  lines.forEach(line => {
                      if (line.includes('STAT_POINTS')) stats.STAT_POINTS = line.split('=')[1]?.trim();
                      if (line.includes('ATTACK')) stats.ATTACK = line.split('=')[1]?.trim();
                      if (line.includes('DEFENSE')) stats.DEFENSE = line.split('=')[1]?.trim();
                      if (line.includes('STAMINA')) stats.STAMINA = line.split('=')[1]?.trim();
                  });
                  return { okHTTP: r.ok, json: { ok: true, user: stats }, raw: txt };
              }
              throw new Error(`Bad response (${r.status}): ${txt}`);
          }
      })
      .then(pack => {
          if (!pack.okHTTP) {
              showNotification(`HTTP Error: ${pack.raw}`, 'error');
              return;
          }

          const res = pack.json;
          if (res.msg) {
              showNotification(res.msg, 'error');
              return;
          } else if (res.error) {
              showNotification(res.error, 'error');
              return;
          }

          const u = res.user;
          updateSidebarStats(u);

          // Also update main stats page if we're on it
          if (window.location.pathname.includes('stats')) {
              const mainPoints = document.getElementById('v-points');
              const mainAttack = document.getElementById('v-attack');
              const mainDefense = document.getElementById('v-defense');
              const mainStamina = document.getElementById('v-stamina');

              if (mainPoints) mainPoints.textContent = u.STAT_POINTS || u.stat_points || 0;
              if (mainAttack) mainAttack.textContent = u.ATTACK || u.attack || 0;
              if (mainDefense) mainDefense.textContent = u.DEFENSE || u.defense || 0;
              if (mainStamina) mainStamina.textContent = u.STAMINA || u.MAX_STAMINA || u.stamina || 0;
          }

          showNotification(`Successfully upgraded ${stat} by ${amount}!`, 'success');
      })
      .catch(err => {
          console.error(err);
          showNotification(err.message || 'Network error occurred', 'error');
      })
      .finally(() => {
          // Re-enable upgrade buttons
          document.querySelectorAll('.upgrade-btn').forEach(btn => btn.disabled = false);
          // Refresh stats after allocation
          setTimeout(fetchAndUpdateSidebarStats, 500);
      });
  }

  // Monster Loot Preview System
  async function initMonsterLootPreview() {
    // Only run on active wave pages
    if (!window.location.pathname.includes('active_wave.php')) return;
    
    const monsterCards = document.querySelectorAll('.monster-card');
    
    // Add CSS for loot preview
    addLootPreviewStyles();
    
    // Group monster cards by type to optimize loot fetching
    const monstersByType = new Map();
    
    // Process each monster card and group by name
    monsterCards.forEach(card => {
      const monsterName = getMonsterNameFromCard(card);
      if (monsterName) {
        if (!monstersByType.has(monsterName)) {
          monstersByType.set(monsterName, []);
        }
        monstersByType.get(monsterName).push(card);
      }
      
      addLootPreviewToCard(card);
      enhanceMonsterCardDisplay(card);
    });
    
    // Fetch loot data once per monster type
    for (const [monsterName, cards] of monstersByType) {
      if (!lootCache.has(monsterName)) {
        // Pick the first card of this type to fetch loot data
        const firstCard = cards[0];
        const monsterId = firstCard.getAttribute('data-monster-id');
        if (monsterId) {
          await fetchMonsterLootByType(monsterId, monsterName, cards);
        }
      } else {
        // Use cached data for all cards of this type
        const cachedLoot = lootCache.get(monsterName);
        cards.forEach(card => {
          const cardMonsterId = card.getAttribute('data-monster-id');
          if (cardMonsterId) {
            displayLootPreview(cardMonsterId, cachedLoot);
          }
        });
      }
    }
  }

  function getMonsterNameFromCard(card) {
    const nameElement = card.querySelector('h3');
    return nameElement ? nameElement.textContent.trim() : null;
  }

  function enhanceMonsterCardDisplay(card) {
    // Add HP numbers to health bar
    addHPNumbersToHealthBar(card);
    
    // Add player count to join button
    addPlayerCountToJoinButton(card);
    
    // Hide redundant text elements
    hideRedundantTextElements(card);
  }

  function addHPNumbersToHealthBar(card) {
    const hpBar = card.querySelector('.hp-bar');
    // Find the HP stat row
    const hpRow = Array.from(card.querySelectorAll('.stat-row')).find(row => {
      const icon = row.querySelector('.stat-icon.hp');
      return icon && icon.textContent.includes('❤️');
    });

    let currentHP = null, maxHP = null;
    if (hpRow) {
      const statValue = hpRow.querySelector('.stat-value');
      if (statValue) {
        // Extract both numbers, even if separated by <br> or whitespace
        const numbers = statValue.textContent.replace(/\s+/g, '').split('/');
        if (numbers.length === 2) {
          currentHP = numbers[0];
          maxHP = numbers[1];
        }
      }
    }

    if (hpBar && currentHP && maxHP && !hpBar.querySelector('.hp-numbers')) {
      // Create HP numbers overlay
      const hpNumbers = document.createElement('div');
      hpNumbers.className = 'hp-numbers';
      hpNumbers.textContent = `${currentHP} / ${maxHP}`;
      // Make sure hp-bar is positioned relatively
      hpBar.style.position = 'relative';
      hpBar.appendChild(hpNumbers);
    }
  }

  function addPlayerCountToJoinButton(card) {
    if (!card) return;

    const parsePlayers = (text) => {
      if (!text) return null;
      const match = text.replace(/\s+/g, ' ').match(/(\d[\d,]*)\s*\/\s*(\d[\d,]*)/);
      if (!match) return null;
      return {
        currentDisplay: match[1].replace(/\s+/g, ''),
        maxDisplay: match[2].replace(/\s+/g, '')
      };
    };

    const findPlayerCounts = () => {
      const statRows = card.querySelectorAll('.monster-stats .stat-row, .stat-row');
      for (const row of statRows) {
        const labelText = (row.querySelector('.stat-label')?.textContent || '').toLowerCase();
        const iconClass = row.querySelector('.stat-icon')?.className || '';
        if (/players/.test(labelText) || /grp/.test(iconClass) || /👥/.test(row.textContent)) {
          const parsed = parsePlayers(row.textContent);
          if (parsed) return parsed;
        }
      }

      const chips = card.querySelectorAll('.party-chip, .mini-chip, .stat-value');
      for (const chip of chips) {
        const parsed = parsePlayers(chip.textContent);
        if (parsed) return parsed;
      }

      const fallback = Array.from(card.querySelectorAll('div, span'))
        .find(el => /players/i.test(el.textContent) || /👥/.test(el.textContent));
      if (fallback) {
        const parsed = parsePlayers(fallback.textContent);
        if (parsed) return parsed;
      }

      const dataCurrent = card.dataset.players;
      const dataMax = card.dataset.playersMax || card.dataset.maxPlayers || card.dataset.playerCap;
      if (dataCurrent && dataMax) {
        return {
          currentDisplay: String(dataCurrent),
          maxDisplay: String(dataMax)
        };
      }

      return null;
    };

    const counts = findPlayerCounts();
    if (!counts) return;

    const { currentDisplay, maxDisplay } = counts;
    const overlayUpdated = updateOverlayPlayerCount(card, currentDisplay, maxDisplay);

    const joinButtons = card.querySelectorAll('.join-btn');
    joinButtons.forEach(button => {
      const label = (button.textContent || '').toLowerCase();
      if (!label.includes('join')) return;
      if (overlayUpdated) {
        button.innerHTML = '⚔️ Join';
      } else {
        button.innerHTML = `⚔️ Join (${currentDisplay}/${maxDisplay})`;
      }
      button.dataset.enhanced = 'true';
    });
  }

  function hideRedundantTextElements(card) {
    // Hide the standalone HP text div
    const hpTextDiv = Array.from(card.querySelectorAll('div')).find(div => 
      div.textContent.includes('❤️') && div.textContent.includes('HP') && 
      !div.classList.contains('hp-bar') && !div.classList.contains('hp-numbers')
    );
    
    if (hpTextDiv) {
      hpTextDiv.style.display = 'none';
    }
    
    // Hide the standalone player count text div
    const playerTextDiv = Array.from(card.querySelectorAll('div')).find(div => 
      (div.textContent.includes('Players Joined') || div.textContent.includes('👥')) &&
      !div.classList.contains('join-btn')
    );
    
    if (playerTextDiv) {
      playerTextDiv.style.display = 'none';
    }
    
    // Remove <br> elements between buttons and other content
    const brElements = card.querySelectorAll('br');
    brElements.forEach(br => {
      br.remove();
    });
    
    // Add consistent spacing by adding a class to the card for CSS styling
    card.classList.add('enhanced-monster-card');
  }

  function addLootPreviewStyles() {
    if (document.getElementById('loot-preview-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'loot-preview-styles';
    style.textContent = `
      .loot-preview-container {
        margin-top: 10px;
        padding-top: 8px;
      }
      
      .loot-preview-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 4px;
        margin-top: 8px;
      }
      
      .loot-preview-grid.forModal {
        grid-template-columns: repeat(8, 1fr);
        margin-top: 0px;
      }

      
      .loot-preview-grid.hidden-with-images {
        display: none;
      }
      
      /* Hide loot preview when monster images are hidden */
      body.monster-images-hidden .loot-preview-grid,
      body.monster-images-hidden .loot-preview-container {
        display: none;
      }
      
      /* Enhanced HP bar styling */
      .hp-bar {
        position: relative !important;
        min-height: 16px;
      }
      
      .hp-numbers {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-weight: bold;
        font-size: 11px;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
        pointer-events: none;
        z-index: 10;
      }
      
      /* Enhanced join button styling */
      .join-btn {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      /* Enhanced monster card spacing */
      .enhanced-monster-card {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .enhanced-monster-card h3 {
        margin-bottom: 8px !important;
        margin-top: 8px !important;
      }
      
      .enhanced-monster-card .hp-bar {
        margin: 8px 0 !important;
      }
      
      .enhanced-monster-card .join-btn,
      .enhanced-monster-card [style*="display: flex"] {
        margin-top: 8px !important;
      }
      
      .loot-preview-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .loot-preview-thumb {
        position: relative;
        border-radius: 4px;
        overflow: hidden;
        background: rgba(30, 30, 46, 0.6);
        border: 1px solid rgba(69, 71, 90, 0.5);
        aspect-ratio: 1;
      }

      .loot-preview-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .loot-preview-item.requirement-met .loot-preview-thumb::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(166, 227, 161, 0.35), rgba(34, 197, 94, 0.2));
        border: 2px solid rgba(166, 227, 161, 0.8);
        pointer-events: none;
        z-index: 1;
      }

      .loot-preview-thumb .tier-indicator {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: #666;
        z-index: 2;
      }
      
      .loot-preview-item .tier-indicator.legendary {
        background: linear-gradient(90deg, #ff6b35, #f7931e);
      }
      
      .loot-preview-item .tier-indicator.epic {
        background: linear-gradient(90deg, #9b59b6, #8e44ad);
      }
      
      .loot-preview-item .tier-indicator.rare {
        background: linear-gradient(90deg, #3498db, #2980b9);
      }
      
      .loot-preview-item .tier-indicator.common {
        background: linear-gradient(90deg, #95a5a6, #7f8c8d);
      }
      
      .loot-preview-thumb .drop-rate {
        position: absolute;
        top: 2px;
        right: 2px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        font-size: 8px;
        padding: 1px 3px;
        border-radius: 2px;
        font-weight: bold;
        z-index: 2;
      }

      .loot-requirement {
        background: rgba(0, 0, 0, 0.75);
        color: #f9e2af;
        font-size: 9px;
        padding: 2px 4px;
        border-radius: 3px;
        text-align: center;
        line-height: 1.2;
      }

      .loot-requirement.small-grid {
        font-size: 8px;
      }

      .loot-requirement.met {
        background: rgba(166, 227, 161, 0.60);
        color: #a6e3a1;
      }

      .loot-requirement small {
        display: block;
        font-size: 8px;
        color: #cdd6f4;
        margin-top: 1px;
      }
      
      .loot-loading {
        text-align: center;
        color: #89b4fa;
        font-size: 10px;
        padding: 8px;
      }
      
      .loot-error {
        text-align: center;
        color: #f38ba8;
        font-size: 10px;
        padding: 8px;
      }
    `;
    
    document.head.appendChild(style);
  }

  function addLootPreviewToCard(card) {
    const monsterId = card.getAttribute('data-monster-id');
    if (!monsterId) return;
    
    // Find the monster image to insert loot after it
    const monsterImg = card.querySelector('.monster-img');
    if (!monsterImg) return;
    
    // Create loot preview container - no header, just the grid
    const lootContainer = document.createElement('div');
    lootContainer.className = 'loot-preview-container';
    lootContainer.innerHTML = `
      <div class="loot-preview-grid" id="loot-grid-${monsterId}">
        <div class="loot-loading">Loading loot...</div>
      </div>
    `;
    
    // Insert after the monster image
    monsterImg.insertAdjacentElement('afterend', lootContainer);
    
    // Note: Loot will be fetched and displayed by the main initialization function
    // This avoids duplicate fetching for monsters of the same type
  }

  async function fetchMonsterLootByType(monsterId, monsterName, allCardsOfType) {
    try {
      const response = await fetch(`battle.php?id=${monsterId}`);
      const html = await response.text();
      
      // Parse loot from the battle page
      const lootData = parseLootFromBattlePage(html);
      
      // Cache the loot data for this monster type
      lootCache.set(monsterName, lootData);
      
      // Display loot for all cards of this type
      allCardsOfType.forEach(card => {
        const cardMonsterId = card.getAttribute('data-monster-id');
        if (cardMonsterId) {
          displayLootPreview(cardMonsterId, lootData);
        }
      });
      
      // Reapply filters now that we have new loot data
      // Check if there are any active loot filters
      const selectedLootItems = Array.from(document.querySelectorAll('.loot-filter-checkbox:checked')).map(cb => cb.value);
      if (selectedLootItems.length > 0) {
        // Small delay to ensure DOM updates are complete
        setTimeout(() => {
          if (typeof applyMonsterFilters === 'function') {
            applyMonsterFilters();
          }
        }, 100);
      }
      
    } catch (error) {
      console.error(`Error fetching loot for monster type ${monsterName}:`, error);
      
      // Show error for all cards of this type
      allCardsOfType.forEach(card => {
        const cardMonsterId = card.getAttribute('data-monster-id');
        if (cardMonsterId) {
          const grid = document.getElementById(`loot-grid-${cardMonsterId}`);
          if (grid) {
            grid.innerHTML = '<div class="loot-error">Failed to load loot</div>';
          }
        }
      });
    }
  }

  async function fetchMonsterLoot(monsterId) {
    // This function is now deprecated in favor of fetchMonsterLootByType
    // Kept for backward compatibility, but should not be used
    console.warn('fetchMonsterLoot is deprecated, use fetchMonsterLootByType instead');
    
    try {
      const response = await fetch(`battle.php?id=${monsterId}`);
      const html = await response.text();
      const lootData = parseLootFromBattlePage(html);
      displayLootPreview(monsterId, lootData);
    } catch (error) {
      console.error('Error fetching monster loot:', error);
      const grid = document.getElementById(`loot-grid-${monsterId}`);
      if (grid) {
        grid.innerHTML = '<div class="loot-error">Failed to load loot</div>';
      }
    }
  }

  function parseLootFromBattlePage(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Look for the loot panel - the one containing "🎁 Possible Loot"
    let lootContainer = null;
    
    // Find the panel that contains "Possible Loot" text
    const panels = doc.querySelectorAll('.panel');
    for (let panel of panels) {
      const strongText = panel.querySelector('strong');
      if (strongText && strongText.textContent.includes('Possible Loot')) {
        lootContainer = panel.querySelector('.loot-grid');
        break;
      }
    }
    
    if (!lootContainer) {
      // Fallback: try to find .loot-grid directly
      lootContainer = doc.querySelector('.loot-grid');
    }
    
    if (!lootContainer) {
      return [];
    }
    
    const lootCards = lootContainer.querySelectorAll('.loot-card');
    
    return parseLootCards(lootCards);
  }

  function parseLootCards(lootCards) {
    const lootData = [];

    const parseRequirementValue = (text) => {
      if (!text) return null;
      const match = text.match(/([\d,.]+)/);
      if (!match) return null;
      const cleaned = match[1].replace(/[^\d]/g, '');
      return cleaned ? Number(cleaned) : null;
    };

    lootCards.forEach(card => {
      const img = card.querySelector('img');
      const name = card.querySelector('.loot-name');
      const stats = card.querySelectorAll('.loot-stats .chip, .chip');

      if (img && name) {
        let dropRate = '';
        let tier = 'common';
        let requirementText = '';
        let requirementValue = null;
        let requirementType = null;

        stats.forEach(stat => {
          const text = (stat.textContent || '').trim();
          if (!text) return;

          if (text.toLowerCase().includes('drop:')) {
            dropRate = text.replace(/drop:/i, '').trim();
          }

          // Check for tier classes
          if (stat.classList.contains('legendary')) tier = 'legendary';
          else if (stat.classList.contains('epic')) tier = 'epic';
          else if (stat.classList.contains('rare')) tier = 'rare';
          else if (stat.classList.contains('common')) tier = 'common';

          // Also check for tier in text content
          const lowerText = text.toLowerCase();
          if (lowerText.includes('legendary')) tier = 'legendary';
          else if (lowerText.includes('epic')) tier = 'epic';
          else if (lowerText.includes('rare')) tier = 'rare';

          if (!requirementText && /req/i.test(text)) {
            requirementText = text;
            if (/dmg/i.test(text) || /damage/i.test(text)) {
              requirementType = 'damage';
              requirementValue = parseRequirementValue(text);
            }
          }
        });

        if (!requirementText) {
          const requirementNode = card.querySelector('[class*="require"], .loot-requirement');
          if (requirementNode) {
            requirementText = requirementNode.textContent.trim();
          }
        }

        const itemData = {
          name: name.textContent.trim(),
          image: img.src,
          dropRate: dropRate,
          tier: tier,
          requirement: requirementText ? {
            text: requirementText,
            value: requirementValue,
            type: requirementType
          } : null
        };

        lootData.push(itemData);
      }
    });

    return lootData;
  }

  function displayLootPreview(monsterId, lootData, options = {}) {
    // Support both card and modal loot preview containers
    const grid = document.getElementById(`loot-grid-${monsterId}`) || document.getElementById(`loot-grid-modal-${monsterId}`);
    if (!grid) return;

    if (lootData.length === 0) {
      grid.innerHTML = '<div class="loot-error">No loot data found</div>';
      return;
    }

    const normalizeId = (id) => String(id).replace(/^modal-/, '');
    const parseNumericValue = (value) => {
      if (value === undefined || value === null) return null;
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      const str = String(value).trim();
      if (!str) return null;
      const cleaned = str.replace(/[^\d]/g, '');
      return cleaned ? Number(cleaned) : null;
    };
    const formatNumber = (value) => Number(value).toLocaleString('en-US');

    const cleanRequirementLabel = (text) => {
      if (!text) return '';
      const cleaned = text.replace(/^\s*DMG\s*(?:req|requirement)\s*:?-?\s*/i, '').trim();
      return cleaned || text.trim();
    };

    const cardId = normalizeId(monsterId);
    const cardElement = document.querySelector(`.monster-card[data-monster-id="${cardId}"]`);
    const cardDamageSource = cardElement?.dataset?.yourDamage || cardElement?.querySelector('.monster-overlay .damage')?.textContent;
    let userDamage = parseNumericValue(options?.damageDone);
    if (userDamage === null) {
      userDamage = parseNumericValue(cardDamageSource);
    }

    const isModalGrid = grid.id.startsWith('loot-grid-modal-');
    if (userDamage === null && isModalGrid) {
      const modalDamageText = document.getElementById('modal-your-damage')?.textContent;
      userDamage = parseNumericValue(modalDamageText);
    }

    const lootHTML = lootData.map(item => {
      const requirement = item.requirement || null;
      const meetsRequirement = requirement && requirement.type === 'damage' && requirement.value !== null && userDamage !== null && userDamage >= requirement.value;
      const progressText = (requirement && requirement.type === 'damage' && requirement.value && userDamage !== null)
        ? `${formatNumber(userDamage)} / ${formatNumber(requirement.value)}`
        : '';
      const requirementClass = requirement ? `loot-requirement ${!isModalGrid ? 'small-grid' : ''} ${meetsRequirement ? 'met' : ''}` : '';
      const requirementLabel = requirement ? cleanRequirementLabel(requirement.text || '') : '';
      const requirementHtml = requirement ? `
        <div class="${requirementClass.trim()}">
          <span>${requirementLabel}</span>
        </div>
      ` : '';
      const thumbHtml = `
        <div class="loot-preview-thumb">
          <img src="${item.image}" alt="${item.name}">
          <div class="tier-indicator ${item.tier}"></div>
          <div class="drop-rate">${item.dropRate}</div>
        </div>
      `;
      const itemClasses = ['loot-preview-item'];
      if (meetsRequirement) itemClasses.push('requirement-met');
      return `
        <div class="${itemClasses.join(' ')}" title="${item.name}">
          ${thumbHtml}
          ${requirementHtml}
        </div>
      `;
    }).join('');

    grid.innerHTML = lootHTML;

    if (lootData.length < 5) {
      const lootContainer = grid.parentElement;
      if (lootContainer && lootContainer.classList.contains('loot-preview-container')) {
        const missingRows = lootData.length <= 4 ? 1 : 0;
        const extraSpace = missingRows * 64; // height of one row of loot items
        lootContainer.style.marginBottom = `${extraSpace}px`;
      }
    }
  }

  // Page initialization functions
  function initWaveMods() {
    initGateCollapse();                  
    initMonsterFilter();      
    initContinueBattleFirst();   
    initImprovedWaveButtons();   
    initMonsterStatOverlay();    
    initContinueDamageTracking();
    initMonsterLootPreview(); 
    initMonsterSorting();      
    loadInstaLoot();             
    initContinueBattleModal();   
    // Pre-index cards during idle time so first filter is instant
    const idle = window.requestIdleCallback || function(fn){ return setTimeout(fn, 120); };
    idle(() => {
      try { ensureMonsterIndex(true, true); } catch (e) { /* no-op */ }
    });
    // Reset cached state when cards change
    try {
      const container = document.querySelector('.monster-container') || document.body;
      const obs = new MutationObserver(() => { _lastFilterState = null; });
      obs.observe(container, { childList: true, subtree: true });
    } catch { /* ignore */ }
  }

  function initHighlightSideButton() {
    const current = new URLSearchParams(window.location.search).get('gate');
    if (!current) return;

    const maxAttempts = 6;
    const delayMs = 250;

    const tryFind = (attempt = 0) => {
      let foundAnchor = null;
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      for (const a of anchors) {
        try {
          const raw = a.getAttribute('href');
          if (!raw) continue;
          const url = new URL(raw, location.origin);
          const pathname = url.pathname || '';
          const gateParam = url.searchParams.get('gate');
          if ((pathname.endsWith('/active_wave.php') || pathname.endsWith('active_wave.php')) && gateParam === current) {
            foundAnchor = a;
            break;
          }
        } catch (err) {
          const raw = a.getAttribute('href') || '';
          if (raw.includes('active_wave.php') && raw.includes(`gate=${current}`)) {
            foundAnchor = a;
            break;
          }
        }
      }

      console.log('Highlighting side nav button for gate:', current, 'attempt', attempt, 'found:', !!foundAnchor);
      console.log(foundAnchor);
      console.log(anchors);
      console.log(window.location.href);
      console.log(document.referrer);
      console.log(anchors.map(a => a.href));
      console.log(anchors.map(a => a.textContent));
      

      if (foundAnchor) {
        try { foundAnchor.classList.add('side-nav-item', 'active'); } catch (e) {
          console.error('Failed to highlight side nav button:', e);
         }
        return;
      }

      if (attempt + 1 < maxAttempts) {
        setTimeout(() => tryFind(attempt + 1), delayMs);
      }
    };

    // Start attempts
    tryFind(0);
  }

  function initMonsterStatOverlay() {

    // Dynamically move ATK/DEF indicators to overlay above monster image
    document.querySelectorAll('.monster-card').forEach(function(card) {
      // Find the ATK/DEF stat row
      var statRows = card.querySelectorAll('.stat-row');
      var atkDefRow = null;
      statRows.forEach(function(row) {
        var icon = row.querySelector('.stat-icon');
        if (icon && icon.classList.contains('atk')) {
          atkDefRow = row;
        }
      });
      if (!atkDefRow) return;

      // Extract ATK and DEF values
      var atkChip = atkDefRow.querySelector('.atk-chip');
      var defChip = atkDefRow.querySelector('.def-chip');
      var atk = atkChip ? atkChip.textContent.replace(/[^\d]/g, '') : '';
      var def = defChip ? defChip.textContent.replace(/[^\d]/g, '') : '';

      // Remove the original ATK/DEF row
      atkDefRow.parentNode.removeChild(atkDefRow);

      // Create overlay div
      var overlay = document.createElement('div');
      overlay.className = 'monster-overlay';
      overlay.innerHTML =
        '<span class="atk">' + (atk || '0') + '</span>' +
        '<span class="def">' + (def || '0') + '</span>';

      // Insert overlay before the monster image
      var img = card.querySelector('.monster-img');
      if (img) {
        card.insertBefore(overlay, img);
      }
    });

    // Inject CSS for overlay if not present
    if (!document.getElementById('monster-overlay-style')) {
      var style = document.createElement('style');
      style.id = 'monster-overlay-style';
      style.textContent = `
        .monster-card { position: relative; }
        .monster-overlay {
          position: absolute;
          top: 20px;
          left: 20px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          max-width: calc(100% - 40px);
          z-index: 2;
        }
        body.monster-images-hidden .monster-img {
          display: none !important;
        }

        body.monster-images-hidden .monster-overlay {
          position: relative;
          top: 0;
          left: 0;
          margin: 0 0 8px;
        }
        .monster-overlay .atk,
        .monster-overlay .def,
        .monster-overlay .players,
        .monster-overlay .damage {
          background: rgba(0,0,0,0.7);
          color: #fff;
          border-radius: 6px;
          padding: 2px 8px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .monster-overlay .atk::before {
          content: "⚔";
          margin-right: 4px;
        }
        .monster-overlay .def::before {
          content: "🛡";
          margin-right: 4px;
        }
        .monster-overlay .players::before {
          content: "👥";
          margin-right: 4px;
        }
        .monster-overlay .damage::before {
          content: "💥";
          margin-right: 4px;
        }
      `;
      document.head.appendChild(style);
    }
  }

  function initPvPHistoryCollapse() {
    // Find the battle history card that contains the muted text about finished matches
    const historyCard = Array.from(document.querySelectorAll('.card')).find(card => 
      card.textContent.includes('Your last 20 finished matches')
    );
    if (!historyCard) return;

    // Get or create a container for the header
    let headerContainer = historyCard.querySelector('.history-header');
    if (!headerContainer) {
      headerContainer = document.createElement('div');
      headerContainer.className = 'history-header';
      headerContainer.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px;
        margin-bottom: 8px;
        border-radius: 4px;
        background: #1c2230;
      `;
      
      // Move the existing muted text into our header
      const mutedText = historyCard.querySelector('.muted');
      if (mutedText) {
        mutedText.style.margin = '0';
        headerContainer.appendChild(mutedText);
      }
      
      // Insert the header at the top of the card
      historyCard.insertBefore(headerContainer, historyCard.firstChild);
    }

    // Create collapse button with improved styling
    const collapseBtn = document.createElement('button');
    collapseBtn.innerHTML = '▼';
    collapseBtn.style.cssText = `
      background: #2a354b;
      border: 1px solid #45475a;
      color: #cdd6f4;
      font-size: 14px;
      cursor: pointer;
      padding: 4px 12px;
      border-radius: 4px;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 30px;
    `;

    // Add button to header
    headerContainer.appendChild(collapseBtn);

    // Get the table to collapse
    const table = historyCard.querySelector('.table');
    if (!table) return;

    // Create a wrapper for the table to handle collapse animation
    const tableWrapper = document.createElement('div');
    tableWrapper.style.cssText = `
      transition: max-height 0.3s ease-out;
      overflow: hidden;
    `;
    table.parentNode.insertBefore(tableWrapper, table);
    tableWrapper.appendChild(table);
    tableWrapper.style.maxHeight = table.scrollHeight + 'px';

    // Store collapse state in extension settings
    if (typeof extensionSettings.pvpHistoryCollapsed === 'undefined') {
      extensionSettings.pvpHistoryCollapsed = false;
      saveSettings();
    }

    // Apply initial state
    if (extensionSettings.pvpHistoryCollapsed) {
      tableWrapper.style.maxHeight = '0';
      collapseBtn.style.transform = 'rotate(-90deg)';
    }

    // Add click handler
    collapseBtn.addEventListener('click', () => {
      const isCollapsed = tableWrapper.style.maxHeight === '0px';
      tableWrapper.style.maxHeight = isCollapsed ? table.scrollHeight + 'px' : '0';
      collapseBtn.style.transform = isCollapsed ? '' : 'rotate(-90deg)';
      collapseBtn.style.backgroundColor = isCollapsed ? '#2a354b' : '#45475a';
      extensionSettings.pvpHistoryCollapsed = !isCollapsed;
      saveSettings();
    });
  }

  function initPvPMods(){
    initPvPBannerFix();
    
    // Initialize prediction and/or auto-surrender based on settings
    if (extensionSettings.pvpBattlePrediction.enabled || extensionSettings.pvpAutoSurrender.enabled) {
      // Create prediction box if prediction is enabled
      if (extensionSettings.pvpBattlePrediction.enabled) {
        createPredictionBox();
      }
      
      // Initialize the system if either feature is enabled
      initPvPAutoSurrender();
    }
    
    // Add battle highlighting
    highlightPvpBattles();
    // Make history collapsible
    initPvPHistoryCollapse();
    // Observe table for changes
    const table = document.querySelector('.table');
    if (table) {
      const observer = new MutationObserver(() => {
        highlightPvpBattles();
      });
      observer.observe(table, { childList: true, subtree: true });
    }
  }

  function initPvPBattleMods(){
    initAutoSlash()
  }

  function initDashboardTools() {
    console.log("Initializing dashboard tools");
    removeDashboardClutter();
  }

  function removeDashboardClutter() {
    // Remove "User Dashboard" h1
    const h1Elements = document.querySelectorAll('h1');
    h1Elements.forEach(h1 => {
      if (h1.textContent.includes('User Dashboard') || h1.textContent.includes('🏠')) {
        h1.remove();
      }
    });

    // Remove "How to Play" section
    const howtoInfo = document.querySelector('.howto-info');
    if (howtoInfo) {
      howtoInfo.remove();
    }

    // Remove password reset message
    const h3Elements = document.querySelectorAll('h3');
    h3Elements.forEach(h3 => {
      if (h3.textContent.includes('forgot your password') || h3.textContent.includes('demonicscans@proton.me')) {
        h3.remove();
      }
    });
  }

  function initBattleLayoutSideBySide() {
    // First, forcefully convert any loot panels to loot-panel class
    var lootPanels = document.querySelectorAll('.panel');
    lootPanels.forEach(function(panel) {
      var strongElement = panel.querySelector('strong');
      if (strongElement && strongElement.textContent.includes('🎁 Possible Loot')) {
        panel.className = 'panel loot-panel';
        console.log('Converted loot panel to loot-panel class');
      }
    });
    
    // Get the leaderboard and log panels
    var leaderboardPanel = document.querySelector('.panel.leaderboard-panel');
    var logPanel = document.querySelector('.panel.log-panel');
    
    // If panels don't exist, exit
    if (!leaderboardPanel || !logPanel) {
      console.log('Leaderboard or log panel not found');
      return;
    }
    
    // Get the parent element that contains both panels
    var parentElement = leaderboardPanel.parentElement;
    
    // Remove any loot panels from the parent
    var lootPanel = document.querySelector('.loot-panel');
    if (lootPanel) {
      parentElement.removeChild(lootPanel);
      console.log('Removed loot panel from parent');
    }
    
    // Create container for side-by-side layout
    var container = document.createElement('div');
    container.style.cssText = `display: flex; gap: 20px; align-items: flex-start;`;
    
    // Style adjustments for better side-by-side display
    leaderboardPanel.style.cssText += `flex: 1; min-width: 400px;`;
    logPanel.style.cssText += `flex: 1; min-width: 400px; max-height: 500px; overflow-y: auto;`;
    
    // Remove both panels from their current parent
    parentElement.removeChild(leaderboardPanel);
    parentElement.removeChild(logPanel);
    
    // Add both panels to the new container
    container.appendChild(leaderboardPanel);
    container.appendChild(logPanel);
    
    // Insert the container into the parent element
    parentElement.appendChild(container);
  }

  function initBattleMods(){
    //initReducedImageSize();
    initTotalOwnDamage();
    updateBattlePage();
    //initAnyClickClosesModal();
    //addBattleHideImagesToggle();
    //initBattleLayoutSideBySide();

    // Initialize battle modal if enabled
    if (extensionSettings.battleModal.enabled) {
      initBattlePageModal();
    }

    // Apply initial monster backgrounds
    applyMonsterBackgrounds();
    applyLootPanelColors();

    // Initialize leaderboard highlighting (slightly quicker)
    setTimeout(() => {
      highlightCurrentUserInLeaderboard();
    }, 300);

    // Set up observer for panel changes
    const observer = new MutationObserver(() => {
      applyMonsterBackgrounds();
      applyLootPanelColors();
      highlightCurrentUserInLeaderboard();
    });

    // Observe the container that holds panels
    const container = document.querySelector('.container, #content');
    if (container) {
      observer.observe(container, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  }

  function updateBattlePage(){
    // Remove the loot panel containing '🎁 Possible Loot'
    const lootPanels = document.querySelectorAll('.panel');
    lootPanels.forEach(panel => {
      const strong = panel.querySelector('strong');
      if (strong && strong.textContent.includes('🎁 Possible Loot')) {
        panel.parentNode.removeChild(panel);
      }
    });
      // Move loot button into .battle-actions-card after .battle-actions-head
      const lootButton = document.getElementById('loot-button');
      const actionsCard = document.querySelector('.battle-actions-card');
      const actionsHead = actionsCard ? actionsCard.querySelector('.battle-actions-head') : null;
      if (lootButton && actionsCard && actionsHead) {
        if (!actionsCard.contains(lootButton)) {
          actionsHead.insertAdjacentElement('afterend', lootButton);
        }
      }
    // Update log-panel width
    const style = document.createElement('style');
    style.textContent = `
      .log-panel {
        width: 100% !important;
      }
    `;
    document.head.appendChild(style);
    // Move .battle-grid below .panel.log-panel
    const logPanel = document.querySelector('.panel.log-panel');
    const battleGrid = document.querySelector('.battle-grid');
    if (logPanel && battleGrid) {
      logPanel.parentNode.insertBefore(battleGrid, logPanel.nextSibling);
    }

    // Move warning chip above log-panel if present
    if (logPanel) {
      const chips = Array.from(document.querySelectorAll('.chip'));
      const warningChip = chips.find(chip => chip.textContent.trim().includes("You're above this monster’s reward cap"));
      if (warningChip && warningChip.parentNode !== logPanel.parentNode) {
        logPanel.parentNode.insertBefore(warningChip, logPanel);
      }
    }

    // Move .battle-card.monster-card below monster image inside .panel.log-panel
    if (logPanel) {
      const monsterImage = logPanel.querySelector('img.monster_image');
      const monsterCard = document.querySelector('.battle-card.monster-card');
      if (monsterImage && monsterCard) {
        monsterImage.parentNode.insertBefore(monsterCard, monsterImage.nextSibling);
      }
      // Remove <div class="card-sub">HP ...</div> from logPanel
      const cardSubDiv = logPanel.querySelector('div.card-sub');
      if (cardSubDiv && cardSubDiv.parentNode) {
        cardSubDiv.parentNode.removeChild(cardSubDiv);
      }

      // Add stat-line to the right of monster image
      const statLine = document.querySelector('.stat-line');
      if (monsterImage && statLine) {
        // Create a flex container if not already present
        let flexWrap = monsterImage.parentNode;
        if (!flexWrap.classList.contains('monster-flex-wrap')) {
          const wrapper = document.createElement('div');
          wrapper.style.display = 'flex';
          wrapper.style.alignItems = 'flex-start';
          wrapper.className = 'monster-flex-wrap';
          monsterImage.parentNode.insertBefore(wrapper, monsterImage);
          wrapper.appendChild(monsterImage);
          flexWrap = wrapper;
        }
        // Move stat-line to the right of the image
        flexWrap.appendChild(statLine);
        // Remove <div class="eyebrow">Monster</div>
        const monsterEyebrow = Array.from(document.querySelectorAll('.eyebrow')).find(e => e.textContent.trim() === 'Monster');
        if (monsterEyebrow && monsterEyebrow.parentNode) {
          monsterEyebrow.parentNode.removeChild(monsterEyebrow);
        }
        // Remove <div><strong>📜 Attack Log</strong></div> from logPanel
        const logStrongDiv = Array.from(logPanel.querySelectorAll('div')).find(div => {
          const strong = div.querySelector('strong');
          return strong && strong.textContent.trim() === '📜 Attack Log';
        });
        if (logStrongDiv && logStrongDiv.parentNode) {
          logStrongDiv.parentNode.removeChild(logStrongDiv);
        }
      }
      // Ensure .stat-line has margin-top: 14px
      const statLineStyle = document.createElement('style');
      statLineStyle.textContent = `
        .stat-line {
          margin-top: 14px !important;
          margin-left: 16px !important;
        }
        .stat-block {
          min-width: 100px !important;
        }
        .battle-grid {
          display: block !important;
        }
        .battle-card {
          display: block !important;
        }
      `;
      document.head.appendChild(statLineStyle);
      // Move only the attack log to a battle card next to the leaderboard panel
      const leaderboardPanel2 = document.querySelector('.leaderboard-panel');
      let logPanel2 = document.querySelector('.log-panel');
      if (leaderboardPanel2 && logPanel2) {
        // Find the <br> node that starts the log
        let brNode = Array.from(logPanel2.childNodes).find(n => n.nodeName === 'BR');
        if (brNode) {
          // Collect all nodes after <br>
          let logNodes = [];
          let next = brNode.nextSibling;
          while (next) {
            logNodes.push(next);
            next = next.nextSibling;
          }
          // Remove these nodes from logPanel
          logNodes.forEach(n => logPanel2.removeChild(n));
          // Remove the <br> itself
          logPanel2.removeChild(brNode);
          // Create a new battle card for the log
          let logBattleCard = document.createElement('div');
          logBattleCard.className = 'battle-card log-battle-card';
          logNodes.forEach(n => logBattleCard.appendChild(n));

          // Create a flex container for side-by-side layout
          let flexContainer = leaderboardPanel2.parentNode;
          if (!flexContainer.classList.contains('side-by-side-wrap')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'side-by-side-wrap';
            wrapper.style.display = 'flex';
            wrapper.style.gap = '20px';
            wrapper.style.alignItems = 'flex-start';
            flexContainer.insertBefore(wrapper, leaderboardPanel2);
            wrapper.appendChild(leaderboardPanel2);
            flexContainer = wrapper;
          }
          // Add the log battle card next to leaderboard
          flexContainer.appendChild(logBattleCard);
        }
      }
      // Rename log-panel to main-panel and remove log-panel CSS
      if (logPanel) {
        logPanel.classList.remove('log-panel');
        logPanel.classList.add('main-panel');
      }
      // new invisible log panel to find later
      const invisibleLogPanel = document.createElement('div');
      invisibleLogPanel.className = 'panel log-panel';
      invisibleLogPanel.style.display = 'none';
      logPanel.parentNode.appendChild(invisibleLogPanel);
      // update the battle-card log-battle-card when attacks happen
      const battleObserver = new MutationObserver(() => {
        const logBattleCard = document.querySelector('.battle-card.log-battle-card');
        if (logBattleCard) {
          // Clear existing content
          logBattleCard.innerHTML = '';
          // Find the invisible log panel
          const invisibleLogPanel = document.querySelector('.panel.log-panel');
          if (invisibleLogPanel) {
            // Find the <br> node that starts the log
            let brNode = Array.from(invisibleLogPanel.childNodes).find(n => n.nodeName === 'BR');
            if (brNode) {
              // Collect all nodes after <br>
              let logNodes = [];
              let next = brNode.nextSibling;
              while (next) {
                logNodes.push(next);
                next = next.nextSibling;
              }
              // Append these nodes to the log battle card
              logNodes.forEach(n => logBattleCard.appendChild(n.cloneNode(true)));
            }
          }
        }
      });
      battleObserver.observe(invisibleLogPanel, { childList: true, subtree: true });
    }
  }

  function initChatMods(){
      const logEl = document.getElementById("chatLog");
      if (logEl) {
        logEl.scrollTop = logEl.scrollHeight;
      }
      createBackToDashboardButton();
      removeOriginalBackButton();
  }

  // ===== EQUIPMENT SORT & FILTER SYSTEM =====
  
  function initEquipmentSortFilter() {
    // Find the equipment section
    const sections = document.querySelectorAll('.section');
    let equipmentSection = null;
    
    for (const section of sections) {
      const title = section.querySelector('.section-title');
      if (title && title.textContent.includes('Equipment')) {
        equipmentSection = section;
        break;
      }
    }
    
    if (!equipmentSection) return;
    
    const grid = equipmentSection.querySelector('.grid');
    if (!grid) return;
    
    // Create sort/filter controls
    const controlsDiv = document.createElement('div');
    controlsDiv.id = 'equipment-controls';
    controlsDiv.style.cssText = `
      background: rgba(30, 30, 46, 0.8);
      border: 1px solid rgba(43, 46, 73, 0.6);
      border-radius: 10px;
      padding: 15px;
      margin-bottom: 15px;
      backdrop-filter: blur(10px);
    `;
    
    controlsDiv.innerHTML = `
      <div style="display: flex; gap: 15px; flex-wrap: wrap; align-items: center;">
        <div style="flex: 1; min-width: 200px;">
          <label style="display: block; color: #f9e2af; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
            Sort By:
          </label>
          <select id="equipment-sort" style="width: 100%; padding: 8px; background: rgba(20, 20, 26, 0.7); border: 1px solid rgba(51, 51, 51, 0.5); border-radius: 6px; color: #fff; font-size: 13px;">
            <option value="default">Default Order</option>
            <option value="atk-desc">Highest ATK</option>
            <option value="def-desc">Highest DEF</option>
            <option value="combined-desc">Highest Combined (ATK+DEF)</option>
            <option value="atk-asc">Lowest ATK</option>
            <option value="def-asc">Lowest DEF</option>
            <option value="combined-asc">Lowest Combined (ATK+DEF)</option>
          </select>
        </div>
        
        <div style="flex: 1; min-width: 200px;">
          <label style="display: block; color: #f9e2af; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
            Filter By Type:
          </label>
          <select id="equipment-filter" style="width: 100%; padding: 8px; background: rgba(20, 20, 26, 0.7); border: 1px solid rgba(51, 51, 51, 0.5); border-radius: 6px; color: #fff; font-size: 13px;">
            <option value="all">All Types</option>
            <option value="weapon">Weapon</option>
            <option value="helmet">Helmet</option>
            <option value="armor">Armor</option>
            <option value="gloves">Gloves</option>
            <option value="boots">Boots</option>
            <option value="amulet">Amulet</option>
            <option value="ring">Ring</option>
          </select>
        </div>
        
        <div style="flex: 0;">
          <label style="display: block; color: transparent; font-weight: bold; margin-bottom: 8px; font-size: 14px;">
            &nbsp;
          </label>
          <button id="equipment-reset" style="padding: 8px 16px; background: linear-gradient(135deg, #f38ba8 0%, #eba0ac 100%); color: #1e1e2e; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; transition: all 0.2s ease;">
            Reset
          </button>
        </div>
      </div>
    `;
    
    // Insert controls before the grid
    equipmentSection.insertBefore(controlsDiv, grid);
    
    // Parse equipment items
    function parseEquipmentItem(slotBox) {
      const equipBtn = slotBox.querySelector('button[onclick^="showEquipModal"]');
      if (!equipBtn) return null;
      
      const onclick = equipBtn.getAttribute('onclick');
      const match = onclick.match(/showEquipModal\(\s*\d+\s*,\s*['"]([^'"]+)['"]/);
      const type = match ? match[1].toLowerCase() : null;
      
      const label = slotBox.querySelector('.label');
      if (!label) return null;
      
      const statsText = label.textContent;
      const atkMatch = statsText.match(/(\d+)\s*ATK/);
      const defMatch = statsText.match(/(\d+)\s*DEF/);
      
      const atk = atkMatch ? parseInt(atkMatch[1]) : 0;
      const def = defMatch ? parseInt(defMatch[1]) : 0;
      const combined = atk + def;
      
      return {
        element: slotBox,
        type: type,
        atk: atk,
        def: def,
        combined: combined
      };
    }
    
    // Get all equipment items
    const allItems = Array.from(grid.querySelectorAll('.slot-box'))
      .map(parseEquipmentItem)
      .filter(item => item !== null);
    
    // Store original order
    const originalOrder = allItems.map(item => item.element);
    
    // Apply sort and filter
    function applySortFilter() {
      const sortValue = document.getElementById('equipment-sort').value;
      const filterValue = document.getElementById('equipment-filter').value;
      
      // Filter items
      let filteredItems = allItems.filter(item => {
        if (filterValue === 'all') return true;
        // Handle ring1 and ring2 types as 'ring'
        const itemType = item.type === 'ring1' || item.type === 'ring2' ? 'ring' : item.type;
        return itemType === filterValue;
      });
      
      // Sort items
      let sortedItems = [...filteredItems];
      
      switch (sortValue) {
        case 'atk-desc':
          sortedItems.sort((a, b) => b.atk - a.atk);
          break;
        case 'atk-asc':
          sortedItems.sort((a, b) => a.atk - b.atk);
          break;
        case 'def-desc':
          sortedItems.sort((a, b) => b.def - a.def);
          break;
        case 'def-asc':
          sortedItems.sort((a, b) => a.def - b.def);
          break;
        case 'combined-desc':
          sortedItems.sort((a, b) => b.combined - a.combined);
          break;
        case 'combined-asc':
          sortedItems.sort((a, b) => a.combined - b.combined);
          break;
        case 'default':
          // Restore original order for filtered items
          sortedItems.sort((a, b) => {
            return originalOrder.indexOf(a.element) - originalOrder.indexOf(b.element);
          });
          break;
      }
      
      // Clear grid
      grid.innerHTML = '';
      
      // Add sorted/filtered items back
      if (sortedItems.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.cssText = 'text-align: center; color: #a6adc8; padding: 40px; font-size: 14px; grid-column: 1 / -1;';
        emptyMsg.textContent = '🔍 No equipment found matching the selected filter';
        grid.appendChild(emptyMsg);
      } else {
        sortedItems.forEach(item => {
          grid.appendChild(item.element);
        });
      }
    }
    
    // Add event listeners
    document.getElementById('equipment-sort').addEventListener('change', applySortFilter);
    document.getElementById('equipment-filter').addEventListener('change', applySortFilter);
    document.getElementById('equipment-reset').addEventListener('click', () => {
      document.getElementById('equipment-sort').value = 'default';
      document.getElementById('equipment-filter').value = 'all';
      applySortFilter();
    });
    
    // Add hover effects
    const resetBtn = document.getElementById('equipment-reset');
    resetBtn.addEventListener('mouseenter', () => {
      resetBtn.style.transform = 'translateY(-1px)';
      resetBtn.style.filter = 'brightness(1.05)';
    });
    resetBtn.addEventListener('mouseleave', () => {
      resetBtn.style.transform = 'translateY(0)';
      resetBtn.style.filter = 'brightness(1)';
    });
  }
  
  // ===== END EQUIPMENT SORT & FILTER SYSTEM =====

  function initInventoryMods(){
    initAlternativeInventoryView()
    initItemTotalDmg()
    addInventoryQuickAccessButtons()
    createBackToDashboardButton()
    removeOriginalBackButton()
    initializeEquipmentSets()
    initEquipmentSortFilter()
    applyCustomBackgrounds()
  }

  function initMerchantMods() {
    addMerchantQuickAccessButtons()
      applyCustomBackgrounds()
  }

  function initCollectionsMods() {
    addCollectionsDivider()
    applyCustomBackgrounds()
  }

  function initAchievementsMods() {
    addAchievementsDivider()
    applyCustomBackgrounds()
  }

  function initBattlePassMods() {
    // Move battle pass hero to content area and reduce margin
    const contentArea = document.querySelector('.content-area');
    const bpHero = document.querySelector('.bp-hero');
    
    if (bpHero && contentArea) {
      bpHero.style.marginTop = "0px";
      contentArea.prepend(bpHero);
      
      // Remove any extra br tags
      const br = document.querySelector('br');
      if (br) br.remove();
    }
    
    applyCustomBackgrounds();
  }

  // NEW: Define initDungeonLocationMods to fix the ReferenceError
  function initDungeonLocationMods() {
    initDungeonPageTransformation();
  }

  // ===== ADVANCED PET TEAMS SYSTEM =====

  // Pet teams utility functions
  function getPetStorageTeams() {
    try {
      return JSON.parse(localStorage.getItem(PET_STORAGE_KEY) || '{}');
    } catch (error) {
      console.error('Error loading pet teams:', error);
      return {};
    }
  }

  function savePetStorageTeams(obj) {
    try {
      localStorage.setItem(PET_STORAGE_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error('Error saving pet teams:', error);
    }
  }

  function showPetNotification(msg, type = "info") {
    const colors = { info: '#89b4fa', success: '#a6e3a1', error: '#f38ba8' };
    showNotification(msg, colors[type] || colors.info);
  }

  // Pet teams integrated UI builder
  function addPetTeamsToPage() {
    if (document.getElementById('integrated-pet-teams')) return;
    
    const container = document.querySelector('.section');
    if (!container) return;
    
    const savedCollapseState = localStorage.getItem('petTeamsCollapsed');
    const isCollapsed = savedCollapseState === null ? true : savedCollapseState === 'true';
    
    const contentStyles = isCollapsed
      ? 'transition: opacity 0.15s ease, max-height 0.15s ease, margin-top 0.15s ease; overflow: hidden; max-height: 0px; opacity: 0; margin-top: 0px;'
      : 'transition: opacity 0.15s ease, max-height 0.15s ease, margin-top 0.15s ease; overflow: hidden; max-height: 1000px; opacity: 1; margin-top: 15px;';
    
    const toggleStyles = isCollapsed
      ? 'font-size: 16px; color: #89b4fa; transition: transform 0.3s ease; transform: rotate(-90deg);'
      : 'font-size: 16px; color: #89b4fa; transition: transform 0.3s ease;';
    
    const toggleIcon = isCollapsed ? '▶' : '▼';
    
    const petTeamsPanel = document.createElement('div');
    petTeamsPanel.id = 'integrated-pet-teams';
    petTeamsPanel.style.cssText = 'background: #1e1e2e; border: 2px solid #89b4fa; border-radius: 12px; padding: 20px; margin: 20px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.3);';
    
    petTeamsPanel.innerHTML = `
      <div id="pet-teams-header" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;">
        <h3 style="margin: 0; color: #cba6f7; font-size: 20px; display: flex; align-items: center; gap: 10px;">
          <span id="pet-teams-toggle" style="${toggleStyles}">${toggleIcon}</span>
          Pet Teams Manager
        </h3>
      </div>
      
      <div id="pet-teams-content" style="${contentStyles}">
        <div id="pet-recording-section" style="background: #181825; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
          <button id="start-pet-record" style="background: #a6e3a1; color: #1e1e2e; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%; margin-bottom: 10px;">
            Start Recording Pet Team
          </button>
          <div id="pet-preview" style="display: none; margin-top: 10px; padding: 10px; background: #11111b; border-radius: 6px; color: #cdd6f4;"></div>
          <div id="pet-save-section" style="display: none; margin-top: 10px;">
            <input type="text" id="pet-team-name-input" placeholder="Enter team name..." style="width: calc(100% - 120px); padding: 8px; border: 2px solid #89b4fa; border-radius: 6px; background: #11111b; color: #cdd6f4; margin-right: 8px;" />
            <button id="save-pet-team-btn" style="background: #89b4fa; color: #1e1e2e; border: none; padding-top: 10px;padding: 8px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">Save Team</button>
          </div>
        </div>
        
        <div id="integrated-pet-teams-list" style="display: grid; gap: 10px;"></div>
      </div>
    `;
    
    container.insertBefore(petTeamsPanel, container.firstChild);
    
    // Toggle functionality - make the entire header clickable
    document.getElementById('pet-teams-header').addEventListener('click', () => {
      const content = document.getElementById('pet-teams-content');
      const toggle = document.getElementById('pet-teams-toggle');
      const isCurrentlyCollapsed = content.style.maxHeight === '0px';
      
      if (isCurrentlyCollapsed) {
        content.style.maxHeight = '1000px';
        content.style.opacity = '1';
        content.style.marginTop = '15px';
        toggle.style.transform = 'rotate(0deg)';
        toggle.textContent = '▼';
        localStorage.setItem('petTeamsCollapsed', 'false');
      } else {
        content.style.maxHeight = '0px';
        content.style.opacity = '0';
        content.style.marginTop = '0px';
        toggle.style.transform = 'rotate(-90deg)';
        toggle.textContent = '▶';
        localStorage.setItem('petTeamsCollapsed', 'true');
      }
    });
    
    // Add event listeners for recording buttons
    document.getElementById('start-pet-record').addEventListener('click', () => {
      if (isPetRecording) {
        stopPetRecordingSelection();
      } else {
        startPetRecordingSelection();
      }
    });
    
    document.getElementById('save-pet-team-btn').addEventListener('click', () => {
      saveCurrentPetTeam();
    });
    
    loadPetTeams();
  }

  // Apply pet teams with advanced logic
  async function applyAdvancedPetTeam(teamObj) {
    showPetNotification('Applying pet team...', 'info');
    
    try {
      // Get current team from URL (atk, def, or support)
      const urlParams = new URLSearchParams(window.location.search);
      const currentTeam = urlParams.get('team') || 'atk';
      
      // Step 1: Unequip all current pets in slots 1, 2, 3
      for (let slot = 1; slot <= 3; slot++) {
        try {
          const body = `action=unequip_pet&team=${encodeURIComponent(currentTeam)}&slot_id=${slot}`;
          
          const response = await fetch('inventory_ajax.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body,
            credentials: 'include'
          });
          
          const text = await response.text();
          console.log(`Unequip slot ${slot} response:`, text);
          
          if (text.trim() !== 'OK') {
            console.warn(`Unequip slot ${slot} returned: ${text}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.log(`Could not unequip slot ${slot}:`, error);
        }
      }
      
      // Wait a bit for unequip to process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Equip the new pets
      // Sort by slot number to ensure correct order
      const sortedSlots = Object.entries(teamObj).sort((a, b) => a[1].slot - b[1].slot);
      
      for (const [slotKey, petData] of sortedSlots) {
        const petInvId = petData.petInvId;
        const targetSlot = petData.slot; // Should be 1, 2, or 3
        
        if (!petInvId || !targetSlot) {
          console.warn('Missing pet data:', petData);
          continue;
        }
        
        try {
          const body = `action=equip_pet&team=${encodeURIComponent(currentTeam)}&pet_inv_id=${petInvId}&slot_id=${targetSlot}`;
          
          const response = await fetch('inventory_ajax.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body,
            credentials: 'include'
          });
          
          const text = await response.text();
          console.log(`Equip ${petData.name} to slot ${targetSlot} response:`, text);
          
          if (text.trim() !== 'OK') {
            console.warn(`Equip ${petData.name} returned: ${text}`);
          }
          
          // Delay between equipping pets
          await new Promise(resolve => setTimeout(resolve, PET_APPLY_DELAY));
          
        } catch (error) {
          console.error(`Error equipping ${petData.name}:`, error);
        }
      }
      
      showPetNotification('Pet team applied! Reloading...', 'success');
      
      // Reload the page to show the updated pets
      setTimeout(() => {
        window.location.reload();
      }, 250);
      
    } catch (error) {
      console.error('Error applying pet team:', error);
      showPetNotification('Error applying pet team', 'error');
    }
  }

  // Pet teams recording and management
  let currentPetRecord = {};
  let isPetRecording = false;

  // Start recording pet selection
  window.startPetRecordingSelection = function() {
    isPetRecording = true;
    currentPetRecord = {};
    
    const recordBtn = document.getElementById('start-pet-record');
    if (recordBtn) {
      recordBtn.textContent = 'Recording... (Click pets to select)';
      recordBtn.style.background = '#f9e2af';
    }
    
    const preview = document.getElementById('pet-preview');
    const saveSection = document.getElementById('pet-save-section');
    if (preview) preview.style.display = 'block';
    if (saveSection) saveSection.style.display = 'block';
    
    updatePetPreview();
    showPetNotification('Click on pets to add them to your team', 'info');
  };

  function stopPetRecordingSelection() {
    isPetRecording = false;
    
    const recordBtn = document.getElementById('start-pet-record');
    if (recordBtn) {
      recordBtn.textContent = 'Start Recording Pet Team';
      recordBtn.style.background = '#a6e3a1';
    }
    
    // Reset input and button to default state
    const nameInput = document.getElementById('pet-team-name-input');
    const saveBtn = document.getElementById('save-pet-team-btn');
    
    if (nameInput) {
      nameInput.style.display = '';
      nameInput.style.width = 'calc(100% - 120px)';
    }
    
    if (saveBtn) {
      saveBtn.textContent = 'Save Team';
      saveBtn.style.width = '';
    }
    
    // Clear all visual highlights
    const allSlots = document.querySelectorAll('.slot-box');
    allSlots.forEach(slot => {
      slot.style.border = '';
    });
    
    updatePetPreview();
  }

  function updatePetPreview() {
    const preview = document.getElementById('pet-preview');
    if (!preview) return;
    
    const petCount = Object.keys(currentPetRecord).length;
    if (petCount === 0) {
      preview.innerHTML = '<div style="color: #6c7086; text-align: center;">No pets selected yet</div>';
      return;
    }
    
    let html = '<div style="font-weight: bold; margin-bottom: 8px; color: #cba6f7;">Selected Pets:</div>';
    html += '<div style="display: grid; gap: 6px;">';
    
    for (const [slot, petData] of Object.entries(currentPetRecord)) {
      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; background: #1e1e2e; padding: 8px; border-radius: 4px;">
          <span style="color: #a6e3a1;">Slot ${slot}: ${petData.name || 'Pet'}</span>
          <button data-remove-slot="${slot}" style="background: #f38ba8; color: #1e1e2e; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">Remove</button>
        </div>
      `;
    }
    
    html += '</div>';
    preview.innerHTML = html;
    
    // Add event listeners to remove buttons
    preview.querySelectorAll('button[data-remove-slot]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const slot = e.target.getAttribute('data-remove-slot');
        removeFromPetPreview(slot);
      });
    });
  }

  function removeFromPetPreview(slot) {
    delete currentPetRecord[slot];
    updatePetPreview();
    
    // Remove visual highlight from the pet slot
    const allSlots = Array.from(document.querySelectorAll('.slot-box'));
    const slotIndex = parseInt(slot) - 1;
    if (allSlots[slotIndex]) {
      allSlots[slotIndex].style.border = '';
    }
    
    showPetNotification('Pet removed from team', 'info');
  }

  function updateFloatingPetPreview() {
    // Additional floating preview if needed
  }

  window.saveCurrentPetTeam = function() {
    const nameInput = document.getElementById('pet-team-name-input');
    const teamName = nameInput ? nameInput.value.trim() : '';
    
    if (!teamName) {
      showPetNotification('Please enter a team name', 'error');
      return;
    }
    
    const teams = getPetStorageTeams();
    teams[teamName] = currentPetRecord;
    savePetStorageTeams(teams);
    
    // Clear the recording state
    currentPetRecord = {};
    stopPetRecordingSelection();
    
    // Hide preview and save section
    const preview = document.getElementById('pet-preview');
    const saveSection = document.getElementById('pet-save-section');
    if (preview) {
      preview.style.display = 'none';
      preview.innerHTML = '';
    }
    if (saveSection) saveSection.style.display = 'none';
    
    // Clear input and reload teams list
    if (nameInput) nameInput.value = '';
    loadPetTeams();
    
    showPetNotification(`Pet team "${teamName}" saved!`, 'success');
  };

  function loadPetTeams() {
    const listContainer = document.getElementById('integrated-pet-teams-list');
    if (!listContainer) return;
    
    const teams = getPetStorageTeams();
    const teamNames = Object.keys(teams);
    
    if (teamNames.length === 0) {
      listContainer.innerHTML = '<div style="text-align: center; color: #6c7086; padding: 20px;">No pet teams saved yet</div>';
      return;
    }
    
    listContainer.innerHTML = teamNames.map(name => {
      const team = teams[name];
      const pets = Object.values(team).sort((a,b) => (a.slot||0) - (b.slot||0));
      const petCount = pets.length;
      const thumbs = pets.slice(0, 6).map(p => `<img src="${p.image||''}" title="${p.name||''}" style="width:22px;height:22px;border-radius:3px;border:1px solid #45475a;margin-right:3px;object-fit:cover;"/>`).join('');
      
      return `
        <div style="background: #181825; border-radius: 8px; padding: 15px; border: 1px solid #313244;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: bold; color: #cba6f7; margin-bottom: 4px;">${name}</div>
              <div class="pet-team-preview" style="margin:6px 0;">${thumbs}${petCount>6?`<span style=\"color:#6c7086;font-size:12px;\">+${petCount-6} more</span>`:''}</div>
              <div style="font-size: 12px; color: #a6adc8;">${petCount} pet(s)</div>
            </div>
            <div style="display: flex; gap: 6px;">
              <button data-action="apply" data-team="${name}" style="background: #a6e3a1; color: #1e1e2e; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">Apply</button>
              <button data-action="edit" data-team="${name}" style="background: #f9e2af; color: #1e1e2e; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">Edit</button>
              <button data-action="delete" data-team="${name}" style="background: #f38ba8; color: #1e1e2e; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">Delete</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    // Add event listeners to all team buttons
    listContainer.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        const teamName = e.target.getAttribute('data-team');
        
        if (action === 'apply') {
          applyPetTeam(teamName);
        } else if (action === 'edit') {
          editPetTeam(teamName);
        } else if (action === 'delete') {
          deletePetTeam(teamName);
        }
      });
    });
  }
  
  function applyPetTeam(name) {
    const teams = getPetStorageTeams();
    const teamData = teams[name];
    if (teamData) {
      applyAdvancedPetTeam(teamData);
    }
  }

  function deletePetTeam(name) {
    if (!confirm(`Delete pet team "${name}"?`)) return;
    const teams = getPetStorageTeams();
    delete teams[name];
    savePetStorageTeams(teams);
    loadPetTeams();
    showPetNotification(`Pet team "${name}" deleted`, 'success');
  }

  function editPetTeam(name) {
    const teams = getPetStorageTeams();
    const teamData = teams[name];
    if (!teamData) return;
    
    isPetRecording = true;
    currentPetRecord = { ...teamData };
    
    const recordBtn = document.getElementById('start-pet-record');
    if (recordBtn) {
      recordBtn.textContent = `Editing: ${name}`;
      recordBtn.style.background = '#f9e2af';
    }
    
    // Show preview and save section when editing
    const preview = document.getElementById('pet-preview');
    const saveSection = document.getElementById('pet-save-section');
    const nameInput = document.getElementById('pet-team-name-input');
    const saveBtn = document.getElementById('save-pet-team-btn');
    
    if (preview) preview.style.display = 'block';
    if (saveSection) saveSection.style.display = 'block';
    
    // Pre-fill the team name and hide the input
    if (nameInput) {
      nameInput.value = name;
      nameInput.style.display = 'none';
    }
    
    // Change save button text to "Update Team"
    if (saveBtn) {
      saveBtn.textContent = 'Update Team';
      saveBtn.style.width = '100%';
    }
    
    // Highlight the selected pets in the DOM
    document.querySelectorAll('.slot-box').forEach(box => box.style.border = '');
    for (const [slot, petData] of Object.entries(currentPetRecord)) {
      const petBox = document.querySelector(`.slot-box[data-pet-inv-id="${petData.petInvId}"]`);
      if (petBox) petBox.style.border = '3px solid #a6e3a1';
    }
    
    updatePetPreview();
    showPetNotification(`Editing pet team "${name}"`, 'info');
  }

  function initializePetTeams() {
    if (!extensionSettings.petTeams.enabled) return;
    if (window.location.pathname.includes('pets.php')) {
      addPetTeamsToPage();
      setupPetClickDetection();
      // If routed here to edit a team from sidebar, open edit mode
      setTimeout(() => {
        try {
          const pending = localStorage.getItem('petTeamEdit');
          if (pending) {
            editPetTeam(pending);
            localStorage.removeItem('petTeamEdit');
          }
        } catch {}
      }, 600);
    }
  }

  // Setup click detection for pet recording
  function setupPetClickDetection() {
    document.addEventListener('click', (e) => {
      if (!isPetRecording) return;
      
      // Look for pet slot clicks
      const slotBox = e.target.closest('.slot-box');
      if (!slotBox) return;
      
      // Get pet information
      const img = slotBox.querySelector('img');
      if (!img) return;
      
      const petName = img.getAttribute('alt') || 'Unknown Pet';
      const petImage = img.src;
      const petInvId = slotBox.getAttribute('data-pet-inv-id');
      
      // Check if this pet is already recorded (by petInvId)
      let existingSlot = null;
      for (const [slot, petData] of Object.entries(currentPetRecord)) {
        if (petData.petInvId === petInvId) {
          existingSlot = slot;
          break;
        }
      }
      
      // If already selected, remove it
      if (existingSlot) {
        delete currentPetRecord[existingSlot];
        // Remove all green borders and re-apply to remaining pets
        document.querySelectorAll('.slot-box').forEach(box => box.style.border = '');
        
        // Re-highlight remaining selected pets
        for (const [slot, petData] of Object.entries(currentPetRecord)) {
          const petBox = document.querySelector(`.slot-box[data-pet-inv-id="${petData.petInvId}"]`);
          if (petBox) petBox.style.border = '3px solid #a6e3a1';
        }
        
        showPetNotification(`Removed ${petName} from team`, 'info');
        updatePetPreview();
        updateFloatingPetPreview();
        return;
      }
      
      // Check if max 3 pets selected
      const currentCount = Object.keys(currentPetRecord).length;
      if (currentCount >= 3) {
        showPetNotification('Maximum 3 pets allowed. Remove one first.', 'error');
        return;
      }
      
      // Find next available slot (1, 2, or 3)
      let nextSlot = 1;
      while (currentPetRecord[nextSlot] && nextSlot <= 3) {
        nextSlot++;
      }
      
      if (nextSlot > 3) {
        showPetNotification('All slots full', 'error');
        return;
      }
      
      // Add pet to next available slot
      currentPetRecord[nextSlot] = {
        name: petName,
        image: petImage,
        petInvId: petInvId,
        slot: nextSlot
      };
      
      slotBox.style.border = '3px solid #a6e3a1';
      showPetNotification(`Added ${petName} to slot ${nextSlot}`, 'success');
      
      updatePetPreview();
      updateFloatingPetPreview();
    });
  }

  // ===== END ADVANCED PET TEAMS SYSTEM =====



  function getInventoryItemQuantity(itemName) {
    // First try to find on current page (if on inventory page)
    if (window.location.pathname.includes('inventory.php')) {
      const allSections = document.querySelectorAll('.section');
      
      for (const section of allSections) {
        const slotBoxes = section.querySelectorAll('.slot-box');
        
        for (const slot of slotBoxes) {
          const img = slot.querySelector('img');
          const label = slot.querySelector('.label');
          
          if (img && label) {
            const currentItemName = img.getAttribute('alt');
            
            if (currentItemName === itemName) {
              // Look for quantity in the label (usually shows as "x123")
              const labelText = label.textContent;
              const quantityMatch = labelText.match(/x(\d+)/);
              
              if (quantityMatch) {
                return parseInt(quantityMatch[1]);
              }
              
              // If no quantity found, it might be equipped (quantity 1)
              return 1;
            }
          }
        }
      }
    }
    
    // If not on inventory page, try to get from pinned items in sidebar
    const pinnedItem = extensionSettings.pinnedInventoryItems.find(item => item.name === itemName);
    if (pinnedItem) {
      return pinnedItem.quantity || 0;
    }
    
    // If still not found, return 0 (item doesn't exist)
    return 0;
  }

  function initPetNaming() {
    if (!extensionSettings.petNames.enabled) return;
    
    // Ensure petNames object exists
    if (!extensionSettings.petNames.names) {
      extensionSettings.petNames.names = {};
    }
    
    // Add custom names to all pet slots
    document.querySelectorAll('.slot-box[data-pet-inv-id]').forEach(slot => {
      const petId = slot.getAttribute('data-pet-inv-id');
      const petImg = slot.querySelector('img[alt]');
      if (!petImg) return;
      
      const originalName = petImg.getAttribute('alt');
      const customName = extensionSettings.petNames.names[petId];
      
      // Handle both equipped pets (.item-container) and inventory pets (direct img)
      const itemContainer = slot.querySelector('.item-container');
      
      // Create custom name element
      const nameElement = document.createElement('div');
      nameElement.className = 'pet-custom-name';
      nameElement.setAttribute('data-pet-id', petId);
      nameElement.setAttribute('data-original-name', originalName);
      
      if (customName) {
        nameElement.textContent = customName;
      } else {
        nameElement.textContent = 'Click to name';
        nameElement.style.fontStyle = 'italic';
        nameElement.style.opacity = '0.7';
      }
      
      // Insert the name element based on structure
      if (itemContainer) {
        // Equipped pets: insert into .item-container
        itemContainer.appendChild(nameElement);
      } else {
        // Inventory pets: insert after the img tag
        petImg.insertAdjacentElement('afterend', nameElement);
      }
      
      // Add click event for editing
      nameElement.addEventListener('click', (e) => {
        if (e.target.classList.contains('pet-name-edit-btn')) return;
        startEditingPetName(nameElement, petId);
      });
    });
  }
  
  function startEditingPetName(nameElement, petId) {
    const currentName = extensionSettings.petNames.names[petId] || '';
    
    // Create input field
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'pet-name-input';
    input.value = currentName;
    input.placeholder = 'Enter pet name...';
    input.maxLength = 20;
    
    // Create action buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'pet-name-actions';
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'pet-name-btn pet-name-save';
    saveBtn.textContent = 'Save';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'pet-name-btn pet-name-cancel';
    cancelBtn.textContent = 'Cancel';
    
    actionsDiv.appendChild(saveBtn);
    actionsDiv.appendChild(cancelBtn);
    
    // Replace content with input and buttons
    nameElement.innerHTML = '';
    nameElement.appendChild(input);
    nameElement.appendChild(actionsDiv);
    nameElement.classList.add('editing');
    
    // Focus and select text
    input.focus();
    input.select();
    
    // Event handlers
    const saveName = () => {
      const newName = input.value.trim();
      if (newName) {
        extensionSettings.petNames.names[petId] = newName;
        nameElement.textContent = newName;
        nameElement.style.fontStyle = 'normal';
        nameElement.style.opacity = '1';
      } else {
        delete extensionSettings.petNames.names[petId];
        nameElement.textContent = 'Click to name';
        nameElement.style.fontStyle = 'italic';
        nameElement.style.opacity = '0.7';
      }
      nameElement.classList.remove('editing');
      saveSettings();
    };
    
    const cancelEdit = () => {
      const currentName = extensionSettings.petNames.names[petId] || '';
      if (currentName) {
        nameElement.textContent = currentName;
        nameElement.style.fontStyle = 'normal';
        nameElement.style.opacity = '1';
      } else {
        nameElement.textContent = 'Click to name';
        nameElement.style.fontStyle = 'italic';
        nameElement.style.opacity = '0.7';
      }
      nameElement.classList.remove('editing');
    };
    
    saveBtn.addEventListener('click', saveName);
    cancelBtn.addEventListener('click', cancelEdit);
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveName();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    });
    
    // Click outside to cancel
    const clickOutside = (e) => {
      if (!nameElement.contains(e.target)) {
        cancelEdit();
        document.removeEventListener('click', clickOutside);
      }
    };
    setTimeout(() => document.addEventListener('click', clickOutside), 100);
  }

  function initPetMods(){
    initPetTotalDmg()
    initPetRequiredFood()
    initPetNaming()
    
    // Remove the back to dashboard button
    const backToDashboardBtn = document.querySelector('a[href="game_dash.php"].btn');
    if (backToDashboardBtn) {
        backToDashboardBtn.remove();
    }
    
    // Remove empty div with margin: 20px
    const emptyMarginDiv = document.querySelector('div[style*="margin: 20px"]');
    if (emptyMarginDiv && emptyMarginDiv.innerHTML.trim() === '') {
        emptyMarginDiv.remove();
    }
    
    // Move team selection buttons to content area
    const teamSelectionDiv = document.querySelector('div[style*="margin: 12px auto 0"][style*="max-width:1000px"]');
    if (teamSelectionDiv) {
        // Find the content area container
        const contentArea = document.querySelector('.content-area .container');
        if (contentArea) {
            // Find the h1 title
            const title = contentArea.querySelector('h1');
            if (title) {
                // Create team selection container
                const teamContainer = document.createElement('div');
                teamContainer.style.cssText = 'margin: 20px 0; display: flex; gap: 8px; justify-content: center;';
                
                // Clone and modify the team buttons
                const attackBtn = teamSelectionDiv.querySelector('a[href="?team=atk"]');
                const defenseBtn = teamSelectionDiv.querySelector('a[href="?team=def"]');
                
                if (attackBtn) {
                    const newAttackBtn = attackBtn.cloneNode(true);
                    newAttackBtn.style.cssText = 'background:#2a4b8d; text-decoration:none; padding: 8px 12px; border-radius: 4px; text-align: center; color: white; font-size: 12px;';
                    teamContainer.appendChild(newAttackBtn);
                }
                
                if (defenseBtn) {
                    const newDefenseBtn = defenseBtn.cloneNode(true);
                    newDefenseBtn.style.cssText = 'background:#2b2b2b; text-decoration:none; padding: 8px 12px; border-radius: 4px; text-align: center; color: white; font-size: 12px;';
                    teamContainer.appendChild(newDefenseBtn);
                }
                
                // Insert after the title
                title.insertAdjacentElement('afterend', teamContainer);
            }
        }
        
        // Remove original team selection div
        teamSelectionDiv.remove();
    }
    
    
    createBackToDashboardButton()
      applyCustomBackgrounds()
  }

  function initStatMods(){
    initPlayerAtkDamage()
    // Stat allocation moved to sidebar - no longer needed on stats page
  }

  function initBlacksmithMods(){
    showComingSoon('Blacksmith')
      applyCustomBackgrounds()
  }

  // Simple placeholder function to prevent errors
  function showComingSoon(feature) {
    console.log(`${feature} feature coming soon!`);
  }

  function initEventMods(){
    initRankingSideBySide()
  }

  function initLeaderboardMods() {
    console.log('Initializing leaderboard user highlighting...');
    
    // Wait a moment for the page to load completely
    setTimeout(() => {
      highlightCurrentUserInLeaderboard();
    }, 500);
    
    // Also set up a mutation observer to catch dynamic updates
    const observer = new MutationObserver((mutations) => {
      let shouldHighlight = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldHighlight = true;
        }
      });
      if (shouldHighlight) {
        highlightCurrentUserInLeaderboard();
      }
    });
    
    // Observe the main content area for changes
    const mainContent = document.querySelector('.container-fluid') || document.body;
    if (mainContent) {
      observer.observe(mainContent, { 
        childList: true, 
        subtree: true 
      });
    }
  }

  function highlightCurrentUserInLeaderboard() {
    if (!userId) {
      console.log('No user ID found for leaderboard highlighting');
      return;
    }
    
    let highlightedCount = 0;
    
    // Method 1: Target specific leaderboard rows (.lb-row) - like the existing colorMyself function
    document.querySelectorAll('.lb-row a').forEach(link => {
      if (link.href && link.href.includes(`pid=${userId}`)) {
        const lbRow = link.closest('.lb-row');
        if (lbRow && !lbRow.classList.contains('current-user-highlight')) {
          lbRow.classList.add('current-user-highlight');
          
          // Apply subtle highlighting (not aggressive like before)
          lbRow.style.cssText += `
            background: linear-gradient(135deg, rgba(203, 166, 247, 0.2) 0%, rgba(137, 180, 250, 0.2) 100%) !important;
            border-left: 4px solid #f9e2af !important;
            border-radius: 6px !important;
            box-shadow: 0 2px 8px rgba(203, 166, 247, 0.1) !important;
            animation: userHighlightPulse 3s ease-in-out infinite alternate !important;
          `;
          
          // Add crown indicator to the name
          const nameSpan = lbRow.querySelector('.lb-name');
          if (nameSpan && !nameSpan.querySelector('.user-indicator')) {
            const indicator = document.createElement('span');
            indicator.className = 'user-indicator';
            indicator.innerHTML = ' 👑';
            indicator.style.cssText = `
              color: #f9e2af !important;
              font-weight: bold !important;
            `;
            nameSpan.appendChild(indicator);
          }
          
          highlightedCount++;
        }
      }
    });
    
    // Method 2: Target weekly leaderboard tables (tr elements)
    document.querySelectorAll('table tr').forEach(row => {
      const links = row.querySelectorAll('a');
      links.forEach(link => {
        if (link.href && link.href.includes(`pid=${userId}`)) {
          if (!row.classList.contains('current-user-highlight')) {
            row.classList.add('current-user-highlight');
            
            row.style.cssText += `
              background: linear-gradient(135deg, rgba(203, 166, 247, 0.2) 0%, rgba(137, 180, 250, 0.2) 100%) !important;
              border-left: 4px solid #f9e2af !important;
              border-radius: 4px !important;
            `;
            
            highlightedCount++;
          }
        }
      });
    });
    
    if (highlightedCount > 0) {
      console.log(`Highlighted ${highlightedCount} leaderboard entries for user ${userId}`);
    }
    
    // Add CSS animation if not already present
    if (!document.getElementById('leaderboard-highlight-styles')) {
      const style = document.createElement('style');
      style.id = 'leaderboard-highlight-styles';
      style.textContent = `
        @keyframes userHighlightPulse {
          0% { box-shadow: 0 2px 8px rgba(203, 166, 247, 0.1); }
          100% { box-shadow: 0 4px 12px rgba(203, 166, 247, 0.2); }
        }
        
        .current-user-highlight {
          transition: all 0.2s ease !important;
        }
        
        .current-user-highlight:hover {
          background: linear-gradient(135deg, rgba(203, 166, 247, 0.3) 0%, rgba(137, 180, 250, 0.3) 100%) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Auto-slash functionality for PvP battles
  var autoSlashInterval = null;
  var autoSlashEnabled = false;

  function initAutoSlash() {
    
    // Create auto-slash toggle button
    const attackContainer = document.querySelector('.attack-btn-wrap');
    if (attackContainer) {
      const autoSlashBtn = document.createElement('button');
      autoSlashBtn.id = 'auto-slash-btn';
      autoSlashBtn.innerHTML = '🤖 Auto Slash';
      autoSlashBtn.style.cssText = `
        background: #ff6b6b;
        color: white;
        border: none;
        padding: 8px 12px;
        margin: 5px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
      `;
      
      autoSlashBtn.addEventListener('click', toggleAutoSlash);
      attackContainer.appendChild(autoSlashBtn);
      

    }
  }

  function toggleAutoSlash() {
    const btn = document.getElementById('auto-slash-btn');
    const slashBtn = document.querySelector('.attack-btn[data-skill-id="-1"]');
    
    if (!slashBtn) {
      console.log('Slash button not found');
      return;
    }
    
    if (autoSlashEnabled) {
      // Stop auto-slash
      clearInterval(autoSlashInterval);
      autoSlashInterval = null;
      autoSlashEnabled = false;
      btn.innerHTML = '🤖 Auto Slash';
      btn.style.background = '#ff6b6b';
    } else {
      // Start auto-slash
      autoSlashEnabled = true;
      btn.innerHTML = '⏹️ Stop Auto';
      btn.style.background = '#4ecdc4';
      
      // Start the interval
      autoSlashInterval = setInterval(() => {
        const modal = document.querySelector("#endModal");
        const isShowingEndModal = modal && modal.style.display !== 'none';

        if (isShowingEndModal) {
          clearInterval(autoSlashInterval);
        }

        if (autoSlashEnabled && slashBtn && !slashBtn.disabled) {
          slashBtn.click();
        }
      }, 1070);
    }
  }

  function initRankingSideBySide(){
    // Remove the Orc King image if it exists
    const orcKingImg = document.querySelector('img[alt="Orc King of Grakthar"]');
    if (orcKingImg) {
      console.log('Removing Orc King of Grakthar image');
      orcKingImg.remove();
    }

    // Only proceed with side-by-side layout if we have enough panels
    var panels = document.querySelectorAll('div.panel');
    if (panels.length >= 2) {
      var container = document.createElement('div');
      container.style.cssText = 'display:flex;';
      
      var topDmg = panels[panels.length-2];
      var topKills = panels[panels.length-1];
      
      // Add event-table class to tables if they exist
      const topDmgTable = topDmg.querySelector('table');
      const topKillsTable = topKills.querySelector('table');
      
      if (topDmgTable) topDmgTable.classList.add('event-table');
      if (topKillsTable) topKillsTable.classList.add('event-table');
      
      topKills.style.marginLeft = "20px";
      container.appendChild(topDmg);
      container.appendChild(topKills);
      
      const wrap = document.querySelector('.wrap');
      if (wrap) {
        wrap.appendChild(container);
        console.log('Applied side-by-side ranking layout');
      }
    } else {
      console.log('Not enough panels found for side-by-side layout');
    }
  }

  // AUTO-UPDATE INVENTORY QUANTITIES
  // Periodically refresh inventory item quantities for pinned consumables
  function startInventoryQuantityUpdater() {
      // Only update if we have pinned consumables and we're not on inventory page
      if (!extensionSettings.pinnedInventoryItems.some(item => item.type === 'consumable')) return;
      if (window.location.pathname.includes('inventory.php')) return;
      
      setInterval(async () => {
          try {
              const response = await fetch('inventory.php');
              const html = await response.text();
              
              const sections = html.split('🧪 Consumables');
              if (sections.length < 2) return;
              
              const consumablesSection = sections[1].split('⚒️ Materials')[0];
              const parser = new DOMParser();
              const doc = parser.parseFromString(consumablesSection, 'text/html');
              const slots = doc.querySelectorAll('.slot-box');
              
              let updated = false;
              
              for (const pinnedItem of extensionSettings.pinnedInventoryItems) {
                  if (pinnedItem.type !== 'consumable') continue;
                  
                  let found = false;
                  for (const slot of slots) {
                      const img = slot.querySelector('img');
                      if (img && img.alt === pinnedItem.name) {
                          const quantityMatch = slot.textContent.match(/x(\d+)/);
                          const currentQuantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 1;
                          
                          if (currentQuantity !== pinnedItem.quantity) {
                              pinnedItem.quantity = currentQuantity;
                              updated = true;
                          }
                          found = true;
                          break;
                      }
                  }
                  
                  // If item not found, set quantity to 0
                  if (!found && pinnedItem.quantity > 0) {
                      pinnedItem.quantity = 0;
                      updated = true;
                  }
              }
              
              if (updated) {
                  saveSettings();
                  updateSidebarInventorySection();
              }
              
          } catch (error) {
              console.log('Inventory quantity update failed:', error);
          }
      }, 30000); // Update every 30 seconds
  }

  // Initialize quantity updater when extension loads
  document.addEventListener('DOMContentLoaded', () => {
      setTimeout(startInventoryQuantityUpdater, 5000); // Start after 5 seconds
      // Also fetch stats on page load
      setTimeout(fetchAndUpdateSidebarStats, 1000);
  });

  // Fetch and update sidebar stats
  function fetchAndUpdateSidebarStats() {
      // Try to get stats from the current page first (if on stats page)
      if (window.location.pathname.includes('stats.php')) {
          const points = document.getElementById('v-points')?.textContent || '0';
          const attack = document.getElementById('v-attack')?.textContent || '0';
          const defense = document.getElementById('v-defense')?.textContent || '0';
          const stamina = document.getElementById('v-stamina')?.textContent || '0';
          
          if (points !== '0' || attack !== '0' || defense !== '0' || stamina !== '0') {
              updateSidebarStats({
                  STAT_POINTS: points,
                  ATTACK: attack,
                  DEFENSE: defense,
                  STAMINA: stamina
              });
              return;
          }
      }
      
      // If not on stats page or no data found, try to fetch from stats page
      fetch('stats.php')
      .then(response => response.text())
      .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          const points = doc.getElementById('v-points')?.textContent || '0';
          const attack = doc.getElementById('v-attack')?.textContent || '0';
          const defense = doc.getElementById('v-defense')?.textContent || '0';
          const stamina = doc.getElementById('v-stamina')?.textContent || '0';
          
          updateSidebarStats({
              STAT_POINTS: points,
              ATTACK: attack,
              DEFENSE: defense,
              STAMINA: stamina
          });
      })
      .catch(err => {
          console.error('Stats fetch error:', err);
          // Fallback: try to get from any existing elements on current page
          const points = document.getElementById('v-points')?.textContent || '0';
          const attack = document.getElementById('v-attack')?.textContent || '0';
          const defense = document.getElementById('v-defense')?.textContent || '0';
          const stamina = document.getElementById('v-stamina')?.textContent || '0';
          
          if (points !== '0' || attack !== '0' || defense !== '0' || stamina !== '0') {
              updateSidebarStats({
                  STAT_POINTS: points,
                  ATTACK: attack,
                  DEFENSE: defense,
                  STAMINA: stamina
              });
          }
      });
  }

  // Update sidebar stats display
  function updateSidebarStats(userData) {
      const sidebarPoints = document.getElementById('sidebar-points');
      const sidebarAttack = document.getElementById('sidebar-attack');
      const sidebarDefense = document.getElementById('sidebar-defense');
      const sidebarStamina = document.getElementById('sidebar-stamina');
      
      // Update allocation section too
      const sidebarPointsAlloc = document.getElementById('sidebar-points-alloc');
      const sidebarAttackAlloc = document.getElementById('sidebar-attack-alloc');
      const sidebarDefenseAlloc = document.getElementById('sidebar-defense-alloc');
      const sidebarStaminaAlloc = document.getElementById('sidebar-stamina-alloc');

      if (sidebarPoints) sidebarPoints.textContent = userData.STAT_POINTS || userData.stat_points || 0;
      if (sidebarAttack) sidebarAttack.textContent = userData.ATTACK || userData.attack || 0;
      if (sidebarDefense) sidebarDefense.textContent = userData.DEFENSE || userData.defense || 0;
      if (sidebarStamina) sidebarStamina.textContent = userData.STAMINA || userData.MAX_STAMINA || userData.stamina || 0;

      if (sidebarPointsAlloc) sidebarPointsAlloc.textContent = userData.STAT_POINTS || userData.stat_points || 0;
      if (sidebarAttackAlloc) sidebarAttackAlloc.textContent = userData.ATTACK || userData.attack || 0;
      if (sidebarDefenseAlloc) sidebarDefenseAlloc.textContent = userData.DEFENSE || userData.defense || 0;
      if (sidebarStaminaAlloc) sidebarStaminaAlloc.textContent = userData.STAMINA || userData.MAX_STAMINA || userData.stamina || 0;
  }

  // Inject consistent, modern styles for sidebar quick-access cards (inventory & merchant)
  function addQuickAccessStyles() {
      if (document.getElementById('quick-access-styles')) return;
      const style = document.createElement('style');
      style.id = 'quick-access-styles';
      style.textContent = `
        /* Quick Access container */
        .sidebar-quick-access {
          display: grid;
          gap: 8px;
        }

        /* Card base */
        .sidebar-quick-access .quick-access-item {
          background: rgba(30, 30, 46, 0.75);
          border: 1px solid rgba(69, 71, 90, 0.9);
          border-radius: 10px;
          padding: 10px;
          transition: border-color 0.12s ease, box-shadow 0.12s ease, transform 0.12s ease;
        }

        .sidebar-quick-access .quick-access-item:hover {
          border-color: #89b4fa;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
          transform: translateY(-1px);
        }

        /* Header */
        .sidebar-quick-access .qa-item-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sidebar-quick-access .qa-item-header img {
          border-radius: 6px;
          object-fit: cover;
          background: #11111b;
          border: 1px solid rgba(59, 63, 92, 0.8);
        }

        .sidebar-quick-access .qa-item-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sidebar-quick-access .qa-item-name {
          color: #cdd6f4;
          font-weight: 600;
          font-size: 13px;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-quick-access .qa-item-price {
          font-size: 12px;
          color: #b4befe;
        }

        .sidebar-quick-access .qa-item-limit {
          font-size: 11px;
          color: #a6adc8;
          opacity: 0.9;
        }

        /* Currency accent colors */
        .sidebar-quick-access .quick-access-item[data-item-currency="gold"] .qa-item-price { color: #f9e2af; }
        .sidebar-quick-access .quick-access-item[data-item-currency="diamond"] .qa-item-price { color: #cba6f7; }
        .sidebar-quick-access .quick-access-item[data-item-currency="token"] .qa-item-price { color: #94e2d5; }

        /* Remove button */
        .sidebar-quick-access .qa-remove-btn {
          margin-left: auto;
          background: transparent;
          border: 1px solid rgba(69, 71, 90, 0.9);
          color: #bac2de;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          cursor: pointer;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
        }

        .sidebar-quick-access .qa-remove-btn:hover {
          background: #f38ba8;
          border-color: #f38ba8;
          color: #1e1e2e;
        }

        /* Actions row */
        .sidebar-quick-access .qa-item-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px dashed rgba(69, 71, 90, 0.65);
        }

        /* Buttons */
        .sidebar-quick-access .qa-buy-btn,
        .sidebar-quick-access .qa-equip-btn,
        .sidebar-quick-access .qa-use-btn {
          padding: 6px 10px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.05s ease, box-shadow 0.12s ease, filter 0.12s ease;
        }

        .sidebar-quick-access .qa-buy-btn { 
          background: linear-gradient(135deg, #74c0fc 0%, #89b4fa 100%);
          color: #1e1e2e; 
        }
        .sidebar-quick-access .quick-access-item[data-item-currency="gold"] .qa-buy-btn {
          background: linear-gradient(135deg, #f9e2af 0%, #f5e0dc 100%);
          color: #1e1e2e;
        }
        .sidebar-quick-access .quick-access-item[data-item-currency="diamond"] .qa-buy-btn {
          background: linear-gradient(135deg, #cba6f7 0%, #b4befe 100%);
          color: #1e1e2e;
        }

        .sidebar-quick-access .qa-equip-btn { 
          background: linear-gradient(135deg, #a6e3a1 0%, #94e2d5 100%);
          color: #1e1e2e;
        }
        .sidebar-quick-access .qa-use-btn { 
          background: linear-gradient(135deg, #74c0fc 0%, #89b4fa 100%);
          color: #1e1e2e;
        }

        .sidebar-quick-access .qa-buy-btn[disabled] {
          background: #45475a !important;
          color: #cdd6f4 !important;
          cursor: not-allowed;
          opacity: 0.7;
          box-shadow: none !important;
        }

        .sidebar-quick-access .qa-buy-btn:active,
        .sidebar-quick-access .qa-equip-btn:active,
        .sidebar-quick-access .qa-use-btn:active {
          transform: translateY(1px);
        }

        /* Quantity controls (inventory) */
        .sidebar-quick-access .qa-use-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sidebar-quick-access .qty-wrap {
          display: flex;
          align-items: center;
          border: 1px solid #45475a;
          border-radius: 6px;
          background: #1e1e2e;
          overflow: hidden;
        }

        .sidebar-quick-access .qty-btn {
          border: none;
          padding: 4px 8px;
          cursor: pointer;
          font-weight: 800;
        }
        .sidebar-quick-access .qty-btn.minus { background: #f38ba8; color: #1e1e2e; }
        .sidebar-quick-access .qty-btn.plus  { background: #a6e3a1; color: #1e1e2e; }

        .sidebar-quick-access .qty-input {
          width: 36px;
          padding: 4px;
          background: #1e1e2e;
          color: #cdd6f4;
          border: none;
          text-align: center;
          font-size: 12px;
        }

        /* Empty state */
        .sidebar-quick-access .quick-access-empty {
          background: rgba(49, 50, 68, 0.35);
          border: 1px dashed rgba(69, 71, 90, 0.8);
          color: #a6adc8;
          border-radius: 8px;
          padding: 10px;
          text-align: center;
          font-size: 12px;
        }

        /* Merchant-specific tweaks */
        #merchant-expanded {
          max-width: 199px !important;
          width: 199px !important;
        }
      `;
      document.head.appendChild(style);
  }

  // SIDEBAR SECTION UPDATES
  function updateSidebarInventorySection() {
      // Ensure styles are present
      addQuickAccessStyles();
      const inventoryContent = document.getElementById('inventory-expanded');
      if (!inventoryContent) return;

    // Updating sidebar inventory section

    let content = '<div class="sidebar-quick-access">';
    
      if (extensionSettings.pinnedInventoryItems.length === 0) {
          content += '<div class="quick-access-empty">No pinned items. Visit inventory to pin items.</div>';
    } else {
          extensionSettings.pinnedInventoryItems.forEach(item => {
              // Always fetch fresh quantity from current inventory
              const currentQuantity = getInventoryItemQuantity(item.name);
              const displayQuantity = item.type === 'consumable' ? ` (x${currentQuantity || 0})` : '';
              const itemKey = item.type === 'consumable' ? item.name : item.id;
        
        content += `
                  <div class="quick-access-item" data-item-id="${item.id}" data-item-name="${item.name}" data-item-type="${item.type}">
            <div class="qa-item-header">
                          <img src="${item.image}" alt="${item.name}" style="width: 24px; height: 24px; border-radius: 4px;" onerror="this.style.display='none'">
              <div class="qa-item-info">
                              <div class="qa-item-name">${item.name}</div>
                              <div class="qa-item-stats">Available: ${currentQuantity}</div>
              </div>
                          <button class="qa-remove-btn" data-action="remove">×</button>
            </div>
            <div class="qa-item-actions">
                          ${item.type === 'consumable' && currentQuantity > 0 ? 
                            `<div class="qa-use-controls" style="display: flex; align-items: center; gap: 5px;">
                              <div class="qty-wrap" style="display: flex; align-items: center; border: 1px solid #45475a; border-radius: 4px; background: #1e1e2e;">
                                <button type="button" class="qty-btn minus" style="background: #f38ba8; color: white; border: none; padding: 2px 6px; cursor: pointer; border-radius: 3px 0 0 3px;">−</button>
                                <input type="number" class="qty-input" min="1" max="${currentQuantity}" step="1" value="1" style="width: 30px; padding: 2px; background: #1e1e2e; color: #cdd6f4; border: none; text-align: center; font-size: 10px;">
                                <button type="button" class="qty-btn plus" style="background: #a6e3a1; color: #1e1e2e; border: none; padding: 2px 6px; cursor: pointer; border-radius: 0 3px 3px 0;">+</button>
                              </div>
                              <button class="qa-use-btn" data-action="use" style="background: #74c0fc; color: #1e1e2e; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: bold;">Use</button>
                            </div>` :
                            item.type === 'equipment' ?
                            `<button class="qa-equip-btn" data-action="equip">View</button>` :
                            `<span style="font-size: 11px; color: #888;">Material</span>`
                          }
                          ${item.type === 'consumable' && item.quantity === 0 ? 
                            `<span style="font-size: 11px; color: #f38ba8;">Out of stock</span>` : ''
                          }
            </div>
          </div>
        `;
      });
    }
    
    content += '</div>';
    inventoryContent.innerHTML = content;
    
    // Add event listeners for inventory quick access buttons
    setupInventoryQuickAccessListeners();
    
    // Note: refreshPinnedItemQuantities() is called separately to avoid infinite loops
  }

  function updateSidebarMerchantSection() {
    // Ensure styles are present
    addQuickAccessStyles();
    const merchantContent = document.getElementById('merchant-expanded');
    if (!merchantContent) return;

    // Build dropdown (persisted selection stored in extensionSettings.merchantDropdown)
    if (!extensionSettings.merchantDropdown) {
      extensionSettings.merchantDropdown = { mode: 'default' }; // modes: default, cheapest, remaining, alpha
    }

    let content = '<div class="sidebar-quick-access">';
    if (extensionSettings.pinnedMerchantItems.length === 0) {
      content += '<div class="quick-access-empty">No pinned items. Visit merchant to pin items.</div>';
    } else {
      // Create a shallow copy for sorting based on dropdown mode
      let itemsToRender = [...extensionSettings.pinnedMerchantItems];
      switch (extensionSettings.merchantDropdown.mode) {
        case 'cheapest':
          itemsToRender.sort((a,b)=> (a.price||0) - (b.price||0));
          break;
        case 'remaining':
          itemsToRender.sort((a,b)=> {
            const remA = a.maxQ>0? Math.max(0,a.maxQ - a.bought): 999;
            const remB = b.maxQ>0? Math.max(0,b.maxQ - b.bought): 999;
            return remB - remA; // most remaining first
          });
          break;
        case 'alpha':
          itemsToRender.sort((a,b)=> String(a.name).localeCompare(String(b.name)));
          break;
        default:
          // keep original pinned order
          break;
      }

      itemsToRender.forEach(item => {
              const remaining = item.maxQ > 0 ? Math.max(0, item.maxQ - item.bought) : 999;
              const canBuy = item.maxQ === 0 || remaining > 0;

        content += `
                  <div class="quick-access-item" data-item-id="${item.id}" data-item-name="${item.name}" data-item-currency="${item.currency}" data-item-price="${item.price}" style="max-width: 166px;">
            <div class="qa-item-header">
                          <img src="${item.image}" alt="${item.name}" style="width: 24px; height: 24px; border-radius: 4px;" onerror="this.style.display='none'">
              <div class="qa-item-info">
                <div class="qa-item-name">${item.name}</div>
                              <div class="qa-item-price">${item.priceDisplay}</div>
                              ${item.maxQ > 0 ? `<div class="qa-item-limit">Remaining: ${remaining}/${item.maxQ}</div>` : ''}
              </div>
            </div>
            <div class="qa-item-actions">
                          <button class="qa-buy-btn" ${!canBuy ? 'disabled' : ''} data-action="buy" draggable="false">
                              ${canBuy ? 'Buy' : 'Sold Out'}
              </button>
              <button class="qa-remove-btn" data-action="remove" draggable="false">×</button>
            </div>
          </div>
        `;
      });
    }
    
    content += '</div>';
    merchantContent.innerHTML = content;
    
    // Add event listeners for merchant quick access buttons
    setupMerchantQuickAccessListeners();
  }

  // Setup event listeners for quick access buttons
  function setupInventoryQuickAccessListeners() {
    const inventoryContent = document.getElementById('inventory-expanded');
    if (!inventoryContent) return;

    // Remove button listeners
    inventoryContent.querySelectorAll('.qa-remove-btn[data-action="remove"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const item = btn.closest('.quick-access-item');
        const itemId = item?.dataset.itemId;
        const itemName = item?.dataset.itemName;
        if (itemId && itemName) {
          removeFromInventoryQuickAccess(itemId, itemName);
        }
      });
    });
    
    // Quantity selector listeners
    const minusButtons = inventoryContent.querySelectorAll('.qty-btn.minus');
    const plusButtons = inventoryContent.querySelectorAll('.qty-btn.plus');
    
    // Found quantity control buttons
    
    minusButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const input = btn.parentElement.querySelector('.qty-input');
        if (input) {
          const currentValue = parseInt(input.value) || 1;
          const newValue = Math.max(1, currentValue - 1);
          input.value = newValue;
        } else {
          console.error('Could not find qty-input element');
        }
      });
    });

    plusButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const input = btn.parentElement.querySelector('.qty-input');
        if (input) {
          const currentValue = parseInt(input.value) || 1;
          const maxValue = parseInt(input.max) || 1;
          const newValue = Math.min(maxValue, currentValue + 1);
          input.value = newValue;
        } else {
          console.error('Could not find qty-input element');
        }
      });
    });
    
    // Use button listeners
    inventoryContent.querySelectorAll('.qa-use-btn[data-action="use"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const item = btn.closest('.quick-access-item');
        const itemId = item?.dataset.itemId;
        const itemName = item?.dataset.itemName;
        const itemType = item?.dataset.itemType;
        const qtyInput = item?.querySelector('.qty-input');
        const quantity = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
        
        if (itemId && itemName && itemType) {
          // Use the website's native useItem function if available, otherwise use direct API call
          if (typeof useItem === 'function') {
            useItem(itemId, 30, itemName, quantity); // Assuming item type 30 for stamina potions
            showNotification(`✅ Used ${quantity}x ${itemName}`, 'success');
            
            // Update sidebar quantity after successful use
            updateSidebarItemQuantity(item, quantity);
          } else {
            // Use direct API call when native function isn't available
            useItemDirectly(itemId, itemName, quantity);
            
            // Update sidebar quantity after successful use
            updateSidebarItemQuantity(item, quantity);
          }
        }
      });
    });
    
    // Multiple use button listeners
    inventoryContent.querySelectorAll('.qa-use-multiple-btn[data-action="use-multiple"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const item = btn.closest('.quick-access-item');
        const itemId = item?.dataset.itemId;
        const itemName = item?.dataset.itemName;
        const itemType = item?.dataset.itemType;
        if (itemId && itemName && itemType) {
          // Use the website's native useItem function with default quantity
          const multipleQuantity = extensionSettings.multiplePotsCount || 3;
          if (typeof useItem === 'function') {
            useItem(itemId, 30, itemName, multipleQuantity);
            showNotification(`✅ Used ${multipleQuantity}x ${itemName}`, 'success');
            
            // Update sidebar quantity after successful use
            updateSidebarItemQuantity(item, multipleQuantity);
          } else {
            // Use direct API call when native function isn't available
            useItemDirectly(itemId, itemName, multipleQuantity);
            
            // Update sidebar quantity after successful use
            updateSidebarItemQuantity(item, multipleQuantity);
          }
        }
      });
    });
    
    // Equip button listeners
    inventoryContent.querySelectorAll('.qa-equip-btn[data-action="equip"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const item = btn.closest('.quick-access-item');
        const itemId = item?.dataset.itemId;
        const itemName = item?.dataset.itemName;
        const itemType = item?.dataset.itemType;
        if (itemId && itemName && itemType) {
          executeInventoryAction({id: itemId, name: itemName, type: itemType}, 'equip');
        }
      });
    });
  }

  function setupMerchantQuickAccessListeners() {
    const merchantContent = document.getElementById('merchant-expanded');
    if (!merchantContent) return;
    
    // Remove button listeners
    merchantContent.querySelectorAll('.qa-remove-btn[data-action="remove"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const item = btn.closest('.quick-access-item');
        const itemId = item?.dataset.itemId;
        if (itemId) {
          removeFromMerchantQuickAccess(itemId);
        }
      });
    });
    
    // Buy button listeners
    merchantContent.querySelectorAll('.qa-buy-btn[data-action="buy"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (btn.disabled) return;
        
        const item = btn.closest('.quick-access-item');
        const itemId = item?.dataset.itemId;
        const itemName = item?.dataset.itemName;
        const itemCurrency = item?.dataset.itemCurrency;
        const itemPrice = item?.dataset.itemPrice;
        
        if (itemId && itemName && itemCurrency && itemPrice) {
          executeMerchantBuy({
            id: itemId, 
            name: itemName, 
            currency: itemCurrency, 
            price: parseInt(itemPrice, 10)
          });
        }
      });
    });
  }

  // Other utility functions
  function initPvPBannerFix(){
    var contentArea = document.querySelector('.content-area');
    var seasonCountdown = document.querySelector('.season-cta');
    var pvpHero = document.querySelector('.pvp-hero');
    if (pvpHero) {
      pvpHero.style.marginTop = "0px";
      if(seasonCountdown){
        contentArea.prepend(seasonCountdown)
      }
      contentArea.prepend(pvpHero)
      const br = document.querySelector('br');
      if (br) br.remove();
    }
  }

  function initPlayerAtkDamage(){
    const atkElement = document.getElementById('v-attack');
    if (!atkElement) return;

    var atkValue = Number.parseInt(atkElement.innerText.replaceAll(',','').replaceAll('.',''))
    const statCard = document.querySelectorAll('.grid .card')[1];
    if (!statCard) return;

    const defenseValues = [0, 25, 50];
    defenseValues.forEach((def, index) => {
      var statRow = document.createElement('div')
      statRow.title = `Damage is calculated based on ${def} DEF monster`
      statRow.classList.add('row')
      statRow.style.color = 'red'

      var statName = document.createElement('span')
      statName.innerText = `ATTACK DMG VS ${def} DEF`

      var statValue = document.createElement('span')
      var playerTotalDmg = calcDmg(atkValue, def)
      statValue.innerText = playerTotalDmg;

      statRow.append(statName)
      statRow.append(statValue)
      statCard.append(statRow)
    });
  }

  function calcDmg(atkValue,def){
    return Math.round(1000*((atkValue-def)**0.25));
  }

  function initPetTotalDmg(){
    const petSection = document.querySelector('.section');
    const sectionTitle = document.querySelector('.section-title');
    if (!petSection || !sectionTitle) return;

    var petTotalDmg = 0;
    petSection.querySelectorAll('.pet-atk').forEach(x => {
      petTotalDmg += Number.parseInt(x.innerText)
    });

    var finalAmount = petTotalDmg * 20;
    var totalDmgContainer = document.createElement('span');
    totalDmgContainer.id = 'total-pet-damage';
    totalDmgContainer.innerText = ' - Total pet damage: ' + finalAmount;
    totalDmgContainer.style.color = '#f38ba8';
    sectionTitle.appendChild(totalDmgContainer);
  }

  function initPetRequiredFood(){
    document.querySelectorAll('.exp-top').forEach(x => {
      var curExp = Number.parseInt(x.querySelector('.exp-current').innerText);
      var reqExp = Number.parseInt(x.querySelector('.exp-required').innerText);
      var needed = Math.ceil((reqExp - curExp) / 300);
      x.insertAdjacentHTML('afterEnd', `<div style='margin-top:5px;'><span style='color:green;margin-top:5px'>Requires ${needed} Arcane Treat S</span></div>`);
    });
  }

  function initItemTotalDmg(){
    const itemSection = document.querySelector('.section');
    const sectionTitle = document.querySelector('.section-title');
    if (!itemSection || !sectionTitle) return;

    var itemsTotalDmg = 0;
    itemSection.querySelectorAll('.label').forEach(x => {
      const labelText = x.innerText;
      const atkIndex = labelText.indexOf('🔪');
      if (atkIndex !== -1) {
        const atkText = labelText.substring(atkIndex + 3);
        const atkMatch = atkText.match(/(\d+)\s*ATK/);
        if (atkMatch) {
          itemsTotalDmg += parseInt(atkMatch[1]);
        }
      }
    });

    var finalAmount = itemsTotalDmg * 20;
    var totalDmgContainer = document.createElement('span');
    totalDmgContainer.id = 'total-item-damage';
    totalDmgContainer.innerText = ' - Total item damage: ' + finalAmount;
    totalDmgContainer.style.color = '#a6e3a1';
    sectionTitle.appendChild(totalDmgContainer);
  }

  // Function to extract item data from HTML structure
  function extractItemDataFromHTML(htmlContent) {
    // Extracting item data from HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const items = [];
    
    // Find all slot-box elements
    const slotBoxes = doc.querySelectorAll('.slot-box');
    
    slotBoxes.forEach((slot, index) => {
      const itemData = {};
      
      // Extract image and name
      const img = slot.querySelector('img');
      if (img) {
        itemData.name = img.alt;
        itemData.imageUrl = img.src;
        // Found item
      }
      
      // Extract item ID from use button
      const useButton = slot.querySelector('button[onclick*="useItem"]');
      if (useButton) {
        const onclickStr = useButton.getAttribute('onclick') || '';
        const match = onclickStr.match(/useItem\(([^)]+)\)/);
        if (match) {
          itemData.itemId = match[1];
        }
      }
      
      // Extract quantity
      const quantityMatch = slot.textContent.match(/x(\d+)/);
      if (quantityMatch) {
        itemData.quantity = parseInt(quantityMatch[1], 10);
        // Quantity found
      } else {
        itemData.quantity = 1;
      }
      
      // Extract description from info button
      const infoButton = slot.querySelector('.info-btn');
      if (infoButton) {
        itemData.description = infoButton.getAttribute('data-desc') || '';
      }
      
      // Only add items that have an item ID (usable items)
      if (itemData.itemId) {
        items.push(itemData);
        // Added item
      } else {
        // Skipped item (no item ID)
      }
    });
    
    // Extracted items
    return items;
  }
  // Function to automatically click "show more" buttons
  async function autoClickShowMore() {
    const showMoreButtons = document.querySelectorAll('button, a, input[type="button"]');
    let clickedAny = false;
    
    for (const button of showMoreButtons) {
      const buttonText = button.textContent || button.value || '';
      const buttonTitle = button.title || '';
      
      // Look for "show more", "load more", "more", etc.
      if (buttonText.toLowerCase().includes('more') || 
          buttonText.toLowerCase().includes('load') ||
          buttonTitle.toLowerCase().includes('more') ||
          buttonTitle.toLowerCase().includes('load')) {
        
        console.log(`Auto-clicking "show more" button: ${buttonText}`);
        button.click();
        clickedAny = true;
        
        // Wait a bit for content to load
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return clickedAny;
  }

  // Function to get all consumable items from the page
  async function getAllConsumableItems() {
    console.log('Getting all consumable items...');
    
    // First, try to get items from the current page if we're on inventory
    if (window.location.pathname.includes('inventory.php')) {
      console.log('On inventory page, extracting items from current page...');
      const currentItems = extractItemDataFromHTML(document.documentElement.outerHTML);
      
      if (currentItems.length > 0) {
        console.log(`Found ${currentItems.length} items on current page`);
        return currentItems;
      }
      
      // If no items found, try clicking "show more" buttons
      console.log('No items found, trying to click "show more" buttons...');
      let hasMoreContent = true;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (hasMoreContent && attempts < maxAttempts) {
        attempts++;
        console.log(`Show more attempt ${attempts}`);
        
        hasMoreContent = await autoClickShowMore();
        
        if (hasMoreContent) {
          // Wait for new content to load
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Extract items from updated page
          const newItems = extractItemDataFromHTML(document.documentElement.outerHTML);
          if (newItems.length > 0) {
            console.log(`Found ${newItems.length} items after show more`);
            return newItems;
          }
        }
      }
    }
    
    // If we're not on inventory page or show more didn't work, fetch inventory page
    console.log('Fetching inventory page via AJAX...');
    try {
      const response = await fetch('inventory.php');
      const html = await response.text();
      console.log('Fetched inventory HTML length:', html.length);
      
      const items = extractItemDataFromHTML(html);
      console.log(`Found ${items.length} items from fetched inventory`);
      return items;
      
    } catch (error) {
      console.error('Failed to fetch inventory page:', error);
      return [];
    }
  }

  // Function to find a specific item by name
  async function findItemByName(itemName) {
    // Looking for item
    
    // First, try to get items from the current page if we're on inventory
    if (window.location.pathname.includes('inventory.php')) {
      // On inventory page, search directly in DOM (much faster)
      const slotBoxes = document.querySelectorAll('.slot-box');
      
      for (const slot of slotBoxes) {
        const img = slot.querySelector('img');
        if (img && img.alt && img.alt.toLowerCase() === itemName.toLowerCase()) {
          // Found the item, extract its data directly
          const itemData = {};
          itemData.name = img.alt;
          itemData.imageUrl = img.src;
          
          // Extract item ID from use button
          const useButton = slot.querySelector('button[onclick*="useItem"]');
          if (useButton) {
            const onclickStr = useButton.getAttribute('onclick') || '';
            const match = onclickStr.match(/useItem\(([^)]+)\)/);
            if (match) {
              itemData.itemId = match[1];
            }
          }
          
          // Extract quantity
          const quantityMatch = slot.textContent.match(/x(\d+)/);
          if (quantityMatch) {
            itemData.quantity = parseInt(quantityMatch[1], 10);
          } else {
            itemData.quantity = 1;
          }
          
          return itemData;
        }
      }
      
      // If not found, try clicking "show more" buttons
      let hasMoreContent = true;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (hasMoreContent && attempts < maxAttempts) {
        attempts++;
        console.log(`Show more attempt ${attempts}`);
        
        hasMoreContent = await autoClickShowMore();
        
        if (hasMoreContent) {
          // Wait for new content to load
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Search directly in DOM again (much faster than parsing HTML)
          const newSlotBoxes = document.querySelectorAll('.slot-box');
          for (const slot of newSlotBoxes) {
            const img = slot.querySelector('img');
            if (img && img.alt && img.alt.toLowerCase() === itemName.toLowerCase()) {
              // Found the item, extract its data directly
              const itemData = {};
              itemData.name = img.alt;
              itemData.imageUrl = img.src;
              
              // Extract item ID from use button
              const useButton = slot.querySelector('button[onclick*="useItem"]');
              if (useButton) {
                const onclickStr = useButton.getAttribute('onclick') || '';
                const match = onclickStr.match(/useItem\(([^)]+)\)/);
                if (match) {
                  itemData.itemId = match[1];
                }
              }
              
              // Extract quantity
              const quantityMatch = slot.textContent.match(/x(\d+)/);
              if (quantityMatch) {
                itemData.quantity = parseInt(quantityMatch[1], 10);
              } else {
                itemData.quantity = 1;
              }
              
              return itemData;
            }
          }
        }
      }
    }
    
    // If we're not on inventory page or show more didn't work, fetch inventory page
    console.log('Fetching inventory page via AJAX...');
    try {
      const response = await fetch('inventory.php');
      const html = await response.text();
      console.log('Fetched inventory HTML length:', html.length);
      
      const items = extractItemDataFromHTML(html);
      const foundItem = items.find(item => 
        item.name && item.name.toLowerCase() === itemName.toLowerCase()
      );
      
      if (foundItem) {
        console.log(`Found "${foundItem.name}" from fetched inventory`);
        return foundItem;
      } else {
        console.log(`Item "${itemName}" not found in inventory`);
        return null;
      }
      
    } catch (error) {
      console.error('Failed to fetch inventory page:', error);
      return null;
    }
  }

  function initAlternativeInventoryView(){
    if (!window.location.pathname.includes('inventory.php')) return;

    const header = document.querySelector('h1');
    if (header) {
      header.style.cursor = 'pointer';
      header.title = 'Click to toggle between grid and table view';
      const viewIndicator = document.createElement('span');
      viewIndicator.id = 'view-indicator';
      viewIndicator.style.marginLeft = '10px';
      viewIndicator.style.fontSize = '14px';
      viewIndicator.style.color = '#cba6f7';
      header.appendChild(viewIndicator);

      const savedView = localStorage.getItem('inventoryView') || 'grid';
      viewIndicator.textContent = `[${savedView.toUpperCase()} VIEW]`;

      if (savedView === 'table') {
        convertToTableView();
      }

      header.addEventListener('click', toggleInventoryView);
    }

    function toggleInventoryView() {
      const viewIndicator = document.getElementById('view-indicator');
      const currentView = viewIndicator.textContent.includes('TABLE') ? 'table' : 'grid';
      const newView = currentView === 'table' ? 'grid' : 'table';

      viewIndicator.textContent = `[${newView.toUpperCase()} VIEW]`;
      localStorage.setItem('inventoryView', newView);

      if (newView === 'table') {
        convertToTableView();
      } else {
        convertToGridView();
      }
    }

    function convertToTableView() {
      document.querySelectorAll('.inventory-table').forEach(table => table.remove());

      const sections = document.querySelectorAll('.section');
      sections.forEach(section => {
        const grid = section.querySelector('.grid');

        if (grid) {
          grid.style.display = 'none';

          const table = document.createElement('table');
          table.className = 'inventory-table';
          table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            background: rgba(30, 30, 46, 0.8);
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 20px;
          `;
          table.innerHTML = `
            <thead>
              <tr style="background: rgba(203, 166, 247, 0.2);">
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #585b70;">Item</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #585b70;">Details</th>
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #585b70;">Actions</th>
              </tr>
            </thead>
            <tbody></tbody>
          `;

          const tbody = table.querySelector('tbody');
          const items = grid.querySelectorAll('.slot-box');
          items.forEach(item => {
            const row = document.createElement('tr');
            row.style.cssText = 'border-bottom: 1px solid rgba(88, 91, 112, 0.3);';

            const img = item.querySelector('img');
            const imgSrc = img ? img.src : '';
            const imgAlt = img ? img.alt : '';

            const label = item.querySelector('.label');
            const labelText = label ? label.textContent : '';

            const buttons = item.querySelectorAll('button');

            row.innerHTML = `
              <td class="table-item-image" style="padding: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <img src="${imgSrc}" alt="${imgAlt}" onerror="this.style.display='none'"
                       style="width: 40px; height: 40px; border-radius: 4px;">
                  <div class="table-item-name" style="color: #e0e0e0;">${imgAlt}</div>
                </div>
              </td>
              <td class="table-item-details" style="padding: 12px; color: #cdd6f4;">${labelText}</td>
              <td class="table-item-actions" style="padding: 12px;"></td>
            `;

            const actionsCell = row.querySelector('.table-item-actions');
            buttons.forEach(button => {
              if (!button.classList.contains('info-btn')) {
                const buttonClone = button.cloneNode(true);
                buttonClone.style.marginRight = '8px';
                actionsCell.appendChild(buttonClone);
              }
            });

            const infoBtn = item.querySelector('.info-btn');
            if (infoBtn) {
              const infoClone = infoBtn.cloneNode(true);
              actionsCell.appendChild(infoClone);
            }

            tbody.appendChild(row);
          });

          section.insertBefore(table, grid);
        }
      });
    }

    function convertToGridView() {
      document.querySelectorAll('.inventory-table').forEach(table => table.remove());
      document.querySelectorAll('.grid').forEach(grid => {
        grid.style.display = 'flex';
      });
    }
  }

  // Stat allocation section
  function initStatAllocation() {
    const statsContainer = document.querySelector('.grid');
    if (!statsContainer) return;

    const existingSection = document.querySelector('#stat-allocation-section');
    if (existingSection) existingSection.remove();

    const statAllocationSection = document.createElement('div');
    statAllocationSection.id = 'stat-allocation-section';
    statAllocationSection.style.cssText = `
      background: rgba(30, 30, 46, 0.8);
      border: 1px solid #585b70;
      border-radius: 10px;
      margin: 20px 0;
      overflow: hidden;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      padding: 15px 20px;
      background: rgba(203, 166, 247, 0.1);
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: bold;
      color: #cba6f7;
    `;

    const currentPoints = document.getElementById('v-points')?.textContent || '0';
    const availablePoints = parseInt(currentPoints);

    header.innerHTML = `
      <span>📊 Stat Allocation</span>
      <span id="stat-toggle-icon">${extensionSettings.statAllocationCollapsed ? '[+]' : '[–]'}</span>
    `;

    const content = document.createElement('div');
    content.id = 'stat-allocation-content';
    content.style.cssText = `
      padding: 20px;
      display: ${extensionSettings.statAllocationCollapsed ? 'none' : 'block'};
    `;

    content.innerHTML = `
      <div style="margin-bottom: 15px; color: #f9e2af; font-weight: bold;">
        Available Points: ${availablePoints}
      </div>
      <div class="stat-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 10px; background: rgba(69, 71, 90, 0.3); border-radius: 8px;">
        <span style="color: #e0e0e0; min-width: 80px;">Strength:</span>
        <div style="display: flex; gap: 10px; align-items: center;">
          <button class="stat-btn" onclick="allocateStatPoints('attack', 1)" ${availablePoints < 1 ? 'disabled' : ''}
                  style="background:rgb(6, 6, 6); color: #1e1e2e; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">+1</button>
          <button class="stat-btn" onclick="allocateStatPoints('attack', 5)" ${availablePoints < 5 ? 'disabled' : ''}
                  style="background: #a6e3a1; color: #1e1e2e; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">+5</button>
        </div>
      </div>
      <div class="stat-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 10px; background: rgba(69, 71, 90, 0.3); border-radius: 8px;">
        <span style="color: #e0e0e0; min-width: 80px;">Agility:</span>
        <div style="display: flex; gap: 10px; align-items: center;">
          <button class="stat-btn" onclick="allocateStatPoints('defense', 1)" ${availablePoints < 1 ? 'disabled' : ''}
                  style="background: #74c0fc; color: #1e1e2e; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">+1</button>
          <button class="stat-btn" onclick="allocateStatPoints('defense', 5)" ${availablePoints < 5 ? 'disabled' : ''}
                  style="background: #74c0fc; color: #1e1e2e; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">+5</button>
        </div>
      </div>
      <div class="stat-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 10px; background: rgba(69, 71, 90, 0.3); border-radius: 8px;">
        <span style="color: #e0e0e0; min-width: 80px;">Dexterity:</span>
        <div style="display: flex; gap: 10px; align-items: center;">
          <button class="stat-btn" onclick="allocateStatPoints('stamina', 1)" ${availablePoints < 1 ? 'disabled' : ''}
                  style="background: #f9e2af; color: #1e1e2e; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">+1</button>
          <button class="stat-btn" onclick="allocateStatPoints('stamina', 5)" ${availablePoints < 5 ? 'disabled' : ''}
                  style="background: #f9e2af; color: #1e1e2e; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">+5</button>
        </div>
      </div>
    `;

    statAllocationSection.appendChild(header);
    statAllocationSection.appendChild(content);

    header.addEventListener('click', function() {
      const isCollapsed = content.style.display === 'none';
      content.style.display = isCollapsed ? 'block' : 'none';
      const toggleIcon = document.getElementById('stat-toggle-icon');
      if (toggleIcon) {
        toggleIcon.textContent = isCollapsed ? '[–]' : '[+]';
      }
      extensionSettings.statAllocationCollapsed = !isCollapsed;
      saveSettings();
    });

    statsContainer.appendChild(statAllocationSection);
  }

  // Make debug function globally available for troubleshooting
  window.debugExtension = debugExtension;
  
  // Make new functions globally available for testing
  window.extractItemDataFromHTML = extractItemDataFromHTML;
  window.autoClickShowMore = autoClickShowMore;
  window.getAllConsumableItems = getAllConsumableItems;
  window.findItemByName = findItemByName;
  window.getStaminaPerHourFromTitle = getStaminaPerHourFromTitle;
  window.updateStaminaTimerDisplay = updateStaminaTimerDisplay;
  
  
  // Force apply filters function for testing - multiple ways to access
  const forceApplyFiltersFunction = function() {
    if (typeof applyMonsterFilters === 'function') {
      applyMonsterFilters();
      console.log('Filters reapplied');
    } else {
      console.log('applyMonsterFilters function not found');
    }
  };
  
  // Make it available in multiple ways
  window.forceApplyFilters = forceApplyFiltersFunction;
  if (typeof unsafeWindow !== 'undefined') {
    unsafeWindow.forceApplyFilters = forceApplyFiltersFunction;
  }
  console.forceApplyFilters = forceApplyFiltersFunction;
  
  // Debug function to test stamina calculation
  window.debugStaminaCalculation = function() {
    console.log('=== Debug Stamina Calculation ===');
    const staminaTimer = document.getElementById('stamina_timer');
    const title = staminaTimer ? staminaTimer.getAttribute('title') : 'Element not found';
    const extractedValue = getStaminaPerHourFromTitle();
    
    console.log('Stamina timer element:', staminaTimer ? 'Found' : 'Not found');
    console.log('Title attribute:', title);
    console.log('Extracted stamina per hour:', extractedValue);
    
    const staminaRateElement = document.getElementById('stamina-rate-display');
    if (staminaRateElement) {
      console.log('Rate display element text:', staminaRateElement.textContent);
    } else {
      console.log('Rate display element not found');
    }
    
    return {
      title: title,
      extractedStamina: extractedValue,
      hasRateElement: !!staminaRateElement
    };
  };

  // Script to remove specific <br> elements and attack text
  function cleanUpInterface() {
      // Remove "💥 Choose a Skill to Attack:" text and the <br> that follows it
      const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT
      );
      
      let node;
      while (node = walker.nextNode()) {
          if (node.nodeValue.includes('💥 Choose a Skill to Attack:')) {
              // Remove the text
              node.nodeValue = node.nodeValue.replace('💥 Choose a Skill to Attack:', '').trim();
              console.log('Removed attack text');
              
              // Find and remove the <br> element that follows this text
              let nextElement = node.nextSibling;
              while (nextElement) {
                  if (nextElement.nodeType === Node.ELEMENT_NODE && nextElement.tagName === 'BR') {
                      nextElement.remove();
                      console.log('Removed BR element after attack text');
                      break;
                  }
                  nextElement = nextElement.nextSibling;
              }
          }
      }
  }

  // Execute immediately
  cleanUpInterface();
  
  // Test function to extract items from current page
  window.testItemExtraction = async function() {
    console.log('Testing item extraction from current page...');
    const items = await getAllConsumableItems();
    console.log('Extracted items:', items);
    return items;
  };
  
  // Simple function that just fetches inventory without clicking show more
  window.getInventoryItemsSimple = async function() {
    console.log('Fetching inventory items (simple method)...');
    try {
      const response = await fetch('inventory.php');
      const html = await response.text();
      console.log('Fetched inventory HTML length:', html.length);
      const items = extractItemDataFromHTML(html);
      console.log(`Found ${items.length} items from fetched inventory`);
      return items;
      
    } catch (error) {
      console.error('Failed to fetch inventory page:', error);
      return [];
    }
  };

  // Function to extract stamina per hour from the server-calculated title
  function getStaminaPerHourFromTitle() {
    try {
      const staminaTimer = document.getElementById('stamina_timer');
      if (staminaTimer) {
        const title = staminaTimer.getAttribute('title') || '';
        const match = title.match(/Next \+(\d+)/);
        if (match) {
          return parseInt(match[1]);
        }
      }
      return null;
    } catch (error) {
      console.error('Error extracting stamina from title:', error);
      return null;
    }
  }

  // Function to calculate stamina per hour based on the formula: 40 + (level/50) + ((attack + defense)/100)
  async function calculateStaminaPerHour() {
    try {
      // Get level from the topbar
      const levelElement = document.querySelector('.gtb-level');
      let level = 0;
      if (levelElement) {
        const levelMatch = levelElement.textContent.match(/LV\s*(\d+)/);
        if (levelMatch) {
          level = parseInt(levelMatch[1]);
        }
      }

      // Get attack and defense - prioritize sidebar elements since they're cleanest
      let attack = 0;
      let defense = 0;
      
      // Method 1: Try sidebar elements first (cleanest data)
      const sidebarAttackElement = document.getElementById('sidebar-attack');
      const sidebarDefenseElement = document.getElementById('sidebar-defense');
      
      if (sidebarAttackElement && sidebarAttackElement.textContent !== '-') {
        attack = parseInt(sidebarAttackElement.textContent) || 0;
      }
      
      if (sidebarDefenseElement && sidebarDefenseElement.textContent !== '-') {
        defense = parseInt(sidebarDefenseElement.textContent) || 0;
      }

      // Method 2: If sidebar not available, try stats page elements and extract numbers
      if (attack === 0 || defense === 0) {
        const attackElement = document.getElementById('v-attack') || document.querySelector('[data-stat="attack"]');
        const defenseElement = document.getElementById('v-defense') || document.querySelector('[data-stat="defense"]');
        
        if (attack === 0 && attackElement) {
          // Extract numbers from the messy text content
          const attackMatch = attackElement.textContent.match(/(\d+)/);
          if (attackMatch) {
            attack = parseInt(attackMatch[1]) || 0;
          }
        }
        
        if (defense === 0 && defenseElement) {
          // Extract numbers from the messy text content  
          const defenseMatch = defenseElement.textContent.match(/(\d+)/);
          if (defenseMatch) {
            defense = parseInt(defenseMatch[1]) || 0;
          }
        }        
      }

      // Method 2: If we still don't have attack/defense, try AJAX call
      if (attack === 0 || defense === 0) {
        try {
          console.log('Trying AJAX for missing stats...');
          let response = await fetch('stats_ajax.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=get_stats'
          });
          
          if (!response.ok) {
            // Try alternative approach - allocate 0 points to get current stats
            response = await fetch('stats_ajax.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: 'action=allocate&stat=attack&amount=0'
            });
          }
          
          if (response.ok) {
            const text = await response.text();
            console.log('AJAX response received, length:', text.length);
            
            try {
              const data = JSON.parse(text);
              if (data && data.user) {
                if (attack === 0) attack = parseInt(data.user.ATTACK || data.user.attack) || 0;
                if (defense === 0) defense = parseInt(data.user.DEFENSE || data.user.defense) || 0;
                console.log('AJAX stats found:', { attack, defense });
              }
            } catch (parseError) {
              console.error('Error parsing AJAX response:', parseError);
            }
          }
        } catch (ajaxError) {
          console.error('AJAX request failed:', ajaxError);
        }
      }

      // Calculate stamina per hour using the formula: 40 + (level/50) + ((attack + defense)/100)
      const staminaPerHour = Math.round(40 + (level / 50) + ((attack + defense) / 100));
      
      return { level, attack, defense, staminaPerHour };
    } catch (error) {
      console.error('Error calculating stamina per hour:', error);
      return { level: 0, attack: 0, defense: 0, staminaPerHour: 49 }; // Default fallback values
    }
  }

  // Function to update the stamina timer display with the server-calculated amount
  function updateStaminaTimerDisplay() {
    try {
      const staminaTimer = document.getElementById('stamina_timer');
      if (staminaTimer) {
        const staminaPerHour = getStaminaPerHourFromTitle();
        
        if (staminaPerHour) {
          // Check if value has changed since last update
          const lastValue = updateStaminaTimerDisplay.lastValue || 0;
          
          if (lastValue !== staminaPerHour) {
            // Find or create the stamina rate display element
            let staminaRateElement = document.getElementById('stamina-rate-display');
            
            if (!staminaRateElement) {
              // Create the new element if it doesn't exist
              staminaRateElement = document.createElement('span');
              staminaRateElement.id = 'stamina-rate-display';
              staminaRateElement.className = 'gtb-timer';
              staminaRateElement.style.marginRight = '5px'; // Add some spacing
              
              // Insert it before the existing stamina timer
              staminaTimer.parentNode.insertBefore(staminaRateElement, staminaTimer);
            }
            
            // Update the stamina rate display
            staminaRateElement.textContent = `+${staminaPerHour}/h`;
            
            // Store current value and log the update
            updateStaminaTimerDisplay.lastValue = staminaPerHour;
            console.log(`Updated stamina per hour: +${staminaPerHour}/h (from server calculation)`);
          }
        }
      }
    } catch (error) {
      console.error('Error updating stamina timer display:', error);
    }
  }

  // Function to initialize stamina per hour functionality
  function initStaminaPerHourCalculation() {
    // Update stamina display immediately
    updateStaminaTimerDisplay();
    
    // Set up interval to update every 60 seconds (less frequent since it rarely changes)
    setInterval(() => {
      updateStaminaTimerDisplay();
    }, 60000);
    
    // Simple mutation observer to watch only for title attribute changes
    const observer = new MutationObserver(() => {
      updateStaminaTimerDisplay();
    });
    
    // Observe only the stamina timer element for title attribute changes
    const staminaTimer = document.getElementById('stamina_timer');
    
    if (staminaTimer) {
      observer.observe(staminaTimer, { 
        attributes: true, 
        attributeFilter: ['title'] 
      });
      console.log('Stamina per hour calculation initialized - watching server values');
    } else {
      // If element not found immediately, try again in 1 second
      setTimeout(() => {
        const retryTimer = document.getElementById('stamina_timer');
        if (retryTimer) {
          observer.observe(retryTimer, { 
            attributes: true, 
            attributeFilter: ['title'] 
          });
          updateStaminaTimerDisplay();
          console.log('Stamina per hour calculation initialized (retry) - watching server values');
        }
      }, 1000);
    }
  }
  function initDungeonPageTransformation() {
    // Only run on dungeon pages
    if (!window.location.pathname.includes('guild_dungeon')) {
      return;
    }

    console.log('Initializing dungeon page transformation...');

    // Add custom styles for dungeon pages
    const dungeonStyle = document.createElement('style');
    dungeonStyle.id = 'dungeon-transformation-styles';
    dungeonStyle.textContent = `
      /* Full page background */
      body.dungeon-transformed {
        background-size: cover !important;
        background-position: center !important;
        background-repeat: no-repeat !important;
        background-attachment: fixed !important;
        position: relative;
      }

      /* Dark overlay for readability */
      body.dungeon-transformed::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.65);
        z-index: -1;
        pointer-events: none;
      }

      /* Collapsible leaderboard panel */
      .leaderboard-sidebar {
        position: fixed;
        top: 74px;
        right: 0;
        width: 350px;
        height: calc(100vh - 74px);
        background: rgba(26, 27, 37, 0.92);
        backdrop-filter: blur(10px);
        border-left: 2px solid rgba(255, 211, 105, 0.3);
        box-shadow: -5px 0 25px rgba(0, 0, 0, 0.5);
        overflow-y: auto;
        z-index: 999;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        padding: 20px;
      }

      .leaderboard-sidebar.collapsed {
        transform: translateX(100%);
      }

      /* Toggle button */
      .leaderboard-toggle {
        position: fixed;
        top: 50%;
        right: 350px;
        transform: translateY(-50%);
        background: rgba(26, 27, 37, 0.95);
        border: 2px solid rgba(255, 211, 105, 0.4);
        border-right: none;
        color: #FFD369;
        padding: 15px 8px;
        cursor: pointer;
        font-size: 18px;
        border-radius: 8px 0 0 8px;
        z-index: 1000;
        transition: all 0.3s ease;
        box-shadow: -3px 0 15px rgba(0, 0, 0, 0.4);
        writing-mode: vertical-rl;
        text-orientation: mixed;
      }

      .leaderboard-toggle:hover {
        background: rgba(26, 27, 37, 1);
        border-color: rgba(255, 211, 105, 0.6);
        box-shadow: -5px 0 20px rgba(0, 0, 0, 0.6);
      }

      .leaderboard-toggle.collapsed {
        right: 0;
        border-left: 2px solid rgba(255, 211, 105, 0.4);
        border-right: none;
        border-radius: 8px 0 0 8px;
      }

      /* Arrow rotation */
      .leaderboard-toggle .arrow {
        transition: transform 0.3s ease;
        display: inline-block;
      }

      .leaderboard-toggle.collapsed .arrow {
        transform: rotate(180deg);
      }

      /* Adjust main content when sidebar is visible */
      body.dungeon-transformed .wrap {
        margin-right: 370px;
        transition: margin-right 0.3s ease;
        max-width: none !important;
      }

      body.dungeon-transformed .wrap.sidebar-collapsed {
        margin-right: 0;
      }

      /* Remove grid restrictions */
      body.dungeon-transformed .grid {
        display: block !important;
        grid-template-columns: none !important;
      }

      /* Enhanced leaderboard styling */
      .leaderboard-sidebar .h {
        color: #FFD369;
        font-size: 22px;
        margin-bottom: 15px;
        text-align: center;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        border-bottom: 2px solid rgba(255, 211, 105, 0.3);
        padding-bottom: 10px;
      }

      .leaderboard-sidebar .lb-row {
        background: rgba(18, 21, 34, 0.6);
        margin: 8px 0;
        padding: 10px;
        border-radius: 8px;
        border: 1px solid rgba(35, 36, 55, 0.8);
        transition: all 0.2s ease;
      }

      .leaderboard-sidebar .lb-row:hover {
        background: rgba(18, 21, 34, 0.9);
        border-color: rgba(255, 211, 105, 0.4);
        transform: translateX(-5px);
      }

      /* Scrollbar styling */
      .leaderboard-sidebar::-webkit-scrollbar {
        width: 8px;
      }

      .leaderboard-sidebar::-webkit-scrollbar-track {
        background: rgba(18, 21, 34, 0.5);
        border-radius: 4px;
      }

      .leaderboard-sidebar::-webkit-scrollbar-thumb {
        background: rgba(255, 211, 105, 0.4);
        border-radius: 4px;
      }

      .leaderboard-sidebar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 211, 105, 0.6);
      }

      /* Monster section organization */
      .monster-section {
        margin-bottom: 30px;
        background: rgba(30, 30, 46, 0.5);
        border-radius: 8px;
        overflow: hidden;
        width: 100%;
      }

      .monster-section-header {
        display: flex;
        align-items: center;
        padding: 15px 20px;
        background: rgba(203, 166, 247, 0.1);
        cursor: pointer;
        border-bottom: 1px solid rgba(88, 91, 112, 0.3);
      }

      .monster-section-header:hover {
        background: rgba(203, 166, 247, 0.15);
      }

      .section-toggle-btn {
        background: none;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #e0e0e0;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        min-width: 24px;
      }

      .section-toggle-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .monster-section-content {
        padding: 15px 20px;
      }

      .monster-section-content.collapsed {
        display: none;
      }

      /* Monster card styling - FULL WIDTH FLOW */
      .dungeon-monster-container {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        width: 100%;
        max-width: none !important;
      }

      .dungeon-monster-card {
        background: rgba(30, 30, 46, 0.9);
        border-radius: 12px;
        width: 250px;
        flex: 0 0 250px;
        padding: 16px;
        text-align: center;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        border: 1px solid rgba(35, 36, 55, 0.9);
      }

      .dungeon-monster-card:hover {
        transform: scale(1.02);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      }

      .dungeon-monster-card.monster-dead {
        opacity: 0.7;
      }

      .dungeon-monster-card h3 {
        color: #f39c12;
        font-size: 18px;
        margin: 10px 0;
        min-height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .dungeon-monster-img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        border: 2px solid rgba(255, 211, 105, 0.3);
      }

      .dungeon-monster-img.grayscale {
        filter: grayscale(100%);
      }

      .dungeon-monster-card .dungeon-hp-bar {
        background: #333;
        height: 16px;
        border-radius: 10px;
        overflow: hidden;
        margin: 8px 0;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .dungeon-monster-card .dungeon-hp-fill {
        height: 100%;
        background: linear-gradient(to right, #55ff55, #00cc00);
        transition: width 0.3s ease;
      }

      .dungeon-monster-card .dungeon-join-btn {
        background: #3498db;
        border: none;
        color: #fff;
        padding: 10px 14px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        transition: all 0.2s ease;
        width: 100%;
      }

      .dungeon-monster-card .dungeon-join-btn:hover {
        background: #2980b9;
        transform: translateY(-2px);
      }

      .dungeon-monster-card .dungeon-btn {
        margin: 0;
        padding: 10px 14px;
        background: #6c7086;
        color: #fff;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
        transition: all 0.2s ease;
      }

      .dungeon-monster-card .dungeon-btn:hover {
        background: #7c8096;
        transform: translateY(-2px);
      }

      /* Mobile responsiveness */
      @media (max-width: 900px) {
        .leaderboard-sidebar {
          width: 280px;
        }

        .leaderboard-toggle {
          right: 280px;
        }

        .leaderboard-toggle.collapsed {
          right: 0;
        }

        body.dungeon-transformed .wrap {
          margin-right: 300px;
        }

        .dungeon-monster-card {
          width: 220px;
        }
      }

      @media (max-width: 600px) {
        .leaderboard-sidebar {
          width: 100%;
          max-width: 320px;
        }

        .leaderboard-toggle {
          right: 100%;
          max-width: 320px;
        }

        body.dungeon-transformed .wrap {
          margin-right: 0;
        }

        body.dungeon-transformed .wrap.sidebar-visible {
          display: none;
        }

        .dungeon-monster-card {
          width: 90%;
        }
      }

      /* Filter controls */
      .dungeon-filter-controls {
        background: rgba(30, 30, 46, 0.95);
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 20px;
        border: 1px solid rgba(88, 91, 112, 0.5);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .dungeon-filter-row {
        display: flex;
        gap: 15px;
        align-items: center;
        flex-wrap: wrap;
        margin-bottom: 15px;
      }

      .dungeon-filter-row:last-child {
        margin-bottom: 0;
      }

      .dungeon-filter-group {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .dungeon-filter-group label {
        color: #cdd6f4;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
      }

      .dungeon-search-input {
        flex: 1;
        min-width: 200px;
        padding: 8px 12px;
        border: 1px solid rgba(88, 91, 112, 0.5);
        border-radius: 6px;
        background: rgba(17, 17, 27, 0.8);
        color: #cdd6f4;
        font-size: 14px;
        transition: all 0.2s ease;
      }

      .dungeon-search-input:focus {
        outline: none;
        border-color: #89b4fa;
        box-shadow: 0 0 0 2px rgba(137, 180, 250, 0.2);
      }

      .dungeon-search-input::placeholder {
        color: #6c7086;
      }

      .dungeon-toggle-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: rgba(137, 180, 250, 0.2);
        border: 1px solid rgba(137, 180, 250, 0.4);
        color: #89b4fa;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
        white-space: nowrap;
      }

      .dungeon-toggle-btn:hover {
        background: rgba(137, 180, 250, 0.3);
        border-color: rgba(137, 180, 250, 0.6);
      }

      .dungeon-toggle-btn.active {
        background: rgba(137, 180, 250, 0.4);
        border-color: #89b4fa;
      }

      .dungeon-view-toggle {
        display: flex;
        gap: 8px;
        background: rgba(17, 17, 27, 0.6);
        padding: 4px;
        border-radius: 8px;
        border: 1px solid rgba(88, 91, 112, 0.5);
      }

      .dungeon-view-btn {
        padding: 8px 16px;
        background: transparent;
        border: none;
        color: #6c7086;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .dungeon-view-btn:hover {
        color: #cdd6f4;
        background: rgba(88, 91, 112, 0.3);
      }

      .dungeon-view-btn.active {
        background: rgba(137, 180, 250, 0.2);
        color: #89b4fa;
        border: 1px solid rgba(137, 180, 250, 0.4);
      }

      /* List view styles */
      .dungeon-monster-container.list-view {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .dungeon-monster-container.list-view .dungeon-monster-card {
        width: 100%;
        max-width: none;
        flex: none;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 20px;
        padding: 16px 20px;
        text-align: left;
      }

      .dungeon-monster-container.list-view .dungeon-monster-img {
        width: 80px;
        height: 80px;
        object-fit: cover;
        flex-shrink: 0;
      }

      .dungeon-monster-container.list-view .dungeon-monster-card h3 {
        min-height: auto;
        justify-content: flex-start;
        margin: 0;
        font-size: 18px;
      }

      .dungeon-monster-container.list-view .dungeon-monster-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .dungeon-monster-container.list-view .dungeon-hp-bar {
        max-width: 300px;
      }

      .dungeon-monster-container.list-view .dungeon-stats-container {
        justify-content: flex-start;
        max-width: 400px;
      }

      .dungeon-monster-container.list-view .dungeon-monster-card > div:last-child {
        margin-top: 0;
        margin-left: auto;
        flex-shrink: 0;
      }

      /* Hide images styles */
      .dungeon-monster-container.hide-images .dungeon-monster-img {
        display: none;
      }

      .dungeon-monster-container.hide-images.list-view .dungeon-monster-card {
        padding-left: 20px;
      }

      /* No results message */
      .dungeon-no-results {
        text-align: center;
        padding: 40px;
        color: #6c7086;
        font-size: 16px;
      }
    `;
    document.head.appendChild(dungeonStyle);

    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', transformDungeonPage);
    } else {
      transformDungeonPage();
    }
  }

  function transformDungeonPage() {
    // Find the banner image panel (optional)
    const panels = document.querySelectorAll('.panel');
    let bannerPanel = null;
    let bannerImage = null;

    for (let panel of panels) {
      const img = panel.querySelector('.loc-banner');
      if (img) {
        bannerPanel = panel;
        bannerImage = img.src;
        break;
      }
    }

    // Set background image if banner found
    if (bannerPanel && bannerImage) {
      document.body.style.backgroundImage = `url('${bannerImage}')`;
      document.body.classList.add('dungeon-transformed');
      // Remove the banner panel
      bannerPanel.remove();
    }

    // Transform monster cards (always run this)
    transformDungeonMonsterCards();

    // Find leaderboard in right column
    const grid = document.querySelector('.grid');
    if (!grid) return;

    const rightColumn = grid.children[1];
    if (!rightColumn) return;

    // Find all panels in right column
    const rightPanels = rightColumn.querySelectorAll('.panel');
    let leaderboardPanel = null;

    for (let panel of rightPanels) {
      if (panel.textContent.includes('Leaderboard') ||
          panel.textContent.includes('Top Players') ||
          panel.querySelector('.lb-row')) {
        leaderboardPanel = panel;
        break;
      }
    }

    if (!leaderboardPanel) {
      console.log('Leaderboard panel not found');
      return;
    }

    // Create sidebar container
    const sidebar = document.createElement('div');
    sidebar.className = 'leaderboard-sidebar';
    sidebar.innerHTML = leaderboardPanel.innerHTML;

    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'leaderboard-toggle';
    toggleBtn.innerHTML = '<span class="arrow">▶</span>';
    toggleBtn.setAttribute('aria-label', 'Toggle Leaderboard');

    // Get main wrap element
    const wrap = document.querySelector('.wrap');

    // Toggle functionality
    let isCollapsed = false;
    toggleBtn.addEventListener('click', () => {
      isCollapsed = !isCollapsed;

      if (isCollapsed) {
        sidebar.classList.add('collapsed');
        toggleBtn.classList.add('collapsed');
        if (wrap) wrap.classList.add('sidebar-collapsed');
      } else {
        sidebar.classList.remove('collapsed');
        toggleBtn.classList.remove('collapsed');
        if (wrap) wrap.classList.remove('sidebar-collapsed');
      }
      
      // Save state
      localStorage.setItem('dungeon-leaderboard-collapsed', isCollapsed);
    });

    // Remove original leaderboard panel
    leaderboardPanel.remove();

    // If right column is now empty, adjust grid
    if (rightColumn.children.length === 0) {
      grid.style.gridTemplateColumns = '1fr';
    }

    // Add to page
    document.body.appendChild(sidebar);
    document.body.appendChild(toggleBtn);

    // Restore saved state
    const savedState = localStorage.getItem('dungeon-leaderboard-collapsed');
    if (savedState === 'true') {
      isCollapsed = true;
      sidebar.classList.add('collapsed');
      toggleBtn.classList.add('collapsed');
      if (wrap) wrap.classList.add('sidebar-collapsed');
    }
  }

  function transformDungeonMonsterCards() {
    // Find all monster entries
    const monsters = document.querySelectorAll('.mon');

    if (monsters.length === 0) return;

    // Group monsters by state
    const lootable = [];
    const joinable = [];
    const continuing = [];
    const completed = [];

    monsters.forEach(mon => {
      const pills = mon.querySelectorAll('.pill');
      const isDead = mon.classList.contains('dead');
      const isJoined = Array.from(pills).some(p => p.textContent.trim() === 'joined');
      const hasLoot = Array.from(pills).some(p => p.textContent.trim() === 'looted');

      if (isDead && isJoined && !hasLoot) {
        lootable.push(mon);
      } else if (!isDead && !isJoined) {
        joinable.push(mon);
      } else if (!isDead && isJoined) {
        continuing.push(mon);
      } else {
        completed.push(mon);
      }
    });

    // Create filter controls
    const filterControls = document.createElement('div');
    filterControls.className = 'dungeon-filter-controls';
    filterControls.innerHTML = `
      <div class="dungeon-filter-row">
        <div class="dungeon-filter-group" style="flex: 1;">
          <label for="dungeon-search">🔍 Search:</label>
          <input 
            type="text" 
            id="dungeon-search" 
            class="dungeon-search-input" 
            placeholder="Search by monster name..."
          />
        </div>
        <div class="dungeon-filter-group">
          <div style="position: relative; display: inline-block;">
            <button id="dungeon-monster-type-toggle" style="padding: 5px 10px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; cursor: pointer; min-width: 120px; text-align: left;">
              Monster Types ▼
            </button>
            <div id="dungeon-monster-type-dropdown" style="display: none; position: absolute; top: 100%; left: 0; background: #1e1e2e; border: 1px solid #45475a; border-radius: 4px; padding: 10px; z-index: 1000; min-width: 200px; max-height: 200px; overflow-y: auto;">
              <div style="margin-bottom: 8px; font-weight: bold; color: #cba6f7; border-bottom: 1px solid #45475a; padding-bottom: 5px;">Dungeon Monster Types</div>
              <label style="display: block; margin: 3px 0; color: #cdd6f4; font-size: 12px;">
                  <input type="checkbox" value="orc" class="dungeon-monster-type-checkbox cyberpunk-checkbox"> Orc
              </label>
              <label style="display: block; margin: 3px 0; color: #cdd6f4; font-size: 12px;">
                  <input type="checkbox" value="warchief" class="dungeon-monster-type-checkbox cyberpunk-checkbox"> Warchief
              </label>
              <label style="display: block; margin: 3px 0; color: #cdd6f4; font-size: 12px;">
                  <input type="checkbox" value="king" class="dungeon-monster-type-checkbox cyberpunk-checkbox"> King
              </label>
              <div style="margin-top: 8px; padding-top: 5px; border-top: 1px solid #45475a;">
                <button id="dungeon-select-all-monsters" style="padding: 3px 8px; background: #a6e3a1; color: #1e1e2e; border: none; border-radius: 3px; cursor: pointer; font-size: 11px; margin-right: 5px;">Select All</button>
                <button id="dungeon-clear-monsters" style="padding: 3px 8px; background: #f38ba8; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">Clear</button>
              </div>
            </div>
          </div>
        </div>
        <div class="dungeon-filter-group">
          <select id="dungeon-hp-filter" style="padding: 5px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; min-width: 100px;">
            <option value="">All HP</option>
            <option value="low">Low HP (&lt;50%)</option>
            <option value="medium">Medium HP (50-80%)</option>
            <option value="high">High HP (&gt;80%)</option>
            <option value="full">Full HP (100%)</option>
          </select>
        </div>
        <div class="dungeon-filter-group">
          <select id="dungeon-player-count-filter" style="padding: 5px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; min-width: 100px;">
            <option value="">All Players</option>
            <option value="empty">Empty (0 players)</option>
            <option value="few">Few (&lt;2 players)</option>
            <option value="many">Many (&gt;2 players)</option>
            <option value="full">Full (4 players)</option>
          </select>
        </div>
        <div class="dungeon-filter-group">
          <select id="dungeon-sort" style="padding: 5px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; min-width: 120px;">
            <option value="">Default Order</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="hp-asc">HP (Low to High)</option>
            <option value="hp-desc">HP (High to Low)</option>
            <option value="players-asc">Players (Few to Many)</option>
            <option value="players-desc">Players (Many to Few)</option>
            <option value="status">Status (Available First)</option>
          </select>
        </div>
      </div>
      <div class="dungeon-filter-row">
        <button class="dungeon-toggle-btn" id="dungeon-hide-images-btn">
          <span>🖼️</span>
          <span>Hide Images</span>
        </button>
        <button class="dungeon-toggle-btn" id="dungeon-loot-all-btn" style="background: rgba(255, 211, 105, 0.2); border-color: rgba(255, 211, 105, 0.4); color: #ffd369;">
          <span>💰</span>
          <span>Loot All (<span id="dungeon-loot-count">0</span>)</span>
        </button>
        <div class="dungeon-view-toggle">
          <button class="dungeon-view-btn active" data-view="grid">
            <span>⊞</span>
            <span>Grid</span>
          </button>
          <button class="dungeon-view-btn" data-view="list">
            <span>☰</span>
            <span>List</span>
          </button>
        </div>
      </div>
    `;

    // Create main container
    const mainContainer = document.createElement('div');
    mainContainer.className = 'dungeon-monster-container';
    mainContainer.style.display = 'block';

    // Create sections
    if (lootable.length > 0) {
      mainContainer.appendChild(createDungeonSection('💰 Available Loot', lootable, 'loot', false));
    }

    if (continuing.length > 0) {
      mainContainer.appendChild(createDungeonSection('⚔️ Continue Battle', continuing, 'continue', false));
    }

    if (joinable.length > 0) {
      mainContainer.appendChild(createDungeonSection('🆕 Join a Battle', joinable, 'join', false));
    }

    if (completed.length > 0) {
      mainContainer.appendChild(createDungeonSection('✅ Completed', completed, 'completed', false));
    }

    // Find the monsters panel and replace it completely
    const panels = document.querySelectorAll('.panel');
    let monstersPanel = null;

    for (let panel of panels) {
      if (panel.textContent.includes('Monsters in this location') ||
          panel.querySelector('.mon')) {
        monstersPanel = panel;
        break;
      }
    }

    if (monstersPanel) {
      // Insert filter controls first
      monstersPanel.parentNode.insertBefore(filterControls, monstersPanel);
      // Insert the new container
      monstersPanel.parentNode.insertBefore(mainContainer, monstersPanel);
      // Remove the old panel
      monstersPanel.remove();
    }

    // Initialize filter functionality
    initDungeonFilters(mainContainer);
  }

  function createDungeonSection(title, monsters, id, collapsed) {
    const section = document.createElement('div');
    section.className = 'monster-section';

    const header = document.createElement('div');
    header.className = 'monster-section-header';

    const titleElement = document.createElement('h3');
    titleElement.style.cssText = 'margin: 0; flex: 1;';
    titleElement.textContent = `${title} (${monsters.length})`;

    // Color based on section type
    if (id === 'loot') titleElement.style.color = '#f9e2af';
    else if (id === 'join') titleElement.style.color = '#a6e3a1';
    else if (id === 'continue') titleElement.style.color = '#89dceb';
    else titleElement.style.color = '#6c7086';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'section-toggle-btn';
    toggleBtn.textContent = collapsed ? '+' : '−';
    toggleBtn.onclick = () => {
      content.classList.toggle('collapsed');
      toggleBtn.textContent = content.classList.contains('collapsed') ? '+' : '−';
    };

    header.appendChild(titleElement);
    header.appendChild(toggleBtn);

    const content = document.createElement('div');
    content.className = 'monster-section-content';
    if (collapsed) content.classList.add('collapsed');

    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'dungeon-monster-container';
    cardsContainer.style.display = 'flex';

    monsters.forEach(mon => {
      const card = createDungeonMonsterCard(mon);
      if (card) {
        cardsContainer.appendChild(card);
      }
    });

    content.appendChild(cardsContainer);
    section.appendChild(header);
    section.appendChild(content);

    return section;
  }

  function createDungeonMonsterCard(monElement) {
    // Extract data from original element
    const img = monElement.querySelector('img');
    const nameElement = monElement.querySelector('[style*="font-weight:700"]');
    const hpElement = monElement.querySelector('.muted');
    const pills = monElement.querySelectorAll('.pill');
    const statpills = monElement.querySelectorAll('.statpill');
    const viewLink = monElement.querySelector('a[href*="battle"]');

    if (!img || !nameElement) return null;

    // Get monster state
    const isDead = monElement.classList.contains('dead');
    const isJoined = Array.from(pills).some(p => p.textContent.trim() === 'joined');
    const hasLoot = Array.from(pills).some(p => p.textContent.trim() === 'looted');

    // Extract name (remove pill texts)
    let monsterName = nameElement.textContent;
    // Remove all status-related text from the name
    monsterName = monsterName.replace(/\b(not joined|joined|no loot|looted|dead)\b/gi, '').trim();
    // Also remove any remaining "not" that might be orphaned
    monsterName = monsterName.replace(/\bnot\b/gi, '').trim();

    // Extract HP
    const hpText = hpElement ? hpElement.textContent.trim() : '0 / 0 HP';
    const hpMatch = hpText.match(/(\d[\d,]*)\s*\/\s*(\d[\d,]*)/);
    const currentHP = hpMatch ? parseInt(hpMatch[1].replace(/,/g, '')) : 0;
    const maxHP = hpMatch ? parseInt(hpMatch[2].replace(/,/g, '')) : 1;
    const hpPercent = (currentHP / maxHP) * 100;

    // Extract stats
    const stats = {};
    statpills.forEach(pill => {
      const key = pill.querySelector('.k')?.textContent.trim();
      const val = pill.querySelector('.v')?.textContent.trim();
      if (key && val) {
        stats[key] = val;
      }
    });

    // Extract players joined
    let playersJoined = 0;
    let playersMax = 4; // default for dungeon
    const allText = monElement.textContent;
    const playersMatch = allText.match(/Players?\s*Joined?\s*(\d+)\/(\d+)/i) || allText.match(/(\d+)\/(\d+)\s*players?/i);
    if (playersMatch) {
      playersJoined = parseInt(playersMatch[1]);
      playersMax = parseInt(playersMatch[2]);
    }

    // If not found in text, try to fetch from battle page
    if (playersJoined === 0 && viewLink) {
      const battleUrl = viewLink.href;
      fetch(battleUrl)
        .then(response => response.text())
        .then(text => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'text/html');
          // Look for leaderboard rows
          const lbRows = doc.querySelectorAll('.lb-row');
          if (lbRows.length > 0) {
            playersJoined = lbRows.length;
            playersValSpan.textContent = playersJoined >= 25 ? "25+" : `${playersJoined}`;
          }
        })
        .catch(err => console.warn('Failed to fetch dungeon battle page for players count:', err));
    }

    // Create card
    const card = document.createElement('div');
    card.className = 'dungeon-monster-card';
    if (isDead) {
      card.classList.add('monster-dead');
    }

    // Monster image
    const cardImg = document.createElement('img');
    cardImg.src = img.src;
    cardImg.className = 'dungeon-monster-img';
    cardImg.alt = monsterName;
    if (isDead) {
      cardImg.classList.add('grayscale');
    }

    // Monster name
    const title = document.createElement('h3');
    title.textContent = monsterName;

    // HP bar
    const hpBar = document.createElement('div');
    hpBar.className = 'dungeon-hp-bar';
    const hpFill = document.createElement('div');
    hpFill.className = 'dungeon-hp-fill';
    hpFill.style.width = `${hpPercent}%`;
    hpBar.appendChild(hpFill);

    // HP text
    const hpTextDiv = document.createElement('div');
    hpTextDiv.textContent = `❤️ ${currentHP.toLocaleString()} / ${maxHP.toLocaleString()} HP`;
    hpTextDiv.style.fontSize = '14px';
    hpTextDiv.style.marginTop = '8px';

    // Stats display with damage and EXP pills
    const statsDiv = document.createElement('div');
    statsDiv.className = 'dungeon-stats-container';
    statsDiv.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; justify-content: center;';

    // Add damage pill if damage pills are enabled
    if (extensionSettings.dungeonWave.showDamagePills) {
      // Calculate expected damage based on monster HP
      const expectedDamage = calculateExpectedDamage(currentHP, maxHP);
      const damagePill = document.createElement('span');
      damagePill.className = 'dungeon-stat-pill damage-pill';
      damagePill.style.cssText = 'background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; padding: 4px 8px; border-radius: 4px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;';
      damagePill.innerHTML = `
        <span style="font-weight: 600;">⚔️ DMG</span>
        <span style="color: #f87171;">${expectedDamage.toLocaleString()}</span>
      `;
      statsDiv.appendChild(damagePill);

      // Add EXP pill
      const expectedExp = calculateExpectedExp(currentHP, maxHP);
      const expPill = document.createElement('span');
      expPill.className = 'dungeon-stat-pill exp-pill';
      expPill.style.cssText = 'background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); color: #22c55e; padding: 4px 8px; border-radius: 4px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;';
      expPill.innerHTML = `
        <span style="font-weight: 600;">⭐ EXP</span>
        <span style="color: #4ade80;">${expectedExp.toLocaleString()}</span>
      `;
      statsDiv.appendChild(expPill);
    }

    if (Object.keys(stats).length > 0) {
      Object.entries(stats).forEach(([key, value]) => {
        const statPill = document.createElement('span');
        statPill.className = 'dungeon-stat-pill';
        statPill.style.cssText = 'background: rgba(137, 180, 250, 0.15); border: 1px solid rgba(137, 180, 250, 0.3); color: #89b4fa; padding: 4px 8px; border-radius: 4px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;';

        const keySpan = document.createElement('span');
        keySpan.style.fontWeight = '600';
        keySpan.textContent = key;

        const valSpan = document.createElement('span');
        valSpan.style.color = '#cdd6f4';
        valSpan.textContent = value;

        statPill.appendChild(keySpan);
        statPill.appendChild(valSpan);
        statsDiv.appendChild(statPill);
      });
    }

    // Add players pill with zero joined display
    const playersPill = document.createElement('span');
    playersPill.className = 'dungeon-stat-pill players-pill';
    playersPill.style.cssText = 'background: rgba(76, 175, 80, 0.15); border: 1px solid rgba(76, 175, 80, 0.3); color: #4CAF50; padding: 4px 8px; border-radius: 4px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;';

    const playersKeySpan = document.createElement('span');
    playersKeySpan.style.fontWeight = '600';
    playersKeySpan.textContent = '👥 Joined';

    const playersValSpan = document.createElement('span');
    playersValSpan.style.color = '#cdd6f4';
    // Show "0 joined" if no players and zero joined display is enabled
    if (playersJoined === 0 && extensionSettings.dungeonWave.showZeroJoined) {
      playersValSpan.textContent = '0 joined';
      playersPill.style.background = 'rgba(107, 114, 128, 0.15)';
      playersPill.style.borderColor = 'rgba(107, 114, 128, 0.3)';
      playersPill.style.color = '#6b7280';
    } else {
      playersValSpan.textContent = `${playersJoined}/${playersMax}`;
    }

    playersPill.appendChild(playersKeySpan);
    playersPill.appendChild(playersValSpan);
    statsDiv.appendChild(playersPill);

    // Action buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.style.display = 'flex';
    actionsDiv.style.gap = '8px';
    actionsDiv.style.marginTop = '12px';

    // Determine which buttons to show based on state
    if (isDead && !isJoined) {
      // Not joined and dead - only view button
      const viewBtn = document.createElement('a');
      viewBtn.href = viewLink ? viewLink.href : '#';
      viewBtn.className = 'dungeon-btn';
      viewBtn.style.flex = '1';
      viewBtn.style.textAlign = 'center';
      viewBtn.style.textDecoration = 'none';
      viewBtn.innerHTML = '👁️ View';
      actionsDiv.appendChild(viewBtn);
    } else if (isDead && isJoined && !hasLoot) {
      // Joined, dead, not looted - loot + view buttons
      const lootBtn = document.createElement('button');
      lootBtn.className = 'dungeon-join-btn';
      lootBtn.style.flex = '1';
      lootBtn.style.background = '#ffd369';
      lootBtn.style.color = '#1e1e2e';
      lootBtn.innerHTML = '💰 Loot';

      const battleHref = viewLink ? viewLink.href : '#';

      lootBtn.onclick = async (e) => {
        e.preventDefault();

        // Extract monster ID from the link
        const urlParams = new URLSearchParams(battleHref.split('?')[1]);
        const monsterId = urlParams.get('dgmid');

        if (!monsterId) {
          showNotification('Invalid monster ID', 'error');
          return;
        }

        // Initialize user data if needed
        if (!userData.userID) {
          initUserData();
        }

        lootBtn.disabled = true;
        lootBtn.innerHTML = '⏳ Looting...';

        try {
          // Use the handleLoot function for instant looting
          await handleLoot(monsterId, monsterName, lootBtn);

          // After successful loot, update the card
          cardImg.classList.add('grayscale');
          card.classList.add('monster-dead');
          card._hasLoot = true;

          // Wait longer before moving to completed section to allow viewing loot modal
          setTimeout(() => {
            moveDungeonCardToSection(card, 'completed');
          }, 3000);

        } catch (error) {
          console.error('Loot error:', error);
          showNotification('Error looting', 'error');
          lootBtn.disabled = false;
          lootBtn.innerHTML = '💰 Loot';
        }
      };

      actionsDiv.appendChild(lootBtn);

      const viewBtn = document.createElement('a');
      viewBtn.href = battleHref;
      viewBtn.className = 'dungeon-btn';
      viewBtn.style.flex = '1';
      viewBtn.style.textAlign = 'center';
      viewBtn.style.textDecoration = 'none';
      viewBtn.innerHTML = '👁️ View';
      actionsDiv.appendChild(viewBtn);
    } else if (isDead && isJoined && hasLoot) {
      // Already looted - just view
      const viewBtn = document.createElement('a');
      viewBtn.href = viewLink ? viewLink.href : '#';
      viewBtn.className = 'dungeon-btn';
      viewBtn.style.flex = '1';
      viewBtn.style.textAlign = 'center';
      viewBtn.style.textDecoration = 'none';
      viewBtn.innerHTML = '👁️ View';
      actionsDiv.appendChild(viewBtn);
    } else if (!isDead && isJoined) {
      // Alive and joined - continue + view buttons
      const continueBtn = document.createElement('button');
      continueBtn.className = 'dungeon-join-btn';
      continueBtn.style.flex = '1';
      continueBtn.style.background = '#ffd369';
      continueBtn.style.color = '#1e1e2e';
      continueBtn.innerHTML = '⚔️ Continue';
      continueBtn.onclick = () => {
        window.location.href = viewLink ? viewLink.href : '#';
      };
      actionsDiv.appendChild(continueBtn);

    } else if (!isDead && !isJoined) {
      // Alive and not joined - join + view buttons
      const joinBtn = document.createElement('button');
      joinBtn.className = 'dungeon-join-btn';
      joinBtn.style.flex = '1';
      joinBtn.innerHTML = '⚔️ Insta Join';

      // Store the battle link for later use
      const battleHref = viewLink ? viewLink.href : '#';

      joinBtn.onclick = async (e) => {
        e.preventDefault();

        // Extract monster ID from the link
        const urlParams = new URLSearchParams(battleHref.split('?')[1]);
        const monsterId = urlParams.get('id');

        if (!monsterId) {
          showNotification('Invalid monster ID', 'error');
          return;
        }

        // Join the battle
        joinBtn.disabled = true;
        joinBtn.innerHTML = '⏳ Joining...';

        try {
          const { status, text } = await postAction('user_join_battle.php', {
            monster_id: monsterId,
            user_id: userId
          });

          const msg = (text || '').trim();
          const ok = msg.toLowerCase().startsWith('you have successfully');

          if (ok) {
            showNotification('Battle joined successfully!', 'success');

            // Update the card to show it's now joined
            card.classList.add('dungeon-joined');

            // Change button to Continue
            joinBtn.innerHTML = '⚔️ Continue';
            joinBtn.style.background = '#ffd369';
            joinBtn.style.color = '#1e1e2e';
            joinBtn.disabled = false;
            joinBtn.onclick = () => {
              window.location.href = battleHref;
            };

            // Move card to Continue Battle section
            moveDungeonCardToSection(card, 'continue');
          } else {
            showNotification(msg || 'Failed to join battle', 'error');
            joinBtn.disabled = false;
            joinBtn.innerHTML = '⚔️ Join Battle';
          }
        } catch (error) {
          console.error('Join battle error:', error);
          showNotification('Server error. Please try again.', 'error');
          joinBtn.disabled = false;
          joinBtn.innerHTML = '⚔️ Join Battle';
        }
      };

      actionsDiv.appendChild(joinBtn);

      const viewBtn = document.createElement('a');
      viewBtn.href = battleHref;
      viewBtn.className = 'dungeon-btn';
      viewBtn.style.flex = '1';
      viewBtn.style.textAlign = 'center';
      viewBtn.style.textDecoration = 'none';
      viewBtn.innerHTML = '👁️ View';
      actionsDiv.appendChild(viewBtn);
    }

    // Assemble card
    card.setAttribute('data-monster-name', monsterName.toLowerCase());

    // Store monster ID for later use
    if (viewLink) {
      const urlParams = new URLSearchParams(viewLink.href.split('?')[1]);
      // Dungeon battles use 'dgmid' parameter
      const monsterId = urlParams.get('dgmid') || urlParams.get('id');
      if (monsterId) {
        card.setAttribute('data-monster-id', monsterId);
      }
    }

    // Store references for easy updates
    card._imgElement = cardImg;
    card._hpBar = hpFill;
    card._hpText = hpTextDiv;
    card._actionsDiv = actionsDiv;
    card._currentHP = currentHP;
    card._maxHP = maxHP;
    card._isDead = isDead;
    card._isJoined = isJoined;
    card._hasLoot = hasLoot;
    card._playersJoined = playersJoined;
    card._battleHref = viewLink ? viewLink.href : '#';

    // Monster image
    card.appendChild(cardImg);

    // Create info wrapper for list view
    const infoWrapper = document.createElement('div');
    infoWrapper.className = 'dungeon-monster-info';
    infoWrapper.appendChild(title);
    infoWrapper.appendChild(hpBar);
    infoWrapper.appendChild(hpTextDiv);
    if (statsDiv.children.length > 0) {
      infoWrapper.appendChild(statsDiv);
    }
    card.appendChild(infoWrapper);

    card.appendChild(actionsDiv);

    return card;
  }

  // Calculate expected damage based on monster HP
  function calculateExpectedDamage(currentHP, maxHP) {
    // Base damage calculation using the existing formula
    const hpRatio = currentHP / maxHP;
    const baseDamage = Math.round(1000 * Math.pow(currentHP, 0.25));

    // Adjust based on HP percentage (lower HP = less damage)
    const hpMultiplier = 0.5 + (hpRatio * 0.5); // 50-100% of base damage

    return Math.round(baseDamage * hpMultiplier);
  }

  // Calculate expected EXP based on monster HP
  function calculateExpectedExp(currentHP, maxHP) {
    // Use the existing calculateExpectedExp function if available and not this one
    if (
      typeof window.calculateExpectedExp === 'function' &&
      window.calculateExpectedExp !== calculateExpectedExp
    ) {
      return window.calculateExpectedExp(currentHP, maxHP);
    }

    // Fallback calculation based on HP
    const hpRatio = currentHP / maxHP;
    const baseExp = Math.round(currentHP * 0.1); // Base 10% of current HP
    const levelMultiplier = 1 + (hpRatio * 0.5); // Up to 50% bonus for full HP

    return Math.round(baseExp * levelMultiplier);
  }

  // Initialize filter functionality for dungeon pages
  function initDungeonFilters(mainContainer) {
    const searchInput = document.getElementById('dungeon-search');
    const monsterTypeToggle = document.getElementById('dungeon-monster-type-toggle');
    const monsterTypeDropdown = document.getElementById('dungeon-monster-type-dropdown');
    const selectAllMonstersBtn = document.getElementById('dungeon-select-all-monsters');
    const clearMonstersBtn = document.getElementById('dungeon-clear-monsters');
    const hpFilter = document.getElementById('dungeon-hp-filter');
    const playerCountFilter = document.getElementById('dungeon-player-count-filter');
    const sortSelect = document.getElementById('dungeon-sort');
    const hideImagesBtn = document.getElementById('dungeon-hide-images-btn');
    const lootAllBtn = document.getElementById('dungeon-loot-all-btn');
    const lootCountSpan = document.getElementById('dungeon-loot-count');
    const viewBtns = document.querySelectorAll('.dungeon-view-btn');
    
    // Update loot count
    function updateLootCount() {
      const lootSection = Array.from(document.querySelectorAll('.monster-section')).find(s => {
        const h = s.querySelector('.monster-section-header h3');
        return h && h.textContent.toLowerCase().includes('available loot');
      });
      
      if (lootSection) {
        const lootCards = lootSection.querySelectorAll('.dungeon-monster-card:not([style*="display: none"])');
        const count = lootCards.length;
        if (lootCountSpan) {
          lootCountSpan.textContent = count;
        }
        if (lootAllBtn) {
          lootAllBtn.disabled = count === 0;
          lootAllBtn.style.opacity = count === 0 ? '0.5' : '1';
        }
      }
    }
    
    // Initial count
    updateLootCount();
    
    // Loot All functionality
    if (lootAllBtn) {
      lootAllBtn.addEventListener('click', async () => {
        const lootSection = Array.from(document.querySelectorAll('.monster-section')).find(s => {
          const h = s.querySelector('.monster-section-header h3');
          return h && h.textContent.toLowerCase().includes('available loot');
        });
        
        if (!lootSection) {
          showNotification('No loot available', 'error');
          return;
        }
        
        const lootCards = lootSection.querySelectorAll('.dungeon-monster-card:not([style*="display: none"])');
        
        if (lootCards.length === 0) {
          showNotification('No loot available', 'error');
          return;
        }
        
        // Initialize user data if needed
        if (!userData.userID) {
          initUserData();
        }
        
        lootAllBtn.disabled = true;
        lootAllBtn.innerHTML = '<span>⏳</span><span>Looting...</span>';
        
        let successCount = 0;
        let failCount = 0;
        
        // Parallelize all loot requests for speed
        const allLootItems = [];
        const aggregatedRewards = { exp: 0, gold: 0 };

        // Prepare tasks for each card
        const tasks = Array.from(lootCards).map(card => {
          return (async () => {
            const monsterId = card.getAttribute('data-monster-id');
            const monsterName = card.getAttribute('data-monster-name');
            if (!monsterId) return { ok: false, card, error: 'missing id' };

            // Find the loot button in the card and disable UI early
            const lootBtn = Array.from(card.querySelectorAll('button')).find(b => (b.textContent || '').includes('💰'));
            try {
              if (lootBtn) { lootBtn.innerHTML = '⏳'; lootBtn.disabled = true; }

              // Find instance_id similar to single-loot handler
              let params = new URLSearchParams(window.location.search);
              let instance_id = params.get('instance_id') || card.getAttribute('data-instance-id') || card.dataset.instanceId;
              if (!instance_id) {
                const viewLink = card.querySelector('a[href*="dungeon_battle.php"]');
                if (viewLink) {
                  try { instance_id = (new URL(viewLink.href, window.location.origin)).searchParams.get('instance_id'); } catch(e){}
                }
              }
              if (!instance_id) return { ok: false, card, error: 'missing instance_id' };

              const body = 'dgmid='+encodeURIComponent(monsterId)+'&instance_id='+encodeURIComponent(instance_id);
              const res = await fetch('dungeon_loot.php', { method: 'POST', headers: {'Content-Type':'application/x-www-form-urlencoded'}, body });
              const ct = res.headers.get('content-type') || '';
              const raw = await res.text();
              let data = null; if (ct.includes('application/json')) { try { data = JSON.parse(raw); } catch(e){} }

              if (!res.ok || !data) return { ok: false, card, error: (data && data.message) || raw.slice(0,400) || ('HTTP '+res.status) };

              if (String(data.status).trim() === 'success') {
                // Collect items & rewards
                if (Array.isArray(data.items)) allLootItems.push(...data.items);
                if (data.rewards) { aggregatedRewards.exp += Number(data.rewards.exp || 0); aggregatedRewards.gold += Number(data.rewards.gold || 0); }

                // Update card appearance
                const img = card.querySelector('.dungeon-monster-img'); if (img) img.classList.add('grayscale');
                card.classList.add('monster-dead'); card._hasLoot = true;

                return { ok: true, card, data };
              }

              return { ok: false, card, error: data.message || 'failed' };
            } catch (err) {
              return { ok: false, card, error: err?.message || String(err) };
            }
          })();
        });

        // Run all requests in parallel
        const results = await Promise.allSettled(tasks.map(t => t));
        // Tally results
        for (const r of results) {
          if (r.status === 'fulfilled') {
            const v = r.value;
            if (v && v.ok) successCount++; else failCount++;
          } else {
            failCount++;
          }
        }

        // Show summary and aggregated modal if any items
        if (successCount > 0) {
          showNotification(`Successfully looted ${successCount} monster${successCount > 1 ? 's' : ''}!`, 'success');
          if (allLootItems.length > 0) {
            renderDungeonLootModal({ items: allLootItems, rewards: aggregatedRewards, note: 'Batch loot summary' });
          }
        }
        
        // Show summary
        if (successCount > 0) {
          showNotification(`Successfully looted ${successCount} monster${successCount > 1 ? 's' : ''}!`, 'success');
          
          // Move looted cards to completed section after a delay
          setTimeout(() => {
            lootCards.forEach(card => {
              if (card._hasLoot) {
                moveDungeonCardToSection(card, 'completed');
              }
            });
          }, 1500);
        }
        
        if (failCount > 0) {
          showNotification(`Failed to loot ${failCount} monster${failCount > 1 ? 's' : ''}`, 'error');
        }
        
        lootAllBtn.innerHTML = '<span>💰</span><span>Loot All (<span id="dungeon-loot-count">0</span>)</span>';
        lootAllBtn.disabled = false;
        
        // Re-attach the span reference
        const newLootCountSpan = document.getElementById('dungeon-loot-count');
        if (newLootCountSpan) {
          setTimeout(() => updateLootCount(), 2000);
        }
      });
    }
    
    // Function to save filter settings
    function saveDungeonFilterSettings() {
      const settings = {
        nameFilter: searchInput?.value || '',
        monsterTypeFilter: Array.from(document.querySelectorAll('.dungeon-monster-type-checkbox:checked')).map(cb => cb.value),
        hpFilter: hpFilter?.value || '',
        playerCountFilter: playerCountFilter?.value || '',
        sortBy: sortSelect?.value || ''
      };
      localStorage.setItem('dungeonFiltersSettings', JSON.stringify(settings));
    }
    
    // Load saved preferences
    const savedHideImages = localStorage.getItem('dungeon-hide-images') === 'true';
    const savedView = localStorage.getItem('dungeon-view') || 'grid';
    const savedFilters = JSON.parse(localStorage.getItem('dungeonFiltersSettings') || '{}');
    
    // Apply saved preferences
    if (savedHideImages) {
      hideImagesBtn.classList.add('active');
      document.querySelectorAll('.dungeon-monster-container').forEach(container => {
        container.classList.add('hide-images');
      });
    }
    
    // Apply saved view
    viewBtns.forEach(btn => {
      if (btn.dataset.view === savedView) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    if (savedView === 'list') {
      document.querySelectorAll('.dungeon-monster-container').forEach(container => {
        container.classList.add('list-view');
      });
    }
    
    // Apply saved filter settings
    if (savedFilters.nameFilter) {
      searchInput.value = savedFilters.nameFilter;
    }
    if (savedFilters.monsterTypeFilter && Array.isArray(savedFilters.monsterTypeFilter)) {
      savedFilters.monsterTypeFilter.forEach(type => {
        const checkbox = document.querySelector(`.dungeon-monster-type-checkbox[value="${type}"]`);
        if (checkbox) checkbox.checked = true;
      });
    }
    if (savedFilters.hpFilter) {
      hpFilter.value = savedFilters.hpFilter;
    }
    if (savedFilters.playerCountFilter) {
      playerCountFilter.value = savedFilters.playerCountFilter;
    }
    if (savedFilters.sortBy) {
      sortSelect.value = savedFilters.sortBy;
    }
    
    // Apply initial filters and sorting
    filterMonsters(searchInput?.value.toLowerCase().trim() || '');
    if (savedFilters.sortBy) {
      sortDungeonMonsters();
    }
    
    // Search functionality
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        filterMonsters(searchTerm);
        updateLootCount();
        saveDungeonFilterSettings();
      });
    }
    
    // Monster type dropdown toggle
    if (monsterTypeToggle && monsterTypeDropdown) {
      monsterTypeToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = monsterTypeDropdown.style.display !== 'none';
        monsterTypeDropdown.style.display = isVisible ? 'none' : 'block';
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!monsterTypeToggle.contains(e.target) && !monsterTypeDropdown.contains(e.target)) {
          monsterTypeDropdown.style.display = 'none';
        }
      });
    }
    
    // Select all monster types
    if (selectAllMonstersBtn) {
      selectAllMonstersBtn.addEventListener('click', () => {
        document.querySelectorAll('.dungeon-monster-type-checkbox').forEach(checkbox => {
          checkbox.checked = true;
        });
        filterMonsters();
        updateLootCount();
        saveDungeonFilterSettings();
      });
    }
    
    // Clear all monster types
    if (clearMonstersBtn) {
      clearMonstersBtn.addEventListener('click', () => {
        document.querySelectorAll('.dungeon-monster-type-checkbox').forEach(checkbox => {
          checkbox.checked = false;
        });
        filterMonsters();
        updateLootCount();
        saveDungeonFilterSettings();
      });
    }
    
    // Monster type checkbox listeners
    document.querySelectorAll('.dungeon-monster-type-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        filterMonsters();
        updateLootCount();
        saveDungeonFilterSettings();
      });
    });
    
    // HP filter
    if (hpFilter) {
      hpFilter.addEventListener('change', () => {
        filterMonsters();
        updateLootCount();
        saveDungeonFilterSettings();
      });
    }
    
    // Player count filter
    if (playerCountFilter) {
      playerCountFilter.addEventListener('change', () => {
        filterMonsters();
        updateLootCount();
        saveDungeonFilterSettings();
      });
    }
    
    // Sort functionality
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        sortDungeonMonsters();
        saveDungeonFilterSettings();
      });
    }
    
    // Hide images toggle
    if (hideImagesBtn) {
      hideImagesBtn.addEventListener('click', () => {
        const isHidden = hideImagesBtn.classList.toggle('active');
        document.querySelectorAll('.dungeon-monster-container').forEach(container => {
          container.classList.toggle('hide-images', isHidden);
        });
        localStorage.setItem('dungeon-hide-images', isHidden);
      });
    }
    
    // View toggle
    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        
        // Update active button
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update view
        document.querySelectorAll('.dungeon-monster-container').forEach(container => {
          if (view === 'list') {
            container.classList.add('list-view');
          } else {
            container.classList.remove('list-view');
          }
        });
        
        localStorage.setItem('dungeon-view', view);
      });
    });
    
    function filterMonsters(searchTerm) {
      const sections = document.querySelectorAll('.monster-section');
      const selectedMonsterTypes = Array.from(document.querySelectorAll('.dungeon-monster-type-checkbox:checked')).map(cb => cb.value);
      const hpFilterValue = document.getElementById('dungeon-hp-filter')?.value || '';
      const playerCountFilterValue = document.getElementById('dungeon-player-count-filter')?.value || '';
      
      sections.forEach(section => {
        const cards = section.querySelectorAll('.dungeon-monster-card');
        let visibleCount = 0;
        
        cards.forEach(card => {
          const monsterName = (card.getAttribute('data-monster-name') || '').toLowerCase();
          let shouldShow = true;
          
          // Search filter
          if (searchTerm && !monsterName.includes(searchTerm)) {
            shouldShow = false;
          }
          
          // Monster type filter
          if (shouldShow && selectedMonsterTypes.length > 0) {
            const matchesType = selectedMonsterTypes.some(type => {
              switch (type) {
                case 'orc':
                  return monsterName.includes('orc') && !monsterName.includes('king');
                case 'warchief':
                  return monsterName.includes('warchief') || monsterName.includes('chief');
                case 'king':
                  return monsterName.includes('king');
                default:
                  return false;
              }
            });
            if (!matchesType) {
              shouldShow = false;
            }
          }
          
          // HP filter
          if (shouldShow && hpFilterValue) {
            const currentHP = card._currentHP || 0;
            const maxHP = card._maxHP || 1;
            const hpPercentage = maxHP > 0 ? (currentHP / maxHP) * 100 : 0;
            
            switch (hpFilterValue) {
              case 'low':
                if (hpPercentage >= 50) shouldShow = false;
                break;
              case 'medium':
                if (hpPercentage < 50 || hpPercentage > 80) shouldShow = false;
                break;
              case 'high':
                if (hpPercentage <= 80) shouldShow = false;
                break;
              case 'full':
                if (hpPercentage < 100) shouldShow = false;
                break;
            }
          }
          
          // Player count filter
          if (shouldShow && playerCountFilterValue) {
            const playersJoined = card._playersJoined || 0;
            
            switch (playerCountFilterValue) {
              case 'empty':
                if (playersJoined > 0) shouldShow = false;
                break;
              case 'few':
                if (playersJoined >= 2) shouldShow = false;
                break;
              case 'many':
                if (playersJoined <= 2) shouldShow = false;
                break;
              case 'full':
                if (playersJoined < 4) shouldShow = false;
                break;
            }
          }
          
          // Apply visibility
          if (shouldShow) {
            card.style.display = '';
            visibleCount++;
          } else {
            card.style.display = 'none';
          }
        });
        
        // Update section title count
        const titleElement = section.querySelector('.monster-section-header h3');
        if (titleElement) {
          const originalText = titleElement.textContent.replace(/\(\d+\)/, '').trim();
          titleElement.textContent = `${originalText} (${visibleCount})`;
        }
        
        // Show/hide section based on visible cards
        if (visibleCount === 0) {
          section.style.display = 'none';
        } else {
          section.style.display = '';
        }
      });
      
      // Check if any sections are visible
      const visibleSections = Array.from(sections).filter(s => s.style.display !== 'none');
      
      // Show "no results" message if nothing visible
      let noResults = document.querySelector('.dungeon-no-results');
      if (visibleSections.length === 0 && (searchTerm || selectedMonsterTypes.length > 0 || hpFilterValue || playerCountFilterValue)) {
        if (!noResults) {
          noResults = document.createElement('div');
          noResults.className = 'dungeon-no-results';
          noResults.textContent = `No monsters found matching the current filters`;
          mainContainer.appendChild(noResults);
        }
      } else if (noResults) {
        noResults.remove();
      }
    }
    
    function sortDungeonMonsters() {
      const sortBy = document.getElementById('dungeon-sort')?.value || '';
      if (!sortBy) return;
      
      const sections = document.querySelectorAll('.monster-section');
      
      sections.forEach(section => {
        const cards = Array.from(section.querySelectorAll('.dungeon-monster-card'));
        
        cards.sort((a, b) => {
          switch (sortBy) {
            case 'name-asc':
              const nameA = (a.getAttribute('data-monster-name') || '').toLowerCase();
              const nameB = (b.getAttribute('data-monster-name') || '').toLowerCase();
              return nameA.localeCompare(nameB);
              
            case 'name-desc':
              const nameADesc = (a.getAttribute('data-monster-name') || '').toLowerCase();
              const nameBDesc = (b.getAttribute('data-monster-name') || '').toLowerCase();
              return nameBDesc.localeCompare(nameADesc);
              
            case 'hp-asc':
              const hpAPerc = a._maxHP > 0 ? (a._currentHP / a._maxHP) : 0;
              const hpBPerc = b._maxHP > 0 ? (b._currentHP / b._maxHP) : 0;
              return hpAPerc - hpBPerc;
              
            case 'hp-desc':
              const hpADescPerc = a._maxHP > 0 ? (a._currentHP / a._maxHP) : 0;
              const hpBDescPerc = b._maxHP > 0 ? (b._currentHP / b._maxHP) : 0;
              return hpBDescPerc - hpADescPerc;
              
            case 'players-asc':
              return (a._playersJoined || 0) - (b._playersJoined || 0);
              
            case 'players-desc':
              return (b._playersJoined || 0) - (a._playersJoined || 0);
              
            case 'status':
              // Available first (not joined), then continuing (joined but not dead), then lootable (dead and joined)
              const getStatusPriority = (card) => {
                if (card._isDead && card._isJoined && !card._hasLoot) return 3; // Lootable
                if (!card._isDead && card._isJoined) return 2; // Continuing
                if (!card._isDead && !card._isJoined) return 1; // Available
                return 4; // Completed
              };
              return getStatusPriority(a) - getStatusPriority(b);
              
            default:
              return 0;
          }
        });
        
        // Re-append sorted cards
        const container = section.querySelector('.monster-section-content');
        if (container) {
          cards.forEach(card => container.appendChild(card));
        }
      });
    }
  }

  // Initialize dungeon page transformation
  initDungeonPageTransformation();

  // Dungeon wave: intercept Join Battle clicks and auto-send join request then redirect
  try {
    if (window.location.pathname.includes('guild_dungeon_location.php')) {
      // Use event delegation so dynamically added cards are covered
      document.addEventListener('click', async function dungeonWaveJoinHandler(e) {
        const btn = e.target.closest && e.target.closest('.dungeon-join-btn');
        if (!btn) return;
        // If this is a Loot button variant, don't handle it here - let the loot handler process it
        const _btnText = (btn.textContent || '').toLowerCase();
        if (_btnText.includes('loot') || _btnText.includes('💰')) return;
        // Prevent double handling for actual join buttons
        e.preventDefault();
        e.stopPropagation();

        // Find the monster card and ids
        const card = btn.closest('.dungeon-monster-card');
        if (!card) return;
        const dgmid = card.getAttribute('data-monster-id') || card.dataset.monsterId;
        // instance_id might be in URL or on the page (data attribute or link)
        let params = new URLSearchParams(window.location.search);
        let instance_id = params.get('instance_id') || card.getAttribute('data-instance-id') || card.dataset.instanceId;
        // Fallback: try to find view link href containing instance_id
        if (!instance_id) {
          const viewLink = card.querySelector('a[href*="dungeon_battle.php"]');
          if (viewLink) {
            try {
              const hrefParams = new URL(viewLink.href, window.location.origin).searchParams;
              instance_id = hrefParams.get('instance_id');
            } catch (e) { /* ignore */ }
          }
        }

        if (!dgmid) return showNotification('Missing monster id', 'error');
        if (!instance_id) return showNotification('Missing instance id', 'error');

        // Disable button while processing
        const origText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Joining...';

        try {
          const body = `dgmid=${encodeURIComponent(dgmid)}&instance_id=${encodeURIComponent(instance_id)}`;
          const res = await fetch('dungeon_join_battle.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body
          });
          const txt = await res.text();
          const msg = (txt || '').trim();
          const ok = msg.toLowerCase().startsWith('you have successfully') || msg.toLowerCase().includes('joined');
          showNotification(msg || 'Unknown response', ok ? 'success' : 'error');
          if (ok) {
            // Redirect to the dungeon battle page for that monster
            const target = `battle.php?dgmid=${encodeURIComponent(dgmid)}&instance_id=${encodeURIComponent(instance_id)}`;
            setTimeout(() => { window.location.href = target; }, 800);
            return;
          }
        } catch (err) {
          console.error('Join dungeon error', err);
          showNotification('Server error while joining. Please try again.', 'error');
        } finally {
          // restore button if we didn't redirect
          btn.disabled = false;
          btn.textContent = origText;
        }
      });
    }
  } catch (e) {
    console.error('Dungeon join init error', e);
  }

  // Dungeon insta-loot: claim loot from dungeon wave cards and show a centered modal
  try {
    if (window.location.pathname.includes('guild_dungeon_location.php')) {
      if (!window.__dungeonLootHandlerInstalled) {
        window.__dungeonLootHandlerInstalled = true;

        function ensureDungeonLootModal() {
          if (document.getElementById('lootOverlay') && document.getElementById('lootModal')) return;
          const overlay = document.createElement('div'); overlay.id = 'lootOverlay'; overlay.hidden = true;
          overlay.style.cssText = 'display:none; position:fixed; inset:0; z-index:9998;';

          const modal = document.createElement('div'); modal.id = 'lootModal'; modal.hidden = true;
          modal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; align-items:center; justify-content:center;';

          const inner = document.createElement('div');
          inner.style.cssText = 'background:#2a2a3d; border-radius:12px; padding:15px; max-width:90%; width:380px; text-align:center; color:white; overflow-y:auto; max-height:80%;';
          // Ensure modal uses flex layout so inner content centers correctly
          modal.style.display = 'none';
          modal.style.alignItems = 'center';
          modal.style.justifyContent = 'center';
          inner.innerHTML = '\n            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">\n              <h2 id="lootModalTitle" style="margin:0; font-size:18px;">🎁 Loot Claimed</h2>\n              <button id="lootCloseBtn" class="join-btn" style="min-width:32px;">✖</button>\n            </div>\n            <div id="lootBody" style="margin-top:10px; text-align:left;"></div>\n          ';

          modal.appendChild(inner);
          document.body.appendChild(overlay);
          document.body.appendChild(modal);

          overlay.addEventListener('click', function(){ closeLootModal(); });
          modal.addEventListener('click', function (e) { if (e.target === modal) closeLootModal(); });
          document.getElementById('lootCloseBtn')?.addEventListener('click', closeLootModal);
        }

  function openLootModal(){ const lootOverlay = document.getElementById('lootOverlay'); const lootModal = document.getElementById('lootModal'); if (!lootOverlay || !lootModal) return; lootOverlay.hidden=false; lootModal.hidden=false; lootOverlay.style.display='block'; lootModal.style.display='flex'; document.body.style.overflow='hidden'; document.getElementById('lootCloseBtn')?.focus(); }
        function closeLootModal(){ const lootOverlay = document.getElementById('lootOverlay'); const lootModal = document.getElementById('lootModal'); if (!lootOverlay || !lootModal) return; lootOverlay.style.display='none'; lootModal.style.display='none'; lootOverlay.hidden=true; lootModal.hidden=true; document.body.style.overflow=''; }

        function renderDungeonLootModal(data){
          const rewards = data.rewards || {};
          const items = Array.isArray(data.items) ? data.items : [];
          const note = (data.note && String(data.note).trim()) || '';

          // Group items by a stable key (prefer ID, fallback to NAME)
          const groups = {};
          items.forEach(it => {
            const idKey = (it.ID || it.id || it.ITEM_ID || it.item_id || it.NAME || it.name || JSON.stringify(it)).toString();
            if (!groups[idKey]) {
              groups[idKey] = Object.assign({}, it);
              groups[idKey].count = 1;
            } else {
              groups[idKey].count = (groups[idKey].count || 1) + 1;
            }
          });

          const parts = [];
          parts.push('<div>You earned <strong>'+num(rewards.exp||0)+'</strong> EXP and <strong>'+num(rewards.gold||0)+'</strong> Gold.</div>');
          if (note) parts.push('<div style="margin-top:6px;color:#cfd4ff;">'+escapeHtml(note)+'</div>');

          if (items.length) {
            parts.push('<div class="loot-row" style="margin-top:10px; display:flex; flex-wrap:wrap; gap:8px; justify-content:center;">');

            Object.values(groups).forEach(it => {
              const img = escapeAttr(it.IMAGE_URL || 'images/default_item.png');
              const name = escapeHtml(it.NAME || it.name || 'Unknown item');
              const tier = it.TIER || it.tier || '';
              const dropRatio = it.DROP_RATIO != null ? num(it.DROP_RATIO) : null;
              const count = Number(it.count || 1);

              parts.push('<div class="loot-card unlocked" style="position:relative; background:#1e1e2f; border-radius:8px; padding:8px; width:110px; text-align:center;">');
              parts.push('<div class="loot-img-wrap"><img src="'+img+'" alt="'+name+'" style="width:64px; height:64px; object-fit:contain;"></div>');
              parts.push('<div class="loot-meta"><div class="loot-name" style="margin-top:6px; font-weight:600;">'+name+'</div>');
              parts.push('<div class="loot-stats" style="margin-top:4px; font-size:12px; color:#bfc7ff;">');
              if (dropRatio) parts.push('<span class="chip">Drop: '+dropRatio+'%</span>');
              if (tier) parts.push('<span class="chip tierchip '+escapeAttr(String(tier).toLowerCase())+'" style="margin-left:6px;">'+escapeHtml(tier)+'</span>');
              parts.push('</div></div>');
              if (count > 1) {
                parts.push('<div style="position:absolute; top:6px; right:6px; background:rgba(0,0,0,0.6); color:#fff; padding:2px 6px; border-radius:999px; font-weight:700; font-size:12px;">x'+num(count)+'</div>');
              }
              parts.push('</div>');
            });

            parts.push('</div>');
          } else {
            parts.push('<div style="margin-top:10px;">No item dropped this time.</div>');
          }

          const lootBody = document.getElementById('lootBody'); if (lootBody) lootBody.innerHTML = parts.join(''); openLootModal();
        }

        function num(x){ try{ return new Intl.NumberFormat().format(Number(x)||0); }catch{ return x; } }
        function escapeHtml(s){ return String(s).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; }); }
        function escapeAttr(s){ return String(s).replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

        document.addEventListener('click', async function dungeonLootHandler(e){
          const btn = e.target.closest && e.target.closest('#loot-button, .dungeon-loot-btn, .loot-button, .dungeon-join-btn');
          if (!btn) return; const card = btn.closest && btn.closest('.dungeon-monster-card'); if (!card) return;
          // If this is a generic .dungeon-join-btn ensure it's the Loot variant before proceeding
          const _t = (btn.textContent || '').toLowerCase();
          if (btn.classList.contains('dungeon-join-btn') && !_t.includes('loot') && !_t.includes('💰') && btn.id !== 'loot-button' && !btn.classList.contains('dungeon-loot-btn') && !btn.classList.contains('loot-button')) return;
          e.preventDefault(); e.stopPropagation();
          ensureDungeonLootModal();
          const origText = btn.textContent; btn.disabled = true; btn.textContent = 'Processing…';
          const dgmid = card.getAttribute('data-monster-id') || card.dataset.monsterId;
          let params = new URLSearchParams(window.location.search);
          let instance_id = params.get('instance_id') || card.getAttribute('data-instance-id') || card.dataset.instanceId;
          if (!instance_id){ const viewLink = card.querySelector('a[href*="dungeon_battle.php"]'); if (viewLink){ try{ instance_id = (new URL(viewLink.href, window.location.origin)).searchParams.get('instance_id'); } catch(e){} } }
          if (!dgmid || !instance_id){ showNotification('Missing dgmid or instance_id', 'error'); btn.disabled=false; btn.textContent=origText; return; }

          try{
            const body = 'dgmid='+encodeURIComponent(dgmid)+'&instance_id='+encodeURIComponent(instance_id);
            const res = await fetch('dungeon_loot.php', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body });
            const ct = res.headers.get('content-type') || '';
            const raw = await res.text();
            let data = null; if (ct.includes('application/json')){ try{ data = JSON.parse(raw); } catch(e){} }
            if (!res.ok || !data){ const msg = (data && data.message) || raw.slice(0,400) || ('HTTP '+res.status); showNotification(msg, 'error'); btn.disabled=false; btn.textContent=origText; return; }
            if (String(data.status).trim() === 'success'){
              showNotification(data.message || 'Loot claimed!', 'success'); try{ btn.remove(); } catch(e){ btn.disabled=true; }
              // Add monster name to the loot modal
              const monsterName = card.getAttribute('data-monster-name') || 'Unknown Monster';
              renderDungeonLootModal({...data, note: `Loot from ${monsterName}`});
            } else {
              const msg = (data.message || 'Failed to loot.').trim(); showNotification(msg, 'error'); if (/already claimed/i.test(msg)){ const note = document.createElement('div'); note.textContent='✅ You already claimed your loot.'; btn.replaceWith(note); } else { btn.disabled=false; btn.textContent=origText; }
            }
          } catch(err){ console.error('Dungeon loot error', err); showNotification(err?.message || 'Server error', 'error'); btn.disabled=false; btn.textContent=origText; }
        });

        // Also bind direct listeners to existing buttons (and future ones) in case delegation is blocked
        function bindDungeonLootButtons() {
          document.querySelectorAll('.dungeon-monster-card .dungeon-join-btn').forEach(btn => {
            try {
              const t = (btn.textContent||'').toLowerCase();
              if (!(t.includes('loot') || t.includes('💰'))) return;
              if (btn.dataset.__dungeonLootBound) return;
              btn.dataset.__dungeonLootBound = '1';
              btn.addEventListener('click', function (ev) {
                ev.preventDefault(); ev.stopPropagation();
                // Trigger the same logic as the delegated handler by dispatching a click on the button that the delegated handler listens for
                // But call our handler directly to avoid any propagation issues
                (async function(btnRef){
                  try {
                    ensureDungeonLootModal();
                    const origText = btnRef.textContent; btnRef.disabled = true; btnRef.textContent = 'Processing…';
                    const card = btnRef.closest && btnRef.closest('.dungeon-monster-card');
                    const dgmid = card.getAttribute('data-monster-id') || card.dataset.monsterId;
                    let params = new URLSearchParams(window.location.search);
                    let instance_id = params.get('instance_id') || card.getAttribute('data-instance-id') || card.dataset.instanceId;
                    if (!instance_id){ const viewLink = card.querySelector('a[href*="dungeon_battle.php"]'); if (viewLink){ try{ instance_id = (new URL(viewLink.href, window.location.origin)).searchParams.get('instance_id'); } catch(e){} } }
                    if (!dgmid || !instance_id){ showNotification('Missing dgmid or instance_id', 'error'); btnRef.disabled=false; btnRef.textContent=origText; return; }
                    const body = 'dgmid='+encodeURIComponent(dgmid)+'&instance_id='+encodeURIComponent(instance_id);
                    const res = await fetch('dungeon_loot.php', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body });
                    const ct = res.headers.get('content-type') || '';
                    const raw = await res.text();
                    let data = null; if (ct.includes('application/json')){ try{ data = JSON.parse(raw); } catch(e){} }
                    if (!res.ok || !data){ const msg = (data && data.message) || raw.slice(0,400) || ('HTTP '+res.status); showNotification(msg, 'error'); btnRef.disabled=false; btnRef.textContent=origText; return; }
                    if (String(data.status).trim() === 'success'){ showNotification(data.message || 'Loot claimed!', 'success'); try{ btnRef.remove(); } catch(e){ btnRef.disabled=true; } 
                      // Add monster name to the loot modal
                      const monsterName = card.getAttribute('data-monster-name') || 'Unknown Monster';
                      renderDungeonLootModal({...data, note: `Loot from ${monsterName}`});
                    }
                    else { const msg = (data.message || 'Failed to loot.').trim(); showNotification(msg, 'error'); if (/already claimed/i.test(msg)){ const note = document.createElement('div'); note.textContent='✅ You already claimed your loot.'; btnRef.replaceWith(note); } else { btnRef.disabled=false; btnRef.textContent=origText; } }
                  } catch (err) { console.error('Dungeon loot error', err); showNotification(err?.message || 'Server error', 'error'); try{ btnRef.disabled=false; btnRef.textContent='Loot'; } catch{} }
                })(btn);
              }, { passive: false });
            } catch (e) { /* ignore individual binding errors */ }
          });
        }

        // Observe for new dungeon cards and bind to their loot buttons
        const dungeonCardsContainer = document.querySelector('.dungeon-container') || document.body;
        const _observer = new MutationObserver((mutations) => {
          let added = false;
          for (const m of mutations) {
            if (m.addedNodes && m.addedNodes.length) { added = true; break; }
          }
          if (added) bindDungeonLootButtons();
        });
        _observer.observe(dungeonCardsContainer, { childList: true, subtree: true });

        // Initial bind
        bindDungeonLootButtons();
      }
    }
  } catch (e) { console.error('Dungeon insta-loot init error', e); }

  // Initialize quest widget
  initSidebarQuestWidget();

  // Start periodic user data update from wave page
  if (!userDataUpdateInterval && window.location.pathname.includes('/active_wave.php')) {
    userDataUpdateInterval = setInterval(updateUserDataFromWavePage, 1000);
  }

  // ===== HOTKEYS SYSTEM (ported) =====
  function initHotkeys(){
    if(!extensionSettings.hotkeys?.enabled) return;
    document.addEventListener('keydown', handleHotkey, true);
  }

  function handleHotkey(e){
    if(!extensionSettings.hotkeys?.enabled) return;
    // Ignore when typing or modifier pressed
    const tag = (e.target.tagName||'').toLowerCase();
    if(['input','textarea','select'].includes(tag) || e.target.isContentEditable) return;
    if(e.ctrlKey||e.metaKey||e.altKey) return;
    const key = e.key.toLowerCase();

    // Battle attacks in modal OR directly on battle.php page when buttons exist
    const onBattlePageWithButtons = window.location.pathname.includes('/battle.php') && !!document.querySelector('.battle-actions-buttons .attack-btn[data-skill-id]');
    if((isModalOpen || onBattlePageWithButtons) && extensionSettings.hotkeys.battleAttacks){
      const idx = extensionSettings.hotkeys.battleAttackKeys.findIndex(k=>k.toLowerCase()===key);
      if(idx!==-1){
        e.preventDefault(); e.stopPropagation();
        triggerBattleAttack(idx+1);
        return;
      }
    }

    // Monster selection on wave pages
    // New behavior: allow number hotkeys while modal is open -> close current modal then select/join that monster
    if(extensionSettings.hotkeys.monsterSelection && window.location.pathname.includes('/active_wave.php')){
      const idx = extensionSettings.hotkeys.monsterSelectionKeys.findIndex(k=>k.toLowerCase()===key);
      if(idx!==-1){
        e.preventDefault(); e.stopPropagation();
        if(isModalOpen){
          closeBattleModal(); // Gracefully close current modal before switching
        }
        selectMonsterCard(idx);
      }
    }
  }

  // Helper to close battle modal programmatically (used by hotkeys)
  function closeBattleModal(){
    try {
      const modal = document.getElementById('battleModal') || document.getElementById('battle-modal');
      const backdrop = document.getElementById('battle-modal-backdrop');
      if (backdrop) backdrop.remove();
      if(modal){
        modal.remove();
        setModalOpen(false);
        const iframe = document.getElementById('battle-session-iframe');
        if(iframe) iframe.remove();
        // Refresh wave data so UI reflects latest state
        try { updateWaveData(true); } catch {}
      }
    } catch(err){ /* no-op */ }
  }

  // Select joinable monster by index (0-based among first 9 eligible)
  function selectMonsterCard(index){
    const cards = Array.from(document.querySelectorAll('.monster-card'));
    const eligible = cards.filter(card=>{
      if(card.style.display==='none') return false;
      const txt = card.textContent||'';
      if(/Continue|Loot/i.test(txt)) return false;
      const joinBtn = card.querySelector('.join-btn, button[onclick*="join"], a[href*="battle.php"]');
      if(!joinBtn||joinBtn.disabled||joinBtn.classList.contains('disabled')) return false;
      const hpFill = card.querySelector('.hp-bar .hp-fill, .hp-fill');
      if(hpFill && /^(0%|0px)$/.test(hpFill.style.width||'')) return false;
      const hpText = card.querySelector('.stat-value');
      if(hpText && /^0\s*\//.test(hpText.textContent||'')) return false;
      return true;
    });
    if(index<0||index>=Math.min(9,eligible.length)) return;
    const card = eligible[index];
    const joinBtn = card.querySelector('.join-btn, button[onclick*="join"], a[href*="battle.php"]');
    if(!joinBtn) return;
    // visual feedback
    card.style.outline='3px solid #f9e2af'; card.style.boxShadow='0 0 16px rgba(249,226,175,0.6)';
    setTimeout(()=>{card.style.outline=''; card.style.boxShadow='';},500);
    // If battle modal is disabled, hotkey should insta join
    try {
      if (!extensionSettings?.battleModal?.enabled) {
        // Try to locate the original battle link for redirect
        const link = card.querySelector('a[href*="battle.php?id="]') || card.querySelector('a[href*="battle.php"]');
        let monsterId = null;
        if (link && link.href) {
          const m = link.href.match(/battle\.php\?id=(\d+)/);
          if (m) monsterId = m[1];
        }
        // Fallback: from button data attribute
        if (!monsterId && joinBtn.getAttribute) {
          const dataId = joinBtn.getAttribute('data-monster-id');
          if (dataId) monsterId = dataId;
        }
        if (monsterId && typeof joinWaveInstant === 'function') {
          joinWaveInstant(monsterId, link || { href: `battle.php?id=${monsterId}` });
        } else {
          // As a last resort, just navigate
          const href = link?.href || joinBtn.getAttribute?.('href');
          if (href) window.location.href = href;
          else joinBtn.click();
        }
      } else {
        // Battle modal enabled -> delegate to the button click (modal flow handles it)
        joinBtn.click();
      }
      showNotification(`Selected monster ${index+1}`,'info');
    } catch (err) {
      try { joinBtn.click(); } catch {}
    }
  }

  // Trigger attack inside battle modal by number (1-5)
  function triggerBattleAttack(number){
    // Support both legacy (#battleModal) and new (#battle-modal) modal IDs
    const modal = document.getElementById('battleModal') || document.getElementById('battle-modal');
    const skillMap = {1:'0',2:'-1',3:'-2',4:'-3',5:'-4'};
    const skillId = skillMap[number];
    if(!skillId) return;
    // Prefer modal buttons when modal is open; otherwise fallback to battle.php inline buttons
    // New modal uses .modal-skill-btn instead of .attack-btn
    let btn = null;
    if (modal) {
      btn = modal.querySelector(`.attack-btn[data-skill-id="${skillId}"]`) || modal.querySelector(`.modal-skill-btn[data-skill-id="${skillId}"]`);
    }
    if (!btn) {
      btn = document.querySelector(`.battle-card .battle-actions-buttons .attack-btn[data-skill-id="${skillId}"]`);
    }
    if(!btn||btn.disabled) return;
    btn.style.transform='scale(1.05)'; btn.style.boxShadow='0 0 20px rgba(249,226,175,0.8)';
    setTimeout(()=>{btn.style.transform=''; btn.style.boxShadow='';},200);
    btn.click();
    const names={'0':'Slash','-1':'Power Slash','-2':'Heroic Slash','-3':'Ultimate Slash','-4':'Legendary Slash'};
    const keyLetter = extensionSettings.hotkeys.battleAttackKeys[number-1]?.toUpperCase() || number;
    showNotification(`Used ${names[skillId]} (${keyLetter})`,'info');
  }

  function addMonsterCardHotkeyOverlays(){
    if(!extensionSettings.hotkeys.enabled||!extensionSettings.hotkeys.monsterSelection||!extensionSettings.hotkeys.showOverlays) return;
    if(!window.location.pathname.includes('/active_wave.php')) return;
    document.querySelectorAll('.hotkey-overlay.monster').forEach(o=>o.remove());
    const cards = Array.from(document.querySelectorAll('.monster-card'));
    const eligible = cards.filter(card=>{
      if(card.style.display==='none') return false;
      const txt = card.textContent||'';
      if(/Continue|Loot/i.test(txt)) return false;
      const joinBtn = card.querySelector('.join-btn, button[onclick*="join"], a[href*="battle.php"]');
      if(!joinBtn||joinBtn.disabled||joinBtn.classList.contains('disabled')) return false;
      const hpFill = card.querySelector('.hp-bar .hp-fill, .hp-fill');
      if(hpFill && /^(0%|0px)$/.test(hpFill.style.width||'')) return false;
      const hpText = card.querySelector('.stat-value');
      if(hpText && /^0\s*\//.test(hpText.textContent||'')) return false;
      return true;
    }).slice(0,9);
    eligible.forEach((card,i)=>{
      const bubble = document.createElement('div');
      bubble.className='hotkey-overlay monster';
      bubble.textContent=extensionSettings.hotkeys.monsterSelectionKeys[i]?.toUpperCase() || (i+1);
      bubble.style.cssText='position:absolute;top:5px;right:5px;background:linear-gradient(135deg,#f9e2af,#fab387);color:#1e1e2e;font-size:14px;font-weight:700;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.35);z-index:10;border:2px solid #1e1e2e;';
      if(!/relative|absolute|fixed/i.test(getComputedStyle(card).position)) card.style.position='relative';
      card.appendChild(bubble);
    });
  }

  function addBattleAttackHotkeyOverlays(){
    if(!extensionSettings.hotkeys.enabled||!extensionSettings.hotkeys.battleAttacks||!extensionSettings.hotkeys.showOverlays) return;
    const modal = document.getElementById('battleModal') || document.getElementById('battle-modal');
    if(!modal) return;
    // Ensure CSS for pseudo-element overlays is present (prevents letter from becoming part of button text)
    if(!document.getElementById('hotkey-overlay-css')){
      const style = document.createElement('style');
      style.id = 'hotkey-overlay-css';
      style.textContent = `
        .hotkey-overlay.attack::after { content: attr(data-letter); }
      `;
      document.head.appendChild(style);
    }
    modal.querySelectorAll('.hotkey-overlay.attack').forEach(o=>o.remove());
    // Support both button class names
    const btns = modal.querySelectorAll('.attack-btn, .modal-skill-btn');
    btns.forEach(btn=>{
      const skillId = btn.getAttribute('data-skill-id');
      const idx = ['0','-1','-2','-3','-4'].indexOf(skillId);
      if(idx===-1) return;
      const letter = extensionSettings.hotkeys.battleAttackKeys[idx];
      if(!letter) return;
      const bubble = document.createElement('div');
      bubble.className='hotkey-overlay attack';
      bubble.setAttribute('data-letter', letter.toUpperCase());
      bubble.setAttribute('aria-hidden','true');
      bubble.style.cssText='position:absolute;top:-8px;right:-8px;background:linear-gradient(135deg,#f9e2af,#fab387);color:#1e1e2e;font-size:12px;font-weight:700;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);z-index:10;border:1px solid #1e1e2e;pointer-events:none;';
      btn.style.position='relative';
      btn.appendChild(bubble);
    });
  }

  // Add attack hotkey overlays on the live battle page (battle.php) after joining
  function addBattlePageAttackHotkeyOverlays(){
    try{
      if(!extensionSettings.hotkeys?.enabled || !extensionSettings.hotkeys?.battleAttacks || !extensionSettings.hotkeys?.showOverlays) return;
      if(!window.location.pathname.includes('/battle.php')) return;
      // Only when attack buttons are present (i.e., joined)
      const btns = document.querySelectorAll('.battle-card .battle-actions-buttons .attack-btn[data-skill-id]');
      if(!btns.length) return;
      if(!document.getElementById('hotkey-overlay-css')){
        const style = document.createElement('style');
        style.id = 'hotkey-overlay-css';
        style.textContent = `.hotkey-overlay.attack::after { content: attr(data-letter); }`;
        document.head.appendChild(style);
      }
      // Clear previous overlays on page buttons
      document.querySelectorAll('.battle-card .battle-actions-buttons .attack-btn .hotkey-overlay.attack').forEach(o=>o.remove());
      btns.forEach(btn=>{
        const skillId = btn.getAttribute('data-skill-id');
        const idx = ['0','-1','-2','-3','-4'].indexOf(String(skillId));
        if(idx===-1) return;
        const letter = extensionSettings.hotkeys.battleAttackKeys[idx];
        if(!letter) return;
        const bubble = document.createElement('div');
        bubble.className='hotkey-overlay attack';
        bubble.setAttribute('data-letter', letter.toUpperCase());
        bubble.setAttribute('aria-hidden','true');
        bubble.style.cssText='position:absolute;top:-8px;right:-8px;background:linear-gradient(135deg,#f9e2af,#fab387);color:#1e1e2e;font-size:12px;font-weight:700;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);z-index:10;border:1px solid #1e1e2e;pointer-events:none;';
        const style = getComputedStyle(btn);
        if(!/relative|absolute|fixed/i.test(style.position)) btn.style.position='relative';
        btn.appendChild(bubble);
      });
    }catch(e){ /* no-op */ }
  }

  // Override showBattleModal to add overlays after render
  const __originalShowBattleModal = typeof showBattleModal==='function' ? showBattleModal : null;
  if(__originalShowBattleModal){
    showBattleModal = function(monster){
      __originalShowBattleModal(monster);
      // Re-apply overlays and attach a short-lived observer for dynamic changes
      setTimeout(()=>{
        try{
          addBattleAttackHotkeyOverlays();
          const modal = document.getElementById('battleModal') || document.getElementById('battle-modal');
          if(modal && !modal.__hotkeyObserver){
            const obs = new MutationObserver(()=>{
              // Debounce rapid changes
              clearTimeout(modal.__hotkeyOverlayTick);
              modal.__hotkeyOverlayTick = setTimeout(()=>{
                addBattleAttackHotkeyOverlays();
              }, 60);
            });
            obs.observe(modal, { childList:true, subtree:true });
            modal.__hotkeyObserver = obs;
          }
        }catch(e){ /* no-op */ }
      },120);
    };
  }

  // Fallback polling in case battle modal is created by other logic after initial override
  let __hotkeyModalPollCount = 0;
  const __hotkeyModalPoller = setInterval(()=>{
    if(__hotkeyModalPollCount>50){ clearInterval(__hotkeyModalPoller); return; }
    const modal = document.getElementById('battleModal') || document.getElementById('battle-modal');
    if(modal){
      addBattleAttackHotkeyOverlays();
      clearInterval(__hotkeyModalPoller);
    }
    __hotkeyModalPollCount++;
  },300);

  // Initialize + observe
  initHotkeys();
  if(window.location.pathname.includes('/active_wave.php')){
    setTimeout(addMonsterCardHotkeyOverlays,250);
    const hotkeyObserver = new MutationObserver(()=>{ setTimeout(addMonsterCardHotkeyOverlays,250); });
    hotkeyObserver.observe(document.body,{childList:true,subtree:true});
  }
  // Inject battle page hotkey overlays after DOM settles if on battle.php
  if(window.location.pathname.includes('/battle.php')){
    // Initial attempt
    setTimeout(addBattlePageAttackHotkeyOverlays,400);
    // Observe for attack buttons appearing (e.g., after AJAX join)
    const battleObserver = new MutationObserver(()=>{ setTimeout(addBattlePageAttackHotkeyOverlays,100); });
    battleObserver.observe(document.body,{childList:true,subtree:true});
  }
  // ===== END HOTKEYS SYSTEM =====
