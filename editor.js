(function() {
    'use strict';
    
    let isEditMode = false;
    let editOverlay = null;
    let isAltPressed = false;
    let originalHTML = '';
    let selectedElement = null;
    let isElementLocked = false;
    let highlightDiv = null;
    let editorMode = 'prompt'; // 'prompt' or 'visual'
    let isStreaming = false;
    let streamedHTML = '';
    let visualModeActive = false;
    
    // Store API key
    function getApiKey() {
        return localStorage.getItem('openrouter_api_key') || '';
    }
    
    function setApiKey(key) {
        localStorage.setItem('openrouter_api_key', key);
    }

    // Add enhanced CSS styles (same as before, keeping it for completeness)
    function addEditorStyles() {
        if (document.getElementById('enhanced-inline-editor-styles')) return;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'enhanced-inline-editor-styles';
        styleSheet.textContent = `
            :root {
                --atlas-primary: #6366f1;
                --atlas-primary-light: #8b5cf6;
                --atlas-primary-dark: #4f46e5;
                --atlas-secondary: #1e293b;
                --atlas-success: #10b981;
                --atlas-danger: #ef4444;
                --atlas-warning: #f59e0b;
                --atlas-background: #ffffff;
                --atlas-text: #1e293b;
                --atlas-border: #e2e8f0;
                --atlas-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
                --atlas-radius: 12px;
                --atlas-transition: all 0.2s ease-in-out;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            .atlas-editor-highlight {
                position: absolute;
                background-color: rgba(99, 102, 241, 0.2);
                border: 2px solid var(--atlas-primary);
                pointer-events: none;
                z-index: 999999;
                border-radius: 6px;
                box-sizing: border-box;
                transition: var(--atlas-transition);
                box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
            }
            
            .atlas-editor-badge {
                position: absolute;
                top: -35px;
                left: -2px;
                background-color: var(--atlas-primary);
                color: white;
                padding: 6px 12px;
                font-size: 12px;
                font-weight: 600;
                border-radius: 6px;
                box-shadow: var(--atlas-shadow);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                white-space: nowrap;
                z-index: 1000000;
            }
            
            .atlas-editor-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                z-index: 1000000;
                display: none;
                backdrop-filter: blur(5px);
            }
            
            .atlas-editor-modal {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: var(--atlas-radius);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                overflow: hidden;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                display: flex;
                flex-direction: column;
                z-index: 1000001;
            }

            .atlas-editor-mode-selector {
                display: flex;
                background: #f8fafc;
                border-bottom: 1px solid var(--atlas-border);
            }

            .atlas-mode-btn {
                flex: 1;
                padding: 16px 24px;
                background: transparent;
                border: none;
                font-size: 14px;
                font-weight: 500;
                color: #64748b;
                cursor: pointer;
                transition: var(--atlas-transition);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                font-family: inherit;
            }

            .atlas-mode-btn:hover {
                background: #e2e8f0;
            }

            .atlas-mode-btn.active {
                background: var(--atlas-primary);
                color: white;
                font-weight: 600;
            }

            .atlas-editor-header {
                padding: 24px;
                border-bottom: 2px solid #f1f5f9;
                text-align: center;
            }
            
            .atlas-editor-title {
                margin: 0 0 8px 0;
                font-size: 24px;
                font-weight: 700;
                color: var(--atlas-text);
            }
            
            .atlas-editor-subtitle {
                margin: 0;
                color: #6b7280;
                font-size: 14px;
            }

            .atlas-editor-content {
                padding: 24px;
                overflow-y: auto;
                flex: 1;
            }

            .atlas-prompt-mode {
                display: none;
            }

            .atlas-prompt-mode.active {
                display: block;
            }

            .atlas-visual-mode {
                display: none;
            }

            .atlas-visual-mode.active {
                display: block;
            }

            .atlas-form-group {
                margin-bottom: 20px;
            }
            
            .atlas-form-label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: var(--atlas-secondary);
                font-size: 14px;
            }
            
            .atlas-form-input, .atlas-form-textarea, .atlas-form-select {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid var(--atlas-border);
                border-radius: 8px;
                font-size: 14px;
                transition: var(--atlas-transition);
                box-sizing: border-box;
                font-family: inherit;
                background: white;
            }
            
            .atlas-form-input:focus, .atlas-form-textarea:focus, .atlas-form-select:focus {
                outline: none;
                border-color: var(--atlas-primary);
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
            }
            
            .atlas-form-textarea {
                min-height: 120px;
                resize: vertical;
            }

            .atlas-color-picker {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .atlas-color-input {
                width: 50px;
                height: 40px;
                padding: 0;
                border: 2px solid var(--atlas-border);
                border-radius: 8px;
                cursor: pointer;
            }

            .atlas-tabs {
                display: flex;
                gap: 2px;
                background-color: #f8fafc;
                padding: 12px 24px 0 24px;
                border-bottom: 1px solid var(--atlas-border);
            }
            
            .atlas-tab {
                padding: 12px 20px;
                font-size: 14px;
                font-weight: 500;
                color: #64748b;
                background: #f1f5f9;
                border: none;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
                cursor: pointer;
                transition: var(--atlas-transition);
                font-family: inherit;
            }
            
            .atlas-tab:hover {
                background: #e2e8f0;
            }
            
            .atlas-tab.active {
                background: white;
                color: var(--atlas-primary);
                font-weight: 600;
                border-bottom: 2px solid var(--atlas-primary);
            }
            
            .atlas-tab-content {
                display: none;
                padding: 20px 0;
            }
            
            .atlas-tab-content.active {
                display: block;
            }

            .atlas-dropdown-section {
                border-bottom: 1px solid var(--atlas-border);
                margin-bottom: 16px;
                padding-bottom: 16px;
            }
            
            .atlas-dropdown-header {
                padding: 12px 0;
                display: flex;
                align-items: center;
                justify-content: space-between;
                cursor: pointer;
                font-weight: 600;
                color: var(--atlas-secondary);
            }

            .atlas-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 12px 24px;
                font-size: 14px;
                font-weight: 500;
                border-radius: 8px;
                border: none;
                cursor: pointer;
                transition: var(--atlas-transition);
                font-family: inherit;
                gap: 8px;
            }
            
            .atlas-btn-primary {
                background: linear-gradient(135deg, var(--atlas-primary), var(--atlas-primary-light));
                color: white;
            }
            
            .atlas-btn-primary:hover {
                transform: translateY(-1px);
                box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
            }
            
            .atlas-btn-secondary {
                background: #f3f4f6;
                color: var(--atlas-secondary);
            }
            
            .atlas-btn-secondary:hover {
                background: #e5e7eb;
            }
            
            .atlas-btn-success {
                background: var(--atlas-success);
                color: white;
            }
            
            .atlas-btn-danger {
                background: var(--atlas-danger);
                color: white;
            }

            .atlas-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none !important;
            }

            .atlas-footer {
                padding: 20px 24px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-top: 2px solid #f1f5f9;
                gap: 12px;
            }

            .atlas-notification {
                position: fixed;
                top: 24px;
                right: 24px;
                background: white;
                border-left: 4px solid var(--atlas-success);
                padding: 16px 20px;
                border-radius: 8px;
                box-shadow: var(--atlas-shadow);
                z-index: 1000002;
                max-width: 320px;
                transform: translateX(100%);
                opacity: 0;
                transition: var(--atlas-transition);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            }
            
            .atlas-notification.show {
                transform: translateX(0);
                opacity: 1;
            }
            
            .atlas-notification-title {
                font-weight: 600;
                margin: 0 0 4px 0;
                font-size: 14px;
                color: var(--atlas-secondary);
            }
            
            .atlas-notification-message {
                margin: 0;
                font-size: 13px;
                color: #64748b;
            }

            .atlas-loading {
                display: none;
                text-align: center;
                color: var(--atlas-primary);
                font-size: 14px;
                margin-top: 16px;
            }

            .atlas-spinner {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid var(--atlas-border);
                border-top: 2px solid var(--atlas-primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-right: 8px;
            }

            .atlas-streaming-indicator {
                display: none;
                background: linear-gradient(135deg, var(--atlas-primary), var(--atlas-primary-light));
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                margin-top: 16px;
                font-size: 14px;
                animation: pulse 2s infinite;
            }

            .atlas-streaming-indicator.show {
                display: block;
            }

            .atlas-progress-bar {
                width: 100%;
                height: 4px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 2px;
                margin-top: 8px;
                overflow: hidden;
            }

            .atlas-progress-fill {
                height: 100%;
                background: white;
                border-radius: 2px;
                transition: width 0.3s ease;
                width: 0%;
            }

            /* Visual Editor specific styles */
            .atlas-visual-controls {
                text-align: center;
                padding: 20px;
                background: #f8fafc;
                border-radius: 8px;
                margin-bottom: 20px;
            }

            .atlas-visual-hint {
                color: #64748b;
                font-size: 14px;
                margin-bottom: 16px;
            }

            .atlas-element-selector {
                background: white;
                border: 2px dashed var(--atlas-border);
                border-radius: 8px;
                padding: 40px 20px;
                text-align: center;
                cursor: pointer;
                transition: var(--atlas-transition);
            }

            .atlas-element-selector:hover {
                border-color: var(--atlas-primary);
                background: rgba(99, 102, 241, 0.05);
            }

            .atlas-element-selector.active {
                border-color: var(--atlas-primary);
                background: rgba(99, 102, 241, 0.1);
                border-style: solid;
            }

            .atlas-deployment-status {
                display: none;
                background: #f0f9ff;
                border: 2px solid #0ea5e9;
                border-radius: 8px;
                padding: 16px;
                margin-top: 16px;
                text-align: center;
            }

            .atlas-deployment-status.show {
                display: block;
            }

            .atlas-deployment-url {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: white;
                padding: 8px 12px;
                border-radius: 6px;
                margin-top: 8px;
                font-family: monospace;
                font-size: 12px;
                color: var(--atlas-primary);
                text-decoration: none;
                border: 1px solid var(--atlas-border);
            }

            .atlas-deployment-url:hover {
                background: #f8fafc;
            }

            .atlas-visual-stop-btn {
                background: var(--atlas-danger);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                margin-top: 12px;
            }

            .atlas-visual-stop-btn:hover {
                background: #dc2626;
            }
        `;
        document.head.appendChild(styleSheet);
    }

    // Create the main editing interface
    function createEditInterface() {
        addEditorStyles();

        // Create overlay
        editOverlay = document.createElement('div');
        editOverlay.className = 'atlas-editor-overlay';
        
        // Create main modal
        const modal = document.createElement('div');
        modal.className = 'atlas-editor-modal';
        modal.innerHTML = `
            <div class="atlas-editor-mode-selector">
                <button class="atlas-mode-btn active" data-mode="prompt">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
                    </svg>
                    AI Prompt Mode
                </button>
                <button class="atlas-mode-btn" data-mode="visual">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M6 13.5V10.5L2 7.5l4-3v-3l8 6-8 6z"/>
                    </svg>
                    Visual Editor
                </button>
            </div>

            <div class="atlas-editor-header">
                <h2 class="atlas-editor-title">✨ Website Editor</h2>
                <p class="atlas-editor-subtitle" id="editor-subtitle">Choose how you want to edit your website</p>
            </div>

            <div class="atlas-editor-content">
                <!-- Prompt Mode -->
                <div class="atlas-prompt-mode active" id="prompt-mode">
                    <div class="atlas-form-group">
                        <label class="atlas-form-label">Describe your changes</label>
                        <textarea class="atlas-form-textarea" id="edit-prompt-input" 
                                  placeholder="e.g., Change the header color to blue, add a contact form, make the layout mobile-friendly..."></textarea>
                    </div>
                    
                    <div class="atlas-form-group">
                        <label class="atlas-form-label">OpenRouter API Key</label>
                        <input type="password" class="atlas-form-input" id="api-key-input" 
                               placeholder="Get free API key at openrouter.ai/keys">
                        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                            Your API key is stored locally and never shared
                        </div>
                    </div>
                    
                    <div class="atlas-loading" id="loading-indicator">
                        <div class="atlas-spinner"></div>
                        Initializing AI generation...
                    </div>

                    <div class="atlas-streaming-indicator" id="streaming-indicator">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <span>🤖 AI is generating your website...</span>
                            <span id="stream-progress">0%</span>
                        </div>
                        <div class="atlas-progress-bar">
                            <div class="atlas-progress-fill" id="progress-fill"></div>
                        </div>
                        <div style="font-size: 12px; margin-top: 8px; opacity: 0.9;">
                            Changes are being applied live as they're generated
                        </div>
                    </div>

                    <div class="atlas-deployment-status" id="deployment-status">
                        <div style="font-weight: 600; margin-bottom: 8px;">
                            🚀 Website Deployed Successfully!
                        </div>
                        <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">
                            Your website has been deployed and is now live:
                        </div>
                        <a href="#" class="atlas-deployment-url" id="deployment-url" target="_blank">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
                                <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
                            </svg>
                            Click to open your website
                        </a>
                    </div>
                </div>

                <!-- Visual Mode -->
                <div class="atlas-visual-mode" id="visual-mode">
                    <div class="atlas-visual-controls">
                        <div class="atlas-visual-hint">
                            Click "Start Visual Editing" then close this modal to hover and click on any element to edit it
                        </div>
                        <div class="atlas-element-selector" id="element-selector">
                            <svg width="32" height="32" fill="currentColor" viewBox="0 0 16 16" style="margin-bottom: 8px; opacity: 0.5;">
                                <path d="M6 13.5V10.5L2 7.5l4-3v-3l8 6-8 6z"/>
                            </svg>
                            <div style="font-weight: 500; margin-bottom: 4px;">Start Visual Editing</div>
                            <div style="font-size: 12px; color: #6b7280;">Click here to begin selecting elements</div>
                        </div>
                    </div>

                    <div id="element-properties-panel" style="display: none;">
                        <!-- Element editing tabs will be inserted here -->
                    </div>
                </div>
            </div>

            <div class="atlas-footer">
                <button class="atlas-btn atlas-btn-secondary" id="cancel-edit-btn">Cancel</button>
                <div style="display: flex; gap: 12px;">
                    <button class="atlas-btn atlas-btn-primary" id="apply-changes-btn">
                        ✨ Apply Changes
                    </button>
                    <button class="atlas-btn atlas-btn-success" id="save-element-btn" style="display: none;">
                        💾 Save Element
                    </button>
                </div>
            </div>
        `;

        editOverlay.appendChild(modal);
        document.body.appendChild(editOverlay);

        // Create highlight div for visual mode
        createHighlightDiv();

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'atlas-notification';
        notification.innerHTML = `
            <h4 class="atlas-notification-title">Success</h4>
            <p class="atlas-notification-message">Changes applied successfully!</p>
        `;
        document.body.appendChild(notification);

        setupEventListeners();
    }

    // Create highlight div
    function createHighlightDiv() {
        // Remove existing highlight if any
        const existingHighlight = document.querySelector('.atlas-editor-highlight');
        if (existingHighlight) {
            existingHighlight.remove();
        }

        highlightDiv = document.createElement('div');
        highlightDiv.className = 'atlas-editor-highlight';
        highlightDiv.style.display = 'none';
        
        const badge = document.createElement('div');
        badge.className = 'atlas-editor-badge';
        badge.innerText = 'Click to select';
        highlightDiv.appendChild(badge);
        
        document.body.appendChild(highlightDiv);
    }

    // Set up all event listeners
    function setupEventListeners() {
        // Mode switching
        document.querySelectorAll('.atlas-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const mode = btn.dataset.mode;
                switchMode(mode);
            });
        });

        // Element selector for visual mode
        const elementSelector = document.getElementById('element-selector');
        if (elementSelector) {
            elementSelector.addEventListener('click', (e) => {
                e.preventDefault();
                startVisualEditing();
            });
        }

        // Button event listeners
        const cancelBtn = document.getElementById('cancel-edit-btn');
        const applyBtn = document.getElementById('apply-changes-btn');
        const saveBtn = document.getElementById('save-element-btn');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                hideEditInterface();
            });
        }

        if (applyBtn) {
            applyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                applyAIChanges();
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                saveElementChanges();
            });
        }

        // API key input sync
        const apiKeyInput = document.getElementById('api-key-input');
        if (apiKeyInput) {
            apiKeyInput.value = getApiKey();
            apiKeyInput.addEventListener('change', (e) => {
                setApiKey(e.target.value);
            });
        }

        // Close on overlay click
        editOverlay.addEventListener('click', (e) => {
            if (e.target === editOverlay && !isStreaming) {
                hideEditInterface();
            }
        });

        // Enter key for prompt submission
        const promptInput = document.getElementById('edit-prompt-input');
        if (promptInput) {
            promptInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.ctrlKey && !isStreaming) {
                    applyAIChanges();
                }
            });
        }
    }

    // Switch between prompt and visual modes
    function switchMode(mode) {
        console.log('Switching to mode:', mode);
        
        if (isStreaming) return; // Prevent mode switching during streaming
        
        // Update mode buttons
        document.querySelectorAll('.atlas-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Update content visibility
        const promptMode = document.getElementById('prompt-mode');
        const visualMode = document.getElementById('visual-mode');
        
        if (promptMode && visualMode) {
            promptMode.classList.toggle('active', mode === 'prompt');
            visualMode.classList.toggle('active', mode === 'visual');
        }

        // Update buttons
        const applyBtn = document.getElementById('apply-changes-btn');
        const saveBtn = document.getElementById('save-element-btn');
        
        if (applyBtn) {
            applyBtn.style.display = mode === 'prompt' ? 'block' : 'none';
        }
        if (saveBtn) {
            saveBtn.style.display = mode === 'visual' ? 'block' : 'none';
        }

        // Update subtitle
        const subtitle = document.getElementById('editor-subtitle');
        if (subtitle) {
            if (mode === 'prompt') {
                subtitle.textContent = 'Describe the changes you want to make to your website';
            } else {
                subtitle.textContent = 'Select and edit individual elements directly';
            }
        }

        editorMode = mode;

        // Exit visual mode if switching away from it
        if (mode !== 'visual' && visualModeActive) {
            stopVisualEditing();
        }
    }

    // Start visual editing mode
    function startVisualEditing() {
        console.log('Starting visual editing...');
        
        const selector = document.getElementById('element-selector');
        if (selector) {
            selector.classList.add('active');
            selector.innerHTML = `
                <svg width="32" height="32" fill="currentColor" viewBox="0 0 16 16" style="margin-bottom: 8px; color: var(--atlas-primary);">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                </svg>
                <div style="font-weight: 500; margin-bottom: 4px; color: var(--atlas-primary);">Visual Editing Active</div>
                <div style="font-size: 12px; color: #6b7280;">Close this modal and hover over elements to select them</div>
                <button class="atlas-visual-stop-btn" onclick="window.inlineEditor.stopVisual()">Stop Visual Editing</button>
            `;
        }

        // Enable visual selection
        visualModeActive = true;
        enableElementSelection();
        
        // Hide the modal so user can interact with page
        hideEditInterface();
        
        showNotification('Visual Editor Active', 'Hover over elements to select and edit them. Press Alt to return to editor.');
    }

    // Stop visual editing
    function stopVisualEditing() {
        console.log('Stopping visual editing...');
        visualModeActive = false;
        isElementLocked = false;
        selectedElement = null;
        
        // Hide highlight
        if (highlightDiv) {
            highlightDiv.style.display = 'none';
        }
        
        // Remove event listeners
        disableElementSelection();
        
        // Reset selector UI
        const selector = document.getElementById('element-selector');
        if (selector) {
            selector.classList.remove('active');
            selector.innerHTML = `
                <svg width="32" height="32" fill="currentColor" viewBox="0 0 16 16" style="margin-bottom: 8px; opacity: 0.5;">
                    <path d="M6 13.5V10.5L2 7.5l4-3v-3l8 6-8 6z"/>
                </svg>
                <div style="font-weight: 500; margin-bottom: 4px;">Start Visual Editing</div>
                <div style="font-size: 12px; color: #6b7280;">Click here to begin selecting elements</div>
            `;
        }

        showNotification('Visual Editor Stopped', 'Visual editing mode has been disabled');
    }

    // Enable element selection functionality
    function enableElementSelection() {
        console.log('Enabling element selection...');
        
        // Remove existing listeners first
        disableElementSelection();
        
        // Add event listeners with specific handler references
        document.addEventListener('mousemove', handleMouseMove, true);
        document.addEventListener('click', handleElementClick, true);
        document.addEventListener('keydown', handleVisualKeydown, true);
        
        // Create highlight div if it doesn't exist
        if (!highlightDiv) {
            createHighlightDiv();
        }
    }

    // Disable element selection
    function disableElementSelection() {
        document.removeEventListener('mousemove', handleMouseMove, true);
        document.removeEventListener('click', handleElementClick, true);
        document.removeEventListener('keydown', handleVisualKeydown, true);
    }

    // Handle keydown in visual mode
    function handleVisualKeydown(event) {
        if (event.key === 'Escape' && visualModeActive) {
            event.preventDefault();
            event.stopPropagation();
            stopVisualEditing();
        } else if (event.altKey && !isEditMode) {
            event.preventDefault();
            event.stopPropagation();
            showEditInterface();
        }
    }

    // Handle mouse move for element highlighting
    function handleMouseMove(event) {
        if (!visualModeActive || isElementLocked || isEditMode) {
            return;
        }
        
        // Don't highlight if mouse is over editor elements
        if (isEditorElement(event.target)) {
            if (highlightDiv) {
                highlightDiv.style.display = 'none';
            }
            return;
        }
        
        const elem = event.target;
        
        if (elem && !isEditorElement(elem) && elem !== document.body && elem !== document.documentElement) {
            if (highlightDiv) {
                highlightDiv.style.display = 'block';
                const rect = elem.getBoundingClientRect();
                
                highlightDiv.style.width = `${rect.width}px`;
                highlightDiv.style.height = `${rect.height}px`;
                highlightDiv.style.top = `${window.scrollY + rect.top}px`;
                highlightDiv.style.left = `${window.scrollX + rect.left}px`;
                
                // Update badge
                const badge = highlightDiv.querySelector('.atlas-editor-badge');
                if (badge) {
                    const tagName = elem.tagName.toLowerCase();
                    const className = elem.className && typeof elem.className === 'string' ? `.${elem.className.split(' ')[0]}` : '';
                    const id = elem.id ? `#${elem.id}` : '';
                    badge.innerText = `${tagName}${id}${className}`;
                }
            }
        } else {
            if (highlightDiv) {
                highlightDiv.style.display = 'none';
            }
        }
    }

    // Handle element click for selection
    function handleElementClick(event) {
        if (!visualModeActive || isEditMode) {
            return;
        }
        
        if (isEditorElement(event.target)) {
            return;
        }
        
        event.preventDefault();
        event.stopPropagation();
        
        const elem = event.target;
        
        if (elem && !isEditorElement(elem) && elem !== document.body && elem !== document.documentElement) {
            selectElement(elem);
        }
    }

    // Select an element for editing
    function selectElement(element) {
        console.log('Selecting element:', element);
        
        selectedElement = element;
        isElementLocked = true;
        
        // Hide the highlight
        if (highlightDiv) {
            highlightDiv.style.display = 'none';
        }
        
        // Show editor interface
        showEditInterface();
        
        // Switch to visual mode if not already
        if (editorMode !== 'visual') {
            switchMode('visual');
        }
        
        // Show element properties panel
        showElementPropertiesPanel();
        
        showNotification('Element Selected', `${element.tagName.toLowerCase()} element is now being edited`);
    }

    // Show the element properties panel
    function showElementPropertiesPanel() {
        if (!selectedElement) return;
        
        const panel = document.getElementById('element-properties-panel');
        if (!panel) return;
        
        panel.style.display = 'block';
        
        panel.innerHTML = `
            <div class="atlas-tabs">
                <button class="atlas-tab active" data-tab="content">Content</button>
                <button class="atlas-tab" data-tab="styles">Styles</button>
                <button class="atlas-tab" data-tab="attributes">Attributes</button>
            </div>
            
            <div class="atlas-tab-content active" data-tab="content">
                <div class="atlas-form-group">
                    <label class="atlas-form-label">Text Content</label>
                    <textarea class="atlas-form-textarea" id="element-text"></textarea>
                </div>
                <div class="atlas-form-group">
                    <label class="atlas-form-label">HTML Content</label>
                    <textarea class="atlas-form-textarea" id="element-html"></textarea>
                </div>
            </div>
            
            <div class="atlas-tab-content" data-tab="styles">
                <div class="atlas-dropdown-section">
                    <div class="atlas-dropdown-header">Typography</div>
                    <div class="atlas-form-group">
                        <label class="atlas-form-label">Color</label>
                        <div class="atlas-color-picker">
                            <input type="color" class="atlas-color-input" id="text-color">
                            <input type="text" class="atlas-form-input" id="text-color-hex" placeholder="#000000">
                        </div>
                    </div>
                    <div class="atlas-form-group">
                        <label class="atlas-form-label">Font Size</label>
                        <input type="text" class="atlas-form-input" id="font-size" placeholder="e.g., 16px, 1.2em">
                    </div>
                    <div class="atlas-form-group">
                        <label class="atlas-form-label">Font Weight</label>
                        <select class="atlas-form-select" id="font-weight">
                            <option value="">Default</option>
                            <option value="normal">Normal</option>
                            <option value="bold">Bold</option>
                            <option value="lighter">Lighter</option>
                            <option value="bolder">Bolder</option>
                        </select>
                    </div>
                </div>
                
                <div class="atlas-dropdown-section">
                    <div class="atlas-dropdown-header">Background & Layout</div>
                    <div class="atlas-form-group">
                        <label class="atlas-form-label">Background Color</label>
                        <div class="atlas-color-picker">
                            <input type="color" class="atlas-color-input" id="bg-color">
                            <input type="text" class="atlas-form-input" id="bg-color-hex" placeholder="#ffffff">
                        </div>
                    </div>
                    <div class="atlas-form-group">
                        <label class="atlas-form-label">Padding</label>
                        <input type="text" class="atlas-form-input" id="padding" placeholder="e.g., 10px, 10px 20px">
                    </div>
                    <div class="atlas-form-group">
                        <label class="atlas-form-label">Margin</label>
                        <input type="text" class="atlas-form-input" id="margin" placeholder="e.g., 10px, 10px 20px">
                    </div>
                </div>
            </div>
            
            <div class="atlas-tab-content" data-tab="attributes">
                <div class="atlas-form-group">
                    <label class="atlas-form-label">ID</label>
                    <input type="text" class="atlas-form-input" id="element-id">
                </div>
                <div class="atlas-form-group">
                    <label class="atlas-form-label">CSS Classes</label>
                    <input type="text" class="atlas-form-input" id="element-classes" placeholder="Separate with spaces">
                </div>
                <div class="atlas-form-group">
                    <label class="atlas-form-label">Custom Attributes (JSON)</label>
                    <textarea class="atlas-form-textarea" id="custom-attributes" placeholder='{"data-custom": "value", "title": "tooltip"}'></textarea>
                </div>
            </div>
        `;

        // Set up tab switching for element properties
        panel.querySelectorAll('.atlas-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                panel.querySelectorAll('.atlas-tab').forEach(t => t.classList.remove('active'));
                panel.querySelectorAll('.atlas-tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                panel.querySelector(`.atlas-tab-content[data-tab="${tabName}"]`).classList.add('active');
            });
        });

        // Color picker sync
        setupColorPickers(panel);

        // Populate form with current element data
        populateElementForm();
    }

    // Setup color pickers
    function setupColorPickers(panel) {
        const textColor = panel.querySelector('#text-color');
        const textColorHex = panel.querySelector('#text-color-hex');
        const bgColor = panel.querySelector('#bg-color');
        const bgColorHex = panel.querySelector('#bg-color-hex');

        if (textColor && textColorHex) {
            textColor.addEventListener('input', () => textColorHex.value = textColor.value);
            textColorHex.addEventListener('input', () => textColor.value = textColorHex.value);
        }
        
        if (bgColor && bgColorHex) {
            bgColor.addEventListener('input', () => bgColorHex.value = bgColor.value);
            bgColorHex.addEventListener('input', () => bgColor.value = bgColorHex.value);
        }
    }

    // Populate element form with current values
    function populateElementForm() {
        if (!selectedElement) return;

        // Content tab
        const elementText = document.getElementById('element-text');
        const elementHTML = document.getElementById('element-html');
        
        if (elementText) elementText.value = selectedElement.innerText || '';
        if (elementHTML) elementHTML.value = selectedElement.innerHTML || '';

        // Styles tab
        const computedStyles = getComputedStyle(selectedElement);
        
        const textColorHex = document.getElementById('text-color-hex');
        const textColor = document.getElementById('text-color');
        const fontSize = document.getElementById('font-size');
        const fontWeight = document.getElementById('font-weight');
        const bgColorHex = document.getElementById('bg-color-hex');
        const bgColor = document.getElementById('bg-color');
        const padding = document.getElementById('padding');
        const margin = document.getElementById('margin');

        if (textColorHex && textColor) {
            const color = rgbToHex(computedStyles.color);
            textColorHex.value = color;
            textColor.value = color;
        }
        
        if (fontSize) fontSize.value = selectedElement.style.fontSize || '';
        if (fontWeight) fontWeight.value = selectedElement.style.fontWeight || '';
        
        if (bgColorHex && bgColor) {
            const backgroundColor = rgbToHex(computedStyles.backgroundColor);
            bgColorHex.value = backgroundColor;
            bgColor.value = backgroundColor;
        }
        
        if (padding) padding.value = selectedElement.style.padding || '';
        if (margin) margin.value = selectedElement.style.margin || '';

        // Attributes tab
        const elementId = document.getElementById('element-id');
        const elementClasses = document.getElementById('element-classes');
        const customAttributes = document.getElementById('custom-attributes');
        
        if (elementId) elementId.value = selectedElement.id || '';
        if (elementClasses) elementClasses.value = selectedElement.className || '';
        
        // Custom attributes
        if (customAttributes) {
            const attrs = {};
            Array.from(selectedElement.attributes).forEach(attr => {
                if (!['id', 'class', 'style'].includes(attr.name)) {
                    attrs[attr.name] = attr.value;
                }
            });
            customAttributes.value = JSON.stringify(attrs, null, 2);
        }
    }

    // Save element changes
    function saveElementChanges() {
        if (!selectedElement) return;

        try {
            // Content changes
            const elementText = document.getElementById('element-text');
            const elementHTML = document.getElementById('element-html');
            
            if (elementText && elementText.value !== selectedElement.innerText) {
                selectedElement.innerText = elementText.value;
            } else if (elementHTML && elementHTML.value !== selectedElement.innerHTML) {
                selectedElement.innerHTML = elementHTML.value;
            }

            // Style changes
            const styles = {
                color: document.getElementById('text-color-hex')?.value,
                fontSize: document.getElementById('font-size')?.value,
                fontWeight: document.getElementById('font-weight')?.value,
                backgroundColor: document.getElementById('bg-color-hex')?.value,
                padding: document.getElementById('padding')?.value,
                margin: document.getElementById('margin')?.value,
            };

            Object.entries(styles).forEach(([property, value]) => {
                if (value && value.trim()) {
                    selectedElement.style[property] = value.trim();
                }
            });

            // Attribute changes
            const elementId = document.getElementById('element-id')?.value;
            const elementClasses = document.getElementById('element-classes')?.value;
            const customAttributes = document.getElementById('custom-attributes')?.value;
            
            if (elementId) {
                selectedElement.id = elementId;
            } else {
                selectedElement.removeAttribute('id');
            }
            
            if (elementClasses) {
                selectedElement.className = elementClasses;
            } else {
                selectedElement.removeAttribute('class');
            }

            // Custom attributes
            if (customAttributes && customAttributes.trim()) {
                try {
                    const attrs = JSON.parse(customAttributes);
                    Object.entries(attrs).forEach(([name, value]) => {
                        selectedElement.setAttribute(name, value);
                    });
                } catch (e) {
                    console.warn('Invalid JSON in custom attributes:', e);
                }
            }

            showNotification('Element Saved', 'Your changes have been applied to the element');
            
            // Continue visual editing
            isElementLocked = false;
            selectedElement = null;
            hideEditInterface();
            
        } catch (error) {
            console.error('Error saving element:', error);
            showNotification('Save Error', 'There was an error saving your changes', 'error');
        }
    }

    // Check if element is part of editor UI
    function isEditorElement(element) {
        if (!element) return false;
        
        return element.closest('.atlas-editor-overlay') ||
               element.closest('.atlas-editor-highlight') ||
               element.closest('.atlas-notification') ||
               element === highlightDiv ||
               (highlightDiv && highlightDiv.contains(element)) ||
               element.classList?.contains('atlas-editor-highlight') ||
               element.classList?.contains('atlas-editor-badge') ||
               element.classList?.contains('atlas-notification');
    }

    // Convert RGB to hex color
    function rgbToHex(rgb) {
        if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') {
            return '#000000';
        }
        
        if (rgb.startsWith('#')) return rgb;
        
        const rgbMatch = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }
        
        return '#000000';
    }

    // Show editor interface
    function showEditInterface() {
        if (!editOverlay) {
            createEditInterface();
        }
        
        isEditMode = true;
        editOverlay.style.display = 'block';
        originalHTML = document.documentElement.outerHTML;
        
        // Focus on appropriate input based on mode
        setTimeout(() => {
            if (editorMode === 'prompt') {
                document.getElementById('edit-prompt-input')?.focus();
            }
        }, 100);
    }

    // Hide editor interface
    function hideEditInterface() {
        if (editOverlay && !isStreaming) {
            editOverlay.style.display = 'none';
            isEditMode = false;
        }
    }

    // Apply AI-generated changes with streaming (keeping existing implementation)
    async function applyAIChanges() {
        const prompt = document.getElementById('edit-prompt-input').value.trim();
        const apiKey = document.getElementById('api-key-input').value.trim();
        
        if (!prompt) {
            showNotification('Missing Input', 'Please describe the changes you want to make', 'warning');
            return;
        }
        
        if (!apiKey) {
            showNotification('API Key Required', 'Please enter your OpenRouter API key', 'warning');
            return;
        }
        
        setApiKey(apiKey);
        
        isStreaming = true;
        try {
            const currentHTML = document.documentElement.outerHTML;
            
            const fullPrompt = `Here is the current HTML of a website:

${currentHTML}

Please make the following changes to this website: "${prompt}"

Requirements:
- Return the COMPLETE modified HTML including all existing content
- Make only the requested changes while preserving all other functionality
- Ensure the website remains responsive and functional
- Include all existing scripts, styles, and content
- If adding new features, integrate them seamlessly with the existing design
- Maintain the overall structure and layout unless specifically requested to change it
NEVER INCLUDE THE AI PROMPT EDITOR OR VISUAL EDITOR MODAL IN THE OUTPUT
Return ONLY the complete HTML code, no explanations or markdown formatting.`;
                                                removeOldEditorElements();
        

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'Enhanced Inline Website Editor'
                },
                body: JSON.stringify({
                    model: 'anthropic/claude-3.7-sonnet',
                    messages: [{ role: 'user', content: fullPrompt }],
                    stream: true
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
                                                createEditInterface();
                                                showEditInterface();
        const loadingIndicator = document.getElementById('loading-indicator');
        const streamingIndicator = document.getElementById('streaming-indicator');
        const applyBtn = document.getElementById('apply-changes-btn');
        const cancelBtn = document.getElementById('cancel-edit-btn');
        const deploymentStatus = document.getElementById('deployment-status');
        
        loadingIndicator.style.display = 'block';
        applyBtn.disabled = true;
        cancelBtn.disabled = true;
        deploymentStatus.classList.remove('show');
        applyBtn.innerHTML = '<div class="atlas-spinner"></div>Preparing...';

            loadingIndicator.style.display = 'none';
            streamingIndicator.classList.add('show');
            applyBtn.innerHTML = '<div class="atlas-spinner"></div>Streaming...';

            streamedHTML = '';
            let estimatedProgress = 0;
            const progressFill = document.getElementById('progress-fill');
            const progressText = document.getElementById('stream-progress');
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let isComplete = false;

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        
                        if (data === '[DONE]') {
                            isComplete = true;
                            break;
                        }
                        
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content || '';
                            
                            if (content) {
                                streamedHTML += content;
                                
                                estimatedProgress = Math.min(Math.floor((streamedHTML.length / 50000) * 100), 95);
                                progressFill.style.width = `${estimatedProgress}%`;
                                progressText.textContent = `${estimatedProgress}%`;
                                            document.body.innerText = streamedHTML;
                                                                                removeOldEditorElements();

                                if (streamedHTML.includes('<body>')) {
                                    try {
                                        const bodyMatch = streamedHTML.match(/<body[^>]*>([\s\S]*?)<\/body>/);
                                        if (true) {
                                            document.body.innerHTML = streamedHTML;
                                                       removeOldEditorElements();
                                     
                                        }
                                    } catch (parseError) {
                                        console.log('Partial HTML not ready yet, continuing stream...');
                                    }
                                }

                                                createEditInterface();
                                                showEditInterface();
                                                switchMode('prompt');
                                                
                                                isStreaming = true;
                                                document.getElementById('streaming-indicator').classList.add('show');
                                                document.getElementById('apply-changes-btn').innerHTML = '<div class="atlas-spinner"></div>Streaming...';
                                                document.getElementById('progress-fill').style.width = `${estimatedProgress}%`;
                                                document.getElementById('stream-progress').textContent = `${estimatedProgress}%`;

                            }
                        } catch (e) {
                            // Ignore JSON parse errors for incomplete chunks
                        }
                    }
                }
                
                if (isComplete) {
                    break;
                }
            }

            progressFill.style.width = '100%';
            progressText.textContent = '100%';

            streamedHTML = streamedHTML.trim();
            
            if (streamedHTML) {
                console.log('Generated HTML length:', streamedHTML.length);
                
                document.open();
                document.write(streamedHTML);
                document.close();
                
                setTimeout(() => {
                    deployToLivemodeU(streamedHTML, prompt);
                }, 1000);
                
                showNotification('Generation Complete', 'Your website has been updated successfully!');
            } else {
                throw new Error('No content received from API');
            }
            
        } catch (error) {
            console.error('Error applying changes:', error);
            showNotification('Error Occurred', `Failed to apply changes: ${error.message}`, 'error');
        } finally {
            isStreaming = false;
            streamingIndicator.classList.remove('show');
            loadingIndicator.style.display = 'none';
            applyBtn.disabled = false;
            cancelBtn.disabled = false;
            applyBtn.innerHTML = '✨ Apply Changes';
        }
    }

    // Deploy to livemodeU API
    async function deployToLivemodeU(html, description) {
        try {
            console.log('Deploying to livemodeU API...');
            
            const response = await fetch('https://cheatlayer.com/user/liveModeU', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    html: html.split("```html").join("").split("```").join("")
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }

            const result = await response.json();
            console.log('livemodeU API response:', result);
            
            if (result && result['out']) {
                const atlasUrl = "https://cheatlayer.com/atlas/" + result['out'];
                console.log('Atlas URL:', atlasUrl);
                window.location.href = atlasUrl;
                const deploymentStatus = document.getElementById('deployment-status');
                const deploymentUrl = document.getElementById('deployment-url');
                
                if (deploymentUrl && deploymentStatus) {
                    deploymentUrl.href = atlasUrl;
                    deploymentUrl.textContent = atlasUrl;
                    deploymentStatus.classList.add('show');
                }
                
                if (typeof saveProject === 'function') {
                    const timestamp = Date.now();
                    const projectData = {
                        html: html,
                        title: description || `Website ${timestamp}`,
                        timestamp: timestamp,
                        key: `atlas_${timestamp}`,
                        url: atlasUrl,
                        domain: 'cheatlayer.com',
                        favicon: `https://www.google.com/s2/favicons?domain=cheatlayer.com&sz=64`
                    };
                    
                    saveProject(projectData);
                }
                
                showNotification('Deployment Success', 'Your website has been deployed and is now live!');
                
            } else {
                throw new Error('Invalid response format from livemodeU API');
            }
            
        } catch (error) {
            console.error('Error deploying to livemodeU:', error);
            showNotification('Deployment Error', 'Website generated but deployment failed. You can still use the updated page.', 'warning');
        }
    }

    // Remove old editor elements when body is replaced
    function removeOldEditorElements() {
        const oldOverlay = document.querySelector('.atlas-editor-overlay');
        const oldHighlight = document.querySelector('.atlas-editor-highlight');
        const oldNotification = document.querySelector('.atlas-notification');
        
        if (oldOverlay) oldOverlay.remove();
        if (oldHighlight) oldHighlight.remove();
        if (oldNotification) oldNotification.remove();
    }

    // Show notification
    function showNotification(title, message, type = 'success') {
        const notification = document.querySelector('.atlas-notification');
        if (!notification) return;
        
        const notificationTitle = notification.querySelector('.atlas-notification-title');
        const notificationMessage = notification.querySelector('.atlas-notification-message');
        
        notificationTitle.textContent = title;
        notificationMessage.textContent = message;
        
        const colors = {
            success: 'var(--atlas-success)',
            warning: 'var(--atlas-warning)', 
            error: 'var(--atlas-danger)',
            info: 'var(--atlas-primary)'
        };
        
        notification.style.borderLeftColor = colors[type] || colors.success;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }

    // Keyboard event handlers
    function handleKeyDown(e) {
        if (e.altKey && !isAltPressed) {
            isAltPressed = true;
            if (!isEditMode) {
                showEditInterface();
            }
        }
    }
    
    function handleKeyUp(e) {
        if (!e.altKey && isAltPressed) {
            isAltPressed = false;
        }
    }
    
    // Initialize the inline editor
    function initializeInlineEditor() {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        console.log('🎨 Enhanced Inline Editor loaded! Press Alt to edit.');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeInlineEditor);
    } else {
        initializeInlineEditor();
    }
    
    // Expose global interface
    window.inlineEditor = {
        show: showEditInterface,
        hide: hideEditInterface,
        isActive: () => isEditMode,
        switchMode: switchMode,
        selectElement: selectElement,
        isStreaming: () => isStreaming,
        startVisual: startVisualEditing,
        stopVisual: stopVisualEditing
    };
    
})();
