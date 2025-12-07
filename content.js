'use strict';

// Global variables
var alarmInterval = null;
var waveRefreshInterval = null;
var waveUpdateInterval = null;
var monsterSortingInterval = null;
var userDataUpdateInterval = null;
var hotkeyOverlayInterval = null;
var monsterFiltersSettings = { "nameFilter": "", "hideImg": false, "battleLimitAlarm": false, "battleLimitAlarmSound": true, "battleLimitAlarmVolume": 70, "monsterTypeFilter": [], "hpFilter": "", "playerCountFilter": "" }

// Global toggleSection function for settings modal
window.toggleSection = function (header) {
  const section = header.parentElement;
  const icon = header.querySelector('.expand-icon');

  section.classList.toggle('expanded');

  if (section.classList.contains('expanded')) {
    icon.textContent = '−';
    icon.style.transform = 'rotate(0deg)';
  } else {
    icon.textContent = '+';
    icon.style.transform = 'rotate(0deg)';
  }
};

// Observer and cleanup tracking
var activeObservers = [];
var activeIntervals = [];
var activeEventListeners = [];

// Immediate cleanup on script load to prevent accumulation from hard refreshes
function immediateCleanup() {
  try {
    // Clear any existing intervals
    const intervalsToClear = [
      'alarmInterval', 'waveRefreshInterval', 'waveUpdateInterval',
      'monsterSortingInterval', 'userDataUpdateInterval', 'hotkeyOverlayInterval',
      'window.lootPillsInterval', 'window.potionExpTimer', 'window.autoSlashInterval'
    ];

    intervalsToClear.forEach(intervalName => {
      try {
        let interval;
        if (intervalName.includes('window.')) {
          interval = eval(intervalName);
        } else {
          interval = eval(intervalName);
        }
        if (interval) {
          clearInterval(interval);
          if (intervalName.includes('window.')) {
            eval(`${intervalName} = null`);
          } else {
            eval(`${intervalName} = null`);
          }
        }
      } catch (e) {
        // Ignore errors for non-existent intervals
      }
    });

    // Disconnect any existing observers
    const observersToClear = [
      'window.backgroundObserver', 'window.lizardRemovalObserver'
    ];

    observersToClear.forEach(observerName => {
      try {
        const observer = eval(observerName);
        if (observer && typeof observer.disconnect === 'function') {
          observer.disconnect();
          eval(`${observerName} = null`);
        }
      } catch (e) {
        // Ignore errors for non-existent observers
      }
    });

    // Clear any existing overlays/elements
    document.querySelectorAll('.hotkey-overlay, .loot-probability-pill, .loot-pills-container').forEach(el => el.remove());

    // Clear cached data to prevent memory accumulation
    if (typeof lastHtmlContent !== 'undefined') lastHtmlContent = null;
    if (typeof lastParsedData !== 'undefined') lastParsedData = null;
    if (typeof refreshCounter !== 'undefined') refreshCounter = 0;

  } catch (e) {
    console.error('Error in immediate cleanup:', e);
  }
}

// Run immediate cleanup
immediateCleanup();

// Enhanced settings management
var extensionSettings = {
  sidebarColor: '#1e1e1e',
  backgroundColor: '#000000',
  statAllocationCollapsed: true,
  sidebarCollapsed: false,
  statsExpanded: false,
  petsExpanded: false,
  blacksmithExpanded: false,
  blacksmith: {
    showUncraftable: false
  },
  continueBattlesExpanded: true,
  lootExpanded: true,
  merchantExpanded: false,
  inventoryExpanded: false,
  equipmentExpanded: false,
  battlePassExpanded: false,
  guildExpanded: false,
  worldMapExpanded: false,
  adventurersGuildExpanded: false,
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
  waveAutoRefresh: {
    enabled: true,
    interval: 10, // seconds
    useHardRefresh: false // Use location.reload() instead of soft refresh
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
  potionHelper: {
    enabled: true, // Enable floating potion helper
    showFloatingIcons: true, // Show floating icons on right side
    position: 'right', // Position: 'right' or 'left'
    topOffset: '28%', // Distance from top of viewport
    clickToUse: false, // Enable clicking icon directly to use potion
    hotkeys: {
      small: '', // Small Stamina Potion hotkey
      full: '', // Full Stamina Potion hotkey  
      exp: '', // Exp Potion S hotkey
      hp: '', // Full Hp Potion hotkey
      mana_s: '', // Mana Potion S hotkey
      mana_l: '' // Mana Potion L hotkey
    }
  },
  // Option to remove built-in Lizard theme (for pages that include it) - stored under customBackgrounds
  questWidget: {
    enabled: true // Enable quest widget in sidebar Battle Pass section
  },
  petTeams: {
    enabled: true, // Enable pet teams functionality
    storageKey: 'demonGamePetTeams',
    applyDelay: 350, // Delay between pet applications (ms)
    showInSidebar: true // Show pet teams in sidebar
  },
  semiTransparent: {
    enabled: false, // Enable semi-transparent sidebar like inventory sets panel
    opacity: 0.85 // Semi-transparent opacity (0.1 - 1.0)
  },
  battleModal: {
    enabled: false, // Enable modal-based battles instead of page navigation
    autoClose: true, // Auto-close modal when monster is defeated
    showLootModal: true, // Show loot modal after looting
    showAttackLogs: true, // Show attack logs in battle modal
    showLeaderboard: true, // Show leaderboard in battle modal
    modalBackdrop: true, // Enable click-outside-to-close for battle modals
    compact: false,        // Compact modal (smaller, easier to click outside, removes descriptions)
    zoomScale: 1.0,        // Zoom/scale factor for battle modal (0.5 to 2.0)
    positionX: null,       // Custom X position for modal (null = auto-position)
    positionY: null,       // Custom Y position for modal (null = auto-position)
    showSlash: true,       // Show slash attack button
    showPowerSlash: true,  // Show power slash attack button
    showHeroicSlash: true, // Show heroic slash attack button
    showUltimateSlash: true, // Show ultimate slash attack button
    showLegendarySlash: true // Show legendary slash attack button
  },
  hotkeys: {
    enabled: true, // Enable keyboard hotkeys
    monsterSelection: true, // Enable number keys (1-9) for monster card selection
    showOverlays: true, // Show number overlays on monster cards
    battleAttacks: true, // Enable letter keys (S,P,H,U,L) for battle attacks
    monsterSelectionKeys: ['1', '2', '3', '4', '5', '6', '7', '8', '9'], // Customizable keys for monster selection
    battleAttackKeys: ['s', 'p', 'h', 'u', 'l'], // Customizable keys for battle attacks
    classSkills: true, // Enable hotkeys for class skills
    classSkillKeys: ['q', 'w'] // Customizable keys for class skills (Q,W,E,R,T)
  },
  autoHp: {
    enabled: false, // Enable auto HP potion usage
    threshold: 0, // Use HP potion when HP drops to exactly this amount
    delayBetweenUses: 1000 // Delay between auto-uses (ms) to prevent spam
  },
  autoStamina: {
    enabled: false, // Enable auto stamina potion usage
    threshold: 0, // Use FSP when stamina drops to/below this amount
    delayBetweenUses: 1000 // Delay between auto-uses (ms) to prevent spam
  },
  dungeonWave: {
    enabled: true, // Enable dungeon wave enhancements
    showDamagePills: true, // Show damage and EXP pills on dungeon cards
    showLootPills: true, // Show loot pills on wave pages (damage/exp rewards)
    showZeroJoined: true, // Show "0 joined" for monsters with zero participants
    compactModal: false, // Compact modal for dungeon battles
    waveFilters: {
      enabled: true, // Enable wave filter controls
      hpOptions: ['20-50%', '50-80%', '80-100%', '100%'], // HP filter options
      showCompactToggle: true // Show compact modal toggle
    }
  },
  waveFilters: {
    enabled: true, // Enable wave filter controls
    hpOptions: ['20-50%', '50-80%', '80-100%', '100%'], // HP filter options
    showCompactToggle: true, // Show compact modal toggle
    hideImages: false, // Hide images in wave pages
    autoRefresh: false, // Auto-refresh wave pages
    refreshInterval: 10 // Refresh interval in seconds
  },
  menuItems: [
    { id: 'battle_pass', name: 'Battle Pass', visible: true, order: 1 },
    { id: 'adventurers_guild', name: 'Adventure\'s Guild', visible: true, order: 2 },
    { id: 'pvp', name: 'PvP Arena', visible: true, order: 3 },
    { id: 'gate_grakthar', name: 'Gate Grakthar', visible: true, order: 4 },
    { id: 'inventory_quick', name: 'Inventory', visible: true, order: 5 },
    { id: 'pets', name: 'Pets & Eggs', visible: true, order: 6 },
    { id: 'guild', name: 'Guild', visible: true, order: 7 },
    { id: 'stats', name: 'Stats', visible: true, order: 8 },
    { id: 'blacksmith', name: 'Blacksmith', visible: true, order: 9 },
    { id: 'legendary_forge', name: 'Legendary Forge', visible: true, order: 10 },
    { id: 'merchant', name: 'Merchant', visible: true, order: 11 },
    { id: 'achievements', name: 'Achievements', visible: true, order: 12 },
    { id: 'collections', name: 'Collections', visible: true, order: 13 },
    { id: 'classes', name: 'Classes', visible: true, order: 14 },
    { id: 'guide', name: 'How To Play', visible: true, order: 15 },
    { id: 'leaderboard', name: 'Weekly Leaderboard', visible: true, order: 16 },
    { id: 'chat', name: 'Global Chat', visible: true, order: 17 },
    { id: 'patches', name: 'Patch Notes', visible: true, order: 18 },
    { id: 'manga', name: 'Manga-Manhwa-Manhua', visible: true, order: 19 },
    { id: 'referrals', name: 'Referrals', visible: true, order: 20 },
  ]
};

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
  '/weekly.php': initLeaderboardMods,
  '/battle_pass.php': initBattlePassMods,
  '/guild_dungeon.php': initDungeonLocationMods, // Main dungeon page
  '/guild_dungeon_location.php': initDungeonLocationMods, // Dungeon location page handler
};

// Automatic retrieval of userId from cookie
function getCookieExtension(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

const userId = getCookieExtension('demon');

function initDraggableFalse() {
  document.querySelectorAll('a').forEach(x => x.draggable = false);
  document.querySelectorAll('button').forEach(x => x.draggable = false);
}

// Helper: parse friendly numbers with suffixes (k/m/b)
function parseFriendlyNumber(str) {
  if (!str) return null;
  try {
    const s = String(str).trim();
    const cleaned = s.replace(/,/g, '').replace(/\s+/g, '');
    const m = cleaned.match(/([0-9.]+)\s*([kKmMbB])?$/);
    if (!m) return Number(cleaned) || null;
    const cmp = parseFloat(m[1]);
    const suf = (m[2] || '').toLowerCase();
    if (!suf) return Math.round(cmp);
    if (suf === 'k') return Math.round(cmp * 1e3);
    if (suf === 'm') return Math.round(cmp * 1e6);
    if (suf === 'b') return Math.round(cmp * 1e9);
    return Math.round(cmp);
  } catch (e) {
    return null;
  }
}

function formatCompactNumber(num) {
  if (typeof num !== 'number' || !Number.isFinite(num)) return String(num || '0');
  if (num >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, '') + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2).replace(/\.00$/, '') + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(num);
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
        waveAutoRefresh: {
          ...extensionSettings.waveAutoRefresh,
          ...savedSettings.waveAutoRefresh,
        },
        pvpBattlePrediction: {
          ...extensionSettings.pvpBattlePrediction,
          ...savedSettings.pvpBattlePrediction,
        },
        customBackgrounds: {
          ...extensionSettings.customBackgrounds,
          ...savedSettings.customBackgrounds,
          backgrounds: {
            ...extensionSettings.customBackgrounds?.backgrounds,
            ...savedSettings.customBackgrounds?.backgrounds,
          }
        },
        potionHelper: {
          ...extensionSettings.potionHelper,
          ...savedSettings.potionHelper,
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
    extensionSettings.menuItems = [
      { id: 'battle_pass', name: 'Battle Pass', visible: true, order: 1 },
      { id: 'pvp', name: 'PvP Arena', visible: true, order: 2 },
      { id: 'gate_grakthar', name: 'Gate Grakthar', visible: true, order: 3 },
      { id: 'inventory_quick', name: 'Inventory', visible: true, order: 4 },
      { id: 'pets', name: 'Pets & Eggs', visible: true, order: 5 },
      { id: 'guild', name: 'Guild', visible: true, order: 6 },
      { id: 'stats', name: 'Stats', visible: true, order: 7 },
      { id: 'blacksmith', name: 'Blacksmith', visible: true, order: 8 },
      { id: 'legendary_forge', name: 'Legendary Forge', visible: true, order: 9 },
      { id: 'merchant', name: 'Merchant', visible: true, order: 10 },
      { id: 'achievements', name: 'Achievements', visible: true, order: 11 },
      { id: 'collections', name: 'Collections', visible: true, order: 12 },
      { id: 'guide', name: 'How To Play', visible: true, order: 13 },
      { id: 'leaderboard', name: 'Weekly Leaderboard', visible: true, order: 14 },
      { id: 'chat', name: 'Global Chat', visible: true, order: 15 }
    ];
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
      effect: 'normal',
      overlay: true,
      overlayOpacity: 0.5,
      monsters: {}
    };
  }

  // Ensure new features have proper defaults
  if (!extensionSettings.potionHelper) {
    extensionSettings.potionHelper = {
      enabled: true,
      showFloatingIcons: true,
      showInSidebar: true,
      position: 'right',
      topOffset: '28%',
      clickToUse: false,
      hotkeys: {
        small: '',
        full: '',
        exp: '',
        hp: '',
        mana_s: '',
        mana_l: ''
      }
    };
  } else {
    // Ensure existing potionHelper has new properties
    if (extensionSettings.potionHelper.clickToUse === undefined) {
      extensionSettings.potionHelper.clickToUse = false;
    }
    if (!extensionSettings.potionHelper.hotkeys) {
      extensionSettings.potionHelper.hotkeys = {
        small: '',
        full: '',
        exp: '',
        hp: '',
        mana_s: '',
        mana_l: ''
      };
    }
    // Migrate old hotkey property to new structure
    if (extensionSettings.potionHelper.hotkey !== undefined) {
      const oldHotkey = extensionSettings.potionHelper.hotkey;
      if (oldHotkey && !extensionSettings.potionHelper.hotkeys.small) {
        extensionSettings.potionHelper.hotkeys.small = oldHotkey;
      }
      delete extensionSettings.potionHelper.hotkey;
    }
  }

  if (!extensionSettings.questWidget) {
    extensionSettings.questWidget = {
      position: 'left',
      storageKey: 'demonGamePetTeams',
      applyDelay: 350,
      showInSidebar: true
    };
  }

  if (!extensionSettings.semiTransparent) {
    extensionSettings.semiTransparent = {
      enabled: false,
      opacity: 0.85
    };
  }

  if (!extensionSettings.equipSets) {
    extensionSettings.equipSets = {
      enabled: true,
      storageKey: 'demonGameEquipSets',
      applyDelay: 350,
      showInSidebar: true
    };
  }

  // Ensure battle modal settings exist with defaults
  if (!extensionSettings.battleModal) {
    extensionSettings.battleModal = {
      enabled: false,
      autoClose: true,
      showLootModal: true,
      showAttackLogs: true,
      showLeaderboard: true,
      modalBackdrop: true,
      compact: false,
      zoomScale: 1.0,
      positionX: null,
      positionY: null
    };
  } else {
    // Ensure zoomScale exists with default
    if (extensionSettings.battleModal.zoomScale === undefined) {
      extensionSettings.battleModal.zoomScale = 1.0;
    }
    // Ensure modalBackdrop exists with default
    if (extensionSettings.battleModal.modalBackdrop === undefined) {
      extensionSettings.battleModal.modalBackdrop = true;
    }
    // Ensure position settings exist with defaults
    if (extensionSettings.battleModal.positionX === undefined) {
      extensionSettings.battleModal.positionX = null;
    }
    if (extensionSettings.battleModal.positionY === undefined) {
      extensionSettings.battleModal.positionY = null;
    }
    // Ensure position object exists for single modal positioning
    if (extensionSettings.battleModal.position === undefined) {
      extensionSettings.battleModal.position = { x: null, y: null };
    }
    // Ensure positions object exists for per-modal positioning
    if (extensionSettings.battleModal.positions === undefined) {
      extensionSettings.battleModal.positions = {};
    }
    // Ensure attack button visibility settings exist with defaults
    if (extensionSettings.battleModal.showSlash === undefined) {
      extensionSettings.battleModal.showSlash = true;
    }
    if (extensionSettings.battleModal.showPowerSlash === undefined) {
      extensionSettings.battleModal.showPowerSlash = true;
    }
    if (extensionSettings.battleModal.showHeroicSlash === undefined) {
      extensionSettings.battleModal.showHeroicSlash = true;
    }
    if (extensionSettings.battleModal.showUltimateSlash === undefined) {
      extensionSettings.battleModal.showUltimateSlash = true;
    }
    if (extensionSettings.battleModal.showLegendarySlash === undefined) {
      extensionSettings.battleModal.showLegendarySlash = true;
    }
  }

  // Ensure hotkeys settings exist with defaults
  if (!extensionSettings.hotkeys) {
    extensionSettings.hotkeys = {
      enabled: true,
      monsterSelection: true,
      showOverlays: true,
      battleAttacks: true
    };
  }

  // Ensure showOverlays setting exists with default
  if (extensionSettings.hotkeys.showOverlays === undefined) {
    extensionSettings.hotkeys.showOverlays = true;
  }

  // Ensure customizable hotkey arrays exist with defaults
  if (!extensionSettings.hotkeys.monsterSelectionKeys || !Array.isArray(extensionSettings.hotkeys.monsterSelectionKeys)) {
    extensionSettings.hotkeys.monsterSelectionKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  }

  if (!extensionSettings.hotkeys.battleAttackKeys || !Array.isArray(extensionSettings.hotkeys.battleAttackKeys)) {
    extensionSettings.hotkeys.battleAttackKeys = ['s', 'p', 'h', 'u', 'l'];
  }

  // Ensure class skills hotkey settings exist with defaults
  if (extensionSettings.hotkeys.classSkills === undefined) {
    extensionSettings.hotkeys.classSkills = true;
  }

  if (!extensionSettings.hotkeys.classSkillKeys || !Array.isArray(extensionSettings.hotkeys.classSkillKeys)) {
    extensionSettings.hotkeys.classSkillKeys = ['q', 'w', 'e', 'r', 't'];
  }

  // Ensure auto-healing settings exist with defaults
  if (!extensionSettings.autoHealing) {
    extensionSettings.autoHealing = {
      enabled: false,
      staminaThreshold: 0,
      hpThreshold: 0,
      delayBetweenUses: 1000
    };
  }

  // Ensure individual auto-healing settings exist with defaults
  if (extensionSettings.autoHealing.enabled === undefined) {
    extensionSettings.autoHealing.enabled = false;
  }
  if (extensionSettings.autoHealing.staminaThreshold === undefined) {
    extensionSettings.autoHealing.staminaThreshold = 0;
  }
  if (extensionSettings.autoHealing.hpThreshold === undefined) {
    extensionSettings.autoHealing.hpThreshold = 0;
  }
  if (extensionSettings.autoHealing.delayBetweenUses === undefined) {
    extensionSettings.autoHealing.delayBetweenUses = 1000;
  }

  applySettings();
  applyCustomBackgrounds();
  applyMonsterBackgrounds();
}

// ===== AUTO-USE SYSTEM =====

// Global variables to prevent auto-use spam
let lastAutoHpTime = 0;
let lastAutoStaminaTime = 0;

async function checkAutoHp() {
  // Only run if auto HP is enabled
  if (!extensionSettings.autoHp.enabled) {
    return;
  }

  const now = Date.now();
  const timeSinceLastUse = now - lastAutoHpTime;

  // Respect the delay between uses
  if (timeSinceLastUse < extensionSettings.autoHp.delayBetweenUses) {
    return;
  }

  // Check if HP is exactly at threshold
  if (userData.playerStats && userData.playerStats.hp &&
      userData.playerStats.hp.current !== undefined &&
      userData.playerStats.hp.current === extensionSettings.autoHp.threshold) {
    console.log(`Auto HP: HP ${userData.playerStats.hp.current} === threshold ${extensionSettings.autoHp.threshold}, using HP potion`);
    await useFullHpPotion();
    lastAutoHpTime = Date.now();
  }
}

async function checkAutoStamina() {
  // Only run if auto stamina is enabled
  if (!extensionSettings.autoStamina.enabled) {
    return;
  }

  const now = Date.now();
  const timeSinceLastUse = now - lastAutoStaminaTime;

  // Respect the delay between uses
  if (timeSinceLastUse < extensionSettings.autoStamina.delayBetweenUses) {
    return;
  }

  // Check stamina threshold
  if (userData.currentStamina !== undefined &&
      userData.currentStamina <= extensionSettings.autoStamina.threshold) {
    console.log(`Auto Stamina: Stamina ${userData.currentStamina} <= threshold ${extensionSettings.autoStamina.threshold}, using FSP`);
    await useFullStaminaPotion();
    lastAutoStaminaTime = Date.now();
  }
}

async function useFullStaminaPotion() {
  try {
    const response = await fetch('/use_item.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        item_id: 'fsp', // Full Stamina Potion item ID
        quantity: 1
      }),
      credentials: 'include'
    });

    const result = await response.json();
    if (result.status === 'success' || result.success) {
      console.log('Successfully used Full Stamina Potion');
      showNotification('Auto-healed: Used Full Stamina Potion', 'success');
    } else {
      console.warn('Failed to use Full Stamina Potion:', result.message);
    }
  } catch (error) {
    console.error('Error using Full Stamina Potion:', error);
  }
}

async function useFullHpPotion() {
  try {
    const fd = new URLSearchParams();
    fd.set('user_id', userId);

    const response = await fetch('/heal_potion.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: fd.toString(),
      credentials: 'include'
    });

    const result = await response.text();
    let data = null;
    try {
      data = JSON.parse(result);
    } catch {}

    if (data && (data.status === 'success' || data.success)) {
      console.log('Successfully used Full HP Potion');
      showNotification('Auto-healed: Used Full HP Potion', 'success');
    } else {
      console.warn('Failed to use Full HP Potion:', data?.message || result);
      showNotification(data?.message || 'Failed to use HP Potion', 'error');
    }
  } catch (error) {
    console.error('Error using Full HP Potion:', error);
    showNotification('Network error using HP Potion', 'error');
  }
}

// ===== BATTLE MODAL UTILITY FUNCTIONS =====

// Global variables for battle modal system
let userData = {
  userID: null,
  currentStamina: 0,
  currentExp: 0,
  gold: 0,
  guildId: 0
};

// Modal state tracking
let modalOpen = false;

function setModalOpen(value) {
  modalOpen = value;
}

function isModalOpen() {
  return modalOpen;
}

function showNotification(msg, bgColor = '#2ecc71') {
  const existing = document.getElementById('notification');
  if (existing) existing.remove();
  const note = document.createElement('div');
  note.id = 'notification';
  note.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 12px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      font-size: 15px;
      z-index: 99999;
      max-width: 400px;
      word-wrap: break-word;
    `;
  note.innerHTML = msg;
  document.body.appendChild(note);
  setTimeout(() => note.remove(), 3000);
}

// Fetch battle page HTML
async function fetchBattlePageHtml(monsterId, battleUrl = null) {
  // Use battleUrl if provided (for dungeon battles with instance_id), otherwise construct regular URL
  const url = battleUrl || `https://demonicscans.org/battle.php?id=${encodeURIComponent(monsterId)}`;
  const response = await fetch(url, { credentials: 'include', mode: 'same-origin' });
  if (!response.ok) throw new Error(`Failed to fetch battle page: ${response.status}`);
  return await response.text();
}

// Fetch wave page HTML
async function fetchWavePageHtml(wave = 1, event = null) {
  const url = event ? `https://demonicscans.org/active_wave.php?event=${event}&wave=${wave}` : `https://demonicscans.org/active_wave.php?wave=${wave}`;
  const response = await fetch(url, { credentials: 'include', mode: 'same-origin' });
  if (!response.ok) throw new Error(`Failed to fetch wave page: ${response.status}`);
  return await response.text();
}

// Utility function to make POST requests
async function postAction(url, data) {
  if (data && data.monster_id) {
    try {
      await fetchBattlePageHtml(data.monster_id);
    } catch (e) {
      console.warn("Pre-fetch battle page failed (ignored):", e);
    }
  }
  const body = new URLSearchParams();
  for (const key in data) {
    if (data[key] !== null && data[key] !== undefined) {
      body.append(key, data[key]);
    }
  }
  
  // Construct referrer URL based on battle type
  let referrerUrl;
  if (data.dgmid && data.instance_id) {
    // Dungeon battle
    referrerUrl = `https://demonicscans.org/battle.php?dgmid=${encodeURIComponent(data.dgmid)}&instance_id=${encodeURIComponent(data.instance_id)}`;
  } else if (data.monster_id) {
    // Wave battle
    referrerUrl = `https://demonicscans.org/battle.php?id=${encodeURIComponent(data.monster_id)}`;
  } else {
    // Fallback to current page
    referrerUrl = location.href;
  }
  
  const init = {
    method: 'POST',
    credentials: 'include',
    mode: 'same-origin',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: body.toString(),
    referrer: referrerUrl
  };
  try {
    const response = await fetch(`https://demonicscans.org/${url}`, init);
    const text = await response.text();
    return { status: response.status, text };
  } catch (e) {
    console.error(`POST ${url} error:`, e);
    return { status: 500, text: 'Server error' };
  }
}

// Parse battle page HTML to extract relevant data
function parseBattleHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const result = {
    hpText: '',
    hpPercent: 0,
    name: '',
    monsterImage: '',
    lootItems: [],
    leaderboard: [],
    attackLogs: [],
    availableSkills: ['slash', 'power', 'heroic', 'ultimate', 'legendary'],
    classSkills: [],
    playerStats: {
      hp: { current: 0, max: 0, text: '' },
      mana: { current: 0, max: 0, percent: 0, text: '', regen: '' }
    }
  };

  // Extract HP information
  const hpBar = doc.querySelector('.hp-bar .hp-fill');
  if (hpBar) {
    const style = hpBar.getAttribute('style');
    const widthMatch = style.match(/width:\s*(\d+(?:\.\d+)?)%/);
    if (widthMatch) {
      result.hpPercent = parseFloat(widthMatch[1]);
    }
  }

  // Hp parse text - updated for new monster-stats structure
  const hpTextEl = doc.querySelector('.monster-stats .stat-row:first-child .stat-value') || doc.querySelector('.hp-text');
  if (hpTextEl) {
    result.hpText = hpTextEl.textContent.trim();
    const hpMatch = result.hpText.match(/(\d+(?:,\d+)*)\s*\/\s*(\d+(?:,\d+)*)/);
    if (hpMatch) {
      result.currentHp = parseInt(hpMatch[1].replace(/,/g, ''));
      result.maxHp = parseInt(hpMatch[2].replace(/,/g, ''));
    }
  }

  // Extract monster name - prioritize specific monster name selectors over generic page titles
  const nameElement = doc.querySelector('.monster-card .card-title, .monster-name');
  if (nameElement) {
    // Clean up the name by removing status chips and extra whitespace
    let name = nameElement.textContent.trim();
    name = name.replace(/\s*<span[^>]*>.*?<\/span>\s*/gi, '').trim();
    result.name = name;
  }

  // Extract monster image
  const monsterImg = doc.querySelector('#monsterImage, .monster_image, .monster-img, img[alt*="monster"], img[src*="monster"]');
  if (monsterImg) {
    result.monsterImage = monsterImg.src;
  }

  const availableSkills = ['slash', 'power']; //Always Available

  // Look for buttons containing specific text
  const allButtons = doc.querySelectorAll('button, input[type="submit"]');

  allButtons.forEach(button => {
    const buttonText = (button.textContent || button.value || '').toLowerCase();
    if (!buttonText) return;

    // Check for Power Slash
    if (buttonText.includes('power slash') && !button.disabled) {
      if (!availableSkills.includes('power')) availableSkills.push('power');
    }

    // Check for Heroic Slash
    if (buttonText.includes('heroic slash') && !button.disabled) {
      if (!availableSkills.includes('heroic')) availableSkills.push('heroic');
    }

    // Check for Ultimate Slash (100 STAMINA)
    if (buttonText.includes('ultimate slash') && !button.disabled) {
      if (!availableSkills.includes('ultimate')) availableSkills.push('ultimate');
    }

    // Check for Legendary Slash (200 STAMINA)
    if (buttonText.includes('legendary slash') && !button.disabled) {
      if (!availableSkills.includes('legendary')) availableSkills.push('legendary');
    }
  });

  result.availableSkills = availableSkills;

  // Use global parseFriendlyNumber helper

  // Extract loot items
  const lootCards = doc.querySelectorAll('.loot-card, .loot-item');
  lootCards.forEach(card => {
    const img = card.querySelector('img');
    const name = card.querySelector('.loot-name, .item-name');
    const desc = card.querySelector('.loot-desc, .item-desc');
    const dropChance = card.querySelector('.drop-chance');
    const dmgReq = card.querySelector('.damage-req');
    const tier = card.querySelector('.tier');
    const isLocked = card.classList.contains('locked') || card.querySelector('.lock-badge');

    if (img && name) {
      // Enhanced text extraction for damage requirement
      let damageReqText = '';
      if (dmgReq) {
        damageReqText = dmgReq.textContent.trim();
      } else {
        // Look for damage requirement in card text
        const cardText = card.textContent || '';
        const dmgMatch = cardText.match(/DMG req:\s*([0-9,]+)/i) || cardText.match(/Damage:\s*([0-9,]+)/i);
        if (dmgMatch) {
          damageReqText = dmgMatch[1];
        } else {
          // Also support suffixes like 1.2M/2k/3B
          const suffixMatch = cardText.match(/DMG\s*req:\s*([0-9.,]+\s*[kKmMbB])/i);
          if (suffixMatch) damageReqText = suffixMatch[1].replace(/\s+/g, '');
        }
      }

      // Enhanced drop chance extraction
      let dropChanceText = '';
      if (dropChance) {
        dropChanceText = dropChance.textContent.trim();
      } else {
        // Look for drop chance in card text
        const cardText = card.textContent || '';
        const dropMatch = cardText.match(/Drop:\s*([0-9.%]+)/i) || cardText.match(/([0-9.]+%)/);
        if (dropMatch) {
          dropChanceText = dropMatch[1];
        }
      }

      // Try to convert to normalized numeric value if possible
      const dmgReqNumber = parseFriendlyNumber(damageReqText);

      result.lootItems.push({
        img: img.src,
        name: name.textContent.trim(),
        desc: desc ? desc.textContent.trim() : '',
        dropChance: dropChanceText,
        dmgReq: damageReqText,
        dmgReqNumber: dmgReqNumber,
        tier: tier ? tier.textContent.trim() : 'Common',
        isLocked: !!isLocked
      });
    }
  });

  // Extract leaderboard
  const lbRows = doc.querySelectorAll('.leaderboard-row, .lb-row');
  lbRows.forEach(row => {
    const avatar = row.querySelector('img');
    const username = row.querySelector('.username, .lb-name a');
    const damage = row.querySelector('.damage, .lb-dmg');
    const userId = username ? username.getAttribute('href')?.match(/pid=(\d+)/) : null;

    if (username && damage) {
      result.leaderboard.push({
        ID: userId ? userId[1] : '',
        USERNAME: username.textContent.trim(),
        PICTURE: avatar ? avatar.src : '',
        DAMAGE_DEALT: parseInt(damage.textContent.replace(/[^\d]/g, '')) || 0
      });
    }
  });

  // Extract attack logs
  const logEntries = doc.querySelectorAll('.attack-log .log-entry, .battle-log .log-entry');
  logEntries.forEach(entry => {
    const text = entry.textContent.trim();
    const match = text.match(/(.+?)\s+used\s+(.+?)\s+for\s+(\d+)\s+DMG/);
    if (match) {
      result.attackLogs.push({
        USERNAME: match[1],
        SKILL_NAME: match[2],
        DAMAGE: parseInt(match[3])
      });
    }
  });

  // Extract class skill buttons from .class-skill-bar
  result.classSkills = [];
  const classSkillBar = doc.querySelector('.class-skill-bar');
  if (classSkillBar) {
    const skillButtons = classSkillBar.querySelectorAll('.skill-slot.attack-btn');
    skillButtons.forEach(btn => {
      const skillId = btn.getAttribute('data-skill-id');
      const skillName = btn.getAttribute('data-skill-name');
      const stamCost = btn.getAttribute('data-stam-cost');
      const skillNameEl = btn.querySelector('.skill-name');
      const skillCostEl = btn.querySelector('.skill-cost');
      const skillIconEl = btn.querySelector('.skill-icon-wrap img');
      
      if (skillId && skillName) {
        result.classSkills.push({
          id: skillId,
          name: skillName,
          displayName: skillNameEl ? skillNameEl.textContent.trim() : skillName,
          cost: skillCostEl ? skillCostEl.textContent.trim() : (stamCost ? `${stamCost} STAM` : ''),
          icon: skillIconEl ? skillIconEl.src : null,
          stamCost: stamCost || '0'
        });
      }
    });
    console.log('Extracted class skills:', result.classSkills);
  }

  // Extract player stats (HP, Mana, etc.) from .player-card
  result.playerStats = {
    hp: { current: 0, max: 0, text: '' },
    mana: { current: 0, max: 0, percent: 0, text: '', regen: '' }
  };
  
  const playerCard = doc.querySelector('.battle-card.player-card');
  if (playerCard) {
    // Extract HP
    const hpSubEl = playerCard.querySelector('.card-headline .card-sub');
    if (hpSubEl) {
      const hpText = hpSubEl.textContent.trim();
      result.playerStats.hp.text = hpText;
      const hpMatch = hpText.match(/([\d,]+)\s*\/\s*([\d,]+)/);
      if (hpMatch) {
        result.playerStats.hp.current = parseInt(hpMatch[1].replace(/,/g, ''));
        result.playerStats.hp.max = parseInt(hpMatch[2].replace(/,/g, ''));
      }
    }

    // Extract Mana
    const manaFill = playerCard.querySelector('#pManaFill');
    if (manaFill) {
      const style = manaFill.getAttribute('style');
      const widthMatch = style?.match(/width:\s*(\d+(?:\.\d+)?)%/);
      if (widthMatch) {
        result.playerStats.mana.percent = parseFloat(widthMatch[1]);
      }
    }

    const manaTextEl = playerCard.querySelector('#pManaText');
    if (manaTextEl) {
      const manaText = manaTextEl.textContent.trim();
      result.playerStats.mana.text = manaText;
      const manaMatch = manaText.match(/([\d,]+)\s*\/\s*([\d,]+)/);
      if (manaMatch) {
        result.playerStats.mana.current = parseInt(manaMatch[1].replace(/,/g, ''));
        result.playerStats.mana.max = parseInt(manaMatch[2].replace(/,/g, ''));
      }
    }

    // Extract mana regen text
    const manaRegenEl = playerCard.querySelector('.hp-text[style*="font-size:11px"]');
    if (manaRegenEl) {
      result.playerStats.mana.regen = manaRegenEl.textContent.trim();
    }

    console.log('Extracted player stats:', result.playerStats);
  }

  return result;
}

// Update user data UI elements
function updateUserDataUI() {
  // Update stamina display if it exists
  const staminaElement = document.querySelector('#stamina_span');
  if (staminaElement && userData.currentStamina !== undefined) {
    staminaElement.textContent = userData.currentStamina;
  }

  // Update exp display if it exists
  const expElement = document.querySelector('.gtb-exp-top span');
  if (expElement && userData.currentExp !== undefined) {
    // Format exp as "current / max" but we only have current, so just show current
    expElement.textContent = userData.currentExp.toLocaleString();
  }

  // Update gold display if it exists
  const goldStat = Array.from(document.querySelectorAll('.gtb-stat')).find(stat =>
    stat.textContent.includes('Gold')
  );
  if (goldStat && userData.gold !== undefined) {
    const goldValue = goldStat.querySelector('.gtb-value');
    if (goldValue) {
      // Format gold with K notation if large
      let goldText = userData.gold.toLocaleString();
      if (userData.gold >= 1000) {
        goldText = (userData.gold / 1000).toFixed(3) + 'K';
      }
      goldValue.textContent = goldText;
    }
  }

  // Check auto-use systems
  checkAutoHp();
  checkAutoStamina();
}

// Update user data from wave page
async function updateUserDataFromWavePage() {
  // Only run on wave pages
  if (!window.location.pathname.includes('/active_wave.php')) {
    return;
  }

  try {
    console.log('Starting user data update from wave page...');
    const html = await fetchWavePageHtml(1);
    console.log('Fetched wave page HTML, length:', html.length);

    // Skip update if fetch returned invalid/empty data
    if (!html || html.length < 100) {
      console.warn('Invalid wave page data received, skipping update');
      return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract stamina - from #stamina_span
    const staminaEl = doc.querySelector('#stamina_span');
    if (staminaEl) {
      const newStamina = parseInt(staminaEl.textContent.replace(/,/g, '').replace(/[^\d]/g, ''), 10) || 0;
      console.log('Found stamina:', newStamina);
      userData.currentStamina = newStamina;
    }

    // Extract exp - from .exp span (updated selector)
    const expEl = doc.querySelector('.exp span');
    if (expEl) {
      const expText = expEl.textContent;
      const expMatch = expText.match(/([\d,]+)\s*\/\s*([\d,]+)/);
      if (expMatch) {
        const newExp = parseInt(expMatch[1].replace(/,/g, ''), 10) || 0;
        console.log('Found exp:', newExp);
        userData.currentExp = newExp;
      }
    }

    // Extract gold - from .gold span (updated selector)
    const goldEl = doc.querySelector('.gold span');
    if (goldEl) {
      const goldText = goldEl.textContent.replace(/,/g, '').replace(/[^\d.K]/g, '');
      let gold = 0;
      if (goldText.includes('K')) {
        gold = parseFloat(goldText.replace('K', '')) * 1000;
      } else {
        gold = parseFloat(goldText) || 0;
      }
      console.log('Found gold:', gold);
      userData.gold = gold;
    }

    console.log('Updating UI with new data...');
    updateUserDataUI();
    
    // Check for auto-healing if enabled
    checkAutoHealing();
    
    console.log('User data update completed successfully');
  } catch (err) {
    console.error('Failed to update user data from wave page:', err);
  }
}

// Update cap notice for damage requirements
function updateCapNotice(damageDone) {
  // Damage cap notice has been disabled
  return;
}

// Initialize user data from page or cookies
function initUserData() {
  userData.userID = getCookieExtension('demon');

  // Try to extract current stats from page
  const staminaElement = document.querySelector('#stamina_span');
  if (staminaElement) {
    userData.currentStamina = parseInt(staminaElement.textContent) || 0;
  }

  const expElement = document.querySelector('.exp span');
  if (expElement) {
    const expText = expElement.textContent;
    const expMatch = expText.match(/([\d,]+)\s*\/\s*([\d,]+)/);
    if (expMatch) {
      userData.currentExp = parseInt(expMatch[1].replace(/,/g, ''), 10) || 0;
    }
  }

  const goldElement = document.querySelector('.gold span');
  if (goldElement) {
    const goldText = goldElement.textContent.replace(/[^\d,K]/g, '');
    let gold = 0;
    if (goldText.includes('K')) {
      gold = parseFloat(goldText.replace('K', '')) * 1000;
    } else {
      gold = parseInt(goldText.replace(/,/g, ''), 10) || 0;
    }
    userData.gold = gold;
  }

  // Try to extract guild ID from page or cookies
  const guildIdElement = document.querySelector('#guild-id, .guild-id, [data-guild-id]');
  if (guildIdElement) {
    userData.guildId = parseInt(guildIdElement.textContent || guildIdElement.dataset.guildId) || 0;
  } else {
    // Try to get from cookie if available
    const guildIdCookie = getCookieExtension('guild_id');
    userData.guildId = parseInt(guildIdCookie) || 0;
  }
}

// ===== END BATTLE MODAL UTILITY FUNCTIONS =====

// ===== ADVANCED EQUIPMENT SETS SYSTEM =====

const EQUIP_STORAGE_KEY = "equip_sets_v1";
const EQUIP_APPLY_DELAY = 350;

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

  const equipSetsPanel = document.createElement('div');
  equipSetsPanel.id = 'integrated-equip-sets';
  equipSetsPanel.innerHTML = `
      <div style="background: rgba(30, 30, 46, 0.8); border: 1px solid rgba(43, 46, 73, 0.6); border-radius: 10px; padding: 20px; margin: 20px 0; backdrop-filter: blur(10px);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; cursor: pointer;" id="equip-sets-header">
          <div style="font-size: 18px; font-weight: 800; color: #f9e2af;">⚡ Equipment Sets</div>
          <div id="equip-sets-toggle" style="font-size: 16px; color: #89b4fa; transition: transform 0.3s ease;">▼</div>
        </div>
        
        <div id="equip-sets-content" style="transition: all 0.3s ease; overflow: hidden;">
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
        transition: all 0.2s ease;
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
        transition: all 0.2s ease;
        user-select: none;
      }
      
      #equip-sets-header:hover {
        background: rgba(137, 180, 250, 0.1) !important;
      }
      
      #equip-sets-content {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
      
      .equip-btn.edit-set {
        background: linear-gradient(135deg, #fab387 0%, #f9e2af 100%);
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
        backdrop-filter: blur(5px);
      }
      
      .equip-set-name {
        font-weight: 600;
        color: #f9e2af;
        flex: 1;
      }
      
      .equip-set-preview {
        display: flex;
        gap: 5px;
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
        backdrop-filter: blur(3px);
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
      let isCollapsed = false;

      header.addEventListener('click', () => {
        isCollapsed = !isCollapsed;

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
async function applyAdvancedEquipSet(setObj, options = {}) {
  showNotification("Applying equipment set...", 'info');

  const urlSet = new URLSearchParams(location.search).get("set") || "attack";

  for (const [slot, data] of Object.entries(setObj)) {
    const invId = typeof data === "string" ? data : data.invId;
    let slot_id = typeof data === "object" && data.slot_id != null ? data.slot_id : 0;
    // Fallback: map common slot labels to numeric slot ids
    if (!slot_id) {
      if (/^ring1?/i.test(slot)) slot_id = 6;
      else if (/^ring2?/i.test(slot)) slot_id = 9;
      else if (/^head$/i.test(slot)) slot_id = 1;
      else if (/^chest$/i.test(slot)) slot_id = 2;
      else if (/^legs$/i.test(slot)) slot_id = 3;
      else if (/^weapon$/i.test(slot)) slot_id = 0;
    }

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

  showNotification("Equipment set applied successfully!", 'success');
  // Optionally reload the page to refresh the UI; default behavior maintains compatibility
  if (!options.noReload) {
    setTimeout(() => location.reload(), 800);
  } else {
    // If caller requested noReload, we still trigger a sidebar refresh and relevant UI updates
    try { updateSidebarEquipSetsSection(); } catch (e) { /* ignore */ }
    try { refreshPinnedItemQuantities(); } catch (e) { /* ignore */ }
  }
}

// Initialize equipment sets on inventory page
function initializeEquipmentSets() {
  if (location.pathname.includes("inventory.php")) {
    setTimeout(() => {
      addEquipSetsToInventory();
      loadIntegratedSets();
    }, 600);
  }
}

// Equipment sets recording and management for integrated UI
let currentEquipRecord = {};
let isRecording = false;

// Start recording equipment selection
window.startEquipRecordingSelection = function () {
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

window.saveCurrentEquipmentSet = function () {
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
  // Refresh sidebar equip sets to reflect new set regardless of storage format
  try { updateSidebarEquipSetsSection(); } catch (e) { console.warn('Failed to update sidebar equip sets after save', e); }
  showNotification(`Equipment set "${setName}" saved successfully!`, 'success');
};

window.applyEquipSet = function (setName) {
  const sets = getEquipStorageSets();
  const setData = sets[setName];
  if (!setData) {
    showNotification('Equipment set not found', 'error');
    return;
  }

  applyAdvancedEquipSet(setData);
};

window.deleteEquipSet = function (setName) {
  if (!confirm(`Are you sure you want to delete the equipment set "${setName}"?`)) return;

  const sets = getEquipStorageSets();
  delete sets[setName];
  saveEquipStorageSets(sets);

  loadIntegratedSets();
  try { updateSidebarEquipSetsSection(); } catch (e) { console.warn('Failed to update sidebar equip sets after delete', e); }
  showNotification(`Equipment set "${setName}" deleted`, 'success');
};

window.editEquipSet = function (setName) {
  const sets = getEquipStorageSets();
  if (!sets[setName]) {
    showNotification('Equipment set not found', 'error');
    return;
  }

  // Load the set into current record for editing
  currentEquipRecord = { ...sets[setName] };
  document.getElementById('new-set-name').value = setName;
  updateEquipmentPreview();

  // Delete the original set
  delete sets[setName];
  saveEquipStorageSets(sets);
  loadIntegratedSets();

  showNotification(`Editing equipment set "${setName}". Modify and save.`, 'info');
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
            ${equipmentList.slice(0, 6).map(item => `<img src="${item.img}" title="${item.name}" />`).join('')}
            ${equipmentList.length > 6 ? `<span style="color: #6c7086; font-size: 12px;">+${equipmentList.length - 6} more</span>` : ''}
          </div>
          <div style="font-size: 12px; color: #6c7086;">${Object.keys(setData).length} items</div>
        </div>
        <div class="equip-set-actions">
          <button class="equip-btn apply-set">⚡ Apply</button>
          <button class="equip-btn edit-set">✏️ Edit</button>
          <button class="equip-btn delete-set">🗑️ Delete</button>
        </div>
      `;

    // Add event listeners
    const applyBtn = setElement.querySelector('.apply-set');
    const editBtn = setElement.querySelector('.edit-set');
    const deleteBtn = setElement.querySelector('.delete-set');

    applyBtn.addEventListener('click', () => window.applyEquipSet(setName));
    editBtn.addEventListener('click', () => window.editEquipSet(setName));
    deleteBtn.addEventListener('click', () => window.deleteEquipSet(setName));

    listContainer.appendChild(setElement);
  });

  // Ensure sidebar lists are up-to-date with integrated sets
  try { updateSidebarEquipSetsSection(); } catch (e) { /* ignore */ }
}

// ===== END ADVANCED EQUIPMENT SETS SYSTEM =====

// ===== BATTLE MODAL SYSTEM =====

// Handle joining a battle with modal option
async function handleJoin(monsterId, btn) {
  if (!extensionSettings.battleModal.enabled) {
    window.location.href = `battle.php?id=${monsterId}`;
    return;
  }

  const origText = btn.textContent;
  btn.disabled = true;
  btn.style.opacity = '0.6';
  btn.style.cursor = 'not-allowed';

  try {
    const userId = userData.userID;
    if (!userId) throw new Error("user_id missing");

    try {
      await fetchBattlePageHtml(monsterId);
    } catch (e) {
      console.warn("Pre-fetch battle page failed (ignored):", e);
    }

    const { status, text } = await postAction("user_join_battle.php", {
      monster_id: monsterId,
      user_id: userId
    });

    console.log("user_join_battle.php response:", text);

    if (status === 200) {
      try {
        // Find monster data from current page
        const monster = findMonsterById(monsterId);
        if (monster) {
          monster.status = 1; // Set status to active
          monster.damageDone = 0; // Initialize damageDone on join
          console.log(`Monster ${monsterId} status updated to 1, opening battle modal`);
          
          // Move the card to Continue Battle section if on wave page
          if (window.location.pathname.includes('/active_wave.php')) {
            const monsterCard = Array.from(document.querySelectorAll('.monster-card')).find(card => {
              const cardBtn = card.querySelector('.join-btn, button[onclick*="join"], a[href*="battle.php"]');
              if (cardBtn) {
                const href = cardBtn.getAttribute('href') || cardBtn.getAttribute('onclick') || '';
                return href.includes(`id=${monsterId}`);
              }
              return false;
            });
            
            if (monsterCard) {
              // Update all join buttons to show Continue instead of Join
              const joinButtons = monsterCard.querySelectorAll('.join-btn, button[onclick*="join"]');
              joinButtons.forEach(btn => {
                if (btn.textContent.includes('Join')) {
                  btn.textContent = '⚔️ Continue';
                  btn.style.background = 'linear-gradient(135deg, #f38ba8, #eba0ac)';
                }
              });
              
              // Check if Continue Battle section exists
              let continueSection = document.querySelector('#continue-battle-content .monster-container');
              
              if (!continueSection) {
                // Create Continue Battle section if it doesn't exist
                const continueSectionWrapper = document.createElement('div');
                continueSectionWrapper.className = 'monster-section';
                continueSectionWrapper.innerHTML = `
                  <div class="monster-section-header">
                    <h3 style="color: #f38ba8; margin: 0; flex: 1;">⚔️ Continue Battle <span style="color: #cdd6f4;">(1)</span></h3>
                    <button class="section-toggle-btn" id="continue-battle-toggle">–</button>
                  </div>
                  <div class="monster-section-content" id="continue-battle-content" style="display: block;">
                    <div class="monster-container" style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 18px;"></div>
                  </div>
                `;
                
                // Insert before the first monster section or at the beginning
                const firstSection = document.querySelector('.monster-section');
                const mainContainer = document.querySelector('.monster-container')?.parentElement;
                if (firstSection) {
                  firstSection.parentElement.insertBefore(continueSectionWrapper, firstSection);
                } else if (mainContainer) {
                  mainContainer.insertBefore(continueSectionWrapper, mainContainer.firstChild);
                }
                
                // Get the newly created section
                continueSection = document.querySelector('#continue-battle-content .monster-container');
                
                // Add toggle functionality
                const toggleBtn = document.getElementById('continue-battle-toggle');
                if (toggleBtn) {
                  toggleBtn.onclick = () => {
                    const content = document.getElementById('continue-battle-content');
                    if (content.style.display === 'none') {
                      content.style.display = 'block';
                      toggleBtn.textContent = '–';
                    } else {
                      content.style.display = 'none';
                      toggleBtn.textContent = '+';
                    }
                  };
                }
              }
              
              // Move to Continue Battle section
              if (continueSection) {
                continueSection.insertBefore(monsterCard, continueSection.firstChild);
                
                // Update section header count
                const continueHeader = document.querySelector('#continue-battle-content').previousElementSibling;
                if (continueHeader) {
                  const countMatch = continueHeader.textContent.match(/\((\d+)\)/);
                  const currentCount = countMatch ? parseInt(countMatch[1]) : 0;
                  continueHeader.querySelector('h3').innerHTML = `⚔️ Continue Battle <span style="color: #cdd6f4;">(${currentCount + 1})</span>`;
                }
                
                // Update Join Battle section count
                const joinHeader = document.querySelector('.monster-section:last-child .monster-section-header h3');
                if (joinHeader) {
                  const joinCountMatch = joinHeader.textContent.match(/\((\d+)\)/);
                  if (joinCountMatch) {
                    const joinCount = parseInt(joinCountMatch[1]) - 1;
                    joinHeader.innerHTML = `🆕 Join a Battle <span style="color: #cdd6f4;">(${Math.max(0, joinCount)})</span>`;
                  }
                }
              }
            }
          }
          
          showBattleModal(monster);
          showNotification(`You joined <strong>${monster.name}</strong>!`, "#2ecc71");
        } else {
          console.warn(`Monster ${monsterId} not found in page data after join`);
          showNotification("Joined, but unable to show battle modal.", "#e74c3c");
          // Fallback: Load the battle page directly
          setTimeout(() => location.href = `battle.php?id=${monsterId}`, 800);
        }
      } catch (e) {
        console.warn("Failed to fetch battle page after join:", e);
        showNotification("Joined!", "#2ecc71");
      }
    } else {
      showNotification(`Join failed: ${text || 'Unknown error'}`, "#e74c3c");
    }
  } catch (err) {
    console.error("Join error:", err);
    showNotification("Join error: " + err.message, "#e74c3c");
  } finally {
    btn.textContent = origText;
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  }
}

// Attack monster in modal
async function attackMonster(monsterOrId, skillId, btn) {
  const cost = (skillId === "-1") ? 10 : (skillId === "-2") ? 50 : (skillId === "-3") ? 100 : (skillId === "-4") ? 200 : 1;
  btn.disabled = true;

  // Extract monster info - support both object and plain ID for backwards compatibility
  const monster = typeof monsterOrId === 'object' ? monsterOrId : { id: monsterOrId };
  const monsterId = monster.id || monster.dgmid;
  
  try {
    // Build request parameters
    const params = {
      user_id: userData.userID,
      skill_id: skillId,
      stamina_cost: cost
    };
    
    // For dungeon battles, use dgmid and instance_id
    if (monster.dgmid && monster.instanceId) {
      params.dgmid = monster.dgmid;
      params.instance_id = monster.instanceId;
    } else {
      // For regular battles, use monster_id
      params.monster_id = monsterId;
    }
    
    const { status, text } = await postAction('damage.php', params);

    console.log('damage.php response:', text);
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse damage.php response:', e);
      showNotification('Invalid server response', '#e74c3c');
      return;
    }

    console.log('Parsed data:', data);

    if (status === 200 && data && data.status === 'success') {
      showNotification(data.message || `You used skill for ${data.damage || 'unknown'} DMG!`, '#2ecc71');

      const modal = document.getElementById('battleModal');
      if (modal) {
        // Update HP
        if (data.hp && data.hp.percent !== undefined && data.hp.value !== undefined) {
          modal.querySelector('#modalHpFill').style.width = data.hp.percent + '%';
          modal.querySelector('#modalHpText').innerHTML = `❤️ ${new Intl.NumberFormat().format(data.hp.value)} / ${new Intl.NumberFormat().format(findMonsterById(monsterId)?.maxHp || 0)} HP`;
        } else {
          console.warn('No HP data in response');
          // Fallback: Get HP data from battle page
          try {
            const html = await fetchBattlePageHtml(monsterId);
            const parsed = parseBattleHtml(html);
            if (parsed.hpPercent !== undefined && parsed.hpText) {
              modal.querySelector('#modalHpFill').style.width = parsed.hpPercent + '%';
              modal.querySelector('#modalHpText').innerHTML = `❤️ ${parsed.hpText}`;
            }
          } catch (e) {
            console.warn('Failed to fetch HP fallback:', e);
          }
        }

        // Update Stamina
        if (data.stamina !== undefined) {
          userData.currentStamina = data.stamina;
          updateUserDataUI();
        }

        // Update Damage Counter
        if (data.leaderboard) {
          console.log('Leaderboard data:', data.leaderboard);
          const myRow = data.leaderboard.find(r => Number(r.ID) === Number(userData.userID));
          if (myRow && modal.querySelector('#yourDamageValue')) {
            const damage = myRow.DAMAGE_DEALT;
            modal.querySelector('#yourDamageValue').textContent = new Intl.NumberFormat().format(damage);

            // Update damageDone in monster data
            const monster = findMonsterById(monsterId);
            if (monster) {
              monster.damageDone = damage;
              console.log(`Updated damageDone for monster ${monsterId} to ${damage}`);
            }
            updateCapNotice(damage);
          } else {
            console.warn('No matching leaderboard entry for user', userData.userID);
            modal.querySelector('#yourDamageValue').textContent = '0';
          }

          // Update Leaderboard
          const lbHtml = data.leaderboard.length > 0
            ? data.leaderboard.map((row, i) => {
              const isCurrentUser = Number(row.ID) === Number(userData.userID);
              const userHighlightStyle = isCurrentUser
                ? 'class="lb-row current-user-highlight" style="background: linear-gradient(135deg, rgba(203, 166, 247, 0.2) 0%, rgba(137, 180, 250, 0.2) 100%) !important; border-left: 4px solid rgb(249, 226, 175) !important; border-radius: 6px !important; box-shadow: rgba(203, 166, 247, 0.1) 0px 2px 8px !important; animation: 3s ease-in-out 0s infinite alternate none running userHighlightPulse !important;"'
                : 'class="lb-row"';

              return `
                    <div ${userHighlightStyle}>
                      <span class="lb-rank">#${i + 1}</span>
                      <img class="lb-avatar" src="${row.PICTURE || 'images/default_avatar.png'}" alt="">
                      <span class="lb-name">
                        <a href="player.php?pid=${row.ID}" style="color:white;">${row.USERNAME}</a>
                        ${isCurrentUser ? '<span class="user-indicator" style="color: rgb(249, 226, 175) !important; font-weight: bold !important;"> 👑</span>' : ''}
                      </span>
                      <span class="lb-dmg">${new Intl.NumberFormat().format(row.DAMAGE_DEALT)} DMG</span>

                    </div>

                  </div>
                </div>
                  `;
            }).join('')
            : '<div class="muted" style="font-size:14px;">No leaderboard data available.</div>';
          const lbListElement = modal.querySelector('.lb-list');
          if (lbListElement) {
            lbListElement.innerHTML = lbHtml;
          }
        } else {
          console.warn('No leaderboard data in response');
        }

        // Update Attack Log
        if (data.logs) {
          console.log('Attack logs:', data.logs);
          const logHtml = data.logs.length > 0
            ? data.logs.map(row => `⚔️ ${row.USERNAME} used ${row.SKILL_NAME} for ${new Intl.NumberFormat().format(row.DAMAGE)} DMG!<br>`).join('')
            : '<div class="muted" style="font-size:14px;">No attack logs available.</div>';
          const attackLogElement = modal.querySelector('#attackLog');
          if (attackLogElement) {
            attackLogElement.innerHTML = logHtml;
        }
      } else {
          console.warn('No attack logs in response');
        }

        // Close modal if monster is defeated
        if (data.hp && Number(data.hp.value) <= 0) {
          if (extensionSettings.battleModal.autoClose) {
            modal.style.display = 'none';
            setModalOpen(false);
          }
        }
    } else {
        console.warn('Battle modal not found');
      }
    } else {
      showNotification(data?.message || `Error ${status}: ${text}`, '#e74c3c');
    }
  } catch (e) {
    console.error('Attack error:', e);
    showNotification('Server error', '#e74c3c');
  } finally {
    btn.disabled = false;
  }
}

// Show battle modal
async function showBattleModal(monster) {
  let modal = document.getElementById('battleModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'battleModal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        z-index: 10000;
        align-items: flex-start;
        justify-content: flex-start;
        pointer-events: none;
      `;
    document.body.appendChild(modal);
  }
    
  // Calculate position offset
  let topOffset, leftOffset;
  
  // Check if modal has a saved position
  const savedPosition = extensionSettings.battleModal.position;
  if (savedPosition && savedPosition.x !== null && savedPosition.y !== null) {
    topOffset = savedPosition.y;
    leftOffset = savedPosition.x;
  } else if (extensionSettings.battleModal.positionX !== null && extensionSettings.battleModal.positionY !== null) {
    // Fallback to old position settings
    topOffset = extensionSettings.battleModal.positionY;
    leftOffset = extensionSettings.battleModal.positionX;
  } else {
    // Default position
    topOffset = 100;
    leftOffset = 50;
  }
  
  // Update modal positioning based on compact mode
  const isCompactMode = extensionSettings.battleModal.compact;
  if (isCompactMode) {
    modal.style.justifyContent = 'flex-start';
    modal.style.paddingLeft = '10%';
  } else {
    modal.style.justifyContent = 'center';
    modal.style.paddingLeft = '0';
  }

  let hpText = monster.currentHp?.toLocaleString() + ' / ' + monster.maxHp?.toLocaleString() + ' HP' || 'Unknown HP';
  let monsterName = monster.name;
  let monsterImage = monster.img || '';
  let lootItems = [];
  let leaderboard = [];
  let attackLogs = [];
  let damageDone = monster.damageDone || 0;
  let availableSkills = ['slash', 'power slash',]; // Default skills
  let classSkills = [];
  let playerStats = {
    hp: { current: 0, max: 0, text: '' },
    mana: { current: 0, max: 0, percent: 0, text: '', regen: '' }
  };

  try {
    const html = await fetchBattlePageHtml(monster.id, monster.battleUrl);
    const parsed = parseBattleHtml(html);
    hpText = parsed.hpText || hpText;
    monsterName = parsed.name || monsterName;
    monsterImage = parsed.monsterImage || monsterImage;
    lootItems = parsed.lootItems || [];
    leaderboard = parsed.leaderboard || [];
    attackLogs = parsed.attackLogs || [];
    classSkills = parsed.classSkills || [];
    playerStats = parsed.playerStats || playerStats;

    // Update monster HP data from parsed information
    if (parsed.maxHp) {
      monster.maxHp = parsed.maxHp;
    }
    if (parsed.currentHp) {
      monster.currentHp = parsed.currentHp;
    }

    // Update damageDone from leaderboard
    const myRow = parsed.leaderboard.find(r => Number(r.ID) === Number(userData.userID));
    if (myRow) {
      damageDone = myRow.DAMAGE_DEALT;
      monster.damageDone = damageDone;
      console.log(`Updated damageDone for monster ${monster.id} to ${damageDone} in showBattleModal`);
    }

    // Extract available skills for button generation
    availableSkills = parsed.availableSkills || ['slash', 'power slash', 'heroic slash'];

    console.log(`Fetched data for monster ${monster.id}:`, { lootItems: lootItems.length, leaderboard: leaderboard.length, attackLogs: attackLogs.length });
  } catch (e) {
    console.warn(`Failed to fetch battle page for modal (monster ${monster.id}):`, e);
  }

  const hpPercent = monster.maxHp > 0 ? (monster.currentHp / monster.maxHp) * 100 : 0;

  // Apply loot highlighting using extension's loot highlighting system
  const lootHtml = lootItems.length > 0
    ? lootItems.map(item => {
      const isUnlocked = !item.isLocked;
      const highlightStyle = isUnlocked && extensionSettings.lootHighlighting.enabled
        ? `background: ${extensionSettings.lootHighlighting.backgroundColor}; box-shadow: ${extensionSettings.lootHighlighting.glowColor} 0px 0px 15px;`
        : 'background: transparent;';
      const lockedBorderStyle = item.isLocked ? 'border-left: 5px solid #f38ba8;' : '';

      // Compact mode: Only show images with badges
      if (isCompactMode) {
        return `
              <div class="loot-card ${isUnlocked ? 'unlocked' : 'locked'}" style="display: flex; flex-direction: column; ${highlightStyle} border: 1px solid #4a4e69; border-radius: 8px; padding: 8px; transition: all 0.2s; opacity: 0.9; ${lockedBorderStyle} min-width: 80px; max-width: 90px; position: relative;">
                <div class="loot-img-wrap" style="position: relative; align-self: center;">
                  <img src="${item.img}" alt="${item.name}" title="${item.name}" style="width: 50px; height: 50px; border-radius: 4px; object-fit: cover; border: 1px solid #4a4e69;">
                  ${item.isLocked ? '<div class="lock-badge" style="position: absolute; top: -4px; right: -4px; background: #f38ba8; color: white; font-size: 0.55rem; padding: 2px 4px; border-radius: 4px; font-weight: bold;">🔒</div>' : ''}
                  ${item.dropChance ? `<div class="drop-badge" style="position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); background: rgba(137, 180, 250, 0.9); color: white; font-size: 0.55rem; padding: 2px 4px; border-radius: 4px; font-weight: bold; white-space: nowrap;">${item.dropChance}</div>` : ''}
                </div>
              </div>
            `;
      }

      // Normal mode: Full card with description
      return `
            <div class="loot-card ${isUnlocked ? 'unlocked' : 'locked'}" style="display: flex; flex-direction: column; ${highlightStyle} border: 1px solid #4a4e69; border-radius: 8px; padding: 10px; transition: all 0.2s; opacity: 0.9; ${lockedBorderStyle} min-width: 160px; max-width: 220px; flex: 1; min-height: 200px;">
              <div class="loot-img-wrap" style="position: relative; align-self: center; margin-bottom: 8px;">
                <img src="${item.img}" alt="${item.name}" style="width: 60px; height: 60px; border-radius: 4px; object-fit: cover; border: 1px solid #4a4e69;">
                ${item.isLocked ? '<div class="lock-badge" style="position: absolute; top: 0; right: 0; background: #f38ba8; color: white; font-size: 0.6rem; padding: 2px 4px; border-radius: 0 4px 0 4px; font-weight: bold;">🔒 Locked</div>' : ''}
              </div>
              <div class="loot-meta" style="flex: 1; text-align: center;">
                <div class="loot-name" style="font-weight: bold; color: #f9e2af; margin-bottom: 5px; font-size: 0.9rem; line-height: 1.2;">${item.name}</div>
                <div class="loot-desc" style="font-size: 0.7rem; color: #a0a0a0; margin-bottom: 8px; line-height: 1.3; word-wrap: break-word; overflow-wrap: break-word; hyphens: auto;">${item.desc}</div>
                <div class="loot-stats" style="display: flex; flex-direction: column; gap: 3px; align-items: center;">
                  ${item.dropChance ? `<span class="chip" style="display: inline-block; padding: 3px 6px; border-radius: 12px; background: rgba(74, 78, 105, 0.5); font-size: 0.7rem; color: #cdd6f4;">Drop: ${item.dropChance}</span>` : ''}
                  ${item.dmgReq ? `<span class="chip" style="display: inline-block; padding: 3px 6px; border-radius: 12px; background: rgba(74, 78, 105, 0.5); font-size: 0.7rem; color: #cdd6f4;">DMG req: ${item.dmgReqNumber ? formatCompactNumber(item.dmgReqNumber) : item.dmgReq}</span>` : ''}
                  <span class="chip tierchip ${item.tier.toLowerCase()}" style="display: inline-block; padding: 3px 6px; border-radius: 12px; background: ${item.tier.toLowerCase() === 'legendary' ? '#f9e2af' : '#89b4fa'}; color: ${item.tier.toLowerCase() === 'legendary' ? '#1e1e2e' : '#cdd6f4'}; font-size: 0.7rem;">${item.tier.toUpperCase()}</span>
                </div>
              </div>
            </div>
          `;
    }).join('')
    : '<div style="color: #6c7086; font-size: 16px; text-align: center; padding: 40px;">No loot available.</div>';

  const lbHtml = extensionSettings.battleModal.showLeaderboard && leaderboard.length > 0
    ? leaderboard.map((row, i) => {
      const isCurrentUser = Number(row.ID) === Number(userData.userID);
      const userHighlightClass = isCurrentUser ? 'current-user-highlight' : '';
      const userHighlightStyle = isCurrentUser
        ? 'background: linear-gradient(135deg, rgba(203, 166, 247, 0.2) 0%, rgba(137, 180, 250, 0.2) 100%) !important; border-left: 4px solid #f9e2af !important; border-radius: 6px !important; padding-left: 5px; margin-top: 5px; animation: userHighlightPulse 3s infinite alternate ease-in-out;'
        : '';

      return `
            <div class="lb-row ${userHighlightClass}" style="display: flex; align-items: center; padding: 6px 0; border-bottom: 1px dashed rgba(255, 255, 255, 0.1); font-size: 0.9rem; ${userHighlightStyle}">
              <span class="lb-rank" style="font-weight: bold; width: 30px; color: #a6e3a1;">#${i + 1}</span>
              <img class="lb-avatar" src="${row.PICTURE || 'images/default_avatar.png'}" alt="" style="width: 25px; height: 25px; border-radius: 50%; margin-right: 10px; object-fit: cover;">
              <span class="lb-name" style="flex-grow: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                <a href="player.php?pid=${row.ID}" style="color: #cdd6f4; text-decoration: none;" draggable="false">${row.USERNAME}</a>
                ${isCurrentUser ? '<span class="user-indicator" style="color: #f9e2af !important; font-weight: bold !important;"> 👑</span>' : ''}
              </span>
              <span class="lb-dmg" style="font-weight: bold; color: #eba0ac; min-width: 80px; text-align: right;">${new Intl.NumberFormat().format(row.DAMAGE_DEALT)} DMG</span>
            </div>
          `;
    }).join('')
    : '<div style="color: #6c7086; font-size: 14px; text-align: center; padding: 20px;">No leaderboard data available.</div>';

  const logHtml = extensionSettings.battleModal.showAttackLogs && attackLogs.length > 0
    ? attackLogs.map((row, i) => `
          <div class="log-entry" style="padding: 5px 0; border-bottom: 1px dotted rgba(255, 255, 255, 0.05); font-size: 0.9rem;">⚔️ <a href="player.php?pid=${row.USER_ID || ''}" style="color: #cdd6f4; text-decoration: none; font-weight: bold;">${row.USERNAME}</a> used ${row.SKILL_NAME} for ${new Intl.NumberFormat().format(row.DAMAGE)} DMG!</div>
        `).join('')
    : '<div style="color: #6c7086; font-size: 14px; text-align: center; padding: 20px;">No attack logs available.</div>';

  // Generate class skill buttons HTML
  const classSkillsHtml = classSkills && classSkills.length > 0
    ? classSkills.map(skill => `
          <button type="button" class="skill-slot attack-btn" 
                  data-skill-id="${skill.id}" 
                  data-skill-name="${skill.displayName}" 
                  data-stam-cost="${skill.stamCost}"
                  data-monster-id="${monster.id}"
                  style="display: flex; flex-direction: column; align-items: center; padding: 8px; background: linear-gradient(135deg, #1e1e2e, #2a2a3e); border: 1px solid #45475a; border-radius: 8px; cursor: pointer; transition: all 0.2s; min-width: 80px;"
                  onmouseover="this.style.transform='translateY(-2px)'; this.style.borderColor='#89b4fa';"
                  onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='#45475a';">
            <div class="skill-name" style="font-size: 0.75rem; color: #cdd6f4; font-weight: bold; margin-bottom: 4px; text-align: center;">${skill.displayName}</div>
            ${skill.icon ? `
              <div class="skill-icon-wrap" style="width: 32px; height: 32px; margin-bottom: 4px;">
                <img src="${skill.icon}" alt="${skill.displayName}" style="width: 100%; height: 100%; object-fit: contain;">
              </div>
            ` : ''}
            <div class="skill-cost" style="font-size: 0.65rem; color: #89b4fa; text-align: center;">${skill.cost}</div>
          </button>
        `).join('')
    : '';

  // Generate player stats HTML (HP and Mana bars)
  const playerStatsHtml = (playerStats.hp.max > 0 || playerStats.mana.max > 0) ? `
    <div class="player-stats-card" style="background: rgba(30, 30, 46, 0.6); border: 1px solid #45475a; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
      <div style="font-size: 0.7rem; color: #9aa0b8; font-weight: 600; text-transform: uppercase; margin-bottom: 8px;">💚 Your Stats</div>
      
      ${playerStats.hp.max > 0 ? `
        <div style="margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
            <span style="font-size: 0.75rem; color: #a6e3a1; font-weight: bold;">HP</span>
            <span style="font-size: 0.7rem; color: #cdd6f4;">${playerStats.hp.text}</span>
          </div>
          <div class="hp-bar" style="background: #313244; border-radius: 4px; height: 6px; overflow: hidden; border: 1px solid #45475a;">
            <div class="hp-fill" style="height: 100%; background: linear-gradient(90deg, #a6e3a1, #40a02b); width: ${(playerStats.hp.current / playerStats.hp.max * 100).toFixed(1)}%; transition: width 0.3s ease-out;"></div>
          </div>
        </div>
      ` : ''}
      
      ${playerStats.mana.max > 0 ? `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
            <span style="font-size: 0.75rem; color: #89b4fa; font-weight: bold;">Mana</span>
            <span style="font-size: 0.7rem; color: #cdd6f4;">${playerStats.mana.text}</span>
          </div>
          <div class="hp-bar" style="background: #313244; border-radius: 4px; height: 6px; overflow: hidden; border: 1px solid #45475a;">
            <div class="hp-fill mana-fill--player" style="height: 100%; background: linear-gradient(90deg, #89b4fa, #1e66f5); width: ${playerStats.mana.percent}%; transition: width 0.3s ease-out;"></div>
          </div>
          ${playerStats.mana.regen ? `<div style="font-size: 0.65rem; color: #6c7086; margin-top: 2px;">${playerStats.mana.regen}</div>` : ''}
        </div>
      ` : ''}
    </div>
  ` : '';

  console.log('Generated classSkillsHtml:', classSkillsHtml);
  console.log('Generated playerStatsHtml:', playerStatsHtml);

  // Compact mode: Only show name, health, and attacks
  if (isCompactMode) {
    modal.innerHTML = `
        <div id="battleModalContent" class="battle-modal-content" style="background: rgba(0, 0, 0, 0.85); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 20px; width: 95%; max-width: 600px; overflow-y: auto; font-family: Arial, sans-serif; color: white; position: relative; transform: scale(${extensionSettings.battleModal.zoomScale || 1.0}); transform-origin: center top; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);">

          <!-- Close Button -->
          <button class="modal-close-btn" style="position: absolute; top: 10px; right: 15px; background: transparent; border: none; color: white; font-size: 24px; cursor: pointer; z-index: 1001; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.2s;" title="Close">✕</button>

          <!-- Compact Controls -->
          <div class="content-area" style="margin-bottom: 20px;">
            <div id="battle-filter-container" style="padding: 10px; background: transparent; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; margin-bottom: 15px; display: flex; gap: 10px; align-items: center; justify-content: center; flex-wrap: wrap;">
              <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: center; width: 100%;">
                <label style="display: flex; align-items: center; gap: 5px; color: #cdd6f4;">
                  <input type="checkbox" id="battle-compact-modal-toggle" class="cyberpunk-checkbox" checked>
                  🎯 Compact layout
                </label>

                <label style="display: flex; align-items: center; gap: 5px; color: #cdd6f4;">
                  🔍 Zoom: <input type="range" id="battle-zoom-slider" min="0.5" max="2.0" step="0.1" value="${extensionSettings.battleModal.zoomScale || 1.0}" style="width: 80px;">
                  <span id="battle-zoom-value" style="min-width: 35px; display: inline-block;">${(extensionSettings.battleModal.zoomScale || 1.0).toFixed(1)}x</span>
                </label>

                <button id="battle-clear-filters" style="padding: 5px 10px; background: #f38ba8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                  Reset
                </button>
              </div>
            </div>
          </div>

          <!-- Minimal Monster Info -->
          <div style="background: transparent; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; padding: 20px;">
            <div class="monster-info-block" style="text-align: center;">
              <strong style="font-size: 1.5rem; color: white; display: block; margin-bottom: 15px;">${monsterName}</strong>
              
              <div class="hp-bar" style="background: #313244; border-radius: 10px; height: 20px; overflow: hidden; margin: 15px 0; border: 1px solid #45475a;">
                <div class="hp-fill" id="modalHpFill" style="height: 100%; background: linear-gradient(90deg, #22c55e, #16a34a); width: ${hpPercent}%; transition: width 0.3s ease-out;"></div>
              </div>
              <div class="hp-text" id="modalHpText" style="font-size: 1.1rem; color: #22c55e; font-weight: bold; margin-bottom: 15px;">❤️ ${hpText}</div>
              
              <div class="stats-compact" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
                <div class="stats-stack damage-info" id="yourStats" data-maxhp="${monster.maxHp || 0}" data-capfraction="0.2" data-capperc="20.00">
                  <span class="chip damage-chip" style="display: inline-block; padding: 6px 12px; border-radius: 12px; background: rgba(249, 226, 175, 0.15); color: #cdd6f4; font-size: 0.9rem;">
                    💪 Your Damage: <span id="yourDamageValue" style="color: #f9e2af; font-weight: bold;">${new Intl.NumberFormat().format(damageDone)}</span> DMG
                  </span>
                </div>
                
                <div class="stats-stack player-count">
                  <span class="chip player-chip" style="display: inline-block; padding: 6px 12px; border-radius: 12px; background: rgba(137, 180, 250, 0.15); color: #89b4fa; font-size: 0.9rem;">
                    👥 Players Joined: <span style="font-weight: bold;">${leaderboard.length}</span>
                  </span>
                </div>
              </div>
              
              ${playerStatsHtml}
              
              <div class="attack-btn-wrap" style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
                ${availableSkills.includes('slash') && extensionSettings.battleModal.showSlash ? `<button class="attack-btn skill-default" data-skill-id="0" data-monster-id="${monster.id}" style="padding: 12px; border: 1px solid #007bff; background: #007bff; color: white; border-radius: 4px; font-weight: bold; cursor: pointer; transition: all 0.2s; font-size: 1rem;">⚔️ Slash</button>` : ''}
                ${availableSkills.includes('power') && extensionSettings.battleModal.showPowerSlash ? `<button class="attack-btn skill-power" data-skill-id="-1" data-monster-id="${monster.id}" style="padding: 12px; border: 1px solid #007bff; background: #007bff; color: white; border-radius: 4px; font-weight: bold; cursor: pointer; transition: all 0.2s; font-size: 1rem;">💥 Power Slash (10 STAMINA)</button>` : ''}
                ${availableSkills.includes('heroic') && extensionSettings.battleModal.showHeroicSlash ? `<button class="attack-btn skill-heroic" data-skill-id="-2" data-monster-id="${monster.id}" style="padding: 12px; border: 1px solid #007bff; background: #007bff; color: white; border-radius: 4px; font-weight: bold; cursor: pointer; transition: all 0.2s; font-size: 1rem;">🔥 Heroic Slash (50 STAMINA)</button>` : ''}
                ${availableSkills.includes('ultimate') && extensionSettings.battleModal.showUltimateSlash ? `<button class="attack-btn skill-ultimate" data-skill-id="-3" data-monster-id="${monster.id}" style="padding: 12px; border: 1px solid #6f42c1; background: linear-gradient(90deg,#6f42c1,#b197fc); color: white; border-radius: 4px; font-weight: bold; cursor: pointer; transition: all 0.2s; font-size: 1rem;">⚡ Ultimate Slash (100 STAMINA)</button>` : ''}
                ${availableSkills.includes('legendary') && extensionSettings.battleModal.showLegendarySlash ? `<button class="attack-btn skill-legendary" data-skill-id="-4" data-monster-id="${monster.id}" style="padding: 12px; border: 1px solid #b8860b; background: linear-gradient(90deg,#b8860b,#ffd54f); color: black; border-radius: 4px; font-weight: bold; cursor: pointer; transition: all 0.2s; font-size: 1rem;">🌟 Legendary Slash (200 STAMINA)</button>` : ''}
              </div>
              
              ${classSkillsHtml ? `
              <div class="class-skills-section" style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2);">
                <div style="font-weight: bold; color: #89b4fa; margin-bottom: 10px; font-size: 0.9rem; text-align: center;">⚔️ Class Skills</div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 8px;">
                  ${classSkillsHtml}
                </div>
              </div>
              ` : ''}
            </div>
          </div>

        </div>
      `;
  } else {
    // Normal mode: Full layout with all sections
    modal.innerHTML = `
        <div id="battleModalContent" class="battle-modal-content" style="background: rgba(0, 0, 0, 0.85); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 20px; width: 95%; max-width: 1400px; height: 90vh; overflow-y: auto; font-family: Arial, sans-serif; color: white; position: relative; transform: scale(${extensionSettings.battleModal.zoomScale || 1.0}); transform-origin: center top; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);">

          <!-- Close Button -->
          <button class="modal-close-btn" style="position: absolute; top: 10px; right: 15px; background: transparent; border: none; color: white; font-size: 24px; cursor: pointer; z-index: 1001; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.2s;" title="Close">✕</button>

          <!-- Battle Filter Container -->
          <div class="content-area" style="margin-bottom: 20px;">
            <div id="battle-filter-container" style="padding: 10px; background: transparent; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; margin-bottom: 15px; display: flex; gap: 10px; align-items: center; justify-content: center; flex-wrap: wrap;">
              <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-start; justify-content: center; width: 100%;">
                <label style="display: flex; align-items: center; gap: 5px; color: #cdd6f4;">
                  <input type="checkbox" id="battle-hide-images-toggle" class="cyberpunk-checkbox">
                  🖼️ Hide all images
                </label>

                <label style="display: flex; align-items: center; gap: 5px; color: #cdd6f4;">
                  <input type="checkbox" id="battle-compact-modal-toggle" class="cyberpunk-checkbox" ${extensionSettings.battleModal.compact ? 'checked' : ''}>
                  🎯 Compact layout
                </label>

                <label style="display: flex; align-items: center; gap: 5px; color: #cdd6f4;">
                  🔍 Zoom: <input type="range" id="battle-zoom-slider" min="0.5" max="2.0" step="0.1" value="${extensionSettings.battleModal.zoomScale || 1.0}" style="width: 80px;">
                  <span id="battle-zoom-value" style="min-width: 35px; display: inline-block;">${(extensionSettings.battleModal.zoomScale || 1.0).toFixed(1)}x</span>
                </label>

                <button id="battle-clear-filters" style="padding: 5px 10px; background: #f38ba8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div id="extension-enemy-loot-container" class="top-panel-container" style="display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 20px;">
              
              <div id="monster-loot-combined" class="monster-loot-panel panel" style="background: transparent; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; padding: 20px; overflow-y: auto;">
                  <!-- Side by Side Layout Container -->
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: start;">
                      
                      <!-- Monster Section -->
                      <div class="monster-section" style="display: flex; flex-direction: column; align-items: center; gap: 15px; text-align: center;">
                          <div class="monster-image-wrapper" style="border: 3px solid ${extensionSettings.monsterImageOutlineColor || '#ff6b6b'}; box-shadow: 0 0 10px rgba(243, 139, 168, 0.5); border-radius: 8px; overflow: hidden;">
                              <img class="monster_image" id="modalMonsterImage" src="${monsterImage}" alt="${monsterName}" style="max-height: 300px; max-width: 100%;">
                          </div>
                          
                          <div class="monster-info-block" style="width: 100%;">
                              <strong style="font-size: 1.3rem; color: white; display: block; margin-bottom: 10px;">${monsterName}</strong>
                              
                              <div class="hp-bar" style="background: #313244; border-radius: 10px; height: 16px; overflow: hidden; margin: 8px 0; border: 1px solid #45475a;">
                                  <div class="hp-fill" id="modalHpFill" style="height: 100%; background: linear-gradient(90deg, #22c55e, #16a34a); width: ${hpPercent}%; transition: width 0.3s ease-out;"></div>
                              </div>
                              <div class="hp-text" id="modalHpText" style="font-size: 0.9rem; color: #22c55e; font-weight: bold;"> ${hpText}</div>
                              
                              <div class="stats-stack" style="margin: 10px 0;">
                                  <span class="chip exp-chip" style="display: inline-block; padding: 4px 8px; border-radius: 12px; background: rgba(166, 227, 161, 0.2); color: #a6e3a1; font-size: 0.8rem; margin: 2px;">Exp & Gold Rewards up to LV 1,000</span>
                              </div>
                              
                              <div class="stats-stack damage-info" id="yourStats" data-maxhp="${monster.maxHp || 0}" data-capfraction="0.2" data-capperc="20.00" style="margin: 10px 0;">
                                  <span class="chip damage-chip" style="display: inline-block; padding: 4px 8px; border-radius: 12px; background: rgba(249, 226, 175, 0.1); color: #cdd6f4; font-size: 0.8rem; margin: 2px;">
                                      💪 Your Damage: <span id="yourDamageValue" style="color: #f9e2af;">${new Intl.NumberFormat().format(damageDone)}</span> DMG
                                  </span>
                              </div>
                              
                              ${playerStatsHtml}
                              
                              <div class="attack-btn-wrap" style="display: flex; flex-direction: column; gap: 8px; width: 100%; margin-top: 15px;">
                                  ${availableSkills.includes('slash') && extensionSettings.battleModal.showSlash ? `<button class="attack-btn skill-default" data-skill-id="0" data-monster-id="${monster.id}" style="padding: 10px; border: 1px solid #007bff; background: #007bff; color: white; border-radius: 4px; font-weight: bold; cursor: pointer; transition: all 0.2s;">⚔️ Slash</button>` : ''}
                                  ${availableSkills.includes('power') && extensionSettings.battleModal.showPowerSlash ? `<button class="attack-btn skill-power" data-skill-id="-1" data-monster-id="${monster.id}" style="padding: 10px; border: 1px solid #007bff; background: #007bff; color: white; border-radius: 4px; font-weight: bold; cursor: pointer; transition: all 0.2s;">💥 Power Slash (10 STAMINA)</button>` : ''}
                                  ${availableSkills.includes('heroic') && extensionSettings.battleModal.showHeroicSlash ? `<button class="attack-btn skill-heroic" data-skill-id="-2" data-monster-id="${monster.id}" style="padding: 10px; border: 1px solid #007bff; background: #007bff; color: white; border-radius: 4px; font-weight: bold; cursor: pointer; transition: all 0.2s;">🔥 Heroic Slash (50 STAMINA)</button>` : ''}
                                  ${availableSkills.includes('ultimate') && extensionSettings.battleModal.showUltimateSlash ? `<button class="attack-btn skill-ultimate" data-skill-id="-3" data-monster-id="${monster.id}" style="padding: 10px; border: 1px solid #6f42c1; background: linear-gradient(90deg,#6f42c1,#b197fc); color: white; border-radius: 4px; font-weight: bold; cursor: pointer; transition: all 0.2s;">⚡ Ultimate Slash (100 STAMINA)</button>` : ''}
                                  ${availableSkills.includes('legendary') && extensionSettings.battleModal.showLegendarySlash ? `<button class="attack-btn skill-legendary" data-skill-id="-4" data-monster-id="${monster.id}" style="padding: 10px; border: 1px solid #b8860b; background: linear-gradient(90deg,#b8860b,#ffd54f); color: black; border-radius: 4px; font-weight: bold; cursor: pointer; transition: all 0.2s;">🌟 Legendary Slash (200 STAMINA)</button>` : ''}
                              </div>
                              
                              ${classSkillsHtml ? `
                              <div class="class-skills-section" style="margin-top: 15px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.2);">
                                <div style="font-weight: bold; color: #89b4fa; margin-bottom: 8px; font-size: 0.9rem; text-align: center;">⚔️ Class Skills</div>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 8px;">
                                  ${classSkillsHtml}
                                </div>
                              </div>
                              ` : ''}
                          </div>
                      </div>
                      
                      <!-- Loot Section -->
                      <div class="loot-section">
                          <h3 class="panel-title loot-header" style="color: white; font-size: 1.1rem; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.3); display: block;">🎁 Possible Loot</h3>
                          <div class="loot-grid" style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: flex-start;">
                              ${lootHtml}
                          </div>
                      </div>
                      
                  </div>
              </div>
          </div>
          
          <div class="bottom-panel-container" style="display: flex; gap: 20px; align-items: flex-start;">
              
              ${extensionSettings.battleModal.showLeaderboard ? `
              <div class="leaderboard-panel panel" style="background: transparent; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 20px; flex: 1 1 0%; min-height: 250px; max-height: 500px;">
                  <strong class="panel-title" style="color: white; font-size: 1.1rem; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.2); display: block;">📊 Attackers Leaderboard</strong>
                  <div class="lb-list" style="overflow-y: auto; max-height: 400px; padding-right: 5px;">
                      ${lbHtml}
                  </div>
              </div>
              ` : ''}
              
              ${extensionSettings.battleModal.showAttackLogs ? `
              <div class="log-panel panel" style="background: transparent; border: 1px solid rgba(255,255,255,0.25); border-radius: 4px; padding: 20px; flex: 1 1 0%; min-height: 250px; max-height: 500px;">
                  <strong class="panel-title" style="color: white; font-size: 1.1rem; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.25); display: block;">📜 Attack Log</strong>
                  <div id="attackLog" class="log-list" style="overflow-y: auto; max-height: 400px; padding-right: 5px;">
                      ${logHtml}
                  </div>
              </div>
              ` : ''}
              
          </div>

        </div>
      `;
  }

  // Apply position to modal
  const modalContent = modal.querySelector('#battleModalContent');
  if (modalContent) {
    modalContent.style.position = 'fixed';
    modalContent.style.top = topOffset + 'px';
    modalContent.style.left = leftOffset + 'px';
    modalContent.style.margin = '0';
    modalContent.style.transform = `scale(${extensionSettings.battleModal.zoomScale || 1.0})`;
    modalContent.style.transformOrigin = 'center top';
    modalContent.style.cursor = 'move'; // Indicate draggable
    modalContent.style.zIndex = '10001'; // Above backdrop
  }

  // Add drag functionality to modal content
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let modalStartX = 0;
  let modalStartY = 0;
  let unscaledWidth = 0;
  let unscaledHeight = 0;
  const scaleFactor = extensionSettings.battleModal.zoomScale || 1.0;

  const startDrag = (e) => {
    if (e.target.closest('.attack-btn, .skill-slot, button, input, select, textarea, a')) {
      return; // Don't drag if clicking on interactive elements
    }
    
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    
    const rect = modalContent.getBoundingClientRect();
    modalStartX = rect.left;
    modalStartY = rect.top;
    
    // Calculate unscaled dimensions once at start of drag
    unscaledWidth = rect.width / scaleFactor;
    unscaledHeight = rect.height / scaleFactor;
    
    modalContent.style.cursor = 'grabbing';
    e.preventDefault();
  };

  const drag = (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    
    const newLeft = modalStartX + deltaX;
    const newTop = modalStartY + deltaY;
    
    // Reasonable constraints - allow modal to go mostly off-screen but not completely
    const maxLeft = window.innerWidth - 50; // Allow modal to go 50px off right edge
    const minLeft = -unscaledWidth + 50;   // Allow modal to go 50px off left edge
    const maxTop = window.innerHeight - 50; // Allow modal to go 50px off bottom edge
    const minTop = -unscaledHeight + 50;   // Allow modal to go 50px off top edge
    
    modalContent.style.left = Math.max(minLeft, Math.min(newLeft, maxLeft)) + 'px';
    modalContent.style.top = Math.max(minTop, Math.min(newTop, maxTop)) + 'px';
  };

  const endDrag = () => {
    if (!isDragging) return;
    
    isDragging = false;
    modalContent.style.cursor = 'move';
    
    // Save the new position
    const rect = modalContent.getBoundingClientRect();
    extensionSettings.battleModal.position = {
      x: rect.left,
      y: rect.top
    };
    saveSettings();
    
    console.log(`Battle modal position saved: X=${rect.left}, Y=${rect.top}`);
  };

  // Add drag event listeners (store references for cleanup)
  const dragListeners = {
    mousedown: startDrag,
    mousemove: drag,
    mouseup: endDrag,
    selectstart: (e) => { if (isDragging) e.preventDefault(); }
  };
  
  modalContent.addEventListener('mousedown', dragListeners.mousedown);
  document.addEventListener('mousemove', dragListeners.mousemove);
  document.addEventListener('mouseup', dragListeners.mouseup);
  modalContent.addEventListener('selectstart', dragListeners.selectstart);
  
  // Store drag listeners on modal for cleanup
  modalContent._dragListeners = dragListeners;

  // Add hover effects for attack buttons
  modal.querySelectorAll('.attack-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    });
  });

  modal.style.display = 'flex';
  setModalOpen(true);

  // Escape key toggle for closing modal
  const handleEscapeKey = (e) => {
    if (e.key === 'Escape' || e.keyCode === 27) {
      e.preventDefault();
      console.log('Closing battle modal via Escape key');
      modal.style.display = 'none';
      setModalOpen(false);
      // Remove the event listener to prevent memory leaks
      document.removeEventListener('keydown', handleEscapeKey);
      // Clean up drag listeners
      if (modalContent && modalContent._dragListeners) {
        document.removeEventListener('mousemove', modalContent._dragListeners.mousemove);
        document.removeEventListener('mouseup', modalContent._dragListeners.mouseup);
      }
    }
  };

  // Add the escape key listener when modal opens
  document.addEventListener('keydown', handleEscapeKey);

  // Event listener for close button
  const closeBtn = modal.querySelector('.modal-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      console.log('Closing battle modal via close button');
      modal.style.display = 'none';
      setModalOpen(false);
      // Remove escape key listener to prevent memory leaks
      document.removeEventListener('keydown', handleEscapeKey);
      // Clean up drag listeners
      if (modalContent && modalContent._dragListeners) {
        document.removeEventListener('mousemove', modalContent._dragListeners.mousemove);
        document.removeEventListener('mouseup', modalContent._dragListeners.mouseup);
      }
    });

    // Close button hover effect
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(255,255,255,0.1)';
      closeBtn.style.transform = 'scale(1.1)';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'transparent';
      closeBtn.style.transform = 'scale(1)';
    });
  }

  // Allow clicking through the background to interact with other elements
  modal.style.pointerEvents = 'none';
  if (modalContent) {
    modalContent.style.pointerEvents = 'auto';
  }

  // Add click-outside-to-close functionality if enabled
  if (extensionSettings.battleModal.modalBackdrop) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
        setModalOpen(false);
        // Remove escape key listener to prevent memory leaks
        document.removeEventListener('keydown', handleEscapeKey);
        // Clean up drag listeners
        if (modalContent && modalContent._dragListeners) {
          document.removeEventListener('mousemove', modalContent._dragListeners.mousemove);
          document.removeEventListener('mouseup', modalContent._dragListeners.mouseup);
        }
      }
    });
  }

  // Event listeners for attack buttons
  modal.querySelectorAll('.attack-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      console.log(`Attack button clicked: skill-id=${btn.getAttribute('data-skill-id')}, monster-id=${btn.getAttribute('data-monster-id')}`);
      await attackMonster(monster, btn.getAttribute('data-skill-id'), btn);
    });
  });

  // Hide images toggle functionality
  const hideImagesToggle = modal.querySelector('#battle-hide-images-toggle');
  if (hideImagesToggle) {
    hideImagesToggle.addEventListener('change', () => {
      const battleModalContent = modal.querySelector('#battleModalContent');

      if (hideImagesToggle.checked) {
        // Add the CSS class to hide all images
        if (battleModalContent) {
          battleModalContent.classList.add('battle-images-hidden');
        }
      } else {
        // Remove the CSS class to show all images
        if (battleModalContent) {
          battleModalContent.classList.remove('battle-images-hidden');
        }
      }
    });
  }

  // Compact layout toggle functionality
  const compactToggle = modal.querySelector('#battle-compact-modal-toggle');
  if (compactToggle) {
    compactToggle.addEventListener('change', (e) => {
      extensionSettings.battleModal.compact = e.target.checked;
      saveSettings();
      // Reload the modal to apply compact layout
      showNotification('Compact layout ' + (e.target.checked ? 'enabled' : 'disabled') + '. Reloading modal...', 'info');
      modal.style.display = 'none';
      setModalOpen(false);
      // Clean up drag listeners before reopening
      if (modalContent && modalContent._dragListeners) {
        document.removeEventListener('mousemove', modalContent._dragListeners.mousemove);
        document.removeEventListener('mouseup', modalContent._dragListeners.mouseup);
      }
      showBattleModal(monster);
    });
  }

  // Clear filters button functionality
  const clearFiltersBtn = modal.querySelector('#battle-clear-filters');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      if (hideImagesToggle) {
        hideImagesToggle.checked = false;
        // Remove CSS class to show all images
        const battleModalContent = modal.querySelector('#battleModalContent');
        if (battleModalContent) {
          battleModalContent.classList.remove('battle-images-hidden');
        }
      }
      // Reset zoom to default
      const zoomSlider = modal.querySelector('#battle-zoom-slider');
      const zoomValue = modal.querySelector('#battle-zoom-value');
      if (zoomSlider && zoomValue) {
        zoomSlider.value = 1.0;
        zoomValue.textContent = '1.0x';
        const battleModalContent = modal.querySelector('#battleModalContent');
        if (battleModalContent) {
          battleModalContent.style.transform = 'scale(1.0)';
        }
        extensionSettings.battleModal.zoomScale = 1.0;
        saveSettings();
      }
    });
  }

  // Zoom slider functionality
  const zoomSlider = modal.querySelector('#battle-zoom-slider');
  const zoomValue = modal.querySelector('#battle-zoom-value');
  if (zoomSlider && zoomValue) {
    zoomSlider.addEventListener('input', (e) => {
      const scale = parseFloat(e.target.value);
      zoomValue.textContent = scale.toFixed(1) + 'x';
      const battleModalContent = modal.querySelector('#battleModalContent');
      if (battleModalContent) {
        battleModalContent.style.transform = `scale(${scale})`;
      }
      extensionSettings.battleModal.zoomScale = scale;
      saveSettings();
    });
  }

  // Add hover effects to loot cards (matching your new design)
  modal.querySelectorAll('.loot-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.opacity = '1';
      card.style.transform = 'translateX(2px)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.opacity = '0.9';
      card.style.transform = 'translateX(0)';
    });
  });

  // Add hover effects to attack buttons
  modal.querySelectorAll('.attack-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 6px 10px rgba(0, 0, 0, 0.5)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';
    });
  });

  updateCapNotice(damageDone);

  // Apply monster backgrounds to modal immediately
  applyMonsterBackgrounds();
}

// Update join button text based on modal state
function updateJoinButtonText(monsterId, newText) {
  document.querySelectorAll('.join-btn').forEach(btn => {
    if (btn.closest('.monster-card')) {
      const battleLink = btn.closest('.monster-card').querySelector('a[href*="battle.php"]');
      if (battleLink && battleLink.href.includes(`id=${monsterId}`)) {
        btn.innerText = newText;
      }
    }
  });
}

// Handle loot action
async function handleLoot(monsterId, monsterName, btn) {
  const origText = btn.textContent;
  btn.disabled = true;
  btn.style.opacity = '0.6';
  btn.style.cursor = 'not-allowed';

  try {
    const userId = userData.userID;
    if (!userId) throw new Error("user_id missing");

    const { status, text } = await postAction("loot.php", {
      monster_id: monsterId,
      user_id: userId
    });

    console.log("loot.php response:", text);

    if (status === 200) {
      let data;
      try { data = JSON.parse(text); } catch (e) { data = null; }

      if (data && data.status === 'success') {
        showNotification(data.message, "#2ecc71");

        if (data.rewards) {
          userData.currentExp += data.rewards.exp || 0;
          userData.gold += data.rewards.gold || 0;
          updateUserDataUI();
        }

        if (extensionSettings.battleModal.showLootModal) {
          showLootModal(data, monsterName);
        }
      } else {
        showNotification(data?.message || 'Failed to process loot', "#e74c3c");
      }
    } else {
      showNotification(`Loot failed: ${text || 'Unknown error'}`, "#e74c3c");
    }
  } catch (err) {
    console.error("Loot error:", err);
    showNotification("Loot error: " + err.message, "#e74c3c");
  } finally {
    btn.textContent = origText;
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  }
}

// Show loot modal
function showLootModal(lootData, monsterName) {
  let modal = document.getElementById('lootModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'lootModal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 50000;
        align-items: center;
        justify-content: center;
      `;
    document.body.appendChild(modal);
  }

  const itemsHtml = lootData.items && lootData.items.length > 0
    ? lootData.items.map(item => {
      const count = item.count && item.count > 1 ? `<br><small style="color: #4CAF50; font-weight: bold;">x${item.count}</small>` : '';
      return `
          <div class="loot-item" style="background:#1e1e2f; border-radius:8px; padding:10px; text-align:center; width:80px;">
            <img src="${item.IMAGE_URL}" alt="${item.NAME}" style="width:64px; height:64px; border-radius:4px;">
            <small style="font-size:12px; color:#ccc;">${item.NAME}</small>
            ${count}
          </div>
        `;
    }).join('')
    : '<div class="muted" style="font-size:14px;">No items received.</div>';

  const noteHtml = lootData.note
    ? `<div id="lootNote" class="muted" style="margin:-6px 0 10px 0; font-size:14px;">${lootData.note}</div>`
    : '<div id="lootNote" class="muted" style="display:none; margin:-6px 0 10px 0;"></div>';

  modal.innerHTML = `
      <div class="loot-modal-content" style="background:#2a2a3d; border-radius:12px; padding:20px; max-width:90%; width:400px; text-align:center; color:white; overflow-y:auto; max-height:80%; box-shadow:0 8px 16px rgba(0,0,0,0.5);">
        <h2 style="margin-bottom:15px; font-size:18px;">🎁 Loot Gained from ${monsterName}</h2>
        ${noteHtml}
        <div id="lootItems" style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px;">
          ${itemsHtml}
        </div>
        <button class="modal-close-btn" style="margin-top:10px; background:linear-gradient(to right, #3498db, #2980b9); border:none; color:white; padding:8px 16px; border-radius:6px; cursor:pointer; font-size:14px; transition:background 0.2s ease;">Close</button>
      </div>
    `;
  modal.style.display = 'flex';
  setModalOpen(true);

  // Event-Listener for close button
  const closeBtn = modal.querySelector('.modal-close-btn');
  console.log('Loot modal close button found:', closeBtn);
  closeBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    console.log('Closing loot modal via close button');
    modal.style.display = 'none';
    setModalOpen(false);
  });

  // Event-Listener for clicking outside modal
  modal.addEventListener('click', async (e) => {
    if (e.target === modal) {
      console.log('Closing loot modal via background click');
      modal.style.display = 'none';
      setModalOpen(false);
    }
  });
}


// Find monster by ID from current page data
function findMonsterById(monsterId) {
  // Try to find monster in existing monster list or page data
  const monsterCards = document.querySelectorAll('.monster-card, .wave-monster, [data-monster-id]');
  for (const card of monsterCards) {
    const cardMonsterId = card.dataset.monsterId || card.getAttribute('data-monster-id');
    if (cardMonsterId === monsterId.toString()) {
      // Extract monster data from card
      const nameElement = card.querySelector('.monster-name, .name, h3');
      const imgElement = card.querySelector('img');
      const hpElement = card.querySelector('.monster-stats .stat-row:first-child .stat-value');

      return {
        id: monsterId,
        name: nameElement ? nameElement.textContent.trim() : 'Unknown Monster',
        img: imgElement ? imgElement.src : '',
        currentHp: 0, // Will be updated from battle page
        maxHp: 0, // Will be updated from battle page
        damageDone: 0
      };
    }
  }

  // Fallback: create minimal monster object
  return {
    id: monsterId,
    name: 'Unknown Monster',
    img: '',
    currentHp: 0,
    maxHp: 0,
    damageDone: 0
  };
}

// ===== Monster list + parsing/rendering helpers =====
// Global in-memory monster list used by updateData and UI rendering
var monsterList = [];

// Parse monsters from a provided Document (or current document)
async function extractMonsters(doc = document) {
  const monsters = [];
  // Look for common monster card structures
  const cards = doc.querySelectorAll('.monster-container .monster-card, .mon, .wave-monster');
  cards.forEach(card => {
    try {
      // Name - try data attribute first, then DOM
      let name = card.dataset.monsterName || '';
      if (!name) {
        const nameEl = card.querySelector('h3, .monster-name, .name');
        name = nameEl ? nameEl.textContent.trim() : '';
        // Some sources include a stray leading "not " before names (e.g. "not Nib Wickfingers").
        // Normalize by removing a leading "not " (case-insensitive).
        name = name.replace(/^not\s+/i, '');
      }

      // Image
      const imgEl = card.querySelector('img');
      const img = imgEl ? imgEl.src : '';

      // HP parsing - check data attributes first, then parse from DOM
      let currentHp = 0, maxHp = 0;

      // Try to get from data attributes first (for re-rendered cards)
      if (card.dataset.currentHp !== undefined && card.dataset.currentHp !== '') {
        currentHp = parseInt(card.dataset.currentHp, 10) || 0;
      }
      if (card.dataset.maxHp !== undefined && card.dataset.maxHp !== '') {
        maxHp = parseInt(card.dataset.maxHp, 10) || 0;
      }

      // If not found in data attributes, parse from DOM
      if (maxHp === 0) {
        let hpText = '';
        // Try multiple selectors to find HP text
        const hpTextEl = card.querySelector('.monster-stats .stat-row:first-child .stat-value') ||
          card.querySelector('.stat-value') ||
          card.querySelector('.hp-text') ||
          card.querySelector('.muted') ||
          card.querySelector('.hp-bar + div') ||
          Array.from(card.querySelectorAll('*')).find(el => /\d+\s*\/\s*\d+/.test(el.textContent));

        if (hpTextEl) hpText = hpTextEl.textContent.trim();
        const hpMatch = hpText.match(/([\d,]+)\s*\/\s*([\d,]+)/);
        if (hpMatch) {
          currentHp = parseInt(hpMatch[1].replace(/,/g, ''), 10) || 0;
          maxHp = parseInt(hpMatch[2].replace(/,/g, ''), 10) || 0;
        }
      }

      // Players - check data attributes first, then parse from DOM
      let playersJoined = 0, maxPlayers = 20;

      // Try data attributes first (for re-rendered cards)
      if (card.dataset.playersJoined !== undefined) {
        playersJoined = parseInt(card.dataset.playersJoined, 10) || 0;
      }
      if (card.dataset.maxPlayers !== undefined) {
        maxPlayers = parseInt(card.dataset.maxPlayers, 10) || 20;
      }

      // If not found, parse from DOM
      if (playersJoined === 0 && maxPlayers === 20) {
        const playersEl = card.querySelector('.monster-stats .stat-row:nth-child(3) .stat-value .mini-chip') || card.querySelector('.players, .joined, .players-joined') || Array.from(card.querySelectorAll('.muted')).find(n => /Players? Joined/i.test(n.textContent));
        if (playersEl) {
          const playersText = playersEl.textContent.replace(/👥/g, '').trim();
          const pm = playersText.match(/(\d+)\s*\/\s*(\d+)/);
          if (pm) { playersJoined = parseInt(pm[1], 10); maxPlayers = parseInt(pm[2], 10); }
          else {
            const pm2 = playersText.match(/(\d+)/);
            if (pm2) playersJoined = parseInt(pm2[1], 10);
          }
        }
      }

      // ID from link
      let id = '';
      const link = card.querySelector('a[href*="battle.php?id="]') || card.querySelector('a[href*="id="]');
      if (link) {
        const m = (link.getAttribute('href') || '').match(/id=(\d+)/);
        if (m) id = m[1];
      }

      // Status (0 = join available, 1 = active/continue, 2 = loot)
      let status = 0;
      const btn = card.querySelector('.join-btn, .dungeon-join-btn, button');
      const btnText = btn ? (btn.textContent || btn.innerText || '').toLowerCase() : '';
      if (btnText.includes('continue')) status = 1;
      else if (btnText.includes('loot')) status = 2;

      // ATK parsing - check data attribute first, then DOM
      let atk = 0;
      if (card.dataset.atk !== undefined) {
        atk = parseInt(card.dataset.atk, 10) || 0;
      } else {
        const atkEl = card.querySelector('.atk-chip') || card.querySelector('[class*="atk"]') || Array.from(card.querySelectorAll('*')).find(el => el.textContent.includes('ATK') && /\d+/.test(el.textContent));
        if (atkEl) {
          const atkMatch = atkEl.textContent.match(/ATK\s*(\d+)/i) || atkEl.textContent.match(/(\d+)/);
          if (atkMatch) atk = parseInt(atkMatch[1], 10);
        }
      }

      // DEF parsing - check data attribute first, then DOM
      let def = 0;
      if (card.dataset.def !== undefined) {
        def = parseInt(card.dataset.def, 10) || 0;
      } else {
        const defEl = card.querySelector('.def-chip') || card.querySelector('[class*="def"]') || Array.from(card.querySelectorAll('*')).find(el => el.textContent.includes('DEF') && /\d+/.test(el.textContent));
        if (defEl) {
          const defMatch = defEl.textContent.match(/DEF\s*(\d+)/i) || defEl.textContent.match(/(\d+)/);
          if (defMatch) def = parseInt(defMatch[1], 10);
        }
      }

      // damageDone if present in leaderboard extraction elsewhere - default 0
      let damageDone = 0;

      if (id && name) {
        monsters.push({ id, name, img, currentHp, maxHp, playersJoined, maxPlayers, status, damageDone, atk, def });
      }
    } catch (e) {
      console.warn('extractMonsters: failed to parse a card', e);
    }
  });

  return monsters;
}

// Extract basic user data (stamina/exp/gold) from a Document
function extractUserData(doc = document) {
  try {
    const staminaEl = doc.querySelector('#stamina_span');
    if (staminaEl) userData.currentStamina = parseInt(staminaEl.textContent.replace(/,/g, '').replace(/[^0-9]/g, ''), 10) || userData.currentStamina;

    const expEl = doc.querySelector('.exp span');
    if (expEl) {
      const expText = expEl.textContent;
      const expMatch = expText.match(/([\d,]+)\s*\/\s*([\d,]+)/);
      if (expMatch) {
        userData.currentExp = parseInt(expMatch[1].replace(/,/g, ''), 10) || 0;
      }
    }

    const goldEl = doc.querySelector('.gold span');
    if (goldEl) {
      const goldText = goldEl.textContent.replace(/,/g, '').replace(/[^\d.K]/g, '');
      let gold = 0;
      if (goldText.includes('K')) {
        gold = parseFloat(goldText.replace('K', '')) * 1000;
      } else {
        gold = parseFloat(goldText) || 0;
      }
      userData.gold = gold;
    }
  } catch (e) {
    console.warn('extractUserData failed', e);
  }
}
// Render the current `monsterList` into the page's .monster-container
function updateMonsterUI() {
  const container = document.querySelector('.monster-container');
  if (!container) return;
  container.innerHTML = '';

  // Helper function to add badges to image container
  function addBadgesToImageContainer(imgContainer, monster) {
    // Don't add if already exists
    if (imgContainer.querySelector('.monster-badges-container')) return;

    // Overlay badges on top-left of image
    const badgesContainer = document.createElement('div');
    badgesContainer.className = 'monster-badges-container';
    badgesContainer.style.cssText = 'position: absolute; top: 8px; left: 8px; display: flex; flex-direction: row; gap: 4px; z-index: 1;';

    // ATK badge
    const atkBadge = document.createElement('span');
    atkBadge.style.cssText = 'background: rgba(0, 0, 0, 0.75); color: white; padding: 6px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; backdrop-filter: blur(8px); box-shadow: 0 2px 6px rgba(0,0,0,0.4); min-width: 32px; text-align: center; display: flex; align-items: center; justify-content: center;';
    atkBadge.textContent = `⚔ ${monster.atk || '-'}`;
    badgesContainer.appendChild(atkBadge);

    // DEF badge
    const defBadge = document.createElement('span');
    defBadge.style.cssText = 'background: rgba(0, 0, 0, 0.75); color: white; padding: 6px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; backdrop-filter: blur(8px); box-shadow: 0 2px 6px rgba(0,0,0,0.4); min-width: 32px; text-align: center; display: flex; align-items: center; justify-content: center;';
    defBadge.textContent = `🛡 ${monster.def || '-'}`;
    badgesContainer.appendChild(defBadge);

    // Players badge
    const playersBadge = document.createElement('span');
    playersBadge.style.cssText = 'background: rgba(0, 0, 0, 0.75); color: white; padding: 6px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; backdrop-filter: blur(8px); box-shadow: 0 2px 6px rgba(0,0,0,0.4); min-width: 32px; text-align: center; display: flex; align-items: center; justify-content: center;';
    playersBadge.textContent = `👥 ${monster.playersJoined}/${monster.maxPlayers}`;
    badgesContainer.appendChild(playersBadge);

    imgContainer.appendChild(badgesContainer);
  }

  // Render all monsters as cards (card view)
  monsterList.forEach(monster => {
    const card = document.createElement('div');
    card.className = 'monster-card';
    card.dataset.monsterId = monster.id;
    card.dataset.dead = monster.currentHp <= 0 ? '1' : '0';
    card.dataset.eligible = monster.damageDone > 0 ? '1' : '0';
    card.dataset.currentHp = monster.currentHp;
    card.dataset.maxHp = monster.maxHp;
    card.dataset.monsterName = monster.name;
    card.dataset.atk = monster.atk || 0;
    card.dataset.def = monster.def || 0;
    card.dataset.playersJoined = monster.playersJoined || 0;
    card.dataset.maxPlayers = monster.maxPlayers || 20;

    // Monster image container with overlay badges
    const imgContainer = document.createElement('div');
    imgContainer.style.position = 'relative';

    const img = document.createElement('img');
    img.src = monster.img || '';
    img.className = 'monster-img';
    img.alt = 'Monster';
    imgContainer.appendChild(img);

    // Check if image will load - only add badges if image is visible
    img.onload = function () {
      // Image loaded successfully, add badges
      if (this.offsetWidth > 0 && this.offsetHeight > 0) {
        addBadgesToImageContainer(imgContainer, monster);
      }
    };

    // For images already loaded or if src is empty
    if (img.complete || !img.src) {
      setTimeout(() => {
        if (img.offsetWidth > 0 && img.offsetHeight > 0) {
          addBadgesToImageContainer(imgContainer, monster);
        }
      }, 50);
    }

    card.appendChild(imgContainer);

    // Monster name
    const name = document.createElement('h3');
    name.textContent = monster.name;
    card.appendChild(name);

    // HP bar with text inside
    const hpBar = document.createElement('div');
    hpBar.className = 'hp-bar';
    hpBar.style.position = 'relative';
    hpBar.style.height = '24px';
    hpBar.style.display = 'flex';
    hpBar.style.alignItems = 'center';
    hpBar.style.justifyContent = 'center';

    const hpFill = document.createElement('div');
    hpFill.className = 'hp-fill';
    const percent = monster.maxHp > 0 ? (monster.currentHp / monster.maxHp) * 100 : 0;
    hpFill.style.width = `${percent}%`;
    hpFill.style.position = 'absolute';
    hpFill.style.left = '0';
    hpFill.style.top = '0';
    hpFill.style.height = '100%';
    hpBar.appendChild(hpFill);

    // HP text inside the bar
    const hpText = document.createElement('span');
    hpText.style.cssText = 'position: relative; z-index: 1; font-weight: bold; font-size: 0.85rem; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.8);';
    hpText.textContent = ` ${monster.currentHp.toLocaleString()} / ${monster.maxHp.toLocaleString()}`;
    hpBar.appendChild(hpText);

    card.appendChild(hpBar);

    // Hidden battle link (for compatibility)
    const joinLink = document.createElement('a');
    joinLink.href = `battle.php?id=${monster.id}`;
    joinLink.draggable = false;
    joinLink.style.display = 'none';
    const joinBtnHidden = document.createElement('button');
    joinBtnHidden.className = 'join-btn';
    joinBtnHidden.draggable = false;
    joinBtnHidden.textContent = '⚔️ Join the Battle';
    joinLink.appendChild(joinBtnHidden);
    card.appendChild(joinLink);

    // Action buttons row
    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '8px';
    btnRow.style.marginTop = '8px';

    // Main action button
    const joinBtn = document.createElement('button');
    joinBtn.className = 'join-btn';
    joinBtn.style.flex = '1 1 0%';
    joinBtn.style.fontSize = '12px';
    let btnText = '⚔️ Join Battle';
    if (monster.status === 1) btnText = '⚔️ Continue Battle';
    else if (monster.status === 2) btnText = '💰 Loot';
    joinBtn.textContent = btnText;

    // View button
    const viewBtn = document.createElement('button');
    viewBtn.className = 'join-btn';
    viewBtn.style.flex = '1 1 0%';
    viewBtn.style.fontSize = '12px';
    viewBtn.style.background = 'rgb(108, 112, 134)';
    viewBtn.textContent = '👁️ View';

    // Action handlers
    if (monster.status === 0) {
      joinBtn.addEventListener('click', (e) => { e.preventDefault(); handleJoin(monster.id, joinBtn); });
    } else if (monster.status === 1) {
      joinBtn.addEventListener('click', (e) => { e.preventDefault(); showBattleModal(monster); });
    } else if (monster.status === 2) {
      joinBtn.addEventListener('click', (e) => { e.preventDefault(); handleLoot(monster.id, monster.name, joinBtn); });
    }
    viewBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = `battle.php?id=${monster.id}`;
    });

    btnRow.appendChild(joinBtn);
    btnRow.appendChild(viewBtn);
    card.appendChild(btnRow);

    container.appendChild(card);
  });

  // Note: Filters and sorting will be applied by the caller (updateData function)
}

// ===== Update Data ====
// Caching variables to prevent excessive HTML parsing
let lastHtmlContent = null;
let lastParsedData = null;
let refreshCounter = 0;
const MAX_CACHED_REFRESHES = 3; // Clear cache after 3 refreshes

// Process parsed monster data (separated for caching)
async function processParsedData(parsedData) {
  const { monsterList: cachedMonsterList, doc } = parsedData;

  // Preserve existing data if new data is missing or invalid
  const preservedMonsterList = cachedMonsterList.map((newMonster, index) => {
    const existingMonster = monsterList.find(m => m.id === newMonster.id);

    // If we have existing data and new data looks corrupted, keep existing
    if (existingMonster) {
      // Case 1: maxHp is 0 but we have valid existing data
      if (newMonster.maxHp === 0 && existingMonster.maxHp > 0) {
        console.warn('[processParsedData] Preserving data for', newMonster.name, '- maxHp is 0');
        return existingMonster;
      }

      // Case 2: currentHp is 0 but maxHp is valid and it's a continue battle
      // This happens when server doesn't send currentHp for active battles
      if (newMonster.currentHp === 0 &&
        newMonster.maxHp > 0 &&
        newMonster.status === 1 &&
        existingMonster.currentHp > 0) {
        console.warn('[processParsedData] Preserving currentHp for continue battle:', newMonster.name);
        return {
          ...newMonster,
          currentHp: existingMonster.currentHp // Keep old currentHp but use new data for everything else
        };
      }
    }

    return newMonster;
  });

  monsterList.length = 0;
  monsterList.push(...preservedMonsterList);
  updateMonsterUI();

  // Update priority dropdown with new monster list
  if (typeof window.updateMonsterPriorityDropdown === 'function') {
    window.updateMonsterPriorityDropdown(monsterList);
  }

  // Only initialize filter UI if not present
  if (!document.getElementById('monster-filter-container')) {
    if (typeof createFilterUI === 'function') {
      createFilterUI(monsterList, monsterFiltersSettings);
    }
  }
  // Always apply filters (including sorting) after update to maintain user settings
  if (typeof applyMonsterFilters === 'function') {
    applyMonsterFilters();
  }

  // Re-initialize monster sections after soft refresh
  if (window.location.pathname.includes('/active_wave.php') && typeof initMonsterSorting === 'function') {
    initMonsterSorting();
    // Reapply filters after reorganizing sections
    if (typeof applyMonsterFilters === 'function') {
      applyMonsterFilters();
    }
  }

  extractUserData(doc);
  updateUserDataUI();
}

const updateData = async (manual = false) => {
  console.log(`updateData called, isModalOpen: ${isModalOpen()}`);
  const currentUrl = window.location.href;

  // Check cache first (unless manual refresh)
  if (!manual && lastHtmlContent && refreshCounter < MAX_CACHED_REFRESHES) {
    console.log(`[updateData] Using cached data (refresh ${refreshCounter + 1}/${MAX_CACHED_REFRESHES})`);
    refreshCounter++;
    await processParsedData(lastParsedData);
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open('GET', currentUrl, true);
  xhr.onreadystatechange = async () => {
    if (xhr.readyState === 4 && xhr.status === 200) {
      // Cache the HTML content and reset counter
      lastHtmlContent = xhr.responseText;
      refreshCounter = 0; // Reset counter for new cache cycle

      const parser = new DOMParser();
      const doc = parser.parseFromString(xhr.responseText, 'text/html');

      console.log('[updateData] Extracting monsters from fresh HTML...');
      const newMonsterList = await extractMonsters(doc);
      console.log('[updateData] Extracted', newMonsterList.length, 'monsters:', newMonsterList);

      // Cache the parsed data
      lastParsedData = { monsterList: newMonsterList, doc };

      // Process the parsed data
      await processParsedData(lastParsedData);
      console.log(manual ? 'Manual data update completed' : 'Background data update completed');
    } else if (xhr.readyState === 4) {
      console.warn('Failed to fetch page for update:', xhr.status);
    }
  };
  xhr.onerror = () => {
    console.warn('XHR error during data update');
  };
  xhr.send();
};

// ===== END BATTLE MODAL SYSTEM =====

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
      extensionSettings.customBackgrounds.removeLizardTheme = false;
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
  // Remove Lizard theme if the user requested it
  if (extensionSettings.customBackgrounds?.removeLizardTheme) {
    removeLizardThemeFromPage();
    ensureLizardObserver(true);
  }
}

function applySettings() {
  // Apply basic styles first
  document.body.style.backgroundColor = extensionSettings.backgroundColor;

  // Apply color settings to CSS variables
  document.documentElement.style.setProperty('--monster-image-outline-color', extensionSettings.monsterImageOutlineColor);
  document.documentElement.style.setProperty('--loot-card-border-color', extensionSettings.lootCardBorderColor);

  // Apply background images
  applyCustomBackgrounds();

  // Apply image replacements
  applyImageReplacements();

  // Apply transparency effects
  if (extensionSettings.semiTransparent.enabled) {
    applySemiTransparentEffect();
  } else {
    // Apply normal sidebar color
    const sidebar = document.getElementById('game-sidebar');
    if (sidebar) {
      sidebar.style.backgroundColor = extensionSettings.sidebarColor;
      sidebar.style.backdropFilter = 'none';
      sidebar.style.border = 'none';
      sidebar.style.boxShadow = 'none';
    }
  }
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
  } catch (error) {
    updateSidebarStats({
      ATTACK: '-',
      DEFENSE: '-',
      STAMINA: '-',
      STAT_POINTS: '-'
    });
  }
}

// ===== ENHANCED POTION HELPER SYSTEM =====

const POTIONS = [
  {
    key: 'small',
    name: 'Small Stamina Potion',
    icon: 'https://demonicscans.org/images/items/1755316144_small_stamina_potion.webp',
    multi: true
  },
  {
    key: 'full',
    name: 'Full Stamina Potion',
    icon: 'https://demonicscans.org/images/items/1755909636_full_stamina_potion.webp',
    multi: false
  },
  {
    key: 'exp',
    name: 'Exp Potion S',
    icon: 'https://demonicscans.org/images/items/1758633119_10_exp_potion.webp',
    multi: false,
    hasTimer: true
  },
  {
    key: 'hp',
    name: 'Full Hp Potion',
    icon: 'https://demonicscans.org/images/items/1760475550_hp_dungeon_portion.webp',
    multi: false
  },
  {
    key: 'mana_s',
    name: 'Mana Potion S',
    icon: 'https://demonicscans.org/images/items/1764082355_-a2e1-05414364e2f1_3.webp',
    multi: false
  },
  {
    key: 'mana_l',
    name: 'Mana Potion L',
    icon: 'https://demonicscans.org/images/items/1764083491_glowing_blue_li_6814e714-df8a-4b81-9125-e55e91ecf27b_3.webp',
    multi: false
  }
];

// Function to generate menu items based on customization settings
function generateMenuItems() {
  // Sort menu items by order and filter visible ones
  const sortedItems = [...extensionSettings.menuItems]
    .sort((a, b) => a.order - b.order)
    .filter(item => item.visible);

  let menuHTML = '';

  sortedItems.forEach(item => {
    switch (item.id) {
      case 'battle_pass':
        menuHTML += `
        <li>
          <div class="sidebar-menu-expandable">
            <a href="battle_pass.php"><img src="https://demonicscans.org/images/battle%20pass/enternal%20season/enternal_season_banner.webp" alt="Battle Pass"> Battle Pass</a>
                <button class="expand-btn" id="battle-pass-expand-btn">+</button>
          </div>
          <div id="battle-pass-expanded" class="sidebar-submenu ${extensionSettings.battlePassExpanded ? '' : 'collapsed'}">
                <div class="sidebar-quest-panel">
                  <div style="font-weight: bold; color: #89b4fa; margin-bottom: 8px; font-size: 12px;">📋 Daily Quests</div>
                  <div id="sidebar-quest-content" style="max-height: 200px; overflow-y: auto;">
                    <div style="text-align: center; padding: 15px; color: #6c7086; font-size: 11px;">Loading quests...</div>
                  </div>
                </div>
              </div>
            </li>`;
        break;
      case 'pvp':
        menuHTML += `<li><a href="pvp.php"><img src="https://demonicscans.org/images/pvp/season_2/compressed_pvp_season_2.webp" alt="PvP Arena"> PvP Arena</a></li>`;
        break;
      case 'gate_grakthar':
        menuHTML += `<li><a href="active_wave.php?gate=3&wave=${extensionSettings.gateGraktharWave}"><img src="images/gates/gate_688e438aba7f24.99262397.webp" alt="Gate"> Gate Grakthar</a></li>`;
        break;

      case 'pets':
        menuHTML += `
        <li>
          <div class="sidebar-menu-expandable">
            <a href="pets.php"><img src="images/menu/compressed_eggs_menu.webp" alt="Pets"> Pets & Eggs</a>
            <button class="expand-btn" id="pets-expand-btn">+</button>
          </div>
          <div id="pets-expanded" class="sidebar-submenu collapsed">
            <div class="pet-teams-sidebar-section">
              <div class="pet-mode-selector" style="display: flex; gap: 5px; margin-bottom: 10px; padding: 5px;">
                <button class="pet-mode-btn" data-mode="attack" style="flex: 1; padding: 8px; background: #89b4fa; color: #1e1e2e; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">⚔️ Attack</button>
                <button class="pet-mode-btn" data-mode="defense" style="flex: 1; padding: 8px; background: #313244; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; cursor: pointer;">🛡️ Defense</button>
              </div>
              <div id="pet-teams-list" class="pet-teams-container">
                <div style="color: #6c7086; padding: 10px; text-align: center; font-size: 11px;">No pet teams saved yet. Visit Pets & Eggs page to create teams.</div>
              </div>
            </div>
          </div>
            </li>`;
        break;
      case 'stats':
        menuHTML += `
        <li>
          <div class="sidebar-menu-expandable">
            <a href="stats.php" draggable="false">
              <img src="images/menu/compressed_stats_menu.webp" alt="Stats"> 
              <span id="stats-menu-text">Stats ⚔️<span id="sidebar-attack">-</span> 🛡️<span id="sidebar-defense">-</span> ⚡<span id="sidebar-stamina">-</span> 🔵<span id="sidebar-points">-</span></span>
            </a>
            <button class="expand-btn" id="stats-expand-btn" draggable="false">${extensionSettings.statsExpanded ? '–' : '+'}</button>
          </div>
          <div id="stats-expanded" class="sidebar-submenu ${extensionSettings.statsExpanded ? '' : 'collapsed'}">
            <div class="stats-allocation-section">
              <div class="upgrade-section">
                <div class="stat-upgrade-row" data-stat="attack">
                  <div class="stat-info">
                    <span>⚔️ Attack:</span>
                    <span id="sidebar-attack-alloc">-</span>
                  </div>
                  <div class="upgrade-controls">
                    <button class="upgrade-btn" draggable="false">+1</button>
                    <button class="upgrade-btn" draggable="false">+5</button>
                  </div>
                </div>
                <div class="stat-upgrade-row" data-stat="defense">
                  <div class="stat-info">
                    <span>🛡️ Defense:</span>
                    <span id="sidebar-defense-alloc">-</span>
                  </div>
                  <div class="upgrade-controls">
                    <button class="upgrade-btn" draggable="false">+1</button>
                    <button class="upgrade-btn" draggable="false">+5</button>
                  </div>
                </div>
                <div class="stat-upgrade-row" data-stat="stamina">
                  <div class="stat-info">
                    <span>⚡ Stamina:</span>
                    <span id="sidebar-stamina-alloc">-</span>
                  </div>
                  <div class="upgrade-controls">
                    <button class="upgrade-btn" draggable="false">+1</button>
                    <button class="upgrade-btn" draggable="false">+5</button>
                  </div>
                </div>
              </div>
                  <div style="text-align: center; margin-top: 8px; color: #888;">
                    Points Available: <span id="sidebar-points-available">-</span>
            </div>
          </div>
              </div>
            </li>`;
        break;
      case 'blacksmith':
        menuHTML += `
        <li>
          <div class="sidebar-menu-expandable">
            <a href="blacksmith.php"><img src="images/menu/compressed_crafting.webp" alt="Blacksmith"> Blacksmith</a>
            <button class="expand-btn" id="blacksmith-expand-btn">+</button>
          </div>
          <div id="blacksmith-expanded" class="sidebar-submenu collapsed">
            <div class="blacksmith-sidebar-section">
              <div class="blacksmith-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 5px;">
                <span style="color: #f9e2af; font-weight: bold; font-size: 12px;">🔨 Craftable Items</span>
                <button class="refresh-btn" id="blacksmith-refresh-btn" title="Refresh Blacksmith Items" style="padding: 4px 8px; background: #89b4fa; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">🔄</button>
              </div>
              <div id="blacksmith-items-list" class="blacksmith-items-container">
                <div style="color: #6c7086; padding: 10px; text-align: center; font-size: 11px;">Loading recipes...</div>
              </div>
            </div>
          </div>
            </li>`;
        break;
      case 'legendary_forge':
        menuHTML += `<li><a href="legendary_forge.php"><img src="https://demonicscans.org/images/menu/compressed_legendary_forge.webp" alt="Legendary Forge"> Legendary Forge</a></li>`;
        break;
      case 'merchant':
        menuHTML += `
        <li>
          <div class="sidebar-menu-expandable">
            <a href="merchant.php"><img src="images/menu/compressed_merchant.webp" alt="Merchant"> Merchant</a>
                <button class="expand-btn" id="merchant-expand-btn">+</button>
          </div>
          <div id="merchant-expanded" class="sidebar-submenu ${extensionSettings.merchantExpanded ? '' : 'collapsed'}">
                <div class="quick-access-section">
                  <div class="quick-access-header">
                    <span>Quick Access Items</span>
                    <button class="refresh-btn" id="merchant-refresh-btn" title="Refresh Merchant Items">🔄</button>
          </div>
                  <div id="merchant-quick-access" class="quick-access-items">
                    <div class="quick-access-empty">No pinned items. Visit merchant to pin items.</div>
                  </div>
                </div>
              </div>
            </li>`;
        break;
      case 'inventory_quick':
        menuHTML += `
        <li>
          <div class="sidebar-menu-expandable">
            <a href="inventory.php"><img src="images/menu/compressed_chest.webp" alt="Inventory"> Inventory Quick Access</a>
                <button class="expand-btn" id="inventory-expand-btn">+</button>
          </div>
          <div id="inventory-expanded" class="sidebar-submenu ${extensionSettings.inventoryExpanded ? '' : 'collapsed'}">
                <div class="quick-access-section">
                  <div class="quick-access-header">
                    <span>Quick Access Items</span>
                    <button class="refresh-btn" id="inventory-refresh-btn" title="Refresh Inventory Items">🔄</button>
          </div>
                  <div id="inventory-quick-access" class="quick-access-items">
                    <div class="quick-access-empty">No pinned items. Visit inventory to pin items.</div>
                  </div>
                </div>
                      ${extensionSettings.equipSets?.showInSidebar ? `
                      ` : ''}
                
                <div class="quick-access-section">
                  <div class="sidebar-menu-expandable" style="margin: 0; padding: 0;">
                    <div class="quick-access-header" style="cursor: pointer;" id="equipment-submenu-header">
                      <span>Equipment</span>
                      <button class="expand-btn" id="equipment-submenu-btn" style="font-size: 12px; padding: 2px 6px;">+</button>
                    </div>
                  </div>
                  <div id="equipment-submenu" class="sidebar-submenu ${extensionSettings.equipmentExpanded ? '' : 'collapsed'}" style="margin-left: 10px;">
                    <div class="quick-access-header" style="font-size: 11px; padding: 5px 0;">
                      <span>Equip Sets</span>
                      <button class="refresh-btn" id="equip-sets-refresh-btn" title="Refresh Equip Sets">🔄</button>
                    </div>
                    <div id="inventory-equip-sets" class="quick-access-items">
                      <div class="quick-access-empty">No equip sets saved. Visit inventory to create sets.</div>
                    </div>
                  </div>
                </div>
                
              </div>
            </li>`;
        break;
      case 'achievements':
        menuHTML += `<li><a href="achievements.php"><img src="images/menu/compressed_achievments.webp" alt="Achievements"> Achievements</a></li>`;
        break;
      case 'collections':
        menuHTML += `<li><a href="collections.php"><img src="images/menu/compressed_collections.webp" alt="Collections"> Collections</a></li>`;
        break;
      case 'guide':
        menuHTML += `<li><a href="guide.php"><img src="images/menu/compressed_guide.webp" alt="Guide"> How To Play</a></li>`;
        break;
      case 'leaderboard':
        menuHTML += `<li><a href="weekly.php"><img src="images/menu/weekly_leaderboard.webp" alt="Leaderboard"> Weekly Leaderboard</a></li>`;
        break;
      case 'chat':
        menuHTML += `<li><a href="chat.php"><img src="images/menu/compressed_chat.webp" alt="Chat"> Global Chat</a></li>`;
        break;
      case 'patches':
        menuHTML += `<li><a href="patches.php"><img src="images/menu/compressed_patches.webp" alt="PatchNotes"> Patch Notes</a></li>`;
        break;
      case 'manga':
        menuHTML += `<li><a href="index.php"><img src="images/menu/compressed_manga.webp" alt="Manga"> Manga-Manhwa-Manhua</a></li>`;
        break;
      case 'referrals':
        menuHTML += `<li><a href="https://demonicscans.org/referrals.php"><img src="https://demonicscans.org/images/menu/compressed_referral.webp" alt="Referrals"> Referrals</a></li>`;
        break;
      case 'guild':
        // Check if user is in a guild - try multiple detection methods
        let userGuildId = 0;

        // Method 1: Check for guild script variables in page
        const scriptTags = document.querySelectorAll('script');
        for (const script of scriptTags) {
          if (script.textContent.includes('const guildId')) {
            const match = script.textContent.match(/const guildId\s*=\s*(\d+)/);
            if (match) {
              userGuildId = parseInt(match[1]);
              break;
            }
          }
        }

        // Method 2: Fallback to userData if script detection fails
        if (userGuildId === 0) {
          userGuildId = userData.guildId || 0;
        }

        if (userGuildId > 0) {
          // User is in a guild - show guild dashboard with expandable options
          menuHTML += `
        <li>
          <div class="sidebar-menu-expandable">
            <a href="https://demonicscans.org/guild_dash.php"><img src="https://demonicscans.org/images/menu/compressed_guilds.webp" alt="Guild"> Guild</a>
            <button class="expand-btn" id="guild-expand-btn">+</button>
          </div>
          <div id="guild-expanded" class="sidebar-submenu collapsed">
            <div class="guild-submenu-item" style="margin-bottom: 10px;">
              <div class="sidebar-menu-expandable">
                <a href="https://demonicscans.org/world_map.php" style="padding: 8px 15px; display: flex; align-items: center; gap: 8px; color: #cdd6f4; text-decoration: none;"><img src="https://demonicscans.org/images/world/map_v1.webp" alt="World Map" style="width: 20px; height: 20px;"> World Map</a>
                <button class="expand-btn" id="world-map-expand-btn" style="margin-left: auto;">+</button>
              </div>
              <div id="world-map-expanded" class="sidebar-submenu collapsed" style="margin-left: 20px;">
                <div class="territory-item" style="margin: 5px 0;">
                  <a href="https://demonicscans.org/territory.php?id=1" style="padding: 5px 10px; display: flex; align-items: center; gap: 8px; color: #a6adc8; text-decoration: none; font-size: 0.9rem;"><img src="https://demonicscans.org/images/world/highspire/compressed_highspire_banner.webp" alt="Highspire" style="width: 16px; height: 16px;"> Highspire</a>
                </div>
                <div class="territory-item" style="margin: 5px 0;">
                  <a href="https://demonicscans.org/territory.php?id=3" style="padding: 5px 10px; display: flex; align-items: center; gap: 8px; color: #a6adc8; text-decoration: none; font-size: 0.9rem;"><img src="https://demonicscans.org/images/world/moonveil/compressed_moonveil_banner.webp" alt="Moonveil" style="width: 16px; height: 16px;"> Moonveil</a>
                </div>
                <div class="territory-item" style="margin: 5px 0;">
                  <a href="https://demonicscans.org/territory.php?id=4" style="padding: 5px 10px; display: flex; align-items: center; gap: 8px; color: #a6adc8; text-decoration: none; font-size: 0.9rem;"><img src="https://demonicscans.org/images/world/ironreach/compressed_ironreach_banner.webp" alt="Ironreach" style="width: 16px; height: 16px;"> Ironreach</a>
                </div>
                <div class="territory-item" style="margin: 5px 0;">
                  <a href="https://demonicscans.org/territory.php?id=2" style="padding: 5px 10px; display: flex; align-items: center; gap: 8px; color: #a6adc8; text-decoration: none; font-size: 0.9rem;"><img src="https://demonicscans.org/images/world/stormhaven/compressed_stormhaven_banner.webp" alt="Storm Haven" style="width: 16px; height: 16px;"> Storm Haven</a>
                </div>
              </div>
            </div>
            <div class="guild-submenu-item" style="margin: 10px 0;">
              <div class="sidebar-menu-expandable">
                <a href="https://demonicscans.org/guild_dungeon.php" style="padding: 8px 15px; display: flex; align-items: center; gap: 8px; color: #cdd6f4; text-decoration: none;">🏰 Dungeon</a>
                <button class="expand-btn" id="dungeon-expand-btn" style="margin-left: auto;">+</button>
              </div>
              <div id="dungeon-expanded" class="sidebar-submenu collapsed" style="margin-left: 20px;">
                <div class="dungeon-item" style="margin: 5px 0;">
                  <a href="#" class="dungeon-location-link" data-location="1" style="padding: 5px 10px; display: flex; align-items: center; gap: 8px; color: #a6adc8; text-decoration: none; font-size: 0.9rem;"><img src="https://demonicscans.org/images/dungeons/dloc_49b5e161193d164e.png" alt="Brood Pits" style="width: 16px; height: 16px;"> Brood Pits</a>
                </div>
                <div class="dungeon-item" style="margin: 5px 0;">
                  <a href="#" class="dungeon-location-link" data-location="4" style="padding: 5px 10px; display: flex; align-items: center; gap: 8px; color: #a6adc8; text-decoration: none; font-size: 0.9rem;"><img src="https://demonicscans.org/images/dungeons/dloc_0a9272f84e0c0582.png" alt="Territory Centre" style="width: 16px; height: 16px;"> Territory Centre</a>
                </div>
                <div class="dungeon-item" style="margin: 5px 0;">
                  <a href="#" class="dungeon-location-link" data-location="3" style="padding: 5px 10px; display: flex; align-items: center; gap: 8px; color: #a6adc8; text-decoration: none; font-size: 0.9rem;"><img src="https://demonicscans.org/images/dungeons/dloc_4233c1d4a695f3de.png" alt="Shattered Stone Causeways" style="width: 16px; height: 16px;"> Shattered Stone</a>
                </div>
                <div class="dungeon-item" style="margin: 5px 0;">
                  <a href="#" class="dungeon-location-link" data-location="2" style="padding: 5px 10px; display: flex; align-items: center; gap: 8px; color: #a6adc8; text-decoration: none; font-size: 0.9rem;"><img src="https://demonicscans.org/images/dungeons/dloc_3191d4f975b802d5.png" alt="Plunder Warrens" style="width: 16px; height: 16px;"> Plunder Warrens</a>
                </div>
                <div class="dungeon-item" style="margin: 5px 0;">
                  <a href="#" class="dungeon-location-link" data-location="5" style="padding: 5px 10px; display: flex; align-items: center; gap: 8px; color: #a6adc8; text-decoration: none; font-size: 0.9rem;"><img src="https://demonicscans.org/images/dungeons/dloc_f7b9390b4cfeef5f.png" alt="Boss Room" style="width: 16px; height: 16px;"> Boss Room</a>
                </div>
              </div>
            </div>
          </div>
        </li>`;
        } else {
          // User is not in a guild - show join/create page
          menuHTML += `<li><a href="https://demonicscans.org/guild_join_create.php"><img src="https://demonicscans.org/images/menu/compressed_guilds.webp" alt="Guild"> Guild</a></li>`;
        }
        break;

      case 'adventurers_guild':
        menuHTML += `
        <li>
          <div class="sidebar-menu-expandable">
            <a href="https://demonicscans.org/adventurers_guild.php"><img src="https://demonicscans.org/images/menu/compressed_adv_guild.webp" alt="Adventure's Guild"> Adventure's Guild</a>
                <button class="expand-btn" id="adventurers-guild-expand-btn">+</button>
          </div>
          <div id="adventurers-guild-expanded" class="sidebar-submenu ${extensionSettings.adventurersGuildExpanded ? '' : 'collapsed'}">
                <div class="sidebar-quest-panel">
                  <div style="font-weight: bold; color: #89b4fa; margin-bottom: 8px; font-size: 12px;">📋 Available Quests</div>
                  <div id="sidebar-adventurers-guild-quests" style="max-height: 200px; overflow-y: auto;">
                    <div style="text-align: center; padding: 15px; color: #6c7086; font-size: 11px;">Loading quests...</div>
                  </div>
                </div>
              </div>
            </li>`;
        break;
      case 'classes':
        menuHTML += `<li><a href="https://demonicscans.org/classes.php"><img src="https://demonicscans.org/images/skills/Ironclad%20Strike.webp" alt="Classes"> Classes</a></li>`;
        break;

    }
  });

  return menuHTML;
}

function initSideBar() {
  const noContainerPage = !document.querySelector('.container') && !document.querySelector('.wrap');
  const mainWrapper = document.createElement('div');
  mainWrapper.className = 'main-wrapper';

  const sidebar = document.createElement('aside');
  sidebar.id = 'game-sidebar';
  sidebar.innerHTML = `
      <ul class="sidebar-menu">
        <li style="display: flex; align-items: center; justify-content: space-between;">
          <a href="game_dash.php" style="text-decoration:none;" draggable="false">
            <h2 style="margin: 0;">Game Menu</h2>
          </a>
          <button class="sidebar-toggle-btn" id="sidebar-toggle-btn" title="Toggle Sidebar" draggable="false">☰</button>
        </li>
        ${generateMenuItems()}
      </ul>
    `;

  const contentArea = document.createElement('div');
  contentArea.className = 'content-area';
  if (noContainerPage) {
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
  mainWrapper.appendChild(sidebar);
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
        background: var(--sidebar-base-color, ${extensionSettings.sidebarColor});
        border-right: 1px solid rgba(255, 255, 255, 0.06);
        flex-shrink: 0;
        padding: 15px 0;
        overflow-y: auto;
        overflow-x: hidden;
        position: fixed;
        top: 55px;
        left: 0;
        height: calc(100vh - 55px);
        z-index: 1000;
        transition: width 0.3s ease-in-out;
      }

      #game-sidebar.collapsed {
        width: 60px;
      }

      #game-sidebar.collapsed .sidebar-menu a {
        justify-content: center;
        padding: 12px 0;
      }

      #game-sidebar.collapsed .sidebar-menu img {
        margin-right: 0;
      }

      #game-sidebar.collapsed .sidebar-menu a span,
      #game-sidebar.collapsed .sidebar-header h2,
      #game-sidebar.collapsed .sidebar-section,
      #game-sidebar.collapsed .expand-btn {
        display: none;
      }

      #game-sidebar.semi-transparent {
        background: var(--sidebar-semi-transparent-color, rgba(30, 30, 30, 0.85)) !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
        box-shadow: none !important;
      }

      #game-sidebar.semi-transparent .sidebar-submenu {
        background: var(--sidebar-submenu-semi-transparent-color, rgba(40, 40, 40, 0.76)) !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        border: none !important;
      }

      .sidebar-header {
        padding: 0 20px 15px;
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

      .stat-info {
        display: flex;
        justify-content: space-between;
        min-width: 120px;
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

      /* Battle Pass Quest Widget Styles */
      .sidebar-quest-panel {
        padding: 10px;
        background: rgba(49, 50, 68, 0.3);
        border-radius: 6px;
        margin-top: 10px;
      }

      .sidebar-quest {
        margin-bottom: 10px;
        padding: 8px;
        background: rgba(30, 30, 46, 0.5);
        border-radius: 5px;
        border-left: 3px solid #89b4fa;
        transition: all 0.2s ease;
      }

      .sidebar-quest:hover {
        background: rgba(30, 30, 46, 0.7);
        border-left-color: #f9e2af;
      }

      .sidebar-quest.completed {
        border-left-color: #a6e3a1;
        opacity: 0.7;
      }

      .quest-title {
        font-weight: bold;
        color: #cdd6f4;
        font-size: 11px;
        margin-bottom: 4px;
      }

      .sidebar-quest.completed .quest-title {
        color: #a6e3a1;
      }

      .quest-details {
        color: #6c7086;
        font-size: 9px;
        margin-bottom: 5px;
      }

      .quest-progress-bar {
        background: #313244;
        border-radius: 3px;
        height: 5px;
        overflow: hidden;
        margin-bottom: 4px;
      }

      .quest-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #22c55e, #16a34a);
        transition: width 0.3s ease;
        border-radius: 3px;
      }

      .sidebar-quest.completed .quest-progress-fill {
        background: linear-gradient(90deg, #a6e3a1, #94e2d5);
      }

      .quest-status {
        color: #a6adc8;
        font-size: 9px;
        text-align: right;
      }

      .sidebar-quest.completed .quest-status {
        color: #a6e3a1;
      }

      .loading-text, .quest-empty, .quest-error {
        text-align: center;
        padding: 15px;
        color: #6c7086;
        font-size: 11px;
        font-style: italic;
      }

      .quest-error {
        color: #f38ba8;
      }

      .content-area {
        flex: 1;
        padding: 20px;
        margin-left: 250px;
        transition: margin-left 0.3s ease-in-out;
      }

      #game-sidebar.collapsed ~ .content-area {
        margin-left: 60px;
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
        background: rgba(30, 30, 30, 0.85);
        backdrop-filter: blur(10px);
        border: 4px solid rgba(255, 255, 237, 1);
        border-radius: 15px;
        padding: 30px;
        max-width: 800px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        color: #cdd6f4;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
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
        background: rgba(31, 31, 38, 0.6);
        border-radius: 8px;
        border: 2px solid rgba(0, 0, 0, 1);
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
        color: #cdd6f4;
      }

      .settings-section-content {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease-out;
      }

      .settings-section-content.expanded {
        max-height: 5000px;
        transition: max-height 0.3s ease-in;
      }

      .expand-icon {
        color: #cdd6f4;
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
        z-index: 1000 !important;
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
        max-height: 600px;
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

      /* Hide loot pill images when battle images are hidden */
      .battle-images-hidden .loot-probability-pill img {
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
        flex-basis: 350px !important;
        min-width: 250px !important;
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
      .leaderboard-panel, .log-panel {
        display: inline-block !important;
        vertical-align: top !important;
        width: 48% !important;
        margin: 1% !important;
        box-sizing: border-box !important;
      }
      
      /* Ensure proper spacing between side-by-side panels */
      .leaderboard-panel {
        margin-right: 2% !important;
      }
      
      .log-panel {
        margin-left: 2% !important;
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

      /* Topbar Profile Square */
      .topbar-profile-circle {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        overflow: hidden;
        cursor: pointer;
        margin-right: 8px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.1);
      }

      .topbar-profile-circle:hover {
        border-color: rgba(255, 255, 255, 0.5);
        transform: scale(1.05);
      }

      .topbar-profile-circle img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.2s ease;
      }

      .topbar-profile-circle:hover img {
        transform: scale(1.05);
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

      /* Settings container styles */
      .checkbox-container {
        display: flex;
        align-items: center;
        margin: 10px 0;
        gap: 8px;
      }

      .checkbox-container input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: #cba6f7;
        cursor: pointer;
      }

      .checkbox-container label {
        color: #cdd6f4;
        cursor: pointer;
        font-size: 14px;
      }

      .range-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 10px 0;
        gap: 10px;
      }

      .range-container label {
        color: #cdd6f4;
        font-size: 14px;
        min-width: 100px;
      }

      .range-container input[type="range"] {
        flex: 1;
        height: 6px;
        background: #45475a;
        border-radius: 3px;
        outline: none;
        -webkit-appearance: none;
      }

      .range-container input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        background: #cba6f7;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .range-container input[type="range"]::-webkit-slider-thumb:hover {
        background: #f9e2af;
        transform: scale(1.1);
      }

      .range-container span {
        color: #f9e2af;
        font-size: 12px;
        min-width: 60px;
        text-align: right;
        font-weight: bold;
      }

      /* Duplicate key validation styling */
      .duplicate-key {
        border: 2px solid #f38ba8 !important;
        box-shadow: 0 0 8px rgba(243, 139, 168, 0.4) !important;
      }
    `;
  document.head.appendChild(style);

  initSidebarExpandables();
  initSettingsModal();
  createTopbarSettingsButton();
  createTopbarProfileCircle();
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

        // Initialize pet teams sidebar when expanded
        initPetTeamsSidebar();
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
      initPetTeamsSidebar();
    }

    // Add mode button click listeners
    document.querySelectorAll('.pet-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        localStorage.setItem('petTeamsMode', mode);
        initPetTeamsSidebar();
      });
    });
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

        // Initialize blacksmith sidebar when expanded
        initBlacksmithSidebar();
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
      initBlacksmithSidebar();
    }

    // Add refresh button listener
    const blacksmithRefreshBtn = document.getElementById('blacksmith-refresh-btn');
    if (blacksmithRefreshBtn) {
      blacksmithRefreshBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        initBlacksmithSidebar();
      });
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
      updateSidebarEquipSetsSection();
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

  // Equipment submenu toggle (within inventory)
  const equipmentSubmenuBtn = document.getElementById('equipment-submenu-btn');
  const equipmentSubmenu = document.getElementById('equipment-submenu');
  const equipmentSubmenuHeader = document.getElementById('equipment-submenu-header');

  if (equipmentSubmenuBtn && equipmentSubmenu) {
    const toggleEquipmentSubmenu = (e) => {
      e.stopPropagation();
      const isCollapsed = equipmentSubmenu.classList.contains('collapsed');

      if (isCollapsed) {
        equipmentSubmenu.classList.remove('collapsed');
        equipmentSubmenuBtn.textContent = '–';
        extensionSettings.equipmentExpanded = true;
      } else {
        equipmentSubmenu.classList.add('collapsed');
        equipmentSubmenuBtn.textContent = '+';
        extensionSettings.equipmentExpanded = false;
      }

      saveSettings();
      updateSidebarEquipSetsSection();
    };

    equipmentSubmenuBtn.addEventListener('click', toggleEquipmentSubmenu);
    equipmentSubmenuHeader.addEventListener('click', toggleEquipmentSubmenu);

    // Refresh equip sets button
    const equipSetsRefreshBtn = document.getElementById('equip-sets-refresh-btn');
    if (equipSetsRefreshBtn) {
      equipSetsRefreshBtn.addEventListener('click', () => {
        showNotification('Refreshing equipment sets...', 'info');
        updateSidebarEquipSetsSection();
      });
    }

    // top equip refresh removed -- nested equip tab always present

    if (extensionSettings.equipmentExpanded) {
      equipmentSubmenu.classList.remove('collapsed');
      equipmentSubmenuBtn.textContent = '–';
      updateSidebarEquipSetsSection();
    } else if (extensionSettings.inventoryExpanded) {
      // If inventory is expanded but equipment isn't, still try to update
      updateSidebarEquipSetsSection();
    }
  }

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
        // Load quest data when expanded
        updateSidebarQuestPanel();
      } else {
        battlePassExpanded.classList.add('collapsed');
        battlePassExpandBtn.textContent = '+';
        extensionSettings.battlePassExpanded = false;
      }

      saveSettings();
    });

    if (extensionSettings.battlePassExpanded) {
      battlePassExpanded.classList.remove('collapsed');
      battlePassExpandBtn.textContent = '–';
      // Load quest data if already expanded
      updateSidebarQuestPanel();
    }
  }

  // Adventurers Guild expand button functionality
  const adventurersGuildExpandBtn = document.getElementById('adventurers-guild-expand-btn');
  const adventurersGuildExpanded = document.getElementById('adventurers-guild-expanded');

  if (adventurersGuildExpandBtn && adventurersGuildExpanded) {
    adventurersGuildExpandBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCollapsed = adventurersGuildExpanded.classList.contains('collapsed');

      if (isCollapsed) {
        adventurersGuildExpanded.classList.remove('collapsed');
        adventurersGuildExpandBtn.textContent = '–';
        extensionSettings.adventurersGuildExpanded = true;
        // Load quest data when expanded
        initAdventurersGuildQuests();
      } else {
        adventurersGuildExpanded.classList.add('collapsed');
        adventurersGuildExpandBtn.textContent = '+';
        extensionSettings.adventurersGuildExpanded = false;
      }

      saveSettings();
    });

    if (extensionSettings.adventurersGuildExpanded) {
      adventurersGuildExpanded.classList.remove('collapsed');
      adventurersGuildExpandBtn.textContent = '–';
      // Load quest data if already expanded
      initAdventurersGuildQuests();
    }
  }

  // Guild expand button functionality
  const guildExpandBtn = document.getElementById('guild-expand-btn');
  const guildExpanded = document.getElementById('guild-expanded');

  if (guildExpandBtn && guildExpanded) {
    guildExpandBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCollapsed = guildExpanded.classList.contains('collapsed');

      if (isCollapsed) {
        guildExpanded.classList.remove('collapsed');
        guildExpandBtn.textContent = '–';
        extensionSettings.guildExpanded = true;
      } else {
        guildExpanded.classList.add('collapsed');
        guildExpandBtn.textContent = '+';
        extensionSettings.guildExpanded = false;
      }

      saveSettings();
    });

    if (extensionSettings.guildExpanded) {
      guildExpanded.classList.remove('collapsed');
      guildExpandBtn.textContent = '–';
    }
  }

  // World Map expand button functionality (nested within guild)
  const worldMapExpandBtn = document.getElementById('world-map-expand-btn');
  const worldMapExpanded = document.getElementById('world-map-expanded');

  if (worldMapExpandBtn && worldMapExpanded) {
    worldMapExpandBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCollapsed = worldMapExpanded.classList.contains('collapsed');

      if (isCollapsed) {
        worldMapExpanded.classList.remove('collapsed');
        worldMapExpandBtn.textContent = '–';
        extensionSettings.worldMapExpanded = true;
      } else {
        worldMapExpanded.classList.add('collapsed');
        worldMapExpandBtn.textContent = '+';
        extensionSettings.worldMapExpanded = false;
      }

      saveSettings();
    });

    if (extensionSettings.worldMapExpanded) {
      worldMapExpanded.classList.remove('collapsed');
      worldMapExpandBtn.textContent = '–';
    }
  }

  // Dungeon expand button functionality (nested within guild)
  const dungeonExpandBtn = document.getElementById('dungeon-expand-btn');
  const dungeonExpanded = document.getElementById('dungeon-expanded');

  if (dungeonExpandBtn && dungeonExpanded) {
    dungeonExpandBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const isCollapsed = dungeonExpanded.classList.contains('collapsed');

      if (isCollapsed) {
        dungeonExpanded.classList.remove('collapsed');
        dungeonExpandBtn.textContent = '–';
        extensionSettings.dungeonExpanded = true;

        // Fetch and update instance_id for dungeon locations
        await updateDungeonInstanceId();
      } else {
        dungeonExpanded.classList.add('collapsed');
        dungeonExpandBtn.textContent = '+';
        extensionSettings.dungeonExpanded = false;
      }

      saveSettings();
    });

    if (extensionSettings.dungeonExpanded) {
      dungeonExpanded.classList.remove('collapsed');
      dungeonExpandBtn.textContent = '–';
      // Fetch instance_id on page load if expanded
      updateDungeonInstanceId();
    }
  }

  // Function to fetch and update dungeon instance_id
  async function updateDungeonInstanceId() {
    try {
      const response = await fetch('https://demonicscans.org/guild_dungeon.php');
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Look for the enter button or instance link
      const instanceLinks = doc.querySelectorAll('a[href*="guild_dungeon_instance.php?id="]');
      let instanceId = null;

      // Find Shadowbridge Warrens specifically (dungeon_info.php?id=1)
      for (const link of instanceLinks) {
        const card = link.closest('.card');
        if (card) {
          // Check if this is Shadowbridge Warrens by looking for dungeon_info.php?id=1
          const infoLink = card.querySelector('a[href*="dungeon_info.php?id=1"]');
          if (infoLink) {
            // Check if card contains "ended" text in any .tag element
            const tags = card.querySelectorAll('.tag');
            let hasEnded = false;
            for (const tag of tags) {
              if (tag.textContent.toLowerCase().includes('ended')) {
                hasEnded = true;
                break;
              }
            }

            // If dungeon is active (not ended), use this instance
            if (!hasEnded) {
              const href = link.getAttribute('href');
              const match = href.match(/id=(\d+)/);
              if (match) {
                instanceId = match[1];
                console.log('Found Shadowbridge Warrens instance:', instanceId);
                break;
              }
            }
          }
        }
      }

      // If no active instance found from enter button, check cards for most recent
      if (!instanceId) {
        for (const link of instanceLinks) {
          const href = link.getAttribute('href');
          const match = href.match(/id=(\d+)/);
          if (match) {
            instanceId = match[1];
            console.log('Found fallback dungeon instance:', instanceId);
            break;
          }
        }
      }

      if (instanceId) {
        // Update all dungeon location links
        document.querySelectorAll('.dungeon-location-link').forEach(link => {
          const locationId = link.getAttribute('data-location');
          link.href = `https://demonicscans.org/guild_dungeon_location.php?instance_id=${instanceId}&location_id=${locationId}`;
        });
        console.log('Updated dungeon location links with instance_id:', instanceId);
      } else {
        console.warn('No dungeon instance found');
      }
    } catch (error) {
      console.error('Error fetching dungeon instance:', error);
    }
  }
}

function performLootAction(type, amount) {
  try {
    const targetPage = extensionSettings.lootHelper.targetPage;

    if (targetPage === 'current') {
      // Loot from current page
      performCurrentPageLoot(type, amount);
    } else if (targetPage === 'wave') {
      // Loot from specific wave
      const event = extensionSettings.lootHelper.targetEvent;
      const wave = extensionSettings.lootHelper.targetWave;
      performWaveLoot(type, amount, event, wave);
    }
  } catch (error) {
    console.error('Error in performLootAction:', error);
    showNotification('Error performing loot action: ' + error.message, 'error');
  }
}

function performCurrentPageLoot(type, amount) {
  // Find all loot buttons on the current page
  const lootButtons = document.querySelectorAll('button[onclick*="loot"], input[onclick*="loot"], a[onclick*="loot"]');

  if (lootButtons.length === 0) {
    showNotification('No loot buttons found on this page', 'warning');
    return;
  }

  let processedCount = 0;
  const totalButtons = lootButtons.length;

  showNotification(`Starting ${type} loot process... Found ${totalButtons} loot items`, 'info');

  lootButtons.forEach((button, index) => {
    setTimeout(() => {
      try {
        // Check if this is an unlocked loot item
        const isUnlocked = type === 'all' || isLootUnlocked(button);

        if (isUnlocked) {
          // Execute the onclick function if it exists
          if (button.onclick) {
            button.onclick();
          } else if (button.getAttribute('onclick')) {
            // Execute the onclick attribute
            eval(button.getAttribute('onclick'));
          }
          processedCount++;
        }

        // Show completion message on last item
        if (index === totalButtons - 1) {
          setTimeout(() => {
            showNotification(`Loot complete! Processed ${processedCount} out of ${totalButtons} items`, 'success');
          }, 100);
        }
      } catch (error) {
        console.error('Error processing loot button:', error);
      }
    }, index * 100); // Stagger clicks by 100ms
  });
}

function performWaveLoot(type, amount, event, wave) {
  const targetUrl = `active_wave.php?event=${event}&wave=${wave}`;

  showNotification(`Fetching loot from Event ${event}, Wave ${wave}...`, 'info');

  // Fetch the target wave page
  fetch(targetUrl)
    .then(response => response.text())
    .then(html => {
      // Parse the HTML to find loot buttons
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Look for loot buttons in the fetched page
      const lootButtons = doc.querySelectorAll('button[onclick*="loot"], input[onclick*="loot"], a[onclick*="loot"]');

      if (lootButtons.length === 0) {
        showNotification(`No loot buttons found on Event ${event}, Wave ${wave}`, 'warning');
        return;
      }

      let processedCount = 0;
      const totalButtons = lootButtons.length;

      showNotification(`Found ${totalButtons} loot items on Event ${event}, Wave ${wave}. Processing...`, 'info');

      lootButtons.forEach((button, index) => {
        setTimeout(() => {
          try {
            // Check if this is an unlocked loot item
            const isUnlocked = type === 'all' || isLootUnlockedFromHTML(button);

            if (isUnlocked) {
              // Extract the onclick function and execute it
              const onclickAttr = button.getAttribute('onclick');
              if (onclickAttr) {
                // Execute the loot function
                eval(onclickAttr);
                processedCount++;
              }
            }

            // Show completion message on last item
            if (index === totalButtons - 1) {
              setTimeout(() => {
                showNotification(`Wave loot complete! Processed ${processedCount} out of ${totalButtons} items from Event ${event}, Wave ${wave}`, 'success');
              }, 100);
            }
          } catch (error) {
            console.error('Error processing wave loot button:', error);
          }
        }, index * 150); // Slightly longer delay for cross-page requests
      });
    })
    .catch(error => {
      console.error('Error fetching wave page:', error);
      showNotification(`Error fetching Event ${event}, Wave ${wave}: ${error.message}`, 'error');
    });
}

function isLootUnlockedFromHTML(button) {
  try {
    // Check various indicators that a loot item is unlocked (from HTML)
    const parent = button.closest('tr, div, .loot-item, .item');

    if (!parent) return true; // If we can't find parent, assume unlocked

    // Check for common "locked" indicators in the HTML text
    const parentText = parent.textContent || parent.innerHTML;
    const hasLockIndicator = parentText.includes('Damage requirement not met') ||
      parentText.includes('not eligible') ||
      parentText.includes('locked') ||
      parentText.includes('fa-lock') ||
      parent.classList.contains('disabled') ||
      parent.classList.contains('locked') ||
      button.disabled ||
      button.classList.contains('disabled');

    // Item is unlocked if none of the "locked" indicators are present
    return !hasLockIndicator;

  } catch (error) {
    console.error('Error checking loot unlock status from HTML:', error);
    return true; // Default to unlocked if we can't determine
  }
}

function isLootUnlocked(button) {
  try {
    // Check various indicators that a loot item is unlocked
    const parent = button.closest('tr, div, .loot-item, .item');

    if (!parent) return true; // If we can't find parent, assume unlocked

    // Check for common "locked" indicators
    const hasLockIcon = parent.querySelector('.fa-lock, .locked, [class*="lock"]');
    const hasDisabledClass = parent.classList.contains('disabled') ||
      parent.classList.contains('locked') ||
      button.disabled;

    // Check for damage requirement not met (common pattern)
    const hasRequirementNotMet = parent.textContent.includes('Damage requirement not met') ||
      parent.textContent.includes('not eligible') ||
      parent.textContent.includes('locked');

    // Check if button itself is disabled
    const buttonDisabled = button.disabled ||
      button.classList.contains('disabled') ||
      button.style.display === 'none';

    // Item is unlocked if none of the "locked" indicators are present
    return !hasLockIcon && !hasDisabledClass && !hasRequirementNotMet && !buttonDisabled;

  } catch (error) {
    console.error('Error checking loot unlock status:', error);
    return true; // Default to unlocked if we can't determine
  }
}

function initFloatingLootHelper() {
  if (!extensionSettings.lootHelper.enabled || !extensionSettings.lootHelper.showFloatingIcons) return;

  // Remove existing floating helper if present
  const existing = document.getElementById('loot-container');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.id = 'loot-container';
  container.style.position = 'fixed';
  container.style.right = '12px'; // Right side instead of left
  container.style.top = extensionSettings.lootHelper.topOffset;
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'flex-end'; // Align to right
  container.style.gap = '8px';
  container.style.zIndex = '2147483646';
  container.style.pointerEvents = 'auto';

  const lootBox = createLootBox();
  container.appendChild(lootBox);

  document.body.appendChild(container);
}

function createLootBox() {
  const item = document.createElement('div');
  item.style.display = 'flex';
  item.style.alignItems = 'flex-start';
  item.style.gap = '8px';
  item.style.width = '100%';
  item.style.justifyContent = 'flex-end'; // Align to right side

  // Icon (right)
  const icon = document.createElement('div');
  icon.style.width = '44px';
  icon.style.height = '44px';
  icon.style.borderRadius = '8px';
  icon.style.cursor = 'pointer';
  icon.style.boxShadow = '0 6px 16px rgba(0,0,0,0.35)';
  icon.style.backgroundImage = 'url(https://demonicscans.org/images/menu/compressed_referral.webp)';
  icon.style.backgroundSize = 'cover';
  icon.style.backgroundPosition = 'center';
  icon.style.backgroundRepeat = 'no-repeat';
  icon.style.display = 'flex';
  icon.style.alignItems = 'center';
  icon.style.justifyContent = 'center';
  icon.title = 'Auto Loot Helper';

  // Panel (right) - initially hidden
  const panel = document.createElement('div');
  panel.className = 'loot-panel';
  panel.id = 'panel-loot';
  panel.dataset.key = 'loot';
  panel.style.display = 'none';
  panel.style.boxSizing = 'border-box';
  panel.style.width = '320px';
  panel.style.maxWidth = '0';
  panel.style.opacity = '0';
  panel.style.overflow = 'hidden';
  panel.style.transition = 'max-width 280ms ease, opacity 220ms ease, padding 220ms';
  panel.style.padding = '0 8px';
  panel.style.borderRadius = '8px';
  panel.style.background = '#0f1116';
  panel.style.color = '#e9ecff';
  panel.style.boxShadow = '0 10px 26px rgba(0,0,0,0.45)';

  // Panel content
  const panelInner = document.createElement('div');
  panelInner.style.padding = '10px';
  panelInner.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:28px;height:28px;border-radius:6px;background:linear-gradient(45deg, #f9e2af, #fab387);display:flex;align-items:center;justify-content:center;font-size:16px;">🎁</div>
        <div style="flex:1">
          <div style="font-weight:700">Auto Loot</div>
          <div style="font-size:12px;color:#aaa">Quick loot helper</div>
        </div>
      </div>
    `;
  panel.appendChild(panelInner);

  // Target selection
  const targetRow = document.createElement('div');
  targetRow.style.display = 'flex';
  targetRow.style.gap = '8px';
  targetRow.style.marginTop = '8px';
  targetRow.style.alignItems = 'center';

  const targetLabel = document.createElement('label');
  targetLabel.textContent = 'Target:';
  targetLabel.style.fontSize = '12px';
  targetLabel.style.color = '#cdd6f4';
  targetLabel.style.minWidth = '45px';

  const targetSelect = document.createElement('select');
  targetSelect.id = 'floating-loot-target-select';
  targetSelect.style.flex = '1';
  targetSelect.style.background = '#1e1e2e';
  targetSelect.style.color = '#cdd6f4';
  targetSelect.style.border = '1px solid #45475a';
  targetSelect.style.borderRadius = '4px';
  targetSelect.style.padding = '4px';
  targetSelect.style.fontSize = '11px';
  targetSelect.innerHTML = `
      <option value="current">Current Page</option>
      <option value="wave">Specific Wave</option>
    `;

  targetRow.appendChild(targetLabel);
  targetRow.appendChild(targetSelect);
  panel.appendChild(targetRow);

  // Wave inputs (initially hidden)
  const waveRow = document.createElement('div');
  waveRow.id = 'floating-wave-inputs';
  waveRow.style.display = 'none';
  waveRow.style.gap = '8px';
  waveRow.style.marginTop = '8px';
  waveRow.style.alignItems = 'center';

  const eventLabel = document.createElement('label');
  eventLabel.textContent = 'Event:';
  eventLabel.style.fontSize = '11px';
  eventLabel.style.color = '#cdd6f4';
  eventLabel.style.minWidth = '40px';

  const eventInput = document.createElement('input');
  eventInput.type = 'number';
  eventInput.id = 'floating-loot-event-input';
  eventInput.min = '1';
  eventInput.max = '10';
  eventInput.value = extensionSettings.lootHelper.targetEvent;
  eventInput.style.width = '45px';
  eventInput.style.padding = '2px 4px';
  eventInput.style.background = '#1e1e2e';
  eventInput.style.color = '#cdd6f4';
  eventInput.style.border = '1px solid #45475a';
  eventInput.style.borderRadius = '3px';
  eventInput.style.textAlign = 'center';
  eventInput.style.fontSize = '11px';

  const waveLabel = document.createElement('label');
  waveLabel.textContent = 'Wave:';
  waveLabel.style.fontSize = '11px';
  waveLabel.style.color = '#cdd6f4';
  waveLabel.style.minWidth = '35px';

  const waveInput = document.createElement('input');
  waveInput.type = 'number';
  waveInput.id = 'floating-loot-wave-input';
  waveInput.min = '1';
  waveInput.max = '50';
  waveInput.value = extensionSettings.lootHelper.targetWave;
  waveInput.style.width = '45px';
  waveInput.style.padding = '2px 4px';
  waveInput.style.background = '#1e1e2e';
  waveInput.style.color = '#cdd6f4';
  waveInput.style.border = '1px solid #45475a';
  waveInput.style.borderRadius = '3px';
  waveInput.style.textAlign = 'center';
  waveInput.style.fontSize = '11px';

  waveRow.appendChild(eventLabel);
  waveRow.appendChild(eventInput);
  waveRow.appendChild(waveLabel);
  waveRow.appendChild(waveInput);
  panel.appendChild(waveRow);

  // Amount control
  const amountRow = document.createElement('div');
  amountRow.style.display = 'flex';
  amountRow.style.gap = '8px';
  amountRow.style.marginTop = '8px';
  amountRow.style.alignItems = 'center';

  const amountLabel = document.createElement('label');
  amountLabel.textContent = 'Amount:';
  amountLabel.style.fontSize = '12px';
  amountLabel.style.color = '#cdd6f4';
  amountLabel.style.minWidth = '50px';

  const dec = document.createElement('button');
  dec.textContent = '−';
  dec.style.padding = '4px 8px';
  dec.style.background = '#f38ba8';
  dec.style.color = '#fff';
  dec.style.border = 'none';
  dec.style.borderRadius = '4px';
  dec.style.cursor = 'pointer';
  dec.style.fontSize = '11px';

  const amountInput = document.createElement('input');
  amountInput.type = 'number';
  amountInput.min = '1';
  amountInput.max = '999';
  amountInput.value = extensionSettings.lootHelper.defaultLootAmount;
  amountInput.id = 'floating-loot-amount-input';
  amountInput.style.width = '50px';
  amountInput.style.padding = '4px';
  amountInput.style.borderRadius = '4px';
  amountInput.style.background = '#1e1e2e';
  amountInput.style.color = '#cdd6f4';
  amountInput.style.border = '1px solid #45475a';
  amountInput.style.textAlign = 'center';
  amountInput.style.fontSize = '11px';

  const inc = document.createElement('button');
  inc.textContent = '+';
  inc.style.padding = '4px 8px';
  inc.style.background = '#a6e3a1';
  inc.style.color = '#1e1e2e';
  inc.style.border = 'none';
  inc.style.borderRadius = '4px';
  inc.style.cursor = 'pointer';
  inc.style.fontSize = '11px';

  dec.addEventListener('click', () => {
    const currentValue = parseInt(amountInput.value) || 1;
    const newValue = Math.max(1, currentValue - 1);
    amountInput.value = newValue;
    extensionSettings.lootHelper.defaultLootAmount = newValue;
    saveSettings();
  });

  inc.addEventListener('click', () => {
    const currentValue = parseInt(amountInput.value) || 1;
    const newValue = Math.min(999, currentValue + 1);
    amountInput.value = newValue;
    extensionSettings.lootHelper.defaultLootAmount = newValue;
    saveSettings();
  });

  amountRow.appendChild(amountLabel);
  amountRow.appendChild(dec);
  amountRow.appendChild(amountInput);
  amountRow.appendChild(inc);
  panel.appendChild(amountRow);

  // Action buttons
  const actionRow = document.createElement('div');
  actionRow.style.display = 'flex';
  actionRow.style.gap = '6px';
  actionRow.style.marginTop = '8px';

  const lootAllBtn = document.createElement('button');
  lootAllBtn.textContent = 'Loot All';
  lootAllBtn.style.flex = '1';
  lootAllBtn.style.padding = '6px 8px';
  lootAllBtn.style.background = '#74c0fc';
  lootAllBtn.style.color = '#1e1e2e';
  lootAllBtn.style.border = 'none';
  lootAllBtn.style.borderRadius = '6px';
  lootAllBtn.style.cursor = 'pointer';
  lootAllBtn.style.fontSize = '11px';
  lootAllBtn.style.fontWeight = 'bold';

  const lootUnlockedBtn = document.createElement('button');
  lootUnlockedBtn.textContent = 'Unlocked Only';
  lootUnlockedBtn.style.flex = '1';
  lootUnlockedBtn.style.padding = '6px 8px';
  lootUnlockedBtn.style.background = '#a6e3a1';
  lootUnlockedBtn.style.color = '#1e1e2e';
  lootUnlockedBtn.style.border = 'none';
  lootUnlockedBtn.style.borderRadius = '6px';
  lootUnlockedBtn.style.cursor = 'pointer';
  lootUnlockedBtn.style.fontSize = '11px';
  lootUnlockedBtn.style.fontWeight = 'bold';

  actionRow.appendChild(lootAllBtn);
  actionRow.appendChild(lootUnlockedBtn);
  panel.appendChild(actionRow);

  // Preset buttons
  const presetRow = document.createElement('div');
  presetRow.style.display = 'flex';
  presetRow.style.gap = '4px';
  presetRow.style.marginTop = '6px';

  [1, 5, 10, 25].forEach(amount => {
    const presetBtn = document.createElement('button');
    presetBtn.textContent = amount + 'x';
    presetBtn.style.flex = '1';
    presetBtn.style.padding = '2px 4px';
    presetBtn.style.background = '#313244';
    presetBtn.style.color = '#cdd6f4';
    presetBtn.style.border = '1px solid #45475a';
    presetBtn.style.borderRadius = '3px';
    presetBtn.style.cursor = 'pointer';
    presetBtn.style.fontSize = '9px';
    presetBtn.addEventListener('click', () => {
      amountInput.value = amount;
      extensionSettings.lootHelper.defaultLootAmount = amount;
      saveSettings();
    });
    presetRow.appendChild(presetBtn);
  });

  panel.appendChild(presetRow);

  // Event listeners
  targetSelect.addEventListener('change', (e) => {
    const isWave = e.target.value === 'wave';
    waveRow.style.display = isWave ? 'flex' : 'none';
    extensionSettings.lootHelper.targetPage = isWave ? 'wave' : 'current';
    saveSettings();
  });

  eventInput.addEventListener('input', (e) => {
    const value = Math.max(1, Math.min(10, parseInt(e.target.value) || 2));
    e.target.value = value;
    extensionSettings.lootHelper.targetEvent = value;
    saveSettings();
  });

  waveInput.addEventListener('input', (e) => {
    const value = Math.max(1, Math.min(50, parseInt(e.target.value) || 6));
    e.target.value = value;
    extensionSettings.lootHelper.targetWave = value;
    saveSettings();
  });

  amountInput.addEventListener('input', (e) => {
    const value = Math.max(1, Math.min(999, parseInt(e.target.value) || 1));
    e.target.value = value;
    extensionSettings.lootHelper.defaultLootAmount = value;
    saveSettings();
  });

  lootAllBtn.addEventListener('click', () => {
    const amount = parseInt(amountInput.value) || 1;
    performLootAction('all', amount);
  });

  lootUnlockedBtn.addEventListener('click', () => {
    const amount = parseInt(amountInput.value) || 1;
    performLootAction('unlocked', amount);
  });

  // Toggle panel on icon click
  icon.addEventListener('click', () => {
    const isOpen = panel.classList.contains('open');
    if (isOpen) {
      // Close panel
      panel.style.maxWidth = '0';
      panel.style.opacity = '0';
      panel.style.padding = '0 8px';
      panel.classList.remove('open');
      setTimeout(() => {
        if (!panel.classList.contains('open')) panel.style.display = 'none';
      }, 300);
    } else {
      // Open panel
      panel.style.display = 'block';
      setTimeout(() => {
        panel.style.maxWidth = '320px';
        panel.style.opacity = '1';
        panel.style.padding = '8px';
        panel.classList.add('open');
      }, 10);
    }
  });

  // Set initial values
  targetSelect.value = extensionSettings.lootHelper.targetPage === 'current' ? 'current' : 'wave';
  if (targetSelect.value === 'wave') {
    waveRow.style.display = 'flex';
  }

  item.appendChild(panel); // Panel first (left side)
  item.appendChild(icon);  // Icon second (right side)
  return item;
}

// Quest Widget Functions
async function fetchQuestData() {
  try {
    const response = await fetch('https://demonicscans.org/battle_pass.php');
    const html = await response.text();
    return parseQuestData(html);
  } catch (error) {
    console.error('Failed to fetch quest data:', error);
    return null;
  }
}

function parseQuestData(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Find the card containing the daily quests
  const cards = doc.querySelectorAll('.card');
  let questCard = null;
  for (const card of cards) {
    const titleEl = card.querySelector('.title');
    if (titleEl && titleEl.textContent.includes('Daily Quests')) {
      questCard = card;
      break;
    }
  }
  if (!questCard) return null;

  const title = questCard.querySelector('.title')?.textContent?.trim() || 'Daily Quests';
  const quests = [];

  const questElements = questCard.querySelectorAll('.quest');
  questElements.forEach(questEl => {
    const name = questEl.querySelector('div:first-child strong')?.textContent?.trim() || '';
    const details = questEl.querySelector('.muted')?.textContent?.trim() || '';
    const progressBar = questEl.querySelector('.progress div');
    const progressText = questEl.querySelector('.muted:last-child')?.textContent?.trim() || '';

    const progressWidth = progressBar?.style?.width || '0%';

    quests.push({
      name,
      details,
      progress: progressWidth,
      progressText
    });
  });

  return { title, quests };
}

// Sidebar Quest Widget Functions
function initSidebarQuestWidget() {
  // Quest panel is now embedded in the Battle Pass expandable section
  // Data loading is handled by the expand button click handler
  if (extensionSettings.battlePassExpanded) {
    updateSidebarQuestPanel();
  }
}

async function updateSidebarQuestPanel() {
  const questData = await fetchQuestData();
  const content = document.getElementById('sidebar-quest-content');

  if (!content) return;

  if (!questData || !questData.quests.length) {
    content.innerHTML = '<div style="text-align: center; padding: 15px; color: #6c7086; font-size: 11px;">Unable to load quests</div>';
    return;
  }

  let html = `<div style="font-weight: bold; margin-bottom: 8px; color: #f38ba8; font-size: 11px;">${questData.title}</div>`;

  questData.quests.forEach(quest => {
    const isCompleted = quest.progressText.includes('✅ Completed');
    const borderColor = isCompleted ? '#a6e3a1' : '#89b4fa';
    html += `
        <div style="margin-bottom: 8px; padding: 6px; background: rgba(30, 30, 46, 0.5); border-radius: 4px; border-left: 2px solid ${borderColor};">
          <div class="quest-title" style="font-weight: bold; color: #cdd6f4; font-size: 10px; margin-bottom: 3px;">${quest.name}</div>
          <div class="quest-details" style="color: #6c7086; font-size: 9px; margin-bottom: 3px;">${quest.details}</div>
          <div style="background: #313244; border-radius: 3px; height: 4px; overflow: hidden; margin-bottom: 3px;">
            <div style="height: 100%; background: linear-gradient(90deg, #22c55e, #16a34a); width: ${quest.progress}; transition: width 0.3s ease;"></div>
          </div>
          <div style="color: #6c7086; font-size: 9px;">${quest.progressText}</div>
        </div>
      `;
  });

  content.innerHTML = html;
}

// ===== PET TEAMS SIDEBAR FUNCTIONS =====

async function initPetTeamsSidebar() {
  const petTeamsContainer = document.getElementById('pet-teams-list');
  if (!petTeamsContainer) return;

  const petTeamsData = getPetTeams();
  const currentMode = localStorage.getItem('petTeamsMode') || 'attack';

  // Update mode button states
  document.querySelectorAll('.pet-mode-btn').forEach(btn => {
    if (btn.dataset.mode === currentMode) {
      btn.style.background = '#89b4fa';
      btn.style.color = '#1e1e2e';
      btn.style.border = 'none';
    } else {
      btn.style.background = '#313244';
      btn.style.color = '#cdd6f4';
      btn.style.border = '1px solid #45475a';
    }
  });

  const teamNames = Object.keys(petTeamsData);
  if (teamNames.length === 0) {
    petTeamsContainer.innerHTML = '<div style="color: #6c7086; padding: 10px; text-align: center; font-size: 11px;">No pet teams saved yet. Visit Pets & Eggs page to create teams.</div>';
    return;
  }

  let html = '';
  teamNames.forEach(teamName => {
    const pets = Object.values(petTeamsData[teamName]);
    const petPreviews = pets.slice(0, 4).map(p =>
      `<img src="${p.img}" title="${p.name}" style="width: 20px; height: 20px; border-radius: 3px; border: 1px solid #45475a; margin-right: 2px;" />`
    ).join('');
    const moreCount = pets.length > 4 ? `<span style="font-size: 9px; color: #6c7086;">+${pets.length - 4}</span>` : '';

    html += `
        <div class="pet-team-item" style="padding: 8px; background: rgba(30, 30, 46, 0.4); border: 1px solid rgba(69, 71, 90, 0.5); border-radius: 6px; margin-bottom: 6px; cursor: pointer;" data-team-name="${teamName}">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="color: #f9e2af; font-size: 11px; font-weight: bold;">${teamName}</span>
            <span style="color: #89b4fa; font-size: 10px;">${currentMode === 'attack' ? '⚔️' : '🛡️'}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            ${petPreviews}
            ${moreCount}
          </div>
        </div>
      `;
  });

  petTeamsContainer.innerHTML = html;

  // Add click handlers
  document.querySelectorAll('.pet-team-item').forEach(item => {
    item.addEventListener('click', async () => {
      const teamName = item.dataset.teamName;
      await applyPetTeam(teamName, currentMode);
    });
  });
}

async function applyPetTeam(teamName, mode) {
  const petTeamsData = getPetTeams();
  const team = petTeamsData[teamName];

  if (!team) {
    showNotification('Pet team not found', '#e74c3c');
    return;
  }

  showNotification(`Applying pet team "${teamName}" (${mode === 'attack' ? 'Attack' : 'Defense'})...`, '#89b4fa');

  // Navigate to pets page with mode
  window.location.href = `pets.php?set=${mode}&apply_team=${encodeURIComponent(teamName)}`;
}

function getPetTeams() {
  try {
    const raw = localStorage.getItem('pet_teams_v1');
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error('Error loading pet teams:', error);
    return {};
  }
}

// ===== BLACKSMITH SIDEBAR FUNCTIONS =====

async function initBlacksmithSidebar() {
  const blacksmithContainer = document.getElementById('blacksmith-items-list');
  if (!blacksmithContainer) return;

  try {
    blacksmithContainer.innerHTML = '<div style="color: #89b4fa; padding: 10px; text-align: center; font-size: 11px;">Loading recipes...</div>';

    const response = await fetch('blacksmith.php', { credentials: 'include' });
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const recipes = parseBlacksmithRecipes(doc);

    if (recipes.length === 0) {
      blacksmithContainer.innerHTML = '<div style="color: #6c7086; padding: 10px; text-align: center; font-size: 11px;">No craftable items found</div>';
      return;
    }

    displayBlacksmithRecipes(recipes, blacksmithContainer);
  } catch (error) {
    console.error('Error loading blacksmith recipes:', error);
    blacksmithContainer.innerHTML = '<div style="color: #f38ba8; padding: 10px; text-align: center; font-size: 11px;">Failed to load recipes</div>';
  }
}

function parseBlacksmithRecipes(doc) {
  const recipes = [];
  const recipeCards = doc.querySelectorAll('.card');

  recipeCards.forEach(card => {
    const isLegendary = card.classList.contains('legendary');
    const nameEl = card.querySelector('.result-name');
    const imgEl = card.querySelector('.result-img');
    const attackEl = card.querySelector('.result-attack');
    const defenseEl = card.querySelector('.result-defense');
    const forgeBtn = card.querySelector('.forge-btn');
    const canForge = forgeBtn && !forgeBtn.disabled;

    const requirements = [];
    card.querySelectorAll('.req').forEach(req => {
      const reqImg = req.querySelector('img');
      const reqQty = req.querySelector('.qty');
      if (reqImg && reqQty) {
        // Extract a numeric quantity from the requirement string
        const qtyText = (reqQty.textContent || '').trim();

        // Prefer explicit `have/need` parsing like `1082/2500`. Fallback to a single number if
        // the format doesn't include a slash.
        let haveNumber = null;
        let needNumber = null;
        const slashMatch = qtyText.match(/([0-9,\.]+)\s*\/\s*([0-9,\.]+)/);
        if (slashMatch) {
          haveNumber = parseInt(slashMatch[1].replace(/,/g, ''), 10) || 0;
          needNumber = parseInt(slashMatch[2].replace(/,/g, ''), 10) || 1;
        } else {
          // try single-number parse (assume this is the required qty)
          const singleMatch = qtyText.match(/([0-9,\.]+)/);
          if (singleMatch) {
            needNumber = parseInt(singleMatch[1].replace(/,/g, ''), 10) || 1;
          }
        }

        // Also check for 'ok' class or inventory amounts to determine craftability. The inventory
        // function may not be able to find some items unless pinned; fall back to parsed haveNumber.
        const invQty = getInventoryItemQuantity(reqImg.alt || reqImg.title || reqImg.dataset?.name || '');
        const actualHave = (Number.isFinite(invQty) && invQty >= 0) ? invQty : (Number.isFinite(haveNumber) ? haveNumber : 0);
        const hasEnough = reqQty.classList.contains('ok') || (Number.isFinite(actualHave) && Number.isFinite(needNumber) && actualHave >= needNumber);

        requirements.push({
          img: reqImg.src,
          name: reqImg.alt,
          qty: qtyText,
          qtyNumber: needNumber || 1,
          haveNumber: haveNumber || 0,
          hasEnough
        });
      }
    });

    if (nameEl) {
      recipes.push({
        name: nameEl.textContent.trim(),
        img: imgEl ? imgEl.src : '',
        attack: attackEl ? attackEl.textContent.replace('🔪 Attack: ', '').trim() : '',
        defense: defenseEl ? defenseEl.textContent.replace('🛡️ Defense: ', '').trim() : '',
        isLegendary,
        canForge,
        requirements
      });
    }
  });

  return recipes;
}

function displayBlacksmithRecipes(recipes, container) {
  // Show craftable items first, then non-craftable, both sorted by legendary
  const craftable = recipes.filter(r => r.canForge).sort((a, b) => b.isLegendary - a.isLegendary);
  const notCraftable = recipes.filter(r => !r.canForge).sort((a, b) => b.isLegendary - a.isLegendary);

  const displayRecipes = [...craftable, ...notCraftable];

  let html = '';
  // Build separate HTML blocks for craftable and uncraftable
  let htmlCraft = '';
  craftable.forEach(recipe => {
    const borderColor = recipe.isLegendary ? '#f9e2af' : (recipe.canForge ? '#a6e3a1' : '#45475a');
    const badgeHtml = recipe.isLegendary ? '<div style="position: absolute; top: 2px; right: 2px; background: #f9e2af; color: #1e1e2e; padding: 2px 4px; border-radius: 3px; font-size: 8px; font-weight: bold;">LEGENDARY</div>' : '';

    html += `
        <div class="blacksmith-recipe-item" style="padding: 8px; background: rgba(30, 30, 46, 0.4); border: 1px solid ${borderColor}; border-radius: 6px; margin-bottom: 8px; position: relative;">
          ${badgeHtml}
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
            <img src="${recipe.img}" alt="${recipe.name}" style="width: 32px; height: 32px; border-radius: 4px; border: 1px solid #45475a;">
            <div style="flex: 1;">
              <div style="color: ${recipe.isLegendary ? '#f9e2af' : '#cdd6f4'}; font-size: 10px; font-weight: bold; margin-bottom: 2px;">${recipe.name}</div>
              <div style="display: flex; gap: 8px; font-size: 9px; color: #a6adc8;">
                ${recipe.attack ? `<span>⚔️ ${recipe.attack}</span>` : ''}
                ${recipe.defense ? `<span>🛡️ ${recipe.defense}</span>` : ''}
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 3px; flex-wrap: wrap; margin-bottom: 6px;">
            ${recipe.requirements.map(req => `
              <div class="req-tooltip" style="position: relative; cursor: help;" title="${req.name} ${req.qty}">
                <img src="${req.img}" alt="${req.name}" style="width: 16px; height: 16px; border-radius: 2px; border: 1px solid ${req.hasEnough ? '#a6e3a1' : '#f38ba8'}; opacity: ${req.hasEnough ? '1' : '0.6'};">
                ${(() => {
        // Prefer inventory lookup, otherwise show the have-number parsed from the page
        const invHave = getInventoryItemQuantity(req.name || req.img || req.alt || '');
        const haveText = Number.isFinite(invHave) ? invHave : (Number.isFinite(req.haveNumber) ? req.haveNumber : 0);
        const need = Number.isFinite(req.qtyNumber) ? req.qtyNumber : (req.qty ? parseInt(String(req.qty).replace(/[^0-9]/g, ''), 10) || 1 : 1);
        const color = (haveText >= need) ? '#a6e3a1' : '#f38ba8';
        return `<div style="position:absolute; right:-7px; bottom:-7px; background: rgba(0,0,0,0.7); color: ${color}; font-size: 9px; padding: 1px 4px; border-radius: 4px;">${haveText}/${need}</div>`;
      })()}
              </div>
            `).join('')}
          </div>
          <button class="craft-btn" onclick="window.location.href='blacksmith.php'" style="width: 100%; padding: 4px; background: ${recipe.canForge ? '#a6e3a1' : '#313244'}; color: ${recipe.canForge ? '#1e1e2e' : '#6c7086'}; border: none; border-radius: 4px; font-size: 10px; cursor: pointer;">
            ${recipe.canForge ? '🔨 Craft Now' : '📋 View Recipe'}
          </button>
        </div>
      `;
  });

  const craftHeading = `<div style="margin-bottom:8px; color:#a6e3a1; font-weight:bold; font-size:12px;">🔨 Craftable (${craftable.length})</div>`;

  let htmlUncraft = '';
  if (extensionSettings.blacksmith?.showUncraftable && notCraftable.length > 0) {
    notCraftable.forEach(recipe => {
      const borderColor = recipe.isLegendary ? '#f9e2af' : '#45475a';
      const badgeHtml = recipe.isLegendary ? '<div style="position: absolute; top: 2px; right: 2px; background: #f9e2af; color: #1e1e2e; padding: 2px 4px; border-radius: 3px; font-size: 8px; font-weight: bold;">LEGENDARY</div>' : '';

      htmlUncraft += `
          <div class="blacksmith-recipe-item" style="padding: 8px; background: rgba(30, 30, 46, 0.4); border: 1px solid ${borderColor}; border-radius: 6px; margin-bottom: 8px; position: relative; opacity: 0.9;">
            ${badgeHtml}
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
              <img src="${recipe.img}" alt="${recipe.name}" style="width: 32px; height: 32px; border-radius: 4px; border: 1px solid #45475a;">
              <div style="flex: 1;">
                <div style="color: ${recipe.isLegendary ? '#f9e2af' : '#cdd6f4'}; font-size: 10px; font-weight: bold; margin-bottom: 2px;">${recipe.name}</div>
              </div>
            </div>
            <div style="display: flex; gap: 3px; flex-wrap: wrap; margin-bottom: 6px;">
              ${recipe.requirements.map(req => `
                <div class="req-tooltip" style="position: relative; cursor: help;" title="${req.name} ${req.qty}">
                  <img src="${req.img}" alt="${req.name}" style="width: 16px; height: 16px; border-radius: 2px; border: 1px solid ${req.hasEnough ? '#a6e3a1' : '#f38ba8'}; opacity: ${req.hasEnough ? '1' : '0.6'};">
                  ${(() => {
          const invHave = getInventoryItemQuantity(req.name || req.img || req.alt || '');
          const haveText = Number.isFinite(invHave) ? invHave : (Number.isFinite(req.haveNumber) ? req.haveNumber : 0);
          const need = Number.isFinite(req.qtyNumber) ? req.qtyNumber : (req.qty ? parseInt(String(req.qty).replace(/[^0-9]/g, ''), 10) || 1 : 1);
          const color = (haveText >= need) ? '#a6e3a1' : '#f38ba8';
          return `<div style="position:absolute; right:-7px; bottom:-7px; background: rgba(0,0,0,0.7); color: ${color}; font-size: 9px; padding: 1px 4px; border-radius: 4px;">${haveText}/${need}</div>`;
        })()}
                </div>
              `).join('')}
            </div>
            <button class="craft-btn" onclick="window.location.href='blacksmith.php'" style="width: 100%; padding: 4px; background: #313244; color: #6c7086; border: none; border-radius: 4px; font-size: 10px; cursor: pointer;">
              📋 View Recipe
            </button>
          </div>
        `;
    });
  }

  // craftable HTML is built into `html` previously
  const htmlCraftFinal = craftHeading + html;
  let combinedHtml = htmlCraftFinal;
  if (extensionSettings.blacksmith?.showUncraftable && notCraftable.length > 0) {
    combinedHtml += `<div style="margin-top:10px; color:#f38ba8; font-weight:bold; font-size:12px;">📌 Uncraftable (${notCraftable.length})</div>`;
    combinedHtml += htmlUncraft;
  }
  container.innerHTML = combinedHtml;
}

// ===== EQUIPMENT SETS MODE SWITCHING =====

// Equipment set mode switcher removed - functionality not needed

function initSettingsModal() {
  // Settings modal is now handled by the topbar settings button
  // No sidebar settings link needed
}

function showSettingsModal() {
  // Settings modal is now handled by the topbar settings button
  // No sidebar settings link needed

  let modal = document.getElementById('settings-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'settings-modal';
    modal.className = 'settings-modal';

    modal.innerHTML = `
          <div class="settings-container">
            <div class="settings-header">
              <h1>⚙️ Settings</h1>
            </div>

            <div class="settings-content">
              <div class="settings-grid">
                <!-- Updates (moved inside grid) -->
                <div style="padding: 20px 30px; border-top: 2px solid #45475a;">
                  <h3 style="color: #89b4fa; margin: 0 0 15px 0; font-size: 16px;">🔄 Updates</h3>
                  <p style="color: #a6adc8; font-size: 12px; margin-bottom: 20px;">
                    Check for new versions of the extension from GitHub.
                  </p>
                  <div style="background: rgba(49, 50, 68, 0.3); padding: 20px; border-radius: 8px; border-left: 3px solid #89b4fa; margin-bottom: 20px;">
                    <h4 style="color: #89b4fa; margin: 0 0 15px 0; font-size: 14px;">💻 Version Information</h4>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #45475a;">
                        <span style="color: #f9e2af; font-weight: 500;">Current Version:</span>
                        <span id="current-version" style="color: #cdd6f4; font-family: monospace;">2.1</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #45475a;">
                        <span style="color: #f9e2af; font-weight: 500;">Latest Version:</span>
                        <span id="latest-version" style="color: #cdd6f4; font-family: monospace;">Not checked</span>
                      </div>
                      <div style="padding: 8px 0;">
                        <span id="update-status" style="color: #a6adc8; font-size: 12px;">Click "Check for Updates" to check</span>
                      </div>
                    </div>
                  </div>

                  <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <button class="settings-button" id="check-updates-btn" style="background: #89b4fa; flex: 1;">
                      🔍 Check for Updates
                    </button>
                    <button class="settings-button" id="open-release-btn" style="background: #a6e3a1; flex: 1;" disabled>
                      👁️ View Latest Release
                    </button>
                  </div>

                  <div id="updates-last-checked" style="color: #6c7086; font-size: 11px; text-align: center; margin-top: 10px;"></div>
                </div>
                <!-- Customization Section -->
                <div class="settings-section expanded">
                  <div class="settings-section-header" onclick="toggleSection(this)">
                    <h3>🎨 Customization</h3>
                    <span class="expand-icon">−</span>
                  </div>
                  <div class="settings-section-content">
                    <p class="section-description">Customize colors, backgrounds, and visual appearance.</p>
                    
                    <!-- Sidebar Color -->
                    <div style="margin: 20px 0; padding: 15px; background: rgba(49, 50, 68, 0.3); border-radius: 8px;">
                      <h4 style="color: #f9e2af; margin-bottom: 10px;">🎨 Sidebar Color</h4>
                      <div class="color-input-group">
                        <input type="color" id="sidebar-custom-color" value="#2a2a2a">
                        <label>Custom Color</label>
                      </div>
                    </div>

                    <!-- Background Color -->
                    <div style="margin: 20px 0; padding: 15px; background: rgba(49, 50, 68, 0.3); border-radius: 8px;">
                      <h4 style="color: #f9e2af; margin-bottom: 10px;">🌅 Background Color</h4>
                      <div class="color-input-group">
                        <input type="color" id="background-custom-color" value="#000000">
                        <label>Custom Color</label>
                      </div>
                    </div>

                    <!-- Semi-Transparent Sidebar -->
                    <div style="margin: 20px 0; padding: 15px; background: rgba(49, 50, 68, 0.3); border-radius: 8px;">
                      <h4 style="color: #f9e2af; margin-bottom: 10px;">Semi-Transparent Sidebar</h4>
                      <p style="color: #a6adc8; font-size: 12px; margin-bottom: 10px;">Make sidebar semi-transparent like inventory sets panel.</p>
                      <div class="checkbox-container">
                        <input type="checkbox" id="semi-transparent-enabled" />
                        <label for="semi-transparent-enabled">Enable Semi-Transparent Sidebar</label>
                      </div>
                      <div class="range-container">
                        <label for="semi-transparent-opacity">Opacity</label>
                        <input type="range" id="semi-transparent-opacity" min="0.3" max="1" step="0.05" value="0.85" />
                        <span id="semi-transparent-opacity-value">0.85</span>
                      </div>
                    </div>
                    
                    <!-- Monster Image Outline -->
                    <div style="margin: 20px 0; padding: 15px; background: rgba(49, 50, 68, 0.3); border-radius: 8px;">
                      <h4 style="color: #f9e2af; margin-bottom: 10px;">🐲 Monster Image Outline</h4>
                      <p style="color: #a6adc8; font-size: 12px; margin-bottom: 10px;">Customize the outline color for monster images in battles.</p>
                      <div class="color-input-group">
                        <input type="color" id="monster-image-custom-color" value="#ff6b6b">
                        <label>Custom Color</label>
                      </div>
                    </div>

                    <!-- Monster Backgrounds -->
              <div style="margin: 20px 0; padding: 15px; background: rgba(49, 50, 68, 0.2); border-radius: 8px;">
                <h4 style="color: #f9e2af; margin: 0 0 10px 0;">🐉 Monster Backgrounds</h4>
              <div style="margin: 15px 0;">
                <div style="margin-bottom: 15px; display: flex; align-items: center;">
                  <label style="color: #cdd6f4; display: flex; align-items: center;">
                    Dark overlay for text readability:
                    <div class="neo-toggle-container">
                    <input type="checkbox" id="monster-bg-overlay" class="neo-toggle-input">
                    <label for="monster-bg-overlay" class="neo-toggle">
                      <div class="neo-track">
                        <div class="neo-background-layer"></div>
                        <div class="neo-grid-layer"></div>
                        <div class="neo-track-highlight"></div>
                        <div class="neo-spectrum-analyzer">
                          <div class="neo-spectrum-bar"></div>
                          <div class="neo-spectrum-bar"></div>
                          <div class="neo-spectrum-bar"></div>
                          <div class="neo-spectrum-bar"></div>
                          <div class="neo-spectrum-bar"></div>
                        </div>
                      </div>
                      <div class="neo-thumb">
                        <div class="neo-thumb-ring"></div>
                        <div class="neo-thumb-core">
                          <div class="neo-thumb-icon">
                            <div class="neo-thumb-wave"></div>
                          </div>
                          <div class="neo-thumb-pulse"></div>
                        </div>
                      </div>
                      <div class="neo-status">
                        <div class="neo-status-indicator">
                          <div class="neo-status-dot"></div>
                          <div class="neo-status-text"></div>
                        </div>
                      </div>
                    </label></div>
                  </label>
                </div>
                <div style="margin-left: 25px;">
                  <label style="color: #a6adc8; font-size: 12px;">Overlay Opacity:</label>
                  <input type="range" id="monster-bg-overlay-opacity" min="0.1" max="0.8" step="0.1" value="0.4" style="width: 150px; margin-left: 10px;">
                  <span id="monster-bg-opacity-value" style="color: #cdd6f4; margin-left: 10px;">40%</span>
                </div>
              </div>
                
                <div style="margin: 15px 0;">
                  <label style="color: #f9e2af; margin-bottom: 10px; display: block;">Effect Type:</label>
                  <select id="monster-bg-effect" style="width: 200px; padding: 8px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; margin-bottom: 15px;">
                    <option value="normal">Normal</option>
                    <option value="gradient">Gradient (Tint)</option>
                    <option value="blur">Blur</option>
                    <option value="pattern">Pattern</option>
                  </select>
              </div>

              <div id="monster-urls-container" style="margin-top: 20px;">
                <h4 style="color: #f9e2af; margin-bottom: 15px;">Monster Background URLs</h4>
                <div id="monster-url-inputs"></div>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                  <button type="button" id="add-monster-url" class="settings-button" style="background: #89b4fa;">
                    ➕ Add Monster Background
                  </button>
                  <button type="button" id="save-monster-backgrounds" class="settings-button" style="background: #a6e3a1;">
                    💾 Save Changes
                  </button>
                </div>
              </div>
              </div>
              
              <!-- Loot Card Customization -->
              <div style="margin: 20px 0; padding: 15px; background: rgba(49, 50, 68, 0.2); border-radius: 8px;">
                <h4 style="color: #f9e2af; margin: 0 0 10px 0;">💎 Loot Card Customization</h4>
                <p style="color: #a6adc8; font-size: 12px; margin-bottom: 15px;">
                  Customize loot card borders and highlighting when damage requirements are met.
                </p>
              
              <!-- Border Color Section -->
              <div style="margin: 15px 0;">
                <h4 style="color: #f9e2af; margin-bottom: 15px;">🎨 Border Colors</h4>
                <div class="color-input-group">
                  <input type="color" id="loot-card-custom-color" value="#f38ba8" style="width: 50px; height: 30px; border: none; border-radius: 4px; cursor: pointer;">
                  <label style="color: #cdd6f4; margin-left: 10px;">Custom Border Color</label>
                </div>
              </div>
              
              <!-- Highlighting Section -->
              <div style="margin: 15px 0;">
                <h4 style="color: #f9e2af; margin-bottom: 15px;">✨ Highlighting Effects</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
                  <div>
                    <label style="color: #f9e2af; margin-bottom: 10px; display: block;">Background Color:</label>
                    <div style="margin-top: 10px;">
                      <input type="color" id="loot-highlighting-bg-color" value="#00ff1e" style="width: 50px; height: 30px; border: none; border-radius: 4px; cursor: pointer;">
                      <span style="color: #cdd6f4; margin-left: 10px;">Background Color</span>
                    </div>
                  </div>
                  
                  <div>
                    <label style="color: #f9e2af; margin-bottom: 10px; display: block;">Glow Color:</label>
                    <div style="margin-top: 10px;">
                      <input type="color" id="loot-highlighting-glow-color" value="#ffd700" style="width: 50px; height: 30px; border: none; border-radius: 4px; cursor: pointer;">
                      <span style="color: #cdd6f4; margin-left: 10px;">Glow Effect Color</span>
                    </div>
                  </div>
                </div>
              </div>
              </div>
              
              <!-- Custom Backgrounds -->
              <div style="margin: 20px 0; padding: 15px; background: rgba(49, 50, 68, 0.2); border-radius: 8px;">
                <h4 style="color: #f9e2af; margin: 0 0 10px 0;">🖼️ Custom Backgrounds</h4>
                <p style="color: #a6adc8; font-size: 12px; margin-bottom: 15px;">
                  Upload custom backgrounds for any page. 
                </p>
              <div style="margin: 15px 0;">
                <label style="display: flex; align-items: center; gap: 10px; color: #cdd6f4; margin-bottom: 15px;">
                  <input type="checkbox" id="custom-backgrounds-enabled" class="cyberpunk-checkbox" style="border: 2px solid rgb(249, 226, 175); box-shadow: rgba(249, 226, 175, 0.4) 0px 0px 15px; appearance: none; width: 20px; height: 20px; border-radius: 5px; background-color: transparent; display: inline-block; position: relative; margin-right: 10px; cursor: pointer; transition: 0.3s;" data-checkmark-added="true">
                  <span>Enable custom backgrounds</span>
                </label>

                <div id="custom-backgrounds-container" style="margin-top: 20px;">
                  <h4 style="color: #f9e2af; margin-bottom: 15px;">Custom Background URLs</h4>
                  <div id="custom-bg-inputs"></div>
                  <button type="button" id="add-custom-bg" class="settings-button" style="background: #89b4fa; margin-top: 10px;">
                    ➕ Add Custom Background
                  </button>
                  <div style="margin-top: 12px; display:flex; align-items:center; gap:10px;">
                    <label style="color:#cdd6f4; display:flex; align-items:center; gap:10px;">
                      <input type="checkbox" id="remove-lizard-theme" class="cyberpunk-checkbox" />
                      <span>Remove built-in Lizard theme (scaly)</span>
                    </label>
                  </div>
                </div>
                </div>
              </div>
              
              <!-- Menu Customization -->
              <div class="settings-subsection expanded">
                <div class="settings-subsection-header" id="menu-customization-header" onclick="toggleSection(this)">
                  <h4 style="color: #f9e2af; margin: 0;">🎛️ Menu Customization</h4>
                  <span class="expand-icon" id="menu-customization-icon">−</span>
                </div>
                <div class="settings-subsection-content" id="menu-customization-content">
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

                <!-- Image Replacements -->
                <div style="margin: 20px 0; padding: 15px; background: rgba(49, 50, 68, 0.2); border-radius: 8px;">
                  <h4 style="color: #f9e2af; margin: 0 0 10px 0;">🖼️ Image Replacements</h4>
                  <p style="color: #a6adc8; font-size: 12px; margin-bottom: 15px;">
                    Replace default images with custom ones. Enter the original image URL and your custom URL.
                  </p>
                  <div id="image-replacements-container"></div>
                  <button type="button" id="add-image-replacement" class="settings-button" style="background: #89b4fa; margin-top: 10px;">
                    ➕ Add Replacement
                  </button>
                </div>

                  </div>
                </div>

                <!-- Potion Helper Section -->
                <div class="settings-section">
                  <div class="settings-section-header" onclick="toggleSection(this)">
                    <h3>🧪 Potion Helper</h3>
                    <span class="expand-icon">+</span>
                  </div>
                  <div class="settings-section-content">
                    <p class="section-description">Configure potion helper features and display options.</p>
                    <div class="checkbox-container">
                      <input type="checkbox" id="potion-helper-enabled" />
                      <label for="potion-helper-enabled">Enable Potion Helper</label>
                    </div>
                    <div class="checkbox-container">
                      <input type="checkbox" id="potion-floating-icons" />
                      <label for="potion-floating-icons">Show Floating Icons</label>
                    </div>
                    <div class="checkbox-container">
                      <input type="checkbox" id="potion-click-to-use" />
                      <label for="potion-click-to-use">Click Icon to Use Potion</label>
                    </div>
                    <div class="settings-subsection">
                      <h4 style="margin: 15px 0 10px 0; color: #a6adc8; font-size: 14px;">Individual Potion Hotkeys</h4>
                      <div class="input-container">
                        <label for="potion-hotkey-small">Small Stamina Potion</label>
                        <input type="text" id="potion-hotkey-small" placeholder="e.g. 1" maxlength="1" style="width: 60px; text-align: center;" />
                      </div>
                      <div class="input-container">
                        <label for="potion-hotkey-full">Full Stamina Potion</label>
                        <input type="text" id="potion-hotkey-full" placeholder="e.g. 2" maxlength="1" style="width: 60px; text-align: center;" />
                      </div>
                      <div class="input-container">
                        <label for="potion-hotkey-exp">Exp Potion S</label>
                        <input type="text" id="potion-hotkey-exp" placeholder="e.g. 3" maxlength="1" style="width: 60px; text-align: center;" />
                      </div>
                      <div class="input-container">
                        <label for="potion-hotkey-hp">Full Hp Potion</label>
                        <input type="text" id="potion-hotkey-hp" placeholder="e.g. 4" maxlength="1" style="width: 60px; text-align: center;" />
                      </div>
                      <div class="input-container">
                        <label for="potion-hotkey-mana_s">Mana Potion S</label>
                        <input type="text" id="potion-hotkey-mana_s" placeholder="e.g. 5" maxlength="1" style="width: 60px; text-align: center;" />
                      </div>
                      <div class="input-container">
                        <label for="potion-hotkey-mana_l">Mana Potion L</label>
                        <input type="text" id="potion-hotkey-mana_l" placeholder="e.g. 6" maxlength="1" style="width: 60px; text-align: center;" />
                      </div>
                    </div>
                    <div class="range-container">
                      <label for="potion-top-offset">Top Position</label>
                      <input type="range" id="potion-top-offset" min="10" max="80" step="5" value="28" />
                      <span id="potion-top-offset-value">28%</span>
                    </div>
                  </div>
                </div>

                <!-- Pet Teams Section -->
                <div class="settings-section">
                  <div class="settings-section-header" onclick="toggleSection(this)">
                    <h3>🐾 Pet Teams</h3>
                    <span class="expand-icon">+</span>
                  </div>
                  <div class="settings-section-content">
                    <p class="section-description">Configure pet team functionality and display options.</p>
                    <div class="checkbox-container">
                      <input type="checkbox" id="pet-teams-enabled" />
                      <label for="pet-teams-enabled">Enable Pet Teams</label>
                    </div>
                    <div class="checkbox-container">
                      <input type="checkbox" id="pet-teams-sidebar" />
                      <label for="pet-teams-sidebar">Show in Sidebar</label>
                    </div>
                    <div class="range-container">
                      <label for="pet-apply-delay">Apply Delay (ms)</label>
                      <input type="range" id="pet-apply-delay" min="100" max="1000" step="50" value="350" />
                      <span id="pet-apply-delay-value">350ms</span>
                    </div>
                  </div>
                </div>

                <!-- Loot Helper Section -->
                <div class="settings-section">
                  <div class="settings-section-header" onclick="toggleSection(this)">
                    <h3>🎁 Loot Helper</h3>
                    <span class="expand-icon">+</span>
                  </div>
                  <div class="settings-section-content">
                    <p class="section-description">Configure auto-loot functionality for quick looting from any page.</p>
                    <div class="checkbox-container">
                      <input type="checkbox" id="loot-helper-enabled" />
                      <label for="loot-helper-enabled">Enable Loot Helper</label>
                    </div>
                    <div class="checkbox-container">
                      <input type="checkbox" id="loot-helper-probability-pills" />
                      <label for="loot-helper-probability-pills">Show Loot Probability Pills</label>
                    </div>
                    <div class="checkbox-container">
                      <input type="checkbox" id="loot-helper-floating" />
                      <label for="loot-helper-floating">Show Floating Icons</label>
                    </div>
                    <div class="checkbox-container">
                      <input type="checkbox" id="loot-helper-sidebar" />
                      <label for="loot-helper-sidebar">Show in Sidebar</label>
                    </div>
                    <div class="range-container">
                      <label for="loot-top-offset">Top Position</label>
                      <input type="range" id="loot-top-offset" min="10" max="80" step="5" value="40" />
                      <span id="loot-top-offset-value">40%</span>
                    </div>
                    <div class="range-container">
                      <label for="loot-default-amount">Default Loot Amount</label>
                      <input type="range" id="loot-default-amount" min="1" max="10" step="1" value="1" />
                      <span id="loot-default-amount-value">1</span>
                    </div>
                    <div style="margin-top: 15px;">
                      <label style="color: #cdd6f4; margin-bottom: 8px; display: block;">Target Page Settings:</label>
                      <div style="display: flex; gap: 10px; margin-bottom: 8px;">
                        <div style="flex: 1;">
                          <label for="loot-target-event" style="font-size: 12px; color: #cdd6f4;">Event:</label>
                          <input type="number" id="loot-target-event" min="1" max="10" value="2" style="width: 100%; padding: 4px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; margin-top: 2px;" />
                        </div>
                        <div style="flex: 1;">
                          <label for="loot-target-wave" style="font-size: 12px; color: #cdd6f4;">Wave:</label>
                          <input type="number" id="loot-target-wave" min="1" max="50" value="6" style="width: 100%; padding: 4px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; margin-top: 2px;" />
                        </div>
                      </div>
                      <div style="font-size: 11px; color: #888; margin-top: 4px;">
                        These values are used when looting from a specific wave
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
                    <p class="section-description">Configure keyboard shortcuts for monster selection and battle attacks.</p>
                    <div class="checkbox-container">
                      <input type="checkbox" id="hotkeys-enabled" />
                      <label for="hotkeys-enabled">Enable Hotkeys</label>
                    </div>
                    <div class="checkbox-container">
                      <input type="checkbox" id="hotkeys-monster-selection" />
                      <label for="hotkeys-monster-selection">Enable Monster Selection (1-9 keys)</label>
                    </div>
                    <div class="checkbox-container">
                      <input type="checkbox" id="hotkeys-show-overlays" />
                      <label for="hotkeys-show-overlays">Show Hotkey Number Overlays on Monster Cards</label>
                    </div>
                    <div class="checkbox-container">
                      <input type="checkbox" id="hotkeys-battle-attacks" />
                      <label for="hotkeys-battle-attacks">Enable Battle Attacks (S,P,H,U,L keys)</label>
                    </div>
                    <div style="margin-top: 20px; padding: 15px; background: rgba(137, 180, 250, 0.1); border-radius: 8px; border: 1px solid rgba(137, 180, 250, 0.3);">
                      <h4 style="color: #89b4fa; margin: 0 0 15px 0; font-size: 14px;">🎯 Monster Selection Keys</h4>
                      <p style="color: #a6adc8; font-size: 12px; margin-bottom: 15px;">
                        Keys for selecting monsters on wave pages (1-9). Only joinable monsters are selectable.
                      </p>
                      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(60px, 1fr)); gap: 8px;">
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                          <label style="font-size: 11px; color: #cdd6f4;">Monster 1:</label>
                          <input type="text" id="monster-key-1" maxlength="1" style="width: 40px; padding: 4px; text-align: center; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;" />
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                          <label style="font-size: 11px; color: #cdd6f4;">Monster 2:</label>
                          <input type="text" id="monster-key-2" maxlength="1" style="width: 40px; padding: 4px; text-align: center; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;" />
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                          <label style="font-size: 11px; color: #cdd6f4;">Monster 3:</label>
                          <input type="text" id="monster-key-3" maxlength="1" style="width: 40px; padding: 4px; text-align: center; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;" />
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                          <label style="font-size: 11px; color: #cdd6f4;">Monster 4:</label>
                          <input type="text" id="monster-key-4" maxlength="1" style="width: 40px; padding: 4px; text-align: center; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;" />
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                          <label style="font-size: 11px; color: #cdd6f4;">Monster 5:</label>
                          <input type="text" id="monster-key-5" maxlength="1" style="width: 40px; padding: 4px; text-align: center; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;" />
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                          <label style="font-size: 11px; color: #cdd6f4;">Monster 6:</label>
                          <input type="text" id="monster-key-6" maxlength="1" style="width: 40px; padding: 4px; text-align: center; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;" />
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                          <label style="font-size: 11px; color: #cdd6f4;">Monster 7:</label>
                          <input type="text" id="monster-key-7" maxlength="1" style="width: 40px; padding: 4px; text-align: center; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;" />
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                          <label style="font-size: 11px; color: #cdd6f4;">Monster 8:</label>
                          <input type="text" id="monster-key-8" maxlength="1" style="width: 40px; padding: 4px; text-align: center; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;" />
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                          <label style="font-size: 11px; color: #cdd6f4;">Monster 9:</label>
                          <input type="text" id="monster-key-9" maxlength="1" style="width: 40px; padding: 4px; text-align: center; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;" />
                        </div>
                      </div>
                    </div>
                    <div style="margin-top: 20px; padding: 15px; background: rgba(249, 226, 175, 0.1); border-radius: 8px; border: 1px solid rgba(249, 226, 175, 0.3);">
                      <h4 style="color: #f9e2af; margin: 0 0 15px 0; font-size: 14px;">⚔️ Battle Attack Keys</h4>
                      <p style="color: #a6adc8; font-size: 12px; margin-bottom: 15px;">
                        Keys for triggering battle attacks in modal windows.
                      </p>
                      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 8px;">
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                          <label style="font-size: 11px; color: #cdd6f4;">Slash:</label>
                          <input type="text" id="attack-key-1" maxlength="1" style="width: 40px; padding: 4px; text-align: center; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;" />
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                          <label style="font-size: 11px; color: #cdd6f4;">Power Slash:</label>
                          <input type="text" id="attack-key-2" maxlength="1" style="width: 40px; padding: 4px; text-align: center; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;" />
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                          <label style="font-size: 11px; color: #cdd6f4;">Heroic Slash:</label>
                          <input type="text" id="attack-key-3" maxlength="1" style="width: 40px; padding: 4px; text-align: center; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;" />
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                          <label style="font-size: 11px; color: #cdd6f4;">Ultimate Slash:</label>
                          <input type="text" id="attack-key-4" maxlength="1" style="width: 40px; padding: 4px; text-align: center; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;" />
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                          <label style="font-size: 11px; color: #cdd6f4;">Legendary Slash:</label>
                          <input type="text" id="attack-key-5" maxlength="1" style="width: 40px; padding: 4px; text-align: center; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;" />
                        </div>
                      </div>
                    </div>
                    <div style="margin-top: 20px; padding: 15px; background: rgba(166, 227, 161, 0.1); border-radius: 8px; border: 1px solid rgba(166, 227, 161, 0.3);">
                      <h4 style="color: #a6e3a1; margin: 0 0 15px 0; font-size: 14px;">🎭 Class Skills</h4>
                      <p style="color: #a6adc8; font-size: 12px; margin-bottom: 15px;">
                        Keys for triggering class skills in battle modals.
                      </p>
                      <div class="checkbox-container" style="margin-bottom: 15px;">
                        <input type="checkbox" id="hotkeys-class-skills" />
                        <label for="hotkeys-class-skills">Enable Class Skills Hotkeys (Q,W,E,R,T keys)</label>
                      </div>
                      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 8px;">
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                          <label style="font-size: 11px; color: #cdd6f4;">Skill 1:</label>
                          <input type="text" id="class-skill-key-1" maxlength="1" style="width: 40px; padding: 4px; text-align: center; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;" />
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                          <label style="font-size: 11px; color: #cdd6f4;">Skill 2:</label>
                          <input type="text" id="class-skill-key-2" maxlength="1" style="width: 40px; padding: 4px; text-align: center; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;" />
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                          <label style="font-size: 11px; color: #cdd6f4;">Skill 3:</label>
                          <input type="text" id="class-skill-key-3" maxlength="1" style="width: 40px; padding: 4px; text-align: center; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;" />
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                          <label style="font-size: 11px; color: #cdd6f4;">Skill 4:</label>
                          <input type="text" id="class-skill-key-4" maxlength="1" style="width: 40px; padding: 4px; text-align: center; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;" />
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                          <label style="font-size: 11px; color: #cdd6f4;">Skill 5:</label>
                          <input type="text" id="class-skill-key-5" maxlength="1" style="width: 40px; padding: 4px; text-align: center; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;" />
                        </div>
                      </div>
                    </div>
                    <div style="margin-top: 15px; text-align: center;">
                      <button class="settings-button" id="reset-hotkeys" style="background: #f38ba8; margin-right: 10px;">
                        🔄 Reset to Defaults
                      </button>
                      <button class="settings-button" id="save-hotkeys" style="background: #a6e3a1;">
                        💾 Save Hotkeys
                      </button>
                    </div>
                  </div>
                </div>

                <!-- PvP Battle Features Section -->
                <div class="settings-section">
                  <div class="settings-section-header" onclick="toggleSection(this)">
                    <h3>⚔️ PvP Battle Features</h3>
                    <span class="expand-icon">+</span>
                  </div>
                  <div class="settings-section-content">
                    <p style="color: #a6adc8; font-size: 12px; margin-bottom: 20px;">
                      Configure battle prediction features for PvP battles.
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

                <!-- Battle Modals Section -->
                <div class="settings-section">
                  <div class="settings-section-header" onclick="toggleSection(this)">
                    <h3>🪟 Battle Modals</h3>
                    <span class="expand-icon">+</span>
                  </div>
                  <div class="settings-section-content">
                    <p style="color: #a6adc8; font-size: 12px; margin-bottom: 20px;">
                      Replace battle page navigation with modal windows for a seamless experience.
                    </p>
                    <label style="display: flex; align-items: center; gap: 10px; color: #cdd6f4; margin-bottom: 15px;">
                      <input type="checkbox" id="battle-modal-enabled" class="cyberpunk-checkbox">
                      <span>Enable battle modals</span>
                    </label>
                    
                    <div style="margin: 15px 0;">
                      <label style="display: flex; align-items: center; gap: 10px; color: #cdd6f4; margin-bottom: 10px;">
                        <input type="checkbox" id="battle-modal-auto-close" class="cyberpunk-checkbox">
                        <span>Auto-close when monster defeated</span>
                      </label>
                      <label style="display: flex; align-items: center; gap: 10px; color: #cdd6f4; margin-bottom: 10px;">
                        <input type="checkbox" id="battle-modal-show-loot" class="cyberpunk-checkbox">
                        <span>Show loot modal after looting</span>
                      </label>
                      <label style="display: flex; align-items: center; gap: 10px; color: #cdd6f4; margin-bottom: 10px;">
                        <input type="checkbox" id="battle-modal-show-logs" class="cyberpunk-checkbox">
                        <span>Show attack logs in battle</span>
                      </label>
                      <label style="display: flex; align-items: center; gap: 10px; color: #cdd6f4; margin-bottom: 10px;">
                        <input type="checkbox" id="battle-modal-show-leaderboard" class="cyberpunk-checkbox">
                        <span>Show leaderboard in battle</span>
                      </label>
                      <label style="display: flex; align-items: center; gap: 10px; color: #cdd6f4; margin-bottom: 10px;">
                        <input type="checkbox" id="battle-modal-backdrop" class="cyberpunk-checkbox">
                        <span>Click outside to close modal</span>
                      </label>
                      <div style="margin-top: 15px; padding: 10px; background: rgba(137, 180, 250, 0.1); border-radius: 6px; border: 1px solid rgba(137, 180, 250, 0.3);">
                        <label style="display: block; color: #89b4fa; font-weight: 500; margin-bottom: 8px;">Modal Zoom Scale:</label>
                        <div style="display: flex; align-items: center; gap: 10px;">
                          <input type="range" id="battle-modal-zoom-scale" min="0.5" max="2.0" step="0.1" 
                                 style="flex: 1; height: 6px; background: #45475a; border-radius: 3px; outline: none; -webkit-appearance: none;">
                          <span id="battle-modal-zoom-value" style="color: #cdd6f4; font-size: 12px; min-width: 35px; text-align: center;">100%</span>
                        </div>
                        <div style="margin-top: 5px; color: #6c7086; font-size: 11px;">
                          Adjust battle modal size (50% - 200%)
                        </div>
                      </div>
                      <div style="margin-top: 15px; padding: 10px; background: rgba(166, 227, 161, 0.1); border-radius: 6px; border: 1px solid rgba(166, 227, 161, 0.3);">
                        <label style="display: block; color: #a6e3a1; font-weight: 500; margin-bottom: 8px;">Attack Button Visibility:</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                          <label style="display: flex; align-items: center; gap: 5px; color: #cdd6f4; font-size: 12px;">
                            <input type="checkbox" id="battle-modal-show-slash" class="cyberpunk-checkbox">
                            <span>⚔️ Slash</span>
                          </label>
                          <label style="display: flex; align-items: center; gap: 5px; color: #cdd6f4; font-size: 12px;">
                            <input type="checkbox" id="battle-modal-show-power-slash" class="cyberpunk-checkbox">
                            <span>💥 Power Slash</span>
                          </label>
                          <label style="display: flex; align-items: center; gap: 5px; color: #cdd6f4; font-size: 12px;">
                            <input type="checkbox" id="battle-modal-show-heroic-slash" class="cyberpunk-checkbox">
                            <span>🔥 Heroic Slash</span>
                          </label>
                          <label style="display: flex; align-items: center; gap: 5px; color: #cdd6f4; font-size: 12px;">
                            <input type="checkbox" id="battle-modal-show-ultimate-slash" class="cyberpunk-checkbox">
                            <span>⚡ Ultimate Slash</span>
                          </label>
                          <label style="display: flex; align-items: center; gap: 5px; color: #cdd6f4; font-size: 12px;">
                            <input type="checkbox" id="battle-modal-show-legendary-slash" class="cyberpunk-checkbox">
                            <span>🌟 Legendary Slash</span>
                          </label>
                        </div>
                        <div style="margin-top: 5px; color: #6c7086; font-size: 11px;">
                          Choose which attack buttons to show in battle modals
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Gate Grakthar Wave Selection Section -->
                <div class="settings-section">
                  <div class="settings-section-header" onclick="toggleSection(this)">
                    <h3>🚪 Gate Grakthar Configuration</h3>
                    <span class="expand-icon">+</span>
                  </div>
                  <div class="settings-section-content">
                    <p style="color: #a6adc8; font-size: 12px; margin-bottom: 15px;">
                      Choose which wave the Gate Grakthar sidebar button redirects to.
                    </p>
                    <div style="margin: 15px 0;">
                      <label style="color: #f9e2af; margin-bottom: 10px; display: block;">Gate Grakthar Wave:</label>
                      <select id="gate-grakthar-wave" style="width: 250px; padding: 8px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px;">
                        <option value="3">Wave 1  - gate=3&wave=3</option>
                        <option value="5">Wave 2  - gate=3&wave=5</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Equipment Sets Configuration Section -->
                <div class="settings-section">
                  <div class="settings-section-header" onclick="toggleSection(this)">
                    <h3>⚡ Equipment Sets</h3>
                    <span class="expand-icon">+</span>
                  </div>
                  <div class="settings-section-content">
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

                <!-- Blacksmith Configuration Section -->
                  <div class="settings-section">
                      <div class="settings-section-header" onclick="toggleSection(this)">
                        <h3>🔨 Blacksmith</h3>
                        <span class="expand-icon">+</span>
                      </div>
                      <div class="settings-section-content">
                        <p style="color: #a6adc8; font-size: 12px; margin-bottom: 15px;">
                          Add options for blacksmith display in the sidebar.
                        </p>
                        <div style="margin: 15px 0;">
                          <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="blacksmith-show-uncraftable" class="cyberpunk-checkbox" />
                            <span style="color: #cdd6f4;">Show uncraftable recipes in the Blacksmith sidebar</span>
                          </label>
                        </div>
                      </div>
                  </div>

                <!-- Wave Auto-Refresh Section -->
                <div class="settings-section">
                  <div class="settings-section-header" onclick="toggleSection(this)">
                    <h3>🌊 Wave Auto-Refresh Settings</h3>
                    <span class="expand-icon">+</span>
                  </div>
                  <div class="settings-section-content">
                    <p style="color: #a6adc8; font-size: 12px; margin-bottom: 20px;">
                      Configure how often wave pages automatically refresh. Toggle on/off in the wave page filters.
                    </p>
                    
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding: 15px; background: rgba(137, 180, 250, 0.1); border: 1px solid rgba(137, 180, 250, 0.3); border-radius: 8px;">
                      <input type="checkbox" id="wave-refresh-enabled" class="cyberpunk-checkbox">
                      <label for="wave-refresh-enabled" style="color: #89b4fa; font-weight: 500; cursor: pointer;">
                        Enable Auto-Refresh
                      </label>
                      <span style="color: #a6adc8; font-size: 11px; margin-left: 10px;">
                        Automatically refresh wave pages at set intervals
                      </span>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding: 15px; background: rgba(243, 139, 168, 0.1); border: 1px solid rgba(243, 139, 168, 0.3); border-radius: 8px;">
                      <input type="checkbox" id="wave-refresh-hard" class="cyberpunk-checkbox">
                      <label for="wave-refresh-hard" style="color: #f38ba8; font-weight: 500; cursor: pointer;">
                        ⚡ Use Hard Refresh
                      </label>
                      <span style="color: #a6adc8; font-size: 11px; margin-left: 10px;">
                        Full page reload instead of soft refresh (slower but more reliable)
                      </span>
                    </div>
                    
                    <div style="background: rgba(49, 50, 68, 0.3); padding: 20px; border-radius: 8px; border-left: 3px solid #89b4fa;">
                      <h4 style="color: #89b4fa; margin: 0 0 15px 0; font-size: 14px;">⏱️ Refresh Timing</h4>
                      
                      <div style="display: flex; flex-direction: column; gap: 15px;">
                        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                          <label style="color: #f9e2af; font-weight: 500; min-width: 120px;">Refresh Every:</label>
                          <input type="number" 
                                 id="wave-refresh-time" 
                                 min="5" 
                                 max="600" 
                                 placeholder="10"
                                 style="width: 100px; padding: 8px 12px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 6px; text-align: center; font-size: 14px;">
                          <select id="wave-refresh-unit" 
                                  style="padding: 8px 12px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 6px; font-size: 14px;">
                            <option value="seconds">seconds</option>
                            <option value="minutes">minutes</option>
                          </select>
                        </div>
                        
                        
                        <div style="padding: 12px; background: rgba(137, 180, 250, 0.1); border: 1px solid rgba(137, 180, 250, 0.3); border-radius: 6px;">
                          <p style="color: #89b4fa; font-size: 12px; margin: 0; font-weight: 500;">
                            🔄 Toggle auto-refresh on/off directly in the wave page filter area
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Auto-Healing Section -->
                <div class="settings-section">
                  <div class="settings-section-header" onclick="toggleSection(this)">
                    <h3>💊 Auto-Healing</h3>
                    <span class="expand-icon">+</span>
                  </div>
                  <div class="settings-section-content">
                    <p class="section-description">Automatically use potions when HP or stamina drops below thresholds during battles.</p>
                    
                    <div style="margin-bottom: 20px; padding: 15px; background: rgba(166, 227, 161, 0.1); border: 1px solid rgba(166, 227, 161, 0.3); border-radius: 8px;">
                      <label style="display: flex; align-items: center; gap: 10px; color: #cdd6f4; margin-bottom: 15px;">
                        <input type="checkbox" id="auto-healing-enabled" class="cyberpunk-checkbox">
                        <span style="font-weight: 500;">Enable Auto-Healing</span>
                      </label>
                      <p style="color: #a6adc8; font-size: 12px; margin: 0;">
                        Automatically consume Full Stamina Potions when stamina drops below threshold and Full HP Potions when HP drops below threshold.
                      </p>
                    </div>
                    
                    <div style="background: rgba(49, 50, 68, 0.3); padding: 20px; border-radius: 8px; border-left: 3px solid #a6e3a1;">
                      <h4 style="color: #a6e3a1; margin: 0 0 15px 0; font-size: 14px;">🎯 Healing Thresholds</h4>
                      
                      <div style="display: flex; flex-direction: column; gap: 15px;">
                        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                          <label style="color: #f9e2af; font-weight: 500; min-width: 140px;">Stamina Threshold:</label>
                          <input type="number" 
                                 id="auto-healing-stamina-threshold" 
                                 min="1" 
                                 max="100" 
                                 placeholder="20"
                                 style="width: 80px; padding: 8px 12px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 6px; text-align: center; font-size: 14px;">
                          <span style="color: #a6adc8; font-size: 12px;">Use FSP when stamina drops to/below this %</span>
                        </div>
                        
                        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                          <label style="color: #f9e2af; font-weight: 500; min-width: 140px;">HP Threshold:</label>
                          <input type="number" 
                                 id="auto-healing-hp-threshold" 
                                 min="1" 
                                 max="100" 
                                 placeholder="25"
                                 style="width: 80px; padding: 8px 12px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 6px; text-align: center; font-size: 14px;">
                          <span style="color: #a6adc8; font-size: 12px;">Use Full HP Potion when HP drops to/below this %</span>
                        </div>
                        
                        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                          <label style="color: #f9e2af; font-weight: 500; min-width: 140px;">Delay Between Uses:</label>
                          <input type="range" 
                                 id="auto-healing-delay" 
                                 min="1000" 
                                 max="10000" 
                                 step="500" 
                                 value="3000"
                                 style="flex: 1; height: 6px; background: #45475a; border-radius: 3px; outline: none; -webkit-appearance: none;">
                          <span id="auto-healing-delay-value" style="color: #cdd6f4; font-size: 12px; min-width: 50px; text-align: center;">3.0s</span>
                        </div>
                      </div>
                      
                      <div style="margin-top: 15px; padding: 12px; background: rgba(249, 226, 175, 0.1); border: 1px solid rgba(249, 226, 175, 0.3); border-radius: 6px;">
                        <p style="color: #f9e2af; font-size: 12px; margin: 0; font-weight: 500;">
                          ⚠️ Auto-healing only works during active battles and requires potions in your inventory.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            

            <div style="text-align: center; margin-top: 30px; padding: 20px;">
              <button class="settings-button" data-action="close">Close</button>
              <button class="settings-button" data-action="reset">Reset to Default</button>
              <button class="settings-button" data-action="clear" style="background: #f38ba8;">Clear All Data</button>
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
    setupBattleModalSettings();
    setupNewWaveAutoRefreshSettings();
    setupGateGraktharSettings();
    setupBlacksmithSettings();
    setupEquipSetsSettings();
    setupSemiTransparentSettings();
    setupPotionHelperSettings();
    setupLootHelperSettings();
    setupPetTeamsSettings();
    setupHotkeysSettings();
    setupMenuCustomizationListeners();
    populateMenuItemsList();
    setupImageReplacementsSettings();
    setupPvPBattlePredictionSettings();
    setupUpdateCheckerSettings();
    setupAutoHpSettings();
    setupAutoStaminaSettings();

    // Initialize all cyberpunk checkboxes
    initializeAllCheckboxes();
    setupSettingsModalListeners();
  }

  modal.style.display = 'flex';
  populateMenuItemsList();

  // Apply semi-transparent effect to settings modal based on sidebar color
  applySemiTransparentEffect();

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeSettingsModal();
    }
  });
}

function closeSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function setupBlacksmithSettings() {
  const showUncraftableCheckbox = document.getElementById('blacksmith-show-uncraftable');
  if (!showUncraftableCheckbox) return;

  showUncraftableCheckbox.checked = !!extensionSettings.blacksmith.showUncraftable;
  updateCheckboxVisualState(showUncraftableCheckbox);
  showUncraftableCheckbox.addEventListener('change', (e) => {
    extensionSettings.blacksmith.showUncraftable = !!e.target.checked;
    saveSettings();
    // Refresh sidebar blacksmith items
    initBlacksmithSidebar();
    showNotification('Blacksmith setting updated', 'success');
  });
}

function setupColorSelectors() {
  // Sidebar color picker
  const sidebarColorInput = document.getElementById('sidebar-custom-color');
  if (sidebarColorInput) {
    sidebarColorInput.value = extensionSettings.sidebarColor;
    sidebarColorInput.addEventListener('change', () => {
      extensionSettings.sidebarColor = sidebarColorInput.value;
      saveSettings();
      applySettings();
    });
  }

  // Background color picker
  const backgroundColorInput = document.getElementById('background-custom-color');
  if (backgroundColorInput) {
    backgroundColorInput.value = extensionSettings.backgroundColor;
    backgroundColorInput.addEventListener('change', () => {
      extensionSettings.backgroundColor = backgroundColorInput.value;
      saveSettings();
      applySettings();
    });
  }

  // Monster image outline color picker
  const monsterImageColorInput = document.getElementById('monster-image-custom-color');
  if (monsterImageColorInput) {
    monsterImageColorInput.value = extensionSettings.monsterImageOutlineColor;
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
    header.addEventListener('click', function () {
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
    });
  }

  // Reset button
  const resetBtn = document.getElementById('reset-menu-customization');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      // Reset to default menu items
      extensionSettings.menuItems = [
        { id: 'battle_pass', name: 'Battle Pass', visible: true, order: 3 },
        { id: 'pvp', name: 'PvP Arena', visible: true, order: 4 },
        { id: 'gate_grakthar', name: 'Gate Grakthar', visible: true, order: 5 },
        { id: 'inventory_quick', name: 'Inventory', visible: true, order: 6 },
        { id: 'pets', name: 'Pets & Eggs', visible: true, order: 7 },
        { id: 'guild', name: 'Guild', visible: true, order: 8 },
        { id: 'stats', name: 'Stats', visible: true, order: 9 },
        { id: 'blacksmith', name: 'Blacksmith', visible: true, order: 10 },
        { id: 'legendary_forge', name: 'Legendary Forge', visible: true, order: 11 },
        { id: 'merchant', name: 'Merchant', visible: true, order: 12 },
        { id: 'achievements', name: 'Achievements', visible: true, order: 13 },
        { id: 'collections', name: 'Collections', visible: true, order: 14 },
        { id: 'guide', name: 'How To Play', visible: true, order: 15 },
        { id: 'leaderboard', name: 'Weekly Leaderboard', visible: true, order: 16 },
        { id: 'chat', name: 'Global Chat', visible: true, order: 17 }
      ];

      saveSettings();
      populateMenuItemsList();
      showNotification('Menu customization reset to default', 'success');
    });
  }

  // Apply button
  const applyBtn = document.getElementById('apply-menu-customization');
  if (applyBtn) {
    applyBtn.addEventListener('click', function () {
      saveSettings();
      refreshSidebar();
      showNotification('Menu customization applied!', 'success');
    });
  }
}

function setupImageReplacementsSettings() {
  // Populate existing image replacements
  populateImageReplacementInputs();

  // Use event delegation for the add button and remove buttons
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'add-image-replacement') {
      e.preventDefault();
      addImageReplacementInput();
    } else if (e.target && e.target.getAttribute('data-action') === 'remove-image-replacement') {
      e.preventDefault();
      removeImageReplacementInput(e.target);
    }
  });
}

function populateImageReplacementInputs() {
  const container = document.getElementById('image-replacements-container');
  if (!container) return;

  container.innerHTML = '';

  // Ensure imageReplacements object exists
  if (!extensionSettings.imageReplacements) {
    extensionSettings.imageReplacements = [];
  }

  extensionSettings.imageReplacements.forEach((replacement, index) => {
    addImageReplacementInput(replacement.original, replacement.custom, index);
  });
}

function addImageReplacementInput(original = '', custom = '', index = null) {
  const container = document.getElementById('image-replacements-container');
  if (!container) return;

  const inputIndex = index !== null ? index : extensionSettings.imageReplacements.length;

  const inputDiv = document.createElement('div');
  inputDiv.style.cssText = 'display: flex; gap: 8px; margin-bottom: 10px; align-items: center;';
  inputDiv.innerHTML = `
      <input type="text" placeholder="Original Image URL" 
             value="${original}" 
             style="width: 200px; padding: 6px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;"
             class="image-original-input">
      <input type="url" placeholder="Custom Image URL" 
             value="${custom}" 
             style="width: 200px; padding: 6px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; font-size: 12px;"
             class="image-custom-input">
      <button class="settings-button" style="background: #f38ba8; padding: 6px 10px; font-size: 12px; min-width: 40px;" data-action="remove-image-replacement">
        🗑️
      </button>
    `;

  container.appendChild(inputDiv);

  // Add input event listeners for real-time updates
  const originalInput = inputDiv.querySelector('.image-original-input');
  const customInput = inputDiv.querySelector('.image-custom-input');

  function updateImageReplacements() {
    const newOriginal = originalInput.value.trim();
    const newCustom = customInput.value.trim();

    if (index !== null && index < extensionSettings.imageReplacements.length) {
      // Update existing
      if (newOriginal && newCustom) {
        extensionSettings.imageReplacements[index] = { original: newOriginal, custom: newCustom };
      } else {
        // Remove if empty
        extensionSettings.imageReplacements.splice(index, 1);
      }
    } else if (newOriginal && newCustom) {
      // Add new
      extensionSettings.imageReplacements.push({ original: newOriginal, custom: newCustom });
    }

    saveSettings();
    applyImageReplacements();
  }

  originalInput.addEventListener('blur', updateImageReplacements);
  customInput.addEventListener('blur', updateImageReplacements);
}

function removeImageReplacementInput(button) {
  const inputDiv = button.closest('div');
  const container = document.getElementById('image-replacements-container');
  if (!container) return;

  const index = Array.from(container.children).indexOf(inputDiv);
  if (index >= 0 && index < extensionSettings.imageReplacements.length) {
    extensionSettings.imageReplacements.splice(index, 1);
    saveSettings();
    applyImageReplacements();
  }

  inputDiv.remove();
}

function applyImageReplacements() {
  // Remove existing image replacement styles
  const existingStyles = document.querySelectorAll('style[data-image-replacement]');
  existingStyles.forEach(style => style.remove());

  if (!extensionSettings.imageReplacements || extensionSettings.imageReplacements.length === 0) {
    return;
  }

  // Create CSS for image replacements
  let css = '';
  extensionSettings.imageReplacements.forEach((replacement, index) => {
    if (replacement.original && replacement.custom) {
      // Escape URLs for CSS
      const escapedOriginal = replacement.original.replace(/'/g, "\\'");
      const escapedCustom = replacement.custom.replace(/'/g, "\\'");
      css += `
          img[src*="${escapedOriginal}"] {
            content: url('${escapedCustom}') !important;
          }
        `;
    }
  });

  if (css) {
    const style = document.createElement('style');
    style.setAttribute('data-image-replacement', 'true');
    style.textContent = css;
    document.head.appendChild(style);
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
      updateSidebarEquipSetsSection();
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
      updateSidebarEquipSetsSection();
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

  // Setup Lizard theme removal toggle
  const removeLizardCheckbox = document.getElementById('remove-lizard-theme');
  if (removeLizardCheckbox) {
    removeLizardCheckbox.checked = !!extensionSettings.customBackgrounds.removeLizardTheme;
    updateCheckboxVisualState(removeLizardCheckbox);
    removeLizardCheckbox.addEventListener('change', (e) => {
      extensionSettings.customBackgrounds.removeLizardTheme = !!e.target.checked;
      saveSettings();
      if (extensionSettings.customBackgrounds.removeLizardTheme) {
        removeLizardThemeFromPage();
        // Turn on observer to auto-remove any newly-injected lizard styles
        ensureLizardObserver(true);
        showNotification('Lizard theme removed from this page', 'success');
      } else {
        // Turn off observer and restore by reloading the page
        ensureLizardObserver(false);
        showNotification('Reloading page to restore theme', 'info');
        setTimeout(() => location.reload(), 600);
      }
    });
  }

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
        <button class="settings-button" style="background: #f38ba8; padding: 6px 10px; font-size: 12px; min-width: 40px;" data-action="remove-custom-bg">
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



function setupGateGraktharSettings() {
  const gateWaveSelect = document.getElementById('gate-grakthar-wave');

  if (gateWaveSelect) {
    gateWaveSelect.value = extensionSettings.gateGraktharWave;
    gateWaveSelect.addEventListener('change', (e) => {
      extensionSettings.gateGraktharWave = parseInt(e.target.value);
      saveSettings();
      // Regenerate sidebar to apply new wave setting
      generateSideBar();
      showNotification('Gate Grakthar wave updated!', 'success');
    });

    // Try to populate the select with dynamic values by fetching gate page
    (async () => {
      try {
        const opts = await fetchGateWaves(3);
        if (!opts || !opts.length) return;
        // Clear existing options and add from fetched list
        gateWaveSelect.innerHTML = '';
        opts.forEach(opt => {
          const o = document.createElement('option');
          o.value = opt.value;
          o.textContent = opt.label;
          gateWaveSelect.appendChild(o);
        });
        // Restore selected value
        gateWaveSelect.value = extensionSettings.gateGraktharWave;
      } catch (e) {
        console.warn('Failed to fetch gate waves', e);
      }
    })();
  }
}

async function fetchGateWaves(gate = 3) {
  try {
    // Use a stable URL (include a default wave parameter) to ensure the server returns waves nav
    const selectedWave = extensionSettings.gateGraktharWave || 3;
    const fetchUrl = `active_wave.php?gate=${encodeURIComponent(gate)}&wave=${encodeURIComponent(selectedWave)}`;

    // Use session cache for a short TTL (1 hour)
    try {
      const cacheKey = `gateWaves_${gate}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.items && (Date.now() - parsed.timestamp) < (1000 * 60 * 60)) {
          return parsed.items;
        }
      }
    } catch (e) {
      // ignore cache errors
    }
    const resp = await fetch(fetchUrl, { credentials: 'same-origin' });
    if (!resp.ok) return [];
    const html = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    // Find .waves-nav -> wave anchors (relative href is common: ?gate=3&wave=3)
    const anchors = Array.from(doc.querySelectorAll('.waves-nav a.wave-chip, .waves-nav a'));
    const result = anchors.map(a => {
      const href = a.getAttribute('href') || '';
      const match = href.match(/(?:wave=)(\d+)/);
      const value = match ? match[1] : null;
      // Use anchor text (e.g., 'Wave 1') or fallback to 'Wave <n>' if empty
      const anchorText = (a.textContent || '').trim();
      const label = anchorText || (value ? `Wave ${value}` : href);
      return value ? { value: value, label: label } : null;
    }).filter(x => !!x);

    // Remove duplicates by value
    const uniq = [];
    const seen = new Set();
    for (const r of result) {
      if (!seen.has(r.value)) { seen.add(r.value); uniq.push(r); }
    }
    // If nothing was found, attempt a fallback: parse anchor text for 'Wave N'
    if (uniq.length === 0) {
      const fallbackAnchors = Array.from(doc.querySelectorAll('a[onclick*="wave="]'));
      fallbackAnchors.forEach(a => {
        const href = a.getAttribute('onclick') || '';
        const match = href.match(/wave=(\d+)/);
        if (match && !seen.has(match[1])) {
          seen.add(match[1]);
          uniq.push({ value: match[1], label: (a.textContent || `Wave ${match[1]}`).trim() });
        }
      });
    }
    try {
      sessionStorage.setItem(`gateWaves_${gate}`, JSON.stringify({ timestamp: Date.now(), items: uniq }));
    } catch (e) {
      // ignore set errors
    }
    return uniq;
  } catch (e) {
    console.error('fetchGateWaves error:', e);
    return [];
  }
}

function setupBattleModalSettings() {
  // Get battle modal setting elements
  const enabledCheckbox = document.getElementById('battle-modal-enabled');
  const autoCloseCheckbox = document.getElementById('battle-modal-auto-close');
  const showLootCheckbox = document.getElementById('battle-modal-show-loot');
  const showLogsCheckbox = document.getElementById('battle-modal-show-logs');
  const showLeaderboardCheckbox = document.getElementById('battle-modal-show-leaderboard');
  const zoomScaleSlider = document.getElementById('battle-modal-zoom-scale');
  const zoomValueSpan = document.getElementById('battle-modal-zoom-value');

  // Attack button visibility checkboxes
  const showSlashCheckbox = document.getElementById('battle-modal-show-slash');
  const showPowerSlashCheckbox = document.getElementById('battle-modal-show-power-slash');
  const showHeroicSlashCheckbox = document.getElementById('battle-modal-show-heroic-slash');
  const showUltimateSlashCheckbox = document.getElementById('battle-modal-show-ultimate-slash');
  const showLegendarySlashCheckbox = document.getElementById('battle-modal-show-legendary-slash');
  const modalBackdropCheckbox = document.getElementById('battle-modal-backdrop');

  if (!enabledCheckbox) {
    console.log('Battle modal settings elements not found');
    return;
  }

  // Set initial values
  enabledCheckbox.checked = extensionSettings.battleModal.enabled;
  autoCloseCheckbox.checked = extensionSettings.battleModal.autoClose;
  showLootCheckbox.checked = extensionSettings.battleModal.showLootModal;
  showLogsCheckbox.checked = extensionSettings.battleModal.showAttackLogs;
  showLeaderboardCheckbox.checked = extensionSettings.battleModal.showLeaderboard;
  modalBackdropCheckbox.checked = extensionSettings.battleModal.modalBackdrop;

  // Set attack button visibility initial values
  if (showSlashCheckbox) showSlashCheckbox.checked = extensionSettings.battleModal.showSlash;
  if (showPowerSlashCheckbox) showPowerSlashCheckbox.checked = extensionSettings.battleModal.showPowerSlash;
  if (showHeroicSlashCheckbox) showHeroicSlashCheckbox.checked = extensionSettings.battleModal.showHeroicSlash;
  if (showUltimateSlashCheckbox) showUltimateSlashCheckbox.checked = extensionSettings.battleModal.showUltimateSlash;
  if (showLegendarySlashCheckbox) showLegendarySlashCheckbox.checked = extensionSettings.battleModal.showLegendarySlash;

  // Set zoom scale slider initial value
  if (zoomScaleSlider && zoomValueSpan) {
    zoomScaleSlider.value = extensionSettings.battleModal.zoomScale || 1.0;
    zoomValueSpan.textContent = Math.round((extensionSettings.battleModal.zoomScale || 1.0) * 100) + '%';
  }

  // Add event listeners
  enabledCheckbox.addEventListener('change', (e) => {
    extensionSettings.battleModal.enabled = e.target.checked;
    saveSettings();

    // Initialize user data when battle modal is enabled
    if (e.target.checked) {
      initUserData();
      showNotification('Battle modals enabled! Join battles to see them in modal windows.', '#a6e3a1');
    } else {
      showNotification('Battle modals disabled. Battles will use normal page navigation.', '#f38ba8');
    }
  });

  autoCloseCheckbox.addEventListener('change', (e) => {
    extensionSettings.battleModal.autoClose = e.target.checked;
    saveSettings();
  });

  showLootCheckbox.addEventListener('change', (e) => {
    extensionSettings.battleModal.showLootModal = e.target.checked;
    saveSettings();
  });

  showLogsCheckbox.addEventListener('change', (e) => {
    extensionSettings.battleModal.showAttackLogs = e.target.checked;
    saveSettings();
  });

  showLeaderboardCheckbox.addEventListener('change', (e) => {
    extensionSettings.battleModal.showLeaderboard = e.target.checked;
    saveSettings();
  });

  modalBackdropCheckbox.addEventListener('change', (e) => {
    extensionSettings.battleModal.modalBackdrop = e.target.checked;
    saveSettings();
  });

  // Attack button visibility event listeners
  if (showSlashCheckbox) {
    showSlashCheckbox.addEventListener('change', (e) => {
      extensionSettings.battleModal.showSlash = e.target.checked;
      saveSettings();
    });
  }

  if (showPowerSlashCheckbox) {
    showPowerSlashCheckbox.addEventListener('change', (e) => {
      extensionSettings.battleModal.showPowerSlash = e.target.checked;
      saveSettings();
    });
  }

  if (showHeroicSlashCheckbox) {
    showHeroicSlashCheckbox.addEventListener('change', (e) => {
      extensionSettings.battleModal.showHeroicSlash = e.target.checked;
      saveSettings();
    });
  }

  if (showUltimateSlashCheckbox) {
    showUltimateSlashCheckbox.addEventListener('change', (e) => {
      extensionSettings.battleModal.showUltimateSlash = e.target.checked;
      saveSettings();
    });
  }

  if (showLegendarySlashCheckbox) {
    showLegendarySlashCheckbox.addEventListener('change', (e) => {
      extensionSettings.battleModal.showLegendarySlash = e.target.checked;
      saveSettings();
    });
  }

  // Add zoom scale slider event listener
  if (zoomScaleSlider && zoomValueSpan) {
    zoomScaleSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      extensionSettings.battleModal.zoomScale = value;
      zoomValueSpan.textContent = Math.round(value * 100) + '%';
      saveSettings();

      // Apply zoom scale immediately to any open battle modals
      const battleModal = document.getElementById('battle-modal');
      if (battleModal) {
        const modalContent = battleModal.querySelector('.modal-content');
        if (modalContent) {
          modalContent.style.transform = `scale(${value})`;
        }
      }
    });
  }
}

function setupPvPBattlePredictionSettings() {
  const enabledCheckbox = document.getElementById('pvp-prediction-enabled');
  const analyzeAfterSelect = document.getElementById('pvp-analyze-after');

  if (enabledCheckbox) {
    enabledCheckbox.checked = extensionSettings.pvpBattlePrediction.enabled;
    enabledCheckbox.addEventListener('change', (e) => {
      extensionSettings.pvpBattlePrediction.enabled = e.target.checked;
      saveSettings();
      showNotification('PvP battle prediction ' + (e.target.checked ? 'enabled' : 'disabled'), 'success');
    });
  }

  if (analyzeAfterSelect) {
    analyzeAfterSelect.value = extensionSettings.pvpBattlePrediction.analyzeAfterAttacks;
    analyzeAfterSelect.addEventListener('change', (e) => {
      extensionSettings.pvpBattlePrediction.analyzeAfterAttacks = parseInt(e.target.value);
      saveSettings();
      showNotification('PvP analysis start updated!', 'success');
    });
  }
}

function setupNewWaveAutoRefreshSettings() {
  const enabledCheckbox = document.getElementById('wave-refresh-enabled');
  const hardRefreshCheckbox = document.getElementById('wave-refresh-hard');
  const timeInput = document.getElementById('wave-refresh-time');
  const unitSelect = document.getElementById('wave-refresh-unit');

  if (!timeInput || !unitSelect) {
    console.log('Wave auto-refresh inputs not found');
    return;
  }

  console.log('Setting up new wave auto-refresh, current interval:', extensionSettings.waveAutoRefresh.interval, 'seconds');

  // Initialize enabled checkbox
  if (enabledCheckbox) {
    enabledCheckbox.checked = extensionSettings.waveAutoRefresh.enabled;
    enabledCheckbox.addEventListener('change', (e) => {
      extensionSettings.waveAutoRefresh.enabled = e.target.checked;
      saveSettings();

      if (e.target.checked) {
        // Start auto-refresh if on wave page
        initWaveAutoRefresh();
        showNotification('Wave auto-refresh enabled!', 'success');
      } else {
        // Stop auto-refresh
        stopWaveAutoRefresh();
        showNotification('Wave auto-refresh disabled!', 'info');
      }
    });
  }

  // Initialize hard refresh checkbox
  if (hardRefreshCheckbox) {
    hardRefreshCheckbox.checked = extensionSettings.waveAutoRefresh.useHardRefresh || false;
    hardRefreshCheckbox.addEventListener('change', (e) => {
      extensionSettings.waveAutoRefresh.useHardRefresh = e.target.checked;
      saveSettings();

      showNotification(
        e.target.checked ?
          'Using hard refresh (full reload)' :
          'Using soft refresh (fast update)',
        'success'
      );

      // Restart auto-refresh with new setting if currently enabled
      if (extensionSettings.waveAutoRefresh.enabled) {
        stopWaveAutoRefresh();
        setTimeout(() => {
          initWaveAutoRefresh();
        }, 200);
      }
    });
  }

  // Initialize display values based on current setting
  initializeWaveRefreshDisplay();

  // Add event handlers
  timeInput.addEventListener('input', handleWaveRefreshTimeChange);
  timeInput.addEventListener('change', handleWaveRefreshTimeChange);
  timeInput.addEventListener('blur', handleWaveRefreshTimeChange);
  unitSelect.addEventListener('change', handleWaveRefreshUnitChange);

  function initializeWaveRefreshDisplay() {
    const currentSeconds = extensionSettings.waveAutoRefresh.interval || 10;

    if (currentSeconds >= 60 && currentSeconds % 60 === 0) {
      // Display in minutes if it's a whole minute value
      timeInput.value = currentSeconds / 60;
      unitSelect.value = 'minutes';
    } else {
      // Display in seconds
      timeInput.value = currentSeconds;
      unitSelect.value = 'seconds';
    }

    console.log('Initialized wave refresh display:', timeInput.value, unitSelect.value);
  }

  function handleWaveRefreshTimeChange() {
    const time = parseInt(timeInput.value) || 10;
    const unit = unitSelect.value;
    let seconds;

    if (unit === 'minutes') {
      // Convert minutes to seconds, limit 1-10 minutes
      const minutes = Math.max(1, Math.min(10, time));
      timeInput.value = minutes;
      seconds = minutes * 60;
    } else {
      // Keep in seconds, limit 5-600 seconds
      const secs = Math.max(5, Math.min(600, time));
      timeInput.value = secs;
      seconds = secs;
    }

    // Update settings
    extensionSettings.waveAutoRefresh.interval = seconds;
    saveSettings();

    console.log('Wave refresh timing updated:', seconds, 'seconds');

    // Restart auto-refresh if currently running
    if (extensionSettings.waveAutoRefresh.enabled) {
      stopWaveAutoRefresh();
      setTimeout(() => {
        initWaveAutoRefresh();
      }, 200);
    }
  }

  function handleWaveRefreshUnitChange() {
    const currentTime = parseInt(timeInput.value) || 10;
    const newUnit = unitSelect.value;

    if (newUnit === 'minutes') {
      // Convert seconds to minutes
      const minutes = Math.max(1, Math.min(10, Math.round(currentTime / 60) || 1));
      timeInput.value = minutes;
      timeInput.min = '1';
      timeInput.max = '10';
    } else {
      // Convert minutes to seconds or keep seconds
      const seconds = unitSelect.value === 'seconds' ?
        Math.max(5, Math.min(600, currentTime)) :
        Math.max(5, Math.min(600, currentTime * 60));
      timeInput.value = seconds;
      timeInput.min = '5';
      timeInput.max = '600';
    }

    // Trigger the change handler to save
    handleWaveRefreshTimeChange();
  }
}

function setupEquipSetsSettings() {
  const enabledCheckbox = document.getElementById('equip-sets-enabled');
  const delayInput = document.getElementById('equip-sets-delay');
  // sidebarCheckbox removed - equip sets always visible in Inventory Quick Access
  const sidebarCheckbox = null;

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

  // no side toggle: always visible
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

function setupSemiTransparentSettings() {
  const enabledCheckbox = document.getElementById('semi-transparent-enabled');
  const opacitySlider = document.getElementById('semi-transparent-opacity');
  const opacityValue = document.getElementById('semi-transparent-opacity-value');

  if (enabledCheckbox) {
    enabledCheckbox.checked = extensionSettings.semiTransparent.enabled;
    enabledCheckbox.addEventListener('change', (e) => {
      extensionSettings.semiTransparent.enabled = e.target.checked;

      saveSettings();
      applySettings(); // Apply all settings immediately
      showNotification('Semi-transparent sidebar ' + (e.target.checked ? 'enabled' : 'disabled'), 'success');
    });
  }

  if (opacitySlider && opacityValue) {
    opacitySlider.value = extensionSettings.semiTransparent.opacity;
    opacityValue.textContent = extensionSettings.semiTransparent.opacity;
    opacitySlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      extensionSettings.semiTransparent.opacity = value;
      opacityValue.textContent = value;
      saveSettings();
      applySettings(); // Apply all settings immediately
    });
  }
}

function setupPotionHelperSettings() {
  const enabledCheckbox = document.getElementById('potion-helper-enabled');
  const floatingCheckbox = document.getElementById('potion-floating-icons');
  const clickToUseCheckbox = document.getElementById('potion-click-to-use');
  const smallHotkeyInput = document.getElementById('potion-hotkey-small');
  const fullHotkeyInput = document.getElementById('potion-hotkey-full');
  const expHotkeyInput = document.getElementById('potion-hotkey-exp');
  const hpHotkeyInput = document.getElementById('potion-hotkey-hp');
  const manaSHotkeyInput = document.getElementById('potion-hotkey-mana_s');
  const manaLHotkeyInput = document.getElementById('potion-hotkey-mana_l');
  const topOffsetSlider = document.getElementById('potion-top-offset');
  const topOffsetValue = document.getElementById('potion-top-offset-value');

  if (enabledCheckbox) {
    enabledCheckbox.checked = extensionSettings.potionHelper.enabled;
    enabledCheckbox.addEventListener('change', (e) => {
      extensionSettings.potionHelper.enabled = e.target.checked;
      saveSettings();
      if (e.target.checked) {
        initFloatingPotionHelper();
      } else {
        const container = document.getElementById('potion-container');
        if (container) container.remove();
      }
      showNotification('Potion helper ' + (e.target.checked ? 'enabled' : 'disabled'), 'success');
    });
  }

  if (floatingCheckbox) {
    floatingCheckbox.checked = extensionSettings.potionHelper.showFloatingIcons;
    floatingCheckbox.addEventListener('change', (e) => {
      extensionSettings.potionHelper.showFloatingIcons = e.target.checked;
      saveSettings();
      initFloatingPotionHelper();
      showNotification('Floating icons ' + (e.target.checked ? 'enabled' : 'disabled'), 'success');
    });
  }

  if (clickToUseCheckbox) {
    clickToUseCheckbox.checked = extensionSettings.potionHelper.clickToUse;
    clickToUseCheckbox.addEventListener('change', (e) => {
      extensionSettings.potionHelper.clickToUse = e.target.checked;
      saveSettings();
      initFloatingPotionHelper(); // Refresh to update click handlers
      showNotification('Click to use ' + (e.target.checked ? 'enabled' : 'disabled'), 'success');
    });
  }

  // Individual hotkey inputs
  if (smallHotkeyInput) {
    smallHotkeyInput.value = extensionSettings.potionHelper.hotkeys.small || '';
    smallHotkeyInput.addEventListener('input', (e) => {
      const key = e.target.value.toLowerCase();
      extensionSettings.potionHelper.hotkeys.small = key;
      saveSettings();
      setupPotionHotkeys();
      showNotification(`Small Stamina Potion hotkey: ${key || 'none'}`, 'success');
    });
  }

  if (fullHotkeyInput) {
    fullHotkeyInput.value = extensionSettings.potionHelper.hotkeys.full || '';
    fullHotkeyInput.addEventListener('input', (e) => {
      const key = e.target.value.toLowerCase();
      extensionSettings.potionHelper.hotkeys.full = key;
      saveSettings();
      setupPotionHotkeys();
      showNotification(`Full Stamina Potion hotkey: ${key || 'none'}`, 'success');
    });
  }

  if (expHotkeyInput) {
    expHotkeyInput.value = extensionSettings.potionHelper.hotkeys.exp || '';
    expHotkeyInput.addEventListener('input', (e) => {
      const key = e.target.value.toLowerCase();
      extensionSettings.potionHelper.hotkeys.exp = key;
      saveSettings();
      setupPotionHotkeys();
      showNotification(`Exp Potion S hotkey: ${key || 'none'}`, 'success');
    });
  }

  if (hpHotkeyInput) {
    hpHotkeyInput.value = extensionSettings.potionHelper.hotkeys.hp || '';
    hpHotkeyInput.addEventListener('input', (e) => {
      const key = e.target.value.toLowerCase();
      extensionSettings.potionHelper.hotkeys.hp = key;
      saveSettings();
      setupPotionHotkeys();
      showNotification(`Full Hp Potion hotkey: ${key || 'none'}`, 'success');
    });
  }

  if (manaSHotkeyInput) {
    manaSHotkeyInput.value = extensionSettings.potionHelper.hotkeys.mana_s || '';
    manaSHotkeyInput.addEventListener('input', (e) => {
      const key = e.target.value.toLowerCase();
      extensionSettings.potionHelper.hotkeys.mana_s = key;
      saveSettings();
      setupPotionHotkeys();
      showNotification(`Mana Potion S hotkey: ${key || 'none'}`, 'success');
    });
  }

  if (manaLHotkeyInput) {
    manaLHotkeyInput.value = extensionSettings.potionHelper.hotkeys.mana_l || '';
    manaLHotkeyInput.addEventListener('input', (e) => {
      const key = e.target.value.toLowerCase();
      extensionSettings.potionHelper.hotkeys.mana_l = key;
      saveSettings();
      setupPotionHotkeys();
      showNotification(`Mana Potion L hotkey: ${key || 'none'}`, 'success');
    });
  }

  if (topOffsetSlider && topOffsetValue) {
    const topOffsetStr = String(extensionSettings.potionHelper.topOffset || '28%');
    const currentValue = parseInt(topOffsetStr.replace('%', ''));
    topOffsetSlider.value = currentValue;
    topOffsetValue.textContent = currentValue + '%';
    topOffsetSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      extensionSettings.potionHelper.topOffset = value + '%';
      topOffsetValue.textContent = value + '%';
      saveSettings();
      initFloatingPotionHelper();
    });
  }
}

function setupLootHelperSettings() {
  const enabledCheckbox = document.getElementById('loot-helper-enabled');
  const floatingCheckbox = document.getElementById('loot-helper-floating');
  const sidebarCheckbox = document.getElementById('loot-helper-sidebar');
  const defaultAmountSlider = document.getElementById('loot-default-amount');
  const defaultAmountValue = document.getElementById('loot-default-amount-value');
  const topOffsetSlider = document.getElementById('loot-top-offset');
  const topOffsetValue = document.getElementById('loot-top-offset-value');
  const targetEventInput = document.getElementById('loot-target-event');
  const targetWaveInput = document.getElementById('loot-target-wave');

  if (enabledCheckbox) {
    enabledCheckbox.checked = extensionSettings.lootHelper.enabled;
    enabledCheckbox.addEventListener('change', (e) => {
      extensionSettings.lootHelper.enabled = e.target.checked;
      saveSettings();
      if (e.target.checked) {
        initFloatingLootHelper();
      } else {
        const container = document.getElementById('loot-container');
        if (container) container.remove();
      }
      showNotification('Loot helper ' + (e.target.checked ? 'enabled' : 'disabled'), 'success');
    });
  }

  const probabilityPillsCheckbox = document.getElementById('loot-helper-probability-pills');
  if (probabilityPillsCheckbox) {
    probabilityPillsCheckbox.checked = extensionSettings.lootHelper.showLootProbabilityPills;
    probabilityPillsCheckbox.addEventListener('change', (e) => {
      extensionSettings.lootHelper.showLootProbabilityPills = e.target.checked;
      saveSettings();
      if (!e.target.checked) {
        // Remove existing pills if disabled
        document.querySelectorAll('.loot-probability-pill').forEach(el => el.remove());
        document.querySelectorAll('.loot-pills-container').forEach(el => el.remove());
        // Reset processed flag so they can be re-added if enabled again
        document.querySelectorAll('.monster-card[data-loot-pills-added="true"]').forEach(el => {
          delete el.dataset.lootPillsAdded;
        });
      } else {
        // Re-add pills if enabled (might need page refresh or re-trigger)
        addLootProbabilityPills();
      }
      showNotification('Loot probability pills ' + (e.target.checked ? 'enabled' : 'disabled'), 'success');
    });
  }

  if (floatingCheckbox) {
    floatingCheckbox.checked = extensionSettings.lootHelper.showFloatingIcons;
    floatingCheckbox.addEventListener('change', (e) => {
      extensionSettings.lootHelper.showFloatingIcons = e.target.checked;
      saveSettings();
      initFloatingLootHelper();
      showNotification('Floating loot helper ' + (e.target.checked ? 'enabled' : 'disabled'), 'success');
    });
  }

  if (sidebarCheckbox) {
    sidebarCheckbox.checked = extensionSettings.lootHelper.showInSidebar;
    sidebarCheckbox.addEventListener('change', (e) => {
      extensionSettings.lootHelper.showInSidebar = e.target.checked;
      saveSettings();
      refreshSidebar();
      showNotification('Sidebar loot helper ' + (e.target.checked ? 'enabled' : 'disabled'), 'success');
    });
  }

  if (topOffsetSlider && topOffsetValue) {
    const topOffsetStr = String(extensionSettings.lootHelper.topOffset || '40%');
    const currentValue = parseInt(topOffsetStr.replace('%', ''));
    topOffsetSlider.value = currentValue;
    topOffsetValue.textContent = currentValue + '%';
    topOffsetSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      extensionSettings.lootHelper.topOffset = value + '%';
      topOffsetValue.textContent = value + '%';
      saveSettings();
      initFloatingLootHelper();
    });
  }

  if (defaultAmountSlider && defaultAmountValue) {
    defaultAmountSlider.value = extensionSettings.lootHelper.defaultLootAmount;
    defaultAmountValue.textContent = extensionSettings.lootHelper.defaultLootAmount;
    defaultAmountSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      extensionSettings.lootHelper.defaultLootAmount = value;
      defaultAmountValue.textContent = value;
      saveSettings();
      // Update the floating input if it exists
      const floatingInput = document.getElementById('floating-loot-amount-input');
      if (floatingInput) {
        floatingInput.value = value;
      }
    });
  }

  if (targetEventInput) {
    targetEventInput.value = extensionSettings.lootHelper.targetEvent;
    targetEventInput.addEventListener('input', (e) => {
      const value = Math.max(1, Math.min(10, parseInt(e.target.value) || 2));
      e.target.value = value;
      extensionSettings.lootHelper.targetEvent = value;
      saveSettings();
      // Update the floating input if it exists
      const floatingEventInput = document.getElementById('floating-loot-event-input');
      if (floatingEventInput) {
        floatingEventInput.value = value;
      }
    });
  }

  if (targetWaveInput) {
    targetWaveInput.value = extensionSettings.lootHelper.targetWave;
    targetWaveInput.addEventListener('input', (e) => {
      const value = Math.max(1, Math.min(50, parseInt(e.target.value) || 6));
      e.target.value = value;
      extensionSettings.lootHelper.targetWave = value;
      saveSettings();
      // Update the floating input if it exists
      const floatingWaveInput = document.getElementById('floating-loot-wave-input');
      if (floatingWaveInput) {
        floatingWaveInput.value = value;
      }
    });
  }
}

function setupPetTeamsSettings() {
  const enabledCheckbox = document.getElementById('pet-teams-enabled');
  const sidebarCheckbox = document.getElementById('pet-teams-sidebar');
  const delaySlider = document.getElementById('pet-apply-delay');
  const delayValue = document.getElementById('pet-apply-delay-value');

  if (enabledCheckbox) {
    enabledCheckbox.checked = extensionSettings.petTeams.enabled;
    enabledCheckbox.addEventListener('change', (e) => {
      extensionSettings.petTeams.enabled = e.target.checked;
      saveSettings();
      if (location.pathname.includes('pets.php')) {
        if (e.target.checked) {
          setTimeout(() => addPetTeamsToPage(), 100);
        } else {
          const panel = document.getElementById('integrated-pet-teams');
          if (panel) panel.remove();
        }
      }
      showNotification('Pet teams ' + (e.target.checked ? 'enabled' : 'disabled'), 'success');
    });
  }

  if (sidebarCheckbox) {
    sidebarCheckbox.checked = extensionSettings.petTeams.showInSidebar;
    sidebarCheckbox.addEventListener('change', (e) => {
      extensionSettings.petTeams.showInSidebar = e.target.checked;
      saveSettings();
      refreshSidebar();
      showNotification('Sidebar pet teams ' + (e.target.checked ? 'enabled' : 'disabled'), 'success');
    });
  }

  if (delaySlider && delayValue) {
    delaySlider.value = extensionSettings.petTeams.applyDelay;
    delayValue.textContent = extensionSettings.petTeams.applyDelay + 'ms';
    delaySlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      extensionSettings.petTeams.applyDelay = value;
      delayValue.textContent = value + 'ms';
      saveSettings();
    });
  }
}

function setupHotkeysSettings() {
  // Helper function to validate hotkey input
  function validateHotkeyInput(key, currentInputId) {
    // Check for system/browser reserved keys
    const reservedKeys = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'tab', 'escape', 'enter', 'backspace', 'delete', 'insert', 'home', 'end', 'pageup', 'pagedown', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'control', 'alt', 'shift', 'meta', 'capslock', 'numlock', 'scrolllock'];
    if (reservedKeys.includes(key.toLowerCase())) {
      alert(`Key "${key}" is reserved by the system/browser and cannot be used as a hotkey.`);
      return false;
    }

    // Check for duplicates within monster selection keys
    const monsterInputs = [];
    for (let i = 1; i <= 9; i++) {
      const input = document.getElementById(`monster-key-${i}`);
      if (input && input.id !== currentInputId) {
        monsterInputs.push(input.value.toLowerCase());
      }
    }
    if (monsterInputs.includes(key.toLowerCase())) {
      alert(`Key "${key}" is already used for monster selection. Please choose a different key.`);
      return false;
    }

    // Check for duplicates within battle attack keys
    const attackInputs = [];
    for (let i = 1; i <= 5; i++) {
      const input = document.getElementById(`attack-key-${i}`);
      if (input && input.id !== currentInputId) {
        attackInputs.push(input.value.toLowerCase());
      }
    }
    if (attackInputs.includes(key.toLowerCase())) {
      alert(`Key "${key}" is already used for battle attacks. Please choose a different key.`);
      return false;
    }

    return true;
  }
  const enabledCheckbox = document.getElementById('hotkeys-enabled');
  const monsterSelectionCheckbox = document.getElementById('hotkeys-monster-selection');
  const showOverlaysCheckbox = document.getElementById('hotkeys-show-overlays');
  const battleAttacksCheckbox = document.getElementById('hotkeys-battle-attacks');
  const resetButton = document.getElementById('reset-hotkeys');
  const saveButton = document.getElementById('save-hotkeys');

  // Initialize checkboxes
  if (enabledCheckbox) {
    enabledCheckbox.checked = extensionSettings.hotkeys.enabled;
    enabledCheckbox.addEventListener('change', (e) => {
      extensionSettings.hotkeys.enabled = e.target.checked;
      saveSettings();
      if (e.target.checked) {
        initHotkeys();
        showNotification('Hotkeys enabled', 'success');
      } else {
        showNotification('Hotkeys disabled', 'info');
      }
    });
  }

  if (monsterSelectionCheckbox) {
    monsterSelectionCheckbox.checked = extensionSettings.hotkeys.monsterSelection;
    monsterSelectionCheckbox.addEventListener('change', (e) => {
      extensionSettings.hotkeys.monsterSelection = e.target.checked;
      saveSettings();
      showNotification('Monster selection hotkeys ' + (e.target.checked ? 'enabled' : 'disabled'), 'success');
    });
  }

  if (showOverlaysCheckbox) {
    showOverlaysCheckbox.checked = extensionSettings.hotkeys.showOverlays;
    showOverlaysCheckbox.addEventListener('change', (e) => {
      extensionSettings.hotkeys.showOverlays = e.target.checked;
      saveSettings();
      // Refresh overlays based on new setting
      if (e.target.checked) {
        addMonsterCardHotkeyOverlays();
        showNotification('Hotkey overlays shown', 'success');
      } else {
        document.querySelectorAll('.hotkey-overlay').forEach(overlay => overlay.remove());
        showNotification('Hotkey overlays hidden', 'info');
      }
    });
  }

  if (battleAttacksCheckbox) {
    battleAttacksCheckbox.checked = extensionSettings.hotkeys.battleAttacks;
    battleAttacksCheckbox.addEventListener('change', (e) => {
      extensionSettings.hotkeys.battleAttacks = e.target.checked;
      saveSettings();
      showNotification('Battle attack hotkeys ' + (e.target.checked ? 'enabled' : 'disabled'), 'success');
    });
  }

  // Add visual feedback for duplicate keys
  function updateInputValidation() {
    const allKeys = [];
    const inputs = [];

    // Collect all monster selection inputs
    for (let i = 1; i <= 9; i++) {
      const input = document.getElementById(`monster-key-${i}`);
      if (input) {
        inputs.push(input);
        allKeys.push({ key: input.value.toLowerCase(), input: input, type: 'monster' });
      }
    }

    // Collect all battle attack inputs
    for (let i = 1; i <= 5; i++) {
      const input = document.getElementById(`attack-key-${i}`);
      if (input) {
        inputs.push(input);
        allKeys.push({ key: input.value.toLowerCase(), input: input, type: 'attack' });
      }
    }

    // Check for duplicates and mark inputs
    const keyCounts = {};
    allKeys.forEach(item => {
      keyCounts[item.key] = (keyCounts[item.key] || 0) + 1;
    });

    inputs.forEach(input => {
      const key = input.value.toLowerCase();
      if (keyCounts[key] > 1) {
        input.classList.add('duplicate-key');
      } else {
        input.classList.remove('duplicate-key');
      }
    });
  }

  // Initialize class skills checkbox
  const classSkillsCheckbox = document.getElementById('hotkeys-class-skills');
  if (classSkillsCheckbox) {
    classSkillsCheckbox.checked = extensionSettings.hotkeys.classSkills;
    classSkillsCheckbox.addEventListener('change', (e) => {
      extensionSettings.hotkeys.classSkills = e.target.checked;
      saveSettings();
      showNotification('Class skills hotkeys ' + (e.target.checked ? 'enabled' : 'disabled'), 'success');
    });
  }

  // Initialize class skill key inputs
  for (let i = 1; i <= 5; i++) {
    const input = document.getElementById(`class-skill-key-${i}`);
    if (input && extensionSettings.hotkeys.classSkillKeys && extensionSettings.hotkeys.classSkillKeys[i - 1]) {
      input.value = extensionSettings.hotkeys.classSkillKeys[i - 1];
      input.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase();
        if (value.length > 1) {
          e.target.value = value.charAt(0);
        }
        // Validate key is not empty and not conflicting
        if (value && validateHotkeyInput(value, `class-skill-key-${i}`)) {
          // Update the settings array
          if (!extensionSettings.hotkeys.classSkillKeys) {
            extensionSettings.hotkeys.classSkillKeys = ['q', 'w', 'e', 'r', 't'];
          }
          extensionSettings.hotkeys.classSkillKeys[i - 1] = value;
        } else if (!value) {
          // Reset to default if empty
          const defaults = ['q', 'w', 'e', 'r', 't'];
          const defaultKey = defaults[i - 1];
          e.target.value = defaultKey;
          if (!extensionSettings.hotkeys.classSkillKeys) {
            extensionSettings.hotkeys.classSkillKeys = ['q', 'w', 'e', 'r', 't'];
          }
          extensionSettings.hotkeys.classSkillKeys[i - 1] = defaultKey;
        }
      });
    }
  }

  // Add input event listeners for class skill keys validation
  for (let i = 1; i <= 5; i++) {
    const input = document.getElementById(`class-skill-key-${i}`);
    if (input) {
      input.addEventListener('input', updateInputValidation);
    }
  }

  // Initialize battle attack key inputs
  for (let i = 1; i <= 5; i++) {
    const input = document.getElementById(`attack-key-${i}`);
    if (input && extensionSettings.hotkeys.battleAttackKeys && extensionSettings.hotkeys.battleAttackKeys[i - 1]) {
      input.value = extensionSettings.hotkeys.battleAttackKeys[i - 1];
      input.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase();
        if (value.length > 1) {
          e.target.value = value.charAt(0);
        }
        // Validate key is not empty and not conflicting
        if (value && validateHotkeyInput(value, `attack-key-${i}`)) {
          // Update the settings array
          if (!extensionSettings.hotkeys.battleAttackKeys) {
            extensionSettings.hotkeys.battleAttackKeys = ['s', 'p', 'h', 'u', 'l'];
          }
          extensionSettings.hotkeys.battleAttackKeys[i - 1] = value;
        } else if (!value) {
          // Reset to default if empty
          const defaults = ['s', 'p', 'h', 'u', 'l'];
          const defaultKey = defaults[i - 1];
          e.target.value = defaultKey;
          if (!extensionSettings.hotkeys.battleAttackKeys) {
            extensionSettings.hotkeys.battleAttackKeys = ['s', 'p', 'h', 'u', 'l'];
          }
          extensionSettings.hotkeys.battleAttackKeys[i - 1] = defaultKey;
        }
      });
    }
  }

  // Reset button
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      // Reset to defaults
      extensionSettings.hotkeys.monsterSelectionKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
      extensionSettings.hotkeys.battleAttackKeys = ['s', 'p', 'h', 'u', 'l'];
      extensionSettings.hotkeys.classSkillKeys = ['q', 'w', 'e', 'r', 't'];

      // Update input fields
      for (let i = 1; i <= 9; i++) {
        const input = document.getElementById(`monster-key-${i}`);
        if (input) input.value = `${i}`;
      }
      for (let i = 1; i <= 5; i++) {
        const input = document.getElementById(`attack-key-${i}`);
        if (input) input.value = ['s', 'p', 'h', 'u', 'l'][i - 1];
      }
      for (let i = 1; i <= 5; i++) {
        const input = document.getElementById(`class-skill-key-${i}`);
        if (input) input.value = ['q', 'w', 'e', 'r', 't'][i - 1];
      }

      saveSettings();
      showNotification('Hotkeys reset to defaults', 'success');
    });
  }

  // Save button
  if (saveButton) {
    saveButton.addEventListener('click', () => {
      // Validate all keys before saving
      let hasErrors = false;
      const allKeys = [];

      // Collect and validate monster selection keys
      for (let i = 1; i <= 9; i++) {
        const input = document.getElementById(`monster-key-${i}`);
        if (input) {
          const key = input.value.toLowerCase().trim();
          if (!key) {
            alert(`Monster selection key ${i} cannot be empty.`);
            hasErrors = true;
            break;
          }
          if (allKeys.includes(key)) {
            alert(`Duplicate key "${key}" found. Please use unique keys for all hotkeys.`);
            hasErrors = true;
            break;
          }
          allKeys.push(key);
        }
      }

      if (!hasErrors) {
        // Collect and validate battle attack keys
        for (let i = 1; i <= 5; i++) {
          const input = document.getElementById(`attack-key-${i}`);
          if (input) {
            const key = input.value.toLowerCase().trim();
            if (!key) {
              alert(`Battle attack key ${i} cannot be empty.`);
              hasErrors = true;
              break;
            }
            if (allKeys.includes(key)) {
              alert(`Duplicate key "${key}" found. Please use unique keys for all hotkeys.`);
              hasErrors = true;
              break;
            }
            allKeys.push(key);
          }
        }
      }

      if (!hasErrors) {
        // Collect and validate class skill keys
        for (let i = 1; i <= 5; i++) {
          const input = document.getElementById(`class-skill-key-${i}`);
          if (input) {
            const key = input.value.toLowerCase().trim();
            if (!key) {
              alert(`Class skill key ${i} cannot be empty.`);
              hasErrors = true;
              break;
            }
            if (allKeys.includes(key)) {
              alert(`Duplicate key "${key}" found. Please use unique keys for all hotkeys.`);
              hasErrors = true;
              break;
            }
            allKeys.push(key);
          }
        }
      }

      if (!hasErrors) {
        // Save settings
        saveSettings();
        showNotification('Hotkeys saved successfully!', 'success');

        // Reinitialize hotkeys with new settings
        initHotkeys();
      }
    });
  }
}

function applySemiTransparentEffect() {
  const sidebar = document.getElementById('game-sidebar');
  if (!sidebar) {
    // If sidebar doesn't exist yet, retry after a short delay
    setTimeout(() => applySemiTransparentEffect(), 100);
    return;
  }

  if (extensionSettings.semiTransparent.enabled) {
    // Convert hex color to rgba for transparency
    const hexColor = extensionSettings.sidebarColor || '#1e1e1e';
    const rgbColor = hexToRgb(hexColor);

    if (rgbColor) {
      // Set CSS variables for semi-transparent colors (sidebar)
      document.documentElement.style.setProperty(
        '--sidebar-semi-transparent-color',
        `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${extensionSettings.semiTransparent.opacity})`
      );
      document.documentElement.style.setProperty(
        '--sidebar-submenu-semi-transparent-color',
        `rgba(${rgbColor.r + 10}, ${rgbColor.g + 10}, ${rgbColor.b + 10}, ${extensionSettings.semiTransparent.opacity * 0.9})`
      );

      // Apply same color to settings modal and sections
      const settingsModal = document.querySelector('.settings-content');
      if (settingsModal) {
        settingsModal.style.background = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${extensionSettings.semiTransparent.opacity})`;
        settingsModal.style.backdropFilter = 'blur(10px)';
      }

      const settingsSections = document.querySelectorAll('.settings-section');
      settingsSections.forEach(section => {
        section.style.background = `rgba(${rgbColor.r + 20}, ${rgbColor.g + 20}, ${rgbColor.b + 20}, ${extensionSettings.semiTransparent.opacity * 0.7})`;
      });
    } else {
      // Fallback if color conversion fails
      document.documentElement.style.setProperty(
        '--sidebar-semi-transparent-color',
        `rgba(30, 30, 30, ${extensionSettings.semiTransparent.opacity})`
      );
      document.documentElement.style.setProperty(
        '--sidebar-submenu-semi-transparent-color',
        `rgba(40, 40, 40, ${extensionSettings.semiTransparent.opacity * 0.9})`
      );

      // Apply fallback to settings modal
      const settingsModal = document.querySelector('.settings-content');
      if (settingsModal) {
        settingsModal.style.background = `rgba(30, 30, 30, ${extensionSettings.semiTransparent.opacity})`;
        settingsModal.style.backdropFilter = 'blur(10px)';
      }

      // Apply fallback to settings sections
      const settingsSections = document.querySelectorAll('.settings-section');
      settingsSections.forEach(section => {
        section.style.background = `rgba(50, 50, 50, ${extensionSettings.semiTransparent.opacity * 0.7})`;
      });
    }

    // Add semi-transparent class
    sidebar.classList.add('semi-transparent');

    // Store the state for persistence
    sidebar.setAttribute('data-semi-transparent', 'true');
  } else {
    // Remove semi-transparent class and reset CSS variables
    sidebar.classList.remove('semi-transparent');
    sidebar.removeAttribute('data-semi-transparent');
    document.documentElement.style.setProperty('--sidebar-base-color', extensionSettings.sidebarColor);
  }
}

// Function to ensure semi-transparent persists
function ensureSemiTransparentPersistence() {
  const sidebar = document.getElementById('game-sidebar');
  if (!sidebar) return;

  // If settings say it should be semi-transparent but class is missing, reapply
  if (extensionSettings.semiTransparent.enabled && !sidebar.classList.contains('semi-transparent')) {
    applySemiTransparentEffect();
  }
}

// Set up persistence observer for semi-transparent effect
function initSemiTransparentPersistence() {
  // Check every few seconds to ensure persistence
  setInterval(ensureSemiTransparentPersistence, 3000);

  // Also check when the page becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      setTimeout(ensureSemiTransparentPersistence, 500);
    }
  });

  // Watch for DOM changes that might affect the sidebar
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        ensureSemiTransparentPersistence();
      }
    });
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });
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
        <button class="settings-button" style="background: #f38ba8; padding: 6px 10px; font-size: 12px; min-width: 40px;" data-action="remove-monster-url">
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

  // Set CSS variable for overlay opacity
  document.documentElement.style.setProperty('--monster-overlay-opacity', extensionSettings.monsterBackgrounds.overlayOpacity);

  // Handle special cases for each page type
  const currentPage = window.location.pathname;

  if (currentPage.includes('merchant.php')) {
    applyMerchantBackground();
    return;
  }

  const monstersFound = [];

  // Handle battle page
  if (currentPage.includes('battle.php')) {
    const panels = document.querySelectorAll('.panel');
    panels.forEach((panel, index) => {
      const monsterNameElement = panel.querySelector('h3, strong');
      if (monsterNameElement) {
        const rawText = monsterNameElement.textContent;
        const monsterName = rawText.replace(/[🧟⚔️🛡️💀👹👻🎭]/g, '').trim();
        if (monsterName && extensionSettings.monsterBackgrounds.monsters[monsterName]) {
          monstersFound.push({ name: monsterName, element: panel });
        }
      }
    });
  }

  // Handle wave/event pages
  if (currentPage.includes('active_wave.php')) {
    const panels = document.querySelectorAll('.panel');
    panels.forEach((panel, index) => {
      const monsterNameElements = panel.querySelectorAll('h3, strong');
      monsterNameElements.forEach(el => {
        const rawText = el.textContent;
        const monsterName = rawText.replace(/[🧟⚔️🛡️💀👹👻🎭]/g, '').trim();
        if (monsterName && extensionSettings.monsterBackgrounds.monsters[monsterName]) {
          const exists = monstersFound.some(m => m.name === monsterName && m.element === panel);
          if (!exists) {
            monstersFound.push({ name: monsterName, element: panel });
          }
        }
      });
    });
  }

  // Handle other pages - let's add general detection
  if (!currentPage.includes('battle.php') && !currentPage.includes('active_wave.php') && !currentPage.includes('orc_cull_event.php')) {
    const panels = document.querySelectorAll('.panel');
    panels.forEach((panel, index) => {
      const textElements = panel.querySelectorAll('h1, h2, h3, h4, strong, b, .monster-name, [class*="monster"], [id*="monster"]');
      textElements.forEach(el => {
        const rawText = el.textContent;
        const monsterName = rawText.replace(/[🧟⚔️🛡️💀👹👻🎭]/g, '').trim();
        if (monsterName && extensionSettings.monsterBackgrounds.monsters[monsterName]) {
          const exists = monstersFound.some(m => m.name === monsterName && m.element === panel);
          if (!exists) {
            monstersFound.push({ name: monsterName, element: panel });
          }
        }
      });
    });
  }


  let shouldApplyBackground = monstersFound.length > 0;
  let selectedMonsterData = null;
  let selectedMonsterName = '';

  if (currentPage.includes('merchant.php')) {
    shouldApplyBackground = true;

    // Use the first configured monster for merchant page
    const availableMonsters = extensionSettings.monsterBackgrounds?.monsters || {};
    const firstMonsterEntry = Object.entries(availableMonsters)[0];

    if (firstMonsterEntry) {
      selectedMonsterName = firstMonsterEntry[0];
      selectedMonsterData = firstMonsterEntry[1];

    }
  } else if (monstersFound.length > 0) {
    // Use detected monster for other pages
    const firstMonster = monstersFound[0];
    selectedMonsterName = firstMonster.name;
    selectedMonsterData = extensionSettings.monsterBackgrounds.monsters[selectedMonsterName];
  }

  // Apply background if we should (either monsters found OR merchant page)
  if (shouldApplyBackground && selectedMonsterData) {
    // Use the first monster found for the background
    const firstMonster = monstersFound[0];
    const monsterName = firstMonster.name;
    const monsterData = extensionSettings.monsterBackgrounds.monsters[monsterName];

    // Handle both old format (string URL) and new format (object with url and effect)
    const monsterUrl = typeof monsterData === 'string' ? monsterData : monsterData?.url;



    if (monsterUrl && typeof monsterUrl === 'string') {
      // Remove any existing monster background styles
      const existingStyles = document.querySelectorAll('style[id^="monster-bg-"]');
      existingStyles.forEach(style => style.remove());

      // Create unified style for ALL panels (no special classes needed)
      const styleId = 'monster-bg-unified';
      const style = document.createElement('style');
      style.id = styleId;

      // Generate CSS that targets ALL panels directly
      let css = '';
      const selector = '.panel';


      // Add some debugging info


      switch (extensionSettings.monsterBackgrounds.effect) {
        case 'blur':
          css = `
              ${selector} {
                background-image: url('${monsterUrl}') !important;
                background-size: cover !important;
                background-position: center !important;
                background-repeat: no-repeat !important;
                background-attachment: fixed !important;
                position: relative !important;
              }
              
              ${selector}::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-image: inherit;
                background-size: inherit;
                background-position: inherit;
                filter: blur(3px);
                z-index: 0;
              }
              
              ${selector} > * {
                position: relative;
                z-index: 1;
              }
            `;
          break;

        case 'gradient':
          css = `
              ${selector} {
                background-image: 
                  linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.3)),
                  url('${monsterUrl}') !important;
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
                  repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(0, 0, 0, 0.1) 10px,
                    rgba(0, 0, 0, 0.1) 20px
                  ),
                  url('${monsterUrl}') !important;
                background-size: cover !important;
                background-position: center !important;
                background-repeat: no-repeat !important;
                background-attachment: fixed !important;
              }
            `;
          break;

        default: // normal
          css = `
              ${selector} {
                background-image: url('${monsterUrl}') !important;
                background-size: cover !important;
                background-position: center !important;
                background-repeat: no-repeat !important;
                background-attachment: fixed !important;
                position: relative !important;
              }
              
              ${selector}::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, ${extensionSettings.monsterBackgrounds.overlayOpacity});
                z-index: 0;
              }
              
              ${selector} > * {
                position: relative;
                z-index: 1;
              }
            `;
      }



      // Test if image can be loaded
      const testImage = new Image();
      testImage.onload = () => {

      };
      testImage.onerror = () => {
        console.error(`❌ Failed to load image: ${monsterUrl}`);

      };
      testImage.src = monsterUrl;

      style.textContent = css;
      document.head.appendChild(style);


      // Log the panels that will be affected
      const allPanels = document.querySelectorAll('.panel');

    }
  } else {
    // No monsters found, remove any existing monster backgrounds
    const existingStyles = document.querySelectorAll('style[id^="monster-bg-"]');
    existingStyles.forEach(style => style.remove());


  }

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
  // Clean up existing observer first
  if (window.backgroundObserver) {
    window.backgroundObserver.disconnect();
    activeObservers = activeObservers.filter(obs => obs !== window.backgroundObserver);
    window.backgroundObserver = null;
  }

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

  // Track the observer
  window.backgroundObserver = observer;
  activeObservers.push(observer);
}

// Debug function for monster backgrounds - can be called from console
window.debugMonsterBackgrounds = function () {
  console.log('=== MONSTER BACKGROUND DEBUG INFO ===');
  console.log('Extension Settings:', extensionSettings);
  console.log('Monster Backgrounds Enabled:', extensionSettings.monsterBackgrounds?.enabled);
  console.log('Available Monster Backgrounds:', extensionSettings.monsterBackgrounds?.monsters);
  console.log('Current Page:', window.location.pathname);

  const panels = document.querySelectorAll('.panel');
  console.log('Total Panels Found:', panels.length);

  panels.forEach((panel, index) => {
    console.log(`=== Panel ${index + 1} ===`);
    console.log('Panel element:', panel);
    console.log('Panel classes:', panel.className);
    console.log('Panel data-monster:', panel.getAttribute('data-monster'));

    const textElements = panel.querySelectorAll('h1, h2, h3, h4, strong, b, span');
    console.log('Text elements in panel:', textElements.length);

    textElements.forEach((el, i) => {
      console.log(`  Text ${i + 1}: "${el.textContent.trim()}"`);
    });
  });

  const monsterStyles = document.querySelectorAll('[id^="monster-bg-"]');
  console.log('Monster style elements found:', monsterStyles.length);
  monsterStyles.forEach((style, i) => {
    console.log(`Style ${i + 1}:`, style.id, style.textContent);
  });

  // Force re-apply monster backgrounds
  console.log('Re-applying monster backgrounds...');
  applyMonsterBackgrounds();
};

// Console function to manually enable monster backgrounds
window.enableMonsterBackgrounds = function () {
  console.log('Manually enabling monster backgrounds...');
  extensionSettings.monsterBackgrounds.enabled = true;
  saveSettings();

  // Update the UI toggle if it exists
  const enabledToggle = document.getElementById('monster-backgrounds-enabled');
  if (enabledToggle) {
    enabledToggle.checked = true;
  }

  applyMonsterBackgrounds();
  console.log('Monster backgrounds enabled! Current status:', extensionSettings.monsterBackgrounds);
};

// Console function to test image loading
window.testMonsterImageUrls = function () {
  console.log('=== Testing Monster Image URLs ===');
  const monsters = extensionSettings.monsterBackgrounds?.monsters || {};

  Object.entries(monsters).forEach(([monsterName, monsterData]) => {
    // Handle both old format (string URL) and new format (object with url and effect)
    const url = typeof monsterData === 'string' ? monsterData : monsterData?.url;

    console.log(`Testing ${monsterName}:`, monsterData);
    console.log(`Extracted URL: ${url}`);

    if (!url || typeof url !== 'string') {
      console.error(`❌ ${monsterName}: Invalid URL format`);
      return;
    }

    const testImg = new Image();
    testImg.onload = () => {
      console.log(`✅ ${monsterName}: Image loaded successfully`);
      console.log(`   Dimensions: ${testImg.naturalWidth}x${testImg.naturalHeight}`);
    };
    testImg.onerror = (e) => {
      console.error(`❌ ${monsterName}: Failed to load image`);
      console.error(`   URL: ${url}`);
      console.error(`   Error:`, e);

      // Try to diagnose the issue
      if (url.startsWith('http://')) {
        console.warn('   ⚠️  HTTP URL might be blocked on HTTPS sites');
      }
      if (!url.startsWith('http') && !url.startsWith('data:')) {
        console.warn('   ⚠️  Relative URL might not resolve correctly');
      }
    };
    testImg.src = url;
  });

  if (Object.keys(monsters).length === 0) {
    console.log('No monster URLs configured to test');
  }
};

// Console function to test a specific URL
window.testImageUrl = function (url) {
  console.log(`Testing specific URL: ${url}`);
  const testImg = new Image();
  testImg.onload = () => {
    console.log(`✅ Image loaded successfully: ${testImg.naturalWidth}x${testImg.naturalHeight}`);
  };
  testImg.onerror = (e) => {
    console.error(`❌ Failed to load image: ${url}`);
    console.error('Error:', e);
  };
  testImg.src = url;
};

// Console function to check current monster background status
window.checkMonsterBackgroundStatus = function () {
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
window.testMonsterToggleClicks = function () {
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
window.testMonsterFunctions = function () {
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
window.toggleMonsterBackgrounds = function () {
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
window.forceEnableMonsterBackgrounds = function () {
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

function initWaveAutoRefresh() {
  // Check if we're on a wave page
  const isWavePage = window.location.pathname.includes('active_wave.php') ||
    window.location.pathname.includes('wave') ||
    document.querySelector('.monster-card') !== null;

  if (!isWavePage) return;

  // Clear any existing interval
  if (waveRefreshInterval) {
    clearInterval(waveRefreshInterval);
    waveRefreshInterval = null;
  }

  // Start auto-refresh if enabled
  if (extensionSettings.waveAutoRefresh.enabled) {
    startWaveAutoRefresh();
  }
}

function startWaveAutoRefresh() {
  const intervalMs = (extensionSettings.waveAutoRefresh.interval || 10) * 1000;

  waveRefreshInterval = setInterval(() => {
    if (extensionSettings.waveAutoRefresh.useHardRefresh) {
      console.log('Auto-refreshing wave page (hard)...');
      location.reload(); // Hard refresh: full page reload
    } else {
      console.log('Auto-refreshing wave page (soft)...');
      updateData(false); // Soft refresh: update monster data only
    }
  }, intervalMs);
  console.log(`Wave auto-refresh started: ${extensionSettings.waveAutoRefresh.interval} seconds (${extensionSettings.waveAutoRefresh.useHardRefresh ? 'hard' : 'soft'} refresh)`);
}

function stopWaveAutoRefresh() {
  if (waveRefreshInterval) {
    clearInterval(waveRefreshInterval);
    waveRefreshInterval = null;
    console.log('Wave auto-refresh stopped');
  }
}

// Comprehensive cleanup system to prevent memory accumulation on hard refreshes
function comprehensiveCleanup() {
  try {
    // Clear all tracked intervals
    activeIntervals.forEach(interval => {
      if (interval) {
        clearInterval(interval);
      }
    });
    activeIntervals = [];

    // Disconnect all tracked observers
    activeObservers.forEach(observer => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect();
      }
    });
    activeObservers = [];

    // Clear legacy intervals (for backward compatibility)
    const legacyIntervals = [
      waveUpdateInterval, monsterSortingInterval, hotkeyOverlayInterval,
      userDataUpdateInterval, window.lootPillsInterval, window.potionExpTimer,
      window.autoSlashInterval, alarmInterval, waveRefreshInterval
    ];

    legacyIntervals.forEach(interval => {
      if (interval) {
        clearInterval(interval);
      }
    });

    // Reset global interval variables
    waveUpdateInterval = null;
    monsterSortingInterval = null;
    hotkeyOverlayInterval = null;
    userDataUpdateInterval = null;
    alarmInterval = null;
    waveRefreshInterval = null;
    if (window.lootPillsInterval) window.lootPillsInterval = null;
    if (window.potionExpTimer) window.potionExpTimer = null;
    if (window.autoSlashInterval) window.autoSlashInterval = null;

    // Disconnect legacy observers
    if (window.backgroundObserver && typeof window.backgroundObserver.disconnect === 'function') {
      window.backgroundObserver.disconnect();
      window.backgroundObserver = null;
    }
    if (window.lizardRemovalObserver && typeof window.lizardRemovalObserver.disconnect === 'function') {
      window.lizardRemovalObserver.disconnect();
      window.lizardRemovalObserver = null;
    }

    // Clear DOM elements
    document.querySelectorAll('.hotkey-overlay, .loot-probability-pill, .loot-pills-container').forEach(el => el.remove());

    // Clear cached data to prevent memory accumulation
    lastHtmlContent = null;
    lastParsedData = null;
    refreshCounter = 0;

    // Clear event listeners array
    activeEventListeners = [];

  } catch (e) {
    console.error('Error in comprehensive cleanup:', e);
  }
}

// Multiple cleanup event listeners for maximum coverage
['beforeunload', 'unload', 'pagehide'].forEach(event => {
  window.addEventListener(event, () => {
    comprehensiveCleanup();
    stopWaveAutoRefresh();
  }, { capture: true, passive: true });
});

// Background operation enabled - no cleanup on tab hide

// Periodic cleanup to catch any missed memory leaks (runs every 5 minutes)
setInterval(() => {
  try {
    // Clean up any orphaned observers
    activeObservers = activeObservers.filter(observer => {
      if (!observer || typeof observer.disconnect !== 'function') {
        return false;
      }
      // Check if observer is still observing
      try {
        // This will throw if the observer is disconnected
        observer.takeRecords();
        return true;
      } catch (e) {
        observer.disconnect();
        return false;
      }
    });

    // Clean up any orphaned intervals
    activeIntervals = activeIntervals.filter(interval => {
      if (!interval) return false;
      // Check if interval is still active by trying to clear it
      try {
        clearInterval(interval);
        return true; // If we can clear it, it was still active
      } catch (e) {
        return false;
      }
    });
  } catch (e) {
    console.error('Error in periodic cleanup:', e);
  }
}, 5 * 60 * 1000); // 5 minutes

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


function initializeBattleData() {
  const myHpText = document.getElementById('myHpText');
  const enemyHpText = document.getElementById('enemyHpText');

  if (myHpText && enemyHpText) {
    // Parse HP from text like " 5,846 / 6,000 HP"
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
      const resultText = resultCell.textContent.trim();
      const isWin = resultText === 'Win';
      const isDraw = resultText === 'Draw';
      const isLoss = !isWin && !isDraw;

      // Set background color based on result
      if (isWin) {
        row.style.backgroundColor = '#1c2d1c'; // Green for win
      } else if (isDraw) {
        row.style.backgroundColor = '#2d2d1c'; // Yellow-ish for draw
      } else {
        row.style.backgroundColor = '#2d1c1c'; // Red for loss
      }
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

      // Calculate points based on attacker/defender role and win/loss/draw
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
        // Winner gets +10 (attacker) or +5 (defender)
        points = isAttacker ? '+10' : '+5';
      } else if (isDraw) {
        // Draw: defender gets +5, attacker gets 0
        points = isAttacker ? '0' : '+5';
      } else {
        // Loser gets -15 (attacker) or -5 (defender)
        points = isAttacker ? '-15' : '-5';
      }

      // Update points cell content and styling
      pointsCell.textContent = points;
      if (isWin) {
        pointsCell.style.color = '#8ff0a4';
      } else if (isDraw) {
        pointsCell.style.color = '#f9e2af';
      } else {
        pointsCell.style.color = '#ff9a9a';
      }
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
    hideImagesCheckbox.addEventListener('change', function () {
      extensionSettings.battlePageHideImages = this.checked;
      saveSettings();
      applyBattleImageSettings();

      showNotification(extensionSettings.battlePageHideImages ? 'All images hidden' : 'All images shown', 'success');
    });
  }

  if (clearButton) {
    clearButton.addEventListener('click', function () {
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

  settingsButton.addEventListener('click', function () {
    this.style.transform = 'scale(0.95)';
    setTimeout(() => {
      this.style.transform = 'scale(1)';
    }, 150);

    showSettingsModal();
  });

  // Position it at the very end of the topbar
  topbarRight.appendChild(settingsButton);
}

async function createTopbarProfileCircle() {
  const topbarInner = document.querySelector('.gtb-inner');
  if (!topbarInner || document.querySelector('.topbar-profile-circle')) return;

  const userId = getCookieExtension('demon');
  if (!userId) return;

  try {
    // Fetch the player profile page
    const response = await fetch(`https://demonicscans.org/player.php?pid=${userId}`);
    const html = await response.text();

    // Parse the HTML to find the avatar image
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const avatarImg = doc.querySelector('.avatar img');

    if (!avatarImg) return;

    const avatarSrc = avatarImg.src;

    // Create the profile circle
    const profileCircle = document.createElement('div');
    profileCircle.className = 'topbar-profile-circle';
    profileCircle.innerHTML = `
        <img src="${avatarSrc}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
      `;

    // Make it clickable to redirect to profile page
    profileCircle.addEventListener('click', function () {
      window.location.href = `https://demonicscans.org/player.php?pid=${userId}`;
    });

    // Position it at the very beginning of gtb-inner (before gtb-left)
    const gtbLeft = topbarInner.querySelector('.gtb-left');
    if (gtbLeft) {
      topbarInner.insertBefore(profileCircle, gtbLeft);
    } else {
      topbarInner.prepend(profileCircle);
    }

  } catch (error) {
    console.error('Failed to load profile avatar:', error);
  }
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
      // Add header wrapper if missing
      const title = section.querySelector('h3');
      if (title) {
        const content = section.innerHTML;
        const header = document.createElement('div');
        header.className = 'settings-section-header';
        header.innerHTML = `
            <h3>${title.textContent}</h3>
            <span class="expand-icon">–</span>
          `;
        section.innerHTML = '';
        section.appendChild(header);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'settings-section-content expanded';
        contentDiv.innerHTML = content.replace(title.outerHTML, '');
        section.appendChild(contentDiv);
      }
    }

    const header = section.querySelector('.settings-section-header');
    const content = section.querySelector('.settings-section-content');
    const icon = header?.querySelector('.expand-icon');

    if (header && content && icon) {
      header.addEventListener('click', () => {
        const isExpanded = content.classList.contains('expanded');
        content.classList.toggle('expanded');
        icon.textContent = isExpanded ? '+' : '–';
      });
    }
  });

  // Use event delegation for all modal buttons
  document.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('settings-button')) {
      const action = e.target.getAttribute('data-action');

      switch (action) {
        case 'close':
          e.preventDefault();
          e.stopPropagation();
          closeSettingsModal();
          break;
        case 'reset':
          e.preventDefault();
          e.stopPropagation();
          resetSettings();
          break;
        case 'clear':
          e.preventDefault();
          e.stopPropagation();
          clearAllData();
          break;
      }
    }
  });
}

function updateColorSelections() {
  // Update sidebar color input
  const sidebarColorInput = document.getElementById('sidebar-custom-color');
  if (sidebarColorInput) {
    sidebarColorInput.value = extensionSettings.sidebarColor;
  }

  // Update background color input
  const backgroundColorInput = document.getElementById('background-custom-color');
  if (backgroundColorInput) {
    backgroundColorInput.value = extensionSettings.backgroundColor;
  }

  // Update monster image outline color input
  const monsterImageColorInput = document.getElementById('monster-image-custom-color');
  if (monsterImageColorInput) {
    monsterImageColorInput.value = extensionSettings.monsterImageOutlineColor;
  }

  // Update loot card border color input
  const lootCardColorInput = document.getElementById('loot-card-custom-color');
  if (lootCardColorInput) {
    lootCardColorInput.value = extensionSettings.lootCardBorderColor;
  }
}

// Menu Customization Functions - Make them globally accessible
window.toggleMenuCustomization = function () {
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
    toggle.addEventListener('click', function () {
      const itemId = this.dataset.itemId;
      toggleMenuItemVisibility(itemId);
    });

    // Add arrow button event listeners
    const arrowButtons = row.querySelectorAll('.arrow-btn');
    arrowButtons.forEach(button => {
      button.addEventListener('click', function () {
        const itemId = this.dataset.itemId;
        const direction = this.dataset.direction;
        moveMenuItem(itemId, direction);
      });
    });

    container.appendChild(row);
  });
}

window.toggleMenuItemVisibility = function (itemId) {
  const item = extensionSettings.menuItems.find(i => i.id === itemId);
  if (item) {
    item.visible = !item.visible;
    saveSettings();
    populateMenuItemsList(); // Refresh the list
  }
};

window.moveMenuItem = function (itemId, direction) {
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

window.resetMenuCustomization = function () {
  // Reset to default menu items
  extensionSettings.menuItems = [
    { id: 'battle_pass', name: 'Battle Pass', visible: true, order: 1 },
    { id: 'pvp', name: 'PvP Arena', visible: true, order: 2 },
    { id: 'gate_grakthar', name: 'Gate Grakthar', visible: true, order: 3 },
    { id: 'inventory_quick', name: 'Inventory', visible: true, order: 4 },
    { id: 'pets', name: 'Pets & Eggs', visible: true, order: 5 },
    { id: 'guild', name: 'Guild', visible: true, order: 6 },
    { id: 'stats', name: 'Stats', visible: true, order: 7 },
    { id: 'blacksmith', name: 'Blacksmith', visible: true, order: 8 },
    { id: 'legendary_forge', name: 'Legendary Forge', visible: true, order: 9 },
    { id: 'merchant', name: 'Merchant', visible: true, order: 10 },
    { id: 'achievements', name: 'Achievements', visible: true, order: 11 },
    { id: 'collections', name: 'Collections', visible: true, order: 12 },
    { id: 'guide', name: 'How To Play', visible: true, order: 13 },
    { id: 'leaderboard', name: 'Weekly Leaderboard', visible: true, order: 14 },
    { id: 'chat', name: 'Global Chat', visible: true, order: 15 }
  ];

  saveSettings();
  populateMenuItemsList();
  showNotification('Menu customization reset to default', 'success');
};

window.applyMenuCustomization = function () {
  saveSettings();
  refreshSidebar();
  showNotification('Menu customization applied!', 'success');
};

function refreshSidebar() {
  const sidebar = document.getElementById('game-sidebar');
  if (sidebar) {
    const menuList = sidebar.querySelector('.sidebar-menu');
    if (menuList) {
      menuList.innerHTML = generateMenuItems();
      // Re-initialize sidebar functionality after refresh
      initSidebarFunctionality();
    }
  }
}

function initSidebarFunctionality() {
  // Re-initialize all sidebar event listeners and functionality
  setupSidebarToggle();
  setupExpandButtons();
  setupSettingsLink();
  // Add other sidebar functionality as needed
  initAdventurersGuildQuests();
}

function initAdventurersGuildQuests() {
  // Fetch and populate adventurers guild quests in sidebar
  const questsContainer = document.getElementById('sidebar-adventurers-guild-quests');
  if (!questsContainer) return;

  // Show loading state
  questsContainer.innerHTML = '<div style="text-align: center; padding: 15px; color: #6c7086; font-size: 11px;">Loading quests...</div>';

  // Fetch adventures page
  fetch('https://demonicscans.org/adventurers_guild.php', {
    credentials: 'include',
    mode: 'same-origin'
  })
  .then(response => response.text())
  .then(html => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract available quests - updated selectors to match actual HTML structure
    const availableQuests = [];
    const availableQuestElements = doc.querySelectorAll('.quest-list .quest-row');
    availableQuestElements.forEach(questEl => {
      // Check if this is an active quest by looking for progress indicators
      const progress = questEl.querySelector('.quest-progress')?.textContent?.trim();
      const hasProgress = progress && progress.includes('Progress:');
      
      // Only add to available quests if it doesn't have progress (not active)
      if (!hasProgress) {
        const title = questEl.querySelector('.quest-main-title')?.textContent?.trim();
        const description = questEl.querySelector('.quest-main-desc')?.textContent?.trim();
        const reward = questEl.querySelector('.quest-reward')?.textContent?.trim();

        // Extract quest ID from accept button
        const acceptBtn = questEl.querySelector('.quest-accept-btn');
        let questId = null;
        if (acceptBtn) {
          const onclickStr = acceptBtn.getAttribute('onclick') || '';
          const match = onclickStr.match(/acceptQuest\((\d+)/);
          if (match) {
            questId = match[1];
          }
        }

        if (title) {
          // Check if this quest is already in the array to prevent duplicates
          const existingQuest = availableQuests.find(q => q.title === title);
          if (!existingQuest) {
            availableQuests.push({
              title: title,
              description: description || 'No description available',
              reward: reward || 'No reward specified',
              questId: questId,
              type: 'available'
            });
          }
        }
      }
    });

    // Extract active quests - look for active quest section
    const activeQuests = [];
    const activeQuestElements = doc.querySelectorAll('.quest-list .quest-row');
    activeQuestElements.forEach(questEl => {
      // Check if this is an active quest by looking for progress or specific indicators
      const progress = questEl.querySelector('.quest-progress')?.textContent?.trim();
      const hasProgress = progress && progress.includes('Progress:');
      
      if (hasProgress) {
        const title = questEl.querySelector('.quest-main-title')?.textContent?.trim();
        const description = questEl.querySelector('.quest-main-desc')?.textContent?.trim();
        const timeLeft = questEl.querySelector('.quest-time')?.textContent?.trim();

        // Extract quest action from give up, finish, or donate button
        // Prioritize donate button over give up button
        const giveUpBtn = questEl.querySelector('.quest-giveup-btn');
        const finishBtn = questEl.querySelector('.quest-finish-btn');
        const donateBtn = questEl.querySelector('.quest-donate-btn');
        let questId = null;
        let actionType = null;
        let actionLabel = null;
        let itemId = null;

        if (donateBtn) {
          const onclickStr = donateBtn.getAttribute('onclick') || '';
          const match = onclickStr.match(/donateGatherItem\((\d+),\s*(\d+)/);
          if (match) {
            questId = match[1];
            itemId = match[2];
            actionType = 'donate';
            actionLabel = 'Donate';
          }
        } else if (finishBtn) {
          const onclickStr = finishBtn.getAttribute('onclick') || '';
          const match = onclickStr.match(/finishQuest\((\d+)/);
          if (match) {
            questId = match[1];
            actionType = 'finish';
            actionLabel = 'Finish quest';
          }
        } else if (giveUpBtn) {
          const onclickStr = giveUpBtn.getAttribute('onclick') || '';
          const match = onclickStr.match(/giveUpQuest\((\d+)/);
          if (match) {
            questId = match[1];
            actionType = 'giveUp';
            actionLabel = 'Give up';
          }
        }

        if (title) {
          // Check if this quest is already in the array to prevent duplicates
          const existingQuest = activeQuests.find(q => q.title === title);
          if (!existingQuest) {
            activeQuests.push({
              title: title,
              progress: progress || 'In progress',
              timeLeft: timeLeft || 'Unknown time remaining',
              questId: questId,
              itemId: itemId,
              actionType: actionType,
              actionLabel: actionLabel,
              type: 'active'
            });
          }
        }
      }
    });

    // Build HTML for quests
    let questsHTML = '';

    if (availableQuests.length > 0) {
      availableQuests.forEach(quest => {
        questsHTML += `
          <div class="sidebar-quest" style="margin-bottom: 8px; padding: 6px; background: rgba(30, 30, 46, 0.5); border-radius: 4px; border-left: 2px solid #89b4fa;">
            <div class="quest-title" style="font-weight: bold; color: #cdd6f4; font-size: 10px; margin-bottom: 3px;">${quest.title}</div>
            <div class="quest-details" style="color: #6c7086; font-size: 9px; margin-bottom: 2px;">${quest.description}</div>
            <div class="quest-reward" style="color: #a6e3a1; font-size: 9px; margin-bottom: 4px;">Reward: ${quest.reward}</div>
            ${quest.questId ? `<button class="quest-accept-btn" type="button" data-quest-id="${quest.questId}" style="background: #89b4fa; color: white; border: none; border-radius: 3px; padding: 2px 6px; font-size: 9px; cursor: pointer;">Accept quest</button>` : ''}
          </div>
        `;
      });
      questsHTML += '</div>';
    }

    if (activeQuests.length > 0) {
      questsHTML += '<div><div style="font-weight: bold; color: #f9e2af; margin-bottom: 8px; font-size: 11px;">⚡ Active Quests</div>';
      activeQuests.forEach(quest => {
        questsHTML += `
          <div class="sidebar-quest" style="margin-bottom: 8px; padding: 6px; background: rgba(30, 30, 46, 0.5); border-radius: 4px; border-left: 2px solid #f9e2af;">
            <div class="quest-title" style="font-weight: bold; color: #cdd6f4; font-size: 10px; margin-bottom: 3px;">${quest.title}</div>
            <div class="quest-progress" style="color: #6c7086; font-size: 9px; margin-bottom: 2px;">${quest.progress}</div>
            <div class="quest-time" style="color: #eba0ac; font-size: 9px; margin-bottom: 4px;">${quest.timeLeft}</div>
            ${quest.questId && quest.actionType ? `<button class="quest-${quest.actionType}-btn" type="button" data-quest-id="${quest.questId}" data-action-type="${quest.actionType}" ${quest.itemId ? `data-item-id="${quest.itemId}"` : ''} style="background: ${quest.actionType === 'giveUp' ? '#f38ba8' : quest.actionType === 'donate' ? '#fab387' : '#a6e3a1'}; color: white; border: none; border-radius: 3px; padding: 2px 6px; font-size: 9px; cursor: pointer; margin-top: 2px;">${quest.actionLabel}</button>` : ''}
          </div>
        `;
      });
      questsHTML += '</div>';
    }

    if (availableQuests.length === 0 && activeQuests.length === 0) {
      questsHTML = '<div style="text-align: center; padding: 15px; color: #6c7086; font-size: 11px; font-style: italic;">No quests found</div>';
    }

    questsContainer.innerHTML = questsHTML;

    // Add event listeners to quest action buttons
    const questButtons = questsContainer.querySelectorAll('.quest-giveUp-btn, .quest-finish-btn, .quest-accept-btn, .quest-donate-btn');
    questButtons.forEach(btn => {
      btn.addEventListener('click', function() {
        const questId = this.getAttribute('data-quest-id');
        const actionType = this.classList.contains('quest-accept-btn') ? 'accept' : 
                          this.classList.contains('quest-giveUp-btn') ? 'giveUp' : 
                          this.classList.contains('quest-donate-btn') ? 'donate' : 'finish';
        if (actionType === 'accept') {
          sidebarAcceptQuest(questId, this);
        } else if (actionType === 'donate') {
          const itemId = this.getAttribute('data-item-id');
          sidebarDonateQuest(questId, itemId, this);
        } else {
          sidebarQuestAction(actionType, questId, this);
        }
      });
    });
  })
  .catch(error => {
    console.error('Error fetching adventurers guild quests:', error);
    questsContainer.innerHTML = '<div style="text-align: center; padding: 15px; color: #f38ba8; font-size: 11px;">Failed to load quests</div>';
  });
}

function sidebarDonateQuest(questId, itemId, btn) {
  // Create quantity input popup
  const existingPopup = document.getElementById('quest-donate-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  const popup = document.createElement('div');
  popup.id = 'quest-donate-popup';
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(30, 30, 46, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 20px;
    z-index: 10000;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    min-width: 250px;
    text-align: center;
  `;

  popup.innerHTML = `
    <div style="color: #cdd6f4; font-size: 14px; margin-bottom: 15px; font-weight: bold;">Donate Items</div>
    <div style="color: #6c7086; font-size: 12px; margin-bottom: 15px;">Enter quantity to donate:</div>
    <input type="number" id="donate-quantity" min="1" max="999" value="1" style="width: 80px; padding: 5px; border: 1px solid #45475a; border-radius: 4px; background: #1e1e2e; color: #cdd6f4; text-align: center; margin-bottom: 15px;">
    <div>
      <button id="donate-confirm-btn" style="background: #fab387; color: white; border: none; border-radius: 4px; padding: 8px 16px; margin-right: 8px; cursor: pointer;">Donate</button>
      <button id="donate-cancel-btn" style="background: #6c7086; color: white; border: none; border-radius: 4px; padding: 8px 16px; cursor: pointer;">Cancel</button>
    </div>
  `;

  document.body.appendChild(popup);

  // Focus on input
  const quantityInput = document.getElementById('donate-quantity');
  quantityInput.focus();
  quantityInput.select();

  // Handle confirm button
  document.getElementById('donate-confirm-btn').addEventListener('click', function() {
    const quantity = parseInt(quantityInput.value);
    if (quantity > 0) {
      performSidebarDonate(questId, itemId, quantity, btn);
      popup.remove();
    }
  });

  // Handle cancel button
  document.getElementById('donate-cancel-btn').addEventListener('click', function() {
    popup.remove();
  });

  // Handle Enter key
  quantityInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      const quantity = parseInt(quantityInput.value);
      if (quantity > 0) {
        performSidebarDonate(questId, itemId, quantity, btn);
        popup.remove();
      }
    }
  });

  // Handle Escape key
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      popup.remove();
      document.removeEventListener('keydown', escHandler);
    }
  });
}

function performSidebarDonate(questId, itemId, quantity, originalBtn) {
  if (!confirm(`Donate ${quantity} item(s) towards your quest? You must own more than this amount.`)) return;

  originalBtn.disabled = true;
  originalBtn.textContent = `Donating... (0/${quantity})`;

  let donatedCount = 0;
  let failedCount = 0;

  // Function to send a single donation request
  const sendDonationRequest = () => {
    return fetch('/adventurers_donate_gather.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        quest_id: questId,
        item_id: itemId
      })
    })
    .then(r => r.json())
    .then(data => {
      if (data && data.status === 'ok') {
        donatedCount++;
        originalBtn.textContent = `Donating... (${donatedCount}/${quantity})`;
        return true;
      } else {
        failedCount++;
        console.error('Donation failed:', data?.message);
        return false;
      }
    })
    .catch(error => {
      failedCount++;
      console.error('Donation error:', error);
      return false;
    });
  };

  // Send requests sequentially
  const donateSequentially = async () => {
    for (let i = 0; i < quantity; i++) {
      const success = await sendDonationRequest();
      if (!success) {
        // If a donation fails, stop the process
        break;
      }

      // Small delay between requests to avoid overwhelming the server
      if (i < quantity - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Show final result
    if (failedCount === 0) {
      alert(`Successfully donated ${donatedCount} item(s) towards your quest!`);
    } else if (donatedCount > 0) {
      alert(`Partially successful: donated ${donatedCount} item(s), but ${failedCount} failed.`);
    } else {
      alert('Failed to donate any items. Please try again.');
    }

    // Refresh the sidebar quests
    initAdventurersGuildQuests();
  };

  // Start the donation process
  donateSequentially().catch(error => {
    console.error('Donation process error:', error);
    alert('An error occurred during the donation process.');
    originalBtn.disabled = false;
    originalBtn.textContent = 'Donate';
  });
}

function sidebarQuestAction(actionType, questId, btn) {
  const confirmMessages = {
    giveUp: "Abandon this quest? Progress will be lost.",
    finish: "Turn in this quest at the Adventurer's Guild?"
  };

  if (!confirm(confirmMessages[actionType])) return;
  btn.disabled = true;
  btn.textContent = 'Processing...';

  const endpoints = {
    giveUp: '/adventurers_giveup_quest.php',
    finish: '/adventurers_finish_quest.php'
  };

  fetch(endpoints[actionType], {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ quest_id: questId })
  })
  .then(r => r.json())
  .then(data => {
    if (data && data.status === 'ok') {
      showNotification(data.message || `Quest ${actionType === 'giveUp' ? 'abandoned' : 'finished'}!`, 'success');
      // Refresh the sidebar quests content
      initAdventurersGuildQuests();
    } else {
      showNotification((data && data.message) ? data.message : `Could not ${actionType} quest.`, 'error');
      btn.disabled = false;
      btn.textContent = actionType === 'giveUp' ? 'Give up' : 'Finish quest';
    }
  })
  .catch(() => {
    showNotification(`Server error while ${actionType === 'giveUp' ? 'abandoning' : 'finishing'} quest.`, 'error');
    btn.disabled = false;
    btn.textContent = actionType === 'giveUp' ? 'Give up' : 'Finish quest';
  });
}

function sidebarAcceptQuest(questId, btn) {
  if (!confirm("Accept this quest?")) return;
  btn.disabled = true;
  btn.textContent = 'Accepting...';

  fetch('/adventurers_accept_quest.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ quest_id: questId })
  })
  .then(r => r.json())
  .then(data => {
    if (data && data.status === 'ok') {
      showNotification(data.message || 'Quest accepted!', 'success');
      // Refresh the sidebar quests content
      initAdventurersGuildQuests();
    } else {
      showNotification((data && data.message) ? data.message : 'Could not accept quest.', 'error');
      btn.disabled = false;
      btn.textContent = 'Accept quest';
    }
  })
  .catch(() => {
    showNotification('Server error while accepting quest.', 'error');
    btn.disabled = false;
    btn.textContent = 'Accept quest';
  });
}

function resetSettings() {
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
    equipmentExpanded: false,
    guildExpanded: false,
    worldMapExpanded: false,
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
      equipmentExpanded: false,
      guildExpanded: false,
      worldMapExpanded: false,
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
    updateSidebarEquipSetsSection();

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

// ===== Update Checker =====
function normalizeVersion(v) {
  if (!v) return '0.0.0';
  const s = String(v).trim().replace(/^v/i, '');
  const parts = s.split('.').map(p => parseInt(p, 10)).filter(n => !Number.isNaN(n));
  while (parts.length < 3) parts.push(0);
  return parts.slice(0, 3).join('.');
}

function compareVersions(a, b) {
  const ax = normalizeVersion(a).split('.').map(Number);
  const bx = normalizeVersion(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (ax[i] < bx[i]) return -1;
    if (ax[i] > bx[i]) return 1;
  }
  return 0;
}

async function fetchLatestReleaseInfo() {
  const url = 'https://api.github.com/repos/asura-cr/ui-addon/releases/latest';
  const res = await fetch(url, { headers: { 'Accept': 'application/vnd.github+json' } });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const data = await res.json();
  const tag = data.tag_name || data.name || '';
  return {
    version: normalizeVersion(tag || data.name || ''),
    url: data.html_url || 'https://github.com/asura-cr/ui-addon/releases/latest',
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
    // updates-auto-check UI removed; update UI reflects settings only
  } catch (e) {
    console.error('Failed to update Updates section UI:', e);
  }
}

function setupUpdateCheckerSettings() {
  try {
    updateUpdateSectionUI();
    const checkBtn = document.getElementById('check-updates-btn');
    const openBtn = document.getElementById('open-release-btn');
    checkBtn?.addEventListener('click', () => {
      checkForUpdates({ force: true, updateUI: true });
    });
    openBtn?.addEventListener('click', () => {
      const url = extensionSettings.updates?.latestUrl || 'https://github.com/asura-cr/ui-addon/releases/latest';
      window.open(url, '_blank');
    });
    // Auto-check toggle removed from UI; updates run automatically.
  } catch (e) {
    console.error('setupUpdateCheckerSettings error', e);
  }
}

function initializeExtension() {
  const version = (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getManifest === 'function')
    ? chrome.runtime.getManifest().version
    : (typeof browser !== 'undefined' && browser.runtime && typeof browser.runtime.getManifest === 'function')
      ? browser.runtime.getManifest().version
      : 'dev';
  console.log(`Demon Game Enhancement v${version} - Initializing...`);

  // Clean up any existing observers
  if (window.backgroundObserver) {
    window.backgroundObserver.disconnect();
    window.backgroundObserver = null;
  }

  // Load settings first
  safeExecute(() => loadSettings(), 'Load Settings');

  // Check for updates silently on startup (automatic)
  try {
    checkForUpdates({ force: false, updateUI: false });
  } catch (e) { console.warn('Startup update check skipped:', e); }

  // Initialize user data for battle modal system
  safeExecute(() => initUserData(), 'User Data Initialization');

  // Initialize sidebar
  safeExecute(() => initSideBar(), 'Sidebar Initialization');

  // Disable dragging on interactive elements
  safeExecute(() => initDraggableFalse(), 'Disable Dragging');

  // Initialize page-specific functionality
  safeExecute(() => initPageSpecificFunctionality(), 'Page-Specific Functionality');

  // Initialize semi-transparent persistence
  safeExecute(() => initSemiTransparentPersistence(), 'Semi-Transparent Persistence');

  // Initialize adventurers guild quests for all pages
  safeExecute(() => initAdventurersGuildQuests(), 'Adventurers Guild Quests');

  // Update sidebar quantities on all pages
  setTimeout(() => {
    safeExecute(() => updateSidebarInventorySection(), 'Sidebar Quantities');
  }, 1000);

  // Apply background images after a short delay to ensure DOM is ready
  setTimeout(() => {
    safeExecute(() => applyCustomBackgrounds(), 'Background Images');
    safeExecute(() => applySettings(), 'Apply Settings'); // Apply all settings including semi-transparent
    safeExecute(() => initFloatingPotionHelper(), 'Potion Helper');
    safeExecute(() => setupPotionHotkeys(), 'Potion Hotkeys');
    safeExecute(() => initFloatingLootHelper(), 'Loot Helper');
    safeExecute(() => initializePetTeams(), 'Pet Teams');
  }, 200);

  // Ensure semi-transparent effect persists with additional checks
  setTimeout(() => {
    safeExecute(() => ensureSemiTransparentPersistence(), 'Ensure Semi-Transparent Persistence');
  }, 500);

  setTimeout(() => {
    safeExecute(() => ensureSemiTransparentPersistence(), 'Final Semi-Transparent Check');
  }, 2000);

  console.log(`Demon Game Enhancement v${version} - Initialization Complete!`);
  console.log('Type debugExtension() in console for debug info');
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

  // Also try again after a longer delay to ensure elements are loaded
  setTimeout(() => {
    applyCustomBackgrounds();
    applyMonsterBackgrounds();
  }, 1000);

  // Try one more time after a longer delay for slow-loading pages
  setTimeout(() => {
    applyCustomBackgrounds();
    applyMonsterBackgrounds();
  }, 2000);
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

    console.log(`Adding pin buttons to ${inventoryItems.length} inventory items`);

    inventoryItems.forEach(item => {
      // Skip if already processed or is empty slot
      if (item.hasAttribute('data-pin-added') || item.querySelector('.empty')) return;

      // Extract item data properly from the DOM structure
      const itemData = extractInventoryItemData(item);
      if (!itemData) return;

      // Create pin button
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
        addToInventoryQuickAccess(itemData, item);
      };

      // Add button to the item's label section
      const labelDiv = item.querySelector('.label');
      if (labelDiv) {
        labelDiv.appendChild(pinBtn);
      } else {
        item.appendChild(pinBtn);
      }

      // Mark as processed
      item.setAttribute('data-pin-added', 'true');
    });
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

  // First try to fetch all items at once if we're on inventory page
  let allItems = null;
  if (window.location.pathname.includes('inventory.php')) {
    try {
      allItems = await getAllConsumableItems();
      console.log(`📦 Fetched ${allItems.length} items from current page for bulk refresh`);
    } catch (error) {
      console.log('⚠️ Failed to fetch items from current page, falling back to individual lookups');
    }
  }

  for (let item of extensionSettings.pinnedInventoryItems) {
    if (item.type === 'consumable') {
      try {
        let freshItem;

        // Try to find item in bulk data first (much faster)
        if (allItems) {
          freshItem = allItems.find(i => i.name && i.name.toLowerCase() === item.name.toLowerCase());
        }

        // Fallback to individual lookup if not found in bulk data or not on inventory page
        if (!freshItem) {
          freshItem = await findItemByName(item.name);
        }

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

// Get unique wave identifier from URL parameters
function getCurrentWaveKey() {
  const urlParams = new URLSearchParams(window.location.search);
  const wave = urlParams.get('wave') || '0';
  const event = urlParams.get('event') || '';
  const gate = urlParams.get('gate') || '';

  // Create unique key for this wave
  if (event) {
    return `event${event}_wave${wave}`;
  } else if (gate) {
    return `gate${gate}_wave${wave}`;
  } else {
    return `wave${wave}`;
  }
}

async function loadFilterSettings() {
  return new Promise((resolve) => {
    try {
      const currentWaveKey = getCurrentWaveKey();
      const allWaveSettings = JSON.parse(localStorage.getItem('demonGameFilterSettingsByWave') || '{}');
      const settings = allWaveSettings[currentWaveKey] || {};
      resolve(settings);
    } catch {
      resolve({});
    }
  });
}

async function initMonsterFilter() {
  const observer = new MutationObserver(async (mutations, obs) => {
    const monsterCards = document.querySelectorAll('.monster-card');
    if (monsterCards.length > 0) {
      obs.disconnect();

      // Ensure monsterList is populated
      if (monsterList.length === 0) {
        monsterList = await extractMonsters();
      }

      const settings = await loadFilterSettings();
      monsterFiltersSettings = settings;
      createFilterUI(monsterList, settings);
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function createFilterUI(monsterList, settings) {
  // Validate monsterList is an array
  if (!Array.isArray(monsterList)) {
    console.error('createFilterUI: monsterList is not an array', monsterList);
    return;
  }

  // Remove any existing filter UI to avoid duplicates
  const oldFilter = document.getElementById('monster-filter-container');
  if (oldFilter && oldFilter.parentNode) oldFilter.parentNode.removeChild(oldFilter);

  // Auto-detect unique monster types from the current page
  const uniqueMonsters = new Set();
  monsterList.forEach(monster => {
    if (monster && monster.name) {
      uniqueMonsters.add(monster.name);
    }
  });

  // Sort monsters alphabetically
  const sortedMonsters = Array.from(uniqueMonsters).sort();

  // Build monster type checkboxes HTML dynamically
  let monsterCheckboxesHtml = '';
  if (sortedMonsters.length > 0) {
    sortedMonsters.forEach(monsterName => {
      monsterCheckboxesHtml += `
          <label style="display: block; margin: 3px 0; color: #cdd6f4; font-size: 12px;">
            <input type="checkbox" value="${monsterName}" class="monster-type-checkbox cyberpunk-checkbox"> ${monsterName}
          </label>
        `;
    });
    monsterCheckboxesHtml += `
        <div style="margin-top: 8px; padding-top: 5px; border-top: 1px solid #45475a;">
          <button id="select-all-monsters" style="padding: 3px 8px; background: #a6e3a1; color: #1e1e2e; border: none; border-radius: 3px; cursor: pointer; font-size: 11px; margin-right: 5px;">Select All</button>
          <button id="clear-monsters" style="padding: 3px 8px; background: #f38ba8; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">Clear</button>
        </div>
      `;
  } else {
    monsterCheckboxesHtml = '<div style="color: #6c7086; padding: 10px; text-align: center;">No monsters found on page</div>';
  }

  const filterContainer = document.createElement('div');
  filterContainer.id = 'monster-filter-container';
  filterContainer.style.cssText = `
      padding: 10px;
      background: #2d2d3d;
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
        <input type="text" id="monster-name-filter" placeholder="Filter by name"
               style="padding: 5px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; min-width: 150px;">
        
        <div style="position: relative; display: inline-block;">
          <button id="monster-type-toggle" style="padding: 5px 10px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; cursor: pointer; min-width: 120px; text-align: left;">
            Monster Types ▼
          </button>
          <div id="monster-type-dropdown" style="display: none; position: absolute; top: 100%; left: 0; background: #1e1e2e; border: 1px solid #45475a; border-radius: 4px; padding: 10px; z-index: 1000; min-width: 200px; max-height: 300px; overflow-y: auto;">
            ${monsterCheckboxesHtml}
          </div>
        </div>
        
        <select id="hp-filter" style="padding: 5px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; min-width: 100px;">
          <option value="">All HP</option>
          <option value="low">Low HP (&lt;50%)</option>
          <option value="medium">Medium HP (50-80%)</option>
          <option value="high">High HP (&gt;80%)</option>
          <option value="full">Full HP (100%)</option>
        </select>
        
        <select id="player-count-filter" style="padding: 5px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; min-width: 100px;">
          <option value="">All Players</option>
          <option value="empty">Empty (0 players)</option>
          <option value="few">Few (&lt;10 players)</option>
          <option value="many">Many (&gt;20 players)</option>
          <option value="full">Full (30 players)</option>
        </select>
        
        <!-- Hidden select kept for backwards compatibility; its value will be updated by the ranked UI -->
        <input type="hidden" id="monster-sort" value="">

        <!-- Ranked priority UI (styled to match other dropdowns) -->
        <div style="position: relative; display: inline-block;">
          <button id="monster-priority-toggle" style="padding: 5px 10px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; cursor: pointer; min-width: 120px; text-align: left; display: flex; justify-content: space-between; align-items: center;">
            <span id="monster-priority-text">Set Priority</span>
            <span id="monster-priority-arrow">▼</span>
          </button>
          <div id="monster-priority-dropdown" style="display: none; position: absolute; top: 100%; left: 0; background: #1e1e2e; border: 1px solid #45475a; border-radius: 4px; padding: 10px; z-index: 1000; min-width: 250px; max-height: 300px; overflow-y: auto;">
            <!-- Priority options populated by JS -->
          </div>
        </div>
        
      <label style="display: flex; align-items: center; gap: 5px; color: #cdd6f4;">
          <input type="checkbox" id="hide-img-monsters" class="cyberpunk-checkbox">
        Hide images
      </label>
      
      <label style="display: flex; align-items: center; gap: 5px; color: #cdd6f4;">
        <input type="checkbox" id="wave-auto-refresh-toggle" class="cyberpunk-checkbox" ${extensionSettings.waveAutoRefresh?.enabled ? 'checked' : ''}>
        🔄 Auto-refresh
      </label>
      
      <label style="display: flex; align-items: center; gap: 5px; color: #cdd6f4; opacity: ${extensionSettings.waveAutoRefresh?.enabled ? '1' : '0.5'};">
        <input type="checkbox" id="wave-hard-refresh-toggle" class="cyberpunk-checkbox" ${extensionSettings.waveAutoRefresh?.useHardRefresh ? 'checked' : ''} ${!extensionSettings.waveAutoRefresh?.enabled ? 'disabled' : ''}>
        ⚡ Hard refresh
      </label>
        
      <label style="display: flex; align-items: center; gap: 5px; color: #cdd6f4;">
          <input type="checkbox" id="battle-limit-alarm" class="cyberpunk-checkbox">
        Battle limit alarm
        <br>
          <input type="checkbox" id="battle-limit-alarm-sound" class="cyberpunk-checkbox" checked>
        <label for="battle-limit-alarm-sound" style="color: #cdd6f4; font-size: 12px;">🔊 Play alarm sound</label>
        <br>
        <div style="display: flex; align-items: center; gap: 5px; margin-top: 5px;">
          <label for="battle-limit-alarm-volume" style="color: #cdd6f4; font-size: 12px;">Volume:</label>
          <input type="range" id="battle-limit-alarm-volume" min="10" max="100" value="70" style="width: 80px;">
          <span id="battle-limit-alarm-volume-display" style="color: #cdd6f4; font-size: 12px; min-width: 30px;">70%</span>
        </div>
      </label>
        
        <button id="clear-filters" style="padding: 5px 10px; background: #f38ba8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
          Clear All
        </button>
        
        <button id="loot-filtered-btn" style="padding: 5px 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
          💰 Loot All (0)
        </button>
        
        <button id="view-toggle-btn" style="padding: 5px 10px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
          📋 List View
        </button>
      </div>
    `;

  const contentArea = document.querySelector('.content-area');
  const monsterContainer = document.querySelector('.monster-container');
  if (contentArea && monsterContainer) {
    contentArea.insertBefore(filterContainer, monsterContainer);
  } else {
    // Fallback: insert before monster container's parent or at the top of bod 
    const fallbackParent = monsterContainer?.parentElement || contentArea || document.body;
    if (monsterContainer) {
      fallbackParent.insertBefore(filterContainer, monsterContainer);
    } else {
      fallbackParent.insertBefore(filterContainer, fallbackParent.firstChild);
    }
  }

  // Add CSS styles for priority selector
  const priorityStyle = document.createElement('style');
  priorityStyle.textContent = `
      .ranked-select {
        position: relative;
      }
      .ranked-select.open .select-options {
        display: block !important;
      }
      .ranked-select.open .arrow {
        transform: rotate(180deg);
      }
      .ranked-select .arrow {
        transition: transform 0.3s ease;
      }
      #monster-priority-options .category {
        font-weight: bold;
        color: #cba6f7;
        padding: 8px 12px;
        background: rgba(203, 166, 247, 0.1);
        margin-bottom: 4px;
        border-radius: 4px;
      }
      #monster-priority-options .option {
        padding: 8px 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        border-radius: 4px;
        margin: 2px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      #monster-priority-options .option:hover {
        background: rgba(137, 180, 250, 0.2);
      }
      #monster-priority-options .option.selected {
        background: linear-gradient(135deg, rgba(166, 227, 161, 0.3) 0%, rgba(148, 226, 213, 0.3) 100%);
        border-left: 3px solid #a6e3a1;
        padding-left: 9px;
        font-weight: 600;
        color: #a6e3a1;
      }
      #monster-priority-options .option .rank {
        display: inline-block;
        min-width: 24px;
        height: 24px;
        line-height: 24px;
        text-align: center;
        background: #f9e2af;
        color: #1e1e2e;
        border-radius: 50%;
        font-weight: bold;
        font-size: 11px;
        margin-left: 8px;
      }
      #monster-priority-summary {
        padding: 8px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
        border-left: 3px solid #89b4fa;
      }
    `;
  document.head.appendChild(priorityStyle);

  // Add event listeners for all filter elements
  document.getElementById('monster-name-filter').addEventListener('input', applyMonsterFilters);
  document.getElementById('hp-filter').addEventListener('change', applyMonsterFilters);
  document.getElementById('player-count-filter').addEventListener('change', applyMonsterFilters);

  // Hidden input kept for backwards compatibility
  const monsterSortEl = document.getElementById('monster-sort');

  // Build the priority system UI
  const priorityToggle = document.getElementById('monster-priority-toggle');
  const priorityDropdown = document.getElementById('monster-priority-dropdown');
  const priorityText = document.getElementById('monster-priority-text');
  const priorityArrow = document.getElementById('monster-priority-arrow');

  // Get unique monsters from the page for priority dropdown
  const priorityMonsters = Array.isArray(monsterList)
    ? Array.from(new Set(monsterList.filter(m => m && m.name).map(m => m.name))).sort()
    : [];

  // Priority order array
  let priorityOrder = [];

  // Build priority dropdown options
  function buildPriorityDropdown() {
    if (!priorityDropdown) return;
    priorityDropdown.innerHTML = '';

    if (priorityMonsters.length === 0) {
      priorityDropdown.innerHTML = '<div style="color: #6c7086; padding: 10px; text-align: center;">No monsters available</div>';
      return;
    }

    priorityMonsters.forEach(monsterName => {
      const option = document.createElement('div');
      option.className = 'priority-option';
      option.dataset.monster = monsterName.toLowerCase();
      option.style.cssText = `
          padding: 8px 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 4px;
          margin: 2px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #cdd6f4;
        `;

      const nameSpan = document.createElement('span');
      nameSpan.textContent = monsterName;

      const rankSpan = document.createElement('span');
      rankSpan.className = 'rank-badge';
      rankSpan.style.cssText = `
          display: none;
          min-width: 24px;
          height: 24px;
          line-height: 24px;
          text-align: center;
          background: #f9e2af;
          color: #1e1e2e;
          border-radius: 50%;
          font-weight: bold;
          font-size: 11px;
        `;

      option.appendChild(nameSpan);
      option.appendChild(rankSpan);

      option.addEventListener('mouseenter', () => {
        if (!option.classList.contains('selected')) {
          option.style.background = 'rgba(137, 180, 250, 0.2)';
        }
      });

      option.addEventListener('mouseleave', () => {
        if (!option.classList.contains('selected')) {
          option.style.background = 'transparent';
        }
      });

      option.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePriority(monsterName.toLowerCase(), option);
      });

      priorityDropdown.appendChild(option);
    });
  }

  function togglePriority(monsterName, optionElement) {
    const index = priorityOrder.indexOf(monsterName);

    if (index > -1) {
      // Remove from priority
      priorityOrder.splice(index, 1);
      optionElement.classList.remove('selected');
      optionElement.style.background = 'transparent';
      optionElement.style.borderLeft = 'none';
      optionElement.style.paddingLeft = '12px';
      optionElement.style.fontWeight = 'normal';
      optionElement.style.color = '#cdd6f4';
      const badge = optionElement.querySelector('.rank-badge');
      if (badge) badge.style.display = 'none';
    } else {
      // Add to priority
      priorityOrder.push(monsterName);
      optionElement.classList.add('selected');
      optionElement.style.background = 'linear-gradient(135deg, rgba(166, 227, 161, 0.3) 0%, rgba(148, 226, 213, 0.3) 100%)';
      optionElement.style.borderLeft = '3px solid #a6e3a1';
      optionElement.style.paddingLeft = '9px';
      optionElement.style.fontWeight = '600';
      optionElement.style.color = '#a6e3a1';
    }

    updatePriorityDisplay();
  }

  function updatePriorityDisplay() {
    // Update rank badges
    priorityDropdown.querySelectorAll('.priority-option').forEach(opt => {
      const monsterName = opt.dataset.monster;
      const badge = opt.querySelector('.rank-badge');
      const index = priorityOrder.indexOf(monsterName);

      if (index > -1) {
        badge.textContent = index + 1;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    });

    // Update button text
    if (priorityOrder.length === 0) {
      priorityText.textContent = 'Set Priority';
    } else if (priorityOrder.length === 1) {
      // Get the display name from the current dropdown options
      const firstOption = priorityDropdown.querySelector(`[data-monster="${priorityOrder[0]}"]`);
      const displayName = firstOption ? firstOption.querySelector('span').textContent : priorityOrder[0];
      priorityText.textContent = `Priority: ${displayName}`;
    } else {
      priorityText.textContent = `Priority: ${priorityOrder.length} set`;
    }

    // Update hidden sort input
    monsterSortEl.value = priorityOrder.length > 0 ? 'ranked:' + priorityOrder.join('|') : '';

    // Save to localStorage
    try {
      localStorage.setItem('monsterPriorityOrder', monsterSortEl.value);
    } catch (e) {
      console.error('Failed to save priority order:', e);
    }

    // Apply filters immediately
    applyMonsterFilters();
  }

  // Toggle dropdown
  if (priorityToggle) {
    priorityToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = priorityDropdown.style.display === 'block';
      priorityDropdown.style.display = isVisible ? 'none' : 'block';
      priorityArrow.textContent = isVisible ? '▼' : '▲';
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (priorityDropdown && !priorityToggle.contains(e.target) && !priorityDropdown.contains(e.target)) {
      priorityDropdown.style.display = 'none';
      priorityArrow.textContent = '▼';
    }
  });

  // Build the priority dropdown
  buildPriorityDropdown();

  // Restore previous priority order from localStorage
  try {
    const stored = localStorage.getItem('monsterPriorityOrder') || '';
    if (stored && stored.startsWith('ranked:')) {
      const arr = stored.slice(7).split('|').filter(Boolean);
      // Only restore priorities for monsters that exist on current page
      priorityOrder = arr.filter(m => priorityMonsters.some(pm => pm.toLowerCase() === m));

      // Update UI to reflect restored priorities
      priorityOrder.forEach(monsterName => {
        const option = priorityDropdown.querySelector(`[data-monster="${monsterName}"]`);
        if (option) {
          option.classList.add('selected');
          option.style.background = 'linear-gradient(135deg, rgba(166, 227, 161, 0.3) 0%, rgba(148, 226, 213, 0.3) 100%)';
          option.style.borderLeft = '3px solid #a6e3a1';
          option.style.paddingLeft = '9px';
          option.style.fontWeight = '600';
          option.style.color = '#a6e3a1';
        }
      });

      updatePriorityDisplay();
    }
  } catch (e) {
    console.error('Failed to restore priority order:', e);
  }

  // Expose function to refresh priority dropdown with new monster list
  window.updateMonsterPriorityDropdown = function (newMonsterList) {
    if (!Array.isArray(newMonsterList) || !priorityDropdown) return;

    // Update priorityMonsters array with new list
    const newPriorityMonsters = Array.from(new Set(newMonsterList.filter(m => m && m.name).map(m => m.name))).sort();

    // Auto-add new monsters that match existing priority patterns
    // For example, if "goblin shaman" is prioritized, auto-add "goblin scout"
    newPriorityMonsters.forEach(monsterName => {
      const lowerName = monsterName.toLowerCase();
      // Check if this monster matches any existing priority pattern
      const matchesPriority = priorityOrder.some(priority => {
        // Extract base monster type (first word typically)
        const priorityBase = priority.split(' ')[0];
        return lowerName.includes(priorityBase) && !priorityOrder.includes(lowerName);
      });

      // If it matches a priority pattern and isn't already in the list, add it
      if (matchesPriority) {
        // Find the best matching priority to insert after
        let insertIndex = -1;
        for (let i = 0; i < priorityOrder.length; i++) {
          const priorityBase = priorityOrder[i].split(' ')[0];
          if (lowerName.includes(priorityBase)) {
            // Insert after the last monster of this type
            insertIndex = i + 1;
            // Look ahead to see if there are more of this type
            while (insertIndex < priorityOrder.length &&
              priorityOrder[insertIndex].includes(priorityBase)) {
              insertIndex++;
            }
            break;
          }
        }

        if (insertIndex > -1) {
          priorityOrder.splice(insertIndex, 0, lowerName);
          console.log(`[Priority] Auto-added ${monsterName} to priority list at position ${insertIndex + 1}`);
        }
      }
    });

    // DON'T filter priority order - keep all priorities even if monsters temporarily disappeared
    // This allows priorities to persist when monsters come and go

    // Rebuild dropdown with new monsters
    priorityDropdown.innerHTML = '';

    if (newPriorityMonsters.length === 0) {
      priorityDropdown.innerHTML = '<div style="color: #6c7086; padding: 10px; text-align: center;">No monsters available</div>';
      return;
    }

    newPriorityMonsters.forEach(monsterName => {
      const option = document.createElement('div');
      option.className = 'priority-option';
      option.dataset.monster = monsterName.toLowerCase();
      option.style.cssText = `
          padding: 8px 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 4px;
          margin: 2px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #cdd6f4;
        `;

      const nameSpan = document.createElement('span');
      nameSpan.textContent = monsterName;

      const rankSpan = document.createElement('span');
      rankSpan.className = 'rank-badge';
      rankSpan.style.cssText = `
          display: none;
          min-width: 24px;
          height: 24px;
          line-height: 24px;
          text-align: center;
          background: #f9e2af;
          color: #1e1e2e;
          border-radius: 50%;
          font-weight: bold;
          font-size: 11px;
          margin-left: 8px;
        `;

      option.appendChild(nameSpan);
      option.appendChild(rankSpan);

      // Check if this monster is in priority order
      const priorityIndex = priorityOrder.findIndex(p => p.toLowerCase() === monsterName.toLowerCase());
      if (priorityIndex > -1) {
        option.classList.add('selected');
        option.style.background = 'linear-gradient(135deg, rgba(166, 227, 161, 0.3) 0%, rgba(148, 226, 213, 0.3) 100%)';
        option.style.borderLeft = '3px solid #a6e3a1';
        option.style.paddingLeft = '9px';
        option.style.fontWeight = '600';
        option.style.color = '#a6e3a1';
        rankSpan.textContent = (priorityIndex + 1);
        rankSpan.style.display = 'inline-block';
      }

      option.addEventListener('click', () => togglePriority(monsterName.toLowerCase(), option));
      priorityDropdown.appendChild(option);
    });

    // Update display
    updatePriorityDisplay();
  };

  // Expose clear function for clearAllFilters button
  window.clearMonsterPrioritySelections = function () {
    priorityOrder = [];
    updatePriorityDisplay();

    // Clear all selected states in dropdown
    priorityDropdown.querySelectorAll('.priority-option').forEach(option => {
      option.classList.remove('selected');
      option.style.background = '';
      option.style.borderLeft = '';
      option.style.paddingLeft = '';
      option.style.fontWeight = '';
      option.style.color = '';
      const badge = option.querySelector('.priority-badge');
      if (badge) badge.style.display = 'none';
    });

    localStorage.setItem('monsterPriorityOrder', '');
  };

  // Keep backward compatibility: if legacy select changed elsewhere, trigger filters
  monsterSortEl.addEventListener('change', applyMonsterFilters);
  document.getElementById('hide-img-monsters').addEventListener('change', applyMonsterFilters);

  // Wave auto-refresh toggle handlers
  const waveAutoRefreshCheckbox = document.getElementById('wave-auto-refresh-toggle');
  const waveHardRefreshCheckbox = document.getElementById('wave-hard-refresh-toggle');

  if (waveAutoRefreshCheckbox) {
    waveAutoRefreshCheckbox.addEventListener('change', function () {
      extensionSettings.waveAutoRefresh.enabled = this.checked;
      saveSettings();

      // Enable/disable hard refresh toggle based on auto-refresh state
      if (waveHardRefreshCheckbox) {
        waveHardRefreshCheckbox.disabled = !this.checked;
        waveHardRefreshCheckbox.parentElement.style.opacity = this.checked ? '1' : '0.5';
      }

      // Restart or stop auto-refresh
      if (this.checked) {
        initWaveAutoRefresh();
      } else {
        stopWaveAutoRefresh();
      }

      showNotification(this.checked ? 'Auto-refresh enabled' : 'Auto-refresh disabled', 'success');
    });
  }

  if (waveHardRefreshCheckbox) {
    waveHardRefreshCheckbox.addEventListener('change', function () {
      extensionSettings.waveAutoRefresh.useHardRefresh = this.checked;
      saveSettings();

      showNotification(this.checked ? 'Using hard refresh (full reload)' : 'Using soft refresh (fast update)', 'success');

      // Restart auto-refresh with new setting
      if (extensionSettings.waveAutoRefresh.enabled) {
        stopWaveAutoRefresh();
        setTimeout(() => {
          initWaveAutoRefresh();
        }, 200);
      }
    });
  }

  document.getElementById('battle-limit-alarm').addEventListener('change', (e) => {
    const soundCheckbox = document.getElementById('battle-limit-alarm-sound');
    if (e.target.checked) {
      soundCheckbox.checked = true;
      soundCheckbox.disabled = false;
    } else {
      soundCheckbox.checked = false;
      soundCheckbox.disabled = true;
    }
    applyMonsterFilters();
  });

  document.getElementById('battle-limit-alarm-sound').addEventListener('change', applyMonsterFilters);

  // Volume control
  const volumeSlider = document.getElementById('battle-limit-alarm-volume');
  const volumeDisplay = document.getElementById('battle-limit-alarm-volume-display');
  if (volumeSlider && volumeDisplay) {
    volumeSlider.addEventListener('input', (e) => {
      volumeDisplay.textContent = e.target.value + '%';
      applyMonsterFilters();
    });
  }
  document.getElementById('clear-filters').addEventListener('click', clearAllFilters);

  // Loot All button handler (works with current filters)
  document.getElementById('loot-filtered-btn').addEventListener('click', async () => {
    const lootButton = document.getElementById('loot-filtered-btn');

    // Gather current filter state
    const nameFilter = (document.getElementById('monster-name-filter')?.value || '').trim().toLowerCase();
    const selectedMonsterTypes = Array.from(document.querySelectorAll('.monster-type-checkbox:checked')).map(cb => cb.value);
    const selectedLootItems = Array.from(document.querySelectorAll('.loot-filter-checkbox:checked')).map(cb => cb.value.toLowerCase());
    const hpFilter = document.getElementById('hp-filter')?.value || '';
    const playerCountFilter = document.getElementById('player-count-filter')?.value || '';

    const normalizeLootName = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const selectedLootSet = new Set(selectedLootItems.map(normalizeLootName));

    const getHpPercent = (card) => {
      // First try data attributes (new format)
      const currentHp = card.getAttribute('data-current-hp');
      const maxHp = card.getAttribute('data-max-hp');
      if (currentHp && maxHp) {
        const cur = parseFloat(currentHp);
        const max = parseFloat(maxHp);
        if (!isNaN(cur) && !isNaN(max) && max > 0) {
          return (cur / max) * 100;
        }
      }
      
      // Fallback to old format
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
      } catch { }
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
      console.log('Fetching monsters from:', url);
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const cards = doc.querySelectorAll('.monster-container .monster-card');
      console.log('Found monster cards:', cards.length);
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
        
        // Monster type filter
        if (selectedMonsterTypes.length > 0) {
          const matchesType = selectedMonsterTypes.some(type =>
            nameLower.includes(type.toLowerCase())
          );
          if (!matchesType) return;
        }

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
      console.log('Monsters to loot after filtering:', monsterIdsToLoot.length);
    } catch (e) {
      console.error('Error loading monsters:', e);
      showNotification(`Failed to load monsters for looting: ${e.message}`, 'error');
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
    if (!confirm(`Ready to loot ${targetCount} monster${targetCount !== 1 ? 's' : ''}?`)) {
      return;
    }

    // Disable button and show loading state
    lootButton.disabled = true;
    lootButton.innerText = '⏳ Looting...';
    lootButton.style.opacity = '0.7';

    // Select targetCount monster IDs
    const monsterIds = monsterIdsToLoot.slice(0, targetCount);

    if (monsterIds.length === 0) {
      showNotification('No valid monster IDs found!', 'error');
      lootButton.disabled = false;
      lootButton.innerText = '💰 Loot All';
      lootButton.style.opacity = '1';
      return;
    }

    // Start looting process
    try {
      let successCount = 0;
      let errorCount = 0;
      let allLootItems = [];

      // Loot all monsters in parallel for maximum speed
      const promises = monsterIds.map(monsterId =>
        fetch('loot.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `monster_id=${monsterId}&user_id=${userId}`
        }).then(res => res.json())
          .then(data => ({ monsterId, data }))
          .catch(err => ({ monsterId, error: err }))
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        if (result.data && result.data.status === 'success' && result.data.items) {
          successCount++;
          allLootItems = allLootItems.concat(result.data.items);
          if (result.monsterId) lootedMonsters.add(result.monsterId);
        } else {
          errorCount++;
          if (result.error) {
            console.error(`Error looting monster ${result.monsterId}:`, result.error);
          }
        }
      });

      // Show results
      if (successCount > 0) {
        showNotification(`Successfully looted ${successCount} monster${successCount !== 1 ? 's' : ''}!${errorCount > 0 ? ` (${errorCount} failed)` : ''}`, 'success');

        // Show loot items in modal if available
        if (allLootItems.length > 0) {
          // Count duplicate items
          const itemCounts = {};
          allLootItems.forEach(item => {
            const name = item.NAME || item.name || 'Unknown Item';
            if (!itemCounts[name]) {
              itemCounts[name] = { count: 0, item: item };
            }
            itemCounts[name].count++;
          });

          // Create or get modal
          let lootModal = document.getElementById('lootModal');
          if (!lootModal) {
            lootModal = document.createElement('div');
            lootModal.id = 'lootModal';
            lootModal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:10000; justify-content:center; align-items:center;';
            document.body.appendChild(lootModal);
          }

          lootModal.innerHTML = `
              <div class="loot-modal-content" style="background:#2a2a3d; border-radius:12px; padding:20px; max-width:90%; width:400px; text-align:center; color:white; overflow-y:auto; max-height:80%; box-shadow:0 8px 16px rgba(0,0,0,0.5);">
                <h2 style="margin-bottom:15px; font-size:18px;">🎁 Loot Gained from ${successCount} Monster${successCount !== 1 ? 's' : ''}</h2>
                <div id="lootItems" style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px;">
                  ${Object.values(itemCounts).map(({ count, item }) => `
                    <div class="loot-item" style="background:#1e1e2f; border-radius:8px; padding:10px; text-align:center; width:80px;">
                      <img src="${item.IMAGE_URL || item.image_url || ''}" alt="${item.NAME || item.name}" style="width:64px; height:64px; border-radius:4px;">
                      <small style="font-size:12px; color:#ccc;">${item.NAME || item.name}</small>
                      ${count > 1 ? `<br><small style="color: #4CAF50; font-weight: bold;">x${count}</small>` : ''}
                    </div>
                  `).join('')}
                </div>
                <button class="modal-close-btn" style="margin-top:10px; background:linear-gradient(to right, #3498db, #2980b9); border:none; color:white; padding:8px 16px; border-radius:6px; cursor:pointer; font-size:14px; transition:background 0.2s ease;">Close</button>
              </div>
            `;

          // Add close button handler
          lootModal.querySelector('.modal-close-btn').addEventListener('click', () => {
            lootModal.style.display = 'none';
          });

          // Close on backdrop click
          lootModal.addEventListener('click', (e) => {
            if (e.target === lootModal) {
              lootModal.style.display = 'none';
            }
          });

          lootModal.style.display = 'flex';
        }

        // Re-apply filters after a delay to update counts
        setTimeout(() => {
          applyMonsterFilters();
        }, 1500);

        // Update server-based loot count after looting
        if (typeof updateLootCountFromServer === 'function') {
          setTimeout(() => updateLootCountFromServer(), 800);
        }

      } else {
        showNotification('No loot was claimed!', 'error');
      }

    } catch (error) {
      console.error('Error looting all monsters:', error);
      showNotification('Server error. Please try again.', 'error');
    } finally {
      lootButton.disabled = false;
      lootButton.style.opacity = '1';
      // Count will be updated by applyMonsterFilters
    }
  });

  // View toggle button handler
  const viewToggleBtn = document.getElementById('view-toggle-btn');
  if (viewToggleBtn) {
    // Get current view mode from localStorage
    let viewMode = localStorage.getItem('monsterViewMode') || 'card';
    viewToggleBtn.textContent = viewMode === 'card' ? '📋 List View' : '🃏 Card View';

    // Apply initial view mode
    if (viewMode === 'list') {
      toggleMonsterView('list');
    }

    viewToggleBtn.addEventListener('click', function () {
      viewMode = viewMode === 'card' ? 'list' : 'card';
      localStorage.setItem('monsterViewMode', viewMode);
      this.textContent = viewMode === 'card' ? '📋 List View' : '🃏 Card View';

      // Apply the view mode
      toggleMonsterView(viewMode);
    });
  }

  // Monster type dropdown functionality
  const monsterTypeToggle = document.getElementById('monster-type-toggle');
  const monsterTypeDropdown = document.getElementById('monster-type-dropdown');

  if (monsterTypeToggle && monsterTypeDropdown) {
    monsterTypeToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      monsterTypeDropdown.style.display = monsterTypeDropdown.style.display === 'none' ? 'block' : 'none';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      monsterTypeDropdown.style.display = 'none';
    });

    // Monster type checkbox listeners
    document.querySelectorAll('.monster-type-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', applyMonsterFilters);
    });

    // Select all and clear buttons for monster types
    const selectAllBtn = document.getElementById('select-all-monsters');
    const clearBtn = document.getElementById('clear-monsters');
    
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.monster-type-checkbox').forEach(checkbox => {
          checkbox.checked = true;
        });
        applyMonsterFilters();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        document.querySelectorAll('.monster-type-checkbox').forEach(checkbox => {
          checkbox.checked = false;
        });
        applyMonsterFilters();
      });
    }
  }

  // Initialize filter values from settings
  if (settings.nameFilter) document.getElementById('monster-name-filter').value = settings.nameFilter;
  if (settings.hpFilter) document.getElementById('hp-filter').value = settings.hpFilter;
  if (settings.playerCountFilter) document.getElementById('player-count-filter').value = settings.playerCountFilter;
  if (settings.sortBy) document.getElementById('monster-sort').value = settings.sortBy;
  if (settings.hideImg) document.getElementById('hide-img-monsters').checked = settings.hideImg;
  if (settings.battleLimitAlarm) {
    document.getElementById('battle-limit-alarm').checked = settings.battleLimitAlarm;
    const soundCheckbox = document.getElementById('battle-limit-alarm-sound');
    if (settings.battleLimitAlarmSound !== undefined) {
      soundCheckbox.checked = settings.battleLimitAlarmSound;
    }
    soundCheckbox.disabled = !settings.battleLimitAlarm;

    // Set volume
    const volumeSlider = document.getElementById('battle-limit-alarm-volume');
    const volumeDisplay = document.getElementById('battle-limit-alarm-volume-display');
    if (volumeSlider && volumeDisplay) {
      const volume = settings.battleLimitAlarmVolume || 70;
      volumeSlider.value = volume;
      volumeDisplay.textContent = volume + '%';
    }
  }

  // Initialize monster type checkboxes
  if (settings.monsterTypeFilter && Array.isArray(settings.monsterTypeFilter)) {
    settings.monsterTypeFilter.forEach(monsterType => {
      const checkbox = document.querySelector(`.monster-type-checkbox[value="${monsterType}"]`);
      if (checkbox) checkbox.checked = true;
    });
  }

  // Apply filters if any are set
  if (settings.nameFilter || (settings.monsterTypeFilter && settings.monsterTypeFilter.length > 0) || settings.hpFilter || settings.playerCountFilter || settings.sortBy || settings.hideImg || settings.battleLimitAlarm) {
    applyMonsterFilters();
  }
}

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

function applyMonsterFilters() {
  const nameFilter = document.getElementById('monster-name-filter').value.toLowerCase();
  const hpFilter = document.getElementById('hp-filter').value;
  const playerCountFilter = document.getElementById('player-count-filter').value;
  const sortBy = document.getElementById('monster-sort').value;
  // If the hidden sort value encodes a ranked priority (prefixed with 'ranked:'), parse it
  let rankedOrder = null;
  if (sortBy && sortBy.startsWith('ranked:')) {
    rankedOrder = sortBy.slice(7).split('|').filter(Boolean);
  }
  const hideImg = document.getElementById('hide-img-monsters').checked;
  const battleLimitAlarm = document.getElementById('battle-limit-alarm').checked;
  const battleLimitAlarmSound = document.getElementById('battle-limit-alarm-sound').checked;
  const battleLimitAlarmVolume = parseInt(document.getElementById('battle-limit-alarm-volume').value, 10);

  // Get selected monster types
  const selectedMonsterTypes = Array.from(document.querySelectorAll('.monster-type-checkbox:checked')).map(cb => cb.value);

  // Update monster type button text
  const monsterTypeToggle = document.getElementById('monster-type-toggle');
  if (monsterTypeToggle) {
    if (selectedMonsterTypes.length === 0) {
      monsterTypeToggle.textContent = 'Monster Types ▼';
    } else if (selectedMonsterTypes.length === 1) {
      monsterTypeToggle.textContent = `${selectedMonsterTypes[0]} ▼`;
    } else {
      monsterTypeToggle.textContent = `${selectedMonsterTypes.length} Types ▼`;
    }
  }

  if (battleLimitAlarm) {
    alarmInterval = setInterval(() => {
      location.reload();
    }, 5000);
  } else {
    clearInterval(alarmInterval);
  }

  const monsterContainer = document.querySelector('.monster-container');
  if (!monsterContainer) return;

  const isListView = monsterContainer.classList.contains('list-view');
  const monsters = isListView ? document.querySelectorAll('tbody tr') : document.querySelectorAll('.monster-card');

  // Convert to array for sorting
  let monstersArray = Array.from(monsters);

  // Apply sorting if specified
  if (sortBy) {
    monstersArray.sort((a, b) => {
      let aValue, bValue;

      if (isListView) {
        // For list view, get data from table cells
        const aCells = a.querySelectorAll('td');
        const bCells = b.querySelectorAll('td');

        // If a ranked priority was set, prioritize according to the ranked list
        if (rankedOrder) {
          const targetA = aCells ? (aCells[1]?.textContent?.toLowerCase() || '') : '';
          const targetB = bCells ? (bCells[1]?.textContent?.toLowerCase() || '') : '';
          const getIdx = (text) => {
            for (let i = 0; i < rankedOrder.length; i++) {
              if (text.includes(rankedOrder[i])) return i;
            }
            return rankedOrder.length + 1; // Not in priority list
          };
          const ia = getIdx(targetA);
          const ib = getIdx(targetB);

          // If different priority ranks, sort by priority
          if (ia !== ib) return ia - ib;

          // If both are NOT in priority list, sort by HP ascending
          if (ia > rankedOrder.length && ib > rankedOrder.length) {
            const aHpText = aCells[2]?.textContent || '';
            const bHpText = bCells[2]?.textContent || '';
            const aHpMatch = aHpText.match(/([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
            const bHpMatch = bHpText.match(/([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
            const aHpPercent = aHpMatch ? parseInt(aHpMatch[1].replace(/,/g, '')) / parseInt(aHpMatch[2].replace(/,/g, '')) : 0;
            const bHpPercent = bHpMatch ? parseInt(bHpMatch[1].replace(/,/g, '')) / parseInt(bHpMatch[2].replace(/,/g, '')) : 0;
            return aHpPercent - bHpPercent;
          }

          // If same priority rank, sort by HP ascending within that group
          const aHpTextTie = aCells[2]?.textContent || '';
          const bHpTextTie = bCells[2]?.textContent || '';
          const aHpMatchTie = aHpTextTie.match(/([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
          const bHpMatchTie = bHpTextTie.match(/([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
          const aValTie = aHpMatchTie ? parseInt(aHpMatchTie[1].replace(/,/g, '')) / parseInt(aHpMatchTie[2].replace(/,/g, '')) : 0;
          const bValTie = bHpMatchTie ? parseInt(bHpMatchTie[1].replace(/,/g, '')) / parseInt(bHpMatchTie[2].replace(/,/g, '')) : 0;
          return aValTie - bValTie;
        }
        // If a monster-specific sort is selected (format: monster:<name>), prioritize matches
        if (sortBy.startsWith('monster:')) {
          const target = sortBy.replace('monster:', '').toLowerCase();
          const aText = aCells ? (aCells[1]?.textContent?.toLowerCase() || '') : '';
          const bText = bCells ? (bCells[1]?.textContent?.toLowerCase() || '') : '';
          const aMatch = aText.includes(target) ? 0 : 1;
          const bMatch = bText.includes(target) ? 0 : 1;
          return aMatch - bMatch;
        }

        switch (sortBy) {
          case 'wave1-first':
            const aWave1 = getMonsterWave(aCells[1]?.textContent?.toLowerCase() || '');
            const bWave1 = getMonsterWave(bCells[1]?.textContent?.toLowerCase() || '');
            if (aWave1 !== bWave1) return aWave1 - bWave1;
            // Within same wave, sort by HP ascending
            const aHpTextType1 = aCells[2]?.textContent || '';
            const bHpTextType1 = bCells[2]?.textContent || '';
            const aHpMatchType1 = aHpTextType1.match(/([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
            const bHpMatchType1 = bHpTextType1.match(/([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
            aValue = aHpMatchType1 ? parseInt(aHpMatchType1[1].replace(/,/g, '')) / parseInt(aHpMatchType1[2].replace(/,/g, '')) : 0;
            bValue = bHpMatchType1 ? parseInt(bHpMatchType1[1].replace(/,/g, '')) / parseInt(bHpMatchType1[2].replace(/,/g, '')) : 0;
            return aValue - bValue;
          case 'wave2-first':
            const aWave2 = getMonsterWave(aCells[1]?.textContent?.toLowerCase() || '');
            const bWave2 = getMonsterWave(bCells[1]?.textContent?.toLowerCase() || '');
            if (aWave2 !== bWave2) return bWave2 - aWave2; // Reverse order for Wave 2 first
            // Within same wave, sort by HP ascending
            const aHpTextType2 = aCells[2]?.textContent || '';
            const bHpTextType2 = bCells[2]?.textContent || '';
            const aHpMatchType2 = aHpTextType2.match(/([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
            const bHpMatchType2 = bHpTextType2.match(/([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
            aValue = aHpMatchType2 ? parseInt(aHpMatchType2[1].replace(/,/g, '')) / parseInt(aHpMatchType2[2].replace(/,/g, '')) : 0;
            bValue = bHpMatchType2 ? parseInt(bHpMatchType2[1].replace(/,/g, '')) / parseInt(bHpMatchType2[2].replace(/,/g, '')) : 0;
            return aValue - bValue;
          case 'name-asc':
            aValue = aCells[1]?.textContent?.toLowerCase() || '';
            bValue = bCells[1]?.textContent?.toLowerCase() || '';
            return aValue.localeCompare(bValue);
          case 'name-desc':
            aValue = aCells[1]?.textContent?.toLowerCase() || '';
            bValue = bCells[1]?.textContent?.toLowerCase() || '';
            return bValue.localeCompare(aValue);
          case 'hp-asc':
          case 'hp-desc':
            const aHpText = aCells[2]?.textContent || '';
            const bHpText = bCells[2]?.textContent || '';
            const aHpMatch = aHpText.match(/([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
            const bHpMatch = bHpText.match(/([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
            aValue = aHpMatch ? parseInt(aHpMatch[1].replace(/,/g, '')) / parseInt(aHpMatch[2].replace(/,/g, '')) : 0;
            bValue = bHpMatch ? parseInt(bHpMatch[1].replace(/,/g, '')) / parseInt(bHpMatch[2].replace(/,/g, '')) : 0;
            return sortBy === 'hp-asc' ? aValue - bValue : bValue - aValue;
          case 'players-asc':
          case 'players-desc':
            const aPlayerMatch = aCells[3]?.textContent?.match(/(\d+)\/30/);
            const bPlayerMatch = bCells[3]?.textContent?.match(/(\d+)\/30/);
            aValue = aPlayerMatch ? parseInt(aPlayerMatch[1]) : 0;
            bValue = bPlayerMatch ? parseInt(bPlayerMatch[1]) : 0;
            return sortBy === 'players-asc' ? aValue - bValue : bValue - aValue;
          case 'status':
            const aStatus = aCells[4]?.textContent || '';
            const bStatus = bCells[4]?.textContent || '';
            // Available first, then Active, then Loot
            const statusOrder = { 'Available': 0, 'Active': 1, 'Loot': 2 };
            aValue = statusOrder[aStatus] ?? 3;
            bValue = statusOrder[bStatus] ?? 3;
            return aValue - bValue;
          default:
            return 0;
        }
      } else {
        // For card view, get data from monster card
        const aName = a.querySelector('h3').textContent.toLowerCase();
        const bName = b.querySelector('h3').textContent.toLowerCase();

        // Card view: if a ranked priority list exists, apply it first
        if (rankedOrder) {
          const aText = aName;
          const bText = bName;
          const getIdxCard = (text) => {
            for (let i = 0; i < rankedOrder.length; i++) {
              if (text.includes(rankedOrder[i])) return i;
            }
            return rankedOrder.length + 1; // Not in priority list
          };
          const ia = getIdxCard(aText);
          const ib = getIdxCard(bText);

          // If different priority ranks, sort by priority
          if (ia !== ib) return ia - ib;

          // If both are NOT in priority list, sort by HP ascending
          if (ia > rankedOrder.length && ib > rankedOrder.length) {
            const aHpText = a.querySelector('.hp-bar')?.nextElementSibling?.textContent || '';
            const bHpText = b.querySelector('.hp-bar')?.nextElementSibling?.textContent || '';
            const aHpMatch = aHpText.match(/❤️\s*([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
            const bHpMatch = bHpText.match(/❤️\s*([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
            const aHpPercent = aHpMatch ? parseInt(aHpMatch[1].replace(/,/g, '')) / parseInt(aHpMatch[2].replace(/,/g, '')) : 0;
            const bHpPercent = bHpMatch ? parseInt(bHpMatch[1].replace(/,/g, '')) / parseInt(bHpMatch[2].replace(/,/g, '')) : 0;
            return aHpPercent - bHpPercent;
          }

          // If same priority rank, sort by HP ascending within that group
          const aHpTextTie = a.querySelector('.hp-bar')?.nextElementSibling?.textContent || '';
          const bHpTextTie = b.querySelector('.hp-bar')?.nextElementSibling?.textContent || '';
          const aHpMatchTie = aHpTextTie.match(/❤️\s*([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
          const bHpMatchTie = bHpTextTie.match(/❤️\s*([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
          const aValTie = aHpMatchTie ? parseInt(aHpMatchTie[1].replace(/,/g, '')) / parseInt(aHpMatchTie[2].replace(/,/g, '')) : 0;
          const bValTie = bHpMatchTie ? parseInt(bHpMatchTie[1].replace(/,/g, '')) / parseInt(bHpMatchTie[2].replace(/,/g, '')) : 0;
          return aValTie - bValTie;
        }
        // Card view: monster-specific sort
        if (sortBy.startsWith('monster:')) {
          const target = sortBy.replace('monster:', '').toLowerCase();
          const aText = aName;
          const bText = bName;
          const aMatch = aText.includes(target) ? 0 : 1;
          const bMatch = bText.includes(target) ? 0 : 1;
          return aMatch - bMatch;
        }

        switch (sortBy) {
          case 'wave1-first':
            const aWaveCard1 = getMonsterWave(aName);
            const bWaveCard1 = getMonsterWave(bName);
            if (aWaveCard1 !== bWaveCard1) return aWaveCard1 - bWaveCard1;
            // Within same wave, sort by HP ascending
            const aHpTextCard1 = a.querySelector('.hp-bar')?.nextElementSibling?.textContent || '';
            const bHpTextCard1 = b.querySelector('.hp-bar')?.nextElementSibling?.textContent || '';
            const aHpMatchCard1 = aHpTextCard1.match(/❤️\s*([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
            const bHpMatchCard1 = bHpTextCard1.match(/❤️\s*([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
            aValue = aHpMatchCard1 ? parseInt(aHpMatchCard1[1].replace(/,/g, '')) / parseInt(aHpMatchCard1[2].replace(/,/g, '')) : 0;
            bValue = bHpMatchCard1 ? parseInt(bHpMatchCard1[1].replace(/,/g, '')) / parseInt(bHpMatchCard1[2].replace(/,/g, '')) : 0;
            return aValue - bValue;
          case 'wave2-first':
            const aWaveCard2 = getMonsterWave(aName);
            const bWaveCard2 = getMonsterWave(bName);
            if (aWaveCard2 !== bWaveCard2) return bWaveCard2 - aWaveCard2; // Reverse order for Wave 2 first
            // Within same wave, sort by HP ascending
            const aHpTextCard2 = a.querySelector('.hp-bar')?.nextElementSibling?.textContent || '';
            const bHpTextCard2 = b.querySelector('.hp-bar')?.nextElementSibling?.textContent || '';
            const aHpMatchCard2 = aHpTextCard2.match(/❤️\s*([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
            const bHpMatchCard2 = bHpTextCard2.match(/❤️\s*([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
            aValue = aHpMatchCard2 ? parseInt(aHpMatchCard2[1].replace(/,/g, '')) / parseInt(aHpMatchCard2[2].replace(/,/g, '')) : 0;
            bValue = bHpMatchCard2 ? parseInt(bHpMatchCard2[1].replace(/,/g, '')) / parseInt(bHpMatchCard2[2].replace(/,/g, '')) : 0;
            return aValue - bValue;
          case 'name-asc':
            return aName.localeCompare(bName);
          case 'name-desc':
            return bName.localeCompare(aName);
          case 'hp-asc':
          case 'hp-desc':
            const aHpText = a.querySelector('.hp-bar')?.nextElementSibling?.textContent || '';
            const bHpText = b.querySelector('.hp-bar')?.nextElementSibling?.textContent || '';
            const aHpMatch = aHpText.match(/❤️\s*([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
            const bHpMatch = bHpText.match(/❤️\s*([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
            aValue = aHpMatch ? parseInt(aHpMatch[1].replace(/,/g, '')) / parseInt(aHpMatch[2].replace(/,/g, '')) : 0;
            bValue = bHpMatch ? parseInt(bHpMatch[1].replace(/,/g, '')) / parseInt(bHpMatch[2].replace(/,/g, '')) : 0;
            return sortBy === 'hp-asc' ? aValue - bValue : bValue - aValue;
          case 'players-asc':
          case 'players-desc':
            const aPlayerText = a.textContent;
            const bPlayerText = b.textContent;
            const aPlayerMatch = aPlayerText.match(/👥 Players Joined (\d+)\/30/);
            const bPlayerMatch = bPlayerText.match(/👥 Players Joined (\d+)\/30/);
            aValue = aPlayerMatch ? parseInt(aPlayerMatch[1]) : 0;
            bValue = bPlayerMatch ? parseInt(bPlayerMatch[1]) : 0;
            return sortBy === 'players-asc' ? aValue - bValue : bValue - aValue;
          case 'status':
            const aJoinBtn = a.querySelector('.join-btn');
            const bJoinBtn = b.querySelector('.join-btn');
            let aStatus = 'Available';
            let bStatus = 'Available';

            if (aJoinBtn) {
              const aBtnText = aJoinBtn.textContent.trim();
              if (aBtnText.includes('Continue')) aStatus = 'Active';
              else if (aBtnText.includes('Loot')) aStatus = 'Loot';
            }

            if (bJoinBtn) {
              const bBtnText = bJoinBtn.textContent.trim();
              if (bBtnText.includes('Continue')) bStatus = 'Active';
              else if (bBtnText.includes('Loot')) bStatus = 'Loot';
            }

            const statusOrder = { 'Available': 0, 'Active': 1, 'Loot': 2 };
            aValue = statusOrder[aStatus] ?? 3;
            bValue = statusOrder[bStatus] ?? 3;
            return aValue - bValue;
          default:
            return 0;
        }
      }
    });
  }

  var limitBattleCount = 0;

  // Track visible monsters by category
  let visibleContinueCount = 0;
  let visibleLootCount = 0;
  let visibleJoinCount = 0;

  monstersArray.forEach((monster, index) => {
    let monsterName, monsterImg, hpText, playerText, joinBtnText;

    if (isListView) {
      // For list view, get data from table cells
      const cells = monster.querySelectorAll('td');
      monsterName = cells[1]?.textContent?.toLowerCase() || '';
      hpText = cells[2]?.textContent || '';
      playerText = cells[3]?.textContent || '';
      joinBtnText = cells[5]?.querySelector('.join-btn')?.textContent || '';
    } else {
      // For card view, get data from monster card
      monsterName = monster.querySelector('h3').textContent.toLowerCase();
      monsterImg = monster.querySelector('img');
      hpText = monster.querySelector('.hp-bar')?.nextElementSibling?.textContent || '';
      playerText = monster.textContent;
      joinBtnText = monster.querySelector('.join-btn')?.textContent || '';
    }

    // Get HP information
    let hpPercentage = 0;
    if (!isListView) {
      // Use data attributes for card view (new format)
      const currentHpAttr = monster.getAttribute('data-current-hp');
      const maxHpAttr = monster.getAttribute('data-max-hp');
      if (currentHpAttr && maxHpAttr) {
        const currentHp = parseFloat(currentHpAttr);
        const maxHp = parseFloat(maxHpAttr);
        hpPercentage = maxHp > 0 ? (currentHp / maxHp) * 100 : 0;
      }
    } else {
      // Fallback to text parsing for list view
      const hpMatch = hpText.match(/([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
      const currentHp = hpMatch ? parseInt(hpMatch[1].replace(/,/g, '')) : 0;
      const maxHp = hpMatch ? parseInt(hpMatch[2].replace(/,/g, '')) : 1;
      hpPercentage = maxHp > 0 ? (currentHp / maxHp) * 100 : 0;
    }

    // Get player count information
    const playerMatch = playerText.match(/(\d+)\/30/);
    const playerCount = playerMatch ? parseInt(playerMatch[1]) : 0;      // Determine monster wave based on name
    const monsterWave = getMonsterWave(monsterName);

    // Apply all filters
    let shouldShow = true;

    // Name filter
    if (nameFilter && !monsterName.includes(nameFilter)) {
      shouldShow = false;
    }

    // Wave filter (removed - no longer used)

    // Monster type filter (multiple selection)
    if (selectedMonsterTypes.length > 0) {
      const matchesType = selectedMonsterTypes.some(type =>
        monsterName.includes(type.toLowerCase())
      );
      if (!matchesType) {
        shouldShow = false;
      }
    }

    // HP filter
    if (hpFilter) {
      switch (hpFilter) {
        case 'low':
          if (hpPercentage >= 50) shouldShow = false;
          break;
        case 'medium':
          if (hpPercentage < 50 || hpPercentage >= 80) shouldShow = false;
          break;
        case 'high':
          if (hpPercentage < 80 || hpPercentage >= 100) shouldShow = false;
          break;
        case 'full':
          if (hpPercentage !== 100) shouldShow = false;
          break;
      }
    }

    // Player count filter
    if (playerCountFilter) {
      switch (playerCountFilter) {
        case 'empty':
          if (playerCount > 0) shouldShow = false;
          break;
        case 'few':
          if (playerCount >= 10) shouldShow = false;
          break;
        case 'many':
          if (playerCount <= 20) shouldShow = false;
          break;
        case 'full':
          if (playerCount < 30) shouldShow = false;
          break;
      }
    }

    // Apply visibility
    if (isListView) {
      monster.style.display = shouldShow ? 'table-row' : 'none';
    } else {
      monster.style.display = shouldShow ? '' : 'none';
    }

    // Handle image visibility (only for card view)
    if (!isListView && hideImg && monsterImg) {
      monsterImg.style.display = 'none';
      // Also remove loot probability pills when images are hidden
      const pillsContainer = monster.querySelector('.loot-pills-container');
      if (pillsContainer) pillsContainer.remove();
    } else if (!isListView && monsterImg) {
      monsterImg.style.removeProperty('display');
    }

    // Count battles for alarm
    if (joinBtnText.includes('Continue')) {
      limitBattleCount++;
    }

    // Count visible monsters by category (only if monster is visible)
    if (shouldShow) {
      const monsterId = monster.getAttribute('data-monster-id');

      // Skip counting if this monster was already looted
      if (monsterId && lootedMonsters.has(monsterId)) {
        return; // Skip this monster from counting
      }

      if (joinBtnText.includes('Continue')) {
        visibleContinueCount++;
      } else if (joinBtnText.includes('Loot')) {
        visibleLootCount++;
      } else {
        visibleJoinCount++;
      }
    }
  });

  if (battleLimitAlarm && limitBattleCount < 5) {
    showNotification('🔔 Battle limit alarm: Less than 5 battles!', 'success');

    // Play alarm sound if enabled
    if (battleLimitAlarmSound) {
      playAlarmSound();
    }
  }

  // Update section header counts with visible monsters
  updateSectionHeaderCounts(visibleContinueCount, visibleLootCount, visibleJoinCount);

  // Update loot button count
  const lootBtn = document.getElementById('loot-filtered-btn');
  if (lootBtn) {
    lootBtn.textContent = `💰 Loot All (${visibleLootCount})`;
  }

  // Save all filter settings per-wave
  const currentWaveKey = getCurrentWaveKey();
  const settings = {
    nameFilter: document.getElementById('monster-name-filter').value,
    monsterTypeFilter: selectedMonsterTypes,
    hpFilter: document.getElementById('hp-filter').value,
    playerCountFilter: document.getElementById('player-count-filter').value,
    sortBy: document.getElementById('monster-sort').value,
    hideImg: document.getElementById('hide-img-monsters').checked,
    battleLimitAlarm: document.getElementById('battle-limit-alarm').checked,
    battleLimitAlarmSound: document.getElementById('battle-limit-alarm-sound').checked,
    battleLimitAlarmVolume: parseInt(document.getElementById('battle-limit-alarm-volume').value, 10)
  };

  // Load all wave settings, update current wave, and save back
  const allWaveSettings = JSON.parse(localStorage.getItem('demonGameFilterSettingsByWave') || '{}');
  allWaveSettings[currentWaveKey] = settings;
  localStorage.setItem('demonGameFilterSettingsByWave', JSON.stringify(allWaveSettings));

  // Refresh hotkey overlays after filter changes
  addMonsterCardHotkeyOverlays();
}

// Play alarm sound function
function playAlarmSound() {
  try {
    const audio = new Audio(chrome.runtime.getURL('alarm.mp3'));
    const volumeSlider = document.getElementById('battle-limit-alarm-volume');
    const volume = volumeSlider ? parseInt(volumeSlider.value, 10) / 100 : 0.7;
    audio.volume = volume;
    audio.play().catch(error => {
      console.log('Could not play alarm sound:', error);
      // Fallback: use browser's built-in notification sound
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Battle Limit Alarm', {
          body: 'Less than 3 battles available!',
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔔</text></svg>'
        });
      }
    });
  } catch (error) {
    console.log('Error creating alarm sound:', error);
  }
}

function getMonsterWave(monsterName) {
  // Universal wave detection based on common patterns
  // Try to extract wave number from URL or context if available
  const urlParams = new URLSearchParams(window.location.search);
  const currentWave = urlParams.get('wave');

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

  // Wave 3+ monsters - add known patterns here
  const wave3Monsters = [
    'dragon', 'wyvern', 'behemoth', 'titan', 'ancient'
  ];

  if (wave1Monsters.some(monster => monsterName.includes(monster))) {
    return 1;
  } else if (wave2Monsters.some(monster => monsterName.includes(monster))) {
    return 2;
  } else if (wave3Monsters.some(monster => monsterName.includes(monster))) {
    return 3;
  }

  // If we're on a specific wave page, assume all unknown monsters are from that wave
  if (currentWave) {
    return parseInt(currentWave, 10) || 0;
  }

  return 0; // Unknown wave
}

function clearAllFilters() {
  document.getElementById('monster-name-filter').value = '';
  document.getElementById('hp-filter').value = '';
  document.getElementById('player-count-filter').value = '';
  // Clear hidden sort input and ranked UI if present
  const ms = document.getElementById('monster-sort');
  if (ms) ms.value = '';
  if (window.clearMonsterPrioritySelections) window.clearMonsterPrioritySelections();
  document.getElementById('hide-img-monsters').checked = false;
  document.getElementById('battle-limit-alarm').checked = false;
  document.getElementById('battle-limit-alarm-sound').checked = true;
  document.getElementById('battle-limit-alarm-sound').disabled = true;
  document.getElementById('battle-limit-alarm-volume').value = 70;
  document.getElementById('battle-limit-alarm-volume-display').textContent = '70%';

  // Clear all monster type checkboxes
  document.querySelectorAll('.monster-type-checkbox').forEach(checkbox => {
    checkbox.checked = false;
  });

  applyMonsterFilters();

  // Clear saved settings for current wave
  const currentWaveKey = getCurrentWaveKey();
  const allWaveSettings = JSON.parse(localStorage.getItem('demonGameFilterSettingsByWave') || '{}');
  delete allWaveSettings[currentWaveKey];
  localStorage.setItem('demonGameFilterSettingsByWave', JSON.stringify(allWaveSettings));

  showNotification('All filters cleared for this wave!', 'info');
}

function toggleMonsterView(viewMode) {
  const monsterContainer = document.querySelector('.monster-container');
  if (!monsterContainer) return;

  const allMonsters = Array.from(document.querySelectorAll('.monster-card'));

  // Get current filter settings
  const nameFilter = document.getElementById('monster-name-filter').value.toLowerCase();
  const hpFilter = document.getElementById('hp-filter').value;
  const playerCountFilter = document.getElementById('player-count-filter').value;
  const sortBy = document.getElementById('monster-sort').value;
  const selectedMonsterTypes = Array.from(document.querySelectorAll('.monster-type-checkbox:checked')).map(cb => cb.value);

  // Filter monsters based on current settings
  let filteredMonsters = allMonsters.filter(monster => {
    const monsterName = monster.querySelector('h3').textContent.toLowerCase();

    // Get HP information
    const hpText = monster.querySelector('.hp-bar')?.nextElementSibling?.textContent || '';
    const hpMatch = hpText.match(/❤️\s*([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
    const currentHp = hpMatch ? parseInt(hpMatch[1].replace(/,/g, '')) : 0;
    const maxHp = hpMatch ? parseInt(hpMatch[2].replace(/,/g, '')) : 1;
    const hpPercentage = maxHp > 0 ? (currentHp / maxHp) * 100 : 0;

    // Get player count information
    const playerText = monster.textContent;
    const playerMatch = playerText.match(/👥 Players Joined (\d+)\/30/);
    const playerCount = playerMatch ? parseInt(playerMatch[1]) : 0;

    // Apply filters
    let shouldShow = true;

    // Name filter
    if (nameFilter && !monsterName.includes(nameFilter)) {
      shouldShow = false;
    }

    // Monster type filter
    if (selectedMonsterTypes.length > 0) {
      const matchesType = selectedMonsterTypes.some(type =>
        monsterName.includes(type.toLowerCase())
      );
      if (!matchesType) {
        shouldShow = false;
      }
    }

    // HP filter
    if (hpFilter) {
      switch (hpFilter) {
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
    if (playerCountFilter) {
      switch (playerCountFilter) {
        case 'empty':
          if (playerCount > 0) shouldShow = false;
          break;
        case 'few':
          if (playerCount >= 10) shouldShow = false;
          break;
        case 'many':
          if (playerCount <= 20) shouldShow = false;
          break;
        case 'full':
          if (playerCount < 30) shouldShow = false;
          break;
      }
    }

    return shouldShow;
  });

  // Apply sorting if specified
  if (sortBy) {
    filteredMonsters.sort((a, b) => {
      let aValue, bValue;
      const aName = a.querySelector('h3').textContent.toLowerCase();
      const bName = b.querySelector('h3').textContent.toLowerCase();

      switch (sortBy) {
        case 'wave1-first':
          const aWaveToggle1 = getMonsterWave(aName);
          const bWaveToggle1 = getMonsterWave(bName);
          if (aWaveToggle1 !== bWaveToggle1) return aWaveToggle1 - bWaveToggle1;
          // Within same wave, sort by HP ascending
          const aHpTextToggle1 = a.querySelector('.hp-bar')?.nextElementSibling?.textContent || '';
          const bHpTextToggle1 = b.querySelector('.hp-bar')?.nextElementSibling?.textContent || '';
          const aHpMatchToggle1 = aHpTextToggle1.match(/❤️\s*([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
          const bHpMatchToggle1 = bHpTextToggle1.match(/❤️\s*([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
          aValue = aHpMatchToggle1 ? parseInt(aHpMatchToggle1[1].replace(/,/g, '')) / parseInt(aHpMatchToggle1[2].replace(/,/g, '')) : 0;
          bValue = bHpMatchToggle1 ? parseInt(bHpMatchToggle1[1].replace(/,/g, '')) / parseInt(bHpMatchToggle1[2].replace(/,/g, '')) : 0;
          return aValue - bValue;
        case 'wave2-first':
          const aWaveToggle2 = getMonsterWave(aName);
          const bWaveToggle2 = getMonsterWave(bName);
          if (aWaveToggle2 !== bWaveToggle2) return bWaveToggle2 - aWaveToggle2; // Reverse order for Wave 2 first
          // Within same wave, sort by HP ascending
          const aHpTextToggle2 = a.querySelector('.hp-bar')?.nextElementSibling?.textContent || '';
          const bHpTextToggle2 = b.querySelector('.hp-bar')?.nextElementSibling?.textContent || '';
          const aHpMatchToggle2 = aHpTextToggle2.match(/❤️\s*([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
          const bHpMatchToggle2 = bHpTextToggle2.match(/❤️\s*([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
          aValue = aHpMatchToggle2 ? parseInt(aHpMatchToggle2[1].replace(/,/g, '')) / parseInt(aHpMatchToggle2[2].replace(/,/g, '')) : 0;
          bValue = bHpMatchToggle2 ? parseInt(bHpMatchToggle2[1].replace(/,/g, '')) / parseInt(bHpMatchToggle2[2].replace(/,/g, '')) : 0;
          return aValue - bValue;
        case 'name-asc':
          return aName.localeCompare(bName);
        case 'name-desc':
          return bName.localeCompare(aName);
        case 'hp-asc':
        case 'hp-desc':
          const aHpText = a.querySelector('.hp-bar')?.nextElementSibling?.textContent || '';
          const bHpText = b.querySelector('.hp-bar')?.nextElementSibling?.textContent || '';
          const aHpMatch = aHpText.match(/❤️\s*([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
          const bHpMatch = bHpText.match(/❤️\s*([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
          aValue = aHpMatch ? parseInt(aHpMatch[1].replace(/,/g, '')) / parseInt(aHpMatch[2].replace(/,/g, '')) : 0;
          bValue = bHpMatch ? parseInt(bHpMatch[1].replace(/,/g, '')) / parseInt(bHpMatch[2].replace(/,/g, '')) : 0;
          return sortBy === 'hp-asc' ? aValue - bValue : bValue - aValue;
        case 'players-asc':
        case 'players-desc':
          const aPlayerText = a.textContent;
          const bPlayerText = b.textContent;
          const aPlayerMatch = aPlayerText.match(/👥 Players Joined (\d+)\/30/);
          const bPlayerMatch = bPlayerText.match(/👥 Players Joined (\d+)\/30/);
          aValue = aPlayerMatch ? parseInt(aPlayerMatch[1]) : 0;
          bValue = bPlayerMatch ? parseInt(bPlayerMatch[1]) : 0;
          return sortBy === 'players-asc' ? aValue - bValue : bValue - aValue;
        case 'status':
          const aJoinBtn = a.querySelector('.join-btn');
          const bJoinBtn = b.querySelector('.join-btn');
          let aStatus = 'Available';
          let bStatus = 'Available';

          if (aJoinBtn) {
            const aBtnText = aJoinBtn.textContent.trim();
            if (aBtnText.includes('Continue')) aStatus = 'Active';
            else if (aBtnText.includes('Loot')) aStatus = 'Loot';
          }

          if (bJoinBtn) {
            const bBtnText = bJoinBtn.textContent.trim();
            if (bBtnText.includes('Continue')) bStatus = 'Active';
            else if (bBtnText.includes('Loot')) bStatus = 'Loot';
          }

          const statusOrder = { 'Available': 0, 'Active': 1, 'Loot': 2 };
          aValue = statusOrder[aStatus] ?? 3;
          bValue = statusOrder[bStatus] ?? 3;
          return aValue - bValue;
        default:
          return 0;
      }
    });
  }

  if (viewMode === 'list') {
    // Create table view
    const table = document.createElement('table');
    table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        background: rgba(30, 30, 46, 0.8);
        border-radius: 8px;
        overflow: hidden;
        color: white;
        margin-top: 15px;
      `;

    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr style="background: rgba(49, 50, 68, 0.8);">
          <th style="padding: 12px; text-align: left; border-bottom: 1px solid #45475a;">ID</th>
          <th style="padding: 12px; text-align: left; border-bottom: 1px solid #45475a;">Name</th>
          <th style="padding: 12px; text-align: left; border-bottom: 1px solid #45475a;">HP</th>
          <th style="padding: 12px; text-align: left; border-bottom: 1px solid #45475a;">Players</th>
          <th style="padding: 12px; text-align: left; border-bottom: 1px solid #45475a;">Status</th>
          <th style="padding: 12px; text-align: left; border-bottom: 1px solid #45475a;">Action</th>
        </tr>
      `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    filteredMonsters.forEach(monster => {
      const row = document.createElement('tr');
      row.style.cssText = `
          border-bottom: 1px solid rgba(69, 71, 90, 0.5);
          transition: background 0.2s ease;
        `;

      // Get monster data
      const monsterName = monster.querySelector('h3').textContent;
      const monsterImg = monster.querySelector('img').src;
      const monsterId = monster.querySelector('a')?.href?.match(/id=(\d+)/)?.[1] || '';

      // Get HP information
      const hpText = monster.querySelector('.hp-bar')?.nextElementSibling?.textContent || '';
      const hpMatch = hpText.match(/❤️\s*([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
      const currentHp = hpMatch ? parseInt(hpMatch[1].replace(/,/g, '')) : 0;
      const maxHp = hpMatch ? parseInt(hpMatch[2].replace(/,/g, '')) : 1;
      const hpPercentage = maxHp > 0 ? (currentHp / maxHp) * 100 : 0;

      // Get player count
      const playerText = monster.textContent;
      const playerMatch = playerText.match(/👥 Players Joined (\d+)\/30/);
      const playerCount = playerMatch ? parseInt(playerMatch[1]) : 0;

      // Get status
      const joinBtn = monster.querySelector('.join-btn');
      let status = 'Available';
      let btnText = '⚔️ Join the Battle';
      if (joinBtn) {
        btnText = joinBtn.textContent.trim();
        if (btnText.includes('Continue')) {
          status = 'Active';
          row.style.background = 'rgba(179, 89, 26, 0.3)';
        } else if (btnText.includes('Loot')) {
          status = 'Loot';
          row.style.background = 'rgba(24, 24, 32, 0.3)';
        }
      }

      const hpBarStyle = `
          width: 100px;
          height: 8px;
          background: #313244;
          border-radius: 4px;
          overflow: hidden;
          display: inline-block;
          margin-right: 8px;
        `;
      const hpFillStyle = `
          height: 100%;
          background: linear-gradient(90deg, #22c55e, #16a34a);
          width: ${hpPercentage}%;
        `;

      row.innerHTML = `
          <td style="padding: 12px;">${monsterId}</td>
          <td style="padding: 12px;">
            <img src="${monsterImg}" alt="${monsterName}" style="width: 32px; height: 32px; border-radius: 4px; margin-right: 8px; vertical-align: middle;">
            ${monsterName}
          </td>
          <td style="padding: 12px;">
            <div style="${hpBarStyle}"><div style="${hpFillStyle}"></div></div>
            ${currentHp.toLocaleString()} / ${maxHp.toLocaleString()}
          </td>
          <td style="padding: 12px;">${playerCount}/30</td>
          <td style="padding: 12px;">${status}</td>
          <td style="padding: 12px;">
            <button class="join-btn" style="padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">${btnText}</button>
          </td>
        `;

      // Add click handler to the button
      const newJoinBtn = row.querySelector('.join-btn');
      const originalJoinBtn = monster.querySelector('.join-btn');
      if (newJoinBtn && originalJoinBtn) {
        newJoinBtn.addEventListener('click', () => {
          originalJoinBtn.click();
        });
      }

      tbody.appendChild(row);
    });

    table.appendChild(tbody);

    // Replace monster container content
    monsterContainer.innerHTML = '';
    monsterContainer.appendChild(table);
    monsterContainer.classList.add('list-view');
  } else {
    // Restore card view
    monsterContainer.innerHTML = '';
    allMonsters.forEach(monster => {
      monsterContainer.appendChild(monster);
    });
    monsterContainer.classList.remove('list-view');

    // Re-apply filters
    applyMonsterFilters();
  }
}
//#endregion

//#region Loot and battle functionality
async function loadInstaLoot() {
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
    notif.style = `position: fixed; top: 20px; right: 20px; background: #2ecc71; color: white; padding: 12px 20px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4); font-size: 15px; display: none; z-index: 99999; max-width: 400px; word-wrap: break-word;`;
    notif.id = "notification";

    const contentArea = document.querySelector('.content-area');
    if (contentArea) {
      contentArea.appendChild(modal.firstElementChild);
      contentArea.appendChild(notif);
    }

    document.getElementById('lootModal').addEventListener('click', function (event) {
      this.style.display = 'none';
    });
  }

  document.querySelectorAll('.monster-card > a').forEach(x => {
    if (x.innerText.includes('Loot')) {
      var instaBtn = document.createElement('button');
      const monsterId = x.href.split("id=")[1];
      instaBtn.onclick = function () {
        lootWave(monsterId);
      };
      instaBtn.className = "join-btn";
      instaBtn.innerText = "💰 Loot Instantly";
      instaBtn.setAttribute('data-monster-id', monsterId); // Store monster ID for loot all
      x.parentNode.append(instaBtn);
    }
  });

}

async function joinWaveInstant(monsterId, originalLink) {
  // Use battle modal system if enabled
  if (extensionSettings.battleModal.enabled) {
    // Initialize user data if not done yet
    if (!userData.userID) {
      initUserData();
    }

    // Create a dummy button element for handleJoin
    const dummyBtn = document.createElement('button');
    dummyBtn.textContent = 'Joining...';

    handleJoin(monsterId, dummyBtn);
    return;
  }

  // Original behavior for when battle modal is disabled
  showNotification('Joining battle...', '#2ecc71');

  try {
    const { status, text } = await postAction('user_join_battle.php', {
      monster_id: monsterId,
      user_id: userId
    });

    const msg = (text || '').trim();
    const ok = msg.toLowerCase().startsWith('you have successfully');
    showNotification(msg || 'Unknown response', ok ? '#2ecc71' : '#e74c3c');

    if (ok) {
      setTimeout(() => {
        window.location.href = originalLink.href;
      }, 1000);
    }
  } catch (error) {
    console.error('Join battle error:', error);
    showNotification('Server error. Please try again.', '#e74c3c');
  }
}

async function lootWave(monsterId) {
  // Use battle modal system if enabled
  if (extensionSettings.battleModal.enabled) {
    // Initialize user data if not done yet
    if (!userData.userID) {
      initUserData();
    }

    // Create a dummy button element for handleLoot
    const dummyBtn = document.createElement('button');
    dummyBtn.textContent = 'Looting...';

    handleLoot(monsterId, 'Monster', dummyBtn);
    return;
  }

  // Original behavior for when battle modal is disabled
  try {
    const { status, text } = await postAction('loot.php', {
      monster_id: monsterId,
      user_id: userId
    });

    const data = JSON.parse(text);
    if (data.status === 'success') {
      const lootContainer = document.getElementById('lootItems');
      lootContainer.innerHTML = '';

      data.items.forEach(item => {
        const div = document.createElement('div');
        div.style = 'background:#1e1e2f; border-radius:8px; padding:10px; text-align:center; width:80px;';
        div.innerHTML = `
              <img src="${item.IMAGE_URL}" alt="${item.NAME}" style="width:64px; height:64px;"><br>
              <small>${item.NAME}</small>
          `;
        lootContainer.appendChild(div);
      });

      document.getElementById('lootModal').style.display = 'flex';
    } else {
      showNotification(data.message || 'Failed to loot.', '#e74c3c');
    }
  } catch (error) {
    console.error('Loot error:', error);
    showNotification("Server error", '#e74c3c');
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

  // Find all available loot buttons from visible/filtered monsters only
  const lootButtons = document.querySelectorAll('.monster-card:not([style*="display: none"]) .join-btn, tbody tr:not([style*="display: none"]) .join-btn');
  const availableLootButtons = Array.from(lootButtons).filter(btn =>
    btn.innerText.includes('💰 Loot Instantly') && !btn.disabled
  );

  if (availableLootButtons.length === 0) {
    showNotification('No loot available to claim!', 'info');
    return;
  }

  // Show custom confirmation dialog with loot amount option
  const lootAmount = prompt(`How many monsters do you want to loot?\n\nAvailable: ${availableLootButtons.length} monsters\n\nEnter a number (1-${availableLootButtons.length}) or leave empty for all:`, availableLootButtons.length.toString());

  if (lootAmount === null) {
    return; // User cancelled
  }

  let targetCount = availableLootButtons.length; // Default to all

  if (lootAmount.trim() !== '') {
    const parsedAmount = parseInt(lootAmount);
    if (isNaN(parsedAmount) || parsedAmount < 1) {
      showNotification('Invalid amount! Please enter a number between 1 and ' + availableLootButtons.length, 'error');
      return;
    }
    targetCount = Math.min(parsedAmount, availableLootButtons.length);
  }

  // Final confirmation
  const confirmed = confirm(`Are you sure you want to claim loot from ${targetCount} monsters?\n\nThis will claim loot from the first ${targetCount} available monsters.`);
  if (!confirmed) {
    return; // User cancelled
  }

  // Disable button and show loading state
  lootAllBtn.disabled = true;
  lootAllBtn.innerText = '🎁 Looting...';
  lootAllBtn.style.opacity = '0.7';

  // Extract monster IDs from data attributes (limit to targetCount)
  const monsterIds = [];
  availableLootButtons.slice(0, targetCount).forEach(btn => {
    const monsterId = btn.getAttribute('data-monster-id');
    if (monsterId) {
      monsterIds.push(monsterId);
    }
  });

  if (monsterIds.length === 0) {
    showNotification('No valid monster IDs found!', 'error');
    lootAllBtn.disabled = false;
    lootAllBtn.innerText = '🎁 Loot All (0)';
    lootAllBtn.style.opacity = '1';
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

    // Collect all successful loot
    let allLootItems = [];
    let successCount = 0;
    let errorCount = 0;

    results.forEach(data => {
      if (data.status === 'success' && data.items) {
        successCount++;
        allLootItems = allLootItems.concat(data.items);
      } else {
        errorCount++;
      }
    });

    if (allLootItems.length > 0) {
      // Group items by name and count quantities
      const itemGroups = {};
      allLootItems.forEach(item => {
        const key = item.NAME || item.name || item.name_text || JSON.stringify(item);
        if (itemGroups[key]) {
          itemGroups[key].count = (itemGroups[key].count || 1) + 1;
        } else {
          itemGroups[key] = {
            IMAGE_URL: item.IMAGE_URL || item.img || item.image || '',
            NAME: item.NAME || item.name || item.name_text || key,
            count: 1
          };
        }
      });

      // Use the existing showLootModal to display consolidated loot
      try {
        const consolidated = { items: Object.values(itemGroups) };
        showLootModal(consolidated, `${successCount} Monsters`);
      } catch (e) {
        // Fallback to direct DOM insertion if modal helper fails
        const lootContainer = document.getElementById('lootItems');
        if (lootContainer) {
          lootContainer.innerHTML = '';
          Object.values(itemGroups).forEach(item => {
            const div = document.createElement('div');
            div.style = 'background:#1e1e2f; border-radius:8px; padding:10px; text-align:center; width:80px;';
            div.innerHTML = `\n                <img src="${item.IMAGE_URL}" alt="${item.NAME}" style="width:64px; height:64px; border-radius:4px;"> <br>\n                <small style=\"font-size:12px; color:#ccc;\">${item.NAME}</small>\n                ${item.count > 1 ? `<br><small style=\"color: #4CAF50; font-weight: bold;\">x${item.count}</small>` : ''}\n            `;
            lootContainer.appendChild(div);
          });
          document.getElementById('lootModal').style.display = 'flex';
        }
      }

      showNotification(`Successfully claimed loot from ${successCount} monsters! Got ${allLootItems.length} items!`, 'success');

      // Remove the button after successful looting
      setTimeout(() => {
        lootAllBtn.remove();
      }, 2000);

    } else {
      showNotification('No loot was claimed!', 'error');
      lootAllBtn.disabled = false;
      lootAllBtn.innerText = '🎁 Loot All (0)';
      lootAllBtn.style.opacity = '1';
    }

  } catch (error) {
    console.error('Error looting all monsters:', error);
    showNotification('Server error. Please try again.', 'error');
    lootAllBtn.disabled = false;
    lootAllBtn.innerText = '🎁 Loot All (0)';
    lootAllBtn.style.opacity = '1';
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

  header.addEventListener('click', function () {
    scrollContent.classList.toggle('collapsed');
  });
}

function initContinueBattleFirst() {
  const monsterContainer = document.querySelector('.monster-container');
  if (!monsterContainer) return;

  document.querySelectorAll('.monster-card').forEach(x => {
    if (x.innerText.includes('Continue')) {
      monsterContainer.prepend(x);
    }
  });
}

function initImprovedWaveButtons() {
  document.querySelectorAll('.monster-card > a').forEach(battleLink => {
    if (battleLink.innerText.includes('Join the Battle')) {
      const monsterId = battleLink.href.split("id=")[1];

      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = 'display: flex; gap: 8px; margin-top: 8px;';

      const joinBtn = document.createElement('button');
      joinBtn.className = "join-btn";
      joinBtn.style.cssText = 'flex: 1; font-size: 12px;';
      joinBtn.innerText = "⚔️ Join Battle";
      joinBtn.addEventListener('click', async function (e) {
        if (e.ctrlKey || e.metaKey) {
          // Ctrl+Click or Cmd+Click - join battle first, then handle based on settings
          e.preventDefault();

          if (extensionSettings.battleModal.enabled) {
            // Use battle modal system
            if (!userData.userID) {
              initUserData();
            }
            handleJoin(monsterId, joinBtn);
          } else {
            // Join the battle first, then open new tab (original behavior)
            try {
              const { status, text } = await postAction('user_join_battle.php', {
                monster_id: monsterId,
                user_id: userId
              });

              const msg = (text || '').trim();
              const ok = msg.toLowerCase().startsWith('you have successfully');

              if (ok) {
                // Battle joined successfully, now open new tab
                window.open(battleLink.href, '_blank');
                showNotification('Battle joined! Opening in new tab...', '#2ecc71');
              } else {
                showNotification(msg || 'Failed to join battle', '#e74c3c');
              }
            } catch (error) {
              console.error('Join battle error:', error);
              showNotification('Server error. Please try again.', '#e74c3c');
            }
          }
        } else {
          // Normal click - use instant join (which now handles modal vs navigation)
          joinWaveInstant(monsterId, battleLink);
        }
      });

      const viewBtn = document.createElement('button');
      viewBtn.className = "join-btn";
      viewBtn.style.cssText = 'flex: 1; font-size: 12px; background: #6c7086;';
      viewBtn.innerText = "👁️ View";
      viewBtn.addEventListener('click', function (e) {
        if (e.ctrlKey || e.metaKey) {
          // Ctrl+Click or Cmd+Click - open in new tab
          window.open(battleLink.href, '_blank');
        } else {
          // Normal click - always navigate to battle page (View should not use modal)
          window.location.href = battleLink.href;
        }
      });

      buttonContainer.appendChild(joinBtn);
      buttonContainer.appendChild(viewBtn);

      battleLink.style.display = 'none';
      battleLink.parentNode.appendChild(buttonContainer);
    }
  });
}

// Enhanced Continue Battle button handler for modal integration
function initContinueBattleModal() {
  document.querySelectorAll('.monster-card > a').forEach(battleLink => {
    if (battleLink.innerText.includes('Continue')) {
      const monsterId = battleLink.href.split("id=")[1];

      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = 'display: flex; gap: 8px; margin-top: 8px;';

      const continueBtn = document.createElement('button');
      continueBtn.className = "join-btn";
      continueBtn.style.cssText = 'flex: 1; font-size: 12px; background: #ffd369; color: #1e1e2e;';
      continueBtn.innerText = "Continue";
      continueBtn.addEventListener('click', async function (e) {
        e.preventDefault();

        if (extensionSettings.battleModal.enabled) {
          // Use battle modal system
          if (!userData.userID) {
            initUserData();
          }

          // Find monster data and show modal
          const monster = findMonsterById(monsterId);
          if (monster) {
            monster.status = 1; // Set status to active
            showBattleModal(monster);
          } else {
            showNotification('Monster data not found, navigating to battle page...', '#f39c12');
            window.location.href = battleLink.href;
          }
        } else {
          // Navigate to battle page (original behavior)
          window.location.href = battleLink.href;
        }
      });

      const viewBtn = document.createElement('button');
      viewBtn.className = "join-btn";
      viewBtn.style.cssText = 'flex: 1; font-size: 12px; background: #6c7086;';
      viewBtn.innerText = "👁️ View";
      viewBtn.addEventListener('click', function (e) {
        if (e.ctrlKey || e.metaKey) {
          // Ctrl+Click or Cmd+Click - open in new tab
          window.open(battleLink.href, '_blank');
        } else {
          // Normal click - navigate to battle page
          window.location.href = battleLink.href;
        }
      });

      buttonContainer.appendChild(continueBtn);
      buttonContainer.appendChild(viewBtn);

      battleLink.style.display = 'none';
      battleLink.parentNode.appendChild(buttonContainer);
    }
  });
}

// Enhance existing monster cards with improved layout
function enhanceExistingMonsterCards() {
  const monsterCards = document.querySelectorAll('.monster-card');

  monsterCards.forEach(card => {
    // Skip if already enhanced
    if (card.dataset.enhanced === 'true') return;

    // Find the image and wrap it if not already wrapped
    const img = card.querySelector('.monster-img, img');
    if (!img) return;

    // Check if images are disabled - if so, skip adding badges
    if (!img.src || img.src === '' || img.style.display === 'none' || img.offsetWidth === 0) return;

    // Check if already has badges container
    if (card.querySelector('.monster-badges-container')) return;

    // Get monster data - parse from existing stat rows if dataset not available
    let atk = card.dataset.atk || '-';
    let def = card.dataset.def || '-';
    let playersJoined = card.dataset.playersJoined || '0';
    let maxPlayers = card.dataset.maxPlayers || '30';

    // Parse from stat rows if not in dataset
    const statRows = card.querySelectorAll('.stat-row');
    statRows.forEach(row => {
      const text = row.textContent;

      // Parse ATK
      const atkMatch = text.match(/ATK\s+(\d+)/);
      if (atkMatch) {
        atk = atkMatch[1];
      }

      // Parse DEF
      const defMatch = text.match(/DEF\s+(\d+)/);
      if (defMatch) {
        def = defMatch[1];
      }

      // Parse Players Joined
      const playersMatch = text.match(/(\d+)\s*\/\s*(\d+)/);
      if (playersMatch && text.includes('Players')) {
        playersJoined = playersMatch[1];
        maxPlayers = playersMatch[2];
      }
    });

    // Parse HP values for the HP text
    let currentHp = card.dataset.currentHp || '0';
    let maxHp = card.dataset.maxHp || '0';

    // Try to get HP from existing stat row if not in dataset
    if (currentHp === '0' || maxHp === '0') {
      const hpRow = Array.from(statRows).find(row => row.textContent.includes('HP'));
      if (hpRow) {
        const hpMatch = hpRow.textContent.match(/([\d,]+)\s*\/\s*([\d,]+)/);
        if (hpMatch) {
          currentHp = hpMatch[1].replace(/,/g, '');
          maxHp = hpMatch[2].replace(/,/g, '');
          card.dataset.currentHp = currentHp;
          card.dataset.maxHp = maxHp;
        }
      }
    }

    // Wrap image if not already in a container
    if (!img.parentElement.style.position || img.parentElement.style.position !== 'relative') {
      // Check if image is actually visible (not disabled by user settings)
      // Use a more reliable check for image visibility
      const isImageVisible = img.src && img.src !== '' &&
        img.style.display !== 'none' &&
        !img.src.includes('data:image/svg') && // Skip placeholder images
        img.getAttribute('src') !== '' &&
        !img.closest('[style*="display: none"]'); // Check parent containers

      if (isImageVisible) {
        // Additional check after a short delay for DOM rendering
        setTimeout(() => {
          const hasValidDimensions = img.offsetWidth > 0 && img.offsetHeight > 0;
          if (!hasValidDimensions) {
            // Remove badges if image ended up being hidden
            const badgesContainer = img.parentElement.querySelector('.monster-badges-container');
            if (badgesContainer) {
              badgesContainer.remove();
            }
            return;
          }
        }, 100);

        const imgContainer = document.createElement('div');
        imgContainer.style.position = 'relative';
        img.parentElement.insertBefore(imgContainer, img);
        imgContainer.appendChild(img);

        // Add badges overlay
        const badgesContainer = document.createElement('div');
        badgesContainer.className = 'monster-badges-container';
        badgesContainer.style.cssText = 'position: absolute; top: 8px; left: 8px; display: flex; flex-direction: row; gap: 4px; z-index: 1;';

        // ATK badge
        const atkBadge = document.createElement('span');
        atkBadge.style.cssText = 'background: rgba(0, 0, 0, 0.75); color: white; padding: 6px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; backdrop-filter: blur(8px); box-shadow: 0 2px 6px rgba(0,0,0,0.4); min-width: 32px; text-align: center; display: flex; align-items: center; justify-content: center;';
        atkBadge.textContent = `⚔ ${atk}`;
        badgesContainer.appendChild(atkBadge);

        // DEF badge
        const defBadge = document.createElement('span');
        defBadge.style.cssText = 'background: rgba(0, 0, 0, 0.75); color: white; padding: 6px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; backdrop-filter: blur(8px); box-shadow: 0 2px 6px rgba(0,0,0,0.4); min-width: 32px; text-align: center; display: flex; align-items: center; justify-content: center;';
        defBadge.textContent = `🛡 ${def}`;
        badgesContainer.appendChild(defBadge);

        // Players badge
        const playersBadge = document.createElement('span');
        playersBadge.style.cssText = 'background: rgba(0, 0, 0, 0.75); color: white; padding: 6px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; backdrop-filter: blur(8px); box-shadow: 0 2px 6px rgba(0,0,0,0.4); min-width: 32px; text-align: center; display: flex; align-items: center; justify-content: center;';
        playersBadge.textContent = `👥 ${playersJoined}/${maxPlayers}`;
        badgesContainer.appendChild(playersBadge);

        imgContainer.appendChild(badgesContainer);
      }
    }

    // Fix HP bar - move HP text inside the bar
    const hpBar = card.querySelector('.hp-bar');

    if (hpBar) {
      // Check if HP text already exists inside the bar
      const existingHpTextInside = hpBar.querySelector('span');
      if (!existingHpTextInside) {
        // Remove any HP text outside the bar
        const hpTextOutside = card.querySelector('.hp-text');
        if (hpTextOutside) {
          hpTextOutside.remove();
        }

        // Style the HP bar properly
        hpBar.style.position = 'relative';
        hpBar.style.height = '24px';
        hpBar.style.display = 'flex';
        hpBar.style.alignItems = 'center';
        hpBar.style.justifyContent = 'center';

        const hpFill = hpBar.querySelector('.hp-fill');
        if (hpFill) {
          hpFill.style.position = 'absolute';
          hpFill.style.left = '0';
          hpFill.style.top = '0';
          hpFill.style.height = '100%';
        }

        // Create new HP text inside bar
        const newHpText = document.createElement('span');
        newHpText.style.cssText = 'position: relative; z-index: 1; font-weight: bold; font-size: 0.85rem; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.8);';

        // Use the HP values we parsed earlier (from the outer scope)
        newHpText.textContent = `${parseInt(currentHp).toLocaleString()} / ${parseInt(maxHp).toLocaleString()}`;

        hpBar.appendChild(newHpText);
      }
    }

    // Remove redundant stat rows (reuse statRows variable from above)
    statRows.forEach(row => {
      if (row.textContent.includes('HP') ||
        row.textContent.includes('ATK') ||
        row.textContent.includes('DEF') ||
        row.textContent.includes('Players Joined')) {
        row.remove();
      }
    });

    // Remove the empty monster-stats container that creates the second bar
    const monsterStats = card.querySelector('.monster-stats');
    if (monsterStats) {
      monsterStats.remove();
    }

    card.dataset.enhanced = 'true';
  });
}

// Cookie helper functions
function getCookieValue(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function setCookie(name, value, options = {}) {
  let cookie = `${name}=${value}`;
  if (options.path) cookie += `; path=${options.path}`;
  if (options['max-age']) cookie += `; max-age=${options['max-age']}`;
  if (options.domain) cookie += `; domain=${options.domain}`;
  if (options.secure) cookie += `; secure`;
  if (options.samesite) cookie += `; samesite=${options.samesite}`;
  document.cookie = cookie;
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
      } catch { }
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
        try { window.removeEventListener('beforeunload', _hideDeadOverride.unloadHandler); } catch { }
        try { window.removeEventListener('pagehide', _hideDeadOverride.unloadHandler); } catch { }
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

// Track looted monsters to exclude from counts
const lootedMonsters = new Set();

// Enhanced Monster sorting functionality with collapsible sections
function initMonsterSorting() {
  const monsterContainer = document.querySelector('.monster-container');
  if (!monsterContainer) return;

  // Enhance existing cards before sorting
  enhanceExistingMonsterCards();

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

  const joinBattleSection = document.createElement('div');
  joinBattleSection.className = 'monster-section';
  joinBattleSection.innerHTML = `
      <div class="monster-section-header">
        <h3 style="color: #a6e3a1; margin: 0; flex: 1;">🆕 Join a Battle</h3>
      </div>
      <div class="monster-section-content">
        <div class="monster-container" style="display: flex; flex-wrap: wrap; gap: 15px;"></div>
      </div>
    `;

  const monsterCards = Array.from(document.querySelectorAll('.monster-card'));
  const continueCards = [];
  const lootCards = [];
  const joinCards = [];

  monsterCards.forEach(card => {
    // Use data attribute if already set, otherwise parse from DOM
    let currentHp = parseInt(card.dataset.currentHp, 10) || 0;

    // If HP not in data attribute, try to parse from DOM
    if (currentHp === 0 || isNaN(currentHp)) {
      const hpText = card.querySelector('.stat-value')?.textContent ||
        card.querySelector('.hp-text')?.textContent || '';
      const hpMatch = hpText.match(/([\d,]+)\s*\/\s*([\d,]+)/);
      if (hpMatch) {
        currentHp = parseInt(hpMatch[1].replace(/,/g, ''), 10);
        card.dataset.currentHp = currentHp;
      }
    }

    if (card.innerText.includes('Continue')) {
      continueCards.push(card);
    } else if (card.innerText.includes('Loot')) {
      lootCards.push(card);
    } else {
      joinCards.push(card);
    }
  });

  joinCards.sort((a, b) => {
    const hpA = parseInt(a.dataset.currentHp) || 0;
    const hpB = parseInt(b.dataset.currentHp) || 0;
    return hpA - hpB;
  });

  continueCards.sort((a, b) => {
    const hpA = parseInt(a.dataset.currentHp) || 0;
    const hpB = parseInt(b.dataset.currentHp) || 0;
    return hpA - hpB;
  });

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

  if (joinCards.length > 0) {
    const joinGrid = joinBattleSection.querySelector('.monster-container');
    joinCards.forEach(card => joinGrid.appendChild(card));
    monsterContainer.appendChild(joinBattleSection);
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
function initReducedImageSize() {
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

function initTotalOwnDamage() {
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
    exDamageNumber = Number.parseInt(exDamageDone.replaceAll(',', '').replaceAll('.', ''));
  } else {
    // Fallback: try to get from stats-stack
    document.querySelectorAll("div.stats-stack > span").forEach(x => {
      if (x.innerText.includes('Your Damage: ')) {
        const damageMatch = x.innerText.match(/Your Damage: ([\d,]+)/);
        if (damageMatch) {
          exDamageDone = damageMatch[1];
          exDamageNumber = Number.parseInt(exDamageDone.replaceAll(',', '').replaceAll('.', ''));
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
        var lootReqNumber = Number.parseInt(x.innerText.substr(9).replaceAll(',', '').replaceAll('.', ''));
        if (lootReqNumber <= exDamageNumber) {
          y.style.background = extensionSettings.lootHighlighting.backgroundColor;
          y.style.boxShadow = `0 0 15px ${extensionSettings.lootHighlighting.glowColor}`;
          try {
            y.classList.remove('locked');
            const lockBadge = y.querySelector('.lock-badge');
            if (lockBadge) {
              lockBadge.remove();
            }
          } catch { }
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
  const slashButtons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');

  slashButtons.forEach(button => {
    const buttonText = button.textContent || button.value || '';
    if (buttonText.toLowerCase().includes('slash')) {
      // Add click listener to slash buttons
      button.addEventListener('click', function (event) {
        // Wait a bit for the damage to update, then check loot highlighting
        setTimeout(() => {
          highlightLootCards();
        }, 1000); // Wait 100ms for damage to update
      });
    }
  });
}

function colorMyself() {

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

      // Check if wrapper already exists
      let imageWrapper = document.querySelector('.monster-image-wrapper');
      if (!imageWrapper) {
        // Create a wrapper for the monster image to handle grayscale properly
        imageWrapper = document.createElement('div');
        imageWrapper.className = 'monster-image-wrapper';
        imageWrapper.style.position = 'relative';
        imageWrapper.style.display = 'inline-block';

        // Move the image into the wrapper
        imageWrapper.appendChild(monsterImage);
      }
      monsterDisplay.append(imageWrapper);
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

function initAnyClickClosesModal() {
  const lootModal = document.getElementById('lootModal');
  if (lootModal) {
    lootModal.addEventListener('click', function (event) {
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
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
      if (!res.ok) {
        showNotification(res.msg || res.error || 'Allocation failed', 'error');
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

// Page initialization functions
function initWaveMods() {
  initGateCollapse()
  initMonsterFilter()
  loadInstaLoot()
  initContinueBattleFirst()
  initImprovedWaveButtons()
  initMonsterSorting()
  initWaveAutoRefresh()

  // Start background update for wave data ONLY if auto-refresh is enabledx
  if (extensionSettings.waveAutoRefresh.enabled) {
    const waveInterval = extensionSettings.waveModsInterval || 5000;
    if (!waveUpdateInterval) {
      waveUpdateInterval = setInterval(() => updateData(false), waveInterval);
      activeIntervals.push(waveUpdateInterval);
    }
  }

  // Refresh hotkey overlays every 2 seconds to handle dynamic changes
  if (!hotkeyOverlayInterval) {
    hotkeyOverlayInterval = setInterval(() => {
      try {
        addMonsterCardHotkeyOverlays();
      } catch (e) {
        console.error('addMonsterCardHotkeyOverlays error:', e);
      }
    }, 2000);
    activeIntervals.push(hotkeyOverlayInterval);
  }

  // Add loot probability pills to monster cards initially and on every soft refresh
  addLootProbabilityPills();

  // Refresh loot pills periodically to update after soft refreshes
  if (!window.lootPillsInterval) {
    window.lootPillsInterval = setInterval(() => {
      try {
        addLootProbabilityPills();
      } catch (e) {
        console.error('addLootProbabilityPills error:', e);
      }
    }, 3000);
    activeIntervals.push(window.lootPillsInterval);
  }
}

// Function to add loot probability pills to monster cards
async function addLootProbabilityPills() {
  if (extensionSettings.lootHelper.showLootProbabilityPills === false) return;

  // Check if hide images checkbox is checked
  const hideImgCheckbox = document.getElementById('hide-img-monsters');
  if (hideImgCheckbox && hideImgCheckbox.checked) return;

  const monsterCards = document.querySelectorAll('.monster-card');

  // Helper to parse damage values
  const parseDamageValue = (text) => {
    if (!text) return null;
    const match = text.match(/([\d,.]+)/);
    if (!match) return null;
    const cleaned = match[1].replace(/,/g, '');
    const num = parseInt(cleaned, 10);
    return Number.isFinite(num) ? num : null;
  };

  // Helper to parse requirement values (supports k/m/b suffixes)
  const parseRequirementValue = (text) => {
    if (!text) return null;
    // match numeric value optionally followed by K/M/B
    const m = String(text).trim().match(/([\d,.]+)\s*([kKmMbB])?/);
    if (!m) return null;
    const cleaned = m[1].replace(/,/g, '').replace(/\s+/g, '');
    const value = parseFloat(cleaned);
    if (!Number.isFinite(value)) return null;
    const suffix = (m[2] || '').toLowerCase();
    if (suffix === 'k') return Math.round(value * 1e3);
    if (suffix === 'm') return Math.round(value * 1e6);
    if (suffix === 'b') return Math.round(value * 1e9);
    return Math.round(value);
  };

  // Format compact (K/M/B) for display
  const formatCompactNumber = (num) => {
    if (typeof num !== 'number' || !Number.isFinite(num)) return String(num || '0');
    if (num >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, '') + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2).replace(/\.00$/, '') + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(num);
  };

  for (const card of monsterCards) {
    // Skip if already processed
    if (card.dataset.lootPillsAdded === 'true') continue;

    // Get the battle link to extract monster ID
    const battleLink = card.querySelector('a[href*="battle.php"]');
    if (!battleLink) continue;

    const href = battleLink.getAttribute('href');
    const monsterIdMatch = href.match(/id=(\d+)/);
    if (!monsterIdMatch) continue;

    const monsterId = monsterIdMatch[1];

    // Find the monster image container
    const monsterImg = card.querySelector('img[src*="monster"], .monster-img, img[alt*="monster"]');
    if (!monsterImg) continue;

    // Create a container for loot pills if it doesn't exist
    let pillsContainer = card.querySelector('.loot-pills-container');
    if (!pillsContainer) {
      pillsContainer = document.createElement('div');
      pillsContainer.className = 'loot-pills-container';
      pillsContainer.style.cssText = `
          position: absolute;
          bottom: 5px;
          left: 5px;
          right: 5px;
          display: flex;
          flex-wrap: wrap;
          gap: 3px;
          pointer-events: none;
          z-index: 10;
        `;

      // Make parent position relative
      const imgParent = monsterImg.parentElement;
      if (imgParent) {
        imgParent.style.position = 'relative';
        imgParent.appendChild(pillsContainer);
      }
    }

    // Mark as processed
    card.dataset.lootPillsAdded = 'true';

    // Fetch loot data from battle page (attempt to use session cache first for faster page loads)
    // Create cache key by monster id (stable identifier across pages)
    const cacheKey = `lootPills_${monsterId}`;
    const monsterNameEl = card.querySelector('.card-title, .monster-name, h3, .title');
    const monsterNameKey = monsterNameEl ? (monsterNameEl.textContent || '').trim().toLowerCase() : '';
    try {
      let raw = sessionStorage.getItem(cacheKey);
      if (!raw && monsterNameKey) raw = sessionStorage.getItem(`lootPillsName_${monsterNameKey}`);
      if (raw) {
        const docCache = JSON.parse(raw);
        if (docCache && docCache.items && (Date.now() - docCache.timestamp) < (1000 * 60 * 60)) {
          // Render cache
          pillsContainer.innerHTML = '';
          docCache.items.slice(0, 5).forEach(item => {
            const pill = document.createElement('div');
            pill.className = 'loot-probability-pill';
            pill.style.cssText = `position: relative; display:flex; flex-direction:column; align-items:center; justify-content:center; background: rgba(0, 0, 0, 0.85); border: 1px solid rgba(137, 180, 250, 0.5); border-radius: 4px; padding: 3px; font-size: 10px; color: #89b4fa; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.5); width:36px; height:36px;`;
            const lootImg = document.createElement('img');
            lootImg.src = item.img;
            lootImg.style.cssText = 'width:100%;height:100%;border-radius:2px;object-fit:cover;';
            pill.appendChild(lootImg);
            const dropBadge = document.createElement('span');
            dropBadge.textContent = item.dropChance || '';
            dropBadge.style.cssText = `position:absolute; top:1px; right:1px; background: rgba(0,0,0,0.9); color:#a6e3a1; font-size:7px; padding:1px 3px; border-radius:2px; font-weight:bold;`;
            pill.appendChild(dropBadge);
            if (item.requirement && item.requirement.value) {
              const reqText = document.createElement('span');
              reqText.textContent = formatCompactNumber(item.requirement.value);
              reqText.style.cssText = 'position:absolute; bottom:1px; background: rgba(0,0,0,0.9); color:#a6e3a1; font-size:7px; padding:1px 3px; border-radius:2px; font-weight:bold;';
              pill.appendChild(reqText);
            }
            pillsContainer.appendChild(pill);
          });
          // Skip actual fetch — already rendered
          continue;
        }
      }
    } catch (e) {
      console.warn('Loot pills cache read error', e);
    }
    try {
      const response = await fetch(`battle.php?id=${monsterId}`, {
        credentials: 'include',
        mode: 'same-origin'
      });

      if (!response.ok) continue;

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extract user's damage from battle page
      let damageDone = 0;
      const allText = doc.body.textContent || '';

      // Try multiple sources to find damage
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

      // Extract loot items with requirements
      const lootCards = doc.querySelectorAll('.loot-card, .loot-item');
      const lootItems = [];

      lootCards.forEach(lootCard => {
        const img = lootCard.querySelector('img');
        const dropChance = lootCard.querySelector('.drop-chance');
        const chips = lootCard.querySelectorAll('.chip');

        let requirementValue = null;
        let tier = 'common';
        let dropChanceText = '';

        // Look for drop chance and DMG req in chip elements
        chips.forEach(chip => {
          const text = (chip.textContent || '').trim();
          if (!text) return;

          // Check for tier
          if (chip.classList.contains('legendary')) tier = 'legendary';
          else if (chip.classList.contains('epic')) tier = 'epic';
          else if (chip.classList.contains('rare')) tier = 'rare';
          else if (chip.classList.contains('common')) tier = 'common';

          const lowerText = text.toLowerCase();
          if (lowerText.includes('legendary')) tier = 'legendary';
          else if (lowerText.includes('epic')) tier = 'epic';
          else if (lowerText.includes('rare')) tier = 'rare';

          // Extract drop chance if not found yet
          if (!dropChanceText && /drop[:\s]/i.test(text)) {
            dropChanceText = text.replace(/drop[:\s]*/i, '').trim();
          }

          // Extract DMG req specifically
          if (/dmg\s+req[:\s]/i.test(text)) {
            requirementValue = parseRequirementValue(text);
          }
        });

        // Use dropChance element or extracted text from chips
        const finalDropChance = dropChance ? dropChance.textContent.trim() : dropChanceText;

        if (img && finalDropChance) {
          lootItems.push({
            img: img.src,
            dropChance: finalDropChance,
            requirement: requirementValue !== null ? {
              value: requirementValue,
              met: damageDone >= requirementValue
            } : null,
            tier: tier
          });
        }
      });

      // Limit to first 5 items
      const displayItems = lootItems.slice(0, 5);

      // Clear existing pills
      pillsContainer.innerHTML = '';

      // Add pills for each loot item
      displayItems.forEach(item => {
        const pill = document.createElement('div');
        pill.className = 'loot-probability-pill';

        pill.style.cssText = `
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.85);
            border: 1px solid rgba(137, 180, 250, 0.5);
            border-radius: 4px;
            padding: 3px;
            font-size: 10px;
            color: #89b4fa;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            width: 36px;
            height: 36px;
          `;

        const lootImg = document.createElement('img');
        lootImg.src = item.img;
        lootImg.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 2px;
            object-fit: cover;
            ${extensionSettings.battlePageHideImages ? 'display: none;' : ''}
          `;

        pill.appendChild(lootImg);

        // Drop chance badge on top-right of image
        const dropBadge = document.createElement('span');
        dropBadge.textContent = item.dropChance;
        dropBadge.style.cssText = `
            position: absolute;
            top: 1px;
            right: 1px;
            background: rgba(0, 0, 0, 0.9);
            color: #a6e3a1;
            font-size: 7px;
            padding: 1px 3px;
            border-radius: 2px;
            font-weight: bold;
            line-height: 1;
            z-index: 2;
          `;
        pill.appendChild(dropBadge);

        // Add requirement text at the bottom if exists
        if (item.requirement && item.requirement.value) {
          const reqText = document.createElement('span');
          let reqValue = item.requirement.value;
          let displayValue = '';

          // Format value with k suffix if >= 1000
          if (reqValue >= 1000) {
            displayValue = Math.floor(reqValue / 1000) + 'k';
          } else {
            displayValue = reqValue.toLocaleString();
          }

          reqText.textContent = displayValue;
          reqText.style.cssText = `
              position: absolute;
              bottom: 1px;
              background: rgba(0, 0, 0, 0.9);
              color: #a6e3a1;
              font-size: 7px;
              padding: 1px 3px;
              border-radius: 2px;
              font-weight: bold;
              line-height: 1;
              z-index: 2;
            `;
          pill.appendChild(reqText);
        }

        pillsContainer.appendChild(pill);
      });

      // Save minimalloot info in session storage for quicker loads next time
      try {
        const itemsToCache = lootItems.map(li => ({ img: li.img, dropChance: li.dropChance, requirement: li.requirement ? { value: li.requirement.value, met: li.requirement.met } : null, tier: li.tier }));
        sessionStorage.setItem(cacheKey, JSON.stringify({ items: itemsToCache, timestamp: Date.now() }));
        if (monsterNameKey) {
          try { sessionStorage.setItem(`lootPillsName_${monsterNameKey}`, JSON.stringify({ items: itemsToCache, timestamp: Date.now() })); } catch (err) { /* ignore */ }
        }
      } catch (err) {
        console.warn('Failed to write loot pills cache', err);
      }

      // Add damage badge to monster-badges-container (next to attacks/defense/players)
      if (damageDone > 0) {
        // Find or create monster-badges-container
        const monsterImgParent = card.querySelector('.monster-img')?.parentElement;
        if (monsterImgParent) {
          let badgesContainer = monsterImgParent.querySelector('.monster-badges-container');
          if (!badgesContainer) {
            badgesContainer = document.createElement('div');
            badgesContainer.className = 'monster-badges-container';
            badgesContainer.style.cssText = `
                position: absolute;
                top: 8px;
                left: 8px;
                display: flex;
                flex-direction: row;
                gap: 4px;
                z-index: 1;
              `;
            monsterImgParent.appendChild(badgesContainer);
          }

          // Check if damage badge already exists
          let damageBadge = badgesContainer.querySelector('.damage-badge');
          if (!damageBadge) {
            damageBadge = document.createElement('span');
            damageBadge.className = 'damage-badge';
            damageBadge.style.cssText = `
                background: rgba(0, 0, 0, 0.75);
                color: white;
                padding: 6px;
                border-radius: 6px;
                font-size: 0.7rem;
                font-weight: bold;
                backdrop-filter: blur(8px);
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
                min-width: 32px;
                text-align: center;
                display: flex;
                align-items: center;
                justify-content: center;
              `;
            badgesContainer.appendChild(damageBadge);
          }

          damageBadge.textContent = `💥 ${damageDone.toLocaleString()}`;
        }
      }



    } catch (error) {
      console.error(`Failed to fetch loot data for monster ${monsterId}:`, error);
    }
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

function initPvPMods() {
  initPvPBannerFix();

  // Initialize prediction based on settings
  if (extensionSettings.pvpBattlePrediction.enabled) {
    // Create prediction box if prediction is enabled
    createPredictionBox();
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

function initPvPBattleMods() {
  initAutoSlash()
}

function initBattlePassMods() {
  // Add CSS rules for battle pass hero styling
  const css = `
      .bp-hero {
        margin-top: 0px !important;
        width: 80% !important;
        margin-left: auto !important;
        margin-right: 0 !important;
      }
    `;

  // Add the CSS to the document head
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

// NEW: Define initDungeonLocationMods to fix the ReferenceError
function initDungeonLocationMods() {
  initDungeonPageTransformation();
}

function initDashboardTools() {
  console.log("Initializing dashboard tools");
}

function initBattleLayoutSideBySide() {
  // First, forcefully convert any loot panels to loot-panel class
  var lootPanels = document.querySelectorAll('.panel');
  lootPanels.forEach(function (panel) {
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

function initBattleMods() {
  initReducedImageSize()
  initTotalOwnDamage()
  initAnyClickClosesModal()
  addBattleHideImagesToggle()
  initBattleLayoutSideBySide()

  // Apply initial monster backgrounds
  applyMonsterBackgrounds()
  applyLootPanelColors()

  // Helper: move player's HP/damage/retaliation UI into monster-display (mirrors attack-buttons movement)
  function movePlayerInfoIntoMonsterDisplay() {
    try {
      ensurePlayerInfoStyles();
      const monsterDisplay = document.getElementById('monster-display');
      if (!monsterDisplay) return;

      const panel = document.querySelector('body > div.main-wrapper > div > .panel') || document.querySelector('.panel');
      if (!panel) return;

      // Reuse wrapper if present; otherwise create
      let wrapper = document.getElementById('extension-player-info');
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'extension-player-info';
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '8px';
        wrapper.style.width = '100%';
      } else {
        // clear existing contents so we can re-populate
        wrapper.innerHTML = '';
      }

      const elementsToMove = [];

      // Try to move an explicit "Your HP" strong label if present in the panel
      const strongs = Array.from(panel.querySelectorAll('strong'));
      for (const s of strongs) {
        if (s.textContent && s.textContent.trim().toLowerCase().includes('your hp')) {
          elementsToMove.push(s);
          break;
        }
      }

      // Common HP elements
      const hpBar = panel.querySelector('.hp-bar');
      if (hpBar) elementsToMove.push(hpBar);

      const hpText = panel.querySelector('.hp-text');
      if (hpText) elementsToMove.push(hpText);

      // Fallback to known IDs (if used elsewhere)
      const pHpFill = document.getElementById('pHpFill');
      if (pHpFill && !elementsToMove.includes(pHpFill.closest('.hp-bar'))) {
        const possible = pHpFill.closest('.hp-bar') || pHpFill;
        elementsToMove.push(possible);
      }

      const pHpText = document.getElementById('pHpText');
      if (pHpText && !elementsToMove.includes(pHpText)) elementsToMove.push(pHpText);

      // Damage / retaliation elements
      const myDmgChip = document.getElementById('myDmgChip') || panel.querySelector('.my-dmg-chip');
      if (myDmgChip) elementsToMove.push(myDmgChip);

      const retaliationCard = panel.querySelector('.retaliation-card') || document.querySelector('.retaliation-card');
      if (retaliationCard) elementsToMove.push(retaliationCard);

      if (elementsToMove.length === 0) return;

      // Append found elements into wrapper
      elementsToMove.forEach(el => {
        try { wrapper.appendChild(el); } catch (e) { /* ignore individual move errors */ }
      });

      // Insert wrapper into monsterDisplay near attack buttons if present, otherwise append
      const attackWrap = monsterDisplay.querySelector('.attack-btn-wrap') || monsterDisplay.querySelector('.attack-btn-wrap');
      try {
        if (attackWrap && attackWrap.parentNode) {
          attackWrap.parentNode.insertBefore(wrapper, attackWrap);
        } else if (!monsterDisplay.contains(wrapper)) {
          monsterDisplay.appendChild(wrapper);
        }
      } catch (err) {
        console.warn('Could not insert player info before attackWrap, appending instead', err);
        try { if (!monsterDisplay.contains(wrapper)) monsterDisplay.appendChild(wrapper); } catch (e) { /* give up */ }
      }
    } catch (err) {
      console.error('movePlayerInfoIntoMonsterDisplay error', err);
    }
  }

  // Ensure styles for the injected player-info so HP bars are visible when moved
  function ensurePlayerInfoStyles() {
    if (document.getElementById('extension-player-info-styles')) return;
    const style = document.createElement('style');
    style.id = 'extension-player-info-styles';
    style.textContent = `
        #extension-player-info { color: #e6eef8; }
        #extension-player-info .hp-bar { background: rgba(255,255,255,0.05); border-radius: 8px; width: 92%; height: 14px; position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,0.04); }
        #extension-player-info .hp-text { margin-top:6px; font-size:13px; color: #f3f6ff; }
        #extension-player-info .hp-bar + .hp-bar { margin-top:6px; }
        #extension-player-info .chip.stat { background: rgba(255,255,255,0.04); color:#cfe6ff; padding:6px 8px; border-radius:6px; }
        #extension-player-info .retaliation-card { background: linear-gradient(180deg, rgba(40,40,60,0.6), rgba(30,30,46,0.6)); border-radius:8px; padding:8px; width:92%; box-sizing:border-box; color:#dbe7ff; }
      `;
    document.head.appendChild(style);
  }

  // Run initial move (if elements exist)
  try { movePlayerInfoIntoMonsterDisplay(); } catch (e) { console.error(e); }

  // Initialize leaderboard highlighting
  setTimeout(() => {
    highlightCurrentUserInLeaderboard();
  }, 1000);

  // Set up observer for panel changes
  const observer = new MutationObserver(() => {
    applyMonsterBackgrounds();
    applyLootPanelColors();
    highlightCurrentUserInLeaderboard();
    try { movePlayerInfoIntoMonsterDisplay(); } catch (e) { /* ignore */ }
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

function initChatMods() {
  const logEl = document.getElementById("chatLog");
  if (logEl) {
    logEl.scrollTop = logEl.scrollHeight;
  }
  createBackToDashboardButton();
  removeOriginalBackButton();
}

function initInventoryMods() {
  initAlternativeInventoryView()
  initItemTotalDmg()
  addInventoryQuickAccessButtons()
  createBackToDashboardButton()
  removeOriginalBackButton()
  initializeEquipmentSets()
  applyCustomBackgrounds()
}

function initMerchantMods() {
  addMerchantQuickAccessButtons()
  applyCustomBackgrounds()
}



function getInventoryItemQuantity(itemName) {
  // First try to find on current page (if on inventory page)
  if (window.location.pathname.includes('inventory.php')) {
    const allSections = document.querySelectorAll('.section');

    for (const section of allSections) {
      const slotBoxes = section.querySelectorAll('.slot-box');

      for (const slot of slotBoxes) {
        const img = slot.querySelector('img');

        if (img && img.alt && img.alt.trim().toLowerCase() === itemName.toLowerCase()) {
          // Improved quantity detection (reads x### text correctly)
          let qty = 0;

          // Look for explicit "x###" pattern anywhere in the slot text
          const text = slot.textContent || '';
          const match = text.match(/x\s*([0-9]{1,5})/i);
          if (match) {
            qty = parseInt(match[1].replace(/[^\d]/g, ''), 10);
          }

          // Fallback: input max attribute (like "max=197")
          if (!qty) {
            const qtyInput = slot.querySelector('input[type="number"]');
            if (qtyInput) {
              const max = qtyInput.getAttribute('max');
              if (max) qty = parseInt(max, 10);
              if (!qty) {
                const val = qtyInput.value || qtyInput.getAttribute('value');
                if (val) qty = parseInt(val, 10);
              }
            }
          }

          return qty || 1; // Return at least 1 if item exists but no quantity found
        }
      }
    }
  }

  // If not on inventory page, try to get from pinned items in sidebar
  const pinnedItem = extensionSettings.pinnedInventoryItems.find(item => (item.name || '').trim().toLowerCase() === (itemName || '').trim().toLowerCase());
  if (pinnedItem) {
    return pinnedItem.quantity || 0;
  }

  // If still not found, return 0 (item doesn't exist)
  return 0;
}

// ===== ENHANCED POTION HELPER SYSTEM =====

const POTION_STORAGE_KEY = 'expPotionTimerEnd';
let potionExpTimer = null;
let potionExpTimerEnd = null;

// Enhanced findConsumableByName with improved detection
async function findConsumableByName(name) {
  try {
    const res = await fetch('/inventory.php', { credentials: 'same-origin' });
    if (!res.ok) return null;
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const slots = Array.from(doc.querySelectorAll('.slot-box'));
    const target = slots.find(s => {
      const img = s.querySelector('img');
      return img && img.alt && img.alt.trim().toLowerCase() === name.toLowerCase();
    }) || slots.find(s => {
      const img = s.querySelector('img');
      return img && img.alt && img.alt.toLowerCase().includes(name.toLowerCase());
    });
    if (!target) return null;

    // Try dataset or data-item-id
    let invId = null;
    if (target.dataset && target.dataset.itemId) invId = target.dataset.itemId;
    if (!invId) {
      const attr = target.getAttribute('data-item-id') || target.getAttribute('data-item-id-raw') || '';
      if (attr) {
        const first = attr.split(',')[0].trim();
        if (/^\d+$/.test(first)) invId = first;
      }
    }
    if (!invId) {
      const useBtn = target.querySelector('button.btn[onclick], button.btn');
      if (useBtn) {
        const onclick = useBtn.getAttribute('onclick') || '';
        let m = onclick.match(/useItem\(\s*([0-9]+)\s*,/i);
        if (m) invId = m[1];
        else {
          m = onclick.match(/inv_id=([0-9]+)/i);
          if (m) invId = m[1];
        }
      }
    }

    // Improved quantity detection (reads x### text correctly)
    let qty = 0;
    // Look for explicit "x###" pattern anywhere
    const text = target.textContent || '';
    const m2 = text.match(/x\s*([0-9]{1,5})/i);
    if (m2) {
      qty = parseInt(m2[1].replace(/[^\d]/g, ''), 10);
    }
    // Fallback: input max attribute (like "max=197")
    if (!qty) {
      const qtyInput = target.querySelector('input[type="number"]');
      if (qtyInput) {
        const max = qtyInput.getAttribute('max');
        if (max) qty = parseInt(max, 10);
        if (!qty) {
          const val = qtyInput.value || qtyInput.getAttribute('value');
          if (val) qty = parseInt(val, 10);
        }
      }
    }

    return { invId: invId ? String(invId) : null, quantity: qty || 0 };
  } catch (e) {
    console.error('findConsumableByName error', e);
    return null;
  }
}

// Use item by inv_id with enhanced logic
async function consumeByName(name, count = 1) {
  if (!count || count < 1) return 0;
  let used = 0;
  for (let i = 0; i < count; i++) {
    const item = await findConsumableByName(name);
    if (!item || !item.invId) {
      if (used === 0) showNotification(`No ${name} found`, 'warning');
      break;
    }
    try {
      // Try to call site JS if available (best) then fallback to POST
      if (typeof window.useItem === 'function') {
        try {
          window.useItem(parseInt(item.invId, 10), 0, name, item.quantity || 1);
          used++;
          await new Promise(r => setTimeout(r, 700));
          continue;
        } catch (err) {
          // fallback
        }
      }

      const res = await fetch('/use_item.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'inv_id=' + encodeURIComponent(item.invId)
      });
      const text = await res.text();
      if (res.ok && (text.length > 0 || text.toLowerCase().includes('success') || text.toLowerCase().includes('consumed'))) {
        used++;
        await new Promise(r => setTimeout(r, 700));
      } else {
        console.warn('use_item response not ok', res.status, text);
        break;
      }
    } catch (e) {
      console.error('consumeByName error', e);
      break;
    }
  }
  if (used > 0) showNotification(`Consumed ${used} ${name}${used > 1 ? 's' : ''}`, 'success');
  return used;
}

// Exp timer functions for potion tracking
function startPotionExpTimer() {
  potionExpTimerEnd = Date.now() + 3600 * 1000;
  localStorage.setItem(POTION_STORAGE_KEY, String(potionExpTimerEnd));
  if (potionExpTimer) clearInterval(potionExpTimer);
  potionExpTimer = setInterval(updatePotionExpTimerUI, 1000);
  updatePotionExpTimerUI();
}

function resumePotionExpTimerIfActive() {
  const stored = localStorage.getItem(POTION_STORAGE_KEY);
  if (!stored) return;
  const end = parseInt(stored, 10);
  if (end > Date.now()) {
    potionExpTimerEnd = end;
    if (potionExpTimer) clearInterval(potionExpTimer);
    potionExpTimer = setInterval(updatePotionExpTimerUI, 1000);
    updatePotionExpTimerUI();
  } else {
    localStorage.removeItem(POTION_STORAGE_KEY);
  }
}

function updatePotionExpTimerUI() {
  const el = document.getElementById('exp-timer-exp');
  if (!el || !potionExpTimerEnd) return;
  const rem = potionExpTimerEnd - Date.now();
  if (rem <= 0) {
    clearInterval(potionExpTimer); potionExpTimer = null;
    el.textContent = 'Inactive';
    localStorage.removeItem(POTION_STORAGE_KEY);
    return;
  }
  const mins = Math.floor(rem / 60000);
  const secs = Math.floor((rem % 60000) / 1000);
  el.textContent = `Active: ${mins}m ${secs}s`;
}

// Initialize floating potion helper
function initFloatingPotionHelper() {
  if (!extensionSettings.potionHelper.enabled || !extensionSettings.potionHelper.showFloatingIcons) return;

  // Remove existing floating helper if present
  const existing = document.getElementById('potion-container');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.id = 'potion-container';
  container.style.position = 'fixed';
  container.style.right = '12px';
  container.style.top = extensionSettings.potionHelper.topOffset;
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'flex-end';
  container.style.gap = '8px';
  container.style.zIndex = '2147483646';
  container.style.pointerEvents = 'auto';

  POTIONS.forEach(p => {
    const box = createPotionBox(p);
    container.appendChild(box);
  });

  document.body.appendChild(container);

  // Initial refresh and timer restoration
  setTimeout(() => {
    refreshAllPotionCounts();
    resumePotionExpTimerIfActive();
  }, 600);
}

// Helper functions for potion UI
function closeAllPotionPanels(exceptKey) {
  document.querySelectorAll('.potion-panel').forEach(panel => {
    const key = panel.dataset.key;
    if (key === exceptKey) return;
    panel.style.maxWidth = '0';
    panel.style.opacity = '0';
    panel.style.padding = '0 8px';
    panel.classList.remove('open');
    setTimeout(() => {
      if (!panel.classList.contains('open')) panel.style.display = 'none';
    }, 300);
  });
}

function createPotionBox(p) {
  const item = document.createElement('div');
  item.style.display = 'flex';
  item.style.alignItems = 'flex-start';
  item.style.gap = '8px';
  item.style.width = '100%';
  item.style.justifyContent = 'flex-end';

  // Panel (left) - initially hidden
  const panel = document.createElement('div');
  panel.className = 'potion-panel';
  panel.id = `panel-${p.key}`;
  panel.dataset.key = p.key;
  panel.style.display = 'none';
  panel.style.boxSizing = 'border-box';
  panel.style.width = '300px';
  panel.style.maxWidth = '0';
  panel.style.opacity = '0';
  panel.style.overflow = 'hidden';
  panel.style.transition = 'max-width 280ms ease, opacity 220ms ease, padding 220ms';
  panel.style.padding = '0 8px';
  panel.style.borderRadius = '8px';
  panel.style.background = '#0f1116';
  panel.style.color = '#e9ecff';
  panel.style.boxShadow = '0 10px 26px rgba(0,0,0,0.45)';

  // Panel content
  const panelInner = document.createElement('div');
  panelInner.style.padding = '10px';
  panelInner.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px">
        <img src="${p.icon}" style="width:28px;height:28px;border-radius:6px;object-fit:cover">
        <div style="flex:1">
          <div style="font-weight:700">${p.name}</div>
          <div id="avail-${p.key}" style="font-size:12px;color:#aaa">Available: ...</div>
        </div>
        <div id="count-${p.key}" style="font-weight:700;color:#9fff9a">x0</div>
      </div>
    `;
  panel.appendChild(panelInner);

  // Control row
  const ctrl = document.createElement('div');
  ctrl.style.display = 'flex';
  ctrl.style.gap = '8px';
  ctrl.style.marginTop = '8px';
  ctrl.style.alignItems = 'center';

  if (p.multi) {
    const dec = document.createElement('button');
    dec.textContent = '−';
    dec.style.padding = '6px 8px';
    dec.style.background = '#222';
    dec.style.color = '#fff';
    dec.style.border = 'none';
    dec.style.borderRadius = '6px';
    dec.style.cursor = 'pointer';

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.value = '1';
    input.id = `inp-${p.key}`;
    input.style.width = '60px';
    input.style.padding = '6px';
    input.style.borderRadius = '6px';
    input.style.background = '#0b0c10';
    input.style.color = '#e9ecff';
    input.style.border = '1px solid #222';

    const inc = document.createElement('button');
    inc.textContent = '+';
    inc.style.padding = '6px 8px';
    inc.style.background = '#222';
    inc.style.color = '#fff';
    inc.style.border = 'none';
    inc.style.borderRadius = '6px';
    inc.style.cursor = 'pointer';

    dec.addEventListener('click', () => { input.value = Math.max(1, parseInt(input.value || '1', 10) - 1); });
    inc.addEventListener('click', () => { input.value = Math.max(1, parseInt(input.value || '1', 10) + 1); });

    ctrl.appendChild(dec);
    ctrl.appendChild(input);
    ctrl.appendChild(inc);
  }

  const useBtn = document.createElement('button');
  useBtn.textContent = 'Use';
  useBtn.style.flex = '1';
  useBtn.style.padding = '8px 10px';
  useBtn.style.background = '#8a2be2';
  useBtn.style.color = '#fff';
  useBtn.style.border = 'none';
  useBtn.style.borderRadius = '8px';
  useBtn.style.cursor = 'pointer';

  ctrl.appendChild(useBtn);
  panel.appendChild(ctrl);

  // Exp timer element
  if (p.hasTimer) {
    const timerLine = document.createElement('div');
    timerLine.id = `exp-timer-${p.key}`;
    timerLine.style.marginTop = '8px';
    timerLine.style.fontSize = '12px';
    timerLine.style.color = '#7ef';
    timerLine.textContent = 'Inactive';
    panel.appendChild(timerLine);
  }

  // Icon at right
  const icon = document.createElement('img');
  icon.src = p.icon;
  icon.alt = p.name;
  icon.title = p.name;
  icon.style.width = '44px';
  icon.style.height = '44px';
  icon.style.borderRadius = '8px';
  icon.style.cursor = 'pointer';
  icon.style.boxShadow = '0 6px 16px rgba(0,0,0,0.35)';
  icon.style.background = '#06111a';

  // Icon click behavior - either toggle panel or use potion directly
  icon.addEventListener('click', () => {
    if (extensionSettings.potionHelper.clickToUse) {
      // Direct use mode - use potion with count of 1
      usePotionDirectly(p, 1);
    } else {
      // Panel toggle mode (original behavior)
      const isOpen = panel.classList.contains('open');
      if (isOpen) {
        panel.classList.remove('open');
        panel.style.maxWidth = '0';
        panel.style.opacity = '0';
        panel.style.padding = '0 8px';
        setTimeout(() => { if (!panel.classList.contains('open')) panel.style.display = 'none'; }, 300);
      } else {
        closeAllPotionPanels(p.key);
        panel.style.display = 'block';
        requestAnimationFrame(() => {
          panel.style.maxWidth = '320px';
          panel.style.opacity = '1';
          panel.style.padding = '8px';
          panel.classList.add('open');
        });
        refreshSinglePotion(p);
        if (p.hasTimer) resumePotionExpTimerIfActive();
      }
    }
  });

  // Use button behavior
  useBtn.addEventListener('click', async () => {
    useBtn.disabled = true;
    useBtn.style.opacity = '0.6';
    let cnt = 1;
    if (p.multi) {
      const inp = document.getElementById(`inp-${p.key}`);
      cnt = Math.max(1, parseInt(inp.value || '1', 10));
    }
    const used = await consumeByName(p.name, cnt);
    useBtn.disabled = false;
    useBtn.style.opacity = '1';
    if (used > 0) {
      if (p.hasTimer) {
        startPotionExpTimer();
        const el = document.getElementById(`exp-timer-${p.key}`);
        if (el) updatePotionExpTimerUI();
      }
      refreshSinglePotion(p);
    }
  });

  item.appendChild(panel);
  item.appendChild(icon);
  return item;
}

async function refreshSinglePotion(p) {
  try {
    const info = await findConsumableByName(p.name);
    const qty = info?.quantity || 0;
    const avail = document.getElementById(`avail-${p.key}`);
    const count = document.getElementById(`count-${p.key}`);
    if (avail) avail.textContent = `Available: x${qty}`;
    if (count) count.textContent = `x${qty}`;
  } catch (e) {
    console.warn('refreshSinglePotion error', e);
  }
}

async function refreshAllPotionCounts() {
  await Promise.all(POTIONS.map(p => refreshSinglePotion(p)));
}

// Direct potion use function for click-to-use feature
async function usePotionDirectly(p, count = 1) {
  try {
    const used = await consumeByName(p.name, count);
    if (used > 0) {
      showNotification(`Used ${p.name} x${used}`, 'success');
      if (p.hasTimer) {
        startPotionExpTimer();
        const el = document.getElementById(`exp-timer-${p.key}`);
        if (el) updatePotionExpTimerUI();
      }
      refreshSinglePotion(p);
    } else {
      showNotification(`No ${p.name} available`, 'error');
    }
  } catch (e) {
    console.warn('usePotionDirectly error:', e);
    showNotification('Error using potion', 'error');
  }
}

// Hotkey support for potions
function setupPotionHotkeys() {
  // Remove existing listeners
  document.removeEventListener('keydown', potionHotkeyHandler);

  // Add listener if any hotkeys are configured
  const hotkeys = extensionSettings.potionHelper.hotkeys;
  if (hotkeys && (hotkeys.small || hotkeys.full || hotkeys.exp || hotkeys.hp || hotkeys.mana_s || hotkeys.mana_l)) {
    document.addEventListener('keydown', potionHotkeyHandler);
  }
}

function potionHotkeyHandler(e) {
  // Don't trigger if user is typing in an input field
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  const pressedKey = e.key.toLowerCase();
  const hotkeys = extensionSettings.potionHelper.hotkeys;

  // Check each potion hotkey
  POTIONS.forEach(potion => {
    if (hotkeys[potion.key] && hotkeys[potion.key] === pressedKey) {
      e.preventDefault();
      usePotionDirectly(potion, 1);
    }
  });
}

// ===== END ENHANCED POTION HELPER SYSTEM =====

// ===== ADVANCED PET TEAMS SYSTEM =====

const PET_STORAGE_KEY = "pet_teams_v1";
const PET_APPLY_DELAY = 350;

// Pet teams utility functions
function getPetStorageTeams() {
  try {
    const raw = localStorage.getItem(PET_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("Error loading pet teams:", error);
    return {};
  }
}

function savePetStorageTeams(obj) {
  try {
    localStorage.setItem(PET_STORAGE_KEY, JSON.stringify(obj));
  } catch (error) {
    console.error("Error saving pet teams:", error);
  }
}

function showPetNotification(msg, type = "info") {
  if (typeof showNotification === "function") {
    showNotification(msg, type);
  } else {
    console.log(`[PET][${type}]`, msg);
  }
}

// Pet teams integrated UI builder
function addPetTeamsToPage() {
  if (!extensionSettings.petTeams.enabled) return;
  if (document.getElementById("integrated-pet-teams")) return;

  const container = document.querySelector(".section");
  if (!container) return;

  const panel = document.createElement("div");
  panel.id = "integrated-pet-teams";
  panel.innerHTML = `
      <div style="background: rgba(30, 30, 46, 0.8); border: 1px solid rgba(43, 46, 73, 0.6); border-radius: 10px; padding: 20px; margin: 20px 0; backdrop-filter: blur(10px);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; cursor: pointer;" id="pet-teams-header">
          <div style="font-size: 18px; font-weight: 800; color: #f9e2af;">🐾 Pet Teams</div>
          <div id="pet-teams-toggle" style="font-size: 16px; color: #89b4fa; transition: transform 0.3s ease;">▼</div>
        </div>
        
        <div id="pet-teams-content" style="transition: all 0.3s ease; overflow: hidden;">
          <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <input id="new-pet-team-name" placeholder="Enter team name..." style="flex: 1; padding: 8px 8px;margin: 4px; background: rgba(20, 20, 26, 0.7); border: 1px solid rgba(51, 51, 51, 0.5); border-radius: 6px; color: #fff; font-size: 14px;" />
            <button id="record-pet-btn" class="pet-btn record-btn">⤴ Select Pets</button>
          </div>
          
          <div id="pet-preview" style="min-height: 60px; padding: 10px; background: rgba(20, 20, 26, 0.3); border: 1px solid rgba(51, 51, 51, 0.4); border-radius: 6px; margin-bottom: 15px;">
            <div style="color: #9aa0b8; text-align: center; font-size: 12px;">No pets selected. Click "Select Pets" then choose your pets.</div>
          </div>
          
          <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <button id="save-pet-team" class="pet-btn save-team">💾 Save Pet Team</button>
          </div>
          
          <div id="integrated-pet-teams-list" style="max-height: 250px; overflow-y: auto;">
            <!-- Teams will be loaded here -->
          </div>
        </div>
      </div>
    `;

  // Add styles if not already present
  if (!document.getElementById('pet-teams-styles')) {
    const style = document.createElement("style");
    style.id = 'pet-teams-styles';
    style.textContent = `
        .pet-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 12px;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .pet-btn.record-btn {
          background: linear-gradient(135deg, #89b4fa 0%, #74c7ec 100%);
          color: #1e1e2e;
        }
        .pet-btn.save-team {
          background: linear-gradient(135deg, #a6e3a1 0%, #94e2d5 100%);
          color: #1e1e2e;
        }
        .pet-btn.apply-team {
          background: linear-gradient(135deg, #89b4fa 0%, #74c7ec 100%);
          color: #1e1e2e;
          font-size: 11px;
          padding: 6px 12px;
        }
        .pet-btn.delete-team {
          background: linear-gradient(135deg, #f38ba8 0%, #eba0ac 100%);
          color: #1e1e2e;
          font-size: 11px;
          padding: 6px 12px;
        }
        .pet-btn.edit-team {
          background: linear-gradient(135deg, #fab387 0%, #f9e2af 100%);
          color: #1e1e2e;
          font-size: 11px;
          padding: 6px 12px;
        }
        .pet-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.05);
        }
        .pet-team-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: rgba(30, 30, 46, 0.4);
          border: 1px solid rgba(69, 71, 90, 0.5);
          border-radius: 8px;
          margin-bottom: 8px;
          backdrop-filter: blur(5px);
        }
        .pet-team-name {
          font-weight: 600;
          color: #f9e2af;
          flex: 1;
        }
        .pet-team-preview {
          display: flex;
          gap: 5px;
          margin: 5px 0;
        }
        .pet-team-preview img {
          width: 24px;
          height: 24px;
          border-radius: 3px;
          border: 1px solid #45475a;
        }
        .pet-team-actions {
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
          backdrop-filter: blur(3px);
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
  }

  container.insertBefore(panel, container.firstChild);

  // Add event listeners after the panel is added to DOM
  setTimeout(() => {
    const recordBtn = document.getElementById("record-pet-btn");
    const saveBtn = document.getElementById("save-pet-team");
    const header = document.getElementById("pet-teams-header");
    const content = document.getElementById("pet-teams-content");
    const toggle = document.getElementById("pet-teams-toggle");

    if (recordBtn) {
      recordBtn.addEventListener("click", window.startPetRecordingSelection);
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", window.saveCurrentPetTeam);
    }

    // Toggle collapse/expand functionality
    if (header && content && toggle) {
      let isCollapsed = false;
      header.addEventListener("click", () => {
        isCollapsed = !isCollapsed;
        if (isCollapsed) {
          content.style.maxHeight = "0px";
          content.style.opacity = "0";
          content.style.marginTop = "0px";
          toggle.style.transform = "rotate(-90deg)";
          toggle.textContent = "▶";
        } else {
          content.style.maxHeight = "1000px";
          content.style.opacity = "1";
          content.style.marginTop = "15px";
          toggle.style.transform = "rotate(0deg)";
          toggle.textContent = "▼";
        }
      });
    }
    loadPetTeams();
  }, 100);
}

// Apply pet teams with advanced logic
async function applyAdvancedPetTeam(teamObj) {
  showPetNotification("Applying pet team...", "info");
  const urlSet = new URLSearchParams(location.search).get("team") || "atk";

  for (const pet of Object.values(teamObj)) {
    try {
      const res = await fetch("inventory_ajax.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `action=equip_pet&team=${encodeURIComponent(urlSet)}&pet_inv_id=${pet.invId
          }&slot_id=${pet.slot}`,
      });
      const txt = await res.text();
      if (txt.trim() !== "OK") {
        console.warn("[PetTeams] non-OK:", txt);
      }
    } catch (e) {
      console.error("Pet team error:", e);
    }
    await new Promise((r) => setTimeout(r, PET_APPLY_DELAY));
  }

  showPetNotification("Pet team applied successfully! Reloading...", "success");
  setTimeout(() => location.reload(), 800);
}

// Pet teams recording and management
let currentPetRecord = {};
let isPetRecording = false;

// Start recording pet selection
window.startPetRecordingSelection = function () {
  if (isPetRecording) {
    stopPetRecordingSelection();
    return;
  }
  isPetRecording = true;
  currentPetRecord = {};
  updatePetPreview();

  let floating = document.getElementById("floating-pet-preview");
  if (!floating) {
    floating = document.createElement("div");
    floating.id = "floating-pet-preview";
    floating.style.cssText = `
        position:fixed;bottom:70px;right:10px;
        background:rgba(30,30,46,0.9);
        border:1px solid rgba(92,214,92,0.4);
        border-radius:8px;
        padding:8px;z-index:9999;
        max-width:250px;display:flex;
        flex-wrap:wrap;gap:4px;
      `;
    document.body.appendChild(floating);
  }
  updateFloatingPetPreview();

  document.querySelectorAll(".slot-box").forEach((box) => {
    const img = box.querySelector("img");
    if (!img) return;

    box.style.outline = "2px dashed #5cd65c";
    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const invId = box.getAttribute("data-pet-inv-id");
      if (!invId) return;

      const name = img.alt || "Pet";
      const slot = parseInt(prompt("Choose slot (1, 2 or 3):", "1"), 10);
      if (![1, 2, 3].includes(slot)) return;

      // Clear older slot
      for (const key in currentPetRecord) {
        if (currentPetRecord[key].slot === slot) {
          delete currentPetRecord[key];
        }
      }

      box.style.outline = "2px solid #5cd65c";

      currentPetRecord[invId] = { invId, name, img: img.src, slot };
      updatePetPreview();
      updateFloatingPetPreview();
      showPetNotification(`${name} added to slot ${slot}`, "success");
    };
    box.__petHandler = handler;
    box.addEventListener("click", handler, true);
  });

  const recordBtn = document.getElementById("record-pet-btn");
  if (recordBtn) {
    recordBtn.textContent = "⤵ Stop Selection";
    recordBtn.style.background = "#f38ba8";
  }

  showPetNotification("Selection mode active!", "info");
};

function stopPetRecordingSelection() {
  isPetRecording = false;
  document.querySelectorAll(".slot-box").forEach((box) => {
    box.style.outline = "";
    if (box.__petHandler) {
      box.removeEventListener("click", box.__petHandler, true);
      delete box.__petHandler;
    }
  });

  const recordBtn = document.getElementById("record-pet-btn");
  if (recordBtn) {
    recordBtn.textContent = "⤴ Select Pets";
    recordBtn.style.background = "";
  }

  const floating = document.getElementById("floating-pet-preview");
  if (floating) floating.remove();

  updatePetPreview();
  showPetNotification("Pet selection stopped", "info");
}

function updatePetPreview() {
  const preview = document.getElementById("pet-preview");
  if (!preview) return;

  const pets = Object.entries(currentPetRecord);
  if (pets.length === 0) {
    preview.innerHTML =
      '<div style="color:#9aa0b8;text-align:center;font-size:12px;">No pets selected. Click "Select Pets".</div>';
    return;
  }

  preview.innerHTML = "";

  pets.forEach(([id, pet]) => {
    const itemEl = document.createElement("div");
    itemEl.className = "preview-item";
    itemEl.innerHTML = `
        <img src="${pet.img}" alt="${pet.name}" title="${pet.name}" />
        <button class="remove-btn">×</button>
        <div style="font-size: 10px; color: #cdd6f4; text-align: center; margin-top: 2px;">Slot ${pet.slot}</div>
      `;

    const removeBtn = itemEl.querySelector(".remove-btn");
    removeBtn.addEventListener("click", () => {
      delete currentPetRecord[id];
      document.querySelectorAll(".slot-box").forEach((box) => {
        box.style.outline = "2px dashed #5cd65c";
      });
      updatePetPreview();
      updateFloatingPetPreview();
    });

    preview.appendChild(itemEl);
  });
  updateFloatingPetPreview();
}

function updateFloatingPetPreview() {
  let floating = document.getElementById("floating-pet-preview");
  if (!floating) return;

  const pets = Object.entries(currentPetRecord);
  if (pets.length === 0) {
    floating.innerHTML = `<div style="color:#aaa;font-size:12px;text-align:center;">No pets</div>`;
    return;
  }

  floating.innerHTML = "";
  pets.forEach(([id, pet]) => {
    const itemEl = document.createElement("div");
    itemEl.style.cssText = `display:inline-block;margin:4px;position:relative;`;
    itemEl.innerHTML = `
        <img src="${pet.img}" title="${pet.name} (Slot ${pet.slot})" style="width:45px;height:45px;border-radius:4px;border:1px solid #5cd65c;" />
        <button data-id="${id}" style="
          position:absolute;top:-6px;right:-6px;
          background:#f38ba8;color:#1e1e2e;border:none;
          border-radius:50%;width:16px;height:16px;
          font-size:10px;cursor:pointer;
        ">×</button>
      `;
    floating.appendChild(itemEl);
  });

  floating.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.target.getAttribute("data-id");
      delete currentPetRecord[id];
      document.querySelectorAll(".slot-box").forEach((box) => {
        box.style.outline = "2px dashed #5cd65c";
      });
      updateFloatingPetPreview();
      updatePetPreview();
    });
  });
}

window.saveCurrentPetTeam = function () {
  const teamName = document.getElementById("new-pet-team-name")?.value?.trim();
  if (!teamName) {
    showPetNotification("Please enter a team name", "error");
    return;
  }
  if (Object.keys(currentPetRecord).length === 0) {
    showPetNotification("No pets selected.", "error");
    return;
  }
  const teams = getPetStorageTeams();
  teams[teamName] = { ...currentPetRecord };
  savePetStorageTeams(teams);

  currentPetRecord = {};
  updatePetPreview();
  document.getElementById("new-pet-team-name").value = "";
  loadPetTeams();
  showPetNotification(`Team "${teamName}" saved!`, "success");
};

window.applyPetTeam = function (name) {
  const teams = getPetStorageTeams();
  if (!teams[name]) {
    showPetNotification("Team not found", "error");
    return;
  }
  applyAdvancedPetTeam(teams[name]);
};

window.deletePetTeam = function (name) {
  if (!confirm(`Delete team "${name}"?`)) return;
  const teams = getPetStorageTeams();
  delete teams[name];
  savePetStorageTeams(teams);
  loadPetTeams();
  showPetNotification(`Team "${name}" deleted.`, "info");
};

window.editPetTeam = function (name) {
  const teams = getPetStorageTeams();
  if (!teams[name]) {
    showPetNotification("Team not found", "error");
    return;
  }

  // Load the team into current record for editing
  currentPetRecord = { ...teams[name] };
  document.getElementById("new-pet-team-name").value = name;
  updatePetPreview();

  // Delete the original team
  delete teams[name];
  savePetStorageTeams(teams);
  loadPetTeams();

  showPetNotification(`Editing team "${name}". Modify and save.`, "info");
};

function loadPetTeams() {
  const list = document.getElementById("integrated-pet-teams-list");
  if (!list) return;

  const teams = getPetStorageTeams();
  const names = Object.keys(teams);
  if (names.length === 0) {
    list.innerHTML =
      '<div style="text-align:center;color:#6c7086;padding:20px;">No pet teams saved yet</div>';
    return;
  }

  list.innerHTML = "";

  names.forEach((name) => {
    const pets = Object.values(teams[name]);
    const teamElement = document.createElement("div");
    teamElement.className = "pet-team-item";
    teamElement.innerHTML = `
        <div>
          <div class="pet-team-name">${name}</div>
          <div class="pet-team-preview">
            ${pets
        .map(
          (p) => `<img src="${p.img}" title="${p.name} (Slot ${p.slot})" />`
        )
        .join("")}
          </div>
          <div style="font-size:12px;color:#6c7086;">${pets.length} pets</div>
        </div>
        <div class="pet-team-actions">
          <button class="pet-btn apply-team">⚡ Apply</button>
          <button class="pet-btn edit-team">✏️ Edit</button>
          <button class="pet-btn delete-team">🗑️ Delete</button>
        </div>
      `;

    const applyBtn = teamElement.querySelector(".apply-team");
    const editBtn = teamElement.querySelector(".edit-team");
    const deleteBtn = teamElement.querySelector(".delete-team");

    applyBtn.addEventListener("click", () => window.applyPetTeam(name));
    editBtn.addEventListener("click", () => window.editPetTeam(name));
    deleteBtn.addEventListener("click", () => window.deletePetTeam(name));

    list.appendChild(teamElement);
  });
}

function initializePetTeams() {
  if (location.pathname.includes("pets.php")) {
    setTimeout(() => {
      addPetTeamsToPage();
    }, 600);
  }
}

// ===== END ADVANCED PET TEAMS SYSTEM =====

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

function initPetMods() {
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

function initStatMods() {
  initPlayerAtkDamage()
  // Stat allocation moved to sidebar - no longer needed on stats page
}

function initBlacksmithMods() {
  // Blacksmith enhancements: only apply non-page intrusive changes here
  applyCustomBackgrounds()

  // For now we don't inject overlays into blacksmith.php (sidebar will show craftable/uncraftable)
  // The parsing helper `parseBlacksmithRecipes` still provides `qtyNumber` and `hasEnough`
  // which is used in the sidebar display.
}

// Simple placeholder function to prevent errors
function showComingSoon(feature) {
  console.log(`${feature} feature coming soon!`);
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
    autoSlashBtn.innerHTML = 'Auto Slash';
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
    console.log('Power Slash button not found');
    return;
  }

  if (autoSlashEnabled) {
    // Stop auto-slash
    clearInterval(autoSlashInterval);
    autoSlashInterval = null;
    autoSlashEnabled = false;
    btn.innerHTML = 'Auto Slash';
    btn.style.background = '#ff6b6b';
  } else {
    // Start auto-slash
    autoSlashEnabled = true;
    btn.innerHTML = 'Stop Auto';
    btn.style.background = '#4ecdc4';

    // Start the interval
    autoSlashInterval = setInterval(() => {
      if (autoSlashEnabled && slashBtn && !slashBtn.disabled) {
        slashBtn.click();
      }
    }, 1070);
  }
}

function initRankingSideBySide() {
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

    var topDmg = panels[panels.length - 2];
    var topKills = panels[panels.length - 1];

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

// SIDEBAR SECTION UPDATES
function updateSidebarInventorySection() {
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

function updateSidebarEquipSetsSection() {
  const equipSetsContent = document.getElementById('inventory-equip-sets');
  // If no nested equip container exists, nothing to do
  if (!equipSetsContent) return;

  // Respect user preference to show sets in sidebar
  // Equip sets should always be visible in Inventory Quick Access

  // Get saved equip sets from localStorage (support array or object formats and legacy storageKey)
  let savedEquipSetsRaw = null;
  try {
    savedEquipSetsRaw = localStorage.getItem('equip_sets_v1');
    if (!savedEquipSetsRaw && extensionSettings.equipSets && extensionSettings.equipSets.storageKey) {
      savedEquipSetsRaw = localStorage.getItem(extensionSettings.equipSets.storageKey);
    }
  } catch (e) {
    console.warn('Failed to read equip sets from localStorage', e);
  }

  let savedEquipSets = [];
  try {
    if (savedEquipSetsRaw) savedEquipSets = JSON.parse(savedEquipSetsRaw);
  } catch (e) {
    console.warn('Failed to parse saved equip sets', e);
    savedEquipSets = [];
  }

  // Handle legacy object keyed by set name
  let setsArray = [];
  if (!Array.isArray(savedEquipSets) && typeof savedEquipSets === 'object') {
    setsArray = Object.keys(savedEquipSets).map(k => ({ id: k, name: k, items: savedEquipSets[k] }));
  } else {
    setsArray = savedEquipSets;
  }

  if (!setsArray || setsArray.length === 0) {
    const emptyHTML = '<div class="quick-access-empty">No equip sets saved. Visit equipment page to save sets.</div>';
    equipSetsContent.innerHTML = emptyHTML;

    return;
  }

  let content = '';
  setsArray.forEach(set => {
    const items = Object.values(set.items || set);
    const itemPreviews = items.slice(0, 4).map(item =>
      `<img src="${item.img}" title="${item.name}" style="width: 20px; height: 20px; border-radius: 3px; border: 1px solid #45475a; margin-right: 2px;" onerror="this.style.display='none'" />`
    ).join('');
    const moreCount = items.length > 4 ? `<span style="font-size: 9px; color: #6c7086;">+${items.length - 4}</span>` : '';

    content += `
        <div class="quick-access-item" data-set-id="${set.id || set.name}" data-set-name="${set.name}">
          <div class="qa-item-header">
            <div class="qa-item-info">
              <div class="qa-item-name">${set.name}</div>
              <div style="display: flex; align-items: center; gap: 4px; margin-top: 4px;">
                ${itemPreviews}
                ${moreCount}
              </div>
            </div>
            <button class="qa-remove-btn" data-action="remove">×</button>
          </div>
          <div class="qa-item-actions">
            <button class="qa-equip-set-btn" data-action="equip-set">Equip Set</button>
          </div>
        </div>
      `;
  });

  equipSetsContent.innerHTML = content;

  // Add event listeners for equip sets buttons
  setupEquipSetsListeners();
}

function setupEquipSetsListeners() {
  const equipSetsContent = document.getElementById('inventory-equip-sets');
  const containers = [equipSetsContent].filter(Boolean);
  if (containers.length === 0) return;

  // Remove button listeners
  containers.forEach(equipSetsRoot => {
    equipSetsRoot.querySelectorAll('.qa-remove-btn[data-action="remove"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const item = btn.closest('.quick-access-item');
        const setId = item?.dataset.setId;
        if (setId) {
          removeEquipSet(setId);
        }
      });
    });
  });

  // Equip set button listeners
  containers.forEach(equipSetsRoot => {
    equipSetsRoot.querySelectorAll('.qa-equip-set-btn[data-action="equip-set"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const item = btn.closest('.quick-access-item');
        const setId = item?.dataset.setId;
        if (setId) {
          // disable while applying
          btn.disabled = true;
          btn.textContent = 'Applying...';
          (async () => {
            try {
              await equipSavedSet(setId);
            } finally {
              btn.disabled = false;
              btn.textContent = 'Equip Set';
            }
          })();
        }
      });
    });
  });
}

function removeEquipSet(setId) {
  try {
    // Try to remove from array format first
    const rawArray = localStorage.getItem('equip_sets_v1');
    if (rawArray) {
      const savedEquipSets = JSON.parse(rawArray || '[]');
      if (Array.isArray(savedEquipSets) && savedEquipSets.length > 0) {
        const updatedSets = savedEquipSets.filter(set => set.id !== setId);
        localStorage.setItem('equip_sets_v1', JSON.stringify(updatedSets));
        const removedSet = savedEquipSets.find(set => set.id === setId);
        showNotification(`Removed equip set "${removedSet?.name || 'Unknown'}"`, 'info');
        updateSidebarEquipSetsSection();
        return;
      }
    }

    // Fallback: try to remove from object keyed format (legacy storage)
    if (extensionSettings.equipSets && extensionSettings.equipSets.storageKey) {
      const legacyRaw = localStorage.getItem(extensionSettings.equipSets.storageKey);
      if (legacyRaw) {
        const legacyObj = JSON.parse(legacyRaw || '{}');
        if (legacyObj && legacyObj[setId]) {
          const removed = legacyObj[setId];
          delete legacyObj[setId];
          localStorage.setItem(extensionSettings.equipSets.storageKey, JSON.stringify(legacyObj));
          showNotification(`Removed equip set "${setId}"`, 'info');
          updateSidebarEquipSetsSection();
          return;
        }
      }
    }
    showNotification(`Removed equip set "${removedSet?.name || 'Unknown'}"`, 'info');

    updateSidebarEquipSetsSection();
  } catch (error) {
    console.error('Error removing equip set:', error);
    showNotification('Failed to remove equip set', 'error');
  }
}

async function equipSavedSet(setId) {
  try {
    // Try array format first
    const savedEquipSets = JSON.parse(localStorage.getItem('equip_sets_v1') || '[]');
    let equipSet = Array.isArray(savedEquipSets) ? savedEquipSets.find(set => set.id === setId) : null;

    if (equipSet) {
      showNotification(`Equipping set "${equipSet.name}"...`, 'info');
      // If the stored set looks like our integrated object mapping, try to apply without page reload
      const itemsObj = equipSet.items || equipSet;
      if (itemsObj && typeof itemsObj === 'object' && Object.keys(itemsObj).length > 0) {
        try {
          // itemsObj may be an array in legacy cases, try to normalize: prefer id-keyed objects
          const normalized = Array.isArray(itemsObj) ? Object.assign({}, ...itemsObj) : itemsObj;
          await applyAdvancedEquipSet(normalized, { noReload: true });
          return;
        } catch (e) {
          console.warn('Ajax apply failed, falling back to page redirect', e);
        }
      }

      // Fallback: open equipment page with set parameter
      window.location.href = `equipment.php?apply_set=${encodeURIComponent(setId)}`;
      return;
    }

    // Fallback: check legacy object format saved by integrated sets
    if (extensionSettings.equipSets && extensionSettings.equipSets.storageKey) {
      const legacyRaw = localStorage.getItem(extensionSettings.equipSets.storageKey);
      if (legacyRaw) {
        const legacyObj = JSON.parse(legacyRaw || '{}');
        if (legacyObj && legacyObj[setId]) {
          const setData = legacyObj[setId];
          showNotification(`Equipping set "${setId}"...`, 'info');
          // set apply using applyAdvancedEquipSet
          await applyAdvancedEquipSet(setData, { noReload: true });
          return;
        }
      }
    }

    showNotification('Equip set not found', 'error');
  } catch (error) {
    console.error('Error equipping set:', error);
    showNotification('Failed to equip set', 'error');
  }
}

function updateSidebarMerchantSection() {
  const merchantContent = document.getElementById('merchant-expanded');
  if (!merchantContent) return;

  let content = '<div class="sidebar-quick-access">';

  if (extensionSettings.pinnedMerchantItems.length === 0) {
    content += '<div class="quick-access-empty">No pinned items. Visit merchant to pin items.</div>';
  } else {
    extensionSettings.pinnedMerchantItems.forEach(item => {
      const remaining = item.maxQ > 0 ? Math.max(0, item.maxQ - item.bought) : 999;
      const canBuy = item.maxQ === 0 || remaining > 0;

      content += `
                  <div class="quick-access-item" data-item-id="${item.id}" data-item-name="${item.name}" data-item-currency="${item.currency}" data-item-price="${item.price}">
            <div class="qa-item-header">
                          <img src="${item.image}" alt="${item.name}" style="width: 24px; height: 24px; border-radius: 4px;" onerror="this.style.display='none'">
              <div class="qa-item-info">
                <div class="qa-item-name">${item.name}</div>
                              <div class="qa-item-price">${item.priceDisplay}</div>
                              ${item.maxQ > 0 ? `<div class="qa-item-limit">Remaining: ${remaining}/${item.maxQ}</div>` : ''}
              </div>
                          <button class="qa-remove-btn" data-action="remove">×</button>
            </div>
            <div class="qa-item-actions">
                          <button class="qa-buy-btn" ${!canBuy ? 'disabled' : ''} data-action="buy">
                              ${canBuy ? 'Buy' : 'Sold Out'}
              </button>
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
        executeInventoryAction({ id: itemId, name: itemName, type: itemType }, 'equip');
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
function initPvPBannerFix() {
  var contentArea = document.querySelector('.content-area');
  var seasonCountdown = document.querySelector('.season-cta');
  var pvpHero = document.querySelector('.pvp-hero');
  if (pvpHero) {
    pvpHero.style.marginTop = "0px";
    if (seasonCountdown) {
      contentArea.prepend(seasonCountdown)
    }
    contentArea.prepend(pvpHero)
    const br = document.querySelector('br');
    if (br) br.remove();
  }
}

function initPlayerAtkDamage() {
  const atkElement = document.getElementById('v-attack');
  if (!atkElement) return;

  var atkValue = Number.parseInt(atkElement.innerText.replaceAll(',', '').replaceAll('.', ''))
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

function calcDmg(atkValue, def) {
  return Math.round(1000 * ((atkValue - def) ** 0.25));
}

function initPetTotalDmg() {
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

function initPetRequiredFood() {
  document.querySelectorAll('.exp-top').forEach(x => {
    var curExp = Number.parseInt(x.querySelector('.exp-current').innerText);
    var reqExp = Number.parseInt(x.querySelector('.exp-required').innerText);
    var needed = Math.ceil((reqExp - curExp) / 300);
    x.insertAdjacentHTML('afterEnd', `<div style='margin-top:5px;'><span style='color:green;margin-top:5px'>Requires ${needed} Arcane Treat S</span></div>`);
  });
}

function initItemTotalDmg() {
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

function initAlternativeInventoryView() {
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

  header.addEventListener('click', function () {
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

// Debug function to test semi-transparent effect
window.testSemiTransparent = function () {
  console.log('Testing semi-transparent effect...');
  console.log('Current settings:', extensionSettings.semiTransparent);
  const sidebar = document.getElementById('game-sidebar');
  console.log('Sidebar element:', sidebar);
  console.log('Sidebar has semi-transparent class:', sidebar?.classList.contains('semi-transparent'));
  console.log('CSS variables:', {
    semiTransparentColor: getComputedStyle(document.documentElement).getPropertyValue('--sidebar-semi-transparent-color'),
    submenuColor: getComputedStyle(document.documentElement).getPropertyValue('--sidebar-submenu-semi-transparent-color')
  });
  applySemiTransparentEffect();
  console.log('Semi-transparent effect applied');
};

// Force enable semi-transparent for testing
window.enableSemiTransparent = function (opacity = 0.85) {
  extensionSettings.semiTransparent.enabled = true;
  extensionSettings.semiTransparent.opacity = opacity;
  applySettings();
  saveSettings();
  // Force reapply after short delay
  setTimeout(() => {
    ensureSemiTransparentPersistence();
    console.log('Semi-transparent enabled with opacity:', opacity);
  }, 100);
};

// Force disable semi-transparent for testing
window.disableSemiTransparent = function () {
  extensionSettings.semiTransparent.enabled = false;
  applySettings();
  saveSettings();
  console.log('Semi-transparent disabled');
};

// Make new functions globally available for testing
window.extractItemDataFromHTML = extractItemDataFromHTML;
window.autoClickShowMore = autoClickShowMore;
window.getAllConsumableItems = getAllConsumableItems;
window.findItemByName = findItemByName;

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
window.testItemExtraction = async function () {
  console.log('Testing item extraction from current page...');
  const items = await getAllConsumableItems();
  console.log('Extracted items:', items);
  return items;
};

// Simple function that just fetches inventory without clicking show more
window.getInventoryItemsSimple = async function () {
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

// ============================================================================
// DUNGEON PAGE TRANSFORMATION
// ============================================================================

// Helper function to move dungeon cards between sections
async function moveDungeonCardToSection(card, targetSectionId) {
  // Find the target section
  const sections = document.querySelectorAll('.monster-section');
  let targetSection = null;

  for (const section of sections) {
    const header = section.querySelector('.monster-section-header h3');
    if (header) {
      const text = header.textContent.toLowerCase();
      if (targetSectionId === 'loot' && text.includes('available loot')) {
        targetSection = section;
        break;
      } else if (targetSectionId === 'continue' && text.includes('continue battle')) {
        targetSection = section;
        break;
      } else if (targetSectionId === 'completed' && text.includes('completed')) {
        targetSection = section;
        break;
      }
    }
  }

  // If target section doesn't exist, create it
  if (!targetSection && targetSectionId === 'continue') {
    const mainContainer = document.querySelector('.dungeon-monster-container');
    if (mainContainer) {
      targetSection = await createDungeonSection('⚔️ Continue Battle', [], 'continue', false);

      // Insert after loot section or at the beginning
      const lootSection = Array.from(sections).find(s => {
        const h = s.querySelector('.monster-section-header h3');
        return h && h.textContent.toLowerCase().includes('available loot');
      });

      if (lootSection) {
        lootSection.after(targetSection);
      } else {
        mainContainer.insertBefore(targetSection, mainContainer.firstChild);
      }
    }
  }

  if (targetSection) {
    const targetContainer = targetSection.querySelector('.dungeon-monster-container');
    if (targetContainer) {
      // Remove from current location
      const currentSection = card.closest('.monster-section');
      card.remove();

      // Add to target section
      targetContainer.appendChild(card);

      // Update section counts
      updateDungeonSectionCount(currentSection);
      updateDungeonSectionCount(targetSection);

      // Show target section if it was hidden
      targetSection.style.display = '';
      const content = targetSection.querySelector('.monster-section-content');
      if (content && content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        const toggleBtn = targetSection.querySelector('.section-toggle-btn');
        if (toggleBtn) toggleBtn.textContent = '−';
      }
    }
  }
}

// Helper function to update section count
function updateDungeonSectionCount(section) {
  if (!section) return;

  const cards = section.querySelectorAll('.dungeon-monster-card');
  const visibleCards = Array.from(cards).filter(c => c.style.display !== 'none');
  const count = visibleCards.length;

  const titleElement = section.querySelector('.monster-section-header h3');
  if (titleElement) {
    const originalText = titleElement.textContent.replace(/\(\d+\)/, '').trim();
    titleElement.textContent = `${originalText} (${count})`;
  }

  // Hide section if no cards
  if (count === 0) {
    section.style.display = 'none';
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
        border-right: 2px solid rgba(255, 211, 105, 0.4);
        border-left: none;
        border-radius: 0 8px 8px 0;
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
    document.addEventListener('DOMContentLoaded', () => transformDungeonPage());
  } else {
    transformDungeonPage();
  }
}

async function transformDungeonPage() {
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
  await transformDungeonMonsterCards();

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

async function transformDungeonMonsterCards() {
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
    mainContainer.appendChild(await createDungeonSection('💰 Available Loot', lootable, 'loot', false));
  }

  if (continuing.length > 0) {
    mainContainer.appendChild(await createDungeonSection('⚔️ Continue Battle', continuing, 'continue', false));
  }

  if (joinable.length > 0) {
    mainContainer.appendChild(await createDungeonSection('🆕 Join a Battle', joinable, 'join', false));
  }

  if (completed.length > 0) {
    mainContainer.appendChild(await createDungeonSection('✅ Completed', completed, 'completed', false));
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

async function createDungeonSection(title, monsters, id, collapsed) {
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

  const cardPromises = monsters.map(async mon => {
    const card = await createDungeonMonsterCard(mon);
    return card;
  });

  const cards = await Promise.all(cardPromises);
  cards.forEach(card => {
    if (card) {
      cardsContainer.appendChild(card);
    }
  });

  content.appendChild(cardsContainer);
  section.appendChild(header);
  section.appendChild(content);

  return section;
}

async function createDungeonMonsterCard(monElement) {
  // Extract data from original element
  const img = monElement.querySelector('img');
  const nameElement = monElement.querySelector('[style*="font-weight:700"]');
  const hpElement = monElement.querySelector('.muted');
  const pills = monElement.querySelectorAll('.pill');
  const statpills = monElement.querySelectorAll('.statpill');
  const viewLink = monElement.querySelector('a[href*="battle"]') || monElement.querySelector('a[href*="battle.php?dgmid"]');

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

  // Store battle URL for later fetch if needed
  const battleUrlForPlayers = viewLink ? viewLink.href : null;

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
  hpTextDiv.textContent = `${currentHP.toLocaleString()} / ${maxHP.toLocaleString()} HP`;
  hpTextDiv.style.fontSize = '14px';
  hpTextDiv.style.marginTop = '8px';

  // Stats display with damage and EXP pills
  const statsDiv = document.createElement('div');
  statsDiv.className = 'dungeon-stats-container';
  statsDiv.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; justify-content: center;';

  // Add damage pill if damage pills are enabled (check both showDamagePills and showLootPills)
  const showPills = extensionSettings.dungeonWave.showDamagePills && extensionSettings.dungeonWave.showLootPills;
  if (showPills) {
    // Try to get cached loot data from sessionStorage first
    const cacheKey = `lootPills_${monsterName}_${maxHP}`;
    let cachedData = null;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        cachedData = JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Failed to parse cached loot data:', e);
    }

    let expectedDamage, expectedExp;

    if (cachedData) {
      // Use cached values for instant display
      expectedDamage = cachedData.damage;
      expectedExp = cachedData.exp;
    } else {
      // Calculate and cache for next time
      expectedDamage = await calculateExpectedDamage(currentHP, maxHP, battleUrl);
      expectedExp = calculateExpectedExp(expectedDamage, 0.1);

      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          damage: expectedDamage,
          exp: expectedExp,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('Failed to cache loot data:', e);
      }
    }

    const damagePill = document.createElement('span');
    damagePill.className = 'dungeon-stat-pill damage-pill';
    damagePill.style.cssText = 'background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; padding: 4px 8px; border-radius: 4px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;';
    damagePill.innerHTML = `
        <span style="font-weight: 600;">⚔️ DMG</span>
        <span style="color: #f87171;">${expectedDamage.toLocaleString()}</span>
      `;
    statsDiv.appendChild(damagePill);

    // Add EXP pill
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

  // If not found in text, try to fetch from battle page
  if (playersJoined === 0 && battleUrlForPlayers) {
    fetch(battleUrlForPlayers)
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

  // Action buttons
  const actionsDiv = document.createElement('div');
  actionsDiv.style.display = 'flex';
  actionsDiv.style.gap = '8px';
  actionsDiv.style.marginTop = '12px';

  // Extract dgmid and instance_id from viewLink
  let dgmid = null;
  let instanceId = null;
  if (viewLink && viewLink.href) {
    const urlParams = new URLSearchParams(viewLink.href.split('?')[1]);
    dgmid = urlParams.get('dgmid');
    instanceId = urlParams.get('instance_id');
  }

  // Determine which buttons to show based on state
  if (isDead && !isJoined) {
    // Not joined and dead - only view button
    const viewBtn = document.createElement('button');
    viewBtn.className = 'dungeon-btn';
    viewBtn.style.flex = '1';
    viewBtn.innerHTML = '👁️ View';
    viewBtn.onclick = (e) => {
      e.preventDefault();
      const battleUrl = viewLink ? viewLink.href : null;
      
      if (e.ctrlKey || e.metaKey) {
        // Ctrl+Click or Cmd+Click - open in new tab
        if (battleUrl) window.open(battleUrl, '_blank');
      } else {
        // Normal click - navigate to battle page
        if (battleUrl) window.location.href = battleUrl;
      }
    };
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
        showNotification('Invalid monster ID', '#e74c3c');
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
        setTimeout(async () => {
          await moveDungeonCardToSection(card, 'completed');
        }, 3000);

      } catch (error) {
        console.error('Loot error:', error);
        showNotification('Error looting', '#e74c3c');
        lootBtn.disabled = false;
        lootBtn.innerHTML = '💰 Loot';
      }
    };

    actionsDiv.appendChild(lootBtn);

    const viewBtn = document.createElement('button');
    viewBtn.className = 'dungeon-btn';
    viewBtn.style.flex = '1';
    viewBtn.innerHTML = '👁️ View';
    viewBtn.onclick = (e) => {
      e.preventDefault();
      const battleUrl = battleHref;
      
      if (e.ctrlKey || e.metaKey) {
        // Ctrl+Click or Cmd+Click - open in new tab
        if (battleUrl) window.open(battleUrl, '_blank');
      } else {
        // Normal click - navigate to battle page
        if (battleUrl) window.location.href = battleUrl;
      }
    };
    actionsDiv.appendChild(viewBtn);
  } else if (isDead && isJoined && hasLoot) {
    // Already looted - view with modal support
    const viewBtn = document.createElement('button');
    viewBtn.className = 'dungeon-btn';
    viewBtn.style.flex = '1';
    viewBtn.innerHTML = '👁️ View';
    viewBtn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const battleUrl = viewLink ? viewLink.href : null;
      
      if (e.ctrlKey || e.metaKey) {
        // Ctrl+Click or Cmd+Click - open in new tab
        if (battleUrl) window.open(battleUrl, '_blank');
      } else if (battleUrl) {
        if (extensionSettings.battleModal.enabled) {
          // Use battle modal system
          const monster = {
            id: dgmid || monsterName.toLowerCase().replace(/\s+/g, '-'),
            name: monsterName,
            currentHp: currentHP,
            maxHp: maxHP,
            battleUrl: battleUrl,
            status: 0, // Dead/completed
            instanceId: instanceId,
            dgmid: dgmid
          };
          await showBattleModal(monster);
        } else {
          // Navigate to battle page (original behavior)
          window.location.href = battleUrl;
        }
      }
      return false;
    };
    actionsDiv.appendChild(viewBtn);
  } else if (!isDead && isJoined) {
    // Alive and joined - continue + view buttons
    const continueBtn = document.createElement('button');
    continueBtn.className = 'dungeon-join-btn';
    continueBtn.style.flex = '1';
    continueBtn.style.background = '#ffd369';
    continueBtn.style.color = '#1e1e2e';
    continueBtn.innerHTML = '⚔️ Continue';
    continueBtn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const battleUrl = viewLink ? viewLink.href : null;
      
      if (battleUrl) {
        if (extensionSettings.battleModal.enabled) {
          // Use battle modal system
          const monster = {
            id: dgmid || monsterName.toLowerCase().replace(/\s+/g, '-'),
            name: monsterName,
            currentHp: currentHP,
            maxHp: maxHP,
            battleUrl: battleUrl,
            status: 1, // Active battle
            instanceId: instanceId,
            dgmid: dgmid
          };
          await showBattleModal(monster);
        } else {
          // Navigate to battle page (original behavior)
          window.location.href = battleUrl;
        }
      }
      return false;
    };
    actionsDiv.appendChild(continueBtn);

    const viewBtn = document.createElement('button');
    viewBtn.className = 'dungeon-btn';
    viewBtn.style.flex = '1';
    viewBtn.innerHTML = '👁️ View';
    viewBtn.onclick = (e) => {
      e.preventDefault();
      const battleUrl = viewLink ? viewLink.href : null;
      
      if (e.ctrlKey || e.metaKey) {
        // Ctrl+Click or Cmd+Click - open in new tab
        if (battleUrl) window.open(battleUrl, '_blank');
      } else {
        // Normal click - navigate to battle page
        if (battleUrl) window.location.href = battleUrl;
      }
    };
    actionsDiv.appendChild(viewBtn);

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
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Validate we have the required parameters for dungeon battles
      if (!dgmid || !instanceId) {
        showNotification('Invalid battle parameters', '#e74c3c');
        return;
      }

      // Join the battle
      joinBtn.disabled = true;
      joinBtn.innerHTML = '⏳ Joining...';

      try {
        // Initialize user data if needed
        if (!userData.userID) {
          initUserData();
        }
        
        // Build request body for dungeon battles
        const body = `dgmid=${encodeURIComponent(dgmid)}&instance_id=${encodeURIComponent(instanceId)}`;
        
        const res = await fetch('dungeon_join_battle.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body
        });
        const text = await res.text();

        const msg = (text || '').trim();
        const ok = msg.toLowerCase().startsWith('you have successfully');

        if (ok) {
          showNotification('Battle joined successfully!', '#2ecc71');

          // Update the card to show it's now joined
          card.classList.add('dungeon-joined');

          // Move card to Continue Battle section
          await moveDungeonCardToSection(card, 'continue');

          // Change button to Continue
          joinBtn.innerHTML = '⚔️ Continue';
          joinBtn.style.background = '#ffd369';
          joinBtn.style.color = '#1e1e2e';
          joinBtn.disabled = false;
          joinBtn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            if (extensionSettings.battleModal && extensionSettings.battleModal.enabled) {
              // Use battle modal system
              const monster = {
                id: dgmid || monsterName.toLowerCase().replace(/\s+/g, '-'),
                name: monsterName,
                currentHp: currentHP,
                maxHp: maxHP,
                battleUrl: battleHref,
                status: 1, // Active battle
                instanceId: instanceId,
                dgmid: dgmid
              };
              await showBattleModal(monster);
            } else {
              // Navigate to battle page (original behavior)
              window.location.href = battleHref;
            }
            return false;
          };
          
          // If battle modal is enabled, show it immediately after joining
          if (extensionSettings.battleModal && extensionSettings.battleModal.enabled) {
            const monster = {
              id: dgmid || monsterName.toLowerCase().replace(/\s+/g, '-'),
              name: monsterName,
              currentHp: currentHP,
              maxHp: maxHP,
              battleUrl: battleHref,
              status: 1, // Active battle
              instanceId: instanceId,
              dgmid: dgmid
            };
            await showBattleModal(monster);
          }
        } else {
          showNotification(msg || 'Failed to join battle', '#e74c3c');
          joinBtn.disabled = false;
          joinBtn.innerHTML = '⚔️ Join Battle';
        }
      } catch (error) {
        console.error('Join battle error:', error);
        showNotification('Server error. Please try again.', '#e74c3c');
        joinBtn.disabled = false;
        joinBtn.innerHTML = '⚔️ Join Battle';
      }
    };

    actionsDiv.appendChild(joinBtn);

    const viewBtn = document.createElement('button');
    viewBtn.className = 'dungeon-btn';
    viewBtn.style.flex = '1';
    viewBtn.innerHTML = '👁️ View';
    viewBtn.onclick = (e) => {
      e.preventDefault();
      const battleUrl = battleHref;
      
      if (e.ctrlKey || e.metaKey) {
        // Ctrl+Click or Cmd+Click - open in new tab
        if (battleUrl) window.open(battleUrl, '_blank');
      } else {
        // Normal click - navigate to battle page
        if (battleUrl) window.location.href = battleUrl;
      }
    };
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

  // Add click handler to show battle modal (except on buttons/links)
  return card;
}

// Clean old loot pills cache entries (older than 1 hour)
function cleanLootPillsCache() {
  try {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const keysToRemove = [];

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('lootPills_') || key.startsWith('lootPillsName_'))) {
        try {
          const data = JSON.parse(sessionStorage.getItem(key));
          if (data.timestamp && data.timestamp < oneHourAgo) {
            keysToRemove.push(key);
          }
        } catch (e) {
          // Invalid data, mark for removal
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => sessionStorage.removeItem(key));

    if (keysToRemove.length > 0) {
      console.log(`Cleaned ${keysToRemove.length} old loot pills cache entries`);
    }
  } catch (e) {
    console.warn('Failed to clean loot pills cache:', e);
  }
}

// Remove any Lizard theme style blocks that match the lizard theme header or variables
function removeLizardThemeFromPage() {
  // Keep a live observer to automatically remove newly-inserted lizard theme styles
  if (typeof window.lizardRemovalObserver === 'undefined') window.lizardRemovalObserver = null;
  try {
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
    let removedAnything = false;

    styles.forEach(el => {
      const text = el.tagName.toLowerCase() === 'style' ? el.textContent : (el.href || '');
      if (!text) return;

      // Look for unique markers used in the Lizard theme block
      const marker1 = /LIZARDS\s*WAVE\s*–\s*SCALY\s*THEME/i;
      const marker2 = /--lizard-ink\s*:/i;
      const marker3 = /lizard_pattern\.webp/i;

      if (marker1.test(text) || marker2.test(text) || marker3.test(text)) {
        try {
          // Mark removed for traceability
          el.dataset.lizardRemoved = 'true';
          // If it's a link, disable it by removing href
          if (el.tagName.toLowerCase() === 'link') {
            el.disabled = true;
            el.removeAttribute('href');
          } else {
            // Remove the <style> element
            el.parentNode && el.parentNode.removeChild(el);
          }
          removedAnything = true;
        } catch (e) {
          console.warn('Could not remove lizard style element', e);
        }
      }
    });

    // Also clear body background if it uses the Lizard pattern
    const bg = getComputedStyle(document.body).backgroundImage || '';
    if (/lizard_pattern\.webp/i.test(bg)) {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundRepeat = '';
    }

    return removedAnything;
  } catch (err) {
    console.warn('Failed to remove Lizard theme', err);
    return false;
  }
}

// Ensure lizard observer is active when setting is enabled (prevents re-injection)
function ensureLizardObserver(enabled) {
  if (enabled) {
    if (window.lizardRemovalObserver) return;
    const mutationHandler = function (muts) {
      muts.forEach(m => {
        Array.from(m.addedNodes || []).forEach(node => {
          if (!node) return;
          if (node.nodeType === Node.ELEMENT_NODE && (node.tagName.toLowerCase() === 'style' || (node.tagName.toLowerCase() === 'link' && node.rel === 'stylesheet'))) {
            try {
              const txt = node.tagName.toLowerCase() === 'style' ? node.textContent : (node.href || '');
              if (/LIZARDS\s*WAVE\s*–\s*SCALY\s*THEME/i.test(txt) || /--lizard-ink\s*:/.test(txt) || /lizard_pattern\.webp/i.test(txt)) {
                node.parentNode && node.parentNode.removeChild(node);
              }
            } catch (e) {
              // ignore
            }
          }
        });
      });
    };

    window.lizardRemovalObserver = new MutationObserver(mutationHandler);
    window.lizardRemovalObserver.observe(document.head || document.documentElement, { childList: true, subtree: true });
    activeObservers.push(window.lizardRemovalObserver);
  } else {
    if (window.lizardRemovalObserver) {
      try {
        window.lizardRemovalObserver.disconnect();
        activeObservers = activeObservers.filter(obs => obs !== window.lizardRemovalObserver);
      } catch (e) { }
      window.lizardRemovalObserver = null;
    }
  }
}

// Calculate expected damage based on monster HP or fetch from battle page
async function calculateExpectedDamage(currentHP, maxHP, battleUrl = null) {
  // Try to fetch actual damage from battle page if URL provided
  if (battleUrl) {
    try {
      const response = await fetch(battleUrl);
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');

      // Look for the damage value in the battle page
      const damageElement = doc.querySelector('#yourDamageValue') ||
                           doc.querySelector('[id*="damage"]') ||
                           doc.querySelector('.damage-value');

      if (damageElement) {
        const damageText = damageElement.textContent.trim();
        const damageMatch = damageText.match(/(\d[\d,]*)/);
        if (damageMatch) {
          return parseInt(damageMatch[1].replace(/,/g, ''));
        }
      }
    } catch (e) {
      console.warn('Failed to fetch damage from battle page:', e);
    }
  }

  // Fallback to 0 if fetch fails
  return 0;
}

// Calculate expected EXP based on damage (dmg pill value * exp rate pill value)
function calculateExpectedExp(damage, expRate = 0.1) {
  // Use the existing calculateExpectedExp function if available and not this one
  if (
    typeof window.calculateExpectedExp === 'function' &&
    window.calculateExpectedExp !== calculateExpectedExp
  ) {
    return window.calculateExpectedExp(damage, expRate);
  }

  // Calculate EXP as damage * exp rate
  return Math.round(damage * expRate);
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

  // Helper function to ensure dungeon loot modal exists
  window.ensureDungeonLootModal = function() {
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

    overlay.addEventListener('click', function () { closeLootModal(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) closeLootModal(); });
    document.getElementById('lootCloseBtn')?.addEventListener('click', closeLootModal);
  }

  window.closeLootModal = function() { const lootOverlay = document.getElementById('lootOverlay'); const lootModal = document.getElementById('lootModal'); if (!lootOverlay || !lootModal) return; lootOverlay.style.display = 'none'; lootModal.style.display = 'none'; lootOverlay.hidden = true; lootModal.hidden = true; document.body.style.overflow = ''; }

  window.openLootModal = function() { const lootOverlay = document.getElementById('lootOverlay'); const lootModal = document.getElementById('lootModal'); if (!lootOverlay || !lootModal) return; lootOverlay.hidden = false; lootModal.hidden = false; lootOverlay.style.display = 'block'; lootModal.style.display = 'flex'; document.body.style.overflow = 'hidden'; document.getElementById('lootCloseBtn')?.focus(); }

  window.renderDungeonLootModal = function(data) {
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
    parts.push('<div>You earned <strong>' + num(rewards.exp || 0) + '</strong> EXP and <strong>' + num(rewards.gold || 0) + '</strong> Gold.</div>');
    if (note) parts.push('<div style="margin-top:6px;color:#cfd4ff;">' + escapeHtml(note) + '</div>');

    if (items.length) {
      parts.push('<div class="loot-row" style="margin-top:10px; display:flex; flex-wrap:wrap; gap:8px; justify-content:center;">');

      Object.values(groups).forEach(it => {
        const img = escapeAttr(it.IMAGE_URL || 'images/default_item.png');
        const name = escapeHtml(it.NAME || it.name || 'Unknown item');
        const tier = it.TIER || it.tier || '';
        const dropRatio = it.DROP_RATIO != null ? num(it.DROP_RATIO) : null;
        const count = Number(it.count || 1);

        parts.push('<div class="loot-card unlocked" style="position:relative; background:#1e1e2f; border-radius:8px; padding:8px; width:110px; text-align:center;">');
        parts.push('<div class="loot-img-wrap"><img src="' + img + '" alt="' + name + '" style="width:64px; height:64px; object-fit:contain;"></div>');
        parts.push('<div class="loot-meta"><div class="loot-name" style="margin-top:6px; font-weight:600;">' + name + '</div>');
        parts.push('<div class="loot-stats" style="margin-top:4px; font-size:12px; color:#bfc7ff;">');
        if (dropRatio) parts.push('<span class="chip">Drop: ' + dropRatio + '%</span>');
        if (tier) parts.push('<span class="chip tierchip ' + escapeAttr(String(tier).toLowerCase()) + '" style="margin-left:6px;">' + escapeHtml(tier) + '</span>');
        parts.push('</div></div>');
        if (count > 1) {
          parts.push('<div style="position:absolute; top:6px; right:6px; background:rgba(0,0,0,0.6); color:#fff; padding:2px 6px; border-radius:999px; font-weight:700; font-size:12px;">x' + num(count) + '</div>');
        }
        parts.push('</div>');
      });

      parts.push('</div>');
    } else {
      parts.push('<div style="margin-top:10px;">No item dropped this time.</div>');
    }

    const lootBody = document.getElementById('lootBody'); if (lootBody) lootBody.innerHTML = parts.join(''); openLootModal();
  }

  function num(x) { try { return new Intl.NumberFormat().format(Number(x) || 0); } catch { return x; } }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (m) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]; }); }
  function escapeAttr(s) { return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

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
        showNotification('No loot available', '#e74c3c');
        return;
      }

      const lootCards = lootSection.querySelectorAll('.dungeon-monster-card:not([style*="display: none"])');

      if (lootCards.length === 0) {
        showNotification('No loot available', '#e74c3c');
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
              const viewLink = card.querySelector('a[href*="battle.php"]');
              if (viewLink) {
                try { instance_id = (new URL(viewLink.href, window.location.origin)).searchParams.get('instance_id'); } catch (e) { }
              }
            }
            if (!instance_id) return { ok: false, card, error: 'missing instance_id' };

            const body = 'dgmid=' + encodeURIComponent(monsterId) + '&instance_id=' + encodeURIComponent(instance_id);
            const res = await fetch('dungeon_loot.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
            const ct = res.headers.get('content-type') || '';
            const raw = await res.text();
            let data = null; if (ct.includes('application/json')) { try { data = JSON.parse(raw); } catch (e) { } }

            if (!res.ok || !data) return { ok: false, card, error: (data && data.message) || raw.slice(0, 400) || ('HTTP ' + res.status) };

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
        showNotification(`Successfully looted ${successCount} monster${successCount > 1 ? 's' : ''}!`, '#2ecc71');
        if (allLootItems.length > 0) {
          ensureDungeonLootModal();
          renderDungeonLootModal({ items: allLootItems, rewards: aggregatedRewards, note: 'Batch loot summary' });
        }
      }

      // Show summary
      if (successCount > 0) {
        showNotification(`Successfully looted ${successCount} monster${successCount > 1 ? 's' : ''}!`, '#2ecc71');

        // Move looted cards to completed section after a delay
        setTimeout(async () => {
          for (const card of lootCards) {
            if (card._hasLoot) {
              await moveDungeonCardToSection(card, 'completed');
            }
          }
        }, 1500);
      }

      if (failCount > 0) {
        showNotification(`Failed to loot ${failCount} monster${failCount > 1 ? 's' : ''}`, '#e74c3c');
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
      
      // If battle modal is enabled, don't handle join here - let the button's onclick handler do it
      if (extensionSettings.battleModal.enabled) {
        return;
      }
      
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
        const viewLink = card.querySelector('a[href*="battle.php"]');
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

      document.addEventListener('click', async function dungeonLootHandler(e) {
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
        if (!instance_id) { const viewLink = card.querySelector('a[href*="battle.php"]'); if (viewLink) { try { instance_id = (new URL(viewLink.href, window.location.origin)).searchParams.get('instance_id'); } catch (e) { } } }
        if (!dgmid || !instance_id) { showNotification('Missing dgmid or instance_id', 'error'); btn.disabled = false; btn.textContent = origText; return; }

        try {
          const body = 'dgmid=' + encodeURIComponent(dgmid) + '&instance_id=' + encodeURIComponent(instance_id);
          const res = await fetch('dungeon_loot.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
          const ct = res.headers.get('content-type') || '';
          const raw = await res.text();
          let data = null; if (ct.includes('application/json')) { try { data = JSON.parse(raw); } catch (e) { } }
          if (!res.ok || !data) { const msg = (data && data.message) || raw.slice(0, 400) || ('HTTP ' + res.status); showNotification(msg, 'error'); btn.disabled = false; btn.textContent = origText; return; }
          if (String(data.status).trim() === 'success') {
            showNotification(data.message || 'Loot claimed!', 'success'); try { btn.remove(); } catch (e) { btn.disabled = true; }
            // Add monster name to the loot modal
            const monsterName = card.getAttribute('data-monster-name') || 'Unknown Monster';
            renderDungeonLootModal({ ...data, note: `Loot from ${monsterName}` });
          } else {
            const msg = (data.message || 'Failed to loot.').trim(); showNotification(msg, 'error'); if (/already claimed/i.test(msg)) { const note = document.createElement('div'); note.textContent = '✅ You already claimed your loot.'; btn.replaceWith(note); } else { btn.disabled = false; btn.textContent = origText; }
          }
        } catch (err) { console.error('Dungeon loot error', err); showNotification(err?.message || 'Server error', 'error'); btn.disabled = false; btn.textContent = origText; }
      });

      // Also bind direct listeners to existing buttons (and future ones) in case delegation is blocked
      function bindDungeonLootButtons() {
        document.querySelectorAll('.dungeon-monster-card .dungeon-join-btn').forEach(btn => {
          try {
            const t = (btn.textContent || '').toLowerCase();
            if (!(t.includes('loot') || t.includes('💰'))) return;
            if (btn.dataset.__dungeonLootBound) return;
            btn.dataset.__dungeonLootBound = '1';
            btn.addEventListener('click', function (ev) {
              ev.preventDefault(); ev.stopPropagation();
              // Trigger the same logic as the delegated handler by dispatching a click on the button that the delegated handler listens for
              // But call our handler directly to avoid any propagation issues
              (async function (btnRef) {
                try {
                  ensureDungeonLootModal();
                  const origText = btnRef.textContent; btnRef.disabled = true; btnRef.textContent = 'Processing…';
                  const card = btnRef.closest && btnRef.closest('.dungeon-monster-card');
                  const dgmid = card.getAttribute('data-monster-id') || card.dataset.monsterId;
                  let params = new URLSearchParams(window.location.search);
                  let instance_id = params.get('instance_id') || card.getAttribute('data-instance-id') || card.dataset.instanceId;
                  if (!instance_id) { const viewLink = card.querySelector('a[href*="battle.php"]'); if (viewLink) { try { instance_id = (new URL(viewLink.href, window.location.origin)).searchParams.get('instance_id'); } catch (e) { } } }
                  if (!dgmid || !instance_id) { showNotification('Missing dgmid or instance_id', 'error'); btnRef.disabled = false; btnRef.textContent = origText; return; }
                  const body = 'dgmid=' + encodeURIComponent(dgmid) + '&instance_id=' + encodeURIComponent(instance_id);
                  const res = await fetch('dungeon_loot.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
                  const ct = res.headers.get('content-type') || '';
                  const raw = await res.text();
                  let data = null; if (ct.includes('application/json')) { try { data = JSON.parse(raw); } catch (e) { } }
                  if (!res.ok || !data) { const msg = (data && data.message) || raw.slice(0, 400) || ('HTTP ' + res.status); showNotification(msg, 'error'); btnRef.disabled = false; btnRef.textContent = origText; return; }
                  if (String(data.status).trim() === 'success') {
                    showNotification(data.message || 'Loot claimed!', 'success'); try { btnRef.remove(); } catch (e) { btnRef.disabled = true; }
                    // Add monster name to the loot modal
                    const monsterName = card.getAttribute('data-monster-name') || 'Unknown Monster';
                    renderDungeonLootModal({ ...data, note: `Loot from ${monsterName}` });
                  }
                  else { const msg = (data.message || 'Failed to loot.').trim(); showNotification(msg, 'error'); if (/already claimed/i.test(msg)) { const note = document.createElement('div'); note.textContent = '✅ You already claimed your loot.'; btnRef.replaceWith(note); } else { btnRef.disabled = false; btnRef.textContent = origText; } }
                } catch (err) { console.error('Dungeon loot error', err); showNotification(err?.message || 'Server error', 'error'); try { btnRef.disabled = false; btnRef.textContent = 'Loot'; } catch { } }
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

// Start periodic user data update from wave page (every 30 seconds)
if (!userDataUpdateInterval && window.location.pathname.includes('/active_wave.php')) {
  userDataUpdateInterval = setInterval(updateUserDataFromWavePage, 30000);
}

// ===== HOTKEYS SYSTEM =====

// Initialize hotkeys functionality
function initHotkeys() {
  if (!extensionSettings.hotkeys.enabled) return;

  // Add global keydown event listener for hotkeys
  document.addEventListener('keydown', handleHotkey, true);
}

// Handle hotkey events
function handleHotkey(event) {
  if (!extensionSettings.hotkeys.enabled) return;

  // Ignore hotkeys if user is typing in an input field
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.contentEditable === 'true') {
    return;
  }

  const key = event.key;

  // Check if we're on a wave page and monster selection hotkeys are enabled
  if (extensionSettings.hotkeys.monsterSelection && window.location.pathname.includes('/active_wave.php')) {
    // Check if the pressed key is in the configured monster selection keys
    const monsterKeyIndex = extensionSettings.hotkeys.monsterSelectionKeys.indexOf(key);
    if (monsterKeyIndex !== -1) {
      event.preventDefault();
      event.stopPropagation();
      selectMonsterCard(monsterKeyIndex); // Use the index in the array
      return;
    }
  }

  // Check if we're on a dungeon location page and monster selection hotkeys are enabled
  if (extensionSettings.hotkeys.monsterSelection && window.location.pathname.includes('/guild_dungeon_location.php')) {
    // Check if the pressed key is in the configured monster selection keys
    const monsterKeyIndex = extensionSettings.hotkeys.monsterSelectionKeys.indexOf(key);
    if (monsterKeyIndex !== -1) {
      event.preventDefault();
      event.stopPropagation();
      selectDungeonMonsterCard(monsterKeyIndex); // Use the index in the array
      return;
    }
  }

  // Check if battle modal is open and battle attack hotkeys are enabled
  if (extensionSettings.hotkeys.battleAttacks && isModalOpen()) {
    // Check if the pressed key is in the configured battle attack keys
    const attackKeyIndex = extensionSettings.hotkeys.battleAttackKeys.findIndex(k => k.toLowerCase() === key.toLowerCase());
    if (attackKeyIndex !== -1) {
      event.preventDefault();
      event.stopPropagation();
      triggerBattleAttack(attackKeyIndex + 1); // Convert to 1-based index for triggerBattleAttack
      return;
    }
  }

  // Check if battle modal is open and class skills hotkeys are enabled
  if (extensionSettings.hotkeys.classSkills && isModalOpen()) {
    // Check if the pressed key is in the configured class skill keys
    const classSkillIndex = extensionSettings.hotkeys.classSkillKeys.findIndex(k => k.toLowerCase() === key.toLowerCase());
    if (classSkillIndex !== -1) {
      event.preventDefault();
      event.stopPropagation();
      triggerClassSkill(classSkillIndex + 1); // Convert to 1-based index for triggerClassSkill
      return;
    }
  }
}

// Select and join dungeon monster card by index (0-8 for keys 1-9) - for dungeon location pages
function selectDungeonMonsterCard(index) {
  if (!extensionSettings.hotkeys.enabled || !extensionSettings.hotkeys.monsterSelection) return;
  if (!window.location.pathname.includes('/guild_dungeon_location.php')) return;

  // Get all dungeon monster cards on the page
  const allCards = document.querySelectorAll('.dungeon-monster-card');
  const eligibleCards = [];

  // Filter for cards with join buttons that are alive and not joined
  allCards.forEach((card) => {
    // Check if card is visible
    if (card.style.display === 'none') return;

    // Look for the Insta Join button (not Continue, not Loot, not View)
    const joinBtn = card.querySelector('.dungeon-join-btn');
    if (joinBtn && !joinBtn.disabled && joinBtn.textContent.includes('Insta Join')) {
      eligibleCards.push(card);
    }
  });

  console.log(`Found ${eligibleCards.length} eligible dungeon cards for hotkey ${index + 1}`);

  // Select from the first 9 eligible cards
  if (index >= 0 && index < Math.min(9, eligibleCards.length)) {
    const card = eligibleCards[index];
    const joinBtn = card.querySelector('.dungeon-join-btn');

    if (joinBtn) {
      // Add visual feedback
      card.style.outline = '3px solid #a6e3a1';
      card.style.boxShadow = '0 0 20px rgba(166, 227, 161, 0.5)';
      setTimeout(() => {
        card.style.outline = '';
        card.style.boxShadow = '';
      }, 500);

      // Click the join button
      joinBtn.click();

      showNotification(`Selected dungeon monster ${index + 1}`, '#a6e3a1');
    }
  } else {
    console.log('Selection - Index', index, 'out of range for', eligibleCards.length, 'eligible dungeon cards');
  }
}

// Select and join monster card by index (0-8 for keys 1-9)
function selectMonsterCard(index) {
  if (!extensionSettings.hotkeys.enabled || !extensionSettings.hotkeys.monsterSelection) return;
  if (!window.location.pathname.includes('/active_wave.php')) return;

  // Get all monster cards
  const allMonsterCards = document.querySelectorAll('.monster-card');
  const eligibleCards = []; // Collect all eligible cards first

  // First pass: collect all eligible cards (joinable, visible, not joined yet)
  allMonsterCards.forEach((card) => {
    // Check if monster card is currently visible (filtered)
    if (card.style.display === 'none') return;

    // Check if monster is joinable - look for the button element only
    const joinBtn = card.querySelector('.join-btn, button[onclick*="join"]');

    let isJoinable = false;

    // Use the same categorization logic as initMonsterSorting
    // Check card's innerText to determine category (same as sorting function)
    const cardText = card.innerText || '';

    // Exclude Continue Battle and Loot cards (same logic as initMonsterSorting)
    if (cardText.includes('Continue') || cardText.includes('Loot')) {
      // This is a continue or loot card, skip it
      return;
    }

    // This is a "Join Battle" card
    // Now verify it has a working join button and HP
    if (joinBtn && !joinBtn.disabled && !joinBtn.classList.contains('disabled')) {
      console.log('Card:', card.querySelector('h3')?.textContent, '| Category: Join Battle');

      // Check if monster has HP (not defeated)
      let hasHp = true;

      // Check HP bar width
      const hpFill = card.querySelector('.hp-bar .hp-fill, .hp-fill');
      if (hpFill) {
        const width = hpFill.style.width || '';
        if (width === '0%' || width === '0px') {
          hasHp = false;
        }
      }

      // Check HP text
      const hpText = card.querySelector('.stat-value');
      if (hpText) {
        const hpContent = hpText.textContent || '';
        // If HP shows 0 or contains defeat indicators, skip
        if (hpContent.match(/^0\s*\//) || hpContent.includes('Defeated') || hpContent.includes('DEFEATED')) {
          hasHp = false;
        }
      }

      if (hasHp) {
        isJoinable = true;
        console.log('  ✓ Card is eligible for hotkey');
      }
    }

    // Only add to eligible list if monster is joinable
    if (isJoinable) {
      eligibleCards.push(card);
    }
  });


  // Select from the first 9 eligible cards
  if (index >= 0 && index < Math.min(9, eligibleCards.length)) {
    const card = eligibleCards[index];
    const joinBtn = card.querySelector('.join-btn, button[onclick*="join"], a[href*="battle.php"]');

    if (joinBtn) {
      // Add visual feedback
      card.style.outline = '3px solid #f9e2af';
      card.style.boxShadow = '0 0 20px rgba(249, 226, 175, 0.5)';
      setTimeout(() => {
        card.style.outline = '';
        card.style.boxShadow = '';
      }, 500);

      // Trigger the join action
      if (joinBtn.classList.contains('join-btn') || joinBtn.onclick) {
        joinBtn.click();
      } else if (joinBtn.tagName === 'A') {
        // For direct battle links, extract monster ID and use handleJoin
        const href = joinBtn.getAttribute('href');
        const match = href.match(/id=(\d+)/);
        if (match) {
          const monsterId = match[1];
          // Find the monster data or create a minimal monster object
          const monster = { id: monsterId, name: 'Monster' };
          handleJoin(monsterId, joinBtn);
        }
      }

      showNotification(`Selected monster ${index + 1}`, '#2ecc71');
    }
  } else {
    console.log('Selection - Index', index, 'out of range for', eligibleCards.length, 'eligible cards');
  }
}

// Trigger battle attack by number (1-5)
function triggerBattleAttack(number) {
  const modal = document.getElementById('battleModal');
  if (!modal) return;

  // Map number keys to skill IDs:
  // 1 = Slash (S key)
  // 2 = Power Slash (P key)
  // 3 = Heroic Slash (H key)
  // 4 = Ultimate Slash (U key)
  // 5 = Legendary Slash (L key)

  const skillMap = {
    1: '0',    // Slash
    2: '-1',   // Power Slash
    3: '-2',   // Heroic Slash
    4: '-3',   // Ultimate Slash
    5: '-4'    // Legendary Slash
  };

  const skillId = skillMap[number];
  if (!skillId) return;

  // Find the attack button with the corresponding skill ID
  const attackBtn = modal.querySelector(`.attack-btn[data-skill-id="${skillId}"]`);
  if (attackBtn && !attackBtn.disabled) {
    // Add visual feedback
    attackBtn.style.transform = 'scale(1.05)';
    attackBtn.style.boxShadow = '0 0 20px rgba(249, 226, 175, 0.8)';
    setTimeout(() => {
      attackBtn.style.transform = '';
      attackBtn.style.boxShadow = '';
    }, 200);

    // Trigger the attack
    attackBtn.click();

    // Show which attack was triggered
    const skillNames = {
      '0': 'Slash',
      '-1': 'Power Slash',
      '-2': 'Heroic Slash',
      '-3': 'Ultimate Slash',
      '-4': 'Legendary Slash'
    };

    const keyPressed = extensionSettings.hotkeys.battleAttackKeys[number - 1]?.toUpperCase() || number.toString();
    showNotification(`Used ${skillNames[skillId]} (${keyPressed})`, '#2ecc71');
  }
}

// Add number overlays to monster cards when hotkeys are enabled
function addMonsterCardHotkeyOverlays() {
  if (!extensionSettings.hotkeys.enabled || !extensionSettings.hotkeys.monsterSelection) return;
  if (!window.location.pathname.includes('/active_wave.php')) return;

  // Clear all existing hotkey overlays first
  document.querySelectorAll('.hotkey-overlay').forEach(overlay => overlay.remove());

  // If overlays are disabled, just return after clearing
  if (!extensionSettings.hotkeys.showOverlays) return;

  // Get all monster cards
  const allMonsterCards = document.querySelectorAll('.monster-card');
  const eligibleCards = []; // Collect all eligible cards first

  // First pass: collect all eligible cards (joinable, visible, not joined yet)
  allMonsterCards.forEach((card) => {
    // Check if monster card is currently visible (filtered)
    if (card.style.display === 'none') return;

    // Check if monster is joinable - look for the button element only
    const joinBtn = card.querySelector('.join-btn, button[onclick*="join"]');

    let isJoinable = false;

    // Use the same categorization logic as initMonsterSorting
    // Check card's innerText to determine category (same as sorting function)
    const cardText = card.innerText || '';

    // Exclude Continue Battle and Loot cards (same logic as initMonsterSorting)
    if (cardText.includes('Continue') || cardText.includes('Loot')) {
      // This is a continue or loot card, skip it
      return;
    }

    // This is a "Join Battle" card
    // Now verify it has a working join button and HP
    if (joinBtn && !joinBtn.disabled && !joinBtn.classList.contains('disabled')) {
      // Check if monster has HP (not defeated)
      let hasHp = true;

      // Check HP bar width
      const hpFill = card.querySelector('.hp-bar .hp-fill, .hp-fill');
      if (hpFill) {
        const width = hpFill.style.width || '';
        if (width === '0%' || width === '0px') {
          hasHp = false;
        }
      }

      // Check HP text
      const hpText = card.querySelector('.stat-value');
      if (hpText) {
        const hpContent = hpText.textContent || '';
        // If HP shows 0 or contains defeat indicators, skip
        if (hpContent.match(/^0\s*\//) || hpContent.includes('Defeated') || hpContent.includes('DEFEATED')) {
          hasHp = false;
        }
      }

      if (hasHp) {
        isJoinable = true;
      }
    }

    // Only add to eligible list if monster is joinable
    if (isJoinable) {
      eligibleCards.push(card);
    }
  });



  // Second pass: add overlays only to the first 9 eligible cards
  const maxHotkeys = Math.min(9, eligibleCards.length);
  for (let i = 0; i < maxHotkeys; i++) {
    const card = eligibleCards[i];
    const overlay = document.createElement('div');
    overlay.className = 'hotkey-overlay';
    overlay.textContent = extensionSettings.hotkeys.monsterSelectionKeys[i]?.toUpperCase() || (i + 1).toString();
    overlay.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: linear-gradient(135deg, #f9e2af, #fab387);
        color: #1e1e2e;
        font-size: 14px;
        font-weight: bold;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        z-index: 10;
        border: 2px solid #1e1e2e;
      `;

    // Make sure the card has relative positioning
    if (card.style.position !== 'relative' && card.style.position !== 'absolute') {
      card.style.position = 'relative';
    }

    card.appendChild(overlay);
  }
}  // Add number overlays to attack buttons when hotkeys are enabled
function addBattleAttackHotkeyOverlays() {
  if (!extensionSettings.hotkeys.enabled || !extensionSettings.hotkeys.battleAttacks) return;

  const modal = document.getElementById('battleModal');
  if (!modal) return;

  const attackButtons = modal.querySelectorAll('.attack-btn');
  attackButtons.forEach((btn, index) => {
    // Check if overlay already exists
    if (btn.querySelector('.hotkey-overlay')) return;

    // Map skill IDs to hotkey letters from settings
    const skillId = btn.getAttribute('data-skill-id');
    let hotkeyLetter = null;
    const skillIndex = ['0', '-1', '-2', '-3', '-4'].indexOf(skillId);

    if (skillIndex !== -1 && extensionSettings.hotkeys.battleAttackKeys[skillIndex]) {
      hotkeyLetter = extensionSettings.hotkeys.battleAttackKeys[skillIndex].toUpperCase();
    }

    if (!hotkeyLetter) return;

    const overlay = document.createElement('div');
    overlay.className = 'hotkey-overlay';
    overlay.textContent = hotkeyLetter;
    overlay.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        background: linear-gradient(135deg, #f9e2af, #fab387);
        color: #1e1e2e;
        font-size: 12px;
        font-weight: bold;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        z-index: 10;
        border: 1px solid #1e1e2e;
      `;

    // Make sure the button has relative positioning
    btn.style.position = 'relative';

    btn.appendChild(overlay);
  });
}

// Add number overlays to class skill buttons when hotkeys are enabled
function addClassSkillHotkeyOverlays() {
  if (!extensionSettings.hotkeys.enabled || !extensionSettings.hotkeys.classSkills) return;

  const modal = document.getElementById('battleModal');
  if (!modal) return;

  // Look for class skill buttons - try multiple selectors
  let classSkillButtons = modal.querySelectorAll('.class-skill-btn, .skill-btn, [data-skill-type="class"]');

  // If no specific class skill buttons found, look for other buttons that might be skills
  if (classSkillButtons.length === 0) {
    // Look for buttons that are not attack buttons but are in skill areas
    const allButtons = modal.querySelectorAll('button:not(.attack-btn):not(.close-btn):not([data-action="close"])');
    classSkillButtons = Array.from(allButtons).filter(btn => {
      // Filter buttons that might be class skills (not attack buttons, not modal controls)
      const text = btn.textContent.toLowerCase();
      const classes = btn.className.toLowerCase();
      return !classes.includes('attack') &&
             !text.includes('close') &&
             !text.includes('cancel') &&
             btn.offsetParent !== null; // Visible buttons
    });
  }

  console.log('Class skill buttons found:', classSkillButtons.length, classSkillButtons);

  classSkillButtons.forEach((btn, index) => {
    // Check if overlay already exists
    if (btn.querySelector('.hotkey-overlay')) return;

    // Only show overlays for the first 5 class skills
    if (index >= 5) return;

    // Get the hotkey letter from settings
    const hotkeyLetter = extensionSettings.hotkeys.classSkillKeys[index]?.toUpperCase();
    if (!hotkeyLetter) return;

    const overlay = document.createElement('div');
    overlay.className = 'hotkey-overlay';
    overlay.textContent = hotkeyLetter;
    overlay.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        background: linear-gradient(135deg, #a6e3a1, #89b4fa);
        color: #1e1e2e;
        font-size: 12px;
        font-weight: bold;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        z-index: 10;
        border: 1px solid #1e1e2e;
      `;

    // Make sure the button has relative positioning
    btn.style.position = 'relative';

    btn.appendChild(overlay);
  });
}

// Trigger class skill by number (1-5)
function triggerClassSkill(number) {
  // Map number keys to class skill indices:
  // 1 = Class Skill 1 (Q key)
  // 2 = Class Skill 2 (W key)
  // 3 = Class Skill 3 (E key)
  // 4 = Class Skill 4 (R key)
  // 5 = Class Skill 5 (T key)

  const keyPressed = extensionSettings.hotkeys.classSkillKeys[number - 1]?.toUpperCase() || number.toString();

  //  MODAL CLASS SKILL
  const modal = document.getElementById('battleModal');
  if (!modal) return;

  // Find the class skill button by index using flexible selector
  let classSkillButtons = modal.querySelectorAll('.class-skill-btn, .skill-btn, [data-skill-type="class"]');

  // If no specific class skill buttons found, look for other buttons that might be skills
  if (classSkillButtons.length === 0) {
    const allButtons = modal.querySelectorAll('button:not(.attack-btn):not(.close-btn):not([data-action="close"])');
    classSkillButtons = Array.from(allButtons).filter(btn => {
      const text = btn.textContent.toLowerCase();
      const classes = btn.className.toLowerCase();
      return !classes.includes('attack') &&
             !text.includes('close') &&
             !text.includes('cancel') &&
             btn.offsetParent !== null;
    });
  }

  console.log('Triggering class skill', number, '- Found buttons:', classSkillButtons.length, classSkillButtons);

  const skillBtn = classSkillButtons[number - 1]; // 0-based index

  if (skillBtn && !skillBtn.disabled) {
    // Add visual feedback
    skillBtn.style.transform = 'scale(1.05)';
    skillBtn.style.boxShadow = '0 0 20px rgba(166, 227, 161, 0.8)';
    setTimeout(() => {
      skillBtn.style.transform = '';
      skillBtn.style.boxShadow = '';
    }, 200);

    // Trigger the class skill
    skillBtn.click();
    showNotification(`Used Class Skill ${number} (${keyPressed})`, '#a6e3a1');
  } else {
    showNotification(`Class Skill ${number} not available`, '#f38ba8');
  }
}

// Add number overlays to dungeon monster cards when hotkeys are enabled
function addDungeonCardHotkeyOverlays() {
  if (!extensionSettings.hotkeys.enabled || !extensionSettings.hotkeys.monsterSelection) return;
  if (!window.location.pathname.includes('/guild_dungeon_location.php')) return;

  // Clear all existing hotkey overlays on dungeon cards first
  document.querySelectorAll('.dungeon-monster-card .hotkey-overlay').forEach(overlay => overlay.remove());

  // If overlays are disabled, just return after clearing
  if (!extensionSettings.hotkeys.showOverlays) return;

  // Get all dungeon monster cards on the page
  const allCards = document.querySelectorAll('.dungeon-monster-card');
  const eligibleCards = [];

  // Filter for cards with join buttons that are alive and not joined
  allCards.forEach((card) => {
    if (card.style.display === 'none') return;

    // Look for the Insta Join button (not Continue, not Loot, not View)
    const joinBtn = card.querySelector('.dungeon-join-btn');
    if (joinBtn && !joinBtn.disabled && joinBtn.textContent.includes('Insta Join')) {
      eligibleCards.push(card);
    }
  });

  // Add overlays to the first 9 eligible cards
  const maxHotkeys = Math.min(9, eligibleCards.length);
  for (let i = 0; i < maxHotkeys; i++) {
    const card = eligibleCards[i];
    const overlay = document.createElement('div');
    overlay.className = 'hotkey-overlay';
    overlay.textContent = extensionSettings.hotkeys.monsterSelectionKeys[i]?.toUpperCase() || (i + 1).toString();
    overlay.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: linear-gradient(135deg, #a6e3a1, #94e2d5);
        color: #1e1e2e;
        font-size: 14px;
        font-weight: bold;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        z-index: 10;
        border: 2px solid #1e1e2e;
      `;

    // Make sure the card has relative positioning
    if (card.style.position !== 'relative' && card.style.position !== 'absolute') {
      card.style.position = 'relative';
    }

    card.appendChild(overlay);
  }
}

// Initialize hotkeys and overlays
initHotkeys();

// Add overlays to monster cards on wave pages
if (window.location.pathname.includes('/active_wave.php')) {
  // Add overlays after a short delay to ensure cards are loaded
  setTimeout(addMonsterCardHotkeyOverlays, 1000);

  // Re-add overlays when new content is loaded (for auto-refresh)
  const observer = new MutationObserver(() => {
    setTimeout(addMonsterCardHotkeyOverlays, 500);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// Add overlays to dungeon cards on dungeon location pages
if (window.location.pathname.includes('/guild_dungeon_location.php')) {
  // Add overlays after a short delay to ensure cards are loaded
  setTimeout(addDungeonCardHotkeyOverlays, 1500);

  // Re-add overlays when new content is loaded
  const dungeonObserver = new MutationObserver(() => {
    setTimeout(addDungeonCardHotkeyOverlays, 500);
  });
  dungeonObserver.observe(document.body, { childList: true, subtree: true });
}

// Add overlays to battle modal attack buttons when modal opens
const originalShowBattleModal = showBattleModal;
showBattleModal = function (monster) {
  originalShowBattleModal(monster);
  // Add hotkey overlays after modal is shown
  setTimeout(() => {
    addBattleAttackHotkeyOverlays();
    addClassSkillHotkeyOverlays();
  }, 100);
  
  // Also refresh dungeon overlays after modal closes (on dungeon pages)
  if (window.location.pathname.includes('/guild_dungeon_location.php')) {
    setTimeout(addDungeonCardHotkeyOverlays, 500);
  }
};

// ===== END HOTKEYS SYSTEM =====

// ===== AUTO-USE SETTINGS =====

function setupAutoHpSettings() {
  const enabledCheckbox = document.getElementById('auto-hp-enabled');
  const thresholdInput = document.getElementById('auto-hp-threshold');
  const delaySlider = document.getElementById('auto-hp-delay');
  const delayValue = document.getElementById('auto-hp-delay-value');

  if (enabledCheckbox) {
    enabledCheckbox.checked = extensionSettings.autoHp.enabled;
    updateCheckboxVisualState(enabledCheckbox);
    enabledCheckbox.addEventListener('change', (e) => {
      extensionSettings.autoHp.enabled = e.target.checked;
      saveSettings();
      showNotification('Auto HP ' + (e.target.checked ? 'enabled' : 'disabled'), 'success');
    });
  }

  if (thresholdInput) {
    thresholdInput.value = extensionSettings.autoHp.threshold;
    thresholdInput.addEventListener('input', (e) => {
      const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
      extensionSettings.autoHp.threshold = value;
      e.target.value = value;
      saveSettings();
    });
  }

  if (delaySlider && delayValue) {
    delaySlider.value = extensionSettings.autoHp.delayBetweenUses;
    delayValue.textContent = (extensionSettings.autoHp.delayBetweenUses / 1000).toFixed(1) + 's';
    delaySlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      extensionSettings.autoHp.delayBetweenUses = value;
      delayValue.textContent = (value / 1000).toFixed(1) + 's';
      saveSettings();
    });
  }
}

function setupAutoStaminaSettings() {
  const enabledCheckbox = document.getElementById('auto-stamina-enabled');
  const thresholdInput = document.getElementById('auto-stamina-threshold');
  const delaySlider = document.getElementById('auto-stamina-delay');
  const delayValue = document.getElementById('auto-stamina-delay-value');

  if (enabledCheckbox) {
    enabledCheckbox.checked = extensionSettings.autoStamina.enabled;
    updateCheckboxVisualState(enabledCheckbox);
    enabledCheckbox.addEventListener('change', (e) => {
      extensionSettings.autoStamina.enabled = e.target.checked;
      saveSettings();
      showNotification('Auto Stamina ' + (e.target.checked ? 'enabled' : 'disabled'), 'success');
    });
  }

  if (thresholdInput) {
    thresholdInput.value = extensionSettings.autoStamina.threshold;
    thresholdInput.addEventListener('input', (e) => {
      const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
      extensionSettings.autoStamina.threshold = value;
      e.target.value = value;
      saveSettings();
    });
  }

  if (delaySlider && delayValue) {
    delaySlider.value = extensionSettings.autoStamina.delayBetweenUses;
    delayValue.textContent = (extensionSettings.autoStamina.delayBetweenUses / 1000).toFixed(1) + 's';
    delaySlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      extensionSettings.autoStamina.delayBetweenUses = value;
      delayValue.textContent = (value / 1000).toFixed(1) + 's';
      saveSettings();
    });
  }
}

// ===== END AUTO-USE SETTINGS =====

