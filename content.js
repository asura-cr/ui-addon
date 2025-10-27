'use strict';

  // Global variables
  var alarmInterval = null;
  var waveRefreshInterval = null;
  var monsterFiltersSettings = {"nameFilter":"","hideImg":false, "battleLimitAlarm":false, "battleLimitAlarmSound":true, "battleLimitAlarmVolume":70, "monsterTypeFilter":[], "hpFilter":"", "playerCountFilter":"", "lootFilter":[]}
  
  // Monster loot cache for performance optimization
  const lootCache = new Map(); // Cache loot data by monster name  // Enhanced settings management
  var extensionSettings = {
    sidebarColor: '#1e1e1e',
    backgroundColor: '#000000',
    statAllocationCollapsed: true,
    sidebarCollapsed: false,
    statsExpanded: false,
    petsExpanded: false,
    blacksmithExpanded: false,
    battlePassExpanded: false,
    continueBattlesExpanded: true,
    lootExpanded: true,
    merchantExpanded: false,
    inventoryExpanded: false,
    pinnedMerchantItems: [],
    pinnedInventoryItems: [],
    multiplePotsEnabled: false,
    multiplePotsCount: 3,
    pinnedItemsLimit: 10,
    battlePageHideImages: false,
    monsterImageOutlineColor: '#ff6b6b',
    lootCardBorderColor: '#f38ba8',
    menuCustomizationExpanded: false,
    monsterBackgrounds: {
      enabled: true,
      effect: 'normal', // normal, gradient, blur, pattern
      overlay: true,
      overlayOpacity: 0.4,
      monsters: {
        'Orc Raider of Grakthar': 'https://raw.githubusercontent.com/asura-cr/ui-addon/refs/heads/main/images/windows_battlefield1.png',
        'Orc Archer': 'https://raw.githubusercontent.com/asura-cr/ui-addon/refs/heads/main/images/windows_battlefield1.png',
        'Orc Grunt of Grakthar': 'https://raw.githubusercontent.com/asura-cr/ui-addon/refs/heads/main/images/windows_battlefield1.png',
        'Orc Berserker': 'https://raw.githubusercontent.com/asura-cr/ui-addon/refs/heads/main/images/windows_battlefield1.png',
        'Orc Shaman': 'https://raw.githubusercontent.com/asura-cr/ui-addon/refs/heads/main/images/windows_battlefield1.png',
        'Drum War Chief': 'https://raw.githubusercontent.com/asura-cr/ui-addon/refs/heads/main/images/Storm%20Caller%20Warchief.png',
        'Iron Warchief': 'https://raw.githubusercontent.com/asura-cr/ui-addon/refs/heads/main/images/Iron%20Warchief.png',
        'Bone-Seer Warchief': 'https://raw.githubusercontent.com/asura-cr/ui-addon/refs/heads/main/images/Bone-Seer%20Warchief.png',
        'Siege-Ram Captain': 'https://raw.githubusercontent.com/asura-cr/ui-addon/refs/heads/main/images/Siege-Ram%20Captain.png',
        'Storm-Caller Warchief': 'https://raw.githubusercontent.com/asura-cr/ui-addon/refs/heads/main/images/Storm%20Caller%20Warchief.png',
        'Ash-Blade Warchief': 'https://raw.githubusercontent.com/asura-cr/ui-addon/refs/heads/main/images/Ash-Blade%20Warchief.png',
        'Mountain Warchief': 'https://raw.githubusercontent.com/asura-cr/ui-addon/refs/heads/main/images/Mountain%20Warchief.png',
        'Orc King of Grakthar': 'https://raw.githubusercontent.com/asura-cr/ui-addon/refs/heads/main/images/Orc%20King%20of%20Grakthar.png'
      } // Will store monster name -> URL mappings
    },
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
      interval: 10 // seconds
    },
    pvpBattlePrediction: {
      enabled: true, // Show battle win/loss prediction
      analyzeAfterAttacks: 2 // Start analysis after this many attacks
    },
    pvpAutoSurrender: {
      enabled: false, // Auto-surrender feature
      surrenderThreshold: 0.2 // Surrender when win probability drops below 20%
    },
    gateGraktharWave: 3, // Default wave for Gate Grakthar (wave 3 = gate=3&wave=3)
    equipSets: {
      enabled: true, // Enable equip sets functionality
      storageKey: 'demonGameEquipSets',
      applyDelay: 350, // Delay between equipment applications (ms)
      showInSidebar: true // Show equip sets in sidebar
    },
    menuItems: [
      { id: 'pvp', name: 'PvP Arena', visible: true, order: 0 },
      { id: 'orc_cull', name: 'War Drums of GRAKTHAR', visible: true, order: 1 },
      { id: 'event_battlefield', name: 'Event Battlefield', visible: true, order: 2 },
      { id: 'gate_grakthar', name: 'Gate Grakthar', visible: true, order: 3 },
      { id: 'battle_pass', name: 'Battle Pass', visible: true, order: 4 },
      { id: 'guild', name: 'Guild', visible: true, order: 5 },
      { id: 'legendary_forge', name: 'Legendary Forge', visible: true, order: 6 },
      { id: 'inventory', name: 'Inventory & Equipment', visible: true, order: 7 },
      { id: 'pets', name: 'Pets & Eggs', visible: true, order: 8 },
      { id: 'stats', name: 'Stats', visible: true, order: 9 },
      { id: 'blacksmith', name: 'Blacksmith', visible: true, order: 10 },
      { id: 'merchant', name: 'Merchant', visible: true, order: 11 },
      { id: 'inventory_quick', name: 'Inventory Quick Access', visible: true, order: 12 },
      { id: 'achievements', name: 'Achievements', visible: true, order: 13 },
      { id: 'collections', name: 'Collections', visible: true, order: 14 },
      { id: 'guide', name: 'How To Play', visible: true, order: 15 },
      { id: 'leaderboard', name: 'Weekly Leaderboard', visible: true, order: 16 },
      { id: 'chat', name: 'Global Chat', visible: true, order: 17 },
      { id: 'patches', name: 'Patch Notes', visible: true, order: 18 },
      { id: 'manga', name: 'Manga-Manhwa-Manhua', visible: true, order: 19 }
    ]
  };

  // Page-specific functionality mapping
  const extensionPageHandlers = {
    '/active_wave.php': initWaveMods,
    '/game_dash.php': initDashboardTools,
    '/battle.php': initBattleMods,
    '/chat.php': initChatMods,
    '/inventory.php': initInventoryMods,
    '/pets.php': initPetMods,
    '/stats.php': initStatMods,
    '/pvp.php': initPvPMods,
    '/pvp_battle.php': [initPvPBattleMods, initPvPMods], // Run both handlers for PvP battle
    '/blacksmith.php': initBlacksmithMods,
    '/merchant.php': initMerchantMods,
    '/orc_cull_event.php': initEventMods,
    '/weekly.php': initLeaderboardMods,
    '/collections.php': initCollectionsMods,
    '/achievements.php': initAchievementsMods,
    '/battle_pass.php': initBattlePassMods,
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
          waveAutoRefresh: {
            ...extensionSettings.waveAutoRefresh,
            ...savedSettings.waveAutoRefresh,
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
        { id: 'pvp', name: 'PvP Arena', visible: true, order: 0 },
        { id: 'orc_cull', name: 'War Drums of GRAKTHAR', visible: true, order: 1 },
        { id: 'event_battlefield', name: 'Event Battlefield', visible: true, order: 2 },
        { id: 'gate_grakthar', name: 'Gate Grakthar', visible: true, order: 3 },
        { id: 'battle_pass', name: 'Battle Pass', visible: true, order: 4 },
        { id: 'guild', name: 'Guild', visible: true, order: 5 },
        { id: 'legendary_forge', name: 'Legendary Forge', visible: true, order: 6 },
        { id: 'inventory', name: 'Inventory & Equipment', visible: true, order: 7 },
        { id: 'pets', name: 'Pets & Eggs', visible: true, order: 8 },
        { id: 'stats', name: 'Stats', visible: true, order: 9 },
        { id: 'blacksmith', name: 'Blacksmith', visible: true, order: 10 },
        { id: 'merchant', name: 'Merchant', visible: true, order: 11 },
        { id: 'inventory_quick', name: 'Inventory Quick Access', visible: true, order: 12 },
        { id: 'achievements', name: 'Achievements', visible: true, order: 13 },
        { id: 'collections', name: 'Collections', visible: true, order: 14 },
        { id: 'guide', name: 'How To Play', visible: true, order: 15 },
        { id: 'leaderboard', name: 'Weekly Leaderboard', visible: true, order: 16 },
        { id: 'chat', name: 'Global Chat', visible: true, order: 17 },
        { id: 'patches', name: 'Patch Notes', visible: true, order: 18 },
        { id: 'manga', name: 'Manga-Manhwa-Manhua', visible: true, order: 19 },
      ];
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
        effect: 'normal',
        overlay: true,
        overlayOpacity: 0.5,
        monsters: {}
      };
    }
    
    applySettings();
      applyCustomBackgrounds();
    applyMonsterBackgrounds();
  }

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
    
    // Check saved collapse state before creating HTML
    const savedCollapseState = localStorage.getItem('equipSetsCollapsed');
    const isCollapsed = savedCollapseState === null ? true : savedCollapseState === 'true';
    
    // Set initial styles based on saved state
    const contentStyles = isCollapsed 
      ? 'transition: all 0.3s ease; overflow: hidden; max-height: 0px; opacity: 0; margin-top: 0px;'
      : 'transition: all 0.3s ease; overflow: hidden; max-height: 1000px; opacity: 1; margin-top: 15px;';
    
    const toggleStyles = isCollapsed
      ? 'font-size: 16px; color: #89b4fa; transition: transform 0.3s ease; transform: rotate(-90deg);'
      : 'font-size: 16px; color: #89b4fa; transition: transform 0.3s ease;';
    
    const toggleIcon = isCollapsed ? '▶' : '▼';
    
    const equipSetsPanel = document.createElement('div');
    equipSetsPanel.id = 'integrated-equip-sets';
    equipSetsPanel.innerHTML = `
      <div style="background: rgba(30, 30, 46, 0.8); border: 1px solid rgba(43, 46, 73, 0.6); border-radius: 10px; padding: 20px; margin: 20px 0; backdrop-filter: blur(10px);">
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
    setTimeout(() => location.reload(), 800);
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
    const sidebar = document.getElementById('game-sidebar');
    if (sidebar) {
      sidebar.style.background = extensionSettings.sidebarColor + ' !important';
    }
    document.body.style.backgroundColor = extensionSettings.backgroundColor;
    
    // Apply color settings to CSS variables
    document.documentElement.style.setProperty('--monster-image-outline-color', extensionSettings.monsterImageOutlineColor);
    document.documentElement.style.setProperty('--loot-card-border-color', extensionSettings.lootCardBorderColor);
      
      // Apply background images
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

  // Function to generate menu items based on customization settings
  function generateMenuItems() {
    // Sort menu items by order and filter visible ones
    const sortedItems = [...extensionSettings.menuItems]
      .sort((a, b) => a.order - b.order)
      .filter(item => item.visible);
    
    let menuHTML = '';
    
    sortedItems.forEach(item => {
      switch(item.id) {
        case 'pvp':
          menuHTML += `<li><a href="pvp.php"><img src="images/pvp/season_2/compressed_pvp_season_2.webp" alt="PvP Arena"> PvP Arena</a></li>`;
          break;
        case 'orc_cull':
          menuHTML += `<li><a href="orc_cull_event.php"><img src="/images/events/orc_cull/banner.webp" alt="Goblin Feast"> 🪓 ⚔️ War Drums of GRAKTHAR</a></li>`;
          break;
        case 'event_battlefield':
          menuHTML += `<li><a href="active_wave.php?event=2&wave=6" draggable="false"><img src="/images/events/orc_cull/banner.webp" alt="War Drums of GRAKTHAR"> Event Battlefield</a></li>`;
          break;
        case 'gate_grakthar':
          menuHTML += `<li><a href="active_wave.php?gate=3&wave=${extensionSettings.gateGraktharWave}"><img src="images/gates/gate_688e438aba7f24.99262397.webp" alt="Gate"> Gate Grakthar</a></li>`;
          break;
        case 'battle_pass':
          menuHTML += `
        <li>
          <div class="sidebar-menu-expandable">
            <a href="battle_pass.php"><img src="images/battle%20pass/enternal%20season/enternal_season_banner.webp" alt="Battle Pass"> Battle Pass</a>
            <button class="expand-btn" id="battle-pass-expand-btn" draggable="false">${extensionSettings.battlePassExpanded ? '–' : '+'}</button>
          </div>
          <div id="battle-pass-expanded" class="sidebar-submenu ${extensionSettings.battlePassExpanded ? '' : 'collapsed'}">
            <div class="battle-pass-section">
              <div class="battle-pass-header">
                <span>Daily Quests</span>
                <button class="refresh-btn" id="battle-pass-refresh-btn" title="Refresh Daily Quests">🔄</button>
              </div>
              <div id="battle-pass-quests" class="battle-pass-quests-container">
                <div class="loading-text">Loading quests...</div>
              </div>
            </div>
          </div>
        </li>`;
          break;
        case 'guild':
          menuHTML += `<li><a href="guild_dash.php"><img src="images/menu/compressed_guilds.webp" alt="Guild">Guild</a></li>`;
          break;
        case 'legendary_forge':
          menuHTML += `<li><a href="legendary_forge.php"><img src="images/menu/compressed_legendary_forge.webp" alt="Legendary Forge">Legendary Forge</a></li>`;
          break;
        case 'inventory':
          menuHTML += `<li><a href="inventory.php"><img src="images/menu/compressed_chest.webp" alt="Inventory"> Inventory & Equipment</a></li>`;
          break;

        case 'pets':
          menuHTML += `
        <li>
          <div class="sidebar-menu-expandable">
            <a href="pets.php"><img src="images/menu/compressed_eggs_menu.webp" alt="Pets"> Pets & Eggs</a>
            <button class="expand-btn" id="pets-expand-btn">+</button>
          </div>
          <div id="pets-expanded" class="sidebar-submenu collapsed">
            <div class="coming-soon-text">🚧 Working on it / Coming Soon</div>
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
                    Points Available: <span id="sidebar-points-alloc">-</span>
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
            <div class="coming-soon-text">🚧 Working on it / Coming Soon</div>
          </div>
            </li>`;
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

      }
    });
    
    return menuHTML;
  }

  function initSideBar(){
    const noContainerPage = !document.querySelector('.container') && !document.querySelector('.wrap');
    const mainWrapper = document.createElement('div');
    mainWrapper.className = 'main-wrapper';

    const sidebar = document.createElement('aside');
    sidebar.id = 'game-sidebar';
    sidebar.innerHTML = `
      <div class="sidebar-header">
        <a href="game_dash.php" style="text-decoration:none;"><h2>Game Menu</h2></a>
        <button class="sidebar-toggle-btn" id="sidebar-toggle-btn" title="Toggle Sidebar">☰</button>
      </div>

      <ul class="sidebar-menu">
        ${generateMenuItems()}
      </ul>
    `;

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
        background: ${extensionSettings.sidebarColor};
        border-right: 1px solid rgba(255, 255, 255, 0.06);
        flex-shrink: 0;
        overflow-y: auto;
        position: fixed;
        top: 55px;
        left: 0;
        height: calc(100vh - 55px);
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
          <div class="settings-container">
            <div class="settings-header">
              <h1>⚙️ Settings</h1>
            </div>

            <div class="settings-content">
              <div class="settings-grid">
                <!-- Sidebar Color Section -->
                <div class="settings-section expanded">
                  <div class="settings-section-header" onclick="toggleSection(this)">
                    <h3>🎨 Sidebar Color</h3>
                    <span class="expand-icon">−</span>
            </div>
            <div class="settings-section-content">
                    <p class="section-description">Choose a color theme for your side panel navigation.</p>
                    <div class="color-input-group">
                      <input type="color" id="sidebar-custom-color" value="#2a2a2a">
                      <label>Custom Color</label>
            </div>
            </div>
          </div>

                <!-- Background Color Section -->
                <div class="settings-section expanded">
                  <div class="settings-section-header" onclick="toggleSection(this)">
                    <h3>🌅 Background Color</h3>
                    <span class="expand-icon">−</span>
            </div>
                  <div class="settings-section-content">
                    <p class="section-description">Set the main background color for your application.</p>
                    <div class="color-input-group">
                      <input type="color" id="background-custom-color" value="#000000">
                      <label>Custom Color</label>
                    </div>
            </div>
          </div>

                <!-- Monster Image Outline Section -->
          <div class="settings-section">
                  <div class="settings-section-header" onclick="toggleSection(this)">
                    <h3>🐲 Monster Image Outline</h3>
                    <span class="expand-icon">+</span>
            </div>
                  <div class="settings-section-content">
                    <p class="section-description">Customize the outline color for monster images in battles.</p>
                    <div class="color-input-group">
                      <input type="color" id="monster-image-custom-color" value="#ff6b6b">
                      <label>Custom Color</label>
                    </div>
            </div>
          </div>

          <div class="settings-section">
            <h3>🐉 Monster Backgrounds</h3>
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
                    </div>
                  </label>
                </div>
                <div style="margin-left: 25px;">
                  <label style="color: #a6adc8; font-size: 12px;">Overlay Opacity:</label>
                  <input type="range" id="monster-bg-overlay-opacity" min="0.1" max="0.8" step="0.1" value="0.4" 
                         style="width: 150px; margin-left: 10px;">
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
                <div id="monster-url-inputs">
                  <!-- Monster URL inputs will be populated here -->
                </div>
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
          </div>


          <div class="settings-section">
            <div class="settings-section-header" onclick="toggleSection(this)">
              <h3>💎 Loot Card Customization</h3>
              <span class="expand-icon">+</span>
            </div>
            <div class="settings-section-content">
              <p style="color: #a6adc8; font-size: 12px; margin-bottom: 15px;">
                Customize loot card borders and highlighting when damage requirements are met.
              </p>
              
              <!-- Border Color Section -->
              <div style="margin: 15px 0;">
                <h4 style="color: #f9e2af; margin-bottom: 15px;">🎨 Border Colors</h4>
                <div class="color-input-group">
                  <input type="color" id="loot-card-custom-color" value="#f38ba8" 
                         style="width: 50px; height: 30px; border: none; border-radius: 4px; cursor: pointer;">
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
                      <input type="color" id="loot-highlighting-bg-color" value="#00ff1e" 
                             style="width: 50px; height: 30px; border: none; border-radius: 4px; cursor: pointer;">
                      <span style="color: #cdd6f4; margin-left: 10px;">Background Color</span>
                    </div>
                  </div>
                  
                  <div>
                    <label style="color: #f9e2af; margin-bottom: 10px; display: block;">Glow Color:</label>
                    <div style="margin-top: 10px;">
                      <input type="color" id="loot-highlighting-glow-color" value="#ffd700" 
                             style="width: 50px; height: 30px; border: none; border-radius: 4px; cursor: pointer;">
                      <span style="color: #cdd6f4; margin-left: 10px;">Glow Effect Color</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

            <div class="settings-section">
              <div class="settings-section-header" onclick="toggleSection(this)">
                <h3>🖼️ Custom Backgrounds</h3>
                <span class="expand-icon">+</span>
              </div>
              <div class="settings-section-content">
                <p style="color: #a6adc8; font-size: 12px; margin-bottom: 15px;">
                  Upload custom backgrounds for any page. 
                </p>
              <div style="margin: 15px 0;">
                <label style="display: flex; align-items: center; gap: 10px; color: #cdd6f4; margin-bottom: 15px;">
                  <input type="checkbox" id="custom-backgrounds-enabled" class="cyberpunk-checkbox">
                  <span>Enable custom backgrounds</span>
                </label>

                <div id="custom-backgrounds-container" style="margin-top: 20px;">
                  <h4 style="color: #f9e2af; margin-bottom: 15px;">Custom Background URLs</h4>
                  <div id="custom-bg-inputs">
                    <!-- Custom background inputs will be populated here -->
                  </div>
                  <button type="button" id="add-custom-bg" class="settings-button" style="background: #89b4fa; margin-top: 10px;">
                    ➕ Add Custom Background
                  </button>
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

              <!-- Auto-Surrender Settings -->
              <div style="margin-bottom: 15px; padding: 15px; background: rgba(49, 50, 68, 0.3); border-radius: 8px; border-left: 3px solid #f38ba8;">
                <h4 style="color: #f38ba8; margin: 0 0 15px 0; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                  🏳️ Auto-Surrender
                </h4>
                <p style="color: #a6adc8; font-size: 11px; margin-bottom: 15px;">
                  Automatically surrender when losing is detected. Requires battle prediction to be enabled.
                </p>
                <label style="display: flex; align-items: center; gap: 10px; color: #cdd6f4; margin-bottom: 15px;">
                  <input type="checkbox" id="pvp-auto-surrender-enabled" class="cyberpunk-checkbox">
                  <span>Enable auto-surrender</span>
                </label>
                
                <div style="margin: 15px 0;">
                  <label style="color: #f9e2af; margin-bottom: 10px; display: block;">Surrender Threshold:</label>
                  <select id="pvp-surrender-threshold" style="width: 200px; padding: 8px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px;">
                    <option value="0.1">10% (Very Aggressive)</option>
                    <option value="0.2" selected>20% (Aggressive)</option>
                    <option value="0.3">30% (Moderate)</option>
                    <option value="0.4">40% (Conservative)</option>
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
              <h3>🚪 Gate Grakthar Configuration</h3>
              <span class="expand-icon">–</span>
            </div>
            <div class="settings-section-content expanded">
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
                  
                  <div style="background: rgba(26, 27, 38, 0.5); padding: 12px; border-radius: 6px; border: 1px solid #45475a;">
                    <p style="color: #a6adc8; font-size: 12px; margin: 0; line-height: 1.4;">
                      <strong style="color: #f9e2af;">💡 Quick Setup:</strong><br>
                      • <strong>5-15 seconds:</strong> Fast refresh for active monitoring<br>
                      • <strong>30-60 seconds:</strong> Balanced for regular checking<br>
                      • <strong>2-5 minutes:</strong> Light refresh for background monitoring<br>
                      • <strong>Range:</strong> 5 seconds to 10 minutes maximum
                    </p>
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

          <div style="text-align: center; margin-top: 30px;">
            <button class="settings-button" data-action="close">Close</button>
            <button class="settings-button" data-action="reset">Reset to Default</button>
            <button class="settings-button" data-action="clear" style="background: #f38ba8;">Clear All Data</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
        
        // Add toggle section function to global scope
        window.toggleSection = function(header) {
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
        
      setupColorSelectors();
      updateColorSelections();
      setupMonsterBackgroundControls();
        setupLootHighlightingSettings();
        setupCustomBackgroundSettings();
      setupPvPAutoSurrenderSettings();
      setupNewWaveAutoRefreshSettings();
      setupGateGraktharSettings();
      setupEquipSetsSettings();
      setupMenuCustomizationListeners();
        
        // Initialize all cyberpunk checkboxes
        initializeAllCheckboxes();
      setupSettingsModalListeners();
    }

    modal.style.display = 'flex';

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeSettingsModal();
      }
    });
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
      header.addEventListener('click', function() {
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
      resetBtn.addEventListener('click', function() {
        // Reset to default menu items
        extensionSettings.menuItems = [
          { id: 'pvp', name: 'PvP Arena', visible: true, order: 0 },
          { id: 'orc_cull', name: 'War Drums of GRAKTHAR', visible: true, order: 1 },
          { id: 'event_battlefield', name: 'Event Battlefield', visible: true, order: 2 },
          { id: 'gate_grakthar', name: 'Gate Grakthar', visible: true, order: 3 },
          { id: 'inventory', name: 'Inventory & Equipment', visible: true, order: 4 },
          { id: 'pets', name: 'Pets & Eggs', visible: true, order: 5 },
          { id: 'stats', name: 'Stats', visible: true, order: 7 },
          { id: 'blacksmith', name: 'Blacksmith', visible: true, order: 8 },
          { id: 'merchant', name: 'Merchant', visible: true, order: 9 },
          { id: 'inventory_quick', name: 'Inventory Quick Access', visible: true, order: 10 },
          { id: 'achievements', name: 'Achievements', visible: true, order: 11 },
          { id: 'collections', name: 'Collections', visible: true, order: 12 },
          { id: 'guide', name: 'How To Play', visible: true, order: 13 },
          { id: 'leaderboard', name: 'Weekly Leaderboard', visible: true, order: 14 },
          { id: 'chat', name: 'Global Chat', visible: true, order: 15 },
          { id: 'patches', name: 'Patch Notes', visible: true, order: 16 },
          { id: 'manga', name: 'Manga-Manhwa-Manhua', visible: true, order: 17 },
          { id: 'settings', name: 'Settings', visible: true, order: 18 }
        ];
        
        saveSettings();
        populateMenuItemsList();
        showNotification('Menu customization reset to default', 'success');
      });
    }

    // Apply button
    const applyBtn = document.getElementById('apply-menu-customization');
    if (applyBtn) {
      applyBtn.addEventListener('click', function() {
        saveSettings();
        refreshSidebar();
        showNotification('Menu customization applied!', 'success');
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
    }
  }

  function setupNewWaveAutoRefreshSettings() {
    const timeInput = document.getElementById('wave-refresh-time');
    const unitSelect = document.getElementById('wave-refresh-unit');
    
    if (!timeInput || !unitSelect) {
      console.log('Wave auto-refresh inputs not found');
      return;
    }
    
    console.log('Setting up new wave auto-refresh, current interval:', extensionSettings.waveAutoRefresh.interval, 'seconds');
    
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
    if (currentPage.includes('active_wave.php') || currentPage.includes('orc_cull_event.php')) {
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

  // Debug function for monster backgrounds - can be called from console
  window.debugMonsterBackgrounds = function() {
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
  window.enableMonsterBackgrounds = function() {
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
  window.testMonsterImageUrls = function() {
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
  window.testImageUrl = function(url) {
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
    const intervalMs = extensionSettings.waveAutoRefresh.interval * 1000;
    
    waveRefreshInterval = setInterval(() => {
      console.log('Auto-refreshing wave page...');
      window.location.reload();
    }, intervalMs);
    
    console.log(`Wave auto-refresh started: ${extensionSettings.waveAutoRefresh.interval} seconds`);
  }

  function stopWaveAutoRefresh() {
    if (waveRefreshInterval) {
      clearInterval(waveRefreshInterval);
      waveRefreshInterval = null;
      console.log('Wave auto-refresh stopped');
    }
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    stopWaveAutoRefresh();
  });

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
    // Reset to default menu items
    extensionSettings.menuItems = [
      { id: 'pvp', name: 'PvP Arena', visible: true, order: 0 },
      { id: 'orc_cull', name: 'War Drums of GRAKTHAR', visible: true, order: 1 },
      { id: 'event_battlefield', name: 'Event Battlefield', visible: true, order: 2 },
      { id: 'gate_grakthar', name: 'Gate Grakthar', visible: true, order: 3 },
      { id: 'inventory', name: 'Inventory & Equipment', visible: true, order: 4 },
      { id: 'pets', name: 'Pets & Eggs', visible: true, order: 5 },
      { id: 'stats', name: 'Stats', visible: true, order: 7 },
      { id: 'blacksmith', name: 'Blacksmith', visible: true, order: 8 },
      { id: 'merchant', name: 'Merchant', visible: true, order: 9 },
      { id: 'inventory_quick', name: 'Inventory Quick Access', visible: true, order: 10 },
      { id: 'achievements', name: 'Achievements', visible: true, order: 11 },
      { id: 'collections', name: 'Collections', visible: true, order: 12 },
      { id: 'guide', name: 'How To Play', visible: true, order: 13 },
      { id: 'leaderboard', name: 'Weekly Leaderboard', visible: true, order: 14 },
      { id: 'chat', name: 'Global Chat', visible: true, order: 15 },
      { id: 'patches', name: 'Patch Notes', visible: true, order: 16 },
      { id: 'manga', name: 'Manga-Manhwa-Manhua', visible: true, order: 17 },
      { id: 'settings', name: 'Settings', visible: true, order: 18 }
    ];
    
    saveSettings();
    populateMenuItemsList();
    showNotification('Menu customization reset to default', 'success');
  };

  window.applyMenuCustomization = function() {
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
  }

  function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.style.display = 'none';
    }
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
    console.log('Demon Game Enhancement v3.0 - Initializing...');
      
      // Clean up any existing observers
      if (window.backgroundObserver) {
        window.backgroundObserver.disconnect();
        window.backgroundObserver = null;
      }
    
    // Load settings first
    safeExecute(() => loadSettings(), 'Load Settings');
    
    // Initialize sidebar
    safeExecute(() => initSideBar(), 'Sidebar Initialization');
    
    // Disable dragging on interactive elements
    safeExecute(() => initDraggableFalse(), 'Disable Dragging');
    
    // Initialize page-specific functionality
    safeExecute(() => initPageSpecificFunctionality(), 'Page-Specific Functionality');
    
    
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
    
    console.log('Demon Game Enhancement v3.0 - Initialization Complete!');
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
    const filterContainer = document.createElement('div');
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
          <div id="monster-type-dropdown" style="display: none; position: absolute; top: 100%; left: 0; background: #1e1e2e; border: 1px solid #45475a; border-radius: 4px; padding: 10px; z-index: 1000; min-width: 200px; max-height: 200px; overflow-y: auto;">
            <div style="margin-bottom: 8px; font-weight: bold; color: #cba6f7; border-bottom: 1px solid #45475a; padding-bottom: 5px;">Wave 1 Monsters</div>
            <label style="display: block; margin: 3px 0; color: #cdd6f4; font-size: 12px;">
                <input type="checkbox" value="Orc Grunt" class="monster-type-checkbox cyberpunk-checkbox"> Orc Grunt
      </label>
            <label style="display: block; margin: 3px 0; color: #cdd6f4; font-size: 12px;">
                <input type="checkbox" value="Orc Bonecrusher" class="monster-type-checkbox cyberpunk-checkbox"> Orc Bonecrusher
            </label>
            <label style="display: block; margin: 3px 0; color: #cdd6f4; font-size: 12px;">
                <input type="checkbox" value="Hobgoblin Spearman" class="monster-type-checkbox cyberpunk-checkbox"> Hobgoblin Spearman
            </label>
            <label style="display: block; margin: 3px 0; color: #cdd6f4; font-size: 12px;">
                <input type="checkbox" value="Goblin Slinger" class="monster-type-checkbox cyberpunk-checkbox"> Goblin Slinger
            </label>
            <label style="display: block; margin: 3px 0; color: #cdd6f4; font-size: 12px;">
                <input type="checkbox" value="Goblin Skirmisher" class="monster-type-checkbox cyberpunk-checkbox"> Goblin Skirmisher
            </label>
            <div style="margin: 8px 0; font-weight: bold; color: #cba6f7; border-bottom: 1px solid #45475a; padding-bottom: 5px;">Wave 2 Monsters</div>
            <label style="display: block; margin: 3px 0; color: #cdd6f4; font-size: 12px;">
                <input type="checkbox" value="Lizardman Shadowclaw" class="monster-type-checkbox cyberpunk-checkbox"> Lizardman Shadowclaw
            </label>
            <label style="display: block; margin: 3px 0; color: #cdd6f4; font-size: 12px;">
                <input type="checkbox" value="Troll Brawler" class="monster-type-checkbox cyberpunk-checkbox"> Troll Brawler
            </label>
            <label style="display: block; margin: 3px 0; color: #cdd6f4; font-size: 12px;">
                <input type="checkbox" value="Lizardman Flamecaster" class="monster-type-checkbox cyberpunk-checkbox"> Lizardman Flamecaster
            </label>
            <label style="display: block; margin: 3px 0; color: #cdd6f4; font-size: 12px;">
                <input type="checkbox" value="Troll Ravager" class="monster-type-checkbox cyberpunk-checkbox"> Troll Ravager
            </label>
            <div style="margin: 8px 0; font-weight: bold; color: #cba6f7; border-bottom: 1px solid #45475a; padding-bottom: 5px;">EventWave Monsters</div>
            <label style="display: block; margin: 3px 0; color: #cdd6f4; font-size: 12px;">
                <input type="checkbox" value="Orc Berserker" class="monster-type-checkbox cyberpunk-checkbox"> Orc Berserker
            </label>
            <label style="display: block; margin: 3px 0; color: #cdd6f4; font-size: 12px;">
                <input type="checkbox" value="Orc Grunt of Grakthar" class="monster-type-checkbox cyberpunk-checkbox"> Orc Grunt of Grakthar
            </label>
            <label style="display: block; margin: 3px 0; color: #cdd6f4; font-size: 12px;">
                <input type="checkbox" value="Orc Archer" class="monster-type-checkbox cyberpunk-checkbox"> Orc Archer
            </label>
            <label style="display: block; margin: 3px 0; color: #cdd6f4; font-size: 12px;">
                <input type="checkbox" value="Orc Raider of Grakthar" class="monster-type-checkbox cyberpunk-checkbox"> Orc Raider of Grakthar
            </label>
            <label style="display: block; margin: 3px 0; color: #cdd6f4; font-size: 12px;">
                <input type="checkbox" value="Orc Shaman" class="monster-type-checkbox cyberpunk-checkbox"> Orc Shaman
            </label>
            <div style="margin-top: 8px; padding-top: 5px; border-top: 1px solid #45475a;">
              <button id="select-all-monsters" style="padding: 3px 8px; background: #a6e3a1; color: #1e1e2e; border: none; border-radius: 3px; cursor: pointer; font-size: 11px; margin-right: 5px;">Select All</button>
              <button id="clear-monsters" style="padding: 3px 8px; background: #f38ba8; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">Clear</button>
            </div>
          </div>
        </div>
        
        <div style="position: relative; display: inline-block;">
          <button id="loot-filter-toggle" style="padding: 5px 10px; background: #1e1e2e; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; cursor: pointer; min-width: 120px; text-align: left;">
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
        
      <label style="display: flex; align-items: center; gap: 5px; color: #cdd6f4;">
          <input type="checkbox" id="hide-img-monsters" class="cyberpunk-checkbox">
        Hide images
      </label>
      
      <label style="display: flex; align-items: center; gap: 5px; color: #cdd6f4;">
          <input type="checkbox" id="wave-auto-refresh-toggle" class="cyberpunk-checkbox" ${extensionSettings.waveAutoRefresh.enabled ? 'checked' : ''}>
        🔄 Auto-refresh
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
      </div>
    `;

    const contentArea = document.querySelector('.content-area');
    const monsterContainer = document.querySelector('.monster-container');
    if (contentArea && monsterContainer) {
      contentArea.insertBefore(filterContainer, monsterContainer);
    }

    // Add event listeners for all filter elements
    document.getElementById('monster-name-filter').addEventListener('input', applyMonsterFilters);
    document.getElementById('hp-filter').addEventListener('change', applyMonsterFilters);
    document.getElementById('player-count-filter').addEventListener('change', applyMonsterFilters);
    document.getElementById('hide-img-monsters').addEventListener('change', applyMonsterFilters);
    
    // Wave auto-refresh toggle handler
    const waveAutoRefreshToggle = document.getElementById('wave-auto-refresh-toggle');
    if (waveAutoRefreshToggle) {
      waveAutoRefreshToggle.addEventListener('change', function() {
        extensionSettings.waveAutoRefresh.enabled = this.checked;
        saveSettings();
        
        if (this.checked) {
          initWaveAutoRefresh();
          showNotification('Wave auto-refresh enabled', 'success');
        } else {
          stopWaveAutoRefresh();
          showNotification('Wave auto-refresh disabled', 'success');
        }
        
        console.log('Wave auto refresh toggled:', this.checked);
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
    
    // Monster type checkbox listeners
    document.querySelectorAll('.monster-type-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', applyMonsterFilters);
    });
    
    // Select all and clear buttons for monster types
    document.getElementById('select-all-monsters').addEventListener('click', () => {
      document.querySelectorAll('.monster-type-checkbox').forEach(checkbox => {
        checkbox.checked = true;
      });
      applyMonsterFilters();
    });
    
    document.getElementById('clear-monsters').addEventListener('click', () => {
      document.querySelectorAll('.monster-type-checkbox').forEach(checkbox => {
        checkbox.checked = false;
      });
      applyMonsterFilters();
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
      applyMonsterFilters();
    });
    
    document.getElementById('clear-loot').addEventListener('click', () => {
      document.querySelectorAll('.loot-filter-checkbox').forEach(checkbox => {
        checkbox.checked = false;
      });
      applyMonsterFilters();
    });

    // Initialize filter values from settings
    if (settings.nameFilter) document.getElementById('monster-name-filter').value = settings.nameFilter;
    if (settings.hpFilter) document.getElementById('hp-filter').value = settings.hpFilter;
    if (settings.playerCountFilter) document.getElementById('player-count-filter').value = settings.playerCountFilter;
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

    // Initialize loot filter by populating dropdown and restoring settings
    if (settings.lootFilter && Array.isArray(settings.lootFilter) && settings.lootFilter.length > 0) {
      // Populate the loot filter dropdown immediately so we can restore the settings
      populateLootFilterDropdown().then(() => {
        // After dropdown is populated, apply the filters
        applyMonsterFilters();
      });
    }

    // Apply filters if any are set
    if (settings.nameFilter || (settings.monsterTypeFilter && settings.monsterTypeFilter.length > 0) || settings.hpFilter || settings.playerCountFilter || settings.hideImg || settings.battleLimitAlarm) {
      applyMonsterFilters();
    }
    
    // Special case: if we have loot filters but didn't populate the dropdown yet, 
    // we'll apply filters again after the dropdown is populated (see above)
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
      checkbox.addEventListener('change', applyMonsterFilters);
    });
    
    // Restore saved filter state
    const savedSettings = JSON.parse(localStorage.getItem('demonGameFilterSettings') || '{}');
    if (savedSettings.lootFilter && Array.isArray(savedSettings.lootFilter)) {
      savedSettings.lootFilter.forEach(lootName => {
        const checkbox = document.querySelector(`.loot-filter-checkbox[value="${lootName}"]`);
        if (checkbox) checkbox.checked = true;
      });
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

  function applyMonsterFilters() {
    const nameFilter = document.getElementById('monster-name-filter').value.toLowerCase();
    const hpFilter = document.getElementById('hp-filter').value;
    const playerCountFilter = document.getElementById('player-count-filter').value;
    const hideImg = document.getElementById('hide-img-monsters').checked;
    const battleLimitAlarm = document.getElementById('battle-limit-alarm').checked;
    const battleLimitAlarmSound = document.getElementById('battle-limit-alarm-sound').checked;
    const battleLimitAlarmVolume = parseInt(document.getElementById('battle-limit-alarm-volume').value, 10);

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

    if (battleLimitAlarm) {
      alarmInterval = setInterval(() => {
        location.reload();
      }, 5000);
    } else {
      clearInterval(alarmInterval);
    }

    const monsters = document.querySelectorAll('.monster-card');
    var limitBattleCount = 0;
    
    // Track visible monsters by category
    let visibleContinueCount = 0;
    let visibleLootCount = 0;
    let visibleJoinCount = 0;

    monsters.forEach(monster => {
      const monsterNameElement = monster.querySelector('h3');
      const monsterName = monsterNameElement ? monsterNameElement.textContent.toLowerCase() : '';
      const originalMonsterName = monsterNameElement ? monsterNameElement.textContent.trim() : '';
      const monsterImg = monster.querySelector('img');
      
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

      // Determine monster wave based on name
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

      // Loot filter (multiple selection) - use original monster name for cache lookup
      if (selectedLootItems.length > 0 && shouldShow) {
        const monsterLoot = lootCache.get(originalMonsterName);
        if (monsterLoot && monsterLoot.length > 0) {
          // Check if monster has any of the selected loot items
          const hasSelectedLoot = selectedLootItems.some(lootName => 
            monsterLoot.some(lootItem => lootItem.name === lootName)
          );
          if (!hasSelectedLoot) {
            shouldShow = false;
          }
        } else {
          // If no loot data available for this monster, hide it when loot filter is active
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

      // Apply visibility
      monster.style.display = shouldShow ? '' : 'none';
      
      // Count visible monsters by category (only if monster is visible)
      if (shouldShow) {
        const monsterText = monster.textContent;
        const monsterId = monster.getAttribute('data-monster-id');
        
        // Skip counting if this monster was already looted
        if (lootedMonsters.has(monsterId)) {
          return; // Skip this monster from counting
        }
        
        if (monsterText.includes('Continue the Battle')) {
          visibleContinueCount++;
        } else if (monsterText.includes('Loot')) {
          visibleLootCount++;
        } else {
          visibleJoinCount++;
        }
      }

      // Handle image visibility and loot preview
      const lootPreview = monster.querySelector('.loot-preview-grid');
      if (hideImg && monsterImg) {
        monsterImg.style.display = 'none';
        if (lootPreview) {
          lootPreview.style.display = 'none';
        }
      } else if (monsterImg) {
        monsterImg.style.removeProperty('display');
        if (lootPreview) {
          lootPreview.style.removeProperty('display');
        }
      }

      // Count battles for alarm
      if (monster.innerText.includes('Continue the Battle')) {
        limitBattleCount++;
      }
    });
    
    // Update section header counts
    updateSectionHeaderCounts(visibleContinueCount, visibleLootCount, visibleJoinCount);

    if (battleLimitAlarm && limitBattleCount < 3) {
      showNotification('🔔 Battle limit alarm: Less than 3 battles!', 'success');
      
      // Play alarm sound if enabled
      if (battleLimitAlarmSound) {
        playAlarmSound();
      }
    }

    // Save all filter settings
    const settings = {
      nameFilter: document.getElementById('monster-name-filter').value,
      monsterTypeFilter: selectedMonsterTypes,
      lootFilter: selectedLootItems,
      hpFilter: document.getElementById('hp-filter').value,
      playerCountFilter: document.getElementById('player-count-filter').value,
      hideImg: document.getElementById('hide-img-monsters').checked,
      battleLimitAlarm: document.getElementById('battle-limit-alarm').checked,
      battleLimitAlarmSound: document.getElementById('battle-limit-alarm-sound').checked,
      battleLimitAlarmVolume: parseInt(document.getElementById('battle-limit-alarm-volume').value, 10)
    };
    localStorage.setItem('demonGameFilterSettings', JSON.stringify(settings));
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
    
    // Clear all loot filter checkboxes
    document.querySelectorAll('.loot-filter-checkbox').forEach(checkbox => {
      checkbox.checked = false;
    });
    
    applyMonsterFilters();
    showNotification('All filters cleared!', 'info');
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

  function lootWave(monsterId) {
    fetch('loot.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'monster_id=' + monsterId + '&user_id=' + userId
    })
    .then(res => res.json())
    .then(data => {
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
            showNotification(data.message || 'Failed to loot.', 'error');
        }
    })
    .catch(() => showNotification("Server error", 'error'));
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
    
    // Make sure filters are applied before we check for visible monsters
    console.log('Re-applying filters before loot all...');
    applyMonsterFilters();
    
    // Wait a moment for the DOM to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Find all available loot buttons from VISIBLE monsters only
    const allMonsters = document.querySelectorAll('.monster-card');
    const availableLootButtons = [];
    
    let visibleMonsterCount = 0;
    
    allMonsters.forEach((monster, index) => {
      // Check if monster is actually visible (not hidden by filters)
      // The applyMonsterFilters function sets display to '' for visible and 'none' for hidden
      const isVisible = monster.style.display !== 'none';

      if (isVisible) {
        visibleMonsterCount++;
        const lootButtons = monster.querySelectorAll('.join-btn');
        
        // Find the best loot button for this monster (prefer "Loot Instantly" if available)
        let bestLootButton = null;
        lootButtons.forEach(btn => {
          if ((btn.innerText.includes('💰 Loot Instantly') || btn.innerText.includes('Loot')) && 
              !btn.disabled && 
              !btn.innerText.includes('Looted') &&
              !btn.style.display.includes('none')) {
            
            // Prefer "Loot Instantly" over regular "Loot"
            if (btn.innerText.includes('💰 Loot Instantly')) {
              bestLootButton = btn;
            } else if (!bestLootButton && btn.innerText.includes('💰 Loot')) {
              bestLootButton = btn;
            }
          }
        });
        
        // Only add one button per monster
        if (bestLootButton) {
          availableLootButtons.push(bestLootButton);
        }
      }
    });
    
    if (availableLootButtons.length === 0) {
      showNotification('No loot available to claim from filtered monsters!', 'info');
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
      
      // Collect all successful loot and manually update the UI
      let allLootItems = [];
      let successCount = 0;
      let errorCount = 0;
      
      results.forEach((data, index) => {
        if (data.status === 'success' && data.items) {
          successCount++;
          allLootItems = allLootItems.concat(data.items);
          
          // Track this monster as looted so it won't be counted anymore
          const lootButton = availableLootButtons[index];
          if (lootButton) {
            const monsterId = lootButton.getAttribute('data-monster-id');
            if (monsterId) {
              lootedMonsters.add(monsterId);
            }
          }
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

    header.addEventListener('click', function() {
      scrollContent.classList.toggle('collapsed');
    });
  }

  function initContinueBattleFirst(){
    const monsterContainer = document.querySelector('.monster-container');
    if (!monsterContainer) return;

    document.querySelectorAll('.monster-card').forEach(x => {
      if (x.innerText.includes('Continue the Battle')) {
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
        joinBtn.addEventListener('click', function(e) {
          if (e.ctrlKey || e.metaKey) {
            // Ctrl+Click or Cmd+Click - join battle first, then open new tab
            e.preventDefault();

            
            // Join the battle first
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
                // Battle joined successfully, now open new tab
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
            // Normal click - use instant join
          joinWaveInstant(monsterId, battleLink);
          }
        });

        const viewBtn = document.createElement('button');
        viewBtn.className = "join-btn";
        viewBtn.style.cssText = 'flex: 1; font-size: 12px; background: #6c7086;';
        viewBtn.innerText = "👁️ View";
        viewBtn.addEventListener('click', function(e) {
          if (e.ctrlKey || e.metaKey) {
            // Ctrl+Click or Cmd+Click - open in new tab
            window.open(battleLink.href, '_blank');
          } else {
            // Normal click - navigate in same tab
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
      if (card.innerText.includes('Continue the Battle')) {
        continueCards.push(card);
      } else if (card.innerText.includes('Loot')) {
        lootCards.push(card);
      } else {
        const hpText = card.querySelector('div[style*="width:"]')?.parentNode?.nextElementSibling?.textContent || '';
        const hpMatch = hpText.match(/❤️\s*([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
        if (hpMatch) {
          const currentHp = parseInt(hpMatch[1].replace(/,/g, ''));
          card.dataset.currentHp = currentHp;
        }
        joinCards.push(card);
      }
    });

    joinCards.sort((a, b) => {
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
    const hpText = Array.from(card.querySelectorAll('div')).find(div => 
      div.textContent.includes('❤️') && div.textContent.includes('HP')
    );
    
    if (hpBar && hpText && !hpBar.querySelector('.hp-numbers')) {
      // Extract current and max HP from text
      const hpMatch = hpText.textContent.match(/❤️\s*([\d,]+)\s*\/\s*([\d,]+)\s*HP/);
      if (hpMatch) {
        const currentHP = hpMatch[1];
        const maxHP = hpMatch[2];
        
        // Create HP numbers overlay
        const hpNumbers = document.createElement('div');
        hpNumbers.className = 'hp-numbers';
        hpNumbers.textContent = `${currentHP} / ${maxHP}`;
        
        // Make sure hp-bar is positioned relatively
        hpBar.style.position = 'relative';
        hpBar.appendChild(hpNumbers);
      }
    }
  }

  function addPlayerCountToJoinButton(card) {
    const joinButtons = card.querySelectorAll('.join-btn');
    const playerText = Array.from(card.querySelectorAll('div')).find(div => 
      div.textContent.includes('Players Joined') || div.textContent.includes('👥')
    );
    
    if (joinButtons.length > 0 && playerText) {
      // Extract player count from text
      const playerMatch = playerText.textContent.match(/👥\s*Players Joined\s*(\d+)\/(\d+)/);
      if (playerMatch) {
        const currentPlayers = playerMatch[1];
        const maxPlayers = playerMatch[2];
        
        // Update all join buttons
        joinButtons.forEach(button => {
          if (!button.dataset.enhanced) {
            const originalText = button.textContent.trim();
            if (originalText.includes('⚔️ Join')) {
              button.innerHTML = `⚔️ Join (${currentPlayers}/${maxPlayers})`;
            }
            
            // Mark as enhanced to avoid duplicate processing
            button.dataset.enhanced = 'true';
          }
        });
      }
    }
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
      
      .loot-preview-grid.hidden-with-images {
        display: none;
      }
      
      /* Hide loot preview when monster images are hidden */
      body.monster-images-hidden .loot-preview-grid {
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
      }
      
      .enhanced-monster-card .hp-bar {
        margin: 8px 0 !important;
      }
      
      .enhanced-monster-card .join-btn,
      .enhanced-monster-card [style*="display: flex"] {
        margin-top: 8px !important;
      }
      
      .loot-preview-item {
        position: relative;
        border-radius: 4px;
        overflow: hidden;
        background: rgba(30, 30, 46, 0.6);
        border: 1px solid rgba(69, 71, 90, 0.5);
        aspect-ratio: 1;
      }
      
      .loot-preview-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .loot-preview-item .tier-indicator {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: #666;
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
      
      .loot-preview-item .drop-rate {
        position: absolute;
        top: 2px;
        right: 2px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        font-size: 8px;
        padding: 1px 3px;
        border-radius: 2px;
        font-weight: bold;
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
    
    lootCards.forEach((card, index) => {
      if (lootData.length >= 8) return; // Limit to 8 items
      
      const img = card.querySelector('img');
      const name = card.querySelector('.loot-name');
      const stats = card.querySelectorAll('.loot-stats .chip, .chip');
      
      if (img && name) {
        let dropRate = '';
        let tier = 'common';
        
        stats.forEach(stat => {
          const text = stat.textContent.trim();
          if (text.includes('Drop:')) {
            dropRate = text.replace('Drop:', '').trim();
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
        });
        
        const itemData = {
          name: name.textContent.trim(),
          image: img.src,
          dropRate: dropRate,
          tier: tier
        };
        
        lootData.push(itemData);
      }
    });
    
    return lootData;
  }

  function displayLootPreview(monsterId, lootData) {
    const grid = document.getElementById(`loot-grid-${monsterId}`);
    if (!grid) return;
    
    if (lootData.length === 0) {
      grid.innerHTML = '<div class="loot-error">No loot data found</div>';
      return;
    }
    
    // Create loot items
    const lootHTML = lootData.map(item => `
      <div class="loot-preview-item" title="${item.name}">
        <img src="${item.image}" alt="${item.name}">
        <div class="tier-indicator ${item.tier}"></div>
        <div class="drop-rate">${item.dropRate}</div>
      </div>
    `).join('');
    
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
    initGateCollapse()
    initMonsterFilter()
    loadInstaLoot()
    initContinueBattleFirst()
    initImprovedWaveButtons()
    initMonsterSorting()
    initWaveAutoRefresh()
    initMonsterLootPreview()
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
    consolidateEventSections();
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

  function consolidateEventSections() {
    // Find all events-section panels
    const eventSections = document.querySelectorAll('.events-section.panel');
    
    if (eventSections.length === 0) {
      console.log('No event sections found');
      return;
    }
    
    // Create a new consolidated events section
    const consolidatedSection = document.createElement('section');
    consolidatedSection.className = 'events-section panel';
    consolidatedSection.setAttribute('aria-label', 'Live Events');
    consolidatedSection.style.cssText = 'background-color: transparent; border-width: 0px; box-shadow: none;';
    
    // Create the header
    const header = document.createElement('div');
    header.className = 'events-header';
    header.textContent = 'Live Events';
    consolidatedSection.appendChild(header);
    
    // Create the grid container
    const grid = document.createElement('div');
    grid.className = 'events-grid';
    consolidatedSection.appendChild(grid);
    
    // Collect all event cards from all sections
    eventSections.forEach((section, index) => {
      const eventCards = section.querySelectorAll('.event-card');
      
      // Move each event card to the consolidated grid
      eventCards.forEach(card => {
        grid.appendChild(card.cloneNode(true));
      });
      
      // Remove the original section if it's not the first one
      if (index > 0) {
        section.remove();
      }
    });
    
    // Replace the first section with our consolidated section
    if (eventSections.length > 0) {
      eventSections[0].replaceWith(consolidatedSection);
    }
    
    console.log(`Consolidated ${eventSections.length} event sections into one`);
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
    initReducedImageSize()
    initTotalOwnDamage()
    initAnyClickClosesModal()
    addBattleHideImagesToggle()
    initBattleLayoutSideBySide()
    
    // Apply initial monster backgrounds
    applyMonsterBackgrounds()
    applyLootPanelColors()
    
    // Initialize leaderboard highlighting
    setTimeout(() => {
      highlightCurrentUserInLeaderboard();
    }, 1000);
    
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

  function initChatMods(){
      const logEl = document.getElementById("chatLog");
      if (logEl) {
        logEl.scrollTop = logEl.scrollHeight;
      }
      createBackToDashboardButton();
      removeOriginalBackButton();
  }

  function initInventoryMods(){
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
    const slashBtn = document.querySelector('.attack-btn[data-skill-id="0"]');
    
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
